import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { homePathForRole } from '@/lib/roles'
import { PUBLIC_NAV, SCHOOL } from '@/lib/school'
import { ActionLink, Container, Sprout } from './primitives'

function PortalLink({ size = 'sm', className = '', onClick }) {
  const { isAuthenticated, role, passwordChangeRequired } = useAuth()
  let to = '/login'
  if (isAuthenticated) to = passwordChangeRequired ? '/change-password' : homePathForRole(role)
  return (
    <ActionLink to={to} variant="primary" size={size} className={className} onClick={onClick}>
      {isAuthenticated ? 'Go to my portal' : 'Portal login'}
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </ActionLink>
  )
}

function TopBar() {
  return (
    <div className="hidden bg-ink text-white lg:block">
      <Container className="flex h-11 items-center justify-between text-xs">
        <div className="flex items-center gap-6 text-white/70">
          <a href={SCHOOL.phoneHref} className="transition hover:text-brand-300">
            {SCHOOL.phone}
          </a>
          <a href={SCHOOL.emailHref} className="transition hover:text-brand-300">
            {SCHOOL.email}
          </a>
        </div>
        <p className="text-white/60">Visiting hours: {SCHOOL.visitingHours}</p>
      </Container>
    </div>
  )
}

function Header() {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 8)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <div
        className={`border-b bg-white/90 backdrop-blur transition ${
          scrolled ? 'border-brand-100 shadow-sm' : 'border-transparent'
        }`}
      >
        <Container className="flex h-20 items-center justify-between gap-6">
          <Link to="/" className="flex items-center" aria-label={`${SCHOOL.name} home`}>
            <img src={SCHOOL.logo} alt={SCHOOL.name} className="h-11 w-auto sm:h-12" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink/70 hover:bg-brand-50/70 hover:text-brand-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ActionLink to="/admissions" variant="outline" size="sm">
              Enquire
            </ActionLink>
            <PortalLink />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 text-ink lg:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              {menuOpen ? (
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </Container>

        {menuOpen ? (
          <div className="border-t border-brand-100 bg-white lg:hidden">
            <Container className="space-y-1 py-4">
              {PUBLIC_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 text-brand-800' : 'text-ink/75 hover:bg-brand-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <ActionLink to="/admissions" variant="outline" size="md" onClick={closeMenu}>
                  Enquire about admissions
                </ActionLink>
                <PortalLink size="md" onClick={closeMenu} />
              </div>
            </Container>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-ink text-white">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="inline-flex rounded-2xl bg-white p-3">
            <img src={SCHOOL.logo} alt={SCHOOL.name} className="h-10 w-auto" />
          </div>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/65">
            A Muslim nursery and primary school in Ajah, Lagos, where a values-based curriculum meets modern, hands-on
            learning.
          </p>
          <div className="mt-6 flex items-center gap-2 text-brand-300">
            <Sprout className="h-5 w-5" />
            <span className="font-display text-lg">{SCHOOL.tagline}</span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Explore</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-white/75 transition hover:text-brand-300">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Portal</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link to="/login" className="text-white/75 transition hover:text-brand-300">
                Parent login
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-white/75 transition hover:text-brand-300">
                Staff login
              </Link>
            </li>
            <li>
              <Link to="/forgot-password" className="text-white/75 transition hover:text-brand-300">
                Reset password
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Visit or call</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/75">
            <li>{SCHOOL.address}</li>
            <li>
              <a href={SCHOOL.phoneHref} className="transition hover:text-brand-300">
                {SCHOOL.phone}
              </a>
            </li>
            <li>
              <a href={SCHOOL.emailHref} className="transition hover:text-brand-300">
                {SCHOOL.email}
              </a>
            </li>
            <li className="text-white/55">{SCHOOL.visitingHours}</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SCHOOL.name}. All rights reserved.
          </p>
          <p dir="rtl" className="font-medium text-white/60">
            {SCHOOL.arabicName}
          </p>
        </Container>
      </div>
    </footer>
  )
}

export function PublicLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
