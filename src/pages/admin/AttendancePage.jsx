import { useMemo, useState } from 'react'
import { attendanceApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses, useStudents, useTeachers } from '@/hooks/useSchoolData'
import { ClassSelect, TeacherSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'class', label: 'Class' },
  { id: 'pupil', label: 'Pupil' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'absences', label: 'Absences' },
]

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function daysAgoIso(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function asList(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.content ?? data.items ?? data.records ?? []
}

function statusTone(status) {
  if (status === 'PRESENT') return 'success'
  if (status === 'ABSENT') return 'danger'
  if (status === 'LATE') return 'warning'
  return 'default'
}

function StatusSelect({ value, onChange }) {
  return (
    <Select value={value || 'PRESENT'} onChange={(e) => onChange(e.target.value)} className="min-w-[8rem]">
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </Select>
  )
}

function buildMarkMap(rows, idKey) {
  const next = {}
  for (const row of rows) {
    const id = row[idKey] ?? row.id
    next[id] = row.status || 'PRESENT'
  }
  return next
}

function ClassMarkSheet({ rows, onSave, saving }) {
  const [marks, setMarks] = useState(() => buildMarkMap(rows, 'studentId'))

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Pupil</Th>
            <Th>Admission #</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = row.studentId ?? row.id
            return (
              <tr key={id} className="border-t border-border">
                <Td className="font-medium">{row.studentName || row.fullName || `Pupil #${id}`}</Td>
                <Td>{row.admissionNumber || '—'}</Td>
                <Td>
                  <StatusSelect
                    value={marks[id]}
                    onChange={(status) => setMarks((prev) => ({ ...prev, [id]: status }))}
                  />
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <Button
        className="mt-3"
        onClick={() => onSave(Object.entries(marks).map(([sid, status]) => ({
          studentId: Number(sid),
          status,
        })))}
        disabled={saving || rows.length === 0}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </>
  )
}

function StaffMarkSheet({ rows, onSave, saving }) {
  const [marks, setMarks] = useState(() => buildMarkMap(rows, 'teacherId'))

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Teacher</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = row.teacherId ?? row.id
            return (
              <tr key={id} className="border-t border-border">
                <Td className="font-medium">{row.teacherName || row.fullName || row.email || `Teacher #${id}`}</Td>
                <Td>
                  <StatusSelect
                    value={marks[id]}
                    onChange={(status) => setMarks((prev) => ({ ...prev, [id]: status }))}
                  />
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <Button
        className="mt-3"
        onClick={() => onSave(Object.entries(marks).map(([tid, status]) => ({
          teacherId: Number(tid),
          status,
        })))}
        disabled={saving || rows.length === 0}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </>
  )
}

export function AttendancePage() {
  const [tab, setTab] = useState('daily')
  const [date, setDate] = useState(todayIso)
  const [from, setFrom] = useState(daysAgoIso(14))
  const [to, setTo] = useState(todayIso)
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const { data: classes } = useClasses()
  const { data: teachers } = useTeachers()
  const { data: students } = useStudents(classId || undefined)

  const dailyQuery = useAsync(
    () => (tab === 'daily' ? attendanceApi.daily(date) : Promise.resolve([])),
    [tab, date],
  )
  const classQuery = useAsync(
    () => (tab === 'class' && classId
      ? attendanceApi.byClass(Number(classId), date)
      : Promise.resolve([])),
    [tab, classId, date],
  )
  const pupilQuery = useAsync(
    () => (tab === 'pupil' && studentId
      ? attendanceApi.byPupil(Number(studentId), from, to)
      : Promise.resolve([])),
    [tab, studentId, from, to],
  )
  const staffQuery = useAsync(
    () => (tab === 'teachers'
      ? (teacherId
        ? attendanceApi.staffByTeacher(Number(teacherId), from, to)
        : attendanceApi.staff(date))
      : Promise.resolve([])),
    [tab, teacherId, date, from, to],
  )
  const absencesQuery = useAsync(
    () => (tab === 'absences'
      ? attendanceApi.absences({ from, to, classId: classId || undefined })
      : Promise.resolve([])),
    [tab, from, to, classId],
  )

  const classRows = asList(classQuery.data)
  const enrolledForMark = useMemo(() => {
    if (classRows.length > 0) return classRows
    return (students ?? []).map((s) => ({
      studentId: s.id,
      studentName: s.fullName,
      admissionNumber: s.admissionNumber,
      status: 'PRESENT',
    }))
  }, [classRows, students])

  const staffForMark = useMemo(() => {
    const staffRows = asList(staffQuery.data)
    if (staffRows.length > 0) {
      return staffRows.map((row) => ({
        teacherId: row.teacherId ?? row.id,
        teacherName: row.teacherName || row.fullName,
        email: row.email,
        status: row.status || 'PRESENT',
      }))
    }
    return (teachers ?? []).map((t) => ({
      teacherId: t.profileId ?? t.id,
      teacherName: t.fullName,
      email: t.email,
      status: 'PRESENT',
    }))
  }, [staffQuery.data, teachers])

  const saveClassMarks = async (marks) => {
    if (!classId) return
    setSaving(true)
    setMsg(null)
    try {
      await attendanceApi.markClass({ classId: Number(classId), date, marks })
      setMsg('Class attendance saved')
      classQuery.reload()
    } catch (err) {
      setMsg(err?.message || 'Could not save attendance')
    } finally {
      setSaving(false)
    }
  }

  const saveStaffMarks = async (marks) => {
    setSaving(true)
    setMsg(null)
    try {
      await attendanceApi.markStaff({ date, marks })
      setMsg('Staff attendance saved')
      staffQuery.reload()
    } catch (err) {
      setMsg(err?.message || 'Could not save staff attendance')
    } finally {
      setSaving(false)
    }
  }

  const activeError =
    tab === 'daily' ? dailyQuery.error
    : tab === 'class' ? classQuery.error
    : tab === 'pupil' ? pupilQuery.error
    : tab === 'teachers' ? staffQuery.error
    : absencesQuery.error

  const activeLoading =
    tab === 'daily' ? dailyQuery.loading
    : tab === 'class' ? classQuery.loading
    : tab === 'pupil' ? pupilQuery.loading
    : tab === 'teachers' ? staffQuery.loading
    : absencesQuery.loading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Mark and review pupil and teacher attendance"
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? 'primary' : 'secondary'}
            onClick={() => { setTab(t.id); setMsg(null) }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {msg && (
        <Alert tone={msg.toLowerCase().includes('could not') || msg.toLowerCase().includes('failed') ? 'error' : 'success'}>
          {msg}
        </Alert>
      )}
      {activeError && <Alert>{activeError}</Alert>}

      {tab === 'daily' && (
        <div className="space-y-4">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-xs" />
          </Field>
          {activeLoading ? <Loading /> : (
            <AttendanceTable
              rows={asList(dailyQuery.data)}
              columns={['studentName', 'className', 'status']}
              labels={['Pupil', 'Class', 'Status']}
            />
          )}
        </div>
      )}

      {tab === 'class' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Class">
              <ClassSelect value={classId} onChange={setClassId} classes={classes ?? []} />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          {!classId ? (
            <p className="text-sm text-muted">Select a class to mark attendance.</p>
          ) : activeLoading ? <Loading /> : (
            <ClassMarkSheet
              key={`${classId}-${date}-${enrolledForMark.map((r) => r.studentId ?? r.id).join(',')}`}
              rows={enrolledForMark}
              onSave={saveClassMarks}
              saving={saving}
            />
          )}
        </div>
      )}

      {tab === 'pupil' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Class (optional filter)">
              <ClassSelect value={classId} onChange={(v) => { setClassId(v); setStudentId('') }} classes={classes ?? []} />
            </Field>
            <Field label="Pupil">
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select pupil</option>
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || `Pupil #${s.id}`}
                    {s.admissionNumber ? ` (${s.admissionNumber})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          {!studentId ? (
            <p className="text-sm text-muted">Select a pupil to view attendance history.</p>
          ) : activeLoading ? <Loading /> : (
            <AttendanceTable
              rows={asList(pupilQuery.data)}
              columns={['date', 'className', 'status']}
              labels={['Date', 'Class', 'Status']}
            />
          )}
        </div>
      )}

      {tab === 'teachers' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Teacher (optional history)">
              <TeacherSelect
                value={teacherId}
                onChange={setTeacherId}
                teachers={teachers ?? []}
              />
            </Field>
            {teacherId ? (
              <>
                <Field label="From">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <Field label="To">
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </Field>
              </>
            ) : (
              <Field label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            )}
          </div>
          {activeLoading ? <Loading /> : teacherId ? (
            <AttendanceTable
              rows={asList(staffQuery.data)}
              columns={['date', 'teacherName', 'status']}
              labels={['Date', 'Teacher', 'Status']}
            />
          ) : (
            <StaffMarkSheet
              key={`${date}-${staffForMark.map((r) => r.teacherId).join(',')}`}
              rows={staffForMark}
              onSave={saveStaffMarks}
              saving={saving}
            />
          )}
        </div>
      )}

      {tab === 'absences' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Class (optional)">
              <ClassSelect value={classId} onChange={setClassId} classes={classes ?? []} />
            </Field>
          </div>
          {activeLoading ? <Loading /> : (
            <AttendanceTable
              rows={asList(absencesQuery.data)}
              columns={['date', 'studentName', 'className', 'status']}
              labels={['Date', 'Pupil', 'Class', 'Status']}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AttendanceTable({ rows, columns, labels }) {
  if (!rows.length) {
    return <p className="py-8 text-sm text-muted">No records found.</p>
  }
  return (
    <Table>
      <thead>
        <tr>
          {labels.map((label) => <Th key={label}>{label}</Th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id ?? `${row.studentId ?? row.teacherId}-${row.date}-${idx}`} className="border-t border-border">
            {columns.map((col) => (
              <Td key={col}>
                {col === 'status' ? (
                  <Badge tone={statusTone(row[col])}>{row[col] || '—'}</Badge>
                ) : (
                  row[col]
                  || (col === 'studentName' ? row.fullName : null)
                  || (col === 'teacherName' ? row.fullName : null)
                  || '—'
                )}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
