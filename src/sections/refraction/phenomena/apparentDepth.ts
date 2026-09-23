/**
 * Pure math for the apparent-depth demo: a coin on the floor of a tank seen
 * from above through the water surface. Stage units, y down.
 */
import { intersectLines, normalize, sub, type Vec2 } from '../../../lib/geometry'
import { snellAngle } from '../../../lib/optics'

export const TANK = {
  W: 900,
  H: 300,
  X1: 150,
  X2: 750,
  Y_SURFACE: 110,
  /** Floor position when the tank holds D_MAX cm of liquid. */
  Y_FLOOR_MAX: 270,
  D_MIN: 5,
  D_MAX: 30,
  X_COIN: 300,
  /** Height at which the refracted rays are collected by the eye. */
  Y_EYE: 40,
  N_AIR: 1.0003,
  N_MIN: 1.0,
  N_MAX: 2.0,
  /** Angles from the vertical of the two traced rays leaving the coin. */
  RAY_ANGLES: [6, 12] as readonly number[],
  /** Coin half-thickness (the coin centre sits this far above the floor). */
  COIN_RY: 3,
} as const

export const PX_PER_CM = (TANK.Y_FLOOR_MAX - TANK.Y_SURFACE) / TANK.D_MAX

export const cmToPx = (cm: number): number => cm * PX_PER_CM
export const pxToCm = (px: number): number => px / PX_PER_CM

export type DepthRay = {
  thetaDeg: number
  rDeg: number
  /** Where the ray meets the surface. */
  surface: Vec2
  /** Where it reaches the eye height. */
  end: Vec2
  /** Unit direction in air. */
  airDir: Vec2
}

export type ApparentDepthModel = {
  dCm: number
  n: number
  /** Coin centre (depth d below the surface). */
  coin: Vec2
  floorY: number
  rays: DepthRay[]
  /** Where the backward extensions of the two air rays meet. */
  apparent: Vec2 | null
  /** Apparent depth read off the traced intersection, cm. */
  tracedDepthCm: number | null
  /** Paraxial apparent depth d / n, cm. */
  paraxialDepthCm: number
  /** Observer position: between the two emerging rays at Y_EYE. */
  eye: Vec2
}

export function apparentDepthModel(dCm: number, n: number): ApparentDepthModel {
  const coin = { x: TANK.X_COIN, y: TANK.Y_SURFACE + cmToPx(dCm) }
  const depthPx = coin.y - TANK.Y_SURFACE
  const rays: DepthRay[] = []
  for (const thetaDeg of TANK.RAY_ANGLES) {
    const th = (thetaDeg * Math.PI) / 180
    const surface = { x: coin.x + depthPx * Math.tan(th), y: TANK.Y_SURFACE }
    // Cannot be null for these near-vertical rays and n ≤ 2, but be safe.
    const rDeg = snellAngle(n, TANK.N_AIR, thetaDeg) ?? 89.9
    const r = (rDeg * Math.PI) / 180
    const airDir = { x: Math.sin(r), y: -Math.cos(r) }
    const rise = TANK.Y_SURFACE - TANK.Y_EYE
    const end = { x: surface.x + rise * Math.tan(r), y: TANK.Y_EYE }
    rays.push({ thetaDeg, rDeg, surface, end, airDir })
  }
  const [a, b] = rays
  const apparent = intersectLines(a.surface, a.airDir, b.surface, b.airDir)
  const tracedDepthCm = apparent ? pxToCm(apparent.y - TANK.Y_SURFACE) : null
  const eye = { x: (a.end.x + b.end.x) / 2, y: TANK.Y_EYE }
  return { dCm, n, coin, floorY: coin.y + TANK.COIN_RY, rays, apparent, tracedDepthCm, paraxialDepthCm: dCm / n, eye }
}

export type StrawModel = {
  /** Real straw: top (in air) → surface entry → bottom (on the floor). */
  top: Vec2
  entry: Vec2
  bottom: Vec2
  /** Where the underwater end appears to be (lifted by 1/n). */
  apparentBottom: Vec2
}

/** A straw leaning in the right half of the tank; its underwater part appears lifted by the factor 1/n. */
export function strawModel(floorY: number, n: number): StrawModel {
  const top = { x: 700, y: 26 }
  const bottom = { x: 590, y: floorY }
  const f = (TANK.Y_SURFACE - top.y) / (bottom.y - top.y)
  const entry = { x: top.x + (bottom.x - top.x) * f, y: TANK.Y_SURFACE }
  const apparentBottom = { x: bottom.x, y: TANK.Y_SURFACE + (bottom.y - TANK.Y_SURFACE) / n }
  return { top, entry, bottom, apparentBottom }
}

/** Unit direction from a to b (exported for label placement). */
export const dirTo = (a: Vec2, b: Vec2): Vec2 => normalize(sub(b, a))
