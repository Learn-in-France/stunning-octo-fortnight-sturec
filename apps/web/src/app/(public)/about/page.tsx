import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        About Learn in France
      </h1>
      <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl">
        Learn in France is a student recruitment platform dedicated to helping international students
        access higher education in France. We combine AI-powered guidance with experienced
        human counsellors to provide a seamless, supportive journey from first inquiry to
        campus arrival.
      </p>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Our mission
          </h2>
          <p className="text-text-secondary leading-relaxed">
            France offers world-class education at accessible tuition rates, yet navigating
            the admission process can be daunting for international students. We exist to
            bridge that gap. Our mission is to make studying in France straightforward,
            transparent, and achievable for qualified students regardless of their country
            of origin.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            How we work
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Every student who joins Learn in France receives personalized program recommendations
            based on their academic profile and goals. Our AI advisor is available around
            the clock to answer questions about programs, procedures, and life in France.
            When you are ready to apply, a dedicated counsellor supports you through every
            step — from Campus France registration to visa interviews to finding accommodation.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            France expertise
          </h2>
          <p className="text-text-secondary leading-relaxed">
            We specialize exclusively in France. Our team understands the nuances of the
            French higher education system, including public and private university
            requirements, Grande Ecole admissions, Campus France procedures, and visa
            regulations. This focus allows us to provide depth and accuracy that generalist
            platforms cannot match.
          </p>
        </section>
      </div>

      <div className="mt-14 pt-8 border-t border-border">
        <p className="text-text-muted mb-4">
          Interested in learning more or working with us?
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
        >
          Get in touch
        </Link>
      </div>
    </div>
  )
}
