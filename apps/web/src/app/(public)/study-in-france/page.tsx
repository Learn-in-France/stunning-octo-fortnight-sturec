import Image from 'next/image'

import { EditorialCard, MarketingCTA, MarketingHero, SectionHeading } from '@/components/marketing/sections'

const reasons = [
  {
    title: 'Strong academics without defaulting to Anglophone pricing',
    description:
      'France lets students compare quality, affordability, and mobility together. That changes the shortlist for students who would otherwise only look at the UK, Canada, or Australia.',
  },
  {
    title: 'English-taught pathways still exist',
    description:
      'Many postgraduate and specialized programs are delivered in English, especially in business, engineering, and international fields, while French can be added over time.',
  },
  {
    title: 'Life after study matters',
    description:
      'Students often choose France for the combination of academic reputation, Schengen mobility, city diversity, and the possibility of building post-study options in Europe.',
  },
  {
    title: 'The system rewards preparation',
    description:
      'France is a strong fit when students are organized early. Timelines, dossier quality, and sequencing matter more than last-minute scrambling.',
  },
]

const realityCheck = [
  'Budget planning has to include housing, deposits, transport, insurance, and early arrival costs.',
  'Campus France and visa steps can be as important as the university application itself depending on country.',
  'City choice affects cost, lifestyle, internships, and availability of accommodation more than many students expect.',
]

export default function StudyInFrancePage() {
  return (
    <>
      <MarketingHero
        label="Why France"
        title={<>France works best when the plan is as strong as the ambition.</>}
        description="Students choose France for very good reasons: reputation, tuition value, international exposure, and the breadth of cities and institutions. The opportunity is real. So is the operational work needed to get there."
        actions={[
          { href: '/programs', label: 'Browse live programs' },
          { href: '/apply', label: 'Build my plan', variant: 'secondary' },
        ]}
        aside={
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/france-seine.webp"
                alt="Student reading by the Seine river in Paris at golden hour"
                width={1600}
                height={900}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <EditorialCard title="What to weigh early" tone="tinted">
              <div className="space-y-3">
                {realityCheck.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </EditorialCard>
            <EditorialCard title="Our view" tone="dark">
              <p>
                France is strongest for students who want a credible academic route and are
                willing to manage the process properly from the start.
              </p>
            </EditorialCard>
          </div>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Why students choose it"
            title="The decision is bigger than prestige."
            description="The strongest cases for France usually combine academic fit, realistic affordability, and a long-term mobility strategy."
            align="center"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {reasons.map((reason, index) => (
              <EditorialCard key={reason.title} title={reason.title} tone={index % 2 === 0 ? 'light' : 'tinted'}>
                <p>{reason.description}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="public-shell">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/france-tram.webp"
                alt="Tram passing through a sunlit square in a French city"
                width={1600}
                height={900}
                className="h-[260px] w-full object-cover sm:h-[300px]"
              />
            </div>
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/france-boulangerie.webp"
                alt="Student at a French boulangerie"
                width={1600}
                height={900}
                className="h-[260px] w-full object-cover sm:h-[300px]"
              />
            </div>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Start exploring"
        title="Move from broad interest to an actual shortlist."
        description="Use the catalog if you are still comparing options, or create an account to get guidance tailored to your profile."
        primary={{ href: '/programs', label: 'Explore programs' }}
        secondary={{ href: '/chat', label: 'Ask the AI advisor' }}
      />
    </>
  )
}
