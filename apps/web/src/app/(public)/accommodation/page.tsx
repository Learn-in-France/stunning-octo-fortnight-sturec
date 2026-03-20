import { EditorialCard, MarketingCTA, MarketingHero, SectionHeading } from '@/components/marketing/sections'

const options = [
  {
    title: 'CROUS residences',
    description:
      'The most affordable option for many students, but demand is high and supply is limited. Good planning matters more than wishful timing.',
  },
  {
    title: 'Private student residences',
    description:
      'Often easier for international students to secure remotely. Usually more expensive, but clearer to book before arrival.',
  },
  {
    title: 'Shared apartments',
    description:
      'Popular in larger cities and often the best value after arrival, though deposits, guarantor issues, and timing can complicate the search.',
  },
  {
    title: 'Temporary landing options',
    description:
      'Some students need a short first stop while they complete viewings or paperwork. Planning this upfront reduces arrival stress.',
  },
]

const housingSignals = [
  'City choice affects rent more than almost any other decision after tuition',
  'Deposits, guarantors, and first-month cash needs should be budgeted early',
  'CAF support can help, but students should not assume instant reimbursement',
]

export default function AccommodationPage() {
  return (
    <>
      <MarketingHero
        label="Accommodation"
        title={<>Housing decisions shape the whole first month in France.</>}
        description="Accommodation is not an afterthought. It affects budget, visa evidence, arrival stress, and how quickly a student settles. The right approach depends on timing, city, and risk tolerance."
        actions={[
          { href: '/apply', label: 'Get support with planning' },
          { href: '/book', label: 'Discuss with a counsellor', variant: 'secondary' },
        ]}
        aside={
          <EditorialCard title="What to keep in mind" tone="dark">
            <div className="space-y-3">
              {housingSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/75" />
                  <p>{signal}</p>
                </div>
              ))}
            </div>
          </EditorialCard>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Options"
            title="Choose the housing route that fits your stage."
            description="Not every student should target the same kind of accommodation at the same moment."
            align="center"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {options.map((option, index) => (
              <EditorialCard key={option.title} title={option.title} tone={index % 2 === 0 ? 'light' : 'tinted'}>
                <p>{option.description}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Preparation"
        title="Plan housing as part of the wider move, not as a last-week scramble."
        description="Create your profile and keep the accommodation conversation tied to your admissions, visa, and arrival milestones."
        primary={{ href: '/auth/register', label: 'Create account' }}
        secondary={{ href: '/contact', label: 'Contact the team' }}
      />
    </>
  )
}
