import { dist, normalize, sub, type Vec2 } from '../../lib/geometry'
import { Label } from './Label'
import { useStage } from './Stage'

export type ArrowFigureProps = {
  /** Base on the axis (viewBox coords). */
  base: Vec2
  tip: Vec2
  color: string
  dashed?: boolean
  label?: string
  labelSide?: 'above' | 'below'
  opacity?: number
}

/** Object / image arrow standing on the principal axis. Dashed = virtual image. */
export function ArrowFigure({ base, tip, color, dashed = false, label, labelSide, opacity = 1 }: ArrowFigureProps) {
  const { unitsPerPx } = useStage()
  const len = dist(base, tip)
  if (len < 1e-6) return null
  const d = normalize(sub(tip, base))
  const n = { x: -d.y, y: d.x }
  const head = Math.min(11 * unitsPerPx, len * 0.5)
  const hb = { x: tip.x - d.x * head, y: tip.y - d.y * head }
  const l = { x: hb.x + n.x * head * 0.55, y: hb.y + n.y * head * 0.55 }
  const r = { x: hb.x - n.x * head * 0.55, y: hb.y - n.y * head * 0.55 }
  const w = 2.8 * unitsPerPx
  const side = labelSide ?? (tip.y < base.y ? 'above' : 'below')
  const ly = side === 'above' ? tip.y - 14 * unitsPerPx : tip.y + 14 * unitsPerPx
  return (
    <g opacity={opacity}>
      <line x1={base.x} y1={base.y} x2={hb.x} y2={hb.y} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? `${6 * unitsPerPx} ${5 * unitsPerPx}` : undefined} />
      <polygon points={`${tip.x},${tip.y} ${l.x},${l.y} ${r.x},${r.y}`} fill={dashed ? 'none' : color} stroke={color} strokeWidth={dashed ? 1.5 * unitsPerPx : 0} />
      {label && <Label x={tip.x} y={ly} text={label} color={color} sizePx={12} weight={700} bg />}
    </g>
  )
}
