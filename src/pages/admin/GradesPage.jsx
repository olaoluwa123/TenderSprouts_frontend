import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gradesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useActiveSession, useActiveTerm, useAssignedClasses, useStudents } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import {
  Alert, Badge, Button, EmptyState, Input, Loading, PageHeader, Table, Td, Th,
} from '@/components/ui'

function toLetter(total) {
  if (total == null || Number.isNaN(total)) return '—'
  const score = Math.round(total)
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 45) return 'D'
  if (score >= 40) return 'E'
  return 'F'
}

function computeSubjectTotal(cells) {
  if (!cells?.length) return null
  let sum = 0
  let hasScore = false
  for (const cell of cells) {
    if (cell.score != null && cell.score !== '') {
      sum += Number(cell.score)
      hasScore = true
    }
  }
  return hasScore ? sum : null
}

export function GradesPage() {
  const location = useLocation()
  const { isTeacher } = useAuth()
  const termResultsPath = location.pathname.startsWith('/admin') ? '/admin/term-results' : '/teacher/term-results'
  const { classes } = useAssignedClasses()
  const { data: session } = useActiveSession()
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const [classId, setClassId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const termId = activeTerm?.id ? String(activeTerm.id) : ''
  const { data: students, loading: studentsLoading, error: studentsError } = useStudents(
    classId ? Number(classId) : undefined,
    session?.id,
  )

  const { data: sheet, loading: sheetLoading, error: sheetError, reload: reloadSheet } = useAsync(
    () => selectedStudent && termId
      ? gradesApi.gradingSheet(selectedStudent.id, Number(termId))
      : Promise.resolve(null),
    [selectedStudent?.id, termId],
  )

  const [grid, setGrid] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)

  const assessmentTypes = sheet?.assessmentTypes ?? []
  const subjects = sheet?.subjects ?? []

  const gridKey = (subjectId, typeCode) => `${subjectId}:${typeCode}`

  const initGridFromSheet = (data) => {
    const next = {}
    for (const row of data.subjects ?? []) {
      for (const cell of row.grades ?? []) {
        next[gridKey(row.subjectId, cell.assessmentType)] = cell.score ?? ''
      }
    }
    setGrid(next)
  }

  useEffect(() => {
    if (classes.length === 1 && !classId) {
      setClassId(String(classes[0].id))
    }
  }, [classes, classId])

  useEffect(() => {
    if (sheet) initGridFromSheet(sheet)
  }, [sheet])

  const handleScoreChange = (subjectId, typeCode, value, maxScore) => {
    if (value !== '' && Number(value) > Number(maxScore)) return
    setGrid((prev) => ({ ...prev, [gridKey(subjectId, typeCode)]: value }))
    setSaveMessage(null)
  }

  const buildEntries = () => {
    const entries = []
    for (const row of subjects) {
      for (const type of assessmentTypes) {
        const raw = grid[gridKey(row.subjectId, type.code)]
        if (raw === '' || raw == null) continue
        entries.push({
          subjectId: row.subjectId,
          assessmentType: type.code,
          score: Number(raw),
        })
      }
    }
    return entries
  }

  const handleSave = async () => {
    if (!selectedStudent || !termId || !sheet) return
    setSaving(true)
    setError(null)
    setSaveMessage(null)
    try {
      const entries = buildEntries()
      if (entries.length === 0) {
        setError('Enter at least one score before saving')
        return
      }
      const updated = await gradesApi.saveStudentGrades(selectedStudent.id, {
        termId: Number(termId),
        classId: sheet.classId,
        entries,
      })
      initGridFromSheet(updated)
      setSaveMessage('Grades saved. When all students are graded, go to Term Results to submit to admin.')
    } catch (err) {
      setError(err?.message || 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const backToList = () => {
    setSelectedStudent(null)
    setGrid({})
    setError(null)
    setSaveMessage(null)
  }

  if (selectedStudent) {
    const studentName = `${selectedStudent.firstName ?? ''} ${selectedStudent.lastName ?? ''}`.trim()
      || selectedStudent.admissionNumber

    return (
      <div>
        <PageHeader
          title={studentName}
          subtitle={sheet ? `${sheet.className} · grade entry` : 'Grade entry'}
          actions={(
            <Button variant="secondary" onClick={backToList}>Back to students</Button>
          )}
        />
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
          <Button onClick={handleSave} disabled={saving || !termId || sheetLoading || !sheet}>
            {saving ? 'Saving…' : 'Save grades'}
          </Button>
          {sheetError && (
            <Button variant="secondary" size="sm" onClick={reloadSheet}>Retry</Button>
          )}
        </div>
        {sheet?.warnings?.map((w) => (
          <div key={w} className="mb-4"><Alert tone="warning">{w}</Alert></div>
        ))}
        {error && <div className="mb-4"><Alert>{error}</Alert></div>}
        {sheetError && (
          <div className="mb-4">
            <Alert>
              Could not load grading grid: {sheetError}. Restart the backend if you recently updated the app.
            </Alert>
          </div>
        )}
        {saveMessage && <div className="mb-4"><Alert tone="success">{saveMessage}</Alert></div>}
        {!termId && (
          <Alert tone="info">
            {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
          </Alert>
        )}
        {termId && sheetLoading && <Loading />}
        {termId && !sheetLoading && !sheetError && sheet && subjects.length === 0 && (
          <EmptyState
            title="No subjects for this class"
            description="Ask an admin to assign subjects to the class under Classes & Subjects."
          />
        )}
        {termId && !sheetLoading && !sheetError && sheet && subjects.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted">
              Enter scores for each subject. Saving stores drafts only — parents cannot see them yet.
              When all students are graded, go to{' '}
              <Link to={termResultsPath} className="text-primary underline">Term Results</Link>
              {' '}to compute averages and submit to admin for approval.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    {assessmentTypes.map((t) => (
                      <Th key={t.code}>{t.name} /{t.defaultMaxScore}</Th>
                    ))}
                    <Th>Total /100</Th>
                    <Th>Grade</Th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((row) => {
                    const cells = assessmentTypes.map((t) => ({
                      assessmentType: t.code,
                      score: grid[gridKey(row.subjectId, t.code)],
                      maxScore: t.defaultMaxScore,
                    }))
                    const total = computeSubjectTotal(cells)
                    return (
                      <tr key={row.subjectId} className="border-t border-border">
                        <Td>{row.subjectName}</Td>
                        {assessmentTypes.map((t) => (
                          <Td key={t.code}>
                            <Input
                              type="number"
                              min="0"
                              max={t.defaultMaxScore}
                              step="0.01"
                              className="w-24"
                              value={grid[gridKey(row.subjectId, t.code)] ?? ''}
                              onChange={(e) => handleScoreChange(
                                row.subjectId,
                                t.code,
                                e.target.value,
                                t.defaultMaxScore,
                              )}
                            />
                          </Td>
                        ))}
                        <Td className="font-medium">{total != null ? total : '—'}</Td>
                        <Td>
                          <Badge tone={total != null && total >= 50 ? 'success' : 'default'}>
                            {toLetter(total)}
                          </Badge>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Grades"
        subtitle={isTeacher
          ? 'Pick a student, then enter scores across all subjects for the term'
          : 'Select a class and student to enter term grades'}
      />
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <ClassSelect value={classId} onChange={setClassId} classes={classes} className="max-w-xs" />
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
      </div>
      {!termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {classes.length === 0 && (
        <Alert tone="info">
          No class is assigned yet. {isTeacher ? 'Ask an admin to assign you to a class.' : 'Create a class first.'}
        </Alert>
      )}
      {!classId && classes.length > 0 && <Alert tone="info">Select your class to see students.</Alert>}
      {studentsError && <div className="mb-4"><Alert>{studentsError}</Alert></div>}
      {classId && studentsLoading && <Loading />}
      {classId && !studentsLoading && (students ?? []).length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Admission #</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td>{s.firstName} {s.lastName}</Td>
                <Td>{s.admissionNumber}</Td>
                <Td>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(s)
                      setError(null)
                      setSaveMessage(null)
                    }}
                  >
                    Enter grades
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {classId && !studentsLoading && (students ?? []).length === 0 && (
        <Alert tone="info">No students enrolled in this class.</Alert>
      )}
    </div>
  )
}
