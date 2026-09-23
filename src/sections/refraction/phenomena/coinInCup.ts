/**
 * Pure math for the coin-in-a-cup demo: a coin at the bottom of an opaque cup
 * is hidden by the wall until liquid is poured in and refraction at the
 * surface lifts its image over the rim. Stage units, y down.
 */
import type { Vec2 } from '../../../lib/geometry'

export const CUP = {
  W: 900,
  H: 300,
  /** Inner walls. */
  X_L: 380,
  X_R: 560,
  /** Inner floor and the rim (top of the wall). */
  Y_BOTTOM: 260,
  Y_RIM: 140,
  WALL: 10,
  COIN: { x: 405, y: 255 } as Vec2,
  EYE: { x: 760, y: 30 } as Vec2,
  /** 1 stage unit ≙ 1 mm, so the 120-unit cup is 12 cm deep. */
  CM_PER_UNIT: 0.1,
  POUR_TARGET: 85,
} as const

/** Liquid surface height for a fill level in percent. */
export const surfaceY = (levelPct: number): number => CUP.Y_BOTTOM - (levelPct / 100) * (CUP.Y_BOTTOM - CUP.Y_RIM)

export const depthCm = (levelPct: number): number => (CUP.Y_BOTTOM - surfaceY(levelPct)) * CUP.CM_PER_UNIT

export type CupModel =
  | {
      /** No liquid over the coin: the straight line to the eye is stopped by the wall. */
      kind: 'empty'
      blocked: Vec2
    }
  | {
      /** Liquid present but the coin still cannot be seen. */
      kind: 'hidden'
      /** 'outside': the needed surface point lies beyond the wall; 'wall': the air ray clips the rim. */
      reason: 'outside' | 'wall'
      surface: Vec2
      /** Surface point actually used for the drawn path (clamped inside the cup for 'outside'). */
      blocked: Vec2
      waterPath: { from: Vec2; to: Vec2 }
      airPath: { from: Vec2; to: Vec2 } | null
      thetaWaterDeg: number
      thetaAirDeg: number
    }
  | {
      kind: 'visible'
      surface: Vec2
      thetaWaterDeg: number
      thetaAirDeg: number
      /** Backward extension of the air ray meets the vertical through the coin here. */
      apparentCoin: Vec2
      /** How far the air ray passes above the rim at the wall (units). */
      rimClearance: number
      liftCm: number
    }

/**
 * Surface point S at which a ray from the coin refracts toward the eye:
 * root of n sin θw(x) − sin θa(x) by bisection on x ∈ [coin.x, eye.x].
 */
export function findSurfacePoint(ySurface: number, n: number): { x: number; thetaWaterDeg: number; thetaAirDeg: number } {
  const { COIN, EYE } = CUP
  const f = (xs: number) => n * Math.sin(Math.atan2(xs - COIN.x, COIN.y - ySurface)) - Math.sin(Math.atan2(EYE.x - xs, ySurface - EYE.y))
  let lo = COIN.x
  let hi = EYE.x
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2
    if (f(mid) < 0) lo = mid
    else hi = mid
  }
  const x = (lo + hi) / 2
  const toDeg = 180 / Math.PI
  return { x, thetaWaterDeg: Math.atan2(x - COIN.x, COIN.y - ySurface) * toDeg, thetaAirDeg: Math.atan2(EYE.x - x, ySurface - EYE.y) * toDeg }
}

/** y at which the line a → b crosses the vertical x = xLine. */
const yAtX = (a: Vec2, b: Vec2, xLine: number): number => a.y + ((b.y - a.y) * (xLine - a.x)) / (b.x - a.x)

export function cupModel(levelPct: number, n: number): CupModel {
  const { COIN, EYE, X_R, Y_RIM } = CUP
  const ys = surfaceY(levelPct)

  if (ys >= COIN.y - 1) {
    return { kind: 'empty', blocked: { x: X_R, y: yAtX(COIN, EYE, X_R) } }
  }

  const { x: xs, thetaWaterDeg, thetaAirDeg } = findSurfacePoint(ys, n)
  const S = { x: xs, y: ys }

  if (xs > X_R) {
    // The ray that could reach the eye would have to leave through the wall.
    const hit = { x: X_R, y: yAtX(COIN, S, X_R) }
    return { kind: 'hidden', reason: 'outside', surface: S, blocked: hit, waterPath: { from: COIN, to: hit }, airPath: null, thetaWaterDeg, thetaAirDeg }
  }

  const yWall = yAtX(S, EYE, X_R)
  if (yWall >= Y_RIM) {
    const hit = { x: X_R, y: yWall }
    return { kind: 'hidden', reason: 'wall', surface: S, blocked: hit, waterPath: { from: COIN, to: S }, airPath: { from: S, to: hit }, thetaWaterDeg, thetaAirDeg }
  }

  const apparentY = yAtX(EYE, S, COIN.x)
  return {
    kind: 'visible',
    surface: S,
    thetaWaterDeg,
    thetaAirDeg,
    apparentCoin: { x: COIN.x, y: apparentY },
    rimClearance: Y_RIM - yWall,
    liftCm: (COIN.y - apparentY) * CUP.CM_PER_UNIT,
  }
}
