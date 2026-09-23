export type PresetOption<T> = { label: string; value: T }

export function PresetChips<T extends string | number>({
  options,
  value,
  onSelect,
  tolerance = 0,
  ariaLabel,
}: {
  options: PresetOption<T>[]
  value: T | null
  onSelect: (v: T) => void
  /** For numeric values: treat |a − b| ≤ tolerance as selected. */
  tolerance?: number
  ariaLabel?: string
}) {
  const isActive = (v: T) => (typeof v === 'number' && typeof value === 'number' ? Math.abs(v - value) <= tolerance : v === value)
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = isActive(o.value)
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onSelect(o.value)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              active ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/60' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
