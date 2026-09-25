import { PupilFirstAssessmentSheet } from '@/components/PupilFirstAssessmentSheet'

export function MidtermReportPage() {
  return (
    <PupilFirstAssessmentSheet
      type="MIDTERM"
      title="Midterm report"
      subtitle="Pick a student, then enter subject scores for the midterm"
    />
  )
}
