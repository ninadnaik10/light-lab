import { lazy, Suspense, useEffect } from 'react'
import { onRouteLinkClick, usePathRoute } from './hooks/usePathRoute'
import { applyHead, ROUTES, routeFor, type SectionId } from './routes'

const ReflectionSection = lazy(() => import('./sections/ReflectionSection'))
const RefractionSection = lazy(() => import('./sections/RefractionSection'))
const TirSection = lazy(() => import('./sections/TirSection'))
const DispersionSection = lazy(() => import('./sections/DispersionSection'))
const MirrorsSection = lazy(() => import('./sections/MirrorsSection'))
const LensesSection = lazy(() => import('./sections/LensesSection'))

export const SECTIONS = [
  { id: 'reflection', label: 'Reflection', short: 'Reflect', Component: ReflectionSection },
  { id: 'refraction', label: 'Refraction', short: 'Refract', Component: RefractionSection },
  { id: 'tir', label: 'Total Internal Reflection', short: 'TIR', Component: TirSection },
  { id: 'dispersion', label: 'Dispersion', short: 'Prism', Component: DispersionSection },
  { id: 'mirrors', label: 'Spherical Mirrors', short: 'Mirrors', Component: MirrorsSection },
  { id: 'lenses', label: 'Lenses', short: 'Lenses', Component: LensesSection },
] as const

export default function App() {
  const current = usePathRoute<SectionId>(ROUTES, 'reflection')
  const section = SECTIONS.find((s) => s.id === current) ?? SECTIONS[0]

  useEffect(() => {
    applyHead(routeFor(section.id))
  }, [section.id])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6">
          <a href="/" onClick={onRouteLinkClick} className="flex shrink-0 items-center gap-2 py-3" aria-label="Light Lab home">
            <span className="inline-block h-6 w-6 rounded-full bg-[conic-gradient(from_0deg,#f87171,#fbbf24,#4ade80,#22d3ee,#a78bfa,#f87171)] shadow-[0_0_14px_rgba(34,211,238,0.6)]" />
            <span className="text-base font-bold tracking-tight">Light Lab</span>
          </a>
          <ul className="scrollbar-thin flex flex-1 gap-1 overflow-x-auto py-2">
            {SECTIONS.map((s) => {
              const active = s.id === current
              return (
                <li key={s.id} className="shrink-0">
                  <a
                    href={routeFor(s.id).path}
                    aria-current={active ? 'page' : undefined}
                    onClick={onRouteLinkClick}
                    className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? 'bg-slate-800 text-cyan-200 shadow-inner' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`}
                  >
                    <span className="hidden md:inline">{s.label}</span>
                    <span className="md:hidden">{s.short}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
      <main>
        <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
          <section.Component key={section.id} />
        </Suspense>
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        Light Lab · Made by{' '}
        <a href="https://ninadnaik.me" target="_blank" rel="noopener" className="text-slate-400 underline-offset-2 hover:text-cyan-300 hover:underline">
          Ninad Naik
        </a>
      </footer>
    </div>
  )
}
