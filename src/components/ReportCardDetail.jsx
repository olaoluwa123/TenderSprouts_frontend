import {
  BAND_CLASS,
  HEAD_TEACHER_SIGN,
  REPORT_LOGO,
  assessmentScore,
  formatScore,
  formatTermHeading,
  reportRemarks,
  sortedSummaries,
  toPerformanceBand,
} from '@/lib/reportCard'

const cell = 'border border-black/80 px-1 py-0.5 align-middle font-semibold'
const head = `${cell} text-center font-extrabold`
const infoCell = `${cell} px-0.5 py-0.5 text-center font-bold`
const infoLabel = `${infoCell} font-extrabold whitespace-nowrap`

function CommentBlock({ title, body, children }) {
  return (
    <tr>
      <td className={`${cell} align-top`}>
        <p className="text-[9px] font-extrabold leading-tight">{title}</p>
        {children ?? (
          <p className="mt-0.5 min-h-[0.65rem] whitespace-pre-wrap text-[9px] font-semibold leading-snug">{body || '\u00a0'}</p>
        )}
      </td>
    </tr>
  )
}

export function ReportCardDetail({ report }) {
  if (!report) return null

  const summaries = sortedSummaries(report)
  let sn = 1

  const classLine = report.classTeacherName
    ? `${report.classTeacherName.toUpperCase()}   CLASS: ${report.className ?? ''}`
    : `CLASS: ${report.className ?? ''}`

  const termHeading = formatTermHeading(report.termName, report.sessionName)
  const overallBand = report.performanceBand ?? toPerformanceBand(report.averageScore)

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
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <img
              src={REPORT_LOGO}
              alt="Tender Sprouts"
              className="h-[56px] w-[72px] object-contain"
            />
            <p className="mt-1 text-[13px] font-extrabold leading-tight text-[#C62828]">TENDER SPROUTS SCHOOL</p>
            <p className="mt-0.5 text-[9px] font-bold leading-tight text-[#2E7D32]">
              END OF TERM PROGRESS REPORT
            </p>
            <p className="mt-0.5 text-[8px] font-bold leading-tight text-[#1565C0]">
              {termHeading}
            </p>
          </div>

          {/* Pupil details */}
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

          {/* Scores then comments */}
          <div className="mt-1 w-full space-y-0">
            <table className="w-full border-collapse text-[7px] leading-tight">
              <thead>
                <tr>
                  <th className={`${head} w-[7%]`}>S/N</th>
                  <th className={`${head} text-left`}>SUBJECTS</th>
                  <th className={`${head} w-[12%]`}>C.A 40</th>
                  <th className={`${head} w-[12%]`}>Exam 60</th>
                  <th className={`${head} w-[12%]`}>Total 100</th>
                  <th className={`${head} w-[20%]`}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => {
                  const band = summary.performanceBand ?? toPerformanceBand(summary.subjectTotal)
                  return (
                    <tr key={summary.subjectId}>
                      <td className={`${cell} text-center`}>{sn++}</td>
                      <td className={cell}>{summary.subjectName}</td>
                      <td className={`${cell} text-center`}>{assessmentScore(summary.breakdown, 'CA')}</td>
                      <td className={`${cell} text-center`}>{assessmentScore(summary.breakdown, 'EXAM')}</td>
                      <td className={`${cell} text-center`}>{formatScore(summary.subjectTotal)}</td>
                      <td className={`${cell} text-center font-bold ${band ? BAND_CLASS[band] ?? '' : ''}`}>
                        {band ?? ''}
                      </td>
                    </tr>
                  )
                })}
                <tr className="font-bold">
                  <td className={`${cell} text-center`}>{'\u00a0'}</td>
                  <td className={cell}>Total</td>
                  <td className={`${cell} text-center`}>{'\u00a0'}</td>
                  <td className={`${cell} text-center`}>{'\u00a0'}</td>
                  <td className={`${cell} text-center`}>{formatScore(report.totalScore)}</td>
                  <td className={cell}>{'\u00a0'}</td>
                </tr>
                <tr className="font-bold">
                  <td className={`${cell} text-center`}>{'\u00a0'}</td>
                  <td className={cell}>Average%</td>
                  <td className={`${cell} text-center`}>{'\u00a0'}</td>
                  <td className={`${cell} text-center`}>{'\u00a0'}</td>
                  <td className={`${cell} text-center`}>{formatScore(report.averageScore)}</td>
                  <td className={`${cell} text-center ${overallBand ? BAND_CLASS[overallBand] ?? '' : ''}`}>
                    {overallBand ?? ''}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="mt-0 w-full border-collapse text-[7px]">
              <tbody>
                <CommentBlock title="Manipulative skill:" body="" />
                <CommentBlock title="CONDUCT:" body="" />
                <CommentBlock title="ATTITUDE TO WORK:" body={report.attitudeComment} />
                <CommentBlock title="AREA(S) TO IMPROVE ON:" body={report.areasToImprove} />
                <CommentBlock title="REMARKS" body={reportRemarks(report)} />
                <CommentBlock title="Class Educator’s Comment/Sign:" body={report.comments} />
                <CommentBlock title="Head Teacher's Sign/Date:">
                  <div className="mt-0.5 flex min-h-[28px] items-end">
                    <img
                      src={HEAD_TEACHER_SIGN}
                      alt="Head teacher signature"
                      className="h-8 max-w-[140px] object-contain object-left"
                    />
                  </div>
                </CommentBlock>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  )
}
