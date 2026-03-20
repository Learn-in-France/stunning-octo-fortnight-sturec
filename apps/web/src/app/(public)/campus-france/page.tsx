import { EditorialCard, MarketingCTA, MarketingHero, SectionHeading } from '@/components/marketing/sections'

const stages = [
  {
    title: 'Create the dossier early',
    description:
      'Open the Etudes en France profile as soon as your country window opens. Waiting until applications are almost due compresses every later step.',
  },
  {
    title: 'Prepare documents for review',
    description:
      'Transcripts, passports, translations, motivation material, and program choices need to be internally consistent. Small inconsistencies slow everything down.',
  },
  {
    title: 'Handle the interview properly',
    description:
      'The interview is usually short, but it tests whether your study plan is coherent. Students need a story that connects academics, destination, and next step.',
  },
  {
    title: 'Carry the dossier into visa readiness',
    description:
      'Campus France is not the end of the process. Its output feeds directly into later visa and departure steps.',
  },
]

const mistakes = [
  'Treating Campus France as a formality instead of a decision checkpoint',
  'Uploading documents late and then rushing translations or corrections',
  'Choosing programs without a coherent academic or career narrative',
]

export default function CampusFrancePage() {
  return (
    <>
      <MarketingHero
        label="Campus France"
        title={<>Campus France is a workflow, not a box to tick.</>}
        description="For students in CEF countries, the Campus France process is one of the most important steps in moving to France. The dossier, timing, and interview all influence how smooth the rest of the journey becomes."
        actions={[
          { href: '/apply', label: 'Get guided support' },
          { href: '/chat', label: 'Ask a question first', variant: 'secondary' },
        ]}
        aside={
          <EditorialCard title="Where students lose momentum" tone="dark">
            <div className="space-y-3">
              {mistakes.map((mistake) => (
                <div key={mistake} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/75" />
                  <p>{mistake}</p>
                </div>
              ))}
            </div>
          </EditorialCard>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Process"
            title="A simpler way to think about Etudes en France."
            description="Students do better when the procedure is broken into clear operational stages instead of one intimidating block."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {stages.map((stage, index) => (
              <EditorialCard key={stage.title} title={stage.title} tone={index === 1 ? 'dark' : 'light'}>
                <p>{stage.description}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Ready to start"
        title="Use the platform to keep the procedure visible."
        description="Create your account to track requirements, ask questions as they arise, and move through the process with actual support instead of scattered notes."
        primary={{ href: '/auth/register', label: 'Create account' }}
        secondary={{ href: '/contact', label: 'Talk to the team' }}
      />
    </>
  )
}
