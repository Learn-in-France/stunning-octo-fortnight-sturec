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

export const metadata: Metadata = {
  title: 'Learn in France — Overseas Education & Student Recruitment',
  description: 'AI-powered student recruitment for studying in France',
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
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
