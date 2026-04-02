# Student Portal — Design Overrides

Overrides MASTER.md for all pages under `/portal/*`.

## Navigation
6 items only: Dashboard, AI Advisor, Profile, Documents, Bookings, Notifications.
No: Applications, Checklist, Progress, Visa Readiness, Support.

## Dashboard Layout
Single page = primary operational center. Sections in order:

1. **Welcome banner** — gradient (navy → blue → red), greeting, primary CTA "Open AI Advisor"
2. **Stage progress** — friendly stage name, progress bar, "what happens next" text
3. **Your counsellor** — card with name, photo placeholder, contact method. Shows "Awaiting counsellor" before assignment.
4. **What we need from you** — pending items checklist (replaces Checklist page)
5. **Upcoming meeting** — next booking with date/time
6. **AI Advisor card** — "Recommended next step" with link to chat
7. **Quick links** — Documents, Bookings (2-col grid with icons)

## Email Verification Banner
Persistent at top of portal for unverified email/password users:
- Cream/amber background, not red (it's informational, not an error)
- Text: "Verify your email to unlock booking and document sharing"
- CTA: "Resend verification email"
- Dismiss: no — stays until verified

## Wait-State Messages
During processing stages, show reassurance instead of empty states:
- visa_submitted: "Your visa application is being processed. Average wait: 3-6 weeks. No action needed."
- intake_completed: "Your profile is being reviewed. A counsellor will be assigned shortly."

## Document Sharing States
Three visual states per document:
- **Private** (default): muted icon, "Only you can see this"
- **Shared**: blue highlight, "Shared with [counsellor name]"
- **Revoked**: muted, strikethrough-style, "Access revoked"

## Color Usage
- Dashboard cards: use internal card component (bg surface-raised, border white/60)
- Welcome banner: gradient matches public CTA section
- Stage badge: use STAGE_STUDENT_LABELS, not internal names
- No score bars or assessment scores visible to student
