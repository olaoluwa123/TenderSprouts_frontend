import { Link } from 'react-router-dom'
import {
  Baby,
  ClipboardList,
  FileText,
  HeartHandshake,
  NotebookPen,
} from 'lucide-react'
import { useAssignedClasses } from '@/hooks/useSchoolData'
import { PageHeader } from '@/components/ui'

const PRIMARY_REPORTS = new Set([
  '/teacher/reports/end-of-term-grades',
  '/teacher/reports/weekly-tests',
  '/teacher/reports/midterm',
])

const REPORTS = [
  {
    to: '/teacher/reports/end-of-term-grades',
    title: 'End of term grades',
    description: 'Enter subject scores for each pupil for the current term.',
    icon: ClipboardList,
    ready: true,
  },
  {
    to: '/teacher/reports/behavioural',
    title: 'Weekly and end of term behavioural report',
    description: 'Record weekly and end-of-term behaviour notes for your class.',
    icon: HeartHandshake,
    ready: true,
  },
  {
    to: '/teacher/reports/weekly-tests',
    title: 'Weekly test result',
    description: 'Pick a pupil, then enter weekly subject scores.',
    icon: NotebookPen,
    ready: true,
  },
  {
    to: '/teacher/reports/preschool',
    title: 'Preschool report',
    description: 'Enter a comment for each class subject, then publish for parents.',
    icon: Baby,
    ready: true,
  },
  {
    to: '/teacher/reports/midterm',
    title: 'Midterm report',
    description: 'Pick a pupil, then enter midterm subject scores.',
    icon: FileText,
    ready: true,
  },
]

export function TeacherReportsHubPage() {
  const { classes } = useAssignedClasses()
  const hasPreschoolClass = classes.some((schoolClass) => schoolClass.classGroup === 'PRE_PRIMARY')
  const hasPrimaryClass = classes.some((schoolClass) => schoolClass.classGroup === 'PRIMARY')
  const hasAnyClass = classes.length > 0
  const reports = REPORTS.filter((report) => {
    if (report.to === '/teacher/reports/preschool') return hasPreschoolClass
    if (PRIMARY_REPORTS.has(report.to)) return hasPrimaryClass
    return hasAnyClass
  })

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Choose a report type to enter or review for your class"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Link
              key={report.to}
              to={report.to}
              className="group flex gap-4 rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blossom-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg text-ink">{report.title}</h2>
                  {!report.ready && (
                    <span className="rounded-full bg-blossom-100 px-2 py-0.5 text-[11px] font-medium text-blossom-700">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{report.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
