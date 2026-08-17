
import { useEffect } from 'react'
import { Select } from './index'

export function SessionSelect({
  value,
  onChange,
  sessions,
  className,
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select session</option>
      {sessions.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </Select>
  )
}

export function TermSelect({
  value,
  onChange,
  terms,
  className,
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select term</option>
      {terms.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </Select>
  )
}

export function ClassSelect({
  value,
  onChange,
  classes,
  className,
  alwaysShow = false,
}) {
  const list = classes ?? []
  const onlyId = list.length === 1 ? String(list[0].id) : null

  useEffect(() => {
    if (!onlyId) return
    if (String(value || '') !== onlyId) onChange(onlyId)
  }, [onlyId, value, onChange])

  if (!alwaysShow && list.length <= 1) {
    if (list.length === 0) return null
    return (
      <p className={className ? `${className} text-sm font-medium text-ink` : 'text-sm font-medium text-ink'}>
        {list[0].name || `Class #${list[0].id}`}
      </p>
    )
  }

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select class</option>
      {list.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </Select>
  )
}

export function TeacherSelect({
  value,
  onChange,
  teachers,
  className,
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select teacher</option>
      {teachers.map((t) => {
        const teacherId = t.profileId ?? t.id
        const label = t.fullName || t.email || `Teacher #${teacherId}`
        return (
          <option key={teacherId} value={teacherId ?? ''}>
            {label}{t.email && t.fullName ? ` (${t.email})` : ''}
          </option>
        )
      })}
    </Select>
  )
}

export function UserSelect({
  value,
  onChange,
  users,
  className,
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select user</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
      ))}
    </Select>
  )
}
