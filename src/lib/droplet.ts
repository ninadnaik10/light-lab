/**
 * Ray tracing through a spherical water droplet (2D cross-section): refract in,
 * reflect internally k times, refract out. k = 1 gives the primary rainbow
 * (~42°), k = 2 the secondary (~51°).
 */
import { add, angleBetweenDeg, clipRayToRect, degToRad, dot, normalize, radToDeg, reflect, refract, scale, sub, type Ray, type Rect, type Segment, type Vec2 } from './geometry'

export type DropletEvent = { kind: 'enter' | 'reflect' | 'exit'; point: Vec2; iDeg: number; rDeg: number | null }

export type DropletTrace = {
  segments: Segment[]
  events: DropletEvent[]
  exitRay: Ray | null
  /** Unsigned angle between the incoming and outgoing directions, 0..180. */
  deviationDeg: number | null
  /** 180 − deviation: the angle between the outgoing ray and the direction back toward the light source. */
  rainbowAngleDeg: number | null
  missed: boolean
}

/** Smallest ray parameter > tMin where the ray meets the circle, or null. */
function rayCircle(origin: Vec2, dir: Vec2, center: Vec2, radius: number, tMin: number): number | null {
  const oc = sub(origin, center)
  const b = dot(oc, dir)
  const c = dot(oc, oc) - radius * radius
  const disc = b * b - c
  if (disc < 0) return null
  const s = Math.sqrt(disc)
  const t1 = -b - s
  const t2 = -b + s
  if (t1 > tMin) return t1
  if (t2 > tMin) return t2
  return null
}

export function traceDroplet(
  ray: Ray,
  center: Vec2,
  radius: number,
  n: number,
  opts: { bounds: Rect; reflections?: number; nOutside?: number },
): DropletTrace {
  const k = opts.reflections ?? 1
  const nOut = opts.nOutside ?? 1
  const d0 = normalize(ray.dir)
  const segments: Segment[] = []
  const events: DropletEvent[] = []

  const t = rayCircle(ray.origin, d0, center, radius, 1e-9)
  if (t === null) {
    const end = clipRayToRect({ origin: ray.origin, dir: d0 }, opts.bounds)
    if (end) segments.push({ a: ray.origin, b: end })
    return { segments, events, exitRay: { origin: ray.origin, dir: d0 }, deviationDeg: 0, rainbowAngleDeg: null, missed: true }
  }
  const P = add(ray.origin, scale(d0, t))
  segments.push({ a: ray.origin, b: P })
  const nP = normalize(sub(P, center))
  const iDeg = angleBetweenDeg(scale(d0, -1), nP)
  let dir = refract(d0, nP, nOut, n)
  if (!dir) {
    // Only possible when the droplet is rarer than its surroundings.
    const r = reflect(d0, nP)
    events.push({ kind: 'reflect', point: P, iDeg, rDeg: null })
    const end = clipRayToRect({ origin: P, dir: r }, opts.bounds)
    if (end) segments.push({ a: P, b: end })
    const dev = angleBetweenDeg(d0, r)
    return { segments, events, exitRay: { origin: P, dir: r }, deviationDeg: dev, rainbowAngleDeg: 180 - dev, missed: false }
  }
  events.push({ kind: 'enter', point: P, iDeg, rDeg: angleBetweenDeg(dir, scale(nP, -1)) })

  let cur = P
  let remaining = k
  for (let guard = 0; guard < k + 8; guard++) {
    const t2 = rayCircle(cur, dir, center, radius, 1e-7)
    if (t2 === null) break
    const Q = add(cur, scale(dir, t2))
    segments.push({ a: cur, b: Q })
    const nQ = normalize(sub(Q, center))
    const inc = angleBetweenDeg(dir, nQ)
    if (remaining > 0) {
      remaining--
      dir = reflect(dir, nQ)
      events.push({ kind: 'reflect', point: Q, iDeg: inc, rDeg: null })
      cur = Q
      continue
    }
    const out = refract(dir, nQ, n, nOut)
    if (!out) {
      dir = reflect(dir, nQ)
      events.push({ kind: 'reflect', point: Q, iDeg: inc, rDeg: null })
      cur = Q
      continue
    }
    events.push({ kind: 'exit', point: Q, iDeg: inc, rDeg: angleBetweenDeg(out, nQ) })
    const exitRay = { origin: Q, dir: out }
    const end = clipRayToRect(exitRay, opts.bounds)
    if (end) segments.push({ a: Q, b: end })
    const dev = angleBetweenDeg(d0, out)
    return { segments, events, exitRay, deviationDeg: dev, rainbowAngleDeg: 180 - dev, missed: false }
  }
  return { segments, events, exitRay: null, deviationDeg: null, rainbowAngleDeg: null, missed: false }
}

/**
 * Rainbow geometry at minimum deviation for k internal reflections:
 * cos² i = (n² − 1) / (k (k + 2)). Returns the incidence angle, the impact
 * parameter b = sin i (as a fraction of the radius) and the rainbow angle.
 */
export function rainbowAngle(n: number, k = 1): { incidenceDeg: number; impact: number; deviationDeg: number; rainbowAngleDeg: number } | null {
  const c2 = (n * n - 1) / (k * (k + 2))
  if (c2 <= 0 || c2 >= 1) return null
  const i = Math.acos(Math.sqrt(c2))
  const r = Math.asin(Math.sin(i) / n)
  const iDeg = radToDeg(i)
  const rDeg = radToDeg(r)
  const D = k * 180 + 2 * iDeg - 2 * (k + 1) * rDeg
  const Dm = ((D % 360) + 360) % 360
  return { incidenceDeg: iDeg, impact: Math.sin(i), deviationDeg: Dm, rainbowAngleDeg: Math.abs(180 - Dm) }
}

/** Impact parameter (fraction of radius) for a given incidence angle on a sphere. */
export const impactForIncidence = (iDeg: number): number => Math.sin(degToRad(iDeg))

/**
 * Rayleigh scattering strength relative to 550 nm: ∝ 1/λ⁴. Blue (450 nm) ≈ 2.2×, red (700 nm) ≈ 0.38×.
 */
export const rayleighRelative = (nm: number, refNm = 550): number => Math.pow(refNm / nm, 4)

/**
 * Fraction of light of wavelength `nm` that survives a path through the atmosphere.
 * `pathFactor` is the air-mass relative to overhead sun (1 at noon, ~10–40 at sunset);
 * `k` sets the overall opacity (fraction scattered out at 550 nm for pathFactor = 1).
 */
export function rayleighTransmission(nm: number, pathFactor: number, k = 0.1): number {
  return Math.exp(-k * pathFactor * rayleighRelative(nm))
}
