import { describe, expect, it } from 'vitest'
import {
  angleBetweenDeg,
  arcPathBetweenDirs,
  clipRayToRect,
  fromAngleDeg,
  intersectRaySegment,
  pointInPolygon,
  reflect,
  refract,
} from './geometry'

const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol

describe('geometry', () => {
  it('reflects about a normal', () => {
    const r = reflect({ x: 0.7071, y: -0.7071 }, { x: 0, y: 1 })
    expect(close(r.x, 0.7071)).toBe(true)
    expect(close(r.y, 0.7071)).toBe(true)
  })

  it('refracts at normal incidence unchanged and auto-flips the normal', () => {
    const a = refract({ x: 0, y: 1 }, { x: 0, y: -1 }, 1, 1.5)!
    const b = refract({ x: 0, y: 1 }, { x: 0, y: 1 }, 1, 1.5)!
    expect(close(a.y, 1)).toBe(true)
    expect(close(b.y, 1)).toBe(true)
  })

  it('refracts 30° air→glass to 19.47°', () => {
    // travelling downward (+y), normal is ±y; 30° from the normal
    const d = fromAngleDeg(90 - 30)
    const t = refract(d, { x: 0, y: -1 }, 1, 1.5)!
    expect(close(angleBetweenDeg(t, { x: 0, y: 1 }), 19.4712, 1e-3)).toBe(true)
  })

  it('returns null on TIR', () => {
    const d = fromAngleDeg(90 - 45)
    expect(refract(d, { x: 0, y: -1 }, 1.5, 1)).toBeNull()
  })

  it('intersects ray with segment', () => {
    const hit = intersectRaySegment({ origin: { x: 0, y: 0 }, dir: { x: 1, y: 0 } }, { a: { x: 5, y: -1 }, b: { x: 5, y: 1 } })!
    expect(close(hit.t, 5)).toBe(true)
    expect(close(hit.s, 0.5)).toBe(true)
    expect(intersectRaySegment({ origin: { x: 0, y: 0 }, dir: { x: 1, y: 0 } }, { a: { x: -5, y: -1 }, b: { x: -5, y: 1 } })).toBeNull()
    expect(intersectRaySegment({ origin: { x: 0, y: 0 }, dir: { x: 1, y: 0 } }, { a: { x: 0, y: 1 }, b: { x: 5, y: 1 } })).toBeNull()
  })

  it('clips a ray to a rectangle', () => {
    const p = clipRayToRect({ origin: { x: 0, y: 0 }, dir: { x: 0.7071, y: 0.7071 } }, { xMin: -10, xMax: 10, yMin: -10, yMax: 10 })!
    expect(close(p.x, 10, 1e-3)).toBe(true)
    expect(close(p.y, 10, 1e-3)).toBe(true)
  })

  it('arc path ends at the second direction', () => {
    const path = arcPathBetweenDirs({ x: 0, y: 0 }, 10, { x: 1, y: 0 }, { x: 0, y: -1 })
    expect(path.startsWith('M 10 0 A 10 10 0 0 0')).toBe(true)
    expect(path.endsWith('0 -10') || path.endsWith('6.123233995736766e-16 -10')).toBe(true)
  })

  it('point in polygon', () => {
    const tri = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }]
    expect(pointInPolygon({ x: 5, y: 3 }, tri)).toBe(true)
    expect(pointInPolygon({ x: 50, y: 3 }, tri)).toBe(false)
  })
})
