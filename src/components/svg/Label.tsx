import { useStage } from './Stage'

export type LabelProps = {
  x: number
  y: number
  text: string
  color?: string
  /** Font size in CSS px (default 12) */
  sizePx?: number
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
  /** Draw a dark pill behind the text for legibility */
  bg?: boolean
  mono?: boolean
  opacity?: number
  baseline?: 'middle' | 'hanging' | 'auto'
}

/** SVG text that stays a constant on-screen size regardless of viewBox scaling. */
export function Label({ x, y, text, color = '#e2e8f0', sizePx = 12, anchor = 'middle', weight = 500, bg = false, mono = false, opacity = 1, baseline = 'middle' }: LabelProps) {
  const { unitsPerPx } = useStage()
  const fs = sizePx * unitsPerPx
  const padX = fs * 0.4
  const width = text.length * fs * 0.58 + padX * 2
  const height = fs * 1.35
  const bx = anchor === 'middle' ? x - width / 2 : anchor === 'start' ? x - padX : x - width + padX
  return (
    <g opacity={opacity}>
      {bg && <rect x={bx} y={y - height / 2} width={width} height={height} rx={fs * 0.35} fill="#0f172a" fillOpacity={0.85} />}
      <text
        x={x}
        y={y}
        fill={color}
        fontSize={fs}
        fontWeight={weight}
        textAnchor={anchor}
        dominantBaseline={baseline}
        fontFamily={mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {text}
      </text>
    </g>
  )
}
