import { add, normalize, scale, type Vec2 } from '../../lib/geometry'
import { RAY_COLORS } from '../../lib/color'
import { useStage } from './Stage'

/** Dashed normal (perpendicular) through a point on a surface. */
export function NormalLine({ at, dir, halfLength, color = RAY_COLORS.normal }: { at: Vec2; dir: Vec2; halfLength: number; color?: string }) {
  const { unitsPerPx } = useStage()
  const d = normalize(dir)
  const a = add(at, scale(d, halfLength))
  const b = add(at, scale(d, -halfLength))
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.2 * unitsPerPx} strokeDasharray={`${5 * unitsPerPx} ${5 * unitsPerPx}`} strokeOpacity={0.8} />
}
