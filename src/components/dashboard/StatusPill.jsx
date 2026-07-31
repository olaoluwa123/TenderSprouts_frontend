import { Badge } from '@/components/ui'

const STATUS_TONES = {
  DRAFT: 'default',
  NOT_STARTED: 'default',
  SUBMITTED: 'warning',
  PUBLISHED: 'success',
}

const STATUS_LABELS = {
  DRAFT: 'Draft',
  NOT_STARTED: 'Not started',
  SUBMITTED: 'Submitted',
  PUBLISHED: 'Published',
}

export function StatusPill({ status }) {
  const key = status || 'NOT_STARTED'
  return <Badge tone={STATUS_TONES[key] || 'default'}>{STATUS_LABELS[key] || key}</Badge>
}
