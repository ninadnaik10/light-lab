/**
 * Generic ray tracer through a polygon of refractive index nInside surrounded by
 * nOutside. Used for the prism (dispersion) and the optical fibre core (TIR).
 */
import {
  add,
  angleBetweenDeg,
  clipRayToRect,
  degToRad,
  fromAngle,
  intersectRaySegment,
  normalize,
  pointInPolygon,
  reflect,
  refract,
  scale,
  sub,
  type Ray,
  type Rect,
  type Segment,
  type Vec2,
} from './geometry'

export type Polygon = Vec2[]

export type TraceEvent = {
  kind: 'enter' | 'exit' | 'tir'
  point: Vec2
  /** Index of the polygon edge (edge i runs from vertex i to vertex i+1). */
  edge: number
  /** Angle of incidence at this surface, degrees from the normal. */
  iDeg: number
  /** Angle of refraction, degrees from the normal; null for TIR. */
  rDeg: number | null
}

export type TraceResult = {
  /** Ordered polyline pieces including the final piece clipped to `bounds`. */
  segments: Segment[]
  events: TraceEvent[]
  exitRay: Ray | null
  /** Angle between the original direction and the final direction, or null if the ray never left. */
  deviationDeg: number | null
  /** True only for a clean enter → exit path with no internal reflection. */
  standardPath: boolean
  /** The ray never touched the polygon. */
  missed: boolean
}

/** Twice the signed area (positive for counter-clockwise vertex order in the given frame). */
function signedArea2(poly: Polygon): number {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    a += p.x * q.y - q.x * p.y
  }
  return a
}

/**
 * Unit normal of edge i pointing out of the polygon. Uses the polygon winding,
 * so it is correct for non-convex shapes (bent fibres) as well as convex ones.
 */
export function outwardNormal(poly: Polygon, i: number): Vec2 {
  const a = poly[i]
  const b = poly[(i + 1) % poly.length]
  const e = sub(b, a)
  // For positive (counter-clockwise) winding the outward side is the right-hand perpendicular.
  const n = signedArea2(poly) > 0 ? { x: e.y, y: -e.x } : { x: -e.y, y: e.x }
  return normalize(n)
}

function nearestEdgeHit(ray: Ray, poly: Polygon, skipEdge: number): { edge: number; point: Vec2; t: number } | null {
  let best: { edge: number; point: Vec2; t: number } | null = null
  for (let i = 0; i < poly.length; i++) {
    if (i === skipEdge) continue
    const hit = intersectRaySegment(ray, { a: poly[i], b: poly[(i + 1) % poly.length] }, 1e-7)
    if (hit && (!best || hit.t < best.t)) best = { edge: i, point: hit.point, t: hit.t }
  }
  return best
}

const incidenceDeg = (dir: Vec2, outward: Vec2): number => {
  const a = angleBetweenDeg(dir, outward)
  return a > 90 ? 180 - a : a
}

