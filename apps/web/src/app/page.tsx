import Image from 'next/image'
import Link from 'next/link'

import { MarketingCTA, MarketingHero, MetricStrip } from '@/components/marketing/sections'
import { PublicSiteChrome } from '@/components/marketing/public-site'

const metrics = [
  { value: '1 Country', label: 'Specialized expertise' },
  { value: '5 Steps', label: 'Streamlined process' },
  { value: '24/7 AI', label: 'Intelligent advisory' },
]

const differentiators = [
  {
    icon: 'public',
    title: 'France only',
    description:
      'We don\'t cover 50 countries. We cover one, deeply. That means better guidance on requirements, processes, and the things that actually trip students up.',
  },
  {
    icon: 'location_on',
    title: 'We\'re there when you arrive',
    description:
      'Our team in France helps with housing, admin, and the first weeks of settling in. Support doesn\'t end at the acceptance letter.',
  },
  {
    icon: 'groups',
    title: 'Tech screens, humans guide',
    description:
      'The AI advisor handles exploration and common questions around the clock. Counsellors step in for applications, strategy, and judgement calls.',
  },
]

export default function HomePage() {
  return (
    <PublicSiteChrome>
      <MarketingHero
        label={<>Learn in <span className="text-public-red">France</span></>}
        title={
          <>
            We&rsquo;re already in France.{' '}
            <span className="public-accent">Let&rsquo;s get you here too.</span>
          </>
        }
        description="The only specialist agency with a team on the ground in France. We handle applications, visas, housing, and settling in — so you can focus on your future."
        actions={[
          { href: '/auth/register', label: 'Talk to AI advisor' },
          { href: '/why-france', label: 'Why study in France?', variant: 'secondary' },
        ]}
        caption={<>Already a member? <Link href="/auth/login" className="font-semibold text-public-blue hover:text-public-navy transition-colors underline underline-offset-2">Sign in</Link></>}
        aside={
          <div className="public-hero-image rotate-1 transition-transform duration-500 hover:rotate-0">
            <Image
              src="/images/hero-cafe.webp"
              alt="International student studying at an outdoor café in France"
              width={1600}
              height={900}
              priority
            />
          </div>
        }
      />

      <MetricStrip items={metrics} />

      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">Why choose us?</h2>
            <div className="public-divider" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {differentiators.map((item, index) => (
              <div
                key={item.title}
                className={`public-card public-card-lg ${
                  index === 1 ? 'public-card-dark' : 'public-card-light'
                }`}
              >
                <span className={`material-symbols-outlined ${index === 1 ? 'public-icon-accent' : 'public-icon'}`}>
                  {item.icon}
                </span>
                <h3 className="public-heading-card mt-6">{item.title}</h3>
                <p className={`mt-4 ${index === 1 ? 'public-body-dark' : 'public-body'}`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-0">
        <div className="public-shell">
          <div className="group relative h-[400px] overflow-hidden rounded-2xl sm:h-[500px]">
            <Image
              src="/images/hero-rooftops.webp"
              alt="View across French rooftops at golden hour from a study desk"
              width={1600}
              height={600}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-public-navy/60 to-transparent" />
            <h3 className="absolute bottom-8 left-8 max-w-2xl font-display text-3xl font-extrabold tracking-[-0.03em] text-white sm:bottom-12 sm:left-12 sm:text-4xl">
              The most beautiful campuses in the world are waiting.
            </h3>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Next step"
        title="Start with a conversation, not a commitment."
        description="Talk to our AI advisor to explore programs, check eligibility, and understand the process. No signup pressure — just answers."
        primary={{ href: '/auth/register', label: 'Talk to AI advisor' }}
        secondary={{ href: '/why-france', label: 'Why France?' }}
      />
    </PublicSiteChrome>
  )
}
