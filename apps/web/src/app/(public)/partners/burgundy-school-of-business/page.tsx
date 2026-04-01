import Image from 'next/image'
import type { Metadata } from 'next'

import { EditorialCard, MarketingCTA, MarketingHero, MetricStrip } from '@/components/marketing/sections'
import { BrandName } from '@/components/branding/brand-logo'

export const metadata: Metadata = {
  title: 'Burgundy School of Business — Partner | Learn in France',
  description:
    'Study at Burgundy School of Business in Dijon, France. AACSB & EQUIS accredited Grande Ecole with English-taught programs. Apply with full support from Learn in France.',
}

const accreditations = [
  { value: 'AACSB', label: 'International accreditation' },
  { value: 'EQUIS', label: 'European accreditation' },
  { value: 'Top 1%', label: 'Business schools worldwide' },
]

const reasons = [
  {
    icon: 'verified',
    title: 'Double international accreditation',
    description:
      'BSB holds both AACSB and EQUIS accreditations — placing it in the top 1% of business schools globally. Your degree carries weight anywhere in the world.',
  },
  {
    icon: 'translate',
    title: 'English-taught programs',
    description:
      'Bachelor, MSc, and MBA programs delivered entirely in English. French language courses are included to help you integrate, but never a barrier to entry.',
  },
  {
    icon: 'wine_bar',
    title: 'Unique specialisations',
    description:
      'BSB is renowned for its Wine & Spirits Management and Arts & Cultural Management programs — specialisations you won\'t find at most business schools.',
  },
  {
    icon: 'diversity_3',
    title: 'Truly international campus',
    description:
      'Students from over 70 nationalities, 200+ partner universities worldwide, and mandatory international experience built into every program.',
  },
  {
    icon: 'apartment',
    title: 'Industry connections',
    description:
      'Strong ties with French and international companies. BSB\'s career centre and internship network give students real pathways into the European job market.',
  },
  {
    icon: 'school',
    title: 'Grande Ecole heritage',
    description:
      'Member of the Conf\u00e9rence des Grandes Ecoles — France\'s elite network of higher education institutions, recognised for academic excellence and selectivity.',
  },
]

const dijonReasons = [
  {
    icon: 'savings',
    title: 'Affordable student city',
    body: 'Rent, food, and transport cost significantly less than Paris or Lyon. Your budget stretches further without compromising quality of life.',
  },
  {
    icon: 'train',
    title: '1h40 from Paris by TGV',
    body: 'High-speed rail connects Dijon to Paris Gare de Lyon in under two hours. Lyon, Geneva, and Basel are equally close.',
  },
  {
    icon: 'restaurant',
    title: 'Gastronomic capital',
    body: 'Dijon is the heart of Burgundy wine country and a UNESCO-recognised gastronomy capital. The quality of daily life here is exceptional.',
  },
  {
    icon: 'park',
    title: 'Compact and walkable',
    body: 'A city built for students — everything is within cycling distance. Safe, green, and easy to navigate from day one.',
  },
]

const support = [
  'Eligibility assessment and program matching',
  'Application preparation with counsellor review',
  'Campus France and visa process guidance',
  'Pre-departure logistics and housing support',
  'On-ground welcome and settling-in assistance in Dijon',
  'Ongoing support throughout your studies',
]

