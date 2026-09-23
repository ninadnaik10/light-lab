import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

export type StageContextValue = {
  svgRef: RefObject<SVGSVGElement | null>
  /** viewBox units per CSS pixel. Multiply pixel sizes (font, stroke, handle radius) by this. */
  unitsPerPx: number
  viewBox: { w: number; h: number }
}

const StageContext = createContext<StageContextValue | null>(null)

export function useStage(): StageContextValue {
  const ctx = useContext(StageContext)
  if (!ctx) throw new Error('useStage must be used inside <Stage>')
  return ctx
}

/** Pixel size → viewBox units helper; keeps text and handles readable on phones. */
export function usePx(): (px: number) => number {
  const { unitsPerPx } = useStage()
  return (px: number) => px * unitsPerPx
}

type StageProps = {
  viewBox: { w: number; h: number }
  ariaLabel: string
  className?: string
  children: ReactNode
}

/**
 * Responsive SVG stage. Owns the <svg> element and shares its ref plus the
 * current units-per-pixel ratio through context so drag handles can convert
 * pointer coordinates and labels can stay a constant on-screen size.
 */
export function Stage({ viewBox, ariaLabel, className = '', children }: StageProps) {
  const ref = useRef<SVGSVGElement>(null)
  const [unitsPerPx, setUnitsPerPx] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setUnitsPerPx(viewBox.w / w)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewBox.w])

  return (
    <StageContext.Provider value={{ svgRef: ref, unitsPerPx, viewBox }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
        className={`block h-auto w-full touch-none select-none rounded-xl bg-slate-900/70 ring-1 ring-slate-800 ${className}`}
      >
        <Defs />
        {children}
      </svg>
    </StageContext.Provider>
  )
}

/** Shared <defs>: glow filter and hatch pattern. */
function Defs() {
  return (
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" strokeWidth="1.5" />
      </pattern>
    </defs>
  )
}
