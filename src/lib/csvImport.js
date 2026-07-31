export const CSV_HEADERS = [
  'student_first_name',
  'student_last_name',
  'admission_number',
  'class',
  'gender',
  'date_of_birth',
  'parent_email',
  'parent_full_name',
  'parent_phone',
]

const REQUIRED_HEADERS = [
  'student_first_name',
  'student_last_name',
  'admission_number',
  'class',
  'parent_email',
  'parent_full_name',
]

export function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

export function parseStudentParentCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`)
    }
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? ''
    })
    const rowNumber = i + 1
    const studentName = `${row.student_first_name} ${row.student_last_name}`.trim()
    const previewStatus = previewRowStatus(row, rows)
    rows.push({
      rowNumber,
      studentName: studentName || '—',
      admissionNumber: row.admission_number || '—',
      className: row.class || '—',
      parentName: row.parent_full_name || '—',
      parentEmail: row.parent_email || '—',
      previewStatus,
      raw: row,
    })
  }
  return rows
}

function previewRowStatus(row, previousRows) {
  for (const required of REQUIRED_HEADERS) {
    if (!row[required]?.trim()) {
      return `Missing ${required}`
    }
  }
  const admission = row.admission_number.trim().toLowerCase()
  if (previousRows.some((r) => r.raw.admission_number.trim().toLowerCase() === admission)) {
    return 'Duplicate admission number in file'
  }
  const email = row.parent_email.trim().toLowerCase()
  if (previousRows.some((r) => r.raw.parent_email.trim().toLowerCase() === email)) {
    return 'Ready (link existing parent)'
  }
  return 'Ready'
}
