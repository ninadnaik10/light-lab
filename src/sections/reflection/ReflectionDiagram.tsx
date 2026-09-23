import { useMemo } from 'react'
import { AngleArc, DragHandle, Label, NormalLine, Ray, Stage, useStage } from '../../components/svg'
import { RAY_COLORS } from '../../lib/color'
import { fmt, fmtDeg } from '../../lib/format'
import { normalize, sub } from '../../lib/geometry'
import {
  I_MAX,
  I_MIN,
  MIRROR_X1,
  MIRROR_X2,
  MIRROR_Y,
  NORMAL_UP,
  O,
  STAGE_H,
  STAGE_H_IMAGE,
  STAGE_W,
  imageOf,
  incidenceFromPointer,
  reflectedDir,
  reflectedEnd,
  sourceFor,
} from './geometry'

export type ReflectionDiagramProps = {
  iDeg: number
  showImage: boolean
  onDrag: (iDeg: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  onNudge: (dir: -1 | 1, big: boolean) => void
}

/** Plane-mirror stage: mirror, normal, incident + reflected rays, angle arcs, optional virtual image. */
export function ReflectionDiagram({ iDeg, showImage, onDrag, onDragStart, onDragEnd, onNudge }: ReflectionDiagramProps) {
  return (
    <Stage viewBox={{ w: STAGE_W, h: showImage ? STAGE_H_IMAGE : STAGE_H }} ariaLabel="Plane mirror reflection diagram">
      <Scene iDeg={iDeg} showImage={showImage} onDrag={onDrag} onDragStart={onDragStart} onDragEnd={onDragEnd} onNudge={onNudge} />
    </Stage>
  )
}

function Scene({ iDeg, showImage, onDrag, onDragStart, onDragEnd, onNudge }: ReflectionDiagramProps) {
  const { unitsPerPx: upp } = useStage()
  const geo = useMemo(() => {
    const source = sourceFor(iDeg)
    return {
      source,
      reflectedTo: reflectedEnd(iDeg),
      toSource: normalize(sub(source, O)),
      rDir: reflectedDir(iDeg),
      image: imageOf(source),
      distancePx: source.y === MIRROR_Y ? 0 : MIRROR_Y - source.y,
    }
  }, [iDeg])
  const { source, reflectedTo, toSource, rDir, image, distancePx } = geo
  const distanceCm = fmt(distancePx / 10, 1)
  const showArcs = iDeg >= 4
  const foot = { x: source.x, y: MIRROR_Y }

  return (
    <g>
      {/* Space behind the mirror (only visible in image mode) */}
      {showImage && (
        <g>
          <rect x={0} y={MIRROR_Y + 14} width={STAGE_W} height={STAGE_H_IMAGE - MIRROR_Y - 14} fill="#020617" opacity={0.45} />
          <Label x={MIRROR_X1} y={MIRROR_Y + 34 * upp} text="behind the mirror (no light actually goes here)" anchor="start" color="#64748b" sizePx={11} />
        </g>
      )}

      {/* Mirror: silvered line with a hatched back */}
      <rect x={MIRROR_X1} y={MIRROR_Y} width={MIRROR_X2 - MIRROR_X1} height={14} fill="url(#hatch)" opacity={0.85} />
      <line x1={MIRROR_X1} y1={MIRROR_Y} x2={MIRROR_X2} y2={MIRROR_Y} stroke="#e2e8f0" strokeWidth={3 * upp} strokeLinecap="round" />
      <Label x={MIRROR_X2} y={MIRROR_Y + 28 * upp} text="plane mirror" anchor="end" color="#94a3b8" sizePx={11} />

      {/* Normal (only above the mirror) */}
      <NormalLine at={{ x: O.x, y: MIRROR_Y - 160 }} dir={NORMAL_UP} halfLength={160} />
      <Label x={O.x + 8 * upp} y={MIRROR_Y - 316} text="normal" anchor="start" color={RAY_COLORS.normal} sizePx={11} />

      {/* Virtual image construction */}
      {showImage && (
        <g>
          <Ray from={O} to={image} color={RAY_COLORS.virtual} variant="virtual" />
          <Ray from={source} to={image} color={RAY_COLORS.guide} variant="guide" />
          <circle cx={foot.x} cy={foot.y} r={2.5 * upp} fill={RAY_COLORS.guide} />
          <circle cx={image.x} cy={image.y} r={6 * upp} fill="none" stroke={RAY_COLORS.virtualImage} strokeWidth={2 * upp} />
          <Label x={image.x + 14 * upp} y={image.y} text="virtual image S′" anchor="start" color={RAY_COLORS.virtualImage} sizePx={12} weight={600} bg />
          {distancePx > 40 && (
            <g>
              <Label x={source.x + 10 * upp} y={(source.y + MIRROR_Y) / 2} text={`${distanceCm} cm`} anchor="start" color="#cbd5e1" sizePx={11} bg />
              <Label x={image.x + 10 * upp} y={(image.y + MIRROR_Y) / 2} text={`${distanceCm} cm`} anchor="start" color="#cbd5e1" sizePx={11} bg />
            </g>
          )}
        </g>
      )}

      {/* Rays */}
      <Ray from={source} to={O} color={RAY_COLORS.incident} variant="real" arrowhead />
      <Ray from={O} to={reflectedTo} color={RAY_COLORS.reflected} variant="real" arrowhead />

      {/* Angle arcs */}
      {showArcs ? (
        <g>
          <AngleArc vertex={O} dirA={NORMAL_UP} dirB={toSource} radius={64} color={RAY_COLORS.incident} label={`i = ${fmtDeg(iDeg)}`} />
          {/* Larger radius so the two labels stack instead of colliding at small angles */}
          <AngleArc vertex={O} dirA={NORMAL_UP} dirB={rDir} radius={94} color={RAY_COLORS.reflected} label={`r = ${fmtDeg(iDeg)}`} />
        </g>
      ) : (
        <Label x={O.x} y={O.y - 110} text={`i = r = ${fmtDeg(iDeg)}`} color="#f1f5f9" sizePx={13} weight={600} bg />
      )}

      <Label x={O.x} y={MIRROR_Y + 28 * upp} text="O" color="#e2e8f0" sizePx={12} weight={700} />

      <DragHandle
        pos={source}
        color={RAY_COLORS.incident}
        ariaLabel={`Light source, angle of incidence ${fmtDeg(iDeg)}. Use arrow keys to change.`}
        label="source S"
        onDrag={(p) => onDrag(incidenceFromPointer(p))}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onNudge={(dir, big) => onNudge(dir, big)}
      />
      {/* Screen-reader friendly range hints */}
      <desc>{`Angle of incidence ${fmtDeg(iDeg)} (range ${I_MIN}–${I_MAX}°), angle of reflection ${fmtDeg(iDeg)}.`}</desc>
    </g>
  )
}
