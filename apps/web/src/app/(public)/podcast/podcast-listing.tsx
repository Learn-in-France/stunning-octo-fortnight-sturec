'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { EPISODES } from './episodes'
import { MauticTracker } from './mautic-tracker'

export function PodcastListing() {
  const sp = useSearchParams()
  const mtc = sp.get('mtc') ?? undefined

  // Append ?mtc=<id> to all episode links so the contact identifier flows
  // through and the email gate stays invisible for known leads.
  const linkSuffix = useMemo(() => (mtc ? `?mtc=${encodeURIComponent(mtc)}` : ''), [mtc])

  return (
    <>
      <MauticTracker mauticId={mtc} />
      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="public-shell">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-public-red">
              From India to France · The podcast
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-public-navy sm:text-5xl">
              Eight short episodes. The honest picture of a Master’s in France.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-public-slate sm:text-lg">
              Cut from the live BSB × Learn in France session on 15 May 2026. The Burgundy
              School of Business international team, an Indian industry veteran (15 years
              France) and a student ambassador answer the questions that decide a study-abroad
              choice — ROI, visa, jobs, scholarships, and language.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EPISODES.map((ep) => (
              <Link
                key={ep.slug}
                href={`/podcast/${ep.slug}${linkSuffix}`}
                className="group flex h-full flex-col gap-4 rounded-card border border-public-navy/8 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-public-cream px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-public-navy/70">
                    EP {ep.number}
                  </span>
                  {ep.free ? (
                    <span className="rounded-full bg-public-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-public-red">
                      Free listen
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-public-navy/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-public-navy/70">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      Email
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-semibold leading-snug text-public-navy">
                  {ep.title}
                </h2>

                <p className="text-sm leading-relaxed text-public-slate">{ep.teaser}</p>

                <div className="mt-auto flex items-center gap-3 border-t border-public-navy/8 pt-4">
                  <Image
                    src={`/images/webinar-panelists/${ep.speakerPhoto}`}
                    alt={ep.speaker}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-public-navy/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-public-navy">
                      {ep.speaker}
                    </p>
                    <p className="truncate text-[11px] text-public-muted">{ep.speakerRole}</p>
                  </div>
                  <span className="rounded-full bg-public-navy px-3 py-1 text-[11px] font-semibold text-white">
                    {ep.length}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-card border border-public-navy/8 bg-gradient-tinted p-7 sm:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-public-red">
              About the series
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-public-navy">
              Direct from the people who actually run it.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-public-slate sm:text-base">
              Rudy Hallou is the International Operations Director at Burgundy School of
              Business — he decides which Indian students get admitted and which get
              scholarships. Moumita Biswas is BSB’s Regional Representative for South Asia.
              Ankit Pandey moved from India to France 15 years ago and has worked in the French
              job market ever since. No marketing voice, no agency pitch. Just the people who
              know.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
