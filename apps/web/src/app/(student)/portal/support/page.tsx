'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSubmitSupportRequest } from '@/features/student-portal/hooks/use-student-portal'

// ─── FAQ data ───────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    question: 'How do I update my profile information?',
    answer: 'Go to your Profile page and click the "Edit Profile" button. You can update your academic background, preferences, and contact information there.',
  },
  {
    question: 'What documents do I need to upload?',
    answer: 'Check the Checklist page for a complete list of required documents. Common requirements include your passport, academic transcripts, statement of purpose, and financial proof.',
  },
  {
    question: 'How long does document verification take?',
    answer: 'Most documents are reviewed within 2-3 business days. If a document is rejected, you will receive a notification with feedback on what needs to be corrected.',
  },
  {
    question: 'How do I book a consultation with my counsellor?',
    answer: 'Visit the Bookings page and click "Book Consultation". You will be able to choose a time slot that works for both you and your assigned counsellor.',
  },
  {
    question: 'What is Campus France and do I need to register?',
    answer: 'Campus France is the French national agency for the promotion of higher education. Most international students need to register on their platform as part of the visa application process. Your counsellor will guide you through this step.',
  },
  {
    question: 'What if my visa application is rejected?',
    answer: 'If your visa is not approved, your counsellor will help you understand the reasons and advise on next steps, which may include reapplying or exploring alternative options.',
  },
]

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'documents', label: 'Documents' },
  { value: 'application', label: 'Application' },
  { value: 'visa', label: 'Visa' },
  { value: 'payment', label: 'Payment' },
  { value: 'technical', label: 'Technical Issue' },
] as const

export default function SupportPage() {
  const submitSupport = useSubmitSupportRequest()

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    try {
      await submitSupport.mutateAsync({
        subject: subject.trim(),
        message: message.trim(),
        category: category as 'general' | 'documents' | 'application' | 'visa' | 'payment' | 'technical',
      })
      setSubmitted(true)
      setSubject('')
      setMessage('')
      setCategory('general')
    } catch {
      // Error is shown via submitSupport.isError below
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
          Help & Support
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Find answers to common questions or reach out to our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ section */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary font-display mb-2">
            Frequently Asked Questions
          </h2>
          {FAQ_ITEMS.map((item, idx) => (
            <FaqCard key={idx} question={item.question} answer={item.answer} />
          ))}
        </div>

        {/* Contact section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>

            {submitted ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium mb-1">Request submitted</p>
                <p className="text-xs text-emerald-600">
                  Your support request has been received. Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs text-emerald-700 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-muted mb-4">
                  Can not find what you are looking for? Send us a message and we will get back to you within 24 hours.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your question"
                      required
                      maxLength={200}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      required
                      maxLength={5000}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!subject.trim() || !message.trim()}
                    loading={submitSupport.isPending}
                  >
                    Send Message
                  </Button>
                  {submitSupport.isError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      <p>Something went wrong. Please try again, or email us directly at{' '}
                        <a href="mailto:info@learninfrance.com" className="font-medium underline hover:no-underline">
                          info@learninfrance.com
                        </a>
                      </p>
                    </div>
                  )}
                </form>
              </>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <QuickLink
                label="Chat with AI Advisor"
                href="/portal/chat"
                description="Get instant answers from our AI assistant"
              />
              <QuickLink
                label="Book a Consultation"
                href="/portal/bookings"
                description="Schedule a meeting with your counsellor"
              />
              <QuickLink
                label="Visa Readiness"
                href="/portal/visa-readiness"
                description="Check your visa preparation progress"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-text-primary font-display mb-2">
        {question}
      </p>
      <p className="text-xs text-text-muted leading-relaxed">
        {answer}
      </p>
    </Card>
  )
}

function QuickLink({ label, href, description }: { label: string; href: string; description: string }) {
  return (
    <Link
      href={href}
      className="block p-3 rounded-lg bg-surface-sunken/50 hover:bg-surface-sunken transition-colors"
    >
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <p className="text-xs text-text-muted mt-0.5">{description}</p>
    </Link>
  )
}
