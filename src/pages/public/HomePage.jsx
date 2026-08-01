import { Link } from 'react-router-dom'
import {
  ActionLink,
  Container,
  Eyebrow,
  PhotoPlaceholder,
  Reveal,
  Section,
  SectionHeading,
  Sprout,
} from '@/components/public/primitives'
import { SCHOOL } from '@/lib/school'

const STATS = [
  { value: '1:8', label: 'Teacher to pupil ratio' },
  { value: '12', label: 'Pupils per class, capped' },
  { value: '100%', label: 'Qur’anic study every week' },
  { value: '5', label: 'Days of enrichment clubs' },
]

const PILLARS = [
  {
    title: 'Academics',
    body: 'An engaging, inquiry-led curriculum that nurtures critical thinking, creativity and a genuine love for learning — laying a strong foundation for secondary school and beyond.',
    points: ['Literacy & numeracy mastery', 'STEM and hands-on projects', 'Continuous assessment'],
  },
  {
    title: 'Qur’anic & Islamic Studies',
    body: 'Recitation, memorisation and understanding taught with warmth, alongside the Islamic character and manners we want every child to carry into adulthood.',
    points: ['Tajweed and hifz', 'Arabic language', 'Character & adab'],
  },
  {
    title: 'Holistic Development',
    body: 'Through projects, play and community service, children grow spiritually, socially and intellectually into confident individuals who know their worth.',
    points: ['Sports & wellbeing', 'Arts and expression', 'Leadership & service'],
  },
]

const REASONS = [
  {
    title: 'Rooted in faith & knowledge',
    body: 'We nurture hearts and minds by weaving Islamic values into a well-rounded, high quality education.',
  },
  {
    title: 'Every child matters',
    body: 'Small class sizes mean each child gets the love, attention and guidance they need to blossom.',
  },
  {
    title: 'A safe & nurturing community',
    body: 'A caring environment where your child feels valued, protected and genuinely cherished every day.',
  },
  {
    title: 'Holistic growth for a bright future',
    body: 'From spiritual growth to academic and personal development, we prepare children to thrive in this life and the next.',
  },
]

const PORTAL_FEATURES = [
  {
    title: 'Results the moment they publish',
    body: 'Termly report cards with CA, exam, total and grade per subject — viewable online and downloadable as PDF.',
  },
  {
    title: 'Exam timetables in one place',
    body: 'Published schedules for every class, so families can plan revision without chasing paper handouts.',
  },
  {
    title: 'One account per family',
    body: 'Parents with more than one child at Tender Sprouts switch between them from a single secure login.',
  },
]

function Hero() {
  return (
    <div className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-blossom-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-200/40 blur-3xl" />

      <Container className="relative grid items-center gap-16 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          <Reveal>
            <Eyebrow>Muslim nursery &amp; primary · Ajah, Lagos</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Fun, creative, hands-on learning for <span className="text-brand-600">real-life problems.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              At Tender Sprouts we believe in nurturing every child’s potential through love, care and innovation — a
              safe, joyful environment where young minds grow confidently, creatively and compassionately.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ActionLink to="/admissions" size="lg">
                Start an application
              </ActionLink>
              <ActionLink to="/programmes" variant="outline" size="lg">
                Explore our programmes
              </ActionLink>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink/60">
              <span className="inline-flex items-center gap-2">
                <Sprout className="h-4 w-4 text-brand-600" />
                Values-based curriculum
              </span>
              <span className="inline-flex items-center gap-2">
                <Sprout className="h-4 w-4 text-brand-600" />
                Small, attentive classes
              </span>
              <span className="inline-flex items-center gap-2">
                <Sprout className="h-4 w-4 text-brand-600" />
                Experienced educators
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={180} className="relative">
          <PhotoPlaceholder label="Hero photo — pupils at play" ratio="aspect-[4/5]" className="shadow-2xl shadow-blossom-500/20" />
          <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-2xl bg-white p-5 shadow-xl shadow-blossom-500/15 ring-1 ring-blossom-200 sm:block">
            <p className="font-display text-3xl text-blossom-600">1:8</p>
            <p className="mt-1 text-sm text-ink/60">Teacher to pupil ratio, so no child is overlooked.</p>
          </div>
          <div className="absolute -right-4 top-10 hidden rounded-2xl bg-ink px-5 py-4 text-white shadow-xl sm:block">
            <p className="text-xs uppercase tracking-[0.16em] text-blossom-300">Now enrolling</p>
            <p className="mt-1 font-display text-lg">2026/2027 session</p>
          </div>
        </Reveal>
      </Container>

      <div className="relative border-t border-blossom-200 bg-white/70">
        <Container className="grid grid-cols-2 gap-8 py-10 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 70}>
              <p className="font-display text-3xl text-ink sm:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-sm text-ink/55">{stat.label}</p>
            </Reveal>
          ))}
        </Container>
      </div>
    </div>
  )
}

