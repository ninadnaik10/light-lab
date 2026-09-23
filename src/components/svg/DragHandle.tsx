import type { KeyboardEvent } from 'react'
import type { Vec2 } from '../../lib/geometry'
import { useDrag } from '../../hooks/useDrag'
import { Label } from './Label'
import { useStage } from './Stage'

export type DragHandleProps = {
  pos: Vec2
  /** Called with viewBox coordinates while dragging. */
  onDrag: (p: Vec2) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  color?: string
  ariaLabel: string
  label?: string
  labelOffset?: Vec2
  /** Radius of the invisible hit area in CSS px (default 22). */
  hitRadiusPx?: number
  /** Arrow-key nudging: called with −1 / +1 (Left/Down = −1, Right/Up = +1). */
  onNudge?: (dir: -1 | 1, big: boolean) => void
}

/** A glowing draggable dot with a generous hit area, keyboard nudging, and an optional label. */
export function DragHandle({ pos, onDrag, onDragStart, onDragEnd, color = '#fde047', ariaLabel, label, labelOffset, hitRadiusPx = 22, onNudge }: DragHandleProps) {
  const { unitsPerPx } = useStage()
  const { onPointerDown, dragging } = useDrag(onDrag, { onStart: onDragStart, onEnd: onDragEnd })
  const r = 7 * unitsPerPx
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (!onNudge) return
    const big = e.shiftKey
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onNudge(1, big)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onNudge(-1, big)
    }
  }
  return (
    <g
      className="handle"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      tabIndex={0}
      role="slider"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      <circle cx={pos.x} cy={pos.y} r={hitRadiusPx * unitsPerPx} fill="transparent" />
      <circle cx={pos.x} cy={pos.y} r={r * 1.9} fill={color} fillOpacity={dragging ? 0.28 : 0.16} />
      <circle className="handle-ring" cx={pos.x} cy={pos.y} r={r * 1.35} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={1.2 * unitsPerPx} />
      <circle cx={pos.x} cy={pos.y} r={r} fill={color} filter="url(#glow)" />
      {label && <Label x={pos.x + (labelOffset?.x ?? 0)} y={pos.y + (labelOffset?.y ?? -18 * unitsPerPx)} text={label} color={color} sizePx={12} weight={600} bg />}
    </g>
  )
}
