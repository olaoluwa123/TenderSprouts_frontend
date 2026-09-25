import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { behaviouralReportsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useActiveTerm, useAssignedClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import {
  Alert, Badge, Button, Loading, PageHeader, Select, Table, Td, Th,
} from '@/components/ui'

const RATINGS = [
  { value: '', label: '—' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'NEEDS_IMPROVEMENT', label: 'Needs improvement' },
]

const TRAITS = [
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'neatness', label: 'Neatness' },
  { key: 'cooperation', label: 'Cooperation' },
  { key: 'responsibility', label: 'Responsibility' },
  { key: 'conduct', label: 'Conduct' },
]

const WEEKS = Array.from({ length: 16 }, (_, i) => i + 1)

function emptyMarks(rows) {
  const next = {}
  for (const row of rows ?? []) {
    next[row.studentId] = {
      punctuality: row.punctuality || '',
      neatness: row.neatness || '',
      cooperation: row.cooperation || '',
      responsibility: row.responsibility || '',
      conduct: row.conduct || '',
      remarks: row.remarks || '',
    }
  }
  return next
}

export function BehaviouralReportPage() {
  const { classes } = useAssignedClasses()
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const [classId, setClassId] = useState('')
  const [periodType, setPeriodType] = useState('WEEKLY')
  const [weekNumber, setWeekNumber] = useState('1')
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [formError, setFormError] = useState(null)

  const termId = activeTerm?.id ? String(activeTerm.id) : ''
  const canLoad = classId && termId && (periodType === 'END_OF_TERM' || weekNumber)

  const { data: rows, loading, error, reload } = useAsync(
    () => (canLoad
      ? behaviouralReportsApi.list({
        classId: Number(classId),
        termId: Number(termId),
        periodType,
        weekNumber: periodType === 'WEEKLY' ? Number(weekNumber) : undefined,
      })
      : Promise.resolve([])),
    [canLoad, classId, termId, periodType, weekNumber],
  )

  useEffect(() => {
    if (classes.length === 1 && !classId) setClassId(String(classes[0].id))
  }, [classes, classId])

  useEffect(() => {
    setMarks(emptyMarks(rows))
    setMsg(null)
    setFormError(null)
  }, [rows])

  const updateMark = (studentId, field, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }))
  }

  const handleSave = async () => {
    if (!canLoad) return
    setSaving(true)
    setMsg(null)
    setFormError(null)
    try {
      const entries = (rows ?? []).map((row) => {
        const mark = marks[row.studentId] || {}
        return {
          studentId: row.studentId,
          punctuality: mark.punctuality || null,
          neatness: mark.neatness || null,
          cooperation: mark.cooperation || null,
          responsibility: mark.responsibility || null,
          conduct: mark.conduct || null,
          remarks: mark.remarks || null,
        }
      })
      await behaviouralReportsApi.save({
        classId: Number(classId),
        termId: Number(termId),
        periodType,
        weekNumber: periodType === 'WEEKLY' ? Number(weekNumber) : 0,
        entries,
      })
      setMsg('Behavioural report saved as a draft')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to save behavioural report')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!canLoad) return
    setPublishing(true)
    setMsg(null)
    setFormError(null)
    try {
      await behaviouralReportsApi.publish({
        classId: Number(classId),
        termId: Number(termId),
        periodType,
        weekNumber: periodType === 'WEEKLY' ? Number(weekNumber) : 0,
      })
      setMsg('Published.')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to publish behavioural report')
    } finally {
      setPublishing(false)
    }
  }

  const published = Boolean((rows ?? []).some((row) => row.publishedAt))
  const hasSavedRows = Boolean((rows ?? []).some((row) => row.id))

  const subtitle = useMemo(() => {
    if (periodType === 'END_OF_TERM') return 'End of term behavioural ratings for your class'
    return `Weekly behavioural ratings · Week ${weekNumber}`
  }, [periodType, weekNumber])

  return (
    <div>
      <PageHeader
        title="Behavioural report"
        subtitle={subtitle}
        actions={(
          <Link
            to="/teacher/reports"
            className="inline-flex items-center justify-center rounded-full border border-blossom-300 bg-white px-4 py-2 text-sm font-semibold text-blossom-700 hover:bg-blossom-50"
          >
            Back to Reports
          </Link>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ClassSelect value={classId} onChange={setClassId} classes={classes} className="max-w-xs" />
        <Select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="max-w-[14rem]">
          <option value="WEEKLY">Weekly</option>
          <option value="END_OF_TERM">End of term</option>
        </Select>
        {periodType === 'WEEKLY' && (
          <Select value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} className="max-w-[10rem]">
            {WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
          </Select>
        )}
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
        {published && <Badge tone="success">Published</Badge>}
        <Button onClick={handleSave} disabled={saving || !canLoad || loading}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          onClick={handlePublish}
          disabled={publishing || !canLoad || loading || !hasSavedRows}
        >
          {publishing ? 'Publishing…' : published ? 'Published' : 'Publish'}
        </Button>
      </div>

      {!termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      {formError && <Alert className="mb-4">{formError}</Alert>}
      {error && <Alert className="mb-4">{error}</Alert>}
      {loading ? <Loading /> : (
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Pupil</Th>
                {TRAITS.map((t) => <Th key={t.key}>{t.label}</Th>)}
                <Th>Remarks</Th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row) => {
                const mark = marks[row.studentId] || {}
                return (
                  <tr key={row.studentId} className="border-t border-border">
                    <Td>
                      <div className="font-medium text-ink">{row.studentName}</div>
                      <div className="text-xs text-muted">{row.admissionNumber}</div>
                    </Td>
                    {TRAITS.map((t) => (
                      <Td key={t.key}>
                        <Select
                          value={mark[t.key] || ''}
                          onChange={(e) => updateMark(row.studentId, t.key, e.target.value)}
                          className="min-w-[8.5rem]"
                        >
                          {RATINGS.map((r) => (
                            <option key={r.value || 'blank'} value={r.value}>{r.label}</option>
                          ))}
                        </Select>
                      </Td>
                    ))}
                    <Td>
                      <input
                        className="w-full min-w-[10rem] rounded-xl border border-blossom-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                        value={mark.remarks || ''}
                        onChange={(e) => updateMark(row.studentId, 'remarks', e.target.value)}
                        placeholder="Optional note"
                      />
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {canLoad && !(rows?.length) && (
            <p className="mt-4 text-sm text-muted">No pupils in this class yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
