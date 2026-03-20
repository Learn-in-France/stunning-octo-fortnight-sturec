import { EditorialCard, MarketingCTA, MarketingHero, SectionHeading } from '@/components/marketing/sections'

const steps = [
  {
    title: 'Hold a valid admission outcome',
    description:
      'Before the visa stage becomes real, the academic file has to be in order. Offer letters, program details, and intake timing should already be settled.',
  },
  {
    title: 'Align Campus France outputs',
    description:
      'Where applicable, the Etudes en France dossier and interview outcome must line up with the university choice and supporting evidence.',
  },
  {
    title: 'Prepare proof, not just forms',
    description:
      'Financial evidence, accommodation, identity documents, and supporting declarations need to be assembled coherently rather than collected at random.',
  },
  {
    title: 'Validate quickly after arrival',
    description:
      'Arrival is not the end of the visa workflow. Students still need to complete the in-country validation steps on time.',
  },
]

const documents = [
  'Passport valid beyond the planned stay',
  'Official admission or enrollment evidence',
  'Proof of funds for living costs',
  'Accommodation evidence or housing plan',
  'Campus France record where required',
  'Insurance and other country-specific additions',
]

export default function VisaPage() {
  return (
    <>
      <MarketingHero
        label="Visa"
        title={<>Visa readiness comes from sequence, not panic.</>}
        description="French visa requirements vary by country, but the same pattern appears every year: students struggle less when they treat visa preparation as the final layer of a larger process rather than a standalone event."
        actions={[
          { href: '/apply', label: 'Get visa support' },
          { href: '/book', label: 'Book a consultation', variant: 'secondary' },
        ]}
        aside={
          <EditorialCard title="Common document stack" tone="tinted">
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-public-burgundy)]" />
                  <p>{document}</p>
                </div>
              ))}
            </div>
          </EditorialCard>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Flow"
            title="Think in four layers."
            description="Most visa mistakes happen because the student is rushing to solve everything at once. A layered process is easier to manage and easier to verify."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {steps.map((step, index) => (
              <EditorialCard key={step.title} title={step.title} tone={index === 2 ? 'dark' : 'light'}>
                <p>{step.description}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Next move"
        title="Get your visa readiness reviewed before the deadline gets close."
        description="Use your student account to keep documents organised and visible, or book a consultation if you need a human review of your situation."
        primary={{ href: '/auth/register', label: 'Create student account' }}
        secondary={{ href: '/book', label: 'Book a consultation' }}
      />
    </>
  )
}
