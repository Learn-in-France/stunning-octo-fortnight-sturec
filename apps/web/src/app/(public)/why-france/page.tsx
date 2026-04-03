import Image from 'next/image'

import { EditorialCard, MarketingCTA, MarketingHero } from '@/components/marketing/sections'

const earlyFactors = [
  'Public university tuition starts under EUR 300/year for many programs',
  'English-taught Master\'s programs are widely available',
  'France\'s post-study work permit lets graduates stay and build a career in Europe',
]

const reasons = [
  {
    icon: 'school',
    title: 'Affordable tuition',
    description:
      'Public universities charge a fraction of UK, US, or Australian fees. Even private institutions and Grandes Ecoles are often more competitive than Anglophone alternatives.',
  },
  {
    icon: 'translate',
    title: 'English-taught programs',
    description:
      'Hundreds of programs are delivered in English, especially at Master\'s and MBA level. French can be added over time — it\'s an asset, not a barrier.',
  },
  {
    icon: 'favorite',
    title: 'Quality of life',
    description:
      'Healthcare, public transport, culture, and a student-friendly cost of living. France consistently ranks among the best countries for international students.',
  },
  {
    icon: 'work',
    title: 'Stay and work after your degree',
    description:
      'Graduates get a residence permit to stay and work in France. Build your career where you studied — no need to leave the country after graduation.',
  },
  {
    icon: 'language',
    title: 'Gateway to Europe',
    description:
      'A French degree opens doors across the EU. With Schengen access and internationally recognised qualifications, your career isn\'t limited to one country.',
  },
  {
    icon: 'emoji_events',
    title: 'World-ranked universities',
    description:
      'France has over 30 universities in the global top 500 and a Grandes Ecoles system with no equivalent elsewhere. Academic credibility is built in.',
  },
]

export default function WhyFrancePage() {
  return (
    <>
      <MarketingHero
        label="Why France"
        title={
          <>
            World-class education.{' '}
            <span className="public-accent">Surprisingly affordable.</span>
          </>
        }
        description="France offers internationally ranked universities, low public tuition, English-taught programs, and a post-study work permit that opens doors across Europe. For students comparing destinations, the numbers often surprise."
        actions={[
          { href: '/auth/register', label: 'Talk to AI advisor' },
          { href: '/your-journey', label: 'See how we help', variant: 'secondary' },
        ]}
        aside={
          <div className="public-hero-image rotate-1 transition-transform duration-500 hover:rotate-0">
            <Image
              src="/images/hero-students.webp"
              alt="International students walking through a French university campus"
              width={1600}
              height={900}
              priority
            />
          </div>
        }
        footer={
          <div className="grid gap-5 md:grid-cols-2">
            <EditorialCard title="What to weigh early" tone="tinted">
              <div className="space-y-3">
                {earlyFactors.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="public-dot" />
                    <p className="text-base">{item}</p>
                  </div>
                ))}
              </div>
            </EditorialCard>
            <EditorialCard title="Our view" tone="dark">
              <p className="text-base leading-8">
                France is strongest for students who want a credible academic path and are
                willing to manage the process properly. We help with that second part.
              </p>
            </EditorialCard>
          </div>
        }
      />

      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">More than prestige.</h2>
            <div className="public-divider" />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-public-slate">
              The strongest cases for France combine academic quality, realistic affordability, and long-term mobility.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] bg-public-navy/[0.06] md:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason, index) => (
              <div
                key={reason.title}
                className="relative bg-[rgba(255,250,243,0.92)] p-8 transition-colors hover:bg-white sm:p-10"
              >
                <span className="absolute top-3 right-6 font-display text-7xl font-extrabold text-public-navy/[0.03] select-none pointer-events-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="material-symbols-outlined public-icon mb-5">
                  {reason.icon}
                </span>
                <h3 className="public-heading-card">{reason.title}</h3>
                <p className="mt-3 text-sm leading-7 text-public-slate">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-0">
        <div className="public-shell">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="group relative h-[300px] overflow-hidden rounded-2xl sm:h-[380px]">
              <Image
                src="/images/france-tram.webp"
                alt="Tram passing through a sunlit square in a French city"
                width={1600}
                height={900}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-public-navy/55 to-transparent" />
              <p className="absolute bottom-6 left-6 right-6 font-display text-lg font-bold tracking-[-0.02em] text-white sm:text-xl">
                High quality of life, surprisingly affordable.
              </p>
            </div>
            <div className="group relative h-[300px] overflow-hidden rounded-2xl sm:h-[380px]">
              <Image
                src="/images/france-boulangerie.webp"
                alt="Student at a French boulangerie"
                width={1600}
                height={900}
                className="h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-public-navy/55 to-transparent" />
              <p className="absolute bottom-6 left-6 right-6 font-display text-lg font-bold tracking-[-0.02em] text-white sm:text-xl">
                Immerse yourself in French culture from day one.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Next step"
        title="Find out if France fits your profile."
        description="Our AI advisor can help you understand your eligibility, explore the process, and connect you with a counsellor who matches you to the right programs."
        primary={{ href: '/auth/register', label: 'Talk to AI advisor' }}
        secondary={{ href: '/your-journey', label: 'See the full process' }}
      />
    </>
  )
}
