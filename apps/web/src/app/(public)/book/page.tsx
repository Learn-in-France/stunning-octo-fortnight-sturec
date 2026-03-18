import Link from 'next/link'

export default function BookPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          Book a free consultation
        </h1>
        <p className="mt-5 text-lg text-text-muted leading-relaxed">
          Speak with one of our experienced counsellors about your goals, eligibility, and
          next steps. Consultations are free and carry no obligation.
        </p>

        <div className="mt-12 bg-surface-raised rounded-2xl border border-border p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Scheduling is powered by Cal.com. Create an account first to book a session with a
            counsellor who matches your goals and region.
          </p>
          <Link
            href="/apply"
            className="inline-block px-8 py-3.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
          >
            Get started to book
          </Link>
          <p className="text-xs text-text-muted mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline">
              Sign in
            </Link>{' '}
            to schedule directly from your portal.
          </p>
        </div>
      </div>
    </div>
  )
}
