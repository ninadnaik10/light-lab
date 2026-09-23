import { useMemo, useState } from 'react'
import { AngleArc, Arrowhead, Label, Ray, Stage, useStage } from '../../../components/svg'
import { Badge, Button, Readout, ReadoutGrid, Segmented, Slider } from '../../../components/ui'
import { RAY_COLORS, wavelengthToRGB } from '../../../lib/color'
import { clamp, fmt, fmtDeg, roundTo } from '../../../lib/format'
import { normalize, sub, type Vec2 } from '../../../lib/geometry'
import { WHITE } from '../model'
import { B_MAX, B_MIN, DROP_C, DROP_R, RB_BOUNDS, RB_STAGE, RB_WAVELENGTHS, analyticBow, traceRainbow, type Bow, type DropTrace } from './rainbowModel'

const BACK_TO_SUN: Vec2 = { x: -1, y: 0 }

export function RainbowDemo() {
  const [b, setB] = useState(() => roundTo(analyticBow(1)?.impact ?? 0.86, 0.01))
  const [k, setK] = useState<Bow>(1)
  const traces = useMemo(() => traceRainbow(b, k), [b, k])
  const analytic = useMemo(() => analyticBow(k), [k])
  const violet = traces[0]
  const red = traces[traces.length - 1]
  const redAngle = red.trace.rainbowAngleDeg
  const violetAngle = violet.trace.rainbowAngleDeg
  const atBow = analytic !== null && Math.abs(b - analytic.impact) < 0.03
  const setImpact = (v: number) => setB(clamp(roundTo(v, 0.01), B_MIN, B_MAX))

  return (
    <div className="space-y-4">
      <Stage viewBox={RB_STAGE} ariaLabel="Sunlight refracting and reflecting inside a raindrop">
        <RainbowScene traces={traces} k={k} bowAngle={analytic?.rainbowAngleDeg ?? null} />
      </Stage>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Slider label="Where the ray hits the drop (b)" value={b} min={B_MIN} max={B_MAX} step={0.01} onChange={setImpact} hint="0 = straight through the centre, 1 = grazing the edge (fraction of the radius)" />
          <Segmented
            ariaLabel="Rainbow order"
            options={[
              { label: 'Primary (1 reflection)', value: '1' },
              { label: 'Secondary (2 reflections)', value: '2' },
            ]}
            value={String(k)}
            onChange={(v) => setK(v === '2' ? 2 : 1)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => analytic && setImpact(analytic.impact)} disabled={!analytic}>
              Set to rainbow angle
            </Button>
            {atBow && <Badge tone="ok">This is the rainbow angle: rays pile up here</Badge>}
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            Each raindrop refracts sunlight in, reflects it off the back, and refracts it out. The exit angle is concentrated near 42° (red) to 40° (violet), so you see the bow at 42° from the point
            opposite the sun; secondary bow at ~51° with the colours reversed.
          </p>
        </div>
        <ReadoutGrid>
          <Readout label={<span style={{ color: red.color }}>Rainbow angle, red (700 nm)</span>} hint="angle between the exit ray and the direction back to the sun" value={redAngle !== null ? fmtDeg(redAngle) : '—'} />
          <Readout label={<span style={{ color: violet.color }}>Rainbow angle, violet (400 nm)</span>} value={violetAngle !== null ? fmtDeg(violetAngle) : '—'} />
          <Readout label="Colour spread" hint={k === 1 ? 'red on the outside of the primary bow' : 'reversed: red on the inside of the secondary bow'} value={redAngle !== null && violetAngle !== null ? fmtDeg(Math.abs(redAngle - violetAngle)) : '—'} tone="accent" />
          <Readout
            label="Minimum deviation (analytic, 550 nm)"
            hint={analytic ? `at b = ${fmt(analytic.impact, 2)}, i = ${fmtDeg(analytic.incidenceDeg)}, deviation ${fmtDeg(analytic.deviationDeg)}` : undefined}
            value={analytic ? fmtDeg(analytic.rainbowAngleDeg) : '—'}
            tone={atBow ? 'ok' : 'default'}
          />
          <Readout label="Water index n (400 → 700 nm)" value={`${fmt(violet.n, 4)} → ${fmt(red.n, 4)}`} />
        </ReadoutGrid>
      </div>
    </div>
  )
}

