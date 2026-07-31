import { useState } from 'react'
import { teachersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses, useTeachers } from '@/hooks/useSchoolData'
import { ClassSelect, TeacherSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, Input, Modal, PageHeader } from '@/components/ui'

const emptyOnboardForm = { email: '', fullName: '', phone: '' }

export function TeachersPage() {
  const { data: teachers, reload: reloadTeachers } = useTeachers()
  const { data: classes } = useClasses()
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [onboardForm, setOnboardForm] = useState(emptyOnboardForm)
  const [onboardSubmitting, setOnboardSubmitting] = useState(false)
  const [onboardError, setOnboardError] = useState(null)
  const { data: assignments, reload, error: assignmentsError } = useAsync(
    () => teacherId ? teachersApi.classes(Number(teacherId)) : Promise.resolve([]),
    [teacherId],
  )

  const currentAssignment = assignments?.[0] ?? null
  const hasAssignment = Boolean(currentAssignment)
  const reassignToSameClass = hasAssignment && classId && Number(classId) === currentAssignment.classId

  const run = async (fn, successMessage = 'Saved successfully') => {
    setError(null)
    setMsg(null)
    if (!teacherId) {
      setError('Select a teacher first.')
      return
    }
    setSaving(true)
    try {
      await fn()
      setMsg(successMessage)
      setClassId('')
      reload()
    } catch (err) {
      setError(err?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleOnboard = async (e) => {
    e.preventDefault()
    setOnboardSubmitting(true)
    setOnboardError(null)
    try {
      await teachersApi.onboard({
        email: onboardForm.email,
        fullName: onboardForm.fullName,
        phone: onboardForm.phone || undefined,
      })
      setOnboardOpen(false)
      setOnboardForm(emptyOnboardForm)
      setMsg('Teacher onboarded — welcome email sent with login credentials')
      reloadTeachers()
    } catch (err) {
      setOnboardError(err?.message || 'Onboarding failed')
    } finally {
      setOnboardSubmitting(false)
    }
  }

  const assignOrReassign = async () => {
    const tid = Number(teacherId)
    const cid = Number(classId)
    if (!classId) {
      setError('Select a class.')
      return
    }
    if (reassignToSameClass) {
      setError('Teacher is already assigned to this class.')
      return
    }
    if (hasAssignment) {
      await teachersApi.reassignClass(tid, cid)
      return
    }
    await teachersApi.assignClass(tid, cid)
  }

  const removeFromClass = async () => {
    await teachersApi.unassignClass(Number(teacherId))
  }

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="Onboard teachers and assign each to one class"
        actions={<Button onClick={() => { setOnboardOpen(true); setOnboardError(null) }}>Onboard teacher</Button>}
      />
      <Field label="Teacher">
        <TeacherSelect value={teacherId} onChange={setTeacherId} teachers={teachers ?? []} className="max-w-md" />
      </Field>
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {assignmentsError && <div className="mt-4"><Alert>{assignmentsError}</Alert></div>}
      {msg && <div className="mt-4"><Alert tone="success">{msg}</Alert></div>}
      {teacherId && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5 max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold mb-3">Current class</h3>
              {currentAssignment ? (
                <p className="text-sm">
                  {currentAssignment.className ?? `Class #${currentAssignment.classId}`}
                </p>
              ) : (
                <p className="text-sm text-muted">Not assigned to a class yet.</p>
              )}
            </div>
            {hasAssignment && (
              <Button
                variant="danger"
                size="sm"
                disabled={saving}
                onClick={() => run(removeFromClass, 'Teacher removed from class')}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="mt-6 max-w-md rounded-xl border border-border bg-white p-5 space-y-3">
        <h3 className="font-semibold">{hasAssignment ? 'Reassign class' : 'Assign class'}</h3>
        <p className="text-sm text-muted">
          Each teacher can only be assigned to one class at a time.
        </p>
        <ClassSelect value={classId} onChange={setClassId} classes={classes ?? []} />
        <Button
          disabled={!teacherId || !classId || saving || reassignToSameClass}
          onClick={() => run(assignOrReassign, hasAssignment ? 'Teacher reassigned' : 'Class assigned')}
        >
          {saving
            ? 'Saving…'
            : hasAssignment
              ? 'Reassign to class'
              : 'Assign class'}
        </Button>
      </div>
      <Modal open={onboardOpen} onClose={() => setOnboardOpen(false)} title="Onboard teacher">
        <form onSubmit={handleOnboard} className="space-y-3">
          {onboardError && <Alert>{onboardError}</Alert>}
          <Field label="Email">
            <Input type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required />
          </Field>
          <Field label="Full name">
            <Input value={onboardForm.fullName} onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={onboardForm.phone} onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })} />
          </Field>
          <p className="text-xs text-muted">
            A portal account is created and an email is sent with login credentials. The teacher must change their password on first sign-in.
          </p>
          <Button type="submit" disabled={onboardSubmitting}>
            {onboardSubmitting ? 'Onboarding…' : 'Onboard & send email'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
