import { describe, expect, it } from 'vitest'
import { pointInPolygon } from '../../lib/geometry'
import { outwardNormal, tracePolygon } from '../../lib/prism'
import { FIBRE, fibreShape, isWallEdge } from './fibreGeometry'

const bounds = { xMin: 0, xMax: FIBRE.W, yMin: 0, yMax: FIBRE.H }

describe('fibreShape', () => {
  it('bend 0° is the old straight rectangle from x = 60 to 860', () => {
    const s = fibreShape(0)
    expect(s.core.length).toBe(4)
    expect(s.core[0]).toEqual({ x: 60, y: FIBRE.YC - FIBRE.HALF })
    expect(s.core[1]).toEqual({ x: 860, y: FIBRE.YC - FIBRE.HALF })
    expect(s.endFaceEdge).toBe(1)
    expect(s.launchFaceEdge).toBe(3)
    expect(s.leadOut).toBeCloseTo(560, 6)
  })

  it('a quarter turn stays inside the stage with the cladding', () => {
    const s = fibreShape(90)
    for (const p of s.clad) {
      expect(p.x).toBeGreaterThanOrEqual(FIBRE.X0 - 1e-6)
      expect(p.x).toBeLessThanOrEqual(FIBRE.W)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(FIBRE.H - FIBRE.MARGIN + 1e-6)
    }
    expect(s.endDir.x).toBeCloseTo(0, 9)
    expect(s.endDir.y).toBeCloseTo(1, 9)
    // End face is horizontal at the arc end.
    const a = s.core[s.endFaceEdge]
    const b = s.core[s.endFaceEdge + 1]
    expect(a.y).toBeCloseTo(b.y, 6)
    expect(Math.abs(a.x - b.x)).toBeCloseTo(2 * FIBRE.HALF, 6)
  })

  it('outward normals of the outer arc wall point away from the centre of curvature', () => {
    const s = fibreShape(60)
    const O = { x: FIBRE.X_BEND, y: FIBRE.YC + FIBRE.R }
    // Edge 1 .. ARC_SAMPLES are the outer arc facets (edge 0 is the lead-in top wall).
    for (let e = 2; e < 2 + FIBRE.ARC_SAMPLES - 2; e++) {
      const n = outwardNormal(s.core, e)
      const mid = { x: (s.core[e].x + s.core[e + 1].x) / 2, y: (s.core[e].y + s.core[e + 1].y) / 2 }
      const radial = { x: mid.x - O.x, y: mid.y - O.y }
      expect(n.x * radial.x + n.y * radial.y).toBeGreaterThan(0)
    }
    expect(pointInPolygon({ x: FIBRE.X0 + 1, y: FIBRE.YC }, s.core)).toBe(true)
  })

  it('an axial ray leaves through the end face of a straight fibre but leaks at the outer wall of a tight bend', () => {
    const launch = { origin: { x: FIBRE.X0 + 1, y: FIBRE.YC }, dir: { x: 1, y: 0 } }
    const straight = fibreShape(0)
    const rs = tracePolygon(launch, straight.core, 1.5, 1.4, { bounds, maxBounces: 300 })
    const exitS = rs.events.find((e) => e.kind === 'exit')
    expect(exitS?.edge).toBe(straight.endFaceEdge)

    const bent = fibreShape(90)
    const rb = tracePolygon(launch, bent.core, 1.5, 1.4, { bounds, maxBounces: 300 })
    const exitB = rb.events.find((e) => e.kind === 'exit')
    expect(exitB).toBeDefined()
    expect(isWallEdge(bent, exitB!.edge)).toBe(true)
    // Incidence at the outer wall for a centreline ray: sin i = R / (R + HALF) → 61.6° < θc = 69°.
    expect(exitB!.iDeg).toBeGreaterThan(55)
    expect(exitB!.iDeg).toBeLessThan(69)
  })

  it('a ray hugging the outer wall is still guided round the bend', () => {
    const bent = fibreShape(90)
    const launch = { origin: { x: FIBRE.X0 + 1, y: FIBRE.YC - 25 }, dir: { x: 1, y: 0 } }
    const r = tracePolygon(launch, bent.core, 1.5, 1.4, { bounds, maxBounces: 300 })
    const exit = r.events.find((e) => e.kind === 'exit')
    expect(exit?.edge).toBe(bent.endFaceEdge)
  })
})
