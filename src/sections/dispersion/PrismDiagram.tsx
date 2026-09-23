import { useMemo } from 'react'
import { AngleArc, DragHandle, Label, NormalLine, Ray, Stage, useStage } from '../../components/svg'
import { RAY_COLORS } from '../../lib/color'
import { fmt, fmtDeg } from '../../lib/format'
import { clipRayToRect, dot, intersectLines, sub, type Vec2 } from '../../lib/geometry'
import { outwardNormal } from '../../lib/prism'
import { APEX, BOUNDS, SCREEN_X, STAGE, WHITE, incidenceFromPointer, toSourceDir, type PrismSetup, type WaveTrace } from './model'
import { SpectrumScreen } from './SpectrumScreen'

export type PrismDiagramProps = {
  setup: PrismSetup
  traces: WaveTrace[]
  /** The wavelength used for the δ / e overlays (550 nm in white mode, λ in single-wavelength mode). */
  refTrace: WaveTrace
  mode: 'white' | 'mono'
  iDeg: number
  glassLabel: string
  boost: number
  onDrag: (iDeg: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  onNudge: (dir: -1 | 1, big: boolean) => void
}

export function PrismDiagram(props: PrismDiagramProps) {
  return (
    <Stage viewBox={STAGE} ariaLabel="Prism dispersion diagram">
      <Scene {...props} />
    </Stage>
  )
}

const inStage = (p: Vec2) => p.x >= BOUNDS.xMin && p.x <= BOUNDS.xMax && p.y >= BOUNDS.yMin && p.y <= BOUNDS.yMax

function Scene({ setup, traces, refTrace, mode, iDeg, glassLabel, boost, onDrag, onDragStart, onDragEnd, onNudge }: PrismDiagramProps) {
  const { unitsPerPx: upp } = useStage()
  const { poly, entry, outward, source, ray, apexDeg, baseY } = setup
  const points = poly.map((p) => `${p.x},${p.y}`).join(' ')
  const guideEnd = useMemo(() => clipRayToRect({ origin: entry, dir: ray.dir }, BOUNDS), [entry, ray.dir])
  const accent = mode === 'mono' ? refTrace.color : '#e2e8f0'
  /** Phone-sized stage: labels are large relative to the drawing, so drop the secondary overlays. */
  const compact = upp > 1.8

  // Overlays for the reference ray: exit normal, angle of emergence, deviation arc.
  const overlay = useMemo(() => {
    if (!refTrace.clean || !refTrace.result.exitRay) return null
    const exitEvent = refTrace.result.events[1]
    const exitPoint = exitEvent.point
    const exitNormal = outwardNormal(poly, exitEvent.edge)
    const exitDir = refTrace.result.exitRay.dir
    const vertex = intersectLines(entry, ray.dir, exitPoint, exitDir)
    const vertexOk = vertex !== null && inStage(vertex) && dot(sub(exitPoint, vertex), exitDir) > 0
    return { exitPoint, exitNormal, exitDir, vertex: vertexOk ? vertex : null }
  }, [refTrace, poly, entry, ray.dir])

  const hits = traces.flatMap((t) => (t.screenHit ? [{ nm: t.nm, y: t.screenHit.y, color: t.color }] : []))

  return (
    <g>
      {/* Undeviated path (where the light would have gone without the prism) */}
      {guideEnd && <Ray from={entry} to={guideEnd} color={RAY_COLORS.guide} variant="guide" />}

      {/* Prism */}
      <polygon points={points} fill={RAY_COLORS.glass} fillOpacity={0.12} stroke={RAY_COLORS.glass} strokeOpacity={0.8} strokeWidth={1.6 * upp} strokeLinejoin="round" />
      <Label x={APEX.x} y={APEX.y - 20 * upp} text={`A = ${fmt(apexDeg, 0)}°`} color={RAY_COLORS.glass} sizePx={12} weight={700} />
      <Label x={APEX.x} y={baseY + 18 * upp} text={glassLabel} color={RAY_COLORS.glass} sizePx={11} opacity={0.9} />
      {/* On narrow stages (phones) the warn badge in the controls card carries this message instead. */}
      {boost > 1 && !compact && <Label x={SCREEN_X - 64 * upp} y={BOUNDS.yMin + 10 * upp} text={`colour spread exaggerated ×${boost}`} anchor="end" color="#fcd34d" sizePx={11} weight={600} bg />}

      {/* Entry normal + angle of incidence */}
      <NormalLine at={entry} dir={outward} halfLength={70} />
      <AngleArc vertex={entry} dirA={outward} dirB={toSourceDir(setup)} radius={46} color={mode === 'mono' ? refTrace.color : WHITE} label={`i = ${fmtDeg(iDeg)}`} />

      {/* Reference-ray overlays: back-extension of the exit ray, exit normal, e and δ arcs */}
      {overlay && (
        <g>
          {overlay.vertex && <Ray from={overlay.vertex} to={overlay.exitPoint} color={RAY_COLORS.guide} variant="guide" />}
          <NormalLine at={overlay.exitPoint} dir={overlay.exitNormal} halfLength={60} />
          {refTrace.eDeg !== null && !compact && <AngleArc vertex={overlay.exitPoint} dirA={overlay.exitNormal} dirB={overlay.exitDir} radius={40} color={accent} label={`e = ${fmtDeg(refTrace.eDeg)}`} labelFactor={2.0} />}
          {overlay.vertex && refTrace.result.deviationDeg !== null && (
            <AngleArc vertex={overlay.vertex} dirA={ray.dir} dirB={overlay.exitDir} radius={64} color={accent} label={`δ = ${fmtDeg(refTrace.result.deviationDeg)}`} labelFactor={1.35} />
          )}
        </g>
      )}

      {/* Incoming white beam drawn once; each colour's path after the first face */}
      {mode === 'white' && <Ray from={source} to={entry} color={WHITE} variant="real" arrowhead />}
      {traces.map((t) => (
        <g key={t.nm}>
          {t.result.segments.slice(mode === 'white' ? 1 : 0).map((s, k) => (
            <Ray key={k} from={s.a} to={s.b} color={t.color} variant="real" fast widthPx={mode === 'white' ? 1.6 : 2.4} opacity={0.9} arrowhead={mode === 'mono' && k === 0} />
          ))}
        </g>
      ))}

      <SpectrumScreen hits={hits} />

      <DragHandle
        pos={source}
        color={mode === 'mono' ? refTrace.color : WHITE}
        ariaLabel={`Light source, angle of incidence ${fmtDeg(iDeg)}. Use arrow keys to change.`}
        label="source"
        onDrag={(p) => onDrag(incidenceFromPointer(setup, p))}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onNudge={onNudge}
      />
    </g>
  )
}
