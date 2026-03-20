import Image from 'next/image'

import { EditorialCard, MarketingCTA, MarketingHero, SectionHeading } from '@/components/marketing/sections'

const principles = [
  {
    title: 'France only',
    description:
      'We are deliberately narrow. That focus lets us stay useful on requirements, process, deadlines, and expectations that general study-abroad platforms often flatten.',
  },
  {
    title: 'Process over promises',
    description:
      'Students do not need louder claims. They need clearer next actions, honest guidance, and a system that keeps momentum through long application cycles.',
  },
  {
    title: 'Human judgement still matters',
    description:
      'The AI advisor improves speed and accessibility. Counsellors still own nuance, escalation, and the judgement calls that affect admissions outcomes.',
  },
]

const whatWeOffer = [
  'Guides and tools for students still comparing cities, degrees, and budget ranges',
  'A personal student account that organises your profile, documents, and next steps',
  'Counsellor support for applications, shortlisting, and admissions strategy',
  'AI advisor available around the clock for common questions and exploration',
]

export default function AboutPage() {
  return (
    <>
      <MarketingHero
        label="About"
        title={<>A specialist service for students choosing France.</>}
        description="Learn in France exists because the hard part of studying abroad is rarely inspiration. It is translating interest into a concrete plan. We help students make that transition with clear guidance, structured support, and honest expectations."
        actions={[
          { href: '/apply', label: 'Start your plan' },
          { href: '/contact', label: 'Talk to us', variant: 'secondary' },
        ]}
        aside={
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/about-counsellor.webp"
                alt="Education counsellor reviewing documents with a student"
                width={1600}
                height={900}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <EditorialCard title="What we offer" tone="dark">
              <div className="space-y-3">
                {whatWeOffer.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white/75" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </EditorialCard>
          </div>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Principles"
            title="Grounded in admissions reality."
            description="Everything on the site should make a student feel more oriented, not more overwhelmed."
            align="center"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {principles.map((principle) => (
              <EditorialCard key={principle.title} title={principle.title} tone="light">
                <p>{principle.description}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 pt-4 sm:pb-14">
        <div className="public-shell">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <EditorialCard title="How we work" tone="tinted">
              <p className="text-base leading-8 text-[color:var(--color-public-slate)]">
                Students can begin in whichever mode suits them best: reading guides, exploring the
                catalog, booking a consultation, or starting with the AI advisor. From there, we
                help them move into a structured support environment where counsellors and
                technology work together to keep the process on track.
              </p>
            </EditorialCard>
            <div className="overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(10,22,41,0.08)]">
              <Image
                src="/images/about-brochure.webp"
                alt="Reviewing a university program brochure"
                width={1600}
                height={900}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Get started"
        title="If France is your destination, we can help you get there."
        description="Create a profile, explore programs, or speak to the team if you want to understand how the process works before committing."
        primary={{ href: '/auth/register', label: 'Create account' }}
        secondary={{ href: '/contact', label: 'Contact Learn in France' }}
      />
    </>
  )
}