export function tracePolygon(
  ray: Ray,
  poly: Polygon,
  nInside: number,
  nOutside: number,
  opts: { bounds: Rect; maxBounces?: number },
): TraceResult {
  const maxBounces = opts.maxBounces ?? 6
  const segments: Segment[] = []
  const events: TraceEvent[] = []
  const startDir = normalize(ray.dir)
  let cur: Ray = { origin: ray.origin, dir: startDir }
  let lastEdge = -1

  if (!pointInPolygon(ray.origin, poly)) {
    const entry = nearestEdgeHit(cur, poly, -1)
    if (!entry) {
      const end = clipRayToRect(cur, opts.bounds)
      if (end) segments.push({ a: cur.origin, b: end })
      return { segments, events, exitRay: cur, deviationDeg: 0, standardPath: false, missed: true }
    }
    segments.push({ a: cur.origin, b: entry.point })
    const n = outwardNormal(poly, entry.edge)
    const iDeg = incidenceDeg(cur.dir, n)
    const t = refract(cur.dir, n, nOutside, nInside)
    if (!t) {
      // Cannot happen going into a denser medium; if nInside < nOutside it can. Reflect off the surface.
      const r = reflect(cur.dir, n)
      events.push({ kind: 'tir', point: entry.point, edge: entry.edge, iDeg, rDeg: null })
      const out: Ray = { origin: entry.point, dir: r }
      const end = clipRayToRect(out, opts.bounds)
      if (end) segments.push({ a: entry.point, b: end })
      return { segments, events, exitRay: out, deviationDeg: angleBetweenDeg(startDir, r), standardPath: false, missed: false }
    }
    events.push({ kind: 'enter', point: entry.point, edge: entry.edge, iDeg, rDeg: incidenceDeg(t, n) })
    cur = { origin: entry.point, dir: t }
    lastEdge = entry.edge
  }

  let bounces = 0
  for (;;) {
    const hit = nearestEdgeHit(cur, poly, lastEdge)
    if (!hit) {
      const end = clipRayToRect(cur, opts.bounds)
      if (end) segments.push({ a: cur.origin, b: end })
      return { segments, events, exitRay: null, deviationDeg: null, standardPath: false, missed: false }
    }
    segments.push({ a: cur.origin, b: hit.point })
    const n = outwardNormal(poly, hit.edge)
    const iDeg = incidenceDeg(cur.dir, n)
    const t = refract(cur.dir, n, nInside, nOutside)
    if (t) {
      events.push({ kind: 'exit', point: hit.point, edge: hit.edge, iDeg, rDeg: incidenceDeg(t, n) })
      const exitRay: Ray = { origin: hit.point, dir: t }
      const end = clipRayToRect(exitRay, opts.bounds)
      if (end) segments.push({ a: hit.point, b: end })
      const standardPath = events.length === 2 && events[0].kind === 'enter' && events[1].kind === 'exit'
      return { segments, events, exitRay, deviationDeg: angleBetweenDeg(startDir, t), standardPath, missed: false }
    }
    events.push({ kind: 'tir', point: hit.point, edge: hit.edge, iDeg, rDeg: null })
    cur = { origin: hit.point, dir: reflect(cur.dir, n) }
    lastEdge = hit.edge
    if (++bounces > maxBounces) {
      return { segments, events, exitRay: null, deviationDeg: null, standardPath: false, missed: false }
    }
  }
}

/**
 * Isosceles prism with the given apex angle, apex at `apex`, pointing "up"
 * (toward negative y in SVG space when `up` is -1). Returns vertices
 * [apex, baseRight, baseLeft].
 */
export function prismPolygon(apexDeg: number, apex: Vec2, height: number, up: 1 | -1 = -1): Polygon {
  const halfBase = height * Math.tan(degToRad(apexDeg / 2))
  const baseY = apex.y - up * height
  return [apex, { x: apex.x + halfBase, y: baseY }, { x: apex.x - halfBase, y: baseY }]
}

/** Point a fraction `frac` (0 = apex, 1 = base) down the LEFT face of a prism from prismPolygon. */
export function entryPointOnLeftFace(poly: Polygon, frac: number): { point: Vec2; outwardNormal: Vec2; edge: number } {
  // Left face is edge 2: baseLeft → apex.
  const apex = poly[0]
  const baseLeft = poly[2]
  const point = { x: apex.x + (baseLeft.x - apex.x) * frac, y: apex.y + (baseLeft.y - apex.y) * frac }
  return { point, outwardNormal: outwardNormal(poly, 2), edge: 2 }
}

/**
 * Incident ray that strikes `entry` at `iDeg` from the surface normal, coming
 * from the outside. The source sits `sourceDistance` away. `side` picks which
 * side of the normal the source lies on (+1 rotates toward +perp).
 */
export function incidentRayForAngle(
  entry: Vec2,
  outward: Vec2,
  iDeg: number,
  sourceDistance: number,
  side: 1 | -1 = 1,
): { source: Vec2; ray: Ray } {
  const base = Math.atan2(outward.y, outward.x)
  const dirFromEntry = fromAngle(base + side * degToRad(iDeg)) // points from entry out toward the source
  const source = add(entry, scale(dirFromEntry, sourceDistance))
  return { source, ray: { origin: source, dir: { x: -dirFromEntry.x, y: -dirFromEntry.y } } }
}
