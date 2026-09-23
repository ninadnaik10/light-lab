/** Pure model for the prism stage: geometry set-up and per-wavelength tracing (viewBox units, y-down). */
import { wavelengthToRGB } from '../../lib/color'
import { clamp } from '../../lib/format'
import { angleBetweenDeg, clipRayToRect, cross, dist, intersectRayVerticalLine, normalize, sub, type Ray, type Rect, type Vec2 } from '../../lib/geometry'
import { cauchyIndex, type GlassId } from '../../lib/optics'
import { entryPointOnLeftFace, incidentRayForAngle, prismPolygon, tracePolygon, type Polygon, type TraceResult } from '../../lib/prism'

export const STAGE = { w: 900, h: 480 }
export const APEX: Vec2 = { x: 430, y: 90 }
export const PRISM_HEIGHT = 250
export const SCREEN_X = 860
export const SCREEN_Y1 = 50
export const SCREEN_Y2 = 440
/** Rays are clipped here; the right edge is the screen so rays end on it. */
export const BOUNDS: Rect = { xMin: 20, xMax: SCREEN_X, yMin: 20, yMax: 460 }
/** Keep the draggable source inside this rectangle. */
const SOURCE_BOUNDS: Rect = { xMin: 40, xMax: 860, yMin: 40, yMax: 440 }
export const SOURCE_DISTANCE = 260

export const I_MIN = 5
export const I_MAX = 85
export const A_MIN = 20
export const A_MAX = 80
export const FRAC_MIN = 0.2
export const FRAC_MAX = 0.85
export const LAMBDA_MIN = 380
export const LAMBDA_MAX = 750
export const N_AIR = 1.0003

export const RED_NM = 700
export const MID_NM = 550
export const VIOLET_NM = 400
/** White light = 400, 420, …, 700 nm (16 rays). */
export const WHITE_WAVELENGTHS: readonly number[] = Array.from({ length: 16 }, (_, k) => 400 + 20 * k)

export const WHITE = '#f8fafc'

export type PrismSetup = {
  apexDeg: number
  poly: Polygon
  baseY: number
  entry: Vec2
  /** Unit outward normal of the left face at the entry point. */
  outward: Vec2
  source: Vec2
  ray: Ray
  /** Sign of cross(outward, source − entry): which side of the normal the source lives on. */
  sideSign: number
}

/** Build the prism, entry point and incident ray for the current controls. */
export function buildSetup(apexDeg: number, entryFrac: number, iDeg: number): PrismSetup {
  const poly = prismPolygon(apexDeg, APEX, PRISM_HEIGHT, -1)
  const { point: entry, outwardNormal: outward } = entryPointOnLeftFace(poly, entryFrac)
  // Try both sides of the normal; light must come from the left (smaller x).
  const candidates = ([1, -1] as const).map((side) => ({ side, ...incidentRayForAngle(entry, outward, iDeg, 1, side) }))
  const pick = candidates.reduce((best, c) => (c.source.x < best.source.x ? c : best))
  const dirToSource = sub(pick.source, entry)
  // Shorten the source arm so the handle never leaves the stage.
  const edge = clipRayToRect({ origin: entry, dir: dirToSource }, SOURCE_BOUNDS)
  const maxDist = edge ? dist(entry, edge) : SOURCE_DISTANCE
  const { source, ray } = incidentRayForAngle(entry, outward, iDeg, Math.min(SOURCE_DISTANCE, maxDist), pick.side)
  return { apexDeg, poly, baseY: poly[1].y, entry, outward, source, ray, sideSign: Math.sign(cross(outward, dirToSource)) || 1 }
}

/** Pointer position → angle of incidence (deg from the normal), clamped to the source's side. */
export function incidenceFromPointer(setup: PrismSetup, p: Vec2): number {
  const v = sub(p, setup.entry)
  if (Math.hypot(v.x, v.y) < 1e-6) return I_MIN
  const onSourceSide = cross(setup.outward, v) * setup.sideSign >= 0
  if (!onSourceSide) return I_MIN
  return clamp(angleBetweenDeg(v, setup.outward), I_MIN, I_MAX)
}

export type WaveTrace = {
  nm: number
  n: number
  color: string
  result: TraceResult
  /** Where the exit ray meets the screen strip, if it does. */
  screenHit: Vec2 | null
  /** Clean enter (left face) → exit (right face) path: δ = i + e − A applies. */
  clean: boolean
  /** Angle of emergence e at the second face (deg from the normal), when clean. */
  eDeg: number | null
  exitEdge: number | null
}

export function traceWavelength(setup: PrismSetup, glass: GlassId, boost: number, nm: number): WaveTrace {
  const n = cauchyIndex(glass, nm, boost)
  const result = tracePolygon(setup.ray, setup.poly, n, N_AIR, { bounds: BOUNDS, maxBounces: 6 })
  const hit = result.exitRay && !result.missed ? intersectRayVerticalLine(result.exitRay, SCREEN_X) : null
  const screenHit = hit && hit.y >= SCREEN_Y1 && hit.y <= SCREEN_Y2 ? hit : null
  const exitEdge = result.events.length >= 2 ? result.events[1].edge : null
  const clean = result.standardPath && exitEdge === 0 // edge 0 = apex → baseRight = right face
  return { nm, n, color: wavelengthToRGB(nm), result, screenHit, clean, eDeg: clean ? result.events[1].rDeg : null, exitEdge }
}

/** Unit direction from entry toward the source (for the incidence arc). */
export const toSourceDir = (setup: PrismSetup): Vec2 => normalize(sub(setup.source, setup.entry))
