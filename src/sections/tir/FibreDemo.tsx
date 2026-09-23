import { useMemo, useState } from 'react'
import { AngleArc, DragHandle, Label, NormalLine, Ray, Stage, useStage } from '../../components/svg'
import { Badge, Card, FormulaCard, Readout, ReadoutGrid, Slider } from '../../components/ui'
import { RAY_COLORS } from '../../lib/color'
import { clamp, fmtDeg, roundTo } from '../../lib/format'
import { add, fromAngleDeg, negate, normalize, scale, sub, type Rect, type Vec2 } from '../../lib/geometry'
import { criticalAngleDeg } from '../../lib/optics'
import { outwardNormal, tracePolygon } from '../../lib/prism'

const W = 900
const H = 220
const X0 = 60
const X1 = 860
const YC = 110
const HALF = 30
const CLAD = 30
const CORE: Vec2[] = [
  { x: X0, y: YC - HALF },
  { x: X1, y: YC - HALF },
  { x: X1, y: YC + HALF },
  { x: X0, y: YC + HALF },
]
const BOUNDS: Rect = { xMin: 0, xMax: W, yMin: 0, yMax: H }
const ORIGIN: Vec2 = { x: X0 + 1, y: YC }
const THETA_MAX = 45
const HANDLE_DIST = 70

const isHorizontalEdge = (poly: Vec2[], e: number): boolean => Math.abs(poly[e].y - poly[(e + 1) % poly.length].y) < 1e-9

/**
 * Optical fibre mini demo: a light ray launched inside a glass core bounces
 * along by total internal reflection at the core–cladding boundary, or leaks
 * out when the launch angle is too steep.
 */
export function FibreDemo() {
  const [nCore, setNCoreRaw] = useState(1.5)
  const [nClad, setNCladRaw] = useState(1.4)
  const [theta, setTheta] = useState(12)

  const setNCore = (v: number) => {
    setNCoreRaw(v)
    if (nClad >= v) setNCladRaw(roundTo(v - 0.01, 0.01))
  }
  const setNClad = (v: number) => setNCladRaw(Math.min(v, roundTo(nCore - 0.01, 0.01)))
  const setThetaClamped = (v: number) => setTheta(clamp(v, 0, THETA_MAX))

  const trace = useMemo(() => tracePolygon({ origin: ORIGIN, dir: fromAngleDeg(-theta) }, CORE, nCore, nClad, { bounds: BOUNDS, maxBounces: 80 }), [nCore, nClad, theta])

  const exitEvent = trace.events.find((e) => e.kind === 'exit')
  const leaks = exitEvent !== undefined && isHorizontalEdge(CORE, exitEvent.edge)
  const bounces = trace.events.filter((e) => e.kind === 'tir').length
  const tc = criticalAngleDeg(nCore, nClad) ?? 90
  const wallAngle = 90 - theta
  const guided = !leaks

  return (
    <Card title="Optical fibre: TIR at work">
      <p className="mb-3 text-sm text-slate-400">
        A glass core (denser) is wrapped in a cladding (rarer). Light launched at a shallow angle meets the wall beyond the critical angle every time, so it is guided along with no loss. Steepen the launch and it leaks.
      </p>
      <Stage viewBox={{ w: W, h: H }} ariaLabel="Optical fibre: light bouncing along a glass core by total internal reflection">
        <FibreBody nCore={nCore} nClad={nClad} theta={theta} segments={trace.segments} events={trace.events} leaks={leaks} onChangeTheta={setThetaClamped} />
      </Stage>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Slider label="n (core)" value={nCore} min={1.4} max={1.8} step={0.01} onChange={setNCore} />
        <Slider label="n (cladding)" value={nClad} min={1.0} max={1.7} step={0.01} onChange={setNClad} hint="Kept below the core index" />
        <Slider label="Launch angle θ (from the axis)" value={theta} min={0} max={THETA_MAX} step={0.5} unit="°" onChange={setThetaClamped} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Badge tone={guided ? 'ok' : 'danger'} size="lg">
            {guided ? 'Guided by total internal reflection' : 'Leaks into the cladding'}
          </Badge>
          <ReadoutGrid>
            <Readout label="Angle at the wall (90° − θ)" value={fmtDeg(wallAngle)} tone="accent" />
            <Readout label="Critical angle θc (core → cladding)" value={fmtDeg(tc)} hint={`sin θc = ${nClad.toFixed(2)} / ${nCore.toFixed(2)}`} tone="warn" />
            <Readout label="Steepest guided launch (90° − θc)" value={fmtDeg(90 - tc)} />
            <Readout label="Reflections along this fibre" value={bounces} />
          </ReadoutGrid>
        </div>
        <FormulaCard
          title="Guiding condition"
          symbolic="guided if 90° − θ > θc"
          substituted={`${fmtDeg(wallAngle)} ${guided ? '>' : '≤'} ${fmtDeg(tc)}`}
          result={guided ? 'Guided: total internal reflection at every bounce' : 'Not guided: light refracts out at the first bounce'}
          tone={guided ? 'ok' : 'danger'}
          note="The angle at the wall is measured from the normal to the core–cladding boundary."
        />
      </div>
    </Card>
  )
}

