import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/public/PublicLayout'
import { ROLES } from '@/lib/roles'
import { HomePage } from '@/pages/public/HomePage'
import { AboutPage } from '@/pages/public/AboutPage'
import { ProgrammesPage } from '@/pages/public/ProgrammesPage'
import { AdmissionsPage } from '@/pages/public/AdmissionsPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdmissionEnquiriesPage } from '@/pages/admin/AdmissionEnquiriesPage'
import { ActivityLogPage } from '@/pages/admin/ActivityLogPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { CalendarPage } from '@/pages/admin/CalendarPage'
import { AnnouncementsPage } from '@/pages/admin/AnnouncementsPage'
import { AttendancePage } from '@/pages/admin/AttendancePage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { StudentsPage } from '@/pages/admin/StudentsPage'
import { PupilDetailPage } from '@/pages/admin/PupilDetailPage'
import { ParentsPage } from '@/pages/admin/ParentsPage'
import { ParentDetailPage } from '@/pages/admin/ParentDetailPage'
import { EnrollmentsPage } from '@/pages/admin/EnrollmentsPage'
import { SessionsPage } from '@/pages/admin/SessionsPage'
import { ClassesPage } from '@/pages/admin/ClassesPage'
import { ClassDetailPage } from '@/pages/admin/ClassDetailPage'
import { SubjectsPage } from '@/pages/admin/SubjectsPage'
import { FeesPage } from '@/pages/admin/FeesPage'
import { TeachersPage } from '@/pages/admin/TeachersPage'
import { TeacherDetailPage } from '@/pages/admin/TeacherDetailPage'
import { GradesPage } from '@/pages/admin/GradesPage'
import { AssessmentTypesPage } from '@/pages/admin/AssessmentTypesPage'
import { TermResultsPage } from '@/pages/admin/TermResultsPage'
import { ExamTimetablePage } from '@/pages/admin/ExamTimetablePage'
import { ParentDashboard } from '@/pages/parent/ParentDashboard'
import { ChildrenPage } from '@/pages/parent/ChildrenPage'
import { ReportCardsPage } from '@/pages/parent/ReportCardsPage'
import { ParentFeesPage } from '@/pages/parent/ParentFeesPage'
import { ParentAnnouncementsPage } from '@/pages/parent/ParentAnnouncementsPage'
import { ParentCalendarPage } from '@/pages/parent/ParentCalendarPage'
import { ParentAttendancePage } from '@/pages/parent/ParentAttendancePage'
import { ParentProfilePage } from '@/pages/parent/ParentProfilePage'
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard'
import { TeacherPupilsPage } from '@/pages/teacher/TeacherPupilsPage'
import { TeacherSubjectsPage } from '@/pages/teacher/TeacherSubjectsPage'
import { TeacherAttendancePage } from '@/pages/teacher/TeacherAttendancePage'
import { TeacherAnnouncementsPage } from '@/pages/teacher/TeacherAnnouncementsPage'
import { TeacherActivitiesPage } from '@/pages/teacher/TeacherActivitiesPage'
import { TeacherAssignmentsPage } from '@/pages/teacher/TeacherAssignmentsPage'
import { TeacherTimetablePage } from '@/pages/teacher/TeacherTimetablePage'
import { ApiStatusBanner } from '@/components/ApiStatusBanner'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ApiStatusBanner />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/programmes" element={<ProgrammesPage />} />
              <Route path="/admissions" element={<AdmissionsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/admission-enquiries" element={<AdmissionEnquiriesPage />} />
                <Route path="/admin/activity" element={<ActivityLogPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/calendar" element={<CalendarPage />} />
                <Route path="/admin/announcements" element={<AnnouncementsPage />} />
                <Route path="/admin/fees" element={<FeesPage />} />
                <Route path="/admin/attendance" element={<AttendancePage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/students" element={<StudentsPage />} />
                <Route path="/admin/students/:id" element={<PupilDetailPage />} />
                <Route path="/admin/parents" element={<ParentsPage />} />
                <Route path="/admin/parents/:id" element={<ParentDetailPage />} />
                <Route path="/admin/enrollments" element={<EnrollmentsPage />} />
                <Route path="/admin/sessions" element={<SessionsPage />} />
                <Route path="/admin/classes" element={<ClassesPage />} />
                <Route path="/admin/classes/:id" element={<ClassDetailPage />} />
                <Route path="/admin/subjects" element={<SubjectsPage />} />
                <Route path="/admin/teachers" element={<TeachersPage />} />
                <Route path="/admin/teachers/:id" element={<TeacherDetailPage />} />
                <Route path="/admin/grades" element={<GradesPage />} />
                <Route path="/admin/assessment-types" element={<AssessmentTypesPage />} />
                <Route path="/admin/term-results" element={<TermResultsPage />} />
                <Route path="/admin/exam-timetable" element={<ExamTimetablePage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.TEACHER]} />}>
              <Route element={<AppLayout />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/pupils" element={<TeacherPupilsPage />} />
                <Route path="/teacher/subjects" element={<TeacherSubjectsPage />} />
                <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
                <Route path="/teacher/announcements" element={<TeacherAnnouncementsPage />} />
                <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
                <Route path="/teacher/activities" element={<TeacherActivitiesPage />} />
                <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
                <Route path="/teacher/grades" element={<GradesPage />} />
                <Route path="/teacher/term-results" element={<TermResultsPage />} />
                <Route path="/teacher/exam-timetable" element={<ExamTimetablePage />} />
                <Route path="/teacher/parents" element={<ParentsPage readOnly />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.PARENT]} />}>
              <Route element={<AppLayout />}>
                <Route path="/parent" element={<ParentDashboard />} />
                <Route path="/parent/children" element={<ChildrenPage />} />
                <Route path="/parent/fees" element={<ParentFeesPage />} />
                <Route path="/parent/attendance" element={<ParentAttendancePage />} />
                <Route path="/parent/results" element={<ReportCardsPage />} />
                <Route path="/parent/announcements" element={<ParentAnnouncementsPage />} />
                <Route path="/parent/calendar" element={<ParentCalendarPage />} />
                <Route path="/parent/profile" element={<ParentProfilePage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
