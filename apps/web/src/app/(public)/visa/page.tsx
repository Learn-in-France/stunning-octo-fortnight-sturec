import Link from 'next/link'

const steps = [
  {
    step: '1',
    title: 'Get accepted into a program',
    description: 'You need an official acceptance letter from a French institution before applying for a visa.',
  },
  {
    step: '2',
    title: 'Register on Campus France',
    description: 'Complete your Etudes en France dossier, pay the fee, and attend the Campus France interview in your country.',
  },
  {
    step: '3',
    title: 'Apply for a student visa (VLS-TS)',
    description: 'Submit your visa application at the French consulate in your country with the required documents.',
  },
  {
    step: '4',
    title: 'Validate your visa in France',
    description: 'Within three months of arrival, validate your VLS-TS visa online to obtain your residence permit.',
  },
]

export default function VisaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        Visa guide for France
      </h1>
      <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl">
        A step-by-step overview of the French student visa process. Requirements vary by
        nationality — our counsellors can help with your specific situation.
      </p>

      <div className="mt-12 space-y-8">
        {steps.map((s) => (
          <div key={s.step} className="flex items-start gap-5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 font-display font-bold text-lg">
              {s.step}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {s.title}
              </h2>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-surface-raised rounded-2xl border border-border p-6">
        <h3 className="font-display text-base font-semibold text-text-primary mb-2">
          Common required documents
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            Valid passport (at least 3 months beyond your planned stay)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            Acceptance letter from a French institution
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            Proof of financial resources (approx. 615 euros/month)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            Proof of accommodation in France
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            Campus France attestation
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            Travel insurance covering your stay
          </li>
        </ul>
      </div>

      <div className="mt-14 pt-8 border-t border-border">
        <p className="text-text-muted mb-4">
          Need help with your visa application?
        </p>
        <Link
          href="/apply"
          className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
        >
          Get personalized support
        </Link>
      </div>
    </div>
  )
}
