import { EditorialCard, MarketingHero, MarketingCTA, SectionHeading } from '@/components/marketing/sections'

const channels = [
  {
    title: 'Students and families',
    description:
      'Use the student route if you want to understand eligibility, shortlist options, documents, or the France process before committing.',
    detail: 'students@learninfrance.com',
  },
  {
    title: 'Universities and institutional partners',
    description:
      'Reach out if you are exploring partnerships, admissions collaboration, or a structured support relationship for students heading to France.',
    detail: 'partners@learninfrance.com',
  },
  {
    title: 'Operational or platform issues',
    description:
      'If you are already inside the system and something is blocked, contact the support path and include the page or workflow you were using.',
    detail: 'support@learninfrance.com',
  },
]

export default function ContactPage() {
  return (
    <>
      <MarketingHero
        label="Contact"
        title={<>Reach the team with the right context.</>}
        description="The fastest way to get useful help is to start in the right lane. Students can begin with the AI advisor or registration flow. Partners and operational issues can come straight to the team."
        actions={[
          { href: '/auth/register', label: 'Create student account' },
          { href: '/book', label: 'Book a consultation', variant: 'secondary' },
        ]}
        aside={
          <EditorialCard title="Good first message" tone="dark">
            <p>
              Include your current study level, intended intake, target degree, preferred city if
              any, and what you are blocked on right now. That usually saves a full roundtrip.
            </p>
          </EditorialCard>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Channels"
            title="Three routes, depending on what you need."
            description="We route questions more effectively when the context is clear from the start."
            align="center"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {channels.map((channel, index) => (
              <EditorialCard key={channel.title} title={channel.title} tone={index === 1 ? 'tinted' : 'light'}>
                <p>{channel.description}</p>
                <p className="mt-4 text-sm font-semibold text-[var(--color-public-teal)]">{channel.detail}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <MarketingCTA
        label="For students"
        title="If you are a student, the platform is the best first contact."
        description="Create an account to access the AI advisor, save your progress, and move into structured support when you are ready."
        primary={{ href: '/auth/register', label: 'Create account' }}
        secondary={{ href: '/chat', label: 'Try the AI advisor' }}
      />
    </>
  )
}
