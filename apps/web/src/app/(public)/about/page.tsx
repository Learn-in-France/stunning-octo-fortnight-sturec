import type { Metadata } from 'next'

import { EditorialCard, MarketingCTA, MarketingHero } from '@/components/marketing/sections'
import { BrandName } from '@/components/branding/brand-logo'

export const metadata: Metadata = {
  title: 'About Us — The Team Behind Learn in France',
  description:
    'Learn in France is a specialist education agency based in Dijon, France. Our team on the ground helps international students with applications, Campus France, visas, housing, and settling in.',
  alternates: { canonical: 'https://learninfrance.com/about' },
  openGraph: {
    title: 'About Learn in France — Our Team in Dijon',
    description: 'A specialist agency with a team on the ground in France.',
    url: 'https://learninfrance.com/about',
  },
}

const values = [
  {
    icon: 'public',
    title: 'France only',
    description: 'We don\'t cover 50 countries. We cover one, deeply. That means better guidance on requirements, processes, and the things that actually trip students up.',
  },
  {
    icon: 'location_on',
    title: 'On the ground',
    description: 'Our team lives and works in France. We meet students when they arrive, help them settle in, and stay with them throughout their studies.',
  },
  {
    icon: 'groups',
    title: 'Tech + human',
    description: 'Our AI advisor handles exploration and common questions 24/7. Counsellors step in for applications, strategy, and the decisions that matter.',
  },
  {
    icon: 'handshake',
    title: 'University partners',
    description: 'We work directly with French universities and Grandes Ecoles. Our partner relationships mean smoother applications and real institutional support.',
  },
]

export default function AboutPage() {
  return (
    <>
      <MarketingHero
        label={<BrandName />}
        title={
          <>
            A specialist agency.{' '}
            <span className="public-accent">Based in France.</span>
          </>
        }
        description="We're not a general-purpose study abroad agency. We're a France specialist with a team on the ground in Dijon. We help international students navigate the French education system from first question to first week in the country."
        actions={[
          { href: '/auth/register', label: 'Talk to AI advisor' },
          { href: '/why-france', label: 'Why France?', variant: 'secondary' },
        ]}
      />

      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">What makes us different</h2>
            <div className="public-divider" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {values.map((item, index) => (
              <div
                key={item.title}
                className={`public-card public-card-lg relative overflow-hidden ${
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

      <section className="py-16 sm:py-24 bg-[var(--color-surface-raised)]">
        <div className="public-shell">
          <div className="mx-auto max-w-3xl">
            <EditorialCard title="Our story" tone="dark">
              <div className="space-y-4 text-base leading-8">
                <p>
                  <BrandName inverse /> was founded with a simple idea: international students
                  deserve better support than a stack of application forms and a good luck email.
                </p>
                <p>
                  Most agencies help students apply and then disappear. The hardest part — navigating
                  Campus France, securing a visa, finding housing, opening a bank account, and settling
                  into a new country — is left entirely to the student.
                </p>
                <p>
                  So we built an agency that stays. Our team is based in Dijon, in the heart of Burgundy.
                  We work with curated university partners, and our support continues long after students
                  land in France.
                </p>
              </div>
            </EditorialCard>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">Where we are</h2>
            <div className="public-divider" />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-public-slate">
              Based in Dijon, France — the capital of Burgundy. A UNESCO World Heritage city with
              excellent universities, affordable living, and a high quality of life for students.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <EditorialCard title="Contact" tone="tinted">
              <div className="space-y-2 text-base">
                <p>Learn in France</p>
                <p>Dijon, Burgundy, France</p>
                <p className="mt-4">
                  <a href="mailto:info@learninfrance.com" className="font-semibold text-public-blue hover:underline">
                    info@learninfrance.com
                  </a>
                </p>
              </div>
            </EditorialCard>
            <EditorialCard title="Our partner" tone="tinted">
              <div className="space-y-2 text-base">
                <p className="font-semibold">Burgundy School of Business</p>
                <p>AACSB &amp; EQUIS accredited Grande Ecole</p>
                <p>Dijon, France</p>
                <p className="mt-4">
                  <a href="/partners/burgundy-school-of-business" className="font-semibold text-public-blue hover:underline">
                    View partnership details &rarr;
                  </a>
                </p>
              </div>
            </EditorialCard>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Get started"
        title="Ready to start your journey?"
        description="Talk to our AI advisor to explore your options, check eligibility, and understand the process. Our team in France is ready to support you."
        primary={{ href: '/auth/register', label: 'Talk to AI advisor' }}
        secondary={{ href: '/your-journey', label: 'See the journey' }}
      />
    </>
  )
}
