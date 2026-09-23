import type { ReactNode } from 'react'

export type SectionLayoutProps = {
  title: string
  subtitle?: string
  /** One or two sentences: the concept the student should take away. */
  keyIdea: ReactNode
  stage: ReactNode
  controls: ReactNode
  readouts: ReactNode
  quiz?: ReactNode
  /** Full-width content under the stage (e.g. zone bar, compare readouts, fibre demo). */
  below?: ReactNode
}

/** Standard page layout: stage + optional below-content on the left, control panels on the right. Stacks on narrow screens. */
export function SectionLayout({ title, subtitle, keyIdea, stage, controls, readouts, quiz, below }: SectionLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </header>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-4 py-3 text-sm leading-relaxed text-cyan-100/90">
            <span className="mr-2 font-semibold uppercase tracking-wide text-cyan-300">Key idea</span>
            {keyIdea}
          </div>
          {stage}
          {below}
        </div>
        <aside className="space-y-4 lg:col-span-1">
          {controls}
          {readouts}
          {quiz}
        </aside>
      </div>
    </div>
  )
}
