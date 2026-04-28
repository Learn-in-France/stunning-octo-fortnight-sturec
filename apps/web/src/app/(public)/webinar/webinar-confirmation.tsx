interface WebinarConfirmationProps {
  firstName: string
  email: string
}

export function WebinarConfirmation({ firstName, email }: WebinarConfirmationProps) {
  const calendarUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' +
    encodeURIComponent('From India to France — Live Webinar') +
    '&dates=20260511T123000Z/20260511T133000Z' +
    '&details=' +
    encodeURIComponent(
      'Live with BSB students + Indian professional in France. Microsoft Teams link will be sent 24h before via email and WhatsApp.\n\nLearn in France · learninfrance.com',
    ) +
    '&location=' +
    encodeURIComponent('Microsoft Teams (link sent 24h before)')

  return (
    <div className="rounded-3xl border border-public-blue/25 bg-white p-8 shadow-[0_30px_60px_-30px_rgba(10,22,41,0.25)]">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-public-blue/10 text-public-blue">
          <span className="material-symbols-outlined !text-3xl">check_circle</span>
        </span>
        <div>
          <p className="public-phase-label !tracking-[0.18em] text-public-blue">You&rsquo;re in</p>
          <h3 className="text-2xl font-semibold tracking-tight text-public-navy">
            Seat confirmed, {firstName.split(' ')[0]}.
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm leading-6 text-public-slate">
        <div className="rounded-2xl border border-public-navy/10 bg-public-cream/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-public-blue">
            What happens next
          </p>
          <ul className="mt-3 space-y-2.5 text-public-navy">
            <li className="flex gap-2">
              <span className="material-symbols-outlined !text-base text-public-red">mail</span>
              Confirmation email sent to <span className="font-medium">{email}</span>
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined !text-base text-public-red">videocam</span>
              Microsoft Teams join link arrives 24 hours before — by email and WhatsApp
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined !text-base text-public-red">support_agent</span>
              A Learn in France advisor will reach out after the session to discuss your scholarship
              eligibility and application timeline
            </li>
          </ul>
        </div>

        <p>
          <strong className="text-public-navy">Sunday, 11 May 2026</strong>
          {' · '}6:00 PM IST
          {' · '}45 min + 20 min Q&amp;A
        </p>

        <a
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="public-button-secondary inline-flex w-full justify-center sm:w-auto"
        >
          <span className="material-symbols-outlined !text-base">event</span>
          Add to Google Calendar
        </a>
      </div>

      <p className="mt-6 text-xs leading-5 text-public-muted">
        Spotted a mistake?{' '}
        <a href="mailto:info@learninfrance.com" className="underline hover:text-public-navy">
          Email us
        </a>{' '}
        and we&rsquo;ll fix your details.
      </p>
    </div>
  )
}
