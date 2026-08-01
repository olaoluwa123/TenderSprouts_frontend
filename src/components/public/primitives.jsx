import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export function Container({ className = '', children }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>
}

export function Section({ id, tone = 'white', className = '', children }) {
  const tones = {
    white: 'bg-white',
    cream: 'bg-cream',
    mint: 'bg-brand-50',
    ink: 'bg-ink text-white',
  }
  return (
    <section id={id} className={`${tones[tone]} py-20 sm:py-28 ${className}`}>
      <Container>{children}</Container>
    </section>
  )
}

export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Eyebrow({ tone = 'brand', children }) {
  const tones = {
    brand: 'bg-blossom-50 text-brand-800 ring-1 ring-blossom-100',
    light: 'bg-white/10 text-brand-200 ring-1 ring-white/15',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function SectionHeading({ eyebrow, title, description, align = 'left', tone = 'dark' }) {
  const dark = tone === 'dark'
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow tone={dark ? 'brand' : 'light'}>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={60}>
        <h2
          className={`mt-5 font-display text-3xl leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem] ${
            dark ? 'text-ink' : 'text-white'
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={120}>
          <p className={`mt-5 text-lg leading-relaxed ${dark ? 'text-ink/70' : 'text-white/70'}`}>{description}</p>
        </Reveal>
      ) : null}
    </div>
  )
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

const buttonVariants = {
  primary: 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 hover:-translate-y-0.5',
  secondary: 'bg-ink text-white hover:bg-ink/85 hover:-translate-y-0.5',
  outline: 'border border-blossom-200 bg-white text-brand-800 hover:border-blossom-300 hover:bg-blossom-50',
  ghostLight: 'border border-white/25 text-white hover:bg-white/10',
}

const buttonSizes = {
  sm: 'px-4 py-2',
  md: 'px-5 py-2.5',
  lg: 'px-7 py-3.5 text-base',
}

export function ActionLink({ to, href, variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const classes = `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  )
}

/**
 * Stand-in for school photography. Swap `src` in once real images land in /public/photos.
 */
export function PhotoPlaceholder({ label, ratio = 'aspect-[4/3]', className = '', children }) {
  return (
    <div
      className={`photo-placeholder relative overflow-hidden rounded-3xl ring-1 ring-blossom-100/80 ${ratio} ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-600/60" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
          <path d="M4 17l4.5-4.5 3 3 3.5-3.5L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="px-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800/60">{label}</span>
      </div>
      {children}
    </div>
  )
}

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <div className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute -right-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-brand-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blossom-200/45 blur-3xl" />
      <Container className="relative py-16 sm:py-24">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={70}>
          <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
        </Reveal>
        {description ? (
          <Reveal delay={130}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">{description}</p>
          </Reveal>
        ) : null}
        {children ? <Reveal delay={190}>{children}</Reveal> : null}
      </Container>
    </div>
  )
}

export function Sprout({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21v-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M12 13c0-3.3-2.5-5.5-5.6-5.8C6.1 10.6 8.3 13 12 13Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 13c0-3.9 2.9-6.4 6.5-6.7C18.8 10 16 13 12 13Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}
