import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Advisor — Free Guidance on Studying in France | Learn in France',
  description: 'Talk to our AI advisor for free guidance on studying in France. Explore eligibility, understand the process, and get connected with a human counsellor when you are ready.',
  alternates: { canonical: 'https://learninfrance.com/advisor' },
  openGraph: {
    title: 'AI Advisor — Free Guidance on Studying in France',
    description: 'Explore eligibility, understand the process, and connect with a counsellor. Our AI advisor is available 24/7 — no commitment needed.',
    url: 'https://learninfrance.com/advisor',
  },
}

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return children
}
