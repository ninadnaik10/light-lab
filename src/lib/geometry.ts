/**
 * Pure 2D geometry helpers. Frame-agnostic: everything works in either
 * y-down SVG coordinates or y-up world coordinates because only dot/cross
 * products and linear algebra are used.
 */
export type Vec2 = { x: number; y: number }
export type Ray = { origin: Vec2; dir: Vec2 } // dir should be a unit vector
export type Segment = { a: Vec2; b: Vec2 }
export type Rect = { xMin: number; xMax: number; yMin: number; yMax: number }

export const vec = (x: number, y: number): Vec2 => ({ x, y })
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k })
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x
export const length = (a: Vec2): number => Math.hypot(a.x, a.y)
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y)
export const perp = (a: Vec2): Vec2 => ({ x: -a.y, y: a.x })
export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
export const negate = (a: Vec2): Vec2 => ({ x: -a.x, y: -a.y })

export function normalize(a: Vec2): Vec2 {
  const l = length(a)
  return l < 1e-12 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l }
}

export const degToRad = (d: number): number => (d * Math.PI) / 180
export const radToDeg = (r: number): number => (r * 180) / Math.PI

/** Unit vector at angle `rad` measured from +x toward +y. */
export const fromAngle = (rad: number): Vec2 => ({ x: Math.cos(rad), y: Math.sin(rad) })
export const fromAngleDeg = (deg: number): Vec2 => fromAngle(degToRad(deg))
/** atan2(y, x) in radians. */
export const angleOf = (a: Vec2): number => Math.atan2(a.y, a.x)

/** Unsigned angle between two vectors in degrees, 0..180. */
export function angleBetweenDeg(a: Vec2, b: Vec2): number {
  const la = length(a)
  const lb = length(b)
  if (la < 1e-12 || lb < 1e-12) return 0
  const c = Math.min(1, Math.max(-1, dot(a, b) / (la * lb)))
  return radToDeg(Math.acos(c))
}

/** Reflect direction d about a surface with unit normal n (either orientation). */
export function reflect(d: Vec2, n: Vec2): Vec2 {
  const k = 2 * dot(d, n)
  return { x: d.x - k * n.x, y: d.y - k * n.y }
}

/**
 * Vector Snell's law. `n` is the unit surface normal (either orientation; it is
 * flipped internally so it opposes `d`). Light goes from index n1 into n2.
 * Returns null on total internal reflection.
 */
export function refract(d: Vec2, n: Vec2, n1: number, n2: number): Vec2 | null {
  const dn = normalize(d)
  let nn = normalize(n)
  if (dot(dn, nn) > 0) nn = negate(nn)
  const eta = n1 / n2
  const cosI = -dot(dn, nn)
  const sin2T = eta * eta * (1 - cosI * cosI)
  if (sin2T > 1 + 1e-12) return null
  const cosT = Math.sqrt(Math.max(0, 1 - sin2T))
  return normalize({
    x: eta * dn.x + (eta * cosI - cosT) * nn.x,
    y: eta * dn.y + (eta * cosI - cosT) * nn.y,
  })
}

/** Intersection of a ray with a finite segment. `t` is the ray parameter, `s` the segment parameter (0..1). */
export function intersectRaySegment(
  ray: Ray,
  seg: Segment,
  eps = 1e-9,
): { t: number; s: number; point: Vec2 } | null {
  const e = sub(seg.b, seg.a)
  const denom = cross(ray.dir, e)
  if (Math.abs(denom) < 1e-12) return null
  const ao = sub(seg.a, ray.origin)
  const t = cross(ao, e) / denom
  const s = cross(ao, ray.dir) / denom
  if (t < eps || s < -eps || s > 1 + eps) return null
  return { t, s, point: add(ray.origin, scale(ray.dir, t)) }
}

/** Intersection of a ray with the vertical line x = xLine (forward only). */
export function intersectRayVerticalLine(ray: Ray, xLine: number): Vec2 | null {
  if (Math.abs(ray.dir.x) < 1e-12) return null
  const t = (xLine - ray.origin.x) / ray.dir.x
  if (t < 0) return null
  return add(ray.origin, scale(ray.dir, t))
}

/** Intersection of a ray with the horizontal line y = yLine (forward only). */
export function intersectRayHorizontalLine(ray: Ray, yLine: number): Vec2 | null {
  if (Math.abs(ray.dir.y) < 1e-12) return null
  const t = (yLine - ray.origin.y) / ray.dir.y
  if (t < 0) return null
  return add(ray.origin, scale(ray.dir, t))
}

/** Intersection of two infinite lines given by point + direction. */
export function intersectLines(p1: Vec2, d1: Vec2, p2: Vec2, d2: Vec2): Vec2 | null {
  const denom = cross(d1, d2)
  if (Math.abs(denom) < 1e-12) return null
  const t = cross(sub(p2, p1), d2) / denom
  return add(p1, scale(d1, t))
}

/**
 * Point where a ray leaves a rectangle. The origin is assumed inside (or on the
 * boundary). Returns null if the ray never hits the rectangle going forward.
 */
export function clipRayToRect(ray: Ray, rect: Rect): Vec2 | null {
  let tMax = Infinity
  const { origin: o, dir: d } = ray
  if (Math.abs(d.x) > 1e-12) {
    const t = d.x > 0 ? (rect.xMax - o.x) / d.x : (rect.xMin - o.x) / d.x
    if (t >= 0) tMax = Math.min(tMax, t)
  }
  if (Math.abs(d.y) > 1e-12) {
    const t = d.y > 0 ? (rect.yMax - o.y) / d.y : (rect.yMin - o.y) / d.y
    if (t >= 0) tMax = Math.min(tMax, t)
  }
  if (!isFinite(tMax)) return null
  return add(o, scale(d, tMax))
}

/** Perpendicular distance from a point to an infinite line. */
export function pointToLineDistance(p: Vec2, linePoint: Vec2, dir: Vec2): number {
  const d = normalize(dir)
  return Math.abs(cross(d, sub(p, linePoint)))
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    const intersects = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    if (intersects) inside = !inside
  }
  return inside
}

/**
 * SVG path for the smaller arc of radius r around `center`, from direction dirA
 * to direction dirB. Works in both y-up and y-down frames because the sweep flag
 * is derived from the sign of the cross product.
 */
export function arcPathBetweenDirs(center: Vec2, r: number, dirA: Vec2, dirB: Vec2): string {
  const a = normalize(dirA)
  const b = normalize(dirB)
  const p1 = add(center, scale(a, r))
  const p2 = add(center, scale(b, r))
  const sweep = cross(a, b) > 0 ? 1 : 0
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`
}

/** Unit vector along the bisector of two directions (for placing angle labels). */
export function bisector(dirA: Vec2, dirB: Vec2): Vec2 {
  const s = add(normalize(dirA), normalize(dirB))
  return length(s) < 1e-9 ? perp(normalize(dirA)) : normalize(s)
}
