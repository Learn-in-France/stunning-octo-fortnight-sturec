import Link from 'next/link'

import { BrandLogo } from '@/components/branding/brand-logo'

const steps = [
  {
    number: '01',
    title: 'Create your profile',
    description:
      'Sign up in minutes. Tell us about your academic background, goals, and preferences.',
  },
  {
    number: '02',
    title: 'Get personalized guidance',
    description:
      'Our AI advisor helps you explore programs, understand requirements, and plan your journey to France.',
  },
  {
    number: '03',
    title: 'Apply with confidence',
    description:
      'Your dedicated counsellor guides you through applications, visas, and Campus France procedures.',
  },
  {
    number: '04',
    title: 'Start your French adventure',
    description:
      'Arrive prepared with accommodation support, orientation resources, and a community of fellow students.',
  },
]

const stats = [
  { value: '2,500+', label: 'Students placed' },
  { value: '120+', label: 'Partner universities' },
  { value: '35+', label: 'Cities across France' },
  { value: '94%', label: 'Visa success rate' },
]

const valuePropIcons = {
  ai: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
  support: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  france: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
}

const valueProps = [
  {
    icon: valuePropIcons.ai,
    title: 'AI-powered guidance',
    description:
      'Our intelligent advisor understands your profile and goals, recommending programs and next steps tailored to you — available whenever you need it.',
  },
  {
    icon: valuePropIcons.support,
    title: 'Dedicated counsellor support',
    description:
      'A real person who knows the French higher education system inside out. From application strategy to visa interviews, you are never alone.',
  },
  {
    icon: valuePropIcons.france,
    title: 'Deep France expertise',
    description:
      'We specialize in France exclusively. Campus France procedures, university requirements, city guides, accommodation — we have been through it all.',
  },
]

const cities = ['Paris', 'Lyon', 'Toulouse', 'Bordeaux', 'Marseille', 'Strasbourg', 'Lille', 'Nantes']

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal top bar for the root page (not inside (public) layout) */}
      <header className="sticky top-0 z-50 bg-surface-raised/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BrandLogo href="/" variant="inline" markClassName="h-11 w-11 shrink-0" />

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/study-in-france" className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors">
                Study in France
              </Link>
              <Link href="/programs" className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors">
                Programs
              </Link>
              <Link href="/universities" className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors">
                Universities
              </Link>
              <Link href="/about" className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors">
                About
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login" className="px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/apply" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-surface to-surface" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-4">
                Your journey to France starts here
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-[1.1]">
                Study at top French universities with{' '}
                <span className="text-primary-600">personalized guidance</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
                Learn in France combines AI-powered advice with dedicated counsellor support to help
                international students find the right program, navigate applications, and settle
                into life in France.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/apply"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
                >
                  Start your application
                </Link>
                <Link
                  href="/programs"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-text-primary bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-colors"
                >
                  Browse programs
                </Link>
              </div>

              {/* City tags */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                {cities.map((city) => (
                  <span
                    key={city}
                    className="px-3 py-1 text-xs font-medium text-text-muted bg-surface-raised border border-border rounded-full"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-surface-raised">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl sm:text-4xl font-bold text-primary-700 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value propositions */}
        <section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                Why students choose Learn in France
              </h2>
              <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
                We bring together technology and human expertise to make studying in France
                accessible and straightforward.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {valueProps.map((prop) => (
                <div
                  key={prop.title}
                  className="bg-surface-raised rounded-2xl border border-border p-8 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                    {prop.icon}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                    {prop.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{prop.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-28 bg-surface-raised border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                How it works
              </h2>
              <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
                From first inquiry to arrival in France — we support you at every stage.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <span className="font-display text-5xl font-bold text-primary-100">
                    {step.number}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-3xl p-10 sm:p-16 text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Ready to study in France?
              </h2>
              <p className="mt-4 text-lg text-primary-100 max-w-xl mx-auto">
                Create your free profile and get personalized program recommendations in minutes.
                No commitment, no pressure — just honest guidance.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-primary-700 bg-white hover:bg-primary-50 rounded-xl transition-colors shadow-sm"
                >
                  Create free account
                </Link>
                <Link
                  href="/chat"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white border border-primary-400 hover:bg-primary-600 rounded-xl transition-colors"
                >
                  Talk to our AI advisor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-raised border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <BrandLogo href="/" variant="inline" markClassName="h-11 w-11 shrink-0" />
              <p className="mt-4 text-sm text-text-muted leading-relaxed">
                AI-powered guidance for students pursuing higher education in France.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">Study in France</h4>
              <ul className="space-y-2.5">
                <li><Link href="/programs" className="text-sm text-text-muted hover:text-text-primary transition-colors">Programs</Link></li>
                <li><Link href="/universities" className="text-sm text-text-muted hover:text-text-primary transition-colors">Universities</Link></li>
                <li><Link href="/study-in-france" className="text-sm text-text-muted hover:text-text-primary transition-colors">Why France?</Link></li>
                <li><Link href="/campus-france" className="text-sm text-text-muted hover:text-text-primary transition-colors">Campus France</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link href="/visa" className="text-sm text-text-muted hover:text-text-primary transition-colors">Visa Guide</Link></li>
                <li><Link href="/accommodation" className="text-sm text-text-muted hover:text-text-primary transition-colors">Accommodation</Link></li>
                <li><Link href="/book" className="text-sm text-text-muted hover:text-text-primary transition-colors">Book a Consultation</Link></li>
                <li><Link href="/chat" className="text-sm text-text-muted hover:text-text-primary transition-colors">AI Advisor</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="text-sm text-text-muted hover:text-text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-sm text-text-muted hover:text-text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Learn in France. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/contact" className="text-xs text-text-muted hover:text-text-primary transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="text-xs text-text-muted hover:text-text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
