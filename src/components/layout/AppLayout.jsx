import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Calendar, ClipboardList, GraduationCap, LayoutDashboard, LogOut, School, Settings, Users } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { roleLabel, ROLES } from '@/lib/roles'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Settings size={18} /> },
  { to: '/admin/students', label: 'Students', icon: <Users size={18} /> },
  { to: '/admin/parents', label: 'Parents', icon: <Users size={18} /> },
  { to: '/admin/enrollments', label: 'Bulk Promote', icon: <GraduationCap size={18} /> },
  { to: '/admin/sessions', label: 'Sessions & Terms', icon: <School size={18} /> },
  { to: '/admin/classes', label: 'Classes & Subjects', icon: <BookOpen size={18} /> },
  { to: '/admin/teachers', label: 'Teachers', icon: <GraduationCap size={18} /> },
  { to: '/admin/assessment-types', label: 'Assessment Types', icon: <Settings size={18} /> },
  { to: '/admin/grades', label: 'Grades', icon: <ClipboardList size={18} /> },
  { to: '/admin/term-results', label: 'Term Results', icon: <BookOpen size={18} /> },
  { to: '/admin/exam-timetable', label: 'Exam Timetable', icon: <Calendar size={18} /> },
]

const teacherNav = [
  { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/teacher/grades', label: 'Grades', icon: <BookOpen size={18} /> },
  { to: '/teacher/term-results', label: 'Term Results', icon: <ClipboardList size={18} /> },
  { to: '/teacher/exam-timetable', label: 'Exam Timetable', icon: <Calendar size={18} /> },
  { to: '/teacher/parents', label: 'Parents', icon: <Users size={18} /> },
]

const parentNav = [
  { to: '/parent', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/parent/children', label: 'My Children', icon: <Users size={18} /> },
  { to: '/parent/grades', label: 'Grades', icon: <BookOpen size={18} /> },
  { to: '/parent/results', label: 'Report Cards', icon: <GraduationCap size={18} /> },
  { to: '/parent/exam-timetable', label: 'Exam Timetable', icon: <Calendar size={18} /> },
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
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white">
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <School size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900">School Portal</p>
              <p className="text-xs text-muted">{roleLabel(role)}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              className={({ isActive }) =>
                clsx(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs font-medium text-slate-700">{roleLabel(role)}</p>
          <p className="truncate text-xs text-muted">User #{user?.userId}</p>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
