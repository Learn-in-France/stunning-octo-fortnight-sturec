import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { EPISODES, getEpisode } from '../episodes'
import { EpisodeView } from './episode-view'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return EPISODES.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const ep = getEpisode(slug)
  if (!ep) {
    return { title: 'Episode not found | Learn in France' }
  }
  return {
    title: `EP ${ep.number} — ${ep.title} | From India to France`,
    description: ep.teaser,
    alternates: { canonical: `https://learninfrance.com/podcast/${ep.slug}` },
    openGraph: {
      title: ep.title,
      description: ep.teaser,
      url: `https://learninfrance.com/podcast/${ep.slug}`,
      type: 'video.other',
    },
  }
}

export default async function EpisodePage({ params }: PageProps) {
  const { slug } = await params
  const ep = getEpisode(slug)
  if (!ep) notFound()
  return (
    <Suspense fallback={null}>
      <EpisodeView episode={ep} />
    </Suspense>
  )
}
