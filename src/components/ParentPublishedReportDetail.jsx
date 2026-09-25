import { formatScore, formatTermHeading, HEAD_TEACHER_SIGN, REPORT_LOGO, scoreTypeHeader } from '@/lib/reportCard'

function typeAveragePercent(subjects, typeCode, maxScore) {
  const max = Number(maxScore)
  if (!max || Number.isNaN(max) || max <= 0) return null
  const percents = (subjects ?? [])
    .map((subject) => subject.scores?.[typeCode])
    .filter((value) => value != null && value !== '')
    .map(Number)
    .filter((value) => !Number.isNaN(value))
    .map((score) => (score / max) * 100)
  if (!percents.length) return null
  return percents.reduce((sum, value) => sum + value, 0) / percents.length
}

function subjectTotal(subject, types) {
  let total = 0
  let any = false
  for (const type of types ?? []) {
    const raw = subject?.scores?.[type.code]
    if (raw == null || raw === '') continue
    const score = Number(raw)
    if (Number.isNaN(score)) continue
    total += score
    any = true
  }
  return any ? total : null
}

function typesMaxTotal(types) {
  return (types ?? []).reduce((sum, type) => sum + (Number(type.maxScore) || 0), 0)
}

const cell = 'border border-black/80 px-1.5 py-1 align-middle font-semibold'
const head = `${cell} text-center font-extrabold`
const infoCell = 'border border-black/80 px-0.5 py-0.5 align-middle text-center font-bold'
const infoLabel = `${infoCell} font-extrabold whitespace-nowrap`

function SheetFrame({ title, report, children }) {
  const classLine = report.classTeacherName
    ? `${report.classTeacherName.toUpperCase()}   CLASS: ${report.className ?? ''}`
    : `CLASS: ${report.className ?? ''}`

  return (
    <div className="report-card-mount w-full">
      <article
        className="report-card-sheet mx-auto box-border bg-white text-black"
        style={{
          width: '100%',
          maxWidth: '165mm',
          marginTop: '3px',
          marginBottom: '3px',
          border: '2px solid #EC9AB0',
          outline: '2px solid #EC9AB0',
          outlineOffset: '2px',
        }}
      >
        <div className="flex flex-col p-2 sm:p-2.5">
          <div className="flex flex-col items-center text-center">
            <img src={REPORT_LOGO} alt="Tender Sprouts" className="h-[56px] w-[72px] object-contain" />
            <p className="mt-1 text-[13px] font-extrabold leading-tight text-[#C62828]">TENDER SPROUTS SCHOOL</p>
            <p className="mt-0.5 text-[9px] font-bold leading-tight text-[#2E7D32]">{title}</p>
            <p className="mt-0.5 text-[8px] font-bold leading-tight text-[#1565C0]">
              {formatTermHeading(report.termName, report.sessionName)}
            </p>
          </div>
          <div className="mt-1 w-full space-y-0">
            <table className="w-full border-collapse text-[7px] leading-tight">
              <tbody>
                <tr>
                  <td className={`${infoLabel} w-[9%]`}>NAME:</td>
                  <td className={`${infoCell} w-[22%]`}>{report.studentName}</td>
                  <td className={`${infoLabel} w-[6%]`}>Age:</td>
                  <td className={`${infoCell} w-[7%]`}>{report.ageYears != null ? `${report.ageYears}yrs` : ''}</td>
                  <td className={`${infoLabel} w-[6%]`}>Sex:</td>
                  <td className={`${infoCell} w-[8%]`}>{report.gender ?? ''}</td>
                  <td className={`${infoLabel} w-[10%]`}>Height:</td>
                  <td className={`${infoCell} w-[8%]`}>{report.height ?? ''}</td>
                  <td className={`${infoLabel} w-[12%]`}>Weight:</td>
                  <td className={`${infoCell} w-[12%]`}>{report.weight ?? ''}</td>
                </tr>
              </tbody>
            </table>
            <table className="mt-0 w-full border-collapse text-[7px] leading-tight">
              <tbody>
                <tr>
                  <td className={`${infoCell} w-[58%]`}>{classLine}</td>
                  <td className={infoCell}>
                    <span className="font-bold">Admission Number: </span>
                    {report.admissionNumber ?? ''}
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="mt-0 w-full border-collapse text-[7px] leading-tight">
              <tbody>
                <tr>
                  <td className={infoCell}>
                    <span className="font-bold">No. of times school opened: </span>
                    {report.daysSchoolOpened ?? ''}
                  </td>
                  <td className={infoCell}>
                    <span className="font-bold">No. of times present: </span>
                    {report.daysPresent ?? ''}
                  </td>
                  <td className={infoCell}>
                    <span className="font-bold">Date: </span>
                    {report.reportDate ?? ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-1">{children}</div>
        </div>
      </article>
    </div>
  )
}

export function ParentAssessmentReportDetail({ report }) {
  if (!report) return null
  const types = report.types ?? []
  const midterm = report.type === 'MIDTERM'
  const maxTotal = typesMaxTotal(types)
  const title = midterm
    ? 'MIDTERM PROGRESS REPORT'
    : report.weekNumber
      ? `WEEKLY TEST RESULT — WEEK ${report.weekNumber}`
      : 'WEEKLY TEST RESULT'

  return (
    <SheetFrame title={title} report={report}>
      <table className="w-full border-collapse text-[8px] leading-tight">
        <thead>
          <tr>
            <th className={`${head} w-[8%]`}>S/N</th>
            <th className={`${head} text-left`}>SUBJECT</th>
            {types.map((t) => (
              <th key={t.code} className={head}>
                {scoreTypeHeader(t.name, t.maxScore)}
              </th>
            ))}
            {midterm && <th className={head}>{scoreTypeHeader('Total', maxTotal || null)}</th>}
          </tr>
        </thead>
        <tbody>
          {(report.subjects ?? []).map((subject, index) => (
            <tr key={`${subject.name}-${index}`}>
              <td className={`${cell} text-center`}>{index + 1}</td>
              <td className={cell}>{subject.name}</td>
              {types.map((t) => (
                <td key={t.code} className={`${cell} text-center`}>
                  {formatScore(subject.scores?.[t.code]) || '—'}
                </td>
              ))}
              {midterm && (
                <td className={`${cell} text-center`}>
                  {formatScore(subjectTotal(subject, types)) || '—'}
                </td>
              )}
            </tr>
          ))}
          {(report.type === 'WEEKLY_TEST' || midterm) && report.averageScore != null && (
            <tr className="font-bold">
              <td className={`${cell} text-center`}>{'\u00a0'}</td>
              <td className={cell}>Average%</td>
              {midterm ? (
                <>
                  {types.map((t) => <td key={t.code} className={cell}>{'\u00a0'}</td>)}
                  <td className={`${cell} text-center`}>{formatScore(report.averageScore)}%</td>
                </>
              ) : types.map((t) => {
                const percent = typeAveragePercent(report.subjects, t.code, t.maxScore)
                return (
                  <td key={t.code} className={`${cell} text-center`}>
                    {percent == null ? '' : `${formatScore(percent)}%`}
                  </td>
                )
              })}
            </tr>
          )}
        </tbody>
      </table>
    </SheetFrame>
  )
}

const TRAITS = [
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'neatness', label: 'Neatness' },
  { key: 'cooperation', label: 'Cooperation' },
  { key: 'responsibility', label: 'Responsibility' },
  { key: 'conduct', label: 'Conduct' },
]

