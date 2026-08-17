import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  School,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { roleLabel, ROLES } from '@/lib/roles'
import { SCHOOL } from '@/lib/school'
import { PortalGreeting } from '@/components/layout/PortalGreeting'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/admission-enquiries', label: 'Admission Enquiries', icon: <MessageSquareText size={18} /> },
  { to: '/admin/activity', label: 'Activity', icon: <ClipboardList size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Settings size={18} /> },
  { to: '/admin/calendar', label: 'Calendar', icon: <CalendarDays size={18} /> },
  { to: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { to: '/admin/fees', label: 'School Fees', icon: <Wallet size={18} /> },
  { to: '/admin/attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { to: '/admin/reports', label: 'Reports', icon: <FileBarChart size={18} /> },
  { to: '/admin/students', label: 'Pupil Management', icon: <Users size={18} /> },
  { to: '/admin/parents', label: 'Parents', icon: <Users size={18} /> },
  { to: '/admin/enrollments', label: 'Promote Pupils', icon: <GraduationCap size={18} /> },
  { to: '/admin/sessions', label: 'Sessions & Terms', icon: <School size={18} /> },
  { to: '/admin/classes', label: 'Classes', icon: <School size={18} /> },
  { to: '/admin/subjects', label: 'Subjects', icon: <BookOpen size={18} /> },
  { to: '/admin/teachers', label: 'Teachers', icon: <GraduationCap size={18} /> },
  { to: '/admin/assessment-types', label: 'Assessment Types', icon: <Settings size={18} /> },
  { to: '/admin/grades', label: 'Grades', icon: <ClipboardList size={18} /> },
  { to: '/admin/term-results', label: 'Term Results', icon: <BookOpen size={18} /> },
  { to: '/admin/exam-timetable', label: 'Exam Timetable', icon: <Calendar size={18} /> },
]

const teacherNav = [
  { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/teacher/pupils', label: 'My Pupils', icon: <Users size={18} /> },
  { to: '/teacher/subjects', label: 'Subjects', icon: <BookOpen size={18} /> },
  { to: '/teacher/attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { to: '/teacher/term-results', label: 'Results', icon: <GraduationCap size={18} /> },
  { to: '/teacher/grades', label: 'Grades', icon: <ClipboardList size={18} /> },
  { to: '/teacher/assignments', label: 'Assignments', icon: <ClipboardList size={18} /> },
  { to: '/teacher/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { to: '/teacher/timetable', label: 'My Timetable', icon: <Calendar size={18} /> },
  { to: '/teacher/activities', label: 'Calendar', icon: <CalendarDays size={18} /> },
  { to: '/teacher/exam-timetable', label: 'Exam Timetable', icon: <CalendarDays size={18} /> },
  { to: '/teacher/parents', label: 'Parents', icon: <Users size={18} /> },
]

const parentNav = [
  { to: '/parent', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/parent/children', label: 'My Children', icon: <Users size={18} /> },
  { to: '/parent/attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { to: '/parent/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { to: '/parent/calendar', label: 'Calendar', icon: <CalendarDays size={18} /> },
  { to: '/parent/results', label: 'Report Card', icon: <GraduationCap size={18} /> },
  { to: '/parent/fees', label: 'School Fees', icon: <Wallet size={18} /> },
  { to: '/parent/profile', label: 'Settings', icon: <Settings size={18} /> },
]

function navForRole(role) {
  if (role === ROLES.ADMIN) return adminNav
  if (role === ROLES.TEACHER) return teacherNav
  if (role === ROLES.PARENT) return parentNav
  return []
}

export function AppLayout() {
  const { user, logout, role } = useAuth()
  const navigate = useNavigate()
  const items = role ? navForRole(role) : []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-blossom-200 bg-white">
        <div className="border-b border-blossom-100 px-4 py-2.5">
          <div className="flex flex-col items-center text-center">
            <img src={SCHOOL.logo} alt={SCHOOL.name} className="h-12 w-auto" />
            <p className="mt-0.5 text-[11px] font-medium leading-tight text-brand-600">{roleLabel(role)}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              className={({ isActive }) =>
                clsx(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blossom-100 text-blossom-700'
                    : 'text-ink/70 hover:bg-brand-50 hover:text-brand-700',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-blossom-100 bg-cream/40 p-4">
          <p className="truncate text-xs font-medium text-ink">{roleLabel(role)}</p>
          <p className="truncate text-xs text-muted">User #{user?.userId}</p>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink/70 transition-colors hover:bg-white hover:text-blossom-700"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">
        <PortalGreeting />
        <Outlet />
      </main>
    </div>
  )
}
