/** Pure geometry for the plane-mirror stage (viewBox units, y-down). */
import { clipRayToRect, degToRad, radToDeg, type Rect, type Vec2 } from '../../lib/geometry'
import { clamp } from '../../lib/format'

export const STAGE_W = 900
export const STAGE_H = 480
/** Taller stage used when the virtual image behind the mirror is shown. */
export const STAGE_H_IMAGE = 660

export const MIRROR_Y = 380
export const MIRROR_X1 = 120
export const MIRROR_X2 = 780
/** Point of incidence. */
export const O: Vec2 = { x: 450, y: MIRROR_Y }
/** The source moves on a circle of this radius around O. */
export const SOURCE_RADIUS = 250
export const I_MIN = 0
export const I_MAX = 89
export const NORMAL_UP: Vec2 = { x: 0, y: -1 }

const RAY_BOUNDS: Rect = { xMin: 20, xMax: 880, yMin: 20, yMax: MIRROR_Y }

/** Source position for an angle of incidence (always left of the normal). */
export function sourceFor(iDeg: number): Vec2 {
  const a = degToRad(iDeg)
  return { x: O.x - SOURCE_RADIUS * Math.sin(a), y: O.y - SOURCE_RADIUS * Math.cos(a) }
}

/** Unit direction of the reflected ray (right of the normal, r = i). */
export function reflectedDir(iDeg: number): Vec2 {
  const a = degToRad(iDeg)
  return { x: Math.sin(a), y: -Math.cos(a) }
}

/** Where the reflected ray leaves the stage. */
export function reflectedEnd(iDeg: number): Vec2 {
  return clipRayToRect({ origin: O, dir: reflectedDir(iDeg) }, RAY_BOUNDS) ?? { x: O.x, y: 20 }
}

/** Pointer position → angle of incidence, mirrored onto the left side and clamped. */
export function incidenceFromPointer(p: Vec2): number {
  const dx = p.x - O.x
  const dy = p.y - O.y
  return clamp(radToDeg(Math.atan2(Math.abs(dx), -dy)), I_MIN, I_MAX)
}

/** Mirror image of a point across the mirror line. */
export function imageOf(p: Vec2): Vec2 {
  return { x: p.x, y: 2 * MIRROR_Y - p.y }
}
