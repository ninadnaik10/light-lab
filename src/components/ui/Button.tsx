import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({ children, variant = 'ghost', active = false, size = 'md', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: 'primary' | 'ghost' | 'danger'; active?: boolean; size?: 'sm' | 'md' }) {
  const base = `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`
  const styles =
    variant === 'primary'
      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
      : variant === 'danger'
        ? 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/50 hover:bg-rose-500/30'
        : active
          ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/60'
          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}
