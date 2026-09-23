/**
 * Construction rays and zone classification for spherical mirrors and thin
 * lenses, in the paraxial "bend at x = 0" model with New Cartesian signs.
 *
 * World coordinates: x along the principal axis (cm), pole / optical centre at
 * the origin, light travels left → right, object at x = u < 0, tip at (u, h).
 *
 * Outgoing directions come from the textbook RULES, not from aiming at the
 * image. In this model the rules and the mirror/lens formula agree exactly, so
 * every outgoing ray passes through the formula's image tip, and an object at F
 * simply produces parallel outgoing rays.
 */
import { normalize, sub, type Ray, type Segment, type Vec2 } from './geometry'
import { imageFor, isMirror, signedFocalLength, type ElementKind, type ImageSolution } from './optics'

export type ZoneId = 'beyond-C' | 'at-C' | 'between-C-F' | 'at-F' | 'inside-F' | 'anywhere'

export type ImageNature = {
  /** null when the image is at infinity */
  real: boolean | null
  erect: boolean | null
  size: 'magnified' | 'diminished' | 'same' | 'infinite'
  /** Human wording, e.g. "between F and C, in front of the mirror" */
  locationText: string
}

/**
 * Which zone the object is in. `tol` (cm) snaps "at F" / "at C" so slider steps
 * can hit the special cases; the UI passes 0.25, tests use the default.
 */
export function classifyZone(kind: ElementKind, u: number, fMag: number, tol = 1e-9): ZoneId {
  if (kind === 'convex-mirror' || kind === 'concave-lens') return 'anywhere'
  const d = -u
  if (Math.abs(d - 2 * fMag) <= tol) return 'at-C'
  if (Math.abs(d - fMag) <= tol) return 'at-F'
  if (d > 2 * fMag) return 'beyond-C'
  if (d > fMag) return 'between-C-F'
  return 'inside-F'
}

/** Image nature for a zone, worded for the element kind. */
export function natureFor(kind: ElementKind, zone: ZoneId): ImageNature {
  const mirror = isMirror(kind)
  const C = mirror ? 'C' : '2F₂'
  const F = mirror ? 'F' : 'F₂'
  const front = mirror ? 'in front of the mirror' : 'on the other side of the lens'
  const behind = mirror ? 'behind the mirror' : 'on the same side as the object'
  switch (zone) {
    case 'beyond-C':
      return { real: true, erect: false, size: 'diminished', locationText: `between ${F} and ${C}, ${front}` }
    case 'at-C':
      return { real: true, erect: false, size: 'same', locationText: `at ${C}, ${front}` }
    case 'between-C-F':
      return { real: true, erect: false, size: 'magnified', locationText: `beyond ${C}, ${front}` }
    case 'at-F':
      return { real: null, erect: null, size: 'infinite', locationText: 'at infinity' }
    case 'inside-F':
      return { real: false, erect: true, size: 'magnified', locationText: behind }
    case 'anywhere':
      return {
        real: false,
        erect: true,
        size: 'diminished',
        locationText: mirror ? 'between P and F, behind the mirror' : 'between O and F₁, on the same side as the object',
      }
  }
}

export type RayRole = 'parallel' | 'focal' | 'centre' | 'pole'

export type ConstructionRay = {
  role: RayRole
  /** Dashed: from F / C to the object tip when the object is inside F / C ("appears to come from"). */
  preGuide?: Segment
  /** Real light: object tip → hit point on the x = 0 plane. */
  incident: Segment
  hit: Vec2
  /** Real light leaving the element. Mirrors: dir.x < 0. Lenses: dir.x > 0. */
  outgoing: Ray
  /** Dashed: hit → point behind the element the incident ray was aimed at (convex mirror F/C, concave lens F₂). */
  aimGuide?: Segment
  /** Dashed: backward extension of the outgoing ray to the virtual image tip (or beyond it to F/C). */
  virtualExtension?: Segment
}

export type ConstructionResult = {
  rays: ConstructionRay[]
  /** Roles that were requested but cannot be drawn (vertical line or hit outside the element). */
  dropped: RayRole[]
  image: ImageSolution
  /** (v, h′), or null when the image is at infinity */
  imageTip: Vec2 | null
  imageBase: Vec2 | null
  /** Signed focal length actually used */
  f: number
}

const EPS = 1e-9

/** Focal / centre points to label on the axis, in world x. */
export function axisPoints(kind: ElementKind, fMag: number): { label: string; x: number; behind: boolean }[] {
  switch (kind) {
    case 'concave-mirror':
      return [
        { label: 'C', x: -2 * fMag, behind: false },
        { label: 'F', x: -fMag, behind: false },
        { label: 'P', x: 0, behind: false },
      ]
    case 'convex-mirror':
      return [
        { label: 'P', x: 0, behind: false },
        { label: 'F', x: fMag, behind: true },
        { label: 'C', x: 2 * fMag, behind: true },
      ]
    case 'convex-lens':
    case 'concave-lens':
      return [
        { label: '2F₁', x: -2 * fMag, behind: false },
        { label: 'F₁', x: -fMag, behind: false },
        { label: 'O', x: 0, behind: false },
        { label: 'F₂', x: fMag, behind: false },
        { label: '2F₂', x: 2 * fMag, behind: false },
      ]
  }
}

