/**
 * Pure math for the mirage demo: a stack of horizontal air layers whose
 * refractive index falls toward a hot road. A ray from the sky is refracted
 * at every interface (Snell's law, angles from the vertical normal) and turns
 * back up by total internal reflection when sin θ would exceed 1.
 *
 * Coordinates are stage (viewBox) units, y down. The vertical scale is taken
 * as 1 unit ≙ 1 cm; the horizontal axis is compressed by `K` so a 2°–20° ray
 * fits on a 900-unit stage (true horizontal distances are K times longer).
 */
import { degToRad, normalize, type Vec2 } from '../../../lib/geometry'

export const MIRAGE = {
  W: 900,
  H: 300,
  /** Top of the layered air (also the height of the sky object and the eye). */
  Y_TOP: 40,
  /** Road surface. */
  Y_ROAD: 250,
  N_LAYERS: 24,
  /** Index of the coolest air at the top of the stack. */
  N_TOP: 1.00029,
  /** Where the ray from the sky object starts. */
  X_SOURCE: 50,
  /** Right-most point a ray can reach. */
  X_MAX: 860,
  /** Horizontal compression: one drawn unit is K true units. */
  K: 5,
  DN_MIN: 0,
  DN_MAX: 0.06,
  ALPHA_MIN: 2,
  ALPHA_MAX: 20,
} as const

export const LAYER_H = (MIRAGE.Y_ROAD - MIRAGE.Y_TOP) / MIRAGE.N_LAYERS

/** Refractive index of layer i (0 = top, N−1 = touching the road). */
export function layerIndex(i: number, dn: number): number {
  return MIRAGE.N_TOP - dn * (i / (MIRAGE.N_LAYERS - 1))
}

/** Top y of layer i. */
export const layerTop = (i: number): number => MIRAGE.Y_TOP + i * LAYER_H

export type MirageOutcome = 'mirage' | 'road' | 'passes'

export type MirageTrace = {
  /** Drawn polyline of the ray, starting at the sky object. */
  points: Vec2[]
  outcome: MirageOutcome
  /** Interface (drawn y) where the ray turned back up, or null if it never did. */
  turnY: number | null
  /** Height of the turning point above the road in cm (1 unit ≙ 1 cm). */
  turnHeightCm: number | null
  /** The observer, at the end of the polyline (mirage outcome only). */
  eye: Vec2 | null
  /** Unit drawn direction of the last segment. */
  endDir: Vec2
  nTop: number
  nRoad: number
}

/**
 * Trace the ray leaving the sky object `alphaDeg` below the horizontal
 * through the layer stack with index contrast `dn` (top minus road).
 */
export function traceMirage(alphaDeg: number, dn: number): MirageTrace {
  const N = MIRAGE.N_LAYERS
  const n = (i: number) => layerIndex(i, dn)
  // Snell invariant: n_i sin θ_i, θ measured from the vertical normal.
  const C = MIRAGE.N_TOP * Math.cos(degToRad(alphaDeg))
  const nTop = n(0)
  const nRoad = n(N - 1)

  const points: Vec2[] = [{ x: MIRAGE.X_SOURCE, y: MIRAGE.Y_TOP }]
  let x = MIRAGE.X_SOURCE
  let y = MIRAGE.Y_TOP
  let i = 0
  let down = true
  let turnY: number | null = null

  const finish = (outcome: MirageOutcome, eye: Vec2 | null): MirageTrace => {
    const a = points[points.length - 2] ?? points[0]
    const b = points[points.length - 1]
    const endDir = normalize({ x: b.x - a.x, y: b.y - a.y })
    return { points, outcome, turnY, turnHeightCm: turnY === null ? null : MIRAGE.Y_ROAD - turnY, eye, endDir, nTop, nRoad }
  }

  for (let guard = 0; guard < 4 * N + 8; guard++) {
    const s = Math.min(1 - 1e-9, C / n(i))
    const tan = s / Math.sqrt(1 - s * s)
    const dx = (LAYER_H * tan) / MIRAGE.K
    const dy = down ? LAYER_H : -LAYER_H

    if (x + dx > MIRAGE.X_MAX) {
      // Leaves through the right edge before finishing this layer.
      const f = (MIRAGE.X_MAX - x) / dx
      const end = { x: MIRAGE.X_MAX, y: y + dy * f }
      points.push(end)
      return down ? finish('passes', null) : finish('mirage', end)
    }

    x += dx
    y += dy
    points.push({ x, y })

    if (down) {
      if (i === N - 1) return finish('road', null)
      if (C / n(i + 1) >= 1) {
        // Total internal reflection at the interface below: turn back up.
        down = false
        turnY = y
      } else {
        i++
      }
    } else {
      if (i === 0) return finish('mirage', { x, y })
      i--
    }
  }
  return finish(down ? 'passes' : 'mirage', down ? null : { x, y })
}

/**
 * Dashed backward extension of the ray arriving at the eye: where the sky
 * seems to come from. Ends a little below the road so the "puddle" reads as an
 * image beneath the surface; clipped at the left edge of the stage.
 */
export function apparentSky(trace: MirageTrace): { from: Vec2; to: Vec2; roadPoint: Vec2 | null } | null {
  if (!trace.eye || trace.outcome !== 'mirage') return null
  const back = { x: -trace.endDir.x, y: -trace.endDir.y }
  if (back.y <= 1e-9) return null
  const X_MIN = 24
  const yEnd = MIRAGE.Y_ROAD + 22
  let t = (yEnd - trace.eye.y) / back.y
  if (trace.eye.x + back.x * t < X_MIN) t = (X_MIN - trace.eye.x) / back.x
  const to = { x: trace.eye.x + back.x * t, y: trace.eye.y + back.y * t }
  const tRoad = (MIRAGE.Y_ROAD - trace.eye.y) / back.y
  const rx = trace.eye.x + back.x * tRoad
  const roadPoint = rx >= X_MIN ? { x: rx, y: MIRAGE.Y_ROAD } : null
  return { from: trace.eye, to, roadPoint }
}
