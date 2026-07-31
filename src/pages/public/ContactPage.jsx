import { EnquiryForm } from '@/components/public/EnquiryForm'
import { ActionLink, PageHero, PhotoPlaceholder, Reveal, Section, SectionHeading } from '@/components/public/primitives'
import { SCHOOL } from '@/lib/school'

const CHANNELS = [
  {
    label: 'Call or WhatsApp',
    value: SCHOOL.phone,
    href: SCHOOL.phoneHref,
    note: 'Fastest way to reach the admissions team.',
  },
  {
    label: 'Email',
    value: SCHOOL.email,
    href: SCHOOL.emailHref,
    note: 'We reply within one working day.',
  },
  {
    label: 'Visit us',
    value: SCHOOL.address,
    href: SCHOOL.mapsHref,
    note: `Visiting hours: ${SCHOOL.visitingHours}.`,
  },
]

export function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="Ready to enrol your child? Let’s get started."
        description="Get in touch and let us show you around. We can’t wait to have you."
      >
        <div className="mt-9 flex flex-wrap gap-3">
          <ActionLink href={SCHOOL.whatsappHref} size="lg" target="_blank" rel="noreferrer">
            Message us on WhatsApp
          </ActionLink>
          <ActionLink href={SCHOOL.mapsHref} variant="outline" size="lg" target="_blank" rel="noreferrer">
            View us on Google Maps
          </ActionLink>
        </div>
      </PageHero>

      <Section tone="white">
        <div className="grid gap-6 lg:grid-cols-3">
          {CHANNELS.map((channel, index) => (
            <Reveal
              key={channel.label}
              delay={index * 90}
              className="rounded-3xl bg-cream p-8 ring-1 ring-brand-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{channel.label}</p>
              <a
                href={channel.href}
                target={channel.href.startsWith('http') ? '_blank' : undefined}
                rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                className="mt-3 block font-display text-xl leading-snug text-ink transition hover:text-brand-700"
              >
                {channel.value}
              </a>
              <p className="mt-3 text-sm text-ink/60">{channel.note}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Enquiry form"
              title="Or send us a message and we’ll come back to you"
              description="Tell us your child’s age and what you would like to know. We read every message."
            />
            <Reveal delay={140} className="mt-10">
              <PhotoPlaceholder label="School entrance" ratio="aspect-[4/3]" />
            </Reveal>
          </div>
          <Reveal delay={120}>
            <EnquiryForm title="Get in touch" subject="Contact form enquiry" />
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <Reveal className="overflow-hidden rounded-[2rem] bg-ink px-8 py-14 text-white sm:px-14">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">Already part of the Tender Sprouts family?</h2>
              <p className="mt-4 max-w-xl text-white/70">
                Sign in to the parent portal to view report cards, exam timetables and your child’s subject grades.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ActionLink to="/login" size="lg">
                Portal login
              </ActionLink>
              <ActionLink to="/forgot-password" variant="ghostLight" size="lg">
                Forgot your password?
              </ActionLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
