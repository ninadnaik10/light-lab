import { Label } from './Label'
import { useStage } from './Stage'

export type AxisPoint = { label: string; x: number; behind?: boolean; color?: string }

/** Principal axis with tick marks and labels (viewBox coordinates). */
export function AxisMarkers({ y, x1, x2, points, labelBelow = true }: { y: number; x1: number; x2: number; points: AxisPoint[]; labelBelow?: boolean }) {
  const { unitsPerPx } = useStage()
  const tick = 6 * unitsPerPx
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#94a3b8" strokeWidth={1.2 * unitsPerPx} strokeOpacity={0.7} />
      {points.map((p) => (
        <g key={p.label} opacity={p.behind ? 0.6 : 1}>
          <line x1={p.x} y1={y - tick} x2={p.x} y2={y + tick} stroke={p.color ?? '#e2e8f0'} strokeWidth={1.6 * unitsPerPx} strokeDasharray={p.behind ? `${2 * unitsPerPx} ${2 * unitsPerPx}` : undefined} />
          <circle cx={p.x} cy={y} r={2.6 * unitsPerPx} fill={p.color ?? '#e2e8f0'} />
          <Label x={p.x} y={labelBelow ? y + 16 * unitsPerPx : y - 16 * unitsPerPx} text={p.label} color={p.color ?? '#e2e8f0'} sizePx={12} weight={700} />
        </g>
      ))}
    </g>
  )
}
