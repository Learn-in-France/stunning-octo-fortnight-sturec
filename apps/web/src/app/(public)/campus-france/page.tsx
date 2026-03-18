import Link from 'next/link'

export default function CampusFrancePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        Campus France guide
      </h1>
      <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl">
        Campus France is the national agency responsible for promoting French higher education
        abroad and managing the pre-visa application process for international students. If you
        are applying from a country with a Campus France office, you must go through the
        &ldquo;Etudes en France&rdquo; procedure.
      </p>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            What is the Etudes en France procedure?
          </h2>
          <p className="text-text-secondary leading-relaxed">
            The Etudes en France platform is an online portal where you create a dossier, submit
            your academic documents, choose programs to apply to, and schedule an interview with
            Campus France in your country. It is a mandatory step before you can apply for a
            student visa from countries that have a Campus France presence (known as CEF countries).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Key timelines
          </h2>
          <p className="text-text-secondary leading-relaxed">
            The Etudes en France portal typically opens between October and December for the
            following academic year. Deadlines vary by country and program type, but most fall
            between January and March. Starting early gives you time to gather documents, get
            translations, and handle any issues.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            The Campus France interview
          </h2>
          <p className="text-text-secondary leading-relaxed">
            After submitting your dossier, you will be invited for an interview at the Campus
            France office in your country. The interview is typically 15 to 20 minutes and
            covers your motivation, study plan, and career goals. It is conducted in French
            or English depending on your program and language level.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            How Learn in France helps
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Our counsellors guide you through every step of the Campus France procedure. From
            creating your Etudes en France dossier to preparing for the interview, we ensure
            nothing is missed. Our AI advisor can also answer specific questions about the
            process at any time.
          </p>
        </section>
      </div>

      <div className="mt-14 pt-8 border-t border-border">
        <p className="text-text-muted mb-4">
          Need help navigating Campus France?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/apply"
            className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
          >
            Get started
          </Link>
          <Link
            href="/chat"
            className="inline-block px-6 py-3 text-sm font-semibold text-text-primary bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-colors"
          >
            Ask our AI advisor
          </Link>
        </div>
      </div>
    </div>
  )
}
