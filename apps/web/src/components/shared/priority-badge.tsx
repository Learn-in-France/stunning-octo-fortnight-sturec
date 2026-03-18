import type { PriorityLevel } from '@sturec/shared'

const config: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  p1: { label: 'P1', bg: 'bg-priority-p1-bg', text: 'text-priority-p1', dot: 'bg-priority-p1' },
  p2: { label: 'P2', bg: 'bg-priority-p2-bg', text: 'text-priority-p2', dot: 'bg-priority-p2' },
  p3: { label: 'P3', bg: 'bg-priority-p3-bg', text: 'text-priority-p3', dot: 'bg-priority-p3' },
}

export function PriorityBadge({ priority }: { priority: PriorityLevel | null }) {
  if (!priority) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-gray-100 text-gray-400">
        —
      </span>
    )
  }

  const c = config[priority]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
