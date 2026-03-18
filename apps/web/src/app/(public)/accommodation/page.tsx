import Link from 'next/link'

const options = [
  {
    title: 'CROUS student residences',
    description:
      'Government-subsidized housing managed by CROUS (regional student services). Rooms range from 150 to 500 euros per month depending on city and room type. Apply early as places are limited.',
  },
  {
    title: 'Private student residences',
    description:
      'Managed residences offering furnished studios with utilities included. Typically 400 to 900 euros per month. Easier to book from abroad as they often accept international applications.',
  },
  {
    title: 'Shared apartments (colocation)',
    description:
      'Renting a room in a shared apartment is popular among students. Expect 300 to 700 euros per month depending on the city. Platforms like Leboncoin and La Carte des Colocs are commonly used.',
  },
  {
    title: 'Host families',
    description:
      'Living with a French family provides cultural immersion and language practice. Some programs facilitate homestay placements, particularly for younger or exchange students.',
  },
]

export default function AccommodationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
        Accommodation in France
      </h1>
      <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl">
        Finding accommodation is one of the most important steps when preparing to study in
        France. Here is an overview of your options and what to expect.
      </p>

      <div className="mt-12 space-y-8">
        {options.map((option) => (
          <div key={option.title} className="bg-surface-raised rounded-xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-2">
              {option.title}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {option.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-primary-50 rounded-2xl p-6">
        <h3 className="font-display text-base font-semibold text-primary-800 mb-2">
          CAF housing assistance
        </h3>
        <p className="text-sm text-primary-700 leading-relaxed">
          All students in France, including internationals, can apply for CAF (Caisse
          d&apos;Allocations Familiales) housing aid. This can reduce your rent by 50 to 200
          euros per month depending on your situation and location. You can apply as soon
          as you have a French address and a lease.
        </p>
      </div>

      <div className="mt-14 pt-8 border-t border-border">
        <p className="text-text-muted mb-4">
          Our counsellors help you find and secure accommodation before you arrive.
        </p>
        <Link
          href="/apply"
          className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
        >
          Get support with accommodation
        </Link>
      </div>
    </div>
  )
}
