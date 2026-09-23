import { describe, expect, it } from 'vitest'
import { cross, pointToLineDistance } from './geometry'
import { classifyZone, constructionRays, natureFor } from './imaging'
import type { ElementKind } from './optics'

const KINDS: ElementKind[] = ['concave-mirror', 'convex-mirror', 'convex-lens', 'concave-lens']

describe('classifyZone', () => {
  it('concave mirror zones', () => {
    expect(classifyZone('concave-mirror', -25, 10)).toBe('beyond-C')
    expect(classifyZone('concave-mirror', -20, 10)).toBe('at-C')
    expect(classifyZone('concave-mirror', -15, 10)).toBe('between-C-F')
    expect(classifyZone('concave-mirror', -10, 10)).toBe('at-F')
    expect(classifyZone('concave-mirror', -5, 10)).toBe('inside-F')
  })
  it('convex lens zones mirror the concave mirror ones', () => {
    expect(classifyZone('convex-lens', -25, 10)).toBe('beyond-C')
    expect(classifyZone('convex-lens', -20, 10)).toBe('at-C')
    expect(classifyZone('convex-lens', -15, 10)).toBe('between-C-F')
    expect(classifyZone('convex-lens', -10, 10)).toBe('at-F')
    expect(classifyZone('convex-lens', -5, 10)).toBe('inside-F')
  })
  it('diverging elements are always "anywhere"', () => {
    for (const u of [-3, -10, -20, -50]) {
      expect(classifyZone('convex-mirror', u, 10)).toBe('anywhere')
      expect(classifyZone('concave-lens', u, 10)).toBe('anywhere')
    }
  })
  it('tolerance snaps to F', () => {
    expect(classifyZone('concave-mirror', -10.2, 10, 0.25)).toBe('at-F')
    expect(classifyZone('concave-mirror', -10.3, 10, 0.25)).toBe('between-C-F')
  })
  it('natures', () => {
    expect(natureFor('concave-mirror', 'beyond-C')).toMatchObject({ real: true, erect: false, size: 'diminished' })
    expect(natureFor('concave-mirror', 'inside-F')).toMatchObject({ real: false, erect: true, size: 'magnified' })
    expect(natureFor('convex-mirror', 'anywhere')).toMatchObject({ real: false, erect: true, size: 'diminished' })
    expect(natureFor('convex-lens', 'at-F').size).toBe('infinite')
  })
})

describe('constructionRays', () => {
  const roles = ['parallel', 'focal', 'centre', 'pole'] as const

  it('every outgoing ray passes through the formula image tip', () => {
    for (const kind of KINDS) {
      for (const u of [-35, -25, -20, -15, -12, -8, -5]) {
        const res = constructionRays(kind, u, 3, 10, { roles: [...roles], elementHalfHeight: 1000 })
        expect(res.imageTip).not.toBeNull()
        expect(res.rays.length).toBeGreaterThanOrEqual(2)
        for (const r of res.rays) {
          const d = pointToLineDistance(res.imageTip!, r.outgoing.origin, r.outgoing.dir)
          expect(d, `${kind} u=${u} ${r.role}`).toBeLessThan(1e-6)
          if (kind.endsWith('mirror')) expect(r.outgoing.dir.x).toBeLessThan(0)
          else expect(r.outgoing.dir.x).toBeGreaterThan(0)
          // incident always ends on the x = 0 plane
          expect(Math.abs(r.hit.x)).toBeLessThan(1e-9)
        }
      }
    }
  })

  it('object at F gives parallel outgoing rays and drops the focal ray', () => {
    for (const kind of ['concave-mirror', 'convex-lens'] as ElementKind[]) {
      const res = constructionRays(kind, -10, 3, 10, { roles: [...roles], elementHalfHeight: 1000 })
      expect(res.image.atInfinity).toBe(true)
      expect(res.imageTip).toBeNull()
      expect(res.dropped).toContain('focal')
      const d0 = res.rays[0].outgoing.dir
      for (const r of res.rays) expect(Math.abs(cross(d0, r.outgoing.dir))).toBeLessThan(1e-9)
    }
  })

  it('object at C drops the centre ray for mirrors', () => {
    const res = constructionRays('concave-mirror', -20, 3, 10, { roles: [...roles], elementHalfHeight: 1000 })
    expect(res.dropped).toContain('centre')
    expect(res.rays.length).toBeGreaterThanOrEqual(2)
  })

  it('drops rays whose hit point misses the element but keeps the safe ones', () => {
    const res = constructionRays('concave-mirror', -11, 3, 10, { roles: [...roles], elementHalfHeight: 5 })
    expect(res.dropped).toContain('focal')
    expect(res.rays.map((r) => r.role)).toContain('parallel')
    expect(res.rays.map((r) => r.role)).toContain('pole')
  })

  it('convex mirror rays have virtual extensions and aim guides', () => {
    const res = constructionRays('convex-mirror', -20, 3, 10, { roles: [...roles], elementHalfHeight: 1000 })
    const parallel = res.rays.find((r) => r.role === 'parallel')!
    const focal = res.rays.find((r) => r.role === 'focal')!
    expect(parallel.virtualExtension!.b).toEqual({ x: 10, y: 0 })
    expect(focal.aimGuide!.b).toEqual({ x: 10, y: 0 })
    expect(focal.outgoing.dir).toEqual({ x: -1, y: 0 })
    expect(focal.virtualExtension!.b.x).toBeCloseTo(6.667, 3)
    expect(focal.virtualExtension!.b.y).toBeCloseTo(1, 6)
  })

  it('concave mirror object inside F has a pre-guide from F', () => {
    const res = constructionRays('concave-mirror', -5, 3, 10, { roles: [...roles], elementHalfHeight: 1000 })
    const focal = res.rays.find((r) => r.role === 'focal')!
    expect(focal.preGuide).toEqual({ a: { x: -10, y: 0 }, b: { x: -5, y: 3 } })
    expect(res.image.virtual).toBe(true)
    for (const r of res.rays) expect(r.virtualExtension).toBeDefined()
  })

  it('concave lens: parallel ray appears to diverge from F₁ and the focal ray is aimed at F₂', () => {
    const res = constructionRays('concave-lens', -20, 3, 10, { roles: [...roles], elementHalfHeight: 1000 })
    const parallel = res.rays.find((r) => r.role === 'parallel')!
    const focal = res.rays.find((r) => r.role === 'focal')!
    expect(parallel.virtualExtension!.b).toEqual({ x: -10, y: 0 })
    expect(focal.aimGuide!.b).toEqual({ x: 10, y: 0 })
    expect(focal.outgoing.dir).toEqual({ x: 1, y: 0 })
  })
})
