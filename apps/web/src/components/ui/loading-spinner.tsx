export function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

  return (
    <svg
      className={`animate-spin text-primary-600 ${sizeMap[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-muted font-medium tracking-wide uppercase">
          Loading
        </p>
      </div>
    </div>
  )
}
