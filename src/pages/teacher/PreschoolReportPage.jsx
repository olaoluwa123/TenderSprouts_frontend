import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { preschoolReportsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useActiveTerm, useAssignedClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import {
  Alert, Badge, Button, EmptyState, Field, Loading, PageHeader, Table, Td, Th,
} from '@/components/ui'

const textareaClass =
  'w-full min-h-[5.5rem] rounded-xl border border-blossom-200 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function commentValue(comments, subjectId) {
  if (!comments) return ''
  return comments[subjectId] ?? comments[String(subjectId)] ?? ''
}

export function PreschoolReportPage() {
  const { classes: assignedClasses } = useAssignedClasses()
  const classes = useMemo(
    () => assignedClasses.filter((schoolClass) => schoolClass.classGroup === 'PRE_PRIMARY'),
    [assignedClasses],
  )
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const [classId, setClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [comments, setComments] = useState({})
  const [classTeacherComment, setClassTeacherComment] = useState('')
  const [headTeacherRemark, setHeadTeacherRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedAt, setPublishedAt] = useState(null)
  const [msg, setMsg] = useState(null)
  const [formError, setFormError] = useState(null)

  const termId = activeTerm?.id ? String(activeTerm.id) : ''
  const canLoad = Boolean(classId && termId)

  const { data, loading, error, reload } = useAsync(
    () => (canLoad
      ? preschoolReportsApi.get({ classId: Number(classId), termId: Number(termId) })
      : Promise.resolve(null)),
    [canLoad, classId, termId],
  )

  useEffect(() => {
    if (classId && !classes.some((schoolClass) => String(schoolClass.id) === String(classId))) {
      setClassId('')
    }
    if (classes.length === 1 && !classId) setClassId(String(classes[0].id))
  }, [classes, classId])

  useEffect(() => {
    setSelectedStudentId(null)
    setMsg(null)
    setFormError(null)
  }, [classId])

  useEffect(() => {
    setPublishedAt(data?.publishedAt || null)
  }, [data])

  const subjects = data?.subjects ?? []
  const pupils = data?.pupils ?? []
  const selectedPupil = pupils.find((p) => p.studentId === selectedStudentId) ?? null

  useEffect(() => {
    if (!selectedPupil) {
      setComments({})
      setClassTeacherComment('')
      setHeadTeacherRemark('')
      return
    }
    const next = {}
    for (const subject of subjects) {
      next[subject.subjectId] = commentValue(selectedPupil.comments, subject.subjectId)
    }
    setComments(next)
    setClassTeacherComment(selectedPupil.classTeacherComment || '')
    setHeadTeacherRemark(selectedPupil.headTeacherRemark || '')
  }, [selectedPupil?.studentId, data])

  const reportsLink = (
    <Link
      to="/teacher/reports"
      className="inline-flex items-center justify-center rounded-full border border-blossom-300 bg-white px-4 py-2 text-sm font-semibold text-blossom-700 hover:bg-blossom-50"
    >
      Back to Reports
    </Link>
  )

  if (classes.length === 0) {
    return (
      <div>
        <PageHeader title="Preschool report" subtitle="Preschool classes only" actions={reportsLink} />
        <EmptyState
          title="Not available for this class"
          description="Preschool reports are only available to teachers assigned to a preschool class."
        />
      </div>
    )
  }

  const handleSavePupil = async () => {
    if (!selectedPupil || !canLoad) return
    setSaving(true)
    setMsg(null)
    setFormError(null)
    try {
      const saved = await preschoolReportsApi.save({
        classId: Number(classId),
        termId: Number(termId),
        pupils: [{
          studentId: selectedPupil.studentId,
          comments: subjects.map((subject) => ({
            subjectId: subject.subjectId,
            comment: comments[subject.subjectId] || '',
          })),
          classTeacherComment,
          headTeacherRemark,
        }],
      })
      setPublishedAt(saved.publishedAt || null)
      setMsg('Saved.')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!canLoad || !data?.reportId) return
    setPublishing(true)
    setMsg(null)
    setFormError(null)
    try {
      const published = await preschoolReportsApi.publish({
        classId: Number(classId),
        termId: Number(termId),
      })
      setPublishedAt(published.publishedAt || null)
      setMsg('Published.')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  if (selectedPupil) {
    return (
      <div>
        <PageHeader
          title={selectedPupil.studentName}
          subtitle="Enter subject comments for this preschool report"
          actions={(
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedStudentId(null)
                  setMsg(null)
                  setFormError(null)
                }}
              >
                Back to students
              </Button>
              {reportsLink}
            </div>
          )}
        />
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
          {publishedAt && <Badge tone="success">Published</Badge>}
          <Button onClick={handleSavePupil} disabled={saving || loading || subjects.length === 0}>
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
        {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
        {formError && <Alert className="mb-4">{formError}</Alert>}
        {subjects.length === 0 ? (
          <Alert tone="info">
            No subjects are assigned to this class yet. Ask an admin to assign subjects, then enter comments.
          </Alert>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <Field key={subject.subjectId} label={subject.subjectName}>
                <textarea
                  className={textareaClass}
                  value={comments[subject.subjectId] ?? ''}
                  onChange={(e) => setComments((current) => ({
                    ...current,
                    [subject.subjectId]: e.target.value,
                  }))}
                />
              </Field>
            ))}
            <Field label="Class Teacher’s Comment">
              <textarea
                className={textareaClass}
                value={classTeacherComment}
                onChange={(e) => setClassTeacherComment(e.target.value)}
              />
            </Field>
            <Field label="Head Teacher’s Remark">
              <textarea
                className={textareaClass}
                value={headTeacherRemark}
                onChange={(e) => setHeadTeacherRemark(e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Preschool report"
        subtitle="Pick a pupil, then enter a comment for each class subject"
        actions={reportsLink}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <ClassSelect value={classId} onChange={setClassId} classes={classes} className="max-w-xs" />
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
        {publishedAt && <Badge tone="success">Published</Badge>}
        <Button
          size="sm"
          onClick={handlePublish}
          disabled={publishing || !data?.reportId}
        >
          {publishing ? 'Publishing…' : publishedAt ? 'Published' : 'Publish'}
        </Button>
      </div>

      {!termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {classes.length === 0 && (
        <Alert tone="info" className="mb-4">
          Preschool reports are only available for preschool classes.
        </Alert>
      )}
      {!classId && classes.length > 1 && (
        <Alert tone="info" className="mb-4">Select your class to see students.</Alert>
      )}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      {formError && <Alert className="mb-4">{formError}</Alert>}
      {error && <Alert className="mb-4">{error}</Alert>}

      {canLoad && loading && <Loading />}

      {canLoad && !loading && (
        pupils.length === 0 ? (
          <Alert tone="info">No students enrolled in this class.</Alert>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Admission #</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {pupils.map((pupil) => (
                <tr key={pupil.studentId} className="border-t border-border">
                  <Td>{pupil.studentName}</Td>
                  <Td>{pupil.admissionNumber}</Td>
                  <Td>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedStudentId(pupil.studentId)
                        setMsg(null)
                        setFormError(null)
                      }}
                    >
                      Enter comments
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      )}
    </div>
  )
}
