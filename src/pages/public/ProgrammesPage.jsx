import {
  ActionLink,
  PageHero,
  PhotoPlaceholder,
  Reveal,
  Section,
  SectionHeading,
  Sprout,
} from '@/components/public/primitives'

const PILLARS = [
  {
    title: 'Academics',
    body: 'Our engaging curriculum nurtures critical thinking, creativity and a love for learning, laying a strong foundation for future success.',
    points: [
      'Phonics-led literacy and guided reading',
      'Concrete-to-abstract numeracy',
      'Project-based science and technology',
      'Continuous assessment, not just end-of-term exams',
    ],
  },
  {
    title: 'Qur’anic & Islamic Studies',
    body: 'We emphasise Qur’anic recitation, memorisation and understanding, along with nurturing Islamic character and values.',
    points: [
      'Tajweed from the first year',
      'Structured hifz targets per class',
      'Arabic language and vocabulary',
      'Adab, seerah and daily practice',
    ],
  },
  {
    title: 'Holistic Development',
    body: 'Through engaging activities and projects, we help students grow spiritually, socially and intellectually to become confident individuals.',
    points: [
      'Sports, movement and wellbeing',
      'Art, music and creative expression',
      'Public speaking and leadership',
      'Community service and empathy',
    ],
  },
]

const STAGES = [
  {
    name: 'Creche & Playgroup',
    ages: '6 months – 2 years',
    body: 'Gentle settling, sensory play and early language in a calm, home-like space with a very high staff ratio.',
    highlights: ['Sensory & messy play', 'Early speech and sound', 'Nap and feeding routines'],
  },
  {
    name: 'Nursery',
    ages: '3 – 4 years',
    body: 'Structured play builds phonics, number sense and the confidence to try, get it wrong and try again.',
    highlights: ['Phonics and mark-making', 'Counting and pattern', 'Short Qur’anic surahs'],
  },
  {
    name: 'Reception',
    ages: '5 years',
    body: 'The bridge into formal learning — longer focus, independent reading and the first written assessments.',
    highlights: ['Independent reading', 'Writing sentences', 'Hifz foundations'],
  },
  {
    name: 'Primary',
    ages: '6 – 11 years',
    body: 'A full primary curriculum with termly report cards, exams and enrichment clubs across all six year groups.',
    highlights: ['Core and broader subjects', 'Termly exams and reports', 'Clubs and leadership roles'],
  },
]

const DAY = [
  { time: '7:30', label: 'Arrival & morning duas' },
  { time: '8:00', label: 'Qur’an and Islamic studies' },
  { time: '9:30', label: 'Core academics' },
  { time: '11:00', label: 'Break, snack and outdoor play' },
  { time: '11:45', label: 'Project and discovery time' },
  { time: '13:00', label: 'Salah and lunch' },
  { time: '14:00', label: 'Clubs, sports and creative arts' },
  { time: '15:00', label: 'Reflection and dismissal' },
]

export function ProgrammesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our programmes"
        title="A curriculum where academics, faith and character grow together."
        description="From creche through primary, every Tender Sprouts class balances three pillars — so children leave us with strong results and a stronger sense of who they are."
      >
        <div className="mt-9 flex flex-wrap gap-3">
          <ActionLink to="/admissions" size="lg">
            Apply for a place
          </ActionLink>
          <ActionLink to="/contact" variant="outline" size="lg">
            Ask about a class
          </ActionLink>
        </div>
      </PageHero>

      <Section tone="white">
        <SectionHeading eyebrow="Three pillars" title="What every child studies with us" align="center" />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              delay={index * 90}
              className="group flex flex-col rounded-3xl bg-cream p-8 ring-1 ring-blossom-200 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blossom-500/15"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blossom-600 transition group-hover:bg-blossom-500 group-hover:text-white">
                <Sprout className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-display text-2xl text-ink">{pillar.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/65">{pillar.body}</p>
              <ul className="mt-6 space-y-2.5 border-t border-blossom-200 pt-6 text-sm text-ink/70">
                {pillar.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="cream">
        <SectionHeading
          eyebrow="Our classes"
          title="Stages from six months to eleven years"
          description="Each stage has its own rhythm, targets and reporting — but the same care behind it."
        />
        <div className="mt-14 space-y-5">
          {STAGES.map((stage, index) => (
            <Reveal
              key={stage.name}
              delay={index * 70}
              className="grid gap-6 rounded-3xl bg-white p-8 ring-1 ring-blossom-100 transition duration-300 hover:shadow-lg hover:shadow-blossom-500/15 lg:grid-cols-[minmax(0,16rem)_1fr_minmax(0,18rem)] lg:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blossom-600">{stage.ages}</p>
                <h3 className="mt-2 font-display text-2xl text-ink">{stage.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-ink/65">{stage.body}</p>
              <ul className="space-y-2 text-sm text-ink/70">
                {stage.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="A day with us"
              title="What a Tender Sprouts day looks like"
              description="Predictable rhythm, plenty of movement, and time set aside for both the Qur’an and the classroom."
            />
            <ol className="mt-10 space-y-0">
              {DAY.map((slot, index) => (
                <Reveal
                  key={slot.time}
                  delay={index * 50}
                  as="li"
                  className="flex gap-6 border-l border-blossom-200 py-4 pl-6 first:pt-0"
                >
                  <span className="w-14 shrink-0 font-display text-lg text-blossom-600">{slot.time}</span>
                  <span className="text-sm text-ink/75">{slot.label}</span>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal delay={120} className="grid gap-5 sm:grid-cols-2 lg:content-start">
            <PhotoPlaceholder label="Morning assembly" ratio="aspect-[3/4]" />
            <PhotoPlaceholder label="Group work" ratio="aspect-[3/4]" className="sm:mt-12" />
            <PhotoPlaceholder label="Break time" ratio="aspect-square" className="sm:-mt-4" />
            <PhotoPlaceholder label="Clubs" ratio="aspect-square" className="sm:mt-8" />
          </Reveal>
        </div>
      </Section>
    </>
  )
}
