import { Label } from './Label'
import { useStage } from './Stage'

export type MediumRegionProps = {
  x: number
  y: number
  w: number
  h: number
  n: number
  label: string
  /** Tint colour; opacity scales with (n − 1). */
  color?: string
  labelAnchor?: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right'
}

/** A tinted rectangle for a medium, darker for optically denser media, with a name + n label. */
export function MediumRegion({ x, y, w, h, n, label, color = '#38bdf8', labelAnchor = 'top-left' }: MediumRegionProps) {
  const { unitsPerPx } = useStage()
  const opacity = Math.min(0.55, Math.max(0.02, (n - 1) * 0.38))
  const pad = 14 * unitsPerPx
  const lx = labelAnchor.endsWith('left') ? x + pad : x + w - pad
  const ly = labelAnchor.startsWith('top') ? y + pad + 6 * unitsPerPx : y + h - pad - 6 * unitsPerPx
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity={opacity} />
      <Label x={lx} y={ly} text={`${label}  ·  n = ${n.toFixed(n < 1.01 ? 4 : 3)}`} anchor={labelAnchor.endsWith('left') ? 'start' : 'end'} color="#e2e8f0" sizePx={12} weight={600} bg />
    </g>
  )
}