function RainbowScene({ traces, k, bowAngle }: { traces: DropTrace[]; k: Bow; bowAngle: number | null }) {
  const { unitsPerPx: upp } = useStage()
  const compact = upp > 1.8
  const mid = traces[Math.floor(traces.length / 2)]
  const violet = traces[0]
  const red = traces[traces.length - 1]
  const incoming = mid.trace.segments[0]
  const redExit = red.trace.exitRay
  const violetExit = violet.trace.exitRay

  return (
    <g>
      {/* Droplet */}
      <circle cx={DROP_C.x} cy={DROP_C.y} r={DROP_R} fill={RAY_COLORS.glass} fillOpacity={0.15} stroke={RAY_COLORS.glass} strokeOpacity={0.7} strokeWidth={1.4 * upp} />
      <Label x={DROP_C.x + 0.75 * DROP_R + 6 * upp} y={DROP_C.y - 0.75 * DROP_R - 6 * upp} text="water drop, n ≈ 1.33" anchor="start" color={RAY_COLORS.glass} sizePx={11} />

      {/* Guide back toward the sun from the exit point */}
      {redExit && <Ray from={redExit.origin} to={{ x: RB_BOUNDS.xMin, y: redExit.origin.y }} color={RAY_COLORS.guide} variant="guide" />}

      {/* Sunlight in (drawn once), then each colour's path */}
      {incoming && (
        <g>
          <Ray from={incoming.a} to={incoming.b} color={WHITE} variant="real" arrowhead />
          <Label x={incoming.a.x} y={incoming.a.y + (k === 1 ? 14 : -14) * upp} text="sunlight" anchor="start" color={WHITE} sizePx={11} />
        </g>
      )}
      {traces.map((t) => (
        <g key={t.nm}>
          {t.trace.segments.slice(1).map((s, i) => (
            <Ray key={i} from={s.a} to={s.b} color={t.color} variant="real" fast widthPx={1.6} opacity={0.9} />
          ))}
        </g>
      ))}

      {/* Enter / reflect / exit points */}
      {mid.trace.events.map((e, i) => (
        <g key={i}>
          <circle cx={e.point.x} cy={e.point.y} r={3 * upp} fill="#f1f5f9" stroke="#0f172a" strokeWidth={1 * upp} />
          {!compact && (
            <Label
              x={e.point.x + (e.kind === 'enter' ? -10 : e.kind === 'exit' ? 10 : e.point.x > DROP_C.x ? 10 : -10) * upp}
              y={e.point.y + (e.point.y > DROP_C.y ? 13 : -11) * upp}
              text={e.kind === 'enter' ? 'refract in' : e.kind === 'reflect' ? 'reflect' : 'refract out'}
              anchor={e.kind === 'enter' ? 'end' : e.kind === 'exit' ? 'start' : e.point.x > DROP_C.x ? 'start' : 'end'}
              color="#cbd5e1"
              sizePx={10}
              bg
            />
          )}
        </g>
      ))}

      {/* Rainbow angle arcs at the exit points */}
      {redExit && <AngleArc vertex={redExit.origin} dirA={BACK_TO_SUN} dirB={redExit.dir} radius={64} color={red.color} label={`red ${red.trace.rainbowAngleDeg !== null ? fmtDeg(red.trace.rainbowAngleDeg) : '—'}`} />}
      {violetExit && !compact && (
        <AngleArc vertex={violetExit.origin} dirA={BACK_TO_SUN} dirB={violetExit.dir} radius={44} color={violet.color} label={`violet ${violet.trace.rainbowAngleDeg !== null ? fmtDeg(violet.trace.rainbowAngleDeg) : '—'}`} labelFactor={3.75} />
      )}

      {!compact && bowAngle !== null && <ObserverInset k={k} bowAngle={bowAngle} />}
    </g>
  )
}

