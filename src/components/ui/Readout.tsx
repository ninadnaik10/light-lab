import type { ReactNode } from 'react'

export type ReadoutProps = { label: ReactNode; value: ReactNode; unit?: string; hint?: string; tone?: 'default' | 'accent' | 'warn' | 'danger' | 'ok' }

const tones = {
  default: 'text-slate-100',
  accent: 'text-cyan-300',
  warn: 'text-amber-300',
  danger: 'text-rose-300',
  ok: 'text-emerald-300',
}

/** One labelled live number. */
export function Readout({ label, value, unit, hint, tone = 'default' }: ReadoutProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-slate-400">
        {label}
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      <span className={`font-mono text-sm tabular-nums ${tones[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-slate-500">{unit}</span>}
      </span>
    </div>
  )
}

/** A grid of readouts. */
export function ReadoutGrid({ children, cols = 1 }: { children: ReactNode; cols?: 1 | 2 }) {
  return <div className={`grid gap-x-6 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'} divide-y divide-slate-800/60`}>{children}</div>
}
