/** Pure model for the raindrop demo (viewBox units, y-down). */
import { wavelengthToRGB } from '../../../lib/color'
import { rainbowAngle, traceDroplet, type DropletTrace } from '../../../lib/droplet'
import type { Ray, Rect, Vec2 } from '../../../lib/geometry'
import { cauchyIndex } from '../../../lib/optics'

export const RB_STAGE = { w: 900, h: 360 }
/** Sits high so the exit rays (which leave downward toward the observer) have room to fan out. */
export const DROP_C: Vec2 = { x: 430, y: 122 }
export const DROP_R = 100
export const RB_BOUNDS: Rect = { xMin: 20, xMax: 880, yMin: 20, yMax: 340 }
export const B_MIN = 0
export const B_MAX = 0.98
export const RB_WAVELENGTHS = [400, 450, 500, 550, 600, 650, 700] as const
export const RB_VIOLET = 400
export const RB_MID = 550
export const RB_RED = 700

/** 1 = primary bow (one internal reflection), 2 = secondary bow. */
export type Bow = 1 | 2

export const waterIndex = (nm: number): number => cauchyIndex('water', nm)

/**
 * Horizontal sunlight with impact parameter b (fraction of the radius). The
 * primary bow enters the top half and leaves downward toward the observer; the
 * secondary enters the bottom half so it also leaves downward (as in the sky).
 */
export function sunRay(b: number, k: Bow): Ray {
  return { origin: { x: RB_BOUNDS.xMin + 20, y: DROP_C.y + (k === 1 ? -1 : 1) * b * DROP_R }, dir: { x: 1, y: 0 } }
}

export type DropTrace = { nm: number; n: number; color: string; trace: DropletTrace }

export function traceRainbow(b: number, k: Bow): DropTrace[] {
  const ray = sunRay(b, k)
  return RB_WAVELENGTHS.map((nm) => {
    const n = waterIndex(nm)
    return { nm, n, color: wavelengthToRGB(nm), trace: traceDroplet(ray, DROP_C, DROP_R, n, { bounds: RB_BOUNDS, reflections: k }) }
  })
}

/** Analytic minimum-deviation geometry for the bow, using the 550 nm index by default. */
export const analyticBow = (k: Bow, nm: number = RB_MID) => rainbowAngle(waterIndex(nm), k)
