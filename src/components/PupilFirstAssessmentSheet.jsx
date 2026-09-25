import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { assessmentSheetsApi } from '@/api'
import { buildSavePayload, defaultTypesForSheet, sheetFromApi } from '@/components/ScoreSheetGrid'
import { scoreTypeHeader, scoreTypeName } from '@/lib/reportCard'
import { useAsync } from '@/hooks/useAsync'
import { useActiveTerm, useAssignedClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import {
  Alert, Badge, Button, EmptyState, Field, Input, Loading, PageHeader, Select, Table, Td, Th,
} from '@/components/ui'

const WEEKS = Array.from({ length: 16 }, (_, i) => i + 1)

function TypeEditor({ types, onTypesChange }) {
  if (!types.length) return null
  const canRemove = types.length > 1
  return (
    <div className="flex flex-wrap items-center gap-2">
      {types.map((t) => (
        <div key={t.code} className="flex items-center gap-1.5">
          <Input
            className="h-8 w-[7.5rem] px-2 text-sm"
            value={scoreTypeName(t.name)}
            onChange={(e) => onTypesChange(types.map((item) => (
              item.code === t.code ? { ...item, name: e.target.value } : item
            )))}
            aria-label="Type name"
          />
          <Input
            className="h-8 w-14 px-1.5 text-center text-sm"
            type="number"
            min="1"
            step="0.5"
            value={t.maxScore}
            onChange={(e) => onTypesChange(types.map((item) => (
              item.code === t.code ? { ...item, maxScore: e.target.value } : item
            )))}
            aria-label={`${t.name} max`}
          />
          <button
            type="button"
            disabled={!canRemove}
            aria-label={`Remove ${t.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-blossom-700 hover:bg-blossom-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onTypesChange(types.filter((item) => item.code !== t.code))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

/**
 * GradesPage-style flow for assessment sheets (weekly / midterm).
 * type: 'WEEKLY_TEST' | 'MIDTERM'
 */
export function PupilFirstAssessmentSheet({
  type,
  title,
  subtitle,
  showWeek = false,
}) {
  const { classes: assignedClasses } = useAssignedClasses()
  const classes = useMemo(
    () => assignedClasses.filter((schoolClass) => schoolClass.classGroup === 'PRIMARY'),
    [assignedClasses],
  )
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const [classId, setClassId] = useState('')
  const [weekNumber, setWeekNumber] = useState('1')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [types, setTypes] = useState(() => defaultTypesForSheet(type))
  const [columns, setColumns] = useState([])
  const [pupils, setPupils] = useState([])
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [savingColumns, setSavingColumns] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedAt, setPublishedAt] = useState(null)
  const [msg, setMsg] = useState(null)
  const [formError, setFormError] = useState(null)

  const termId = activeTerm?.id ? String(activeTerm.id) : ''
  const canLoad = Boolean(classId && termId && (!showWeek || weekNumber))

  const { data, loading, error, reload } = useAsync(
    () => (canLoad
      ? assessmentSheetsApi.get({
        type,
        classId: Number(classId),
        termId: Number(termId),
        ...(showWeek ? { weekNumber: Number(weekNumber) } : {}),
      })
      : Promise.resolve(null)),
    [canLoad, classId, termId, weekNumber, type, showWeek],
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
  }, [classId, weekNumber])

  useEffect(() => {
    if (!data) {
      setTypes(defaultTypesForSheet(type))
      setColumns([])
      setPupils([])
      setScores({})
      setPublishedAt(null)
      return
    }
    const parsed = sheetFromApi(data, type)
    setTypes(parsed.types)
    setColumns(parsed.columns)
    setPupils(parsed.pupils)
    setScores(parsed.scores)
    setPublishedAt(data.publishedAt || null)
    setFormError(null)
  }, [data, type])

  const selectedPupil = pupils.find((p) => p.studentId === selectedStudentId) ?? null

  const applyParsed = (parsed) => {
    setTypes(parsed.types)
    setColumns(parsed.columns)
    setPupils(parsed.pupils)
    setScores(parsed.scores)
  }

  const saveSheet = async ({ columns: cols, scores: nextScores, types: nextTypes, successMessage }) => {
    const saved = await assessmentSheetsApi.save(buildSavePayload({
      type,
      classId,
      termId,
      weekNumber: showWeek ? weekNumber : undefined,
      types: nextTypes ?? types,
      columns: cols,
      pupils,
      scores: nextScores,
    }))
    applyParsed(sheetFromApi(saved, type))
    setPublishedAt(saved.publishedAt || null)
    setMsg(successMessage)
    reload()
    return saved
  }

  const handlePublish = async () => {
    if (!canLoad) return
    setPublishing(true)
    setMsg(null)
    setFormError(null)
    try {
      const published = await assessmentSheetsApi.publish({
        type,
        classId: Number(classId),
        termId: Number(termId),
        ...(showWeek ? { weekNumber: Number(weekNumber) } : {}),
      })
      applyParsed(sheetFromApi(published, type))
      setPublishedAt(published.publishedAt || null)
      setMsg('Published.')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const handleSaveColumns = async () => {
    if (!canLoad) return
    if (columns.some((c) => !c.name.trim())) {
      setFormError('Every subject needs a name')
      return
    }
    if (types.length === 0) {
      setFormError('At least one assessment type is required')
      return
    }
    if (types.some((t) => !t.name.trim())) {
      setFormError('Every assessment type needs a name')
      return
    }
    if (types.some((t) => !Number(t.maxScore) || Number(t.maxScore) <= 0)) {
      setFormError('Each assessment type max must be greater than zero')
      return
    }
    setSavingColumns(true)
    setMsg(null)
    setFormError(null)
    try {
      await saveSheet({
        columns,
        scores,
        types,
        successMessage: 'Sheet settings saved',
      })
    } catch (err) {
      setFormError(err?.message || 'Failed to update sheet')
    } finally {
      setSavingColumns(false)
    }
  }

  const handleScoreChange = (clientKey, typeCode, value) => {
    if (!selectedStudentId) return
    setScores((prev) => ({
      ...prev,
      [selectedStudentId]: {
        ...prev[selectedStudentId],
        [clientKey]: {
          ...(prev[selectedStudentId]?.[clientKey] ?? {}),
          [typeCode]: value,
        },
      },
    }))
    setMsg(null)
  }

  const handleSavePupil = async () => {
    if (!canLoad || !selectedStudentId) return
    if (columns.length === 0) {
      setFormError('Add at least one subject before saving scores')
      return
    }
    setSaving(true)
    setMsg(null)
    setFormError(null)
    try {
      await saveSheet({
        columns,
        scores,
        successMessage: 'Scores saved',
      })
    } catch (err) {
      setFormError(err?.message || 'Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  const backToList = () => {
    setSelectedStudentId(null)
    setMsg(null)
    setFormError(null)
  }

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
        <PageHeader title={title} subtitle={subtitle} actions={reportsLink} />
        <EmptyState
          title="Not available for this class"
          description="This report is only available to teachers assigned to a primary class."
        />
      </div>
    )
  }

  if (selectedPupil) {
    return (
      <div>
        <PageHeader
          title={selectedPupil.studentName}
          subtitle={showWeek
            ? `Week ${weekNumber} · enter subject scores`
            : 'Midterm · enter subject scores'}
          actions={(
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={backToList}>Back to students</Button>
              {reportsLink}
            </div>
          )}
        />
        <div className="mb-4 flex flex-wrap items-end gap-3">
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
          {publishedAt && <Badge tone="success">Published</Badge>}
          <Button onClick={handleSavePupil} disabled={saving || loading || columns.length === 0}>
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
        {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
        {formError && <Alert className="mb-4">{formError}</Alert>}
        {columns.length === 0 ? (
          <Alert tone="info">
            No subjects on this sheet yet. Go back and add subjects, then enter scores.
          </Alert>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Subject</Th>
                {types.map((t) => (
                  <Th key={t.code}>{scoreTypeHeader(t.name, t.maxScore)}</Th>
                ))}
                {type === 'MIDTERM' && (
                  <Th>
                    {scoreTypeHeader('Total', types.reduce((sum, t) => sum + (Number(t.maxScore) || 0), 0))}
                  </Th>
                )}
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => {
                const subjectScores = types
                  .map((t) => scores?.[selectedPupil.studentId]?.[col.clientKey]?.[t.code])
                  .filter((value) => value !== '' && value != null)
                  .map(Number)
                  .filter((value) => !Number.isNaN(value))
                const subjectTotal = subjectScores.length
                  ? subjectScores.reduce((sum, value) => sum + value, 0)
                  : null
                return (
                <tr key={col.clientKey} className="border-t border-border">
                  <Td>
                    <div className="font-medium text-ink">{col.name}</div>
                  </Td>
                  {types.map((t) => {
                    const max = Number(t.maxScore) || 100
                    const value = scores?.[selectedPupil.studentId]?.[col.clientKey]?.[t.code] ?? ''
                    return (
                      <Td key={t.code}>
                        <Input
                          type="number"
                          min="0"
                          max={max}
                          step="0.5"
                          className="max-w-[8rem]"
                          value={value}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v !== '' && Number(v) > max) return
                            handleScoreChange(col.clientKey, t.code, v)
                          }}
                        />
                      </Td>
                    )
                  })}
                  {type === 'MIDTERM' && (
                    <Td>
                      <div className="font-semibold tabular-nums text-ink">
                        {subjectTotal == null ? '—' : subjectTotal}
                      </div>
                    </Td>
                  )}
                </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={reportsLink} />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <ClassSelect value={classId} onChange={setClassId} classes={classes} className="max-w-xs" />
        {showWeek && (
          <div className="max-w-[8rem]">
            <Field label="Week">
              <Select value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)}>
                {WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
              </Select>
            </Field>
          </div>
        )}
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
        {publishedAt && <Badge tone="success">Published</Badge>}
      </div>

      {!termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {classes.length === 0 && (
        <Alert tone="info" className="mb-4">
          No class is assigned yet. Ask an admin to assign you to a class.
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
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <TypeEditor types={types} onTypesChange={setTypes} />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveColumns}
              disabled={savingColumns}
            >
              {savingColumns ? 'Saving…' : 'Save types'}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishing || !data?.sheetId}
            >
              {publishing ? 'Publishing…' : publishedAt ? 'Published' : 'Publish'}
            </Button>
          </div>

          {pupils.length === 0 ? (
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
                {pupils.map((p) => (
                  <tr key={p.studentId} className="border-t border-border">
                    <Td>{p.studentName}</Td>
                    <Td>{p.admissionNumber}</Td>
                    <Td>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedStudentId(p.studentId)
                          setMsg(null)
                          setFormError(null)
                        }}
                      >
                        Enter scores
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </div>
  )
}
