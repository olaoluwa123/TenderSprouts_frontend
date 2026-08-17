import { useMemo, useState } from 'react'
import { attendanceApi, parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Loading, PageHeader, Select, Table, Td, Th } from '@/components/ui'

function monthRange(anchor = new Date()) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const pad = (n) => String(n).padStart(2, '0')
  const from = `${y}-${pad(m + 1)}-01`
  const last = new Date(y, m + 1, 0).getDate()
  const to = `${y}-${pad(m + 1)}-${pad(last)}`
  return { from, to, label: anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' }) }
}

function childLabel(child) {
  return `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.admissionNumber || `Child #${child.id}`
}

export function ParentAttendancePage() {
  const range = useMemo(() => monthRange(), [])
  const { data: me, loading: meLoading } = useAsync(() => parentsApi.me(), [])
  const children = me?.children ?? []
  const [studentId, setStudentId] = useState('')
  const effectiveId = studentId || (children[0]?.id ? String(children[0].id) : '')
  const selected = children.find((c) => String(c.id) === String(effectiveId))

  const { data: rows, loading, error } = useAsync(
    () => (effectiveId
      ? attendanceApi.byPupil(Number(effectiveId), range.from, range.to).catch(() => [])
      : Promise.resolve([])),
    [effectiveId, range.from, range.to],
  )

  const list = Array.isArray(rows) ? rows : []

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={
          children.length === 1 && selected
            ? `${childLabel(selected)} · ${range.label}`
            : `This month · ${range.label}`
        }
      />
      {meLoading ? <Loading /> : children.length === 0 ? (
        <p className="text-sm text-muted">No children linked to your account.</p>
      ) : (
        <>
          {children.length > 1 && (
            <div className="mb-4 max-w-xs">
              <Select value={effectiveId} onChange={(e) => setStudentId(e.target.value)}>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{childLabel(c)}</option>
                ))}
              </Select>
            </div>
          )}
          {error && <Alert>{error}</Alert>}
          {loading ? <Loading /> : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Class</Th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><Td colSpan={3} className="text-muted">No attendance recorded for this period.</Td></tr>
                ) : list.map((row) => (
                  <tr key={`${row.studentId}-${row.date}-${row.id || ''}`} className="border-t border-border">
                    <Td>{row.date}</Td>
                    <Td>
                      <Badge tone={row.status === 'PRESENT' ? 'success' : row.status === 'ABSENT' ? 'danger' : 'warning'}>
                        {row.status || '—'}
                      </Badge>
                    </Td>
                    <Td>{row.className || '—'}</Td>
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
