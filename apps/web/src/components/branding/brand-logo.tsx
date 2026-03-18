import Link from 'next/link'

type BrandVariant = 'inline' | 'compact' | 'stacked' | 'mark'

interface BrandLogoProps {
  href?: string
  variant?: BrandVariant
  className?: string
  markClassName?: string
  textClassName?: string
  subtitleClassName?: string
  showTagline?: boolean
  inverse?: boolean
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="brand-blue" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#0a4a8f" />
          <stop offset="100%" stopColor="#1f5fb5" />
        </linearGradient>
        <linearGradient id="brand-red" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#c93833" />
          <stop offset="100%" stopColor="#e4504a" />
        </linearGradient>
        <linearGradient id="brand-gold" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#d7b35a" />
          <stop offset="100%" stopColor="#f0d28d" />
        </linearGradient>
      </defs>

      <path d="M22 66a42 42 0 0 1 82-14" fill="none" stroke="url(#brand-blue)" strokeWidth="6" strokeLinecap="round" />
      <path d="M101 50a42 42 0 0 1-12 48" fill="none" stroke="url(#brand-red)" strokeWidth="6" strokeLinecap="round" />
      <path d="M89 98A42 42 0 0 1 26 84" fill="none" stroke="url(#brand-gold)" strokeWidth="5" strokeLinecap="round" />

      <path d="M30 40h22l12 9h34v44H30z" fill="none" stroke="url(#brand-blue)" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M42 44v41" fill="none" stroke="url(#brand-blue)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M60 37c8 2 14 6 20 12v28c-6-6-12-10-20-12-8 2-14 6-20 12V49c6-6 12-10 20-12z"
        fill="#fffdf8"
        stroke="url(#brand-gold)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M60 49v16" fill="none" stroke="url(#brand-gold)" strokeWidth="2" strokeLinecap="round" />

      <path d="M62 12h4v10h-4zM64 18l20 62H44l20-62z" fill="#fffdf8" stroke="url(#brand-blue)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M52 42h24M48 53h32M44 66h40M37 80h54" fill="none" stroke="url(#brand-blue)" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 80c4 4 9 6 14 6s10-2 14-6" fill="none" stroke="url(#brand-blue)" strokeWidth="3" strokeLinecap="round" />

      <path d="M85 30l16 6-16 6z" fill="#fffdf8" stroke="url(#brand-blue)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M101 36v12" fill="none" stroke="url(#brand-blue)" strokeWidth="3" strokeLinecap="round" />
      <path d="M101 48c2 3 2 6 0 9" fill="none" stroke="url(#brand-red)" strokeWidth="2.5" strokeLinecap="round" />

      <path d="M63 90c14 0 26 3 38 10" fill="none" stroke="url(#brand-blue)" strokeWidth="4" strokeLinecap="round" />
      <path d="M65 90c-15 0-27 3-38 10" fill="none" stroke="url(#brand-red)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="96" cy="20" r="3" fill="url(#brand-red)" />
      <circle cx="86" cy="18" r="2.3" fill="url(#brand-gold)" />
      <circle cx="43" cy="96" r="2.3" fill="url(#brand-blue)" />
      <circle cx="83" cy="96" r="2.3" fill="url(#brand-blue)" />
    </svg>
  )
}

export function BrandLogo({
  href,
  variant = 'inline',
  className = '',
  markClassName = '',
  textClassName = '',
  subtitleClassName = '',
  showTagline = false,
  inverse = false,
}: BrandLogoProps) {
  const textColor = inverse ? 'text-white' : 'text-text-primary'
  const mutedColor = inverse ? 'text-white/80' : 'text-text-muted'

  const content = (() => {
    if (variant === 'mark') {
      return <BrandMark className={markClassName || 'h-10 w-10'} />
    }

    if (variant === 'stacked') {
      return (
        <div className={`flex flex-col items-center text-center ${className}`}>
          <BrandMark className={markClassName || 'h-24 w-24'} />
          <div className="mt-4">
            <p className={`font-display font-bold tracking-tight text-2xl ${textColor} ${textClassName}`}>
              LEARN IN FRANCE
            </p>
            {showTagline && (
              <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.18em] ${mutedColor} ${subtitleClassName}`}>
                Overseas Education & Student Recruitment
              </p>
            )}
          </div>
        </div>
      )
    }

    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-2.5 ${className}`}>
          <BrandMark className={markClassName || 'h-9 w-9 shrink-0'} />
          <div className="leading-none">
            <p className={`font-display font-bold text-[11px] tracking-[0.22em] ${textColor} ${textClassName}`}>
              LEARN IN
            </p>
            <p className={`font-display font-bold text-[14px] tracking-tight ${textColor} ${textClassName}`}>
              FRANCE
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <BrandMark className={markClassName || 'h-10 w-10 shrink-0'} />
        <div className="leading-none">
          <p className={`font-display font-bold text-lg tracking-tight ${textColor} ${textClassName}`}>
            LEARN IN FRANCE
          </p>
          {showTagline && (
            <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedColor} ${subtitleClassName}`}>
              Overseas Education & Student Recruitment
            </p>
          )}
        </div>
      </div>
    )
  })()

  if (!href) return content

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  )
}
