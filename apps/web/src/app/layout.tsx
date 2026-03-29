import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google'

import { Providers } from '@/providers'

import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://learninfrance.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Learn in France — Overseas Education & Admissions Guidance',
  description: 'Specialist guidance for international students planning to study in France',
  icons: {
    icon: '/favicon.png',
    apple: '/logo-128.png',
  },
  openGraph: {
    title: 'Learn in France — Overseas Education & Admissions Guidance',
    description: 'Specialist guidance for international students planning to study in France',
    images: [{ url: '/images/og-brand.webp', width: 1200, height: 630 }],
    type: 'website',
    siteName: 'Learn in France',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn in France — Overseas Education & Admissions Guidance',
    description: 'Specialist guidance for international students planning to study in France',
    images: ['/images/og-brand.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