/** Where the bow appears in the sky: observer, antisolar point and the cone of the bow. */
function ObserverInset({ k, bowAngle }: { k: Bow; bowAngle: number }) {
  const { unitsPerPx: upp } = useStage()
  const A: Vec2 = { x: 770, y: 232 } // antisolar point
  const d = 100
  const eye: Vec2 = { x: A.x - d, y: A.y }
  const r = d * Math.tan((bowAngle * Math.PI) / 180)
  const top: Vec2 = { x: A.x, y: A.y - r }
  const colours = k === 1 ? [...RB_WAVELENGTHS] : [...RB_WAVELENGTHS].reverse() // outer → inner: red first for the primary
  return (
    <g>
      <Label x={A.x} y={44} text="Where you see the bow" color="#e2e8f0" sizePx={11} weight={600} />
      {/* Sun behind the observer */}
      {[0, 1, 2].map((j) => {
        const y = eye.y - 34 + 12 * j
        return (
          <g key={j}>
            <line x1={600} y1={y} x2={645} y2={y} stroke={RAY_COLORS.incident} strokeOpacity={0.7} strokeWidth={1.4 * upp} />
            <Arrowhead from={{ x: 600, y }} to={{ x: 645, y }} color={RAY_COLORS.incident} opacity={0.8} t={0.85} sizePx={7} />
          </g>
        )
      })}
      <Label x={645} y={eye.y - 64} text="sun behind you" anchor="end" color={RAY_COLORS.incident} sizePx={10} />
      {/* Observer */}
      <circle cx={eye.x} cy={eye.y} r={6 * upp} fill="#e2e8f0" />
      <line x1={eye.x} y1={eye.y + 6 * upp} x2={eye.x} y2={eye.y + 34} stroke="#e2e8f0" strokeWidth={2 * upp} strokeLinecap="round" />
      <line x1={eye.x - 10} y1={eye.y + 48} x2={eye.x} y2={eye.y + 34} stroke="#e2e8f0" strokeWidth={2 * upp} strokeLinecap="round" />
      <line x1={eye.x + 10} y1={eye.y + 48} x2={eye.x} y2={eye.y + 34} stroke="#e2e8f0" strokeWidth={2 * upp} strokeLinecap="round" />
      {/* Antisolar line and cone edge */}
      <Ray from={eye} to={A} color={RAY_COLORS.guide} variant="guide" />
      <circle cx={A.x} cy={A.y} r={3 * upp} fill={RAY_COLORS.guide} />
      <Label x={A.x} y={A.y + 14 * upp} text="antisolar point" color="#94a3b8" sizePx={10} />
      <line x1={eye.x} y1={eye.y} x2={top.x} y2={top.y} stroke="#cbd5e1" strokeOpacity={0.7} strokeWidth={1 * upp} />
      <AngleArc vertex={eye} dirA={{ x: 1, y: 0 }} dirB={normalize(sub(top, eye))} radius={34} color="#e2e8f0" label={`${fmt(bowAngle, 0)}°`} labelFactor={1.6} />
      {/* The bow: concentric coloured arcs centred on the antisolar point */}
      {colours.map((nm, i) => {
        const rr = r + (3 - i) * 1.7 * upp
        return <path key={nm} d={`M ${A.x - rr} ${A.y} A ${rr} ${rr} 0 0 1 ${A.x + rr} ${A.y}`} fill="none" stroke={wavelengthToRGB(nm)} strokeWidth={1.8 * upp} strokeOpacity={0.95} />
      })}
    </g>
  )
}