function MissionVision() {
  return (
    <Section tone="white">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="relative">
          <PhotoPlaceholder label="Classroom in session" ratio="aspect-[4/5]" />
          <PhotoPlaceholder
            label="Reading corner"
            ratio="aspect-square"
            className="absolute -bottom-10 -right-6 w-44 border-4 border-white sm:w-56"
          />
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="About us"
            title="Building a strong foundation for a brighter future, rooted in excellence and guided by faith."
            description="Every child deserves a nurturing environment where they can thrive academically, socially and spiritually. Our curriculum is designed to inspire curiosity, encourage growth and instil strong moral values."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <Reveal className="rounded-3xl bg-blossom-50 p-7 ring-1 ring-blossom-200">
              <h3 className="font-display text-xl text-ink">Our mission</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                To inspire young minds to think creatively, learn joyfully and act compassionately.
              </p>
            </Reveal>
            <Reveal delay={80} className="rounded-3xl bg-ink p-7 text-white">
              <h3 className="font-display text-xl">Our vision</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                To cultivate a generation of confident, well-rounded individuals ready to make a meaningful impact in
                their community and beyond.
              </p>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:gap-3 hover:text-brand-800"
            >
              Get to know us better
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}

function Programmes() {
  return (
    <Section tone="cream">
      <SectionHeading
        eyebrow="Our programmes"
        title="Three pillars that shape every Tender Sprouts day"
        description="Academics, Qur’anic and Islamic studies, and holistic development run side by side from creche through primary."
        align="center"
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PILLARS.map((pillar, index) => (
          <Reveal
            key={pillar.title}
            delay={index * 90}
            className="group flex flex-col rounded-3xl bg-white p-8 ring-1 ring-blossom-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blossom-500/15"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blossom-100 text-blossom-600 transition group-hover:bg-blossom-500 group-hover:text-white">
              <Sprout className="h-6 w-6" />
            </span>
            <h3 className="mt-6 font-display text-2xl text-ink">{pillar.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/65">{pillar.body}</p>
            <ul className="mt-6 space-y-2 border-t border-blossom-100 pt-6 text-sm text-ink/70">
              {pillar.points.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-12 text-center">
        <ActionLink to="/programmes" variant="secondary" size="lg">
          Check out our classes
        </ActionLink>
      </Reveal>
    </Section>
  )
}

function WhyUs() {
  return (
    <Section tone="white">
      <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Why Tender Sprouts"
            title="Why entrust your little sprout to us?"
            description="We combine modern teaching techniques with a faith-driven approach, so children grow in both knowledge and character."
          />
          <div className="mt-10 space-y-8">
            {REASONS.map((reason, index) => (
              <Reveal key={reason.title} delay={index * 70} className="flex gap-5">
                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg text-ink">{reason.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{reason.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={120} className="grid gap-5 sm:grid-cols-2 lg:content-start">
          <PhotoPlaceholder label="Science project" ratio="aspect-[3/4]" />
          <PhotoPlaceholder label="Qur’an circle" ratio="aspect-[3/4]" className="sm:mt-12" />
          <PhotoPlaceholder label="Outdoor play" ratio="aspect-square" className="sm:-mt-4" />
          <PhotoPlaceholder label="Art & craft" ratio="aspect-square" className="sm:mt-8" />
        </Reveal>
      </div>
    </Section>
  )
}

function PortalBand() {
  return (
    <div className="bg-ink py-20 text-white sm:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Parent & staff portal"
              tone="light"
              title="Your child’s progress, always within reach."
              description="Tender Sprouts families get a secure online portal — no more waiting for the end of term to know how your child is doing."
            />
            <Reveal delay={160}>
              <div className="mt-9 flex flex-wrap gap-3">
                <ActionLink to="/login" size="lg">
                  Sign in to the portal
                </ActionLink>
                <ActionLink to="/contact" variant="ghostLight" size="lg">
                  Need login help?
                </ActionLink>
              </div>
            </Reveal>
          </div>

          <div className="space-y-4">
            {PORTAL_FEATURES.map((feature, index) => (
              <Reveal
                key={feature.title}
                delay={index * 90}
                className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                <h3 className="font-display text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{feature.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}

function AdmissionsCta() {
  return (
    <Section tone="cream">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-8 py-14 text-white sm:px-14 sm:py-20">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blossom-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blossom/25 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Join the Tender Sprouts family — a journey of learning, growth and values awaits your child.
            </h2>
            <p className="mt-5 max-w-xl text-white/80">
              From enquiry to enrolment, our admissions team is available to guide you every step of the way. Visits are
              welcome {SCHOOL.visitingHours.toLowerCase()}.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ActionLink to="/admissions" variant="secondary" size="lg">
              Get started with admissions
            </ActionLink>
            <ActionLink href={SCHOOL.whatsappHref} variant="ghostLight" size="lg" target="_blank" rel="noreferrer">
              WhatsApp {SCHOOL.phone}
            </ActionLink>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

export function HomePage() {
  return (
    <>
      <Hero />
      <MissionVision />
      <Programmes />
      <WhyUs />
      <PortalBand />
      <AdmissionsCta />
    </>
  )
}
