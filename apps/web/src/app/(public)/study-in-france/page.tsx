import Link from 'next/link'

const reasons = [
  {
    title: 'World-class education',
    description:
      'France is home to some of the most prestigious universities and Grandes Ecoles in the world. Sorbonne, Sciences Po, HEC Paris, Ecole Polytechnique — the list goes on.',
  },
  {
    title: 'Affordable tuition',
    description:
      'Public university tuition starts at just 243 euros per year for EU students and around 2,770 euros for non-EU students at the licence level — a fraction of what comparable programs cost elsewhere.',
  },
  {
    title: 'Rich cultural experience',
    description:
      'From the vibrant streets of Paris to the Mediterranean coast of Marseille, France offers an unmatched cultural experience. Museums, cuisine, architecture, and a central location in Europe.',
  },
  {
    title: 'Career opportunities',
    description:
      'France is the second-largest economy in Europe. International graduates can apply for a job-search visa (APS) to stay and work after completing their studies.',
  },
  {
    title: 'English-taught programs',
    description:
      'Over 1,500 programs are taught entirely in English across France, particularly at the master and MBA level. You do not need to speak French to start.',
  },
  {
    title: 'Student-friendly country',
    description:
      'Subsidized housing (CAF), discounted transport, free healthcare, and student meal plans at 3.30 euros make France one of the most affordable places to be a student.',
  },
]

export default function StudyInFrancePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        Why study in France?
      </h1>
      <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl">
        France welcomes over 400,000 international students each year, making it one of the top
        destinations for higher education worldwide. Here is why so many students choose France.
      </p>

      <div className="mt-12 grid sm:grid-cols-2 gap-8">
        {reasons.map((reason) => (
          <div key={reason.title}>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-2">
              {reason.title}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {reason.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-14 pt-8 border-t border-border">
        <p className="text-text-muted mb-4">
          Ready to explore your options?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/programs"
            className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
          >
            Browse programs
          </Link>
          <Link
            href="/chat"
            className="inline-block px-6 py-3 text-sm font-semibold text-text-primary bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-colors"
          >
            Talk to AI advisor
          </Link>
        </div>
      </div>
    </div>
  )
}
