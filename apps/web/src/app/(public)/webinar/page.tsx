import type { Metadata } from 'next'

import { WebinarLanding } from './webinar-landing'

export const metadata: Metadata = {
  title: 'From India to France — Live Webinar | Learn in France',
  description:
    'Live with the Burgundy School of Business international team and a BSB student ambassador, moderated by Learn in France. Friday, 15 May 2026 at 6:00 PM IST. Reserve your seat — only 200 spots.',
  alternates: { canonical: 'https://learninfrance.com/webinar' },
  openGraph: {
    title: 'From India to France — Live Webinar',
    description:
      'BSB international team + student ambassador, moderated by Learn in France. Friday, 15 May at 6 PM IST. RSVP now.',
    url: 'https://learninfrance.com/webinar',
  },
}

interface PageProps {
  searchParams: Promise<{ t?: string }>
}

export default async function WebinarPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <WebinarLanding token={params.t ?? null} />
}
