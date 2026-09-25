import { useEffect, useState } from 'react'
import { classesApi, parentsApi, studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useActiveSession, useActiveTerm, useAssignedClasses, useSubjects, useTerms } from '@/hooks/useSchoolData'
import { ClassSelect, TermSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, EmptyState, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'
import { usePermissions } from '@/hooks/usePermissions'

export function ExamTimetablePage() {
  const { canPublishExamTimetable, canManageExamTimetable, usesParentStudentView: studentView } = usePermissions()
  const { classes } = useAssignedClasses()
  const { data: subjects } = useSubjects()
  const { data: session } = useActiveSession()
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const { data: terms } = useTerms(studentView ? session?.id : undefined)
  const { data: parentMe } = useAsync(() => (studentView ? parentsApi.me() : Promise.resolve(null)), [studentView])
  const children = parentMe?.children ?? []
  const [classId, setClassId] = useState('')
  const [parentTermId, setParentTermId] = useState('')
  const termId = studentView ? parentTermId : (activeTerm?.id ? String(activeTerm.id) : '')
  const [studentId, setStudentId] = useState('')
  const { data: slots, loading, reload } = useAsync(async () => {
    if (studentView && studentId && termId) {
      return studentsApi.examTimetable(Number(studentId), Number(termId))
    }
    if (classId && termId) return classesApi.examTimetable(Number(classId), Number(termId))
    return []
  }, [classId, termId, studentId, studentView])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    subjectId: '', termId: '', examDate: '', startTime: '09:00', endTime: '11:00', room: '',
  })
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!studentView) return
    if (!studentId && children.length === 1) {
      setStudentId(String(children[0].id))
    }
  }, [studentView, children, studentId])

  useEffect(() => {
    if (!studentView) return
    if (!parentTermId && activeTerm?.id) {
      setParentTermId(String(activeTerm.id))
    }
  }, [studentView, activeTerm, parentTermId])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!classId) return
    await classesApi.createExamSlot(Number(classId), {
      subjectId: Number(form.subjectId),
      termId: Number(form.termId || termId),
      examDate: form.examDate,
      startTime: form.startTime + ':00',
      endTime: form.endTime + ':00',
      room: form.room,
    })
    setOpen(false)
    reload()
  }

  const publish = async () => {
    if (!classId || !termId) return
    const res = await classesApi.publishExamTimetable(Number(classId), Number(termId))
    setMsg(`Published ${res.slotsPublished} slots — ${res.parentsNotified} parents notified`)
    reload()
  }

  return (
    <div>
      <PageHeader
        title="Exam Timetable"
        actions={
          !studentView && classId && termId && canManageExamTimetable && (
            <>
              <Button variant="secondary" onClick={() => setOpen(true)}>Add slot</Button>
              {canPublishExamTimetable && <Button onClick={publish}>Publish</Button>}
            </>
          )
        }
      />
      {studentView && (
        <p className="mb-4 text-sm text-muted">
          Published exam schedules for your child&apos;s class. Draft slots are not shown until the school publishes them.
        </p>
      )}
      {!studentView && (
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <ClassSelect value={classId} onChange={setClassId} classes={classes} className="max-w-xs" />
          {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
        </div>
      )}
      {!studentView && !termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {studentView && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="max-w-xs">
            <option value="">Select child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </Select>
          <TermSelect value={parentTermId} onChange={setParentTermId} terms={terms ?? []} className="max-w-xs" />
        </div>
      )}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      {loading ? <Loading /> : (
        <>
          {studentView && studentId && termId && !(slots?.length) && (
            <EmptyState
              title="No published exams yet"
              description="When the class exam timetable is published, it will appear here."
            />
          )}
          {(!studentView || (slots?.length > 0)) && (
            <Table>
              <thead><tr><Th>Date</Th><Th>Subject</Th><Th>Time</Th><Th>Room</Th><Th>Status</Th></tr></thead>
              <tbody>
                {slots?.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <Td>{s.examDate}</Td><Td>{s.subjectName}</Td>
                    <Td>{s.startTime} – {s.endTime}</Td><Td>{s.room || '—'}</Td>
                    <Td>{s.publishedAt ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add exam slot">
        <form onSubmit={handleCreate} className="space-y-3">
          <Field label="Subject"><Select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
            <option value="">Select</option>{subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select></Field>
          <Field label="Exam date"><Input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} required /></Field>
          <Field label="Start"><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
          <Field label="End"><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
          <Field label="Room"><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
          <Button type="submit">Add</Button>
        </form>
      </Modal>
    </div>
  )
}
