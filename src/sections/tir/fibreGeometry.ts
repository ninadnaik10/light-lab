/**
 * Geometry of a bendable optical fibre for the TIR demo: a straight lead-in,
 * a circular arc of the chosen bend angle, and a straight lead-out that is
 * shortened so the fibre stays inside the stage. The core and cladding are
 * polygons built from the sampled centreline. Stage units, y down.
 */
import { add, scale, type Vec2 } from '../../lib/geometry'

export const FIBRE = {
  W: 900,
  H: 340,
  /** Launch face. */
  X0: 60,
  /** Where the bend begins. */
  X_BEND: 300,
  /** Centreline height of the straight lead-in. */
  YC: 90,
  /** Bend radius of the centreline. */
  R: 220,
  /** Core half-width. */
  HALF: 30,
  /** Cladding thickness around the core. */
  CLAD: 30,
  ARC_SAMPLES: 32,
  /** Total centreline length of the straight fibre (60 → 860). */
  L_TOTAL: 800,
  /** Keep the cladding this far from the stage edges. */
  MARGIN: 30,
  BEND_MIN: 0,
  BEND_MAX: 90,
} as const

export type FibreShape = {
  /** Sampled centreline. */
  centre: Vec2[]
  /** Unit normals at each centreline sample pointing to the outer (top) wall. */
  normals: Vec2[]
  core: Vec2[]
  clad: Vec2[]
  /** Index of the polygon edge that is the far end face of the core. */
  endFaceEdge: number
  /** Index of the launch face edge of the core. */
  launchFaceEdge: number
  /** Far end of the centreline and the direction light travels there. */
  endCentre: Vec2
  endDir: Vec2
  leadOut: number
  arcLength: number
}

const dedupe = (pts: Vec2[], ns: Vec2[]) => {
  const p: Vec2[] = []
  const n: Vec2[] = []
  for (let i = 0; i < pts.length; i++) {
    const last = p[p.length - 1]
    if (last && Math.hypot(last.x - pts[i].x, last.y - pts[i].y) < 1e-6) {
      n[n.length - 1] = ns[i] // keep the later normal (the tangent after the corner)
      continue
    }
    p.push(pts[i])
    n.push(ns[i])
  }
  // Drop interior points that sit on a straight run (e.g. the collapsed arc at bend 0°).
  const q: Vec2[] = []
  const qn: Vec2[] = []
  for (let i = 0; i < p.length; i++) {
    if (i > 0 && i < p.length - 1) {
      const a = p[i - 1]
      const b = p[i]
      const c = p[i + 1]
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
      if (Math.abs(cross) < 1e-9) continue
    }
    q.push(p[i])
    qn.push(n[i])
  }
  return { p: q, n: qn }
}

/**
 * Offset the centreline by ±halfWidth into a closed polygon: outer boundary
 * forward, then inner boundary reversed. Edge m−1 is the end face and edge
 * 2m−1 the launch face, where m is the number of centreline samples.
 */
export function tubePolygon(centre: Vec2[], normals: Vec2[], halfWidth: number): { poly: Vec2[]; endFaceEdge: number; launchFaceEdge: number } {
  const outer = centre.map((c, i) => add(c, scale(normals[i], halfWidth)))
  const inner = centre.map((c, i) => add(c, scale(normals[i], -halfWidth)))
  const m = centre.length
  return { poly: [...outer, ...inner.reverse()], endFaceEdge: m - 1, launchFaceEdge: 2 * m - 1 }
}

export function fibreShape(bendDeg: number): FibreShape {
  const { X0, X_BEND, YC, R, HALF, CLAD, ARC_SAMPLES, L_TOTAL, MARGIN, W, H } = FIBRE
  const beta = (Math.max(0, bendDeg) * Math.PI) / 180
  const up: Vec2 = { x: 0, y: -1 }
  const pts: Vec2[] = [{ x: X0, y: YC }, { x: X_BEND, y: YC }]
  const ns: Vec2[] = [up, up]

  // Arc bending downward: centre of curvature below the lead-in.
  const O = { x: X_BEND, y: YC + R }
  for (let k = 1; k <= ARC_SAMPLES; k++) {
    const phi = (beta * k) / ARC_SAMPLES
    const radial = { x: Math.sin(phi), y: -Math.cos(phi) }
    pts.push(add(O, scale(radial, R)))
    ns.push(radial)
  }
  const arcEnd = pts[pts.length - 1]
  const endDir = { x: Math.cos(beta), y: Math.sin(beta) }
  const endNormal = { x: Math.sin(beta), y: -Math.cos(beta) }
  const arcLength = R * beta

  // Straight lead-out: as long as the total length allows, but keep the cladding inside the stage.
  const outerHalf = HALF + CLAD
  let leadOut = Math.max(0, L_TOTAL - (X_BEND - X0) - arcLength)
  if (endDir.y > 1e-9) leadOut = Math.min(leadOut, (H - MARGIN - arcEnd.y - outerHalf * Math.cos(beta)) / endDir.y)
  if (endDir.x > 1e-9) leadOut = Math.min(leadOut, (W - 40 - arcEnd.x - outerHalf * Math.sin(beta)) / endDir.x)
  leadOut = Math.max(0, leadOut)
  const endCentre = add(arcEnd, scale(endDir, leadOut))
  pts.push(endCentre)
  ns.push(endNormal)

  const { p: centre, n: normals } = dedupe(pts, ns)
  const core = tubePolygon(centre, normals, HALF)
  const clad = tubePolygon(centre, normals, HALF + CLAD)
  return { centre, normals, core: core.poly, clad: clad.poly, endFaceEdge: core.endFaceEdge, launchFaceEdge: core.launchFaceEdge, endCentre, endDir, leadOut, arcLength }
}

/** Two edges of a polygon that mark the same physical face: helper for readouts. */
export const isWallEdge = (shape: FibreShape, edge: number): boolean => edge !== shape.endFaceEdge && edge !== shape.launchFaceEdge
