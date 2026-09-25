import { PupilFirstAssessmentSheet } from '@/components/PupilFirstAssessmentSheet'

export function WeeklyTestResultPage() {
  return (
    <PupilFirstAssessmentSheet
      type="WEEKLY_TEST"
      title="Weekly test result"
      subtitle="Pick a student, then enter subject scores for the selected week"
      showWeek
    />
  )
}
