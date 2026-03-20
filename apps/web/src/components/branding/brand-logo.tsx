import Link from 'next/link'
import Image from 'next/image'

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
    <Image
      src="/logo.png"
      alt="Learn in France"
      width={512}
      height={279}
      className={`object-contain ${className}`}
      priority
    />
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
      return <BrandMark className={markClassName || 'h-10 w-auto'} />
    }

    if (variant === 'stacked') {
      return (
        <div className={`flex flex-col items-center text-center ${className}`}>
          <BrandMark className={markClassName || 'h-20 w-auto'} />
          <div className="mt-4">
            <p className={`font-display font-bold tracking-tight text-2xl ${textColor} ${textClassName}`}>
              LEARN IN FRANCE
            </p>
            {showTagline && (
              <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.18em] ${mutedColor} ${subtitleClassName}`}>
                Overseas Education & Admissions Guidance
              </p>
            )}
          </div>
        </div>
      )
    }

    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-2.5 ${className}`}>
          <BrandMark className={markClassName || 'h-9 w-auto shrink-0'} />
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
        <BrandMark className={markClassName || 'h-10 w-auto shrink-0'} />
        <div className="leading-none">
          <p className={`font-display font-bold text-lg tracking-tight ${textColor} ${textClassName}`}>
            LEARN IN FRANCE
          </p>
          {showTagline && (
            <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedColor} ${subtitleClassName}`}>
              Overseas Education & Admissions Guidance
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
