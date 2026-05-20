import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PodcastListing } from './podcast-listing'

export const metadata: Metadata = {
  title: 'From India to France — The Podcast | Learn in France',
  description:
    'Eight short episodes from the BSB × Learn in France live session. The Burgundy School of Business international team, an Indian industry veteran and a student ambassador answer the questions that decide a Master’s in France — ROI, visa, jobs, scholarships, and language.',
  alternates: { canonical: 'https://learninfrance.com/podcast' },
  openGraph: {
    title: 'From India to France — The Podcast',
    description:
      'Honest 2-4 minute episodes on ROI, visa, jobs, scholarships and language — from the BSB international team + a 15-year industry veteran.',
    url: 'https://learninfrance.com/podcast',
  },
}

export default function PodcastPage() {
  return (
    <Suspense fallback={null}>
      <PodcastListing />
    </Suspense>
  )
}
