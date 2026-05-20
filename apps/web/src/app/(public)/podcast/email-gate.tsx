'use client'

import { useEffect, useRef, useState } from 'react'

const COOKIE_NAME = 'lif_podcast_email'
const MAUTIC_URL = process.env.NEXT_PUBLIC_MAUTIC_URL || 'https://mautic.learninfrance.com'
const MAUTIC_FORM_ID = process.env.NEXT_PUBLIC_MAUTIC_PODCAST_FORM_ID || ''

function setCookie(name: string, value: string, days = 365) {
  const exp = new Date(Date.now() + days * 86400_000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

interface EmailGateProps {
  /** If a Mautic contact id was passed via ?mtc=N, the gate auto-unlocks. */
  mauticId?: string
  /** Title of the episode the visitor is trying to listen to. */
  episodeTitle: string
  /** Slug — used to attribute the email-capture event to a specific episode. */
  episodeSlug: string
  /** Called once the visitor is allowed through (email submitted or known). */
  onUnlock: () => void
}

export function EmailGate({ mauticId, episodeTitle, episodeSlug, onUnlock }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [unlocked, setUnlocked] = useState(false)

  // Auto-unlock for known contacts (came from a Mautic email link)
  // or returning visitors (cookie set on previous capture)
  useEffect(() => {
    if (mauticId) {
      setUnlocked(true)
      onUnlock()
      return
    }
    const prior = getCookie(COOKIE_NAME)
    if (prior) {
      setUnlocked(true)
      onUnlock()
    }
  }, [mauticId, onUnlock])

  useEffect(() => {
    if (!unlocked) inputRef.current?.focus()
  }, [unlocked])

  if (unlocked) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('That doesn’t look like a valid email')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      // Submit directly to the Mautic form endpoint. Mautic auto-tags
      // the contact and triggers the “new podcast subscriber” campaign.
      if (MAUTIC_FORM_ID) {
        const fd = new FormData()
        fd.append(`mauticform[email]`, value)
        fd.append(`mauticform[formId]`, MAUTIC_FORM_ID)
        fd.append(`mauticform[return]`, '')
        fd.append(`mauticform[messenger]`, '1')
        fd.append(`mauticform[origin_episode]`, episodeSlug)
        await fetch(`${MAUTIC_URL}/form/submit?formId=${MAUTIC_FORM_ID}`, {
          method: 'POST',
          mode: 'no-cors',
          body: fd,
        })
      }
      setCookie(COOKIE_NAME, value)
      setUnlocked(true)
      onUnlock()
    } catch {
      // Even if the Mautic request fails (network / CORS),
      // we cookie the email so the user isn't blocked.
      setCookie(COOKIE_NAME, value)
      setUnlocked(true)
      onUnlock()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-public-navy/80 px-4 py-10 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_30px_80px_rgba(10,22,41,0.4)]">
        <div className="bg-public-navy px-7 py-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-public-red">
            From the Director’s Desk
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-snug">Continue the series — free.</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-7 py-6">
          <p className="text-sm leading-relaxed text-public-slate">
            Hear directly from <strong className="text-public-navy">Rudy Hallou</strong>{' '}
            (International Operations Director, Burgundy School of Business) and{' '}
            <strong className="text-public-navy">Ankit Pandey</strong> (15 years India → France) —
            plus 5 more episodes including the visa pathway, scholarships, and the 62-minute live
            session.
          </p>

          <label htmlFor="podcast-email" className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-public-muted">
            Your email
          </label>
          <input
            ref={inputRef}
            id="podcast-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-public-navy/15 bg-public-cream/40 px-4 py-3 text-public-navy outline-none transition focus:border-public-red focus:bg-white"
            disabled={submitting}
          />
          {error ? (
            <p className="mt-2 text-xs text-public-red">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-public-red px-6 py-3 text-sm font-semibold text-white shadow-cta transition hover:bg-public-red/90 disabled:opacity-60"
          >
            {submitting ? 'Unlocking…' : `Listen — “${episodeTitle.slice(0, 60)}${episodeTitle.length > 60 ? '…' : ''}”`}
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-public-muted">
            No spam, just the rest of the series. Unsubscribe with one click. We’re a Dijon-based
            team helping Indian students move to France.
          </p>
        </form>
      </div>
    </div>
  )
}
