import type { ReactNode } from 'react'

export type FormulaCardProps = {
  title?: string
  /** The symbolic form, e.g. n₁ sin i = n₂ sin r */
  symbolic: ReactNode
  /** The same formula with live numbers substituted. */
  substituted?: ReactNode
  /** Optional result line. */
  result?: ReactNode
  note?: ReactNode
  tone?: 'default' | 'ok' | 'warn' | 'danger'
}

const toneRing = { default: 'border-slate-700', ok: 'border-emerald-700/60', warn: 'border-amber-700/60', danger: 'border-rose-700/60' }

/** Shows a formula symbolically and with the current values plugged in. */
export function FormulaCard({ title, symbolic, substituted, result, note, tone = 'default' }: FormulaCardProps) {
  return (
    <div className={`rounded-lg border ${toneRing[tone]} bg-slate-950/60 px-3 py-2`}>
      {title && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>}
      <div className="font-mono text-sm text-slate-100">{symbolic}</div>
      {substituted && <div className="mt-1 font-mono text-sm text-cyan-200">{substituted}</div>}
      {result && <div className="mt-1 font-mono text-sm font-semibold text-emerald-300">{result}</div>}
      {note && <div className="mt-1 text-xs text-slate-400">{note}</div>}
    </div>
  )
}

/** Inline fraction for formulas. */
export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center align-middle leading-none">
      <span className="border-b border-slate-400 px-0.5 pb-0.5">{num}</span>
      <span className="px-0.5 pt-0.5">{den}</span>
    </span>
  )
}
