
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
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Select class</option>
      {classes.map((c) => (
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
      {teachers.map((t) => (
        <option key={t.id} value={t.profileId ?? ''}>
          {t.email} {t.profileId ? `(#${t.profileId})` : ''}
        </option>
      ))}
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
