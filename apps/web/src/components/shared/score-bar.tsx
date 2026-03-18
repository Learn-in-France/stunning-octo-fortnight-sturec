interface ScoreBarProps {
  label: string
  value: number | null
  max?: number
  showValue?: boolean
  size?: 'sm' | 'md'
}

function getScoreColor(value: number, max: number): string {
  const pct = value / max
  if (pct >= 0.7) return 'bg-score-high'
  if (pct >= 0.4) return 'bg-score-mid'
  return 'bg-score-low'
}

function getScoreTextColor(value: number, max: number): string {
  const pct = value / max
  if (pct >= 0.7) return 'text-score-high'
  if (pct >= 0.4) return 'text-score-mid'
  return 'text-score-low'
}

export function ScoreBar({ label, value, max = 10, showValue = true, size = 'sm' }: ScoreBarProps) {
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2'

  if (value === null || value === undefined) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">{label}</span>
          <span className="text-xs text-text-muted font-mono">—</span>
        </div>
        <div className={`w-full ${barHeight} rounded-full bg-surface-sunken`} />
      </div>
    )
  }

  const pct = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        {showValue && (
          <span className={`text-xs font-mono font-semibold ${getScoreTextColor(value, max)}`}>
            {value}/{max}
          </span>
        )}
      </div>
      <div className={`w-full ${barHeight} rounded-full bg-surface-sunken overflow-hidden`}>
        <div
          className={`${barHeight} rounded-full transition-all duration-500 ease-out ${getScoreColor(value, max)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ScoreCircle({ value, max = 100, size = 48 }: { value: number | null; max?: number; size?: number }) {
  if (value === null) {
    return (
      <div
        className="rounded-full border-4 border-surface-sunken flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-text-muted font-mono">—</span>
      </div>
    )
  }

  const pct = Math.min(value / max, 1)
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)

  const color =
    pct >= 0.7 ? 'text-score-high stroke-score-high' :
    pct >= 0.4 ? 'text-score-mid stroke-score-mid' :
    'text-score-low stroke-score-low'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-surface-sunken"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold font-mono ${color.split(' ')[0]}`}>{value}</span>
      </div>
    </div>
  )
}
