'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/**
 * Mautic visitor tracker. Loads mtc.js from the configured Mautic instance
 * and exposes a global `mt()` for sending custom pageview events.
 *
 * Usage:
 *   <MauticTracker />              // mount once in the page
 *   sendMauticEvent('/podcast/ep-1/engaged')  // fire a custom event
 */
const MAUTIC_URL = process.env.NEXT_PUBLIC_MAUTIC_URL || 'https://mautic.learninfrance.com'

declare global {
  interface Window {
    MauticTrackingObject?: string
    _mfq?: unknown[]
    mt?: (...args: unknown[]) => void
  }
}

export function MauticTracker({ mauticId }: { mauticId?: string }) {
  useEffect(() => {
    // If we know the contact id from the URL (?mtc=N), set it on the tracking
    // session so subsequent events are attributed to the right contact.
    if (mauticId && typeof window !== 'undefined' && window.mt) {
      window.mt('send', 'pageview', { mautic_device_id: mauticId })
    }
  }, [mauticId])

  return (
    <Script id="mautic-tracker-init" strategy="afterInteractive">{`
      (function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
        w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)},a=d.createElement(t),
        m=d.getElementsByTagName(t)[0];a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
      })(window,document,'script','${MAUTIC_URL}/mtc.js','mt');
    `}</Script>
  )
}

/**
 * Fire a custom Mautic pageview. Mautic segments + campaigns then trigger off
 * the URL pattern (e.g. /podcast/.+/engaged).
 */
export function sendMauticEvent(virtualUrl: string, extraTitle?: string) {
  if (typeof window === 'undefined' || !window.mt) return
  try {
    window.mt('send', 'pageview', {
      url: virtualUrl,
      title: extraTitle ?? virtualUrl,
    })
  } catch {
    // best-effort, tracker may not have loaded yet
  }
}
