import { BAND_CLASS, toPerformanceBand } from '@/lib/performanceBand'

export { BAND_CLASS, toPerformanceBand }

export const REPORT_LOGO = '/report/tender_logo.png'
export const HEAD_TEACHER_SIGN = '/report/head_teacher_sign.png'

export function formatTermHeading(termName, sessionName) {
  const term = (termName ?? '').trim().toUpperCase()
  const session = (sessionName ?? '').trim()
  if (!term && !session) return ''
  if (!session) return term
  return `${term} ${session} SESSION`
}

export function formatScore(value) {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  const fixed = n.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}

export function scoreTypeName(name) {
  return String(name ?? '')
    .replace(/\s*\(\s*[\d.]+\s*\)\s*$/, '')
    .replace(/\/\s*[\d.]+\s*$/, '')
    .trim()
}

export function scoreTypeHeader(name, maxScore) {
  const label = scoreTypeName(name)
  const max = formatScore(maxScore)
  if (!label) return max ? `(${max})` : ''
  return max ? `${label} (${max})` : label
}

export function assessmentScore(breakdown, type) {
  const row = breakdown?.find((sg) => sg.assessmentType === type)
  if (!row || row.score == null) return ''
  return formatScore(row.score)
}

export function rowsFromSubjectGrades(subjectGrades) {
  const bySubject = new Map()
  for (const sg of subjectGrades ?? []) {
    if (!bySubject.has(sg.subjectId)) {
      bySubject.set(sg.subjectId, {
        subjectId: sg.subjectId,
        subjectName: sg.subjectName,
        breakdown: [],
        subjectTotal: null,
        performanceBand: null,
      })
    }
    bySubject.get(sg.subjectId).breakdown.push(sg)
  }
  return [...bySubject.values()]
}

export function reportRemarks(report) {
  if (report?.comments?.trim()) return report.comments.trim()
  return report?.attitudeComment ?? ''
}

export function sortedSummaries(report) {
  const summaries = report?.subjectSummaries?.length
    ? report.subjectSummaries
    : rowsFromSubjectGrades(report?.subjectGrades)
  return [...summaries].sort((a, b) =>
    String(a.subjectName ?? '').localeCompare(String(b.subjectName ?? ''), undefined, { sensitivity: 'base' }),
  )
}
