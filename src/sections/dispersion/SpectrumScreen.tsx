import { useId } from 'react'
import { Label, useStage } from '../../components/svg'
import { SCREEN_X, SCREEN_Y1, SCREEN_Y2 } from './model'

export type ScreenHit = { nm: number; y: number; color: string }

/** Vertical screen strip painted with the spectrum where the exit rays land. */
export function SpectrumScreen({ hits }: { hits: ScreenHit[] }) {
  const { unitsPerPx: upp } = useStage()
  const gradId = useId()
  const w = 12 * upp
  const x = SCREEN_X - w / 2
  const sorted = [...hits].sort((a, b) => a.y - b.y)
  const yMin = sorted.length ? sorted[0].y : 0
  const yMax = sorted.length ? sorted[sorted.length - 1].y : 0
  const span = yMax - yMin
  const pad = 3 * upp

  return (
    <g>
      <rect x={x} y={SCREEN_Y1} width={w} height={SCREEN_Y2 - SCREEN_Y1} rx={2 * upp} fill="#1e293b" stroke="#475569" strokeWidth={1 * upp} />
      <Label x={SCREEN_X + 6 * upp} y={SCREEN_Y1 - 16 * upp} text="screen" anchor="end" color="#94a3b8" sizePx={11} />
      {sorted.length === 0 && <Label x={SCREEN_X - 12 * upp} y={(SCREEN_Y1 + SCREEN_Y2) / 2} text="no light reaches the screen" anchor="end" color="#64748b" sizePx={11} />}
      {sorted.length === 1 && (
        <g>
          <rect x={x - 2 * upp} y={sorted[0].y - 4 * upp} width={w + 4 * upp} height={8 * upp} fill={sorted[0].color} opacity={0.35} filter="url(#glow)" />
          <rect x={x} y={sorted[0].y - 2.5 * upp} width={w} height={5 * upp} fill={sorted[0].color} />
        </g>
      )}
      {sorted.length > 1 && span > 1e-6 && (
        <g>
          <defs>
            <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={SCREEN_X} y1={yMin} x2={SCREEN_X} y2={yMax}>
              {sorted.map((h) => (
                <stop key={h.nm} offset={(h.y - yMin) / span} stopColor={h.color} />
              ))}
            </linearGradient>
          </defs>
          <rect x={x - 2 * upp} y={yMin - pad - 2 * upp} width={w + 4 * upp} height={span + 2 * pad + 4 * upp} fill={`url(#${gradId})`} opacity={0.4} filter="url(#glow)" />
          <rect x={x} y={yMin - pad} width={w} height={span + 2 * pad} fill={`url(#${gradId})`} />
        </g>
      )}
    </g>
  )
}
