import type { ReactNode } from 'react'

export function Card({ title, children, className = '', action, tone = 'default' }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode; tone?: 'default' | 'accent' }) {
  return (
    <section className={`rounded-xl border ${tone === 'accent' ? 'border-cyan-900/60 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/60'} p-4 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
