import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google'

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

// Classical serif used for the LIF wordmark and its associated
// "LEARN IN FRANCE" lockup so the logo matches the reference. Weight
// range kept wide so the mark can render in both heavy (for "LIF")
// and medium (for the subtitle text) without loading two faces.
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://learninfrance.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Learn in France — Overseas Education & Admissions Guidance',
  description: 'France-focused education advisors with a team on the ground in France. We help international students navigate applications, Campus France, visas, housing, and settling in — from first question to first week in France.',
  icons: {
    icon: '/favicon.png',
    apple: '/logo-128.png',
  },
  openGraph: {
    title: 'Learn in France — Overseas Education & Admissions Guidance',
    description: 'France-focused education advisors with a team on the ground in France. We help international students with applications, visas, housing, and settling in.',
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
      className={`${bricolage.variable} ${dmSans.variable} ${jetbrains.variable} ${playfair.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" rel="stylesheet" />
        {/* Organization schema - static trusted content, no XSS risk */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: '{"@context":"https://schema.org","@type":"EducationalOrganization","name":"Learn in France","url":"https://learninfrance.com","logo":"https://learninfrance.com/images/brand-wordmark-square.svg","description":"France-focused education advisors helping international students study in France. Based in France with on-ground support from application through arrival.","areaServed":"France","serviceType":"Education Consulting","email":"info@learninfrance.com","address":{"@type":"PostalAddress","addressCountry":"FR","addressLocality":"France"}}',
          }}
        />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
