import type { ReactNode } from 'react'

export type BadgeTone = 'info' | 'ok' | 'warn' | 'danger' | 'neutral' | 'violet'

const tones: Record<BadgeTone, string> = {
  info: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/40',
  ok: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40',
  warn: 'bg-amber-500/15 text-amber-200 ring-amber-400/40',
  danger: 'bg-rose-500/15 text-rose-200 ring-rose-400/40',
  neutral: 'bg-slate-700/40 text-slate-200 ring-slate-500/40',
  violet: 'bg-violet-500/15 text-violet-200 ring-violet-400/40',
}

export function Badge({ tone = 'neutral', children, size = 'md', className = '' }: { tone?: BadgeTone; children: ReactNode; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sz = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
  return <span className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ring-1 ${tones[tone]} ${sz} ${className}`}>{children}</span>
}