export function ParentBehaviouralReportDetail({ report }) {
  if (!report) return null
  const title = report.periodType === 'END_OF_TERM'
    ? 'END OF TERM BEHAVIOURAL REPORT'
    : report.weekNumber
      ? `WEEKLY BEHAVIOURAL REPORT — WEEK ${report.weekNumber}`
      : 'WEEKLY BEHAVIOURAL REPORT'

  return (
    <SheetFrame title={title} report={report}>
      <table className="w-full border-collapse text-[8px] leading-tight">
        <thead>
          <tr>
            <th className={`${head} text-left`}>TRAIT</th>
            <th className={head}>RATING</th>
          </tr>
        </thead>
        <tbody>
          {TRAITS.map((trait) => (
            <tr key={trait.key}>
              <td className={cell}>{trait.label}</td>
              <td className={`${cell} text-center`}>{report[trait.key] || '—'}</td>
            </tr>
          ))}
          <tr>
            <td className={cell}>Remarks</td>
            <td className={cell}>{report.remarks || '—'}</td>
          </tr>
        </tbody>
      </table>
    </SheetFrame>
  )
}

export function ParentPreschoolReportDetail({ report }) {
  if (!report) return null

  return (
    <SheetFrame title="PRESCHOOL REPORT" report={report}>
      <table className="w-full border-collapse text-[8px] leading-tight">
        <thead>
          <tr>
            <th className={`${head} w-[28%] text-left`}>SUBJECT</th>
            <th className={`${head} text-left`}>COMMENT</th>
          </tr>
        </thead>
        <tbody>
          {(report.subjects ?? []).map((subject, index) => (
            <tr key={`${subject.name}-${index}`}>
              <td className={`${cell} align-top`}>{subject.name}</td>
              <td className={`${cell} whitespace-pre-wrap align-top`}>{subject.comment || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="mt-0 w-full border-collapse text-[8px] leading-tight">
        <tbody>
          <tr>
            <td className={`${cell} align-top`}>
              <p className="font-extrabold">Class Teacher&apos;s Comment:</p>
              <p className="mt-0.5 min-h-[0.8rem] whitespace-pre-wrap">{report.classTeacherComment || '\u00a0'}</p>
            </td>
          </tr>
          <tr>
            <td className={`${cell} align-top`}>
              <p className="font-extrabold">Head Teacher&apos;s Remark:</p>
              <p className="mt-0.5 min-h-[0.8rem] whitespace-pre-wrap">{report.headTeacherRemark || '\u00a0'}</p>
            </td>
          </tr>
          <tr>
            <td className={`${cell} align-top`}>
              <p className="font-extrabold">Date/Sign: {report.reportDate ?? ''}</p>
              <div className="mt-0.5 flex min-h-[28px] items-end">
                <img
                  src={HEAD_TEACHER_SIGN}
                  alt="Head teacher signature"
                  className="h-8 max-w-[140px] object-contain object-left"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </SheetFrame>
  )
}
