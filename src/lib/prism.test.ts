import { describe, expect, it } from 'vitest'
import { degToRad } from './geometry'
import { entryPointOnLeftFace, incidentRayForAngle, prismPolygon, tracePolygon } from './prism'

const bounds = { xMin: -1000, xMax: 1000, yMin: -1000, yMax: 1000 }

describe('prismPolygon', () => {
  it('has the requested apex angle', () => {
    const poly = prismPolygon(60, { x: 0, y: 0 }, 100)
    const a = poly[0]
    const v1 = { x: poly[1].x - a.x, y: poly[1].y - a.y }
    const v2 = { x: poly[2].x - a.x, y: poly[2].y - a.y }
    const ang = Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)))
    expect(ang).toBeCloseTo(degToRad(60), 9)
  })
})

describe('tracePolygon through a prism', () => {
  const poly = prismPolygon(60, { x: 0, y: 0 }, 200)
  const entry = entryPointOnLeftFace(poly, 0.5)

  it('minimum-deviation ray is symmetric with δ ≈ 37.18°', () => {
    const { ray } = incidentRayForAngle(entry.point, entry.outwardNormal, 48.59, 300, 1)
    const res = tracePolygon(ray, poly, 1.5, 1, { bounds })
    expect(res.missed).toBe(false)
    expect(res.standardPath).toBe(true)
    expect(res.events.length).toBe(2)
    expect(res.events[1].rDeg!).toBeCloseTo(48.59, 1)
    expect(res.deviationDeg!).toBeCloseTo(37.18, 1)
  })

  it('violet deviates more than red', () => {
    const { ray } = incidentRayForAngle(entry.point, entry.outwardNormal, 50, 300, 1)
    const red = tracePolygon(ray, poly, 1.513, 1, { bounds })
    const violet = tracePolygon(ray, poly, 1.531, 1, { bounds })
    expect(red.standardPath && violet.standardPath).toBe(true)
    expect(violet.deviationDeg!).toBeGreaterThan(red.deviationDeg!)
    expect(red.deviationDeg!).toBeGreaterThan(35)
    expect(red.deviationDeg!).toBeLessThan(45)
  })

  it('small incidence angle causes TIR at the second face', () => {
    const { ray } = incidentRayForAngle(entry.point, entry.outwardNormal, 20, 300, 1)
    const res = tracePolygon(ray, poly, 1.5, 1, { bounds })
    expect(res.events.some((e) => e.kind === 'tir')).toBe(true)
    expect(res.standardPath).toBe(false)
    expect(res.segments.length).toBeGreaterThanOrEqual(3)
  })

  it('a ray that misses the prism is reported', () => {
    const res = tracePolygon({ origin: { x: -500, y: 500 }, dir: { x: 1, y: 0 } }, poly, 1.5, 1, { bounds })
    expect(res.missed).toBe(true)
  })
})

describe('tracePolygon through a fibre core', () => {
  // Core rectangle x 0..800, y −20..20 (edges: 0 bottom, 1 right, 2 top, 3 left)
  const core = [{ x: 0, y: -20 }, { x: 800, y: -20 }, { x: 800, y: 20 }, { x: 0, y: 20 }]
  const launch = (deg: number) => ({ origin: { x: 1, y: 0 }, dir: { x: Math.cos(degToRad(deg)), y: Math.sin(degToRad(deg)) } })

  it('15° inside the core is guided by TIR (θc ≈ 68.96°)', () => {
    const res = tracePolygon(launch(15), core, 1.5, 1.4, { bounds, maxBounces: 60 })
    const wallEvents = res.events.filter((e) => e.edge === 0 || e.edge === 2)
    expect(wallEvents.length).toBeGreaterThan(3)
    expect(wallEvents.every((e) => e.kind === 'tir')).toBe(true)
    const last = res.events[res.events.length - 1]
    expect(last.kind).toBe('exit')
    expect(last.edge).toBe(1)
  })

  it('30° inside the core leaks at the first wall', () => {
    const res = tracePolygon(launch(30), core, 1.5, 1.4, { bounds, maxBounces: 60 })
    expect(res.events[0].kind).toBe('exit')
    expect(res.events[0].edge === 0 || res.events[0].edge === 2).toBe(true)
  })
})

describe('outwardNormal on a non-convex polygon', () => {
  it('points away from the interior even at concave corners', async () => {
    const { outwardNormal } = await import('./prism')
    // L-shape, counter-clockwise
    const L = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 4 }, { x: 0, y: 4 }]
    const n2 = outwardNormal(L, 2) // top of the horizontal bar: interior is below
    expect(n2.x).toBeCloseTo(0, 9)
    expect(n2.y).toBeCloseTo(1, 9)
    const n3 = outwardNormal(L, 3) // right side of the vertical bar: interior is to the left
    expect(n3.x).toBeCloseTo(1, 9)
    expect(n3.y).toBeCloseTo(0, 9)
    // Same shape, clockwise order → same outward normals
    const Lcw = [...L].reverse()
    const m2 = outwardNormal(Lcw, 2) // edge (1,1)→(4,1): top of the horizontal bar
    expect(m2.x).toBeCloseTo(0, 9)
    expect(m2.y).toBeCloseTo(1, 9)
    const m1 = outwardNormal(Lcw, 1) // edge (1,4)→(1,1): right side of the vertical bar
    expect(m1.x).toBeCloseTo(1, 9)
    expect(m1.y).toBeCloseTo(0, 9)
  })
})
