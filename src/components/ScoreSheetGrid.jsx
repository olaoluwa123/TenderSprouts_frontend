import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Alert, Button, Field, Input, Loading, Table, Td, Th } from '@/components/ui'

let tempKeySeq = 0
function nextClientKey() {
  tempKeySeq += 1
  return `tmp-${Date.now()}-${tempKeySeq}`
}

/**
 * Spreadsheet-style score sheet: pupils × custom-named columns.
 * columns: [{ id|null, clientKey, name, maxScore }]
 * scores: { [studentId]: { [clientKey]: string } }
 */
export function ScoreSheetGrid({
  columns,
  pupils,
  scores,
  loading,
  onColumnsChange,
  onScoreChange,
  emptyMessage = 'No pupils in this class yet.',
}) {
  const [newColName, setNewColName] = useState('')
  const [newColMax, setNewColMax] = useState('100')
  const [colError, setColError] = useState(null)

  const pupilList = pupils ?? []

  const addColumn = () => {
    const name = newColName.trim()
    const max = Number(newColMax)
    if (!name) {
      setColError('Enter a column name')
      return
    }
    if (!max || max <= 0) {
      setColError('Max score must be greater than zero')
      return
    }
    if (columns.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
      setColError('A column with that name already exists')
      return
    }
    setColError(null)
    onColumnsChange([
      ...columns,
      {
        id: null,
        clientKey: nextClientKey(),
        name,
        maxScore: max,
      },
    ])
    setNewColName('')
    setNewColMax('100')
  }

  const renameColumn = (clientKey, name) => {
    onColumnsChange(columns.map((c) => (c.clientKey === clientKey ? { ...c, name } : c)))
  }

  const setColumnMax = (clientKey, maxScore) => {
    onColumnsChange(columns.map((c) => (c.clientKey === clientKey ? { ...c, maxScore } : c)))
  }

  const removeColumn = (clientKey) => {
    onColumnsChange(columns.filter((c) => c.clientKey !== clientKey))
  }

  const headerHint = useMemo(
    () => (columns.length === 0 ? 'Add a column to start entering scores.' : null),
    [columns.length],
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-blossom-200/80 bg-white p-4">
        <div className="min-w-[10rem] flex-1">
          <Field label="New column name">
            <Input
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="e.g. Spelling"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addColumn()
                }
              }}
            />
          </Field>
        </div>
        <div className="w-28">
          <Field label="Max score">
            <Input
              type="number"
              min="1"
              step="0.5"
              value={newColMax}
              onChange={(e) => setNewColMax(e.target.value)}
            />
          </Field>
        </div>
        <Button type="button" variant="secondary" onClick={addColumn}>
          <Plus size={16} /> Add column
        </Button>
      </div>
      {colError && <Alert>{colError}</Alert>}
      {headerHint && <p className="text-sm text-muted">{headerHint}</p>}

      {pupilList.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th className="sticky left-0 z-10 bg-white min-w-[10rem]">Pupil</Th>
                {columns.map((col) => (
                  <Th key={col.clientKey} className="min-w-[9rem] align-top">
                    <div className="space-y-1">
                      <Input
                        value={col.name}
                        onChange={(e) => renameColumn(col.clientKey, e.target.value)}
                        className="font-semibold"
                        aria-label="Column name"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase text-muted">Max</span>
                        <Input
                          type="number"
                          min="1"
                          step="0.5"
                          className="max-w-[4.5rem] py-1 text-xs"
                          value={col.maxScore}
                          onChange={(e) => setColumnMax(col.clientKey, e.target.value)}
                        />
                        <button
                          type="button"
                          className="rounded-lg p-1 text-muted hover:bg-red-50 hover:text-red-600"
                          title="Remove column"
                          onClick={() => removeColumn(col.clientKey)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pupilList.map((pupil) => (
                <tr key={pupil.studentId} className="border-t border-border">
                  <Td className="sticky left-0 z-10 bg-white">
                    <div className="font-medium text-ink">{pupil.studentName}</div>
                    <div className="text-xs text-muted">{pupil.admissionNumber}</div>
                  </Td>
                  {columns.map((col) => {
                    const max = Number(col.maxScore) || 100
                    const value = scores?.[pupil.studentId]?.[col.clientKey] ?? ''
                    return (
                      <Td key={col.clientKey}>
                        <Input
                          type="number"
                          min="0"
                          max={max}
                          step="0.5"
                          className="max-w-[7rem]"
                          value={value}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v !== '' && Number(v) > max) return
                            onScoreChange(pupil.studentId, col.clientKey, v)
                          }}
                        />
                      </Td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  )
}

export function defaultTypesForSheet(type) {
  if (type === 'MIDTERM') {
    return [
      { code: 'CLASS_WORK', name: 'Class work', maxScore: '100', sortOrder: 0 },
      { code: 'HOMEWORK', name: 'Homework', maxScore: '100', sortOrder: 1 },
      { code: 'TEST', name: 'Test', maxScore: '100', sortOrder: 2 },
      { code: 'PROJECT', name: 'Project', maxScore: '100', sortOrder: 3 },
    ]
  }
  return [{ code: 'SCORE', name: 'Score', maxScore: '100', sortOrder: 0 }]
}

export function sheetFromApi(data, sheetType) {
  const types = (data?.types ?? []).length
    ? data.types.map((t, index) => ({
      code: t.code,
      name: String(t.name ?? '').replace(/\s*\(\s*[\d.]+\s*\)\s*$/, '').trim() || t.name,
      maxScore: t.maxScore != null ? String(t.maxScore) : '100',
      sortOrder: t.sortOrder ?? index,
    }))
    : defaultTypesForSheet(sheetType || data?.type)
  const columns = (data?.columns ?? []).map((c, index) => ({
    id: c.id ?? null,
    clientKey: c.id != null ? `col-${c.id}` : `seed-${c.sortOrder ?? index}`,
    name: c.name,
    maxScore: c.maxScore != null ? String(c.maxScore) : '100',
    sortOrder: c.sortOrder ?? index,
  }))
  const scores = {}
  for (const pupil of data?.pupils ?? []) {
    scores[pupil.studentId] = {}
    for (const col of columns) {
      const scoreKey = col.id != null ? String(col.id) : col.clientKey
      const cellGroup = pupil.scores?.[scoreKey] ?? {}
      scores[pupil.studentId][col.clientKey] = {}
      for (const type of types) {
        const cell = cellGroup?.[type.code]
        const raw = cell && typeof cell === 'object' && 'score' in cell ? cell.score : cell
        scores[pupil.studentId][col.clientKey][type.code] =
          raw != null && raw !== '' ? String(raw) : ''
      }
    }
  }
  return {
    sheetId: data?.sheetId ?? null,
    types,
    columns,
    pupils: (data?.pupils ?? []).map((p) => ({
      studentId: p.studentId,
      studentName: p.studentName,
      admissionNumber: p.admissionNumber,
    })),
    scores,
  }
}

export function buildSavePayload({ type, classId, termId, weekNumber, types, columns, pupils, scores }) {
  const scoreTypes = types?.length ? types : defaultTypesForSheet(type)
  return {
    type,
    classId: Number(classId),
    termId: Number(termId),
    weekNumber: weekNumber != null ? Number(weekNumber) : undefined,
    types: scoreTypes.map((t, index) => ({
      code: t.code,
      name: t.name,
      maxScore: Number(t.maxScore) || 100,
      sortOrder: t.sortOrder ?? index,
    })),
    columns: columns.map((c, index) => ({
      id: c.id ?? null,
      clientKey: c.clientKey,
      name: c.name.trim(),
      sortOrder: index,
      maxScore: Number(c.maxScore) || 100,
    })),
    rows: pupils.map((p) => ({
      studentId: p.studentId,
      scores: columns.flatMap((c) => scoreTypes.map((t) => {
        const raw = scores?.[p.studentId]?.[c.clientKey]?.[t.code]
        return {
          clientKey: c.clientKey,
          typeCode: t.code,
          score: raw === '' || raw == null ? null : Number(raw),
          remarks: null,
        }
      })),
    })),
  }
}
