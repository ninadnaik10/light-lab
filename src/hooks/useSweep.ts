import { useEffect, useRef } from 'react'

export type SweepOptions = {
  enabled: boolean
  /** Pause without resetting (e.g. while the user is dragging). */
  paused?: boolean
  value: number
  min: number
  max: number
  degPerSec: number
  onChange: (v: number) => void
  /** Slow the sweep near an interesting value (e.g. the critical angle). */
  slowNear?: { at: number; within: number; factor: number }
  /** Rounding applied to emitted values (default 0.1). */
  step?: number
}

/**
 * Animates a single numeric state back and forth between min and max using
 * requestAnimationFrame. Emits through `onChange` so the slider, drag handle
 * and sweep all write the same source of truth.
 */
export function useSweep(opts: SweepOptions): void {
  const { enabled, paused = false, min, max, degPerSec, step = 0.1 } = opts
  const latest = useRef(opts)
  latest.current = opts
  const state = useRef({ value: opts.value, dir: 1 as 1 | -1 })
  const slowAt = opts.slowNear?.at
  const slowWithin = opts.slowNear?.within
  const slowFactor = opts.slowNear?.factor

  useEffect(() => {
    if (!enabled || paused) return
    state.current.value = latest.current.value
    let last = performance.now()
    let id = 0
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 1000
      last = now
      let speed = degPerSec
      if (slowAt !== undefined && slowWithin !== undefined && slowFactor !== undefined) {
        if (Math.abs(state.current.value - slowAt) < slowWithin) speed *= slowFactor
      }
      let next = state.current.value + state.current.dir * speed * dt
      if (next >= max) {
        next = max
        state.current.dir = -1
      } else if (next <= min) {
        next = min
        state.current.dir = 1
      }
      state.current.value = next
      latest.current.onChange(Math.round(next / step) * step)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [enabled, paused, min, max, degPerSec, step, slowAt, slowWithin, slowFactor])
}
