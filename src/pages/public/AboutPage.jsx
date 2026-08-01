import { EnquiryForm } from '@/components/public/EnquiryForm'
import {
  ActionLink,
  PageHero,
  PhotoPlaceholder,
  Reveal,
  Section,
  SectionHeading,
  Sprout,
} from '@/components/public/primitives'
import { SCHOOL } from '@/lib/school'

const VALUES = [
  {
    title: 'Ihsan — excellence in everything',
    body: 'We hold ourselves to a high standard in teaching, in care and in the way we speak to one another.',
  },
  {
    title: 'Amanah — trust and responsibility',
    body: 'Your child is a trust. We safeguard their wellbeing, their curiosity and their confidence.',
  },
  {
    title: 'Rahmah — mercy in our community',
    body: 'Kindness is taught by example. Our staff model the patience and gentleness we hope to see in our pupils.',
  },
  {
    title: 'Ilm — knowledge that is lived',
    body: 'Learning is not memorising for a test. We ask children to apply what they know to real problems.',
  },
]

const FACILITIES = [
  'Bright, purpose-built classrooms',
  'Dedicated Qur’an and Arabic rooms',
  'Reading and resource library',
  'Secure outdoor play area',
  'Discovery and science corner',
  'Prayer space for daily salah',
]

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="We are building a strong foundation for a brighter future, rooted in excellence and guided by faith."
        description="Tender Sprouts is a Muslim nursery and primary school in Ajah, Lagos. We exist to nurture young minds, provide quality education, and foster a strong sense of identity, community and responsibility in every child."
      />

      <Section tone="white">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <Reveal>
            <PhotoPlaceholder label="Our campus" ratio="aspect-[4/5]" />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Our philosophy"
              title="Every child deserves a place where they can thrive academically, socially and spiritually."
              description="Our curriculum is designed to inspire curiosity, encourage growth and instil strong moral values. We combine modern teaching techniques with a faith-driven approach, ensuring children grow in knowledge and in character."
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
          </div>
        </div>
      </Section>

      <Section tone="cream">
        <SectionHeading
          eyebrow="Our values"
          title="Four values that shape how we teach and how we treat each other"
          align="center"
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <Reveal
              key={value.title}
              delay={index * 80}
              className="rounded-3xl bg-white p-8 ring-1 ring-blossom-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blossom-500/15"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blossom-100 text-blossom-600">
                <Sprout className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">{value.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/65">{value.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Facilities"
              title="Spaces designed around how young children actually learn"
              description="Our state-of-the-art facilities, experienced educators and supportive community create a truly enriching learning experience."
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {FACILITIES.map((facility, index) => (
                <Reveal key={facility} delay={index * 60} as="li" className="flex items-start gap-3 text-sm text-ink/75">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {facility}
                </Reveal>
              ))}
            </ul>
            <Reveal delay={200}>
              <div className="mt-10 flex flex-wrap gap-3">
                <ActionLink to="/contact" size="lg">
                  Book a school visit
                </ActionLink>
                <ActionLink href={SCHOOL.mapsHref} variant="outline" size="lg" target="_blank" rel="noreferrer">
                  Find us on the map
                </ActionLink>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="grid gap-5 sm:grid-cols-2">
            <PhotoPlaceholder label="Library" ratio="aspect-[3/4]" />
            <PhotoPlaceholder label="Play area" ratio="aspect-[3/4]" className="sm:mt-12" />
            <PhotoPlaceholder label="Qur’an room" ratio="aspect-square" className="sm:-mt-4" />
            <PhotoPlaceholder label="Science corner" ratio="aspect-square" className="sm:mt-8" />
          </Reveal>
        </div>
      </Section>

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
          <SectionHeading
            eyebrow="Talk to us"
            title="Would you like your little sprout to join our family?"
            description={`Fill in the enquiry form and our team will be in touch. You can also reach us on ${SCHOOL.phone} during visiting hours.`}
          />
          <Reveal delay={120}>
            <EnquiryForm title="Enquiry form" subject="About page enquiry" />
          </Reveal>
        </div>
      </Section>
    </>
  )
}