export default function BurgundySchoolOfBusinessPage() {
  return (
    <>
      <MarketingHero
        label={
          <>
            <BrandName /> <span className="text-public-slate">&times;</span> Burgundy School of Business
          </>
        }
        title={
          <>
            A world-class business school.{' '}
            <span className="public-accent">In the heart of Burgundy.</span>
          </>
        }
        description="Burgundy School of Business (BSB) in Dijon combines Grande Ecole prestige with double international accreditation. Study in English, build a career in Europe, and enjoy one of France's most affordable and beautiful student cities."
        actions={[
          { href: '/auth/register', label: 'Talk to AI advisor' },
          { href: '#why-bsb', label: 'Why BSB?', variant: 'secondary' },
        ]}
        aside={
          <div className="public-hero-image rotate-1 transition-transform duration-500 hover:rotate-0">
            <Image
              src="/images/bsb-campus.webp"
              alt="International students walking outside Burgundy School of Business campus in autumn"
              width={1600}
              height={900}
              priority
            />
          </div>
        }
        footer={
          <div className="grid gap-5 md:grid-cols-2">
            <EditorialCard title="Official partner" tone="tinted">
              <p className="text-base leading-8">
                <BrandName /> is an official recruitment partner of Burgundy School of Business.
                We work directly with BSB&rsquo;s admissions team to support international students
                from first enquiry through to arrival in Dijon.
              </p>
            </EditorialCard>
            <EditorialCard title="Our team is in Dijon" tone="dark">
              <p className="text-base leading-8">
                Unlike remote agencies, our team lives and works in the same city as BSB.
                We meet you when you arrive, help you settle in, and stay with you throughout your studies.
              </p>
            </EditorialCard>
          </div>
        }
      />

      <MetricStrip items={accreditations} />

      {/* ── Why BSB ── */}
      <section id="why-bsb" className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">Why Burgundy School of Business?</h2>
            <div className="public-divider" />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-public-slate">
              A Grande Ecole with global recognition, unique programs, and a campus that puts students first.
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

      {/* ── Classroom image break ── */}
      <section className="px-4 sm:px-0">
        <div className="public-shell">
          <div className="group relative h-[400px] overflow-hidden rounded-2xl sm:h-[500px]">
            <Image
              src="/images/bsb-classroom.webp"
              alt="Diverse students in a BSB lecture hall with professor presenting on global market strategies"
              width={2752}
              height={1536}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-public-navy/60 to-transparent" />
            <h3 className="absolute bottom-8 left-8 max-w-2xl font-display text-3xl font-extrabold tracking-[-0.03em] text-white sm:bottom-12 sm:left-12 sm:text-4xl">
              Learn from world-class faculty in a truly international classroom.
            </h3>
          </div>
        </div>
      </section>

      {/* ── Why Dijon ── */}
      <section className="py-16 sm:py-24 bg-[var(--color-surface-raised)]">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">Why Dijon?</h2>
            <div className="public-divider" />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-public-slate">
              One of France&rsquo;s best-kept secrets for international students.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {dijonReasons.map((item, index) => (
              <div
                key={item.title}
                className={`public-card public-card-lg relative overflow-hidden ${
                  index === 0 ? 'public-card-dark' : 'public-card-light'
                }`}
              >
                <span className={`material-symbols-outlined ${index === 0 ? 'public-icon-accent' : 'public-icon'}`}>
                  {item.icon}
                </span>
                <h3 className="public-heading-card mt-6">{item.title}</h3>
                <p className={`mt-4 ${index === 0 ? 'public-body-dark' : 'public-body'}`}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Image break ── */}
      <section className="px-4 sm:px-0">
        <div className="public-shell">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="group relative h-[300px] overflow-hidden rounded-2xl sm:h-[380px]">
              <Image
                src="/images/bsb-vineyards.webp"
                alt="Burgundy vineyards in golden autumn light with village in the distance"
                width={2752}
                height={1536}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-public-navy/55 to-transparent" />
              <p className="absolute bottom-6 left-6 right-6 font-display text-lg font-bold tracking-[-0.02em] text-white sm:text-xl">
                A UNESCO World Heritage wine region.
              </p>
            </div>
            <div className="group relative h-[300px] overflow-hidden rounded-2xl sm:h-[380px]">
              <Image
                src="/images/bsb-dijon.webp"
                alt="Charming cobblestone street in Dijon old town with cafes and students"
                width={2752}
                height={1536}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-public-navy/55 to-transparent" />
              <p className="absolute bottom-6 left-6 right-6 font-display text-lg font-bold tracking-[-0.02em] text-white sm:text-xl">
                Dijon — compact, charming, student-friendly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How we support you ── */}
      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mx-auto max-w-4xl grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div className="public-hero-image rotate-1 transition-transform duration-500 hover:rotate-0">
              <Image
                src="/images/bsb-arrival.webp"
                alt="Counsellor greeting international student at a French train station"
                width={2752}
                height={1536}
              />
            </div>
            <EditorialCard title="How Learn in France supports BSB students" tone="dark">
              <div className="space-y-3">
                {support.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="public-dot-red" />
                    <p className="text-base leading-8">{item}</p>
                  </div>
                ))}
              </div>
            </EditorialCard>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Get started"
        title="Ready to study at BSB?"
        description="Talk to our AI advisor to check your eligibility, explore BSB programs, and understand the full application process. Our team in Dijon is ready to support you."
        primary={{ href: '/auth/register', label: 'Talk to AI advisor' }}
        secondary={{ href: '/why-france', label: 'Why France?' }}
      />
    </>
  )
}
