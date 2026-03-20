import Image from 'next/image'

import { EditorialCard, MarketingCTA, MarketingHero, MetricStrip, SectionHeading } from '@/components/marketing/sections'
import { PublicSiteChrome } from '@/components/marketing/public-site'

const metrics = [
  { value: '120+', label: 'Programs and institutions across France', note: 'Searchable catalog' },
  { value: '24/7', label: 'AI advisor for questions and guidance', note: 'Available anytime' },
  { value: '5', label: 'Steps from first enquiry to arrival in France', note: 'Structured process' },
  { value: '1', label: 'Country focus: France only', note: 'Specialist guidance' },
]

const pillars = [
  {
    title: 'Grounded admissions planning',
    description:
      'We start with academic fit, budget, language level, and timing. Students get a realistic plan instead of generic study-abroad hype.',
  },
  {
    title: 'End-to-end support, not just discovery',
    description:
      'Campus France, visa readiness, document tracking, bookings, and follow-up are all part of the process instead of scattered across chats and spreadsheets.',
  },
  {
    title: 'AI when it helps, counsellors when it matters',
    description:
      'The AI advisor handles exploration and common questions. Counsellors step in for judgement, strategy, and high-stakes decisions.',
  },
]

const journey = [
  {
    title: 'Profile and eligibility',
    description: 'Understand your background, qualifications, and preferred intakes before spending time on the wrong shortlist.',
  },
  {
    title: 'Program discovery',
    description: 'Find programs by degree, city, language, tuition, and career goals using the searchable catalog.',
  },
  {
    title: 'Application build',
    description: 'Gather required documents, strengthen gaps, and move from draft to submitted with counsellor review.',
  },
  {
    title: 'Campus France and visa',
    description: 'Prepare your dossier, interview, and visa evidence with clear milestones and guidance along the way.',
  },
  {
    title: 'Arrival preparation',
    description: 'Plan accommodation, pre-departure logistics, and early arrival steps so the first month in France goes smoothly.',
  },
]

const franceAngles = [
  {
    title: 'Programs across public and private institutions',
    description:
      'France gives students access to public universities, specialized schools, Grandes Ecoles, and English-taught postgraduate programs without forcing a single path.',
  },
  {
    title: 'Better cost-to-outcome maths',
    description:
      'Students often compare tuition, accommodation, and post-study mobility as one decision. France stays competitive when all three are considered together.',
  },
  {
    title: 'A process that rewards preparation',
    description:
      'The hardest part is not finding the desire to study abroad. It is sequencing requirements correctly. That is exactly what Learn in France helps with.',
  },
]

const whatYouGet = [
  'Searchable program and university catalog with real data',
  'Personal student account that saves your progress and documents',
  'AI advisor for exploring options, eligibility, and next steps',
  'Counsellor support for strategy, applications, and high-stakes decisions',
]

export default function HomePage() {
  return (
    <PublicSiteChrome>
      <MarketingHero
        label="Learn in France"
        title={
          <>
            A calmer way to plan your
            <span className="block text-[var(--color-public-teal)]">move to France.</span>
          </>
        }
        description="Learn in France is built for students who need more than a brochure. We combine program discovery, practical admissions guidance, and structured support that carries through applications, Campus France, visas, and arrival."
        actions={[
          { href: '/apply', label: 'Start your student profile' },
          { href: '/programs', label: 'Explore programs', variant: 'secondary' },
        ]}
        caption="Designed around the real sequence of decisions international students face when choosing France."
        aside={
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/hero-cafe.webp"
                alt="International student studying at an outdoor café in Paris"
                width={1600}
                height={900}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <EditorialCard title="What you get" tone="tinted">
              <div className="space-y-3">
                {whatYouGet.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-public-teal)]" />
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </EditorialCard>
            <EditorialCard title="Our focus" tone="dark">
              <p>
                France is our only destination. That focus means deeper guidance on requirements,
                processes, deadlines, and expectations than a platform trying to cover every
                country can offer.
              </p>
            </EditorialCard>
          </div>
        }
      />

      <MetricStrip items={metrics} />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="How we help"
            title="Guidance that stays practical."
            description="Students come to us with real questions about cost, eligibility, timelines, and next steps. We answer them plainly, with process and tradeoffs included."
            align="center"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <EditorialCard
                key={pillar.title}
                title={pillar.title}
                tone={index === 1 ? 'dark' : 'light'}
              >
                <p>{pillar.description}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="public-shell">
          <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
            <Image
              src="/images/hero-rooftops.webp"
              alt="Paris rooftops at golden hour seen from a university window"
              width={1600}
              height={600}
              className="aspect-[21/9] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-18">
        <div className="public-shell grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:items-start">
          <SectionHeading
            label="Your journey"
            title="Built around a real student timeline."
            description="From first enquiry to arrival in France, the process follows five clear phases. Each one builds on the last so nothing falls through the cracks."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {journey.map((item, index) => (
              <div key={item.title} className={`public-panel p-6${index === journey.length - 1 && journey.length % 2 !== 0 ? ' md:col-span-2' : ''}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-public-burgundy)]">
                  Phase {index + 1}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-public-navy)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-public-slate)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-18">
        <div className="public-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5 md:grid-cols-3">
            {franceAngles.map((angle) => (
              <EditorialCard key={angle.title} title={angle.title} tone="tinted">
                <p>{angle.description}</p>
              </EditorialCard>
            ))}
          </div>
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/hero-students.webp"
                alt="International students walking through a French university campus"
                width={1600}
                height={900}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <EditorialCard title="For students choosing France on purpose" tone="dark">
              <p>
                This is not a global marketplace trying to cover every country. The content,
                guidance, and support are built around one destination and go deeper because of it.
              </p>
            </EditorialCard>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Next step"
        title="Start with your profile, not guesswork."
        description="Create a free account to get program guidance, save your progress, talk to the AI advisor, and begin a structured application process when you are ready."
        primary={{ href: '/auth/register', label: 'Create a free account' }}
        secondary={{ href: '/chat', label: 'Talk to the AI advisor first' }}
      />
    </PublicSiteChrome>
  )
}
