import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            block w-full rounded-lg border px-3 py-2 text-sm
            bg-surface-raised text-text-primary
            transition-colors duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${error ? 'border-red-400' : 'border-border'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
