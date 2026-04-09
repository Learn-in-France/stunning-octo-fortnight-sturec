import Image from 'next/image'
import type { Metadata } from 'next'

import { EditorialCard, MarketingCTA, MarketingHero } from '@/components/marketing/sections'

export const metadata: Metadata = {
  title: 'Why Study in France? — Careers, Industry Exposure & Global Opportunity | Learn in France',
  description: 'Discover why France stands out for international students looking for strong universities, career-relevant industries, European mobility, and long-term international exposure.',
  alternates: { canonical: 'https://learninfrance.com/why-france' },
  openGraph: {
    title: 'Why Study in France? — Careers, Industry Exposure & Global Opportunity',
    description: 'France combines strong universities, global industries, European mobility, and long-term international career relevance.',
    url: 'https://learninfrance.com/why-france',
  },
}

const earlyFactors = [
  'France connects study with strong sectors like AI, mobility, luxury, advanced industry, and global business',
  'English-taught Master\'s programs are widely available while French becomes a long-term career asset',
  'Graduates can build from study into European experience, networks, and long-term market exposure',
]

const reasons = [
  {
    icon: 'precision_manufacturing',
    title: 'A serious economy, not just a study destination',
    description:
      'France gives students exposure to sectors that shape global business and technology: AI, aerospace, defense, mobility, luxury, energy transition, design, and advanced manufacturing.',
  },
  {
    icon: 'translate',
    title: 'English first, French as an advantage',
    description:
      'Hundreds of programs are delivered in English, especially at Master\'s and MBA level. French strengthens your profile over time, but it does not have to block your start.',
  },
  {
    icon: 'business_center',
    title: 'France-India and global business relevance',
    description:
      'For students thinking long term, France matters not only locally but as part of wider European and international business networks, including growing France-India ties across sectors.',
  },
  {
    icon: 'work',
    title: 'A clearer path from study to experience',
    description:
      'Post-study options matter, but more importantly France lets students combine academics, internships, and market exposure in one ecosystem rather than treating the degree in isolation.',
  },
  {
    icon: 'language',
    title: 'Gateway to Europe',
    description:
      'A French degree opens doors across the EU. With Schengen access and internationally recognised qualifications, your career isn\'t limited to one country.',
  },
  {
    icon: 'emoji_events',
    title: 'Academic credibility with market context',
    description:
      'France combines internationally respected universities with the distinct Grandes Ecoles system, giving students both academic credibility and a strong professional signal.',
  },
]

// FAQ schema for rich results — static trusted content, safe for dangerouslySetInnerHTML
const faqSchemaJson = '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is tuition affordable in France for international students?","acceptedAnswer":{"@type":"Answer","text":"Yes. Public universities charge a fraction of UK, US, or Australian fees. Even private institutions and Grandes Ecoles are often more competitive than Anglophone alternatives."}},{"@type":"Question","name":"Are there English-taught programs in France?","acceptedAnswer":{"@type":"Answer","text":"Hundreds of programs are delivered in English, especially at Master\'s and MBA level. French can be added over time — it\'s an asset, not a barrier."}},{"@type":"Question","name":"Can I work in France after graduating?","acceptedAnswer":{"@type":"Answer","text":"Graduates get a residence permit to stay and work in France. You can build your career where you studied — no need to leave the country after graduation."}},{"@type":"Question","name":"Is France a good place to live as a student?","acceptedAnswer":{"@type":"Answer","text":"Healthcare, public transport, culture, and a student-friendly cost of living. France consistently ranks among the best countries for international students."}},{"@type":"Question","name":"Does a French degree work across Europe?","acceptedAnswer":{"@type":"Answer","text":"A French degree opens doors across the EU. With Schengen access and internationally recognised qualifications, your career isn\'t limited to one country."}},{"@type":"Question","name":"How are French universities ranked globally?","acceptedAnswer":{"@type":"Answer","text":"France has over 30 universities in the global top 500 and a Grandes Ecoles system with no equivalent elsewhere. Academic credibility is built in."}}]}'

export default function WhyFrancePage() {
  return (
    <>
      {/* Static trusted JSON-LD — no user input, safe */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchemaJson }} />
      <MarketingHero
        label="Why France"
        title={
          <>
            Study in France because it matters.{' '}
            <span className="public-accent">Not because it is cheap.</span>
          </>
        }
        description="France is one of the few study destinations that combines academic credibility, strong industries, European mobility, and long-term career relevance. For the right student, it is not just a degree destination. It is a serious market."
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
                France is strongest for students who want academic quality tied to real sectors,
                long-term mobility, and international career relevance. We help students understand
                both the opportunity and the process clearly.
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
              The strongest case for France is bigger than tuition. It is about academic quality,
              industry relevance, and the ability to build a credible long-term international path.
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
                A country where mobility, design, industry, and daily life intersect.
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
                Build language, confidence, and cultural fluency from day one.
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
