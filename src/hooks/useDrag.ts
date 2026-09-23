import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Vec2 } from '../lib/geometry'
import { useStage } from '../components/svg/Stage'

export type DragHandlers = {
  onPointerDown: (e: ReactPointerEvent<SVGElement>) => void
  dragging: boolean
}

/**
 * Pointer-drag inside the nearest <Stage>. Calls `onMove` with viewBox
 * coordinates (converted through the SVG's screen CTM, so it stays correct when
 * the SVG is scaled or letterboxed). Coalesces pointermove to one call per
 * animation frame. Works with mouse, touch and pen.
 */
export function useDrag(onMove: (p: Vec2) => void, opts?: { onStart?: () => void; onEnd?: () => void }): DragHandlers {
  const { svgRef } = useStage()
  const cb = useRef(onMove)
  const startCb = useRef(opts?.onStart)
  const endCb = useRef(opts?.onEnd)
  useEffect(() => {
    cb.current = onMove
    startCb.current = opts?.onStart
    endCb.current = opts?.onEnd
  })
  const [dragging, setDragging] = useState(false)

  const toSvg = useCallback(
    (clientX: number, clientY: number): Vec2 | null => {
      const svg = svgRef.current
      if (!svg) return null
      const ctm = svg.getScreenCTM()
      if (!ctm) return null
      const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
      return { x: p.x, y: p.y }
    },
    [svgRef],
  )

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<SVGElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      e.preventDefault()
      e.stopPropagation()
      const target = e.currentTarget
      try {
        target.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      setDragging(true)
      startCb.current?.()
      const first = toSvg(e.clientX, e.clientY)
      if (first) cb.current(first)

      let raf = 0
      let pending: Vec2 | null = null
      const move = (ev: PointerEvent) => {
        pending = toSvg(ev.clientX, ev.clientY)
        if (!raf) {
          raf = requestAnimationFrame(() => {
            raf = 0
            if (pending) cb.current(pending)
          })
        }
      }
      const up = () => {
        target.removeEventListener('pointermove', move)
        target.removeEventListener('pointerup', up)
        target.removeEventListener('pointercancel', up)
        if (raf) cancelAnimationFrame(raf)
        setDragging(false)
        endCb.current?.()
      }
      target.addEventListener('pointermove', move)
      target.addEventListener('pointerup', up)
      target.addEventListener('pointercancel', up)
    },
    [toSvg],
  )

  return { onPointerDown, dragging }
}
