import { useMemo } from 'react'
import { AngleArc, DragHandle, Label, MediumRegion, NormalLine, Ray, Stage, useStage } from '../../components/svg'
import { RAY_COLORS } from '../../lib/color'
import { clamp, fmtDeg } from '../../lib/format'
import { add, arcPathBetweenDirs, clipRayToRect, degToRad, scale, type Rect, type Vec2 } from '../../lib/geometry'
import { criticalAngleDeg, fresnelReflectance, snellAngle } from '../../lib/optics'
import { I_MAX, I_MIN, mediumName } from './shared'

export const STAGE_W = 900
export const STAGE_H = 480
/** Point of incidence. */
const O: Vec2 = { x: 450, y: 240 }
/** Radius of the arc the source handle travels on. */
const SOURCE_R = 205
const BOUNDS: Rect = { xMin: 0, xMax: STAGE_W, yMin: 0, yMax: STAGE_H }
const CRITICAL_COLOR = '#f87171'

export type RefractionDiagramProps = {
  /** Index of the medium the light starts in. */
  n1: number
  /** Index of the medium the light enters. */
  n2: number
  iDeg: number
  onChangeI: (deg: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  /** Draw the critical-angle reference ray and wedge (when n1 > n2). */
  showCriticalRef?: boolean
  /** Which half of the stage holds the source medium. Default 'top' (light travels downward). */
  sourceSide?: 'top' | 'bottom'
  /** Override the medium names (defaults come from the presets). */
  labels?: { top: string; bottom: string }
}

/**
 * Two media separated by a horizontal interface, a draggable source in the
 * first medium, and the incident / refracted / reflected rays with live
 * angle arcs. Used by both the Refraction and TIR sections.
 */
export function RefractionDiagram(props: RefractionDiagramProps) {
  return (
    <Stage viewBox={{ w: STAGE_W, h: STAGE_H }} ariaLabel="Refraction diagram: light crossing the boundary between two media">
      <DiagramBody {...props} />
    </Stage>
  )
}

function DiagramBody({ n1, n2, iDeg, onChangeI, onDragStart, onDragEnd, showCriticalRef = false, sourceSide = 'top', labels }: RefractionDiagramProps) {
  const { unitsPerPx } = useStage()
  const flip = sourceSide === 'bottom'

  const geo = useMemo(() => {
    // Everything is computed in a canonical frame with the source ABOVE the interface,
    // then mirrored vertically for sourceSide='bottom' (coordinates only, so text is never flipped).
    const mapY = (y: number) => (flip ? STAGE_H - y : y)
    const map = (p: Vec2): Vec2 => ({ x: p.x, y: mapY(p.y) })
    const mapDir = (d: Vec2): Vec2 => ({ x: d.x, y: flip ? -d.y : d.y })

    const i = degToRad(iDeg)
    const sinI = Math.sin(i)
    const cosI = Math.cos(i)

    const sourceC = { x: O.x - SOURCE_R * sinI, y: O.y - SOURCE_R * cosI }
    const toSourceDirC = { x: -sinI, y: -cosI }
    // Perpendicular to the source direction, pointing away from the normal toward the interface.
    const sourcePerpC = { x: -cosI, y: sinI }

    const rDeg = snellAngle(n1, n2, iDeg)
    const R = fresnelReflectance(n1, n2, iDeg)
    const grazing = rDeg !== null && rDeg > 90 - 0.3

    let refracted: { to: Vec2; dir: Vec2 } | null = null
    if (rDeg !== null) {
      const r = degToRad(rDeg)
      const dirC = grazing ? { x: 1, y: 0 } : { x: Math.sin(r), y: Math.cos(r) }
      const endC = grazing ? { x: STAGE_W, y: O.y } : clipRayToRect({ origin: O, dir: dirC }, BOUNDS)
      if (endC) refracted = { to: map(endC), dir: mapDir(dirC) }
    }

    const reflDirC = { x: sinI, y: -cosI }
    const reflEndC = clipRayToRect({ origin: O, dir: reflDirC }, BOUNDS)
    const reflected = reflEndC ? { to: map(reflEndC), dir: mapDir(reflDirC) } : null

    const tc = criticalAngleDeg(n1, n2)
    let critical: { tc: number; to: Vec2; wedge: string; dir: Vec2; perp: Vec2 } | null = null
    if (tc !== null) {
      const t = degToRad(tc)
      const dirC = { x: -Math.sin(t), y: -Math.cos(t) }
      const endC = clipRayToRect({ origin: O, dir: dirC }, BOUNDS)
      if (endC) {
        const pts: Vec2[] = [O, { x: O.x, y: 0 }]
        if (endC.y > 0.5) pts.push({ x: 0, y: 0 })
        pts.push(endC)
        const wedge = pts.map(map).map((p, k) => `${k === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        critical = { tc, to: map(endC), wedge, dir: mapDir(dirC), perp: mapDir({ x: -Math.cos(t), y: Math.sin(t) }) }
      }
    }

    const maxRad = degToRad(I_MAX)
    const sourceArc = arcPathBetweenDirs(O, SOURCE_R, mapDir({ x: 0, y: -1 }), mapDir({ x: -Math.sin(maxRad), y: -Math.cos(maxRad) }))

    return {
      source: map(sourceC),
      toSourceDir: mapDir(toSourceDirC),
      sourcePerp: mapDir(sourcePerpC),
      normalFirst: mapDir({ x: 0, y: -1 }),
      normalSecond: mapDir({ x: 0, y: 1 }),
      fallbackI: mapDir({ x: -0.6, y: -0.8 }),
      fallbackR: mapDir({ x: 0.6, y: 0.8 }),
      rDeg,
      R,
      grazing,
      refracted,
      reflected,
      critical,
      sourceArc,
      grazingLabel: map({ x: 780, y: O.y + 16 * unitsPerPx }),
    }
  }, [n1, n2, iDeg, flip, unitsPerPx])

  const topN = flip ? n2 : n1
  const bottomN = flip ? n1 : n2
  const px = (v: number) => v * unitsPerPx

  const handleDrag = (p: Vec2) => {
    const yC = flip ? STAGE_H - p.y : p.y
    const dx = Math.abs(p.x - O.x)
    const dy = Math.abs(yC - O.y)
    const deg = (Math.atan2(dx, dy) * 180) / Math.PI
    onChangeI(clamp(Math.round(deg * 10) / 10, I_MIN, I_MAX))
  }
  const handleNudge = (dir: -1 | 1, big: boolean) => onChangeI(clamp(Math.round((iDeg + dir * (big ? 5 : 1)) * 10) / 10, I_MIN, I_MAX))

  const refractedOpacity = geo.grazing ? Math.max(0.45, 1 - geo.R) : Math.max(0.15, 1 - geo.R)
  const reflectedOpacity = Math.max(0.15, geo.R)

  return (
    <g>
      {/* Media */}
      {/* Labels sit against the interface on the left, the one spot the source arc and rays never reach. */}
      <MediumRegion x={0} y={0} w={STAGE_W} h={STAGE_H / 2} n={topN} label={labels?.top ?? mediumName(topN)} labelAnchor="bottom-left" />
      <MediumRegion x={0} y={STAGE_H / 2} w={STAGE_W} h={STAGE_H / 2} n={bottomN} label={labels?.bottom ?? mediumName(bottomN)} labelAnchor="top-left" />

      {/* Critical-angle zone */}
      {showCriticalRef && geo.critical && <path d={geo.critical.wedge} fill={CRITICAL_COLOR} fillOpacity={0.08} />}

      {/* Interface + normal */}
      <line x1={0} y1={O.y} x2={STAGE_W} y2={O.y} stroke="#e2e8f0" strokeOpacity={0.55} strokeWidth={px(1.5)} />
      <path d={geo.sourceArc} fill="none" stroke={RAY_COLORS.guide} strokeOpacity={0.35} strokeWidth={px(1)} strokeDasharray={`${px(2)} ${px(5)}`} />
      <NormalLine at={O} dir={{ x: 0, y: 1 }} halfLength={200} />

      {showCriticalRef && geo.critical && (
        <g>
          <Ray from={O} to={geo.critical.to} color={CRITICAL_COLOR} variant="guide" />
          {(() => {
            const p = add(O, add(scale(geo.critical.dir, 178), scale(geo.critical.perp, px(22))))
            return <Label x={p.x} y={p.y} text={`θc = ${fmtDeg(geo.critical.tc)}`} color={CRITICAL_COLOR} sizePx={12} weight={600} bg />
          })()}
        </g>
      )}

      {/* Rays */}
      {geo.refracted && <Ray key="refracted" from={O} to={geo.refracted.to} color={RAY_COLORS.refracted} opacity={refractedOpacity} arrowhead />}
      {geo.reflected && <Ray key="reflected" from={O} to={geo.reflected.to} color={RAY_COLORS.reflected} opacity={reflectedOpacity} arrowhead />}
      <Ray key="incident" from={geo.source} to={O} color={RAY_COLORS.incident} arrowhead />

      {/* Angles */}
      {geo.reflected && iDeg >= 4 && (
        <path d={arcPathBetweenDirs(O, 48, geo.normalFirst, geo.reflected.dir)} fill="none" stroke={RAY_COLORS.reflected} strokeOpacity={0.45} strokeWidth={px(1.2)} />
      )}
      <AngleArc vertex={O} dirA={geo.toSourceDir} dirB={geo.normalFirst} radius={72} color={RAY_COLORS.incident} label={`i = ${fmtDeg(iDeg)}`} fallbackLabelDir={geo.fallbackI} />
      {geo.refracted && geo.rDeg !== null && (
        <AngleArc vertex={O} dirA={geo.normalSecond} dirB={geo.refracted.dir} radius={72} color={RAY_COLORS.refracted} label={`r = ${fmtDeg(geo.rDeg)}`} fallbackLabelDir={geo.fallbackR} />
      )}
      {geo.grazing && <Label x={geo.grazingLabel.x} y={geo.grazingLabel.y} text="grazing" color={RAY_COLORS.refracted} sizePx={12} weight={600} bg />}

      {/* Source handle */}
      <DragHandle
        pos={geo.source}
        onDrag={handleDrag}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        color={RAY_COLORS.incident}
        ariaLabel="Light source: drag to change the angle of incidence"
        label="source"
        labelOffset={scale(geo.sourcePerp, px(26))}
        hitRadiusPx={24}
        onNudge={handleNudge}
      />
    </g>
  )
}
