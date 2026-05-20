'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { EmailGate } from '../email-gate'
import { EpisodePlayer } from '../episode-player'
import type { Episode } from '../episodes'
import { EPISODES } from '../episodes'
import { MauticTracker } from '../mautic-tracker'

interface Props {
  episode: Episode
}

export function EpisodeView({ episode }: Props) {
  const sp = useSearchParams()
  const mtc = sp.get('mtc') ?? undefined
  const [unlocked, setUnlocked] = useState(episode.free)

  const linkSuffix = useMemo(() => (mtc ? `?mtc=${encodeURIComponent(mtc)}` : ''), [mtc])

  const others = EPISODES.filter((e) => e.slug !== episode.slug)

  const needsGate = !episode.free && !unlocked

  return (
    <>
      <MauticTracker mauticId={mtc} />
      {needsGate ? (
        <EmailGate
          mauticId={mtc}
          episodeTitle={episode.title}
          episodeSlug={episode.slug}
          onUnlock={() => setUnlocked(true)}
        />
      ) : null}

      <section className="relative overflow-hidden pt-10 pb-6 sm:pt-14 sm:pb-10">
        <div className="public-shell">
          <Link
            href={`/podcast${linkSuffix}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-public-muted transition hover:text-public-navy"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            All episodes
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-public-cream px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-public-navy/70">
                  EP {episode.number} · {episode.length}
                </span>
                {episode.free ? (
                  <span className="rounded-full bg-public-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-public-red">
                    Free listen
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-public-navy sm:text-4xl">
                {episode.title}
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <Image
                  src={`/images/webinar-panelists/${episode.speakerPhoto}`}
                  alt={episode.speaker}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover ring-1 ring-public-navy/10"
                />
                <div>
                  <p className="text-sm font-semibold text-public-navy">{episode.speaker}</p>
                  <p className="text-xs text-public-muted">{episode.speakerRole}</p>
                </div>
              </div>

              <div className="mt-6">
                <EpisodePlayer
                  videoUrl={episode.videoUrl}
                  episodeSlug={episode.slug}
                  episodeTitle={episode.title}
                  durationSec={episode.durationSec}
                  locked={needsGate}
                />
              </div>

              <div className="mt-6 space-y-4">
                {episode.description.split('\n\n').map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-public-slate">
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/podcast${linkSuffix}`}
                  className="rounded-full border border-public-navy/15 bg-white px-5 py-2.5 text-sm font-semibold text-public-navy transition hover:border-public-navy/30 hover:bg-public-cream"
                >
                  ← All episodes
                </Link>
                <Link
                  href={`/book${linkSuffix}`}
                  className="rounded-full bg-public-red px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-public-red/90"
                >
                  Book 15 min with our team
                </Link>
              </div>
            </div>

            {/* Sidebar — other episodes */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-public-red">
                More episodes
              </p>
              <ul className="mt-3 space-y-2">
                {others.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/podcast/${e.slug}${linkSuffix}`}
                      className="group flex gap-3 rounded-2xl border border-public-navy/8 bg-white p-3 transition hover:border-public-navy/20"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-public-cream text-[11px] font-bold text-public-navy">
                        {e.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-public-navy">
                          {e.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-public-muted">
                          {e.speaker} · {e.length}
                          {e.free ? ' · Free' : ''}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
