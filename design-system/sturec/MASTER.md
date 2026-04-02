# STUREC Design System — Source of Truth

## Brand
Learn in France — specialist student recruitment agency, France-only, team on ground in Dijon.

## Style
Trust & Authority + Elegant + Modern. Professional but approachable. Never salesy.

## Colors (Exact Brand Hex)

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Navy | `--color-public-navy` | #0a1629 | Headings, sidebar bg, dark cards, footer |
| French Blue | `--color-primary-600` | #1a3a7a | Primary buttons (internal), links, accents |
| French Red | `--color-public-red` | #c8102e | CTA buttons (public), brand accent, "FRANCE" in logo |
| Blue Light | `--color-primary-400` | #6589c5 | Sidebar accent, icon highlights |
| Cream | `--color-surface` | #f6f0e5 | Page background |
| Cream Light | `--color-surface-raised` | #fffaf3 | Card backgrounds |
| Slate | `--color-public-slate` | #415468 | Body text (public) |
| Muted | `--color-public-muted` | #5a6d7e | Caption text, secondary info |
| Text Primary | `--color-text-primary` | #162436 | Body text (internal) |
| Text Secondary | `--color-text-secondary` | #536171 | Secondary text (internal) |

## Typography

| Usage | Font | Weight | Tracking |
|-------|------|--------|----------|
| Display headings | Bricolage Grotesque | 800 (ExtraBold) | -0.03em |
| Section headings | Bricolage Grotesque | 700-800 | -0.03em |
| Card headings | Bricolage Grotesque | 700 | -0.02em |
| Body text | DM Sans | 400 | normal |
| Labels/caps | DM Sans | 600-700 | 0.12-0.18em |
| Mono/data | JetBrains Mono | 500-600 | normal |

## Layout

| Token | Value |
|-------|-------|
| Card radius | 24px |
| CTA radius | 28px |
| Max width (public) | 84rem (public-shell) |
| Card shadow | 0 20px 60px rgba(10,22,41,0.08) |
| Card shadow hover | 0 28px 70px rgba(10,22,41,0.12) |
| CTA shadow | 0 28px 90px rgba(10,22,41,0.28) |

## Buttons

| Type | Style |
|------|-------|
| Primary (public) | Red pill, gradient, white text, shadow |
| Secondary (public) | Navy outline pill |
| Primary (internal) | bg-primary-600, white text, rounded-lg |
| Ghost | Text-only, hover bg change |

## Cards

| Type | Background | Text |
|------|-----------|------|
| Light | rgba(255,250,243,0.9), white/60 border | Navy headings, slate body |
| Dark | Navy gradient (--gradient-dark) | White headings, white/72 body |
| Tinted | Blue-tinted gradient (--gradient-tinted) | Navy headings, slate body |

## Icons
- Public pages: Material Symbols Outlined (Google Fonts)
- Internal pages: Custom SVG icons (18x18 viewBox, 1.5 stroke)
- Portal quick cards: Material Symbols Outlined

## Interaction Rules
- cursor-pointer on ALL clickable elements
- Hover: 150-300ms transitions, color/shadow change, no layout shift
- Focus: focus-visible:outline-2 focus-visible:outline-offset-2
- Hero images: rotate-1 with hover:rotate-0 (subtle tilt)
- Image breaks: group-hover:scale-105 zoom on hover
- prefers-reduced-motion: all animations/transitions disabled

## Accessibility
- Color contrast: minimum 4.5:1 for normal text
- All images: descriptive alt text
- Form inputs: associated labels
- Focus rings: visible on all interactive elements
- Font loading: display=swap, preconnect hints

## Anti-Patterns (DO NOT)
- No emojis as icons
- No teal/green (#10b981, #0d9488) — use blue spectrum
- No layout-shifting hover effects
- No arbitrary z-index (use 10, 20, 30, 50 scale)
- No gradients with purple/pink
- No aggressive CTAs or urgency language
