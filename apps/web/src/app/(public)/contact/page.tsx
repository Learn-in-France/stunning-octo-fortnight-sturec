import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        Contact us
      </h1>
      <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl">
        Have a question or want to learn more about how Learn in France can help you study in France?
        We would love to hear from you.
      </p>

      <div className="mt-12 grid sm:grid-cols-2 gap-8">
        <div className="bg-surface-raised rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary mb-2">
            For students
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            The fastest way to get personalized help is to create a free account and chat with
            our AI advisor. For general inquiries, reach us at:
          </p>
          <p className="text-sm font-medium text-primary-600">students@sturec.com</p>
        </div>

        <div className="bg-surface-raised rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary mb-2">
            For universities and partners
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Interested in partnering with Learn in France to recruit international students? Contact our
            partnerships team:
          </p>
          <p className="text-sm font-medium text-primary-600">partners@sturec.com</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-text-muted mb-4">
          Prefer to get started right away?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/apply"
            className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
          >
            Create free account
          </Link>
          <Link
            href="/book"
            className="inline-block px-6 py-3 text-sm font-semibold text-text-primary bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-colors"
          >
            Book a consultation
          </Link>
        </div>
      </div>
    </div>
  )
}