function FibreBody({
  nCore,
  nClad,
  theta,
  segments,
  events,
  leaks,
  onChangeTheta,
}: {
  nCore: number
  nClad: number
  theta: number
  segments: { a: Vec2; b: Vec2 }[]
  events: { kind: 'enter' | 'exit' | 'tir'; point: Vec2; edge: number; iDeg: number }[]
  leaks: boolean
  onChangeTheta: (deg: number) => void
}) {
  const { unitsPerPx } = useStage()
  const px = (v: number) => v * unitsPerPx

  const launchDir = fromAngleDeg(-theta)
  const handlePos = add(ORIGIN, scale(launchDir, HANDLE_DIST))
  const onDrag = (p: Vec2) => {
    const dx = Math.max(1e-6, p.x - ORIGIN.x)
    const dy = Math.max(0, ORIGIN.y - p.y)
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI
    onChangeTheta(Math.round(deg * 2) / 2)
  }
  const onNudge = (dir: -1 | 1, big: boolean) => onChangeTheta(theta + dir * (big ? 5 : 1))

  const first = events.length > 0 && isHorizontalEdge(CORE, events[0].edge) ? events[0] : null
  const firstIn = first && segments.length > 0 ? normalize(sub(first.point, segments[0].a)) : null
  const inwardNormal = first ? negate(outwardNormal(CORE, first.edge)) : null

  const exitIndex = events.findIndex((e) => e.kind === 'exit')
  const hasExit = exitIndex >= 0
  const lastIndex = segments.length - 1

  return (
    <g>
      {/* Cladding + core */}
      <rect x={X0} y={YC - HALF - CLAD} width={X1 - X0} height={CLAD} fill={RAY_COLORS.glass} fillOpacity={0.06} />
      <rect x={X0} y={YC + HALF} width={X1 - X0} height={CLAD} fill={RAY_COLORS.glass} fillOpacity={0.06} />
      <rect x={X0} y={YC - HALF} width={X1 - X0} height={2 * HALF} fill={RAY_COLORS.glass} fillOpacity={0.18} stroke={RAY_COLORS.glass} strokeOpacity={0.5} strokeWidth={px(1)} />
      <line x1={X0} y1={YC - HALF - CLAD} x2={X1} y2={YC - HALF - CLAD} stroke={RAY_COLORS.glass} strokeOpacity={0.25} strokeWidth={px(1)} />
      <line x1={X0} y1={YC + HALF + CLAD} x2={X1} y2={YC + HALF + CLAD} stroke={RAY_COLORS.glass} strokeOpacity={0.25} strokeWidth={px(1)} />
      <line x1={X0} y1={YC} x2={X1} y2={YC} stroke={RAY_COLORS.normal} strokeOpacity={0.25} strokeWidth={px(1)} strokeDasharray={`${px(3)} ${px(6)}`} />

      <Label x={X1 - px(12)} y={YC - HALF - CLAD / 2} text={`cladding  n = ${nClad.toFixed(2)}`} anchor="end" sizePx={11} color="#cbd5e1" bg />
      <Label x={X1 - px(12)} y={YC + HALF + CLAD / 2} text={`cladding  n = ${nClad.toFixed(2)}`} anchor="end" sizePx={11} color="#cbd5e1" bg />
      <Label x={X1 - px(12)} y={YC + HALF - px(11)} text={`core  n = ${nCore.toFixed(2)}`} anchor="end" sizePx={11} color="#e2e8f0" weight={600} bg />

      {/* Ray path */}
      {segments.map((s, k) => {
        const isExitPiece = hasExit && k === lastIndex
        const leaked = isExitPiece && leaks
        return <Ray key={k} from={s.a} to={s.b} color={RAY_COLORS.refracted} opacity={leaked ? 0.3 : 1} arrowhead={k === 0 || leaked} />
      })}

      {/* First bounce: normal + angle at the wall */}
      {first && firstIn && inwardNormal && (
        <g>
          <NormalLine at={first.point} dir={{ x: 0, y: 1 }} halfLength={HALF + 6} />
          <AngleArc vertex={first.point} dirA={negate(firstIn)} dirB={inwardNormal} radius={22} color={leaks ? '#f87171' : RAY_COLORS.reflected} label={fmtDeg(first.iDeg)} labelFactor={1.7} />
          {leaks && <Label x={first.point.x + px(60)} y={first.point.y + (first.point.y < YC ? -1 : 1) * (CLAD + px(14))} text="leaks out" color="#f87171" sizePx={11} weight={600} bg />}
        </g>
      )}

      {/* Launch handle */}
      <Label x={ORIGIN.x + px(8)} y={YC + HALF + CLAD + px(14)} text={`θ = ${fmtDeg(theta)}`} anchor="start" color={RAY_COLORS.refracted} sizePx={11} weight={600} />
      <DragHandle pos={handlePos} onDrag={onDrag} color={RAY_COLORS.refracted} ariaLabel="Launch direction: drag to change the launch angle" hitRadiusPx={20} onNudge={onNudge} />
    </g>
  )
}
