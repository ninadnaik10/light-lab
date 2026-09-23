import type { Vec2 } from '../../lib/geometry'
import { useStage } from './Stage'

/** Schematic thin lens: two arcs. Convex bulges outward, concave bulges inward. */
export function LensShape({ kind, centre, halfHeight, color = '#7dd3fc' }: { kind: 'convex' | 'concave'; centre: Vec2; halfHeight: number; color?: string }) {
  const { unitsPerPx } = useStage()
  const top = { x: centre.x, y: centre.y - halfHeight }
  const bot = { x: centre.x, y: centre.y + halfHeight }
  const bulge = Math.min(halfHeight * 0.16, 28)
  const edge = 5 * unitsPerPx
  const path =
    kind === 'convex'
      ? `M ${top.x} ${top.y} Q ${centre.x + 2 * bulge} ${centre.y} ${bot.x} ${bot.y} Q ${centre.x - 2 * bulge} ${centre.y} ${top.x} ${top.y} Z`
      : `M ${top.x - edge - bulge} ${top.y} L ${top.x + edge + bulge} ${top.y} Q ${centre.x + edge - bulge * 0.6} ${centre.y} ${bot.x + edge + bulge} ${bot.y} L ${bot.x - edge - bulge} ${bot.y} Q ${centre.x - edge + bulge * 0.6} ${centre.y} ${top.x - edge - bulge} ${top.y} Z`
  return (
    <g>
      <path d={path} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={2.2 * unitsPerPx} strokeLinejoin="round" />
      <line x1={centre.x} y1={top.y} x2={centre.x} y2={bot.y} stroke={color} strokeOpacity={0.35} strokeWidth={1 * unitsPerPx} strokeDasharray={`${3 * unitsPerPx} ${5 * unitsPerPx}`} />
    </g>
  )
}
