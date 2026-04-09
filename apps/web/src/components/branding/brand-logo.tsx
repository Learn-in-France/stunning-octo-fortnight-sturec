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

/**
 * Inline brand name with French tricolore coloring.
 * Use in sentences: "Welcome to <BrandName />".
 * - Light bg: "Learn in" = navy, "France" = red
 * - Dark bg (inverse): "Learn in" = white, "France" = red
 */
export function BrandName({ inverse = false, className = '' }: { inverse?: boolean; className?: string }) {
  return (
    <span className={`${inverse ? 'text-white' : 'text-public-navy'} ${className}`}>
      Learn in{' '}
      <span className="text-public-red">France</span>
    </span>
  )
}

/**
 * The primary typographic "LIF" mark — a serif wordmark where the
 * L and F are rendered in the base colour (navy by default, white
 * when inverted on a dark surface) and the central I is picked out
 * in the site red. Matches the reference logo exactly with the one
 * agreed change (red I).
 *
 * Sizing is driven by the parent font-size via the `className` prop,
 * so callers can say e.g. `text-4xl` or `text-[80px]` and the mark
 * scales accordingly. No raster asset — the mark is pure type.
 */
function LifMark({
  className = 'text-4xl',
  inverse = false,
}: {
  className?: string
  inverse?: boolean
}) {
  const baseColor = inverse ? 'text-white' : 'text-public-navy'
  return (
    <span
      className={`inline-flex items-baseline font-bold leading-none tracking-[-0.02em] ${baseColor} ${className}`}
      style={{ fontFamily: 'var(--font-logo)' }}
      aria-hidden
    >
      <span>L</span>
      <span className="text-public-red">I</span>
      <span>F</span>
    </span>
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
  const baseColor = inverse ? 'text-white' : 'text-public-navy'
  const accentColor = 'text-public-red'
  const mutedColor = inverse ? 'text-white/80' : 'text-text-muted'
  const dividerColor = inverse ? 'bg-white/30' : 'bg-public-navy/25'

  const content = (() => {
    // Every variant renders the FULL reference lockup (LIF monogram →
    // divider → LEARN IN / FRANCE stacked → tagline). Variants only
    // differ in scale so the same logo works everywhere from nav bars
    // to marketing hero sections. This is intentional — we want the
    // brand to look consistent across the whole product, matching the
    // reference image exactly with the one agreed change (red I).

    // Size table per variant:
    //   mark    → only the LIF monogram (no surrounding text)
    //   compact → tiny lockup for dense sidebars (LIF ~24px)
    //   inline  → default header lockup (LIF ~40px)
    //   stacked → hero lockup for marketing panels (LIF ~96px)
    const scale = (() => {
      switch (variant) {
        case 'mark':
          return null
        case 'compact':
          return {
            mark: 'text-[24px]',
            title: 'text-[10px] sm:text-[11px]',
            tagline: 'text-[8px] sm:text-[9px]',
            dividerWidth: 'max-w-[90px]',
            gap: 'mt-1',
            titleGap: 'mt-1',
            taglineGap: 'mt-1',
          }
        case 'stacked':
          return {
            mark: 'text-[88px] sm:text-[104px]',
            title: 'text-2xl sm:text-3xl',
            tagline: 'text-[11px] sm:text-[12px]',
            dividerWidth: 'max-w-[220px]',
            gap: 'mt-3',
            titleGap: 'mt-3',
            taglineGap: 'mt-3',
          }
        default:
          return {
            mark: 'text-[22px] sm:text-[24px]',
            title: 'text-[8px] sm:text-[9px]',
            tagline: 'text-[7px] sm:text-[8px]',
            dividerWidth: 'max-w-[80px]',
            gap: 'mt-1',
            titleGap: 'mt-0.5',
            taglineGap: 'mt-0.5',
          }
      }
    })()

    if (variant === 'mark' || !scale) {
      return (
        <LifMark
          className={`text-4xl ${markClassName}`}
          inverse={inverse}
        />
      )
    }

    // Divider width scales with font-size (em units) so the line stays
    // proportional to the mark across all variants.
    return (
      <div
        className={`inline-flex flex-col items-center text-center leading-none ${className}`}
      >
        <LifMark className={`${scale.mark} ${markClassName}`} inverse={inverse} />
        <div className={`${scale.gap} h-px w-full ${scale.dividerWidth} ${dividerColor}`} />
        <p
          className={`${scale.titleGap} font-semibold uppercase leading-[1.1] tracking-[0.05em] ${baseColor} ${textClassName}`}
          style={{ fontFamily: 'var(--font-logo)' }}
        >
          <span className={`block ${scale.title}`}>LEARN IN</span>
          <span className={`block ${scale.title}`}>
            <span className={accentColor}>FRANCE</span>
          </span>
        </p>
        {showTagline && (
          <p
            className={`${scale.taglineGap} italic leading-5 ${scale.tagline} ${mutedColor} ${subtitleClassName}`}
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            France-based Education Advisory
          </p>
        )}
      </div>
    )
  })()

  if (!href) return content

  return (
    <Link href={href} className="inline-flex" aria-label="Learn in France — home">
      {content}
    </Link>
  )
}
