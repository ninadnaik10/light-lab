import type { Vec2 } from '../../lib/geometry'
import { useStage } from './Stage'

/**
 * Schematic spherical mirror: a shallow arc through the pole with a hatched
 * (silvered) back on the right. Object side is the left. Concave bulges away
 * from the object (to the right); convex bulges toward it.
 */
export function MirrorShape({ kind, pole, halfHeight, color = '#cbd5e1' }: { kind: 'concave' | 'convex'; pole: Vec2; halfHeight: number; color?: string }) {
  const { unitsPerPx } = useStage()
  const sag = (kind === 'concave' ? 1 : -1) * Math.min(halfHeight * 0.22, 40)
  const top = { x: pole.x, y: pole.y - halfHeight }
  const bot = { x: pole.x, y: pole.y + halfHeight }
  const ctrl = { x: pole.x + 2 * sag, y: pole.y }
  const path = `M ${top.x} ${top.y} Q ${ctrl.x} ${ctrl.y} ${bot.x} ${bot.y}`
  const back = 9 * unitsPerPx
  const backPath = `M ${top.x} ${top.y} Q ${ctrl.x} ${ctrl.y} ${bot.x} ${bot.y} L ${bot.x + back} ${bot.y} Q ${ctrl.x + back} ${ctrl.y} ${top.x + back} ${top.y} Z`
  return (
    <g>
      <path d={backPath} fill="url(#hatch)" opacity={0.7} />
      <path d={path} fill="none" stroke={color} strokeWidth={3.2 * unitsPerPx} strokeLinecap="round" />
      <line x1={pole.x} y1={top.y} x2={pole.x} y2={bot.y} stroke={color} strokeOpacity={0.18} strokeWidth={1 * unitsPerPx} strokeDasharray={`${3 * unitsPerPx} ${5 * unitsPerPx}`} />
    </g>
  )
}
