export function Segmented<T extends string>({ options, value, onChange, ariaLabel, size = 'md' }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void; ariaLabel?: string; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex w-full rounded-lg bg-slate-800 p-0.5" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-md ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium transition-colors ${
              active ? 'bg-slate-950 text-cyan-200 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
