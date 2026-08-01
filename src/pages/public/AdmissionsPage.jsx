import { EnquiryForm } from '@/components/public/EnquiryForm'
import { ActionLink, PageHero, Reveal, Section, SectionHeading } from '@/components/public/primitives'
import { SCHOOL } from '@/lib/school'

const STEPS = [
  {
    title: 'Submit an application form',
    body: 'Visit the school to pick up an enrolment form. Complete it and return it to us with the supporting documents so we can begin your child’s admission.',
    documents: [
      'Birth certificate',
      'State of origin certificate',
      'Previous school reports (if applicable)',
      'Recent passport photograph',
    ],
  },
  {
    title: 'Assessment and interview',
    body: 'Once we have reviewed your enrolment form and documents, we meet with you and your child to assess where they are now and discuss how we can best support their growth.',
  },
  {
    title: 'Admission confirmation',
    body: 'If your child is accepted we send an official confirmation and guide you through registration, uniform, and the start of term.',
  },
]

const FAQS = [
  {
    q: 'When can my child start?',
    a: 'We admit throughout the year where places are available, though most families join at the start of a term. Contact us to check availability for your child’s age group.',
  },
  {
    q: 'Do you accept children who are not Muslim?',
    a: 'Yes. Tender Sprouts is a Muslim school and Islamic studies are part of the timetable, but families of all backgrounds are welcome to enquire.',
  },
  {
    q: 'How big are your classes?',
    a: 'Class sizes are deliberately small so every child receives the attention they need. Exact numbers vary by stage — ask us for the current figures.',
  },
  {
    q: 'Can I visit before applying?',
    a: `Absolutely. Visiting hours are ${SCHOOL.visitingHours}. Call or WhatsApp ${SCHOOL.phone} to arrange a convenient time.`,
  },
  {
    q: 'How will I follow my child’s progress?',
    a: 'Every family receives a secure portal login. You can view published report cards, exam timetables and per-subject grades online at any time.',
  },
]

function Steps() {
  return (
    <Section tone="white">
      <SectionHeading
        eyebrow="Admissions process"
        title="Three steps from enquiry to enrolment"
        description="From your first question to your child’s first day, our admissions team is available to guide you every step of the way."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal
            key={step.title}
            delay={index * 100}
            className="flex flex-col rounded-3xl bg-cream p-8 ring-1 ring-blossom-200"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 font-display text-lg text-white">
              {index + 1}
            </span>
            <h3 className="mt-6 font-display text-xl text-ink">{step.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/65">{step.body}</p>
            {step.documents ? (
              <div className="mt-6 border-t border-blossom-200 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Documents needed</p>
                <ul className="mt-3 space-y-2 text-sm text-ink/70">
                  {step.documents.map((doc) => (
                    <li key={doc} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function Faqs() {
  return (
    <Section tone="white">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <SectionHeading eyebrow="Questions" title="Answers to what parents ask us most" />
        <div className="divide-y divide-blossom-100 border-y border-blossom-200">
          {FAQS.map((faq, index) => (
            <Reveal key={faq.q} delay={index * 60} as="details" className="group py-5">
              <summary className="flex list-none items-center justify-between gap-6 font-display text-lg text-ink [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blossom-100 text-blossom-700 transition group-open:rotate-45">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65">{faq.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function AdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Join the Tender Sprouts family."
        description="A journey of learning, growth and values awaits your child. We are now accepting applications for the coming session."
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <ActionLink href={SCHOOL.whatsappHref} size="lg" target="_blank" rel="noreferrer">
            Call or WhatsApp {SCHOOL.phone}
          </ActionLink>
          <ActionLink href="#enquire" variant="outline" size="lg">
            Send an enquiry
          </ActionLink>
        </div>
      </PageHero>

      <Steps />

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Enquire"
              title="Ready to know more about our school?"
              description="Fill in the form and our admissions team will respond within one working day. Prefer to talk? Call or WhatsApp us during visiting hours."
            />
            <Reveal delay={140} className="mt-10 space-y-4 rounded-3xl bg-white p-8 ring-1 ring-blossom-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Call / WhatsApp</p>
                <a href={SCHOOL.phoneHref} className="mt-1 block font-display text-xl text-ink hover:text-brand-700">
                  {SCHOOL.phone}
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Email</p>
                <a href={SCHOOL.emailHref} className="mt-1 block font-display text-xl text-ink hover:text-brand-700">
                  {SCHOOL.email}
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Visiting hours</p>
                <p className="mt-1 text-ink/75">{SCHOOL.visitingHours}</p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={120} id="enquire" className="scroll-mt-32">
            <EnquiryForm title="Admissions enquiry" subject="Admissions enquiry" />
          </Reveal>
        </div>
      </Section>

      <Faqs />
    </>
  )
}