/** Direction with positive x through two points (light travels left → right before the element). */
function forwardDirThrough(from: Vec2, to: Vec2): Vec2 | null {
  const d = sub(to, from)
  if (Math.abs(d.x) < EPS) return null
  const n = normalize(d)
  return n.x > 0 ? n : { x: -n.x, y: -n.y }
}

/** y where the line through p with direction d crosses x = 0. */
function yAtZero(p: Vec2, d: Vec2): number {
  return p.y - (p.x * d.y) / d.x
}

export function constructionRays(
  kind: ElementKind,
  u: number,
  h: number,
  fMag: number,
  opts: { roles: RayRole[]; elementHalfHeight: number },
): ConstructionResult {
  const mirror = isMirror(kind)
  const f = signedFocalLength(kind, fMag)
  const image = imageFor(kind, u, fMag)
  const T: Vec2 = { x: u, y: h }
  const imageTip: Vec2 | null = image.atInfinity ? null : { x: image.v, y: image.m * h }
  const imageBase: Vec2 | null = image.atInfinity ? null : { x: image.v, y: 0 }
  const rays: ConstructionRay[] = []
  const dropped: RayRole[] = []
  const half = opts.elementHalfHeight

  // Points used by the rules. For lenses, the "focal ray" is aimed at (−f, 0):
  // that is F₁ (object side) for a convex lens and F₂ (image side) for a concave one.
  const F: Vec2 = { x: f, y: 0 }
  const C: Vec2 = { x: 2 * f, y: 0 }
  const negF: Vec2 = { x: -f, y: 0 }

  const push = (ray: ConstructionRay) => {
    if (Math.abs(ray.hit.y) > half + EPS) dropped.push(ray.role)
    else rays.push(ray)
  }

  for (const role of opts.roles) {
    if (role === 'pole' && !mirror) continue
    switch (role) {
      case 'parallel': {
        const H: Vec2 = { x: 0, y: h }
        let dir: Vec2
        let virtualExtension: Segment | undefined
        if (kind === 'concave-mirror') dir = normalize(sub(F, H))
        else if (kind === 'convex-mirror') dir = normalize(sub(H, F))
        else if (kind === 'convex-lens') dir = normalize(sub(F, H))
        else dir = normalize(sub(H, F)) // concave lens: appears to diverge from F₁ = (f, 0), f < 0
        if (image.virtual && imageTip) {
          // Diverging elements: extend all the way back to F (passes through the image tip).
          const far = kind === 'convex-mirror' || kind === 'concave-lens' ? F : imageTip
          virtualExtension = { a: H, b: far }
        }
        push({ role, incident: { a: T, b: H }, hit: H, outgoing: { origin: H, dir }, virtualExtension })
        break
      }
      case 'focal': {
        // Mirrors: line through F and the tip. Lenses: line through (−f, 0) and the tip.
        const P = mirror ? F : negF
        const d = forwardDirThrough(T, P)
        if (!d) {
          dropped.push(role)
          break
        }
        const H: Vec2 = { x: 0, y: yAtZero(T, d) }
        const ray: ConstructionRay = {
          role,
          incident: { a: T, b: H },
          hit: H,
          outgoing: { origin: H, dir: mirror ? { x: -1, y: 0 } : { x: 1, y: 0 } },
        }
        const aimBehind = mirror ? P.x > 0 : P.x > 0
        if (aimBehind) ray.aimGuide = { a: H, b: P }
        else if (P.x < T.x) ray.preGuide = { a: P, b: T } // object between P and F: ray "comes from" F
        if (image.virtual && imageTip) ray.virtualExtension = { a: H, b: { x: imageTip.x, y: H.y } }
        push(ray)
        break
      }
      case 'centre': {
        if (mirror) {
          const d = forwardDirThrough(T, C)
          if (!d) {
            dropped.push(role)
            break
          }
          const H: Vec2 = { x: 0, y: yAtZero(T, d) }
          const ray: ConstructionRay = {
            role,
            incident: { a: T, b: H },
            hit: H,
            outgoing: { origin: H, dir: { x: -d.x, y: -d.y } },
          }
          if (C.x > 0) ray.virtualExtension = { a: H, b: C } // convex: retraces toward C behind the mirror
          else if (C.x < T.x) ray.preGuide = { a: C, b: T }
          if (image.virtual && imageTip && C.x < 0) ray.virtualExtension = { a: H, b: imageTip }
          push(ray)
        } else {
          // Through the optical centre, undeviated.
          const O: Vec2 = { x: 0, y: 0 }
          const d = forwardDirThrough(T, O)
          if (!d) {
            dropped.push(role)
            break
          }
          const ray: ConstructionRay = { role, incident: { a: T, b: O }, hit: O, outgoing: { origin: O, dir: d } }
          if (image.virtual && imageTip) ray.virtualExtension = { a: O, b: imageTip }
          push(ray)
        }
        break
      }
      case 'pole': {
        const P0: Vec2 = { x: 0, y: 0 }
        const d = forwardDirThrough(T, P0)
        if (!d) {
          dropped.push(role)
          break
        }
        const ray: ConstructionRay = {
          role,
          incident: { a: T, b: P0 },
          hit: P0,
          outgoing: { origin: P0, dir: { x: -d.x, y: d.y } },
        }
        if (image.virtual && imageTip) ray.virtualExtension = { a: P0, b: imageTip }
        push(ray)
        break
      }
    }
  }

  return { rays, dropped, image, imageTip, imageBase, f }
}
