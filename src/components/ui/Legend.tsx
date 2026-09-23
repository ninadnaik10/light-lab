export type LegendItem = { color: string; label: string; dashed?: boolean; muted?: boolean; hint?: string }

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-300">
      {items.map((it) => (
        <li key={it.label} className={`flex items-center gap-1.5 ${it.muted ? 'opacity-40' : ''}`} title={it.hint}>
          <svg width="22" height="8" aria-hidden>
            <line x1="1" y1="4" x2="21" y2="4" stroke={it.color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={it.dashed ? '4 3' : undefined} />
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  )
}
