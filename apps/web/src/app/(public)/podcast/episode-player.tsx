'use client'

import { useEffect, useRef, useState } from 'react'

import { sendMauticEvent } from './mautic-tracker'

interface EpisodePlayerProps {
  videoUrl: string
  episodeSlug: string
  episodeTitle: string
  durationSec: number
  /** When true the player is hidden behind the email gate. */
  locked: boolean
}

export function EpisodePlayer({
  videoUrl,
  episodeSlug,
  episodeTitle,
  durationSec,
  locked,
}: EpisodePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const firedRef = useRef<Set<'started' | 'engaged' | 'completed'>>(new Set())
  const [touched, setTouched] = useState(false)

  // When the gate unlocks (locked toggles true → false), reset firing markers
  // so subsequent plays still fire events.
  useEffect(() => {
    if (!locked) firedRef.current = new Set()
  }, [locked])

  // Fire helper — only once per event per session
  function fire(event: 'started' | 'engaged' | 'completed') {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    sendMauticEvent(`/podcast/${episodeSlug}/${event}`, `${episodeTitle} — ${event}`)
  }

  function handlePlay() {
    setTouched(true)
    fire('started')
  }

  function handleTimeUpdate() {
    const v = videoRef.current
    if (!v) return
    const pct = v.currentTime / Math.max(1, durationSec)
    if (v.currentTime >= 30) fire('engaged')
    if (pct >= 0.75) fire('completed')
  }

  function handleEnded() {
    fire('completed')
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-public-navy shadow-card-dark">
      {locked ? (
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-public-navy to-[#11223d] text-center text-public-cream">
          <div className="px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-public-red">
              Member episode
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-snug">
              Enter your email to listen.
            </h3>
            <p className="mt-3 text-sm text-public-cream/70">
              The email gate is just above — once you’re in, all 7 episodes unlock together.
            </p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="aspect-video w-full bg-public-navy"
          src={videoUrl}
          controls
          preload={touched ? 'auto' : 'metadata'}
          playsInline
          onPlay={handlePlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}
    </div>
  )
}
