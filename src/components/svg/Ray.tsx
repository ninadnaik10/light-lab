import { memo } from 'react'
import { dist, lerp, normalize, sub, type Vec2 } from '../../lib/geometry'
import { useStage } from './Stage'

export type RayVariant = 'real' | 'virtual' | 'guide'

export type RayProps = {
  /** Where the light comes FROM (dashes flow from → to). */
  from: Vec2
  to: Vec2
  color: string
  variant?: RayVariant
  /** 0..1, multiplies the base opacity */
  opacity?: number
  /** Animate flowing dashes (real rays only). Default true. */
  flow?: boolean
  fast?: boolean
  /** Draw a small direction arrowhead part-way along the ray. */
  arrowhead?: boolean
  /** Stroke width in CSS px (default 2.5 real / 1.5 virtual / 1 guide). */
  widthPx?: number
}

/**
 * A light ray. `real` rays are solid with an animated dashed overlay showing
 * the direction of travel; `virtual` rays are static dashes; `guide` lines are
 * thin dotted grey helpers.
 */
export const Ray = memo(function Ray({
  from,
  to,
  color,
  variant = 'real',
  opacity = 1,
  flow = true,
  fast = false,
  arrowhead = false,
  widthPx,
}: RayProps) {
  const { unitsPerPx } = useStage()
  const w = (widthPx ?? (variant === 'real' ? 2.5 : variant === 'virtual' ? 1.6 : 1.1)) * unitsPerPx
  if (dist(from, to) < 1e-6) return null

  if (variant === 'real') {
    return (
      <g>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={w} strokeOpacity={0.45 * opacity} strokeLinecap="round" />
        {flow && (
          <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth={w}
            strokeOpacity={opacity}
            className={fast ? 'ray-flow-fast' : 'ray-flow'}
          />
        )}
        {!flow && <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={w} strokeOpacity={opacity} strokeLinecap="round" />}
        {arrowhead && <Arrowhead from={from} to={to} color={color} opacity={opacity} />}
      </g>
    )
  }

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={w}
      strokeOpacity={(variant === 'virtual' ? 0.75 : 0.6) * opacity}
      strokeDasharray={variant === 'virtual' ? `${7 * unitsPerPx} ${6 * unitsPerPx}` : `${2.5 * unitsPerPx} ${5 * unitsPerPx}`}
      strokeLinecap="round"
    />
  )
})

/** Small filled triangle pointing from → to, placed at parameter t along the segment. */
export function Arrowhead({ from, to, color, opacity = 1, t = 0.55, sizePx = 9 }: { from: Vec2; to: Vec2; color: string; opacity?: number; t?: number; sizePx?: number }) {
  const { unitsPerPx } = useStage()
  const s = sizePx * unitsPerPx
  const p = lerp(from, to, t)
  const d = normalize(sub(to, from))
  const n = { x: -d.y, y: d.x }
  const tip = { x: p.x + d.x * s * 0.6, y: p.y + d.y * s * 0.6 }
  const l = { x: p.x - d.x * s * 0.5 + n.x * s * 0.45, y: p.y - d.y * s * 0.5 + n.y * s * 0.45 }
  const r = { x: p.x - d.x * s * 0.5 - n.x * s * 0.45, y: p.y - d.y * s * 0.5 - n.y * s * 0.45 }
  return <polygon points={`${tip.x},${tip.y} ${l.x},${l.y} ${r.x},${r.y}`} fill={color} fillOpacity={opacity} />
}
