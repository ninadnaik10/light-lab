import { describe, expect, it } from 'vitest'
import { apparentDepthModel, PX_PER_CM, strawModel, TANK } from './apparentDepth'

describe('apparentDepthModel', () => {
  it('scales 30 cm to the full tank', () => {
    expect(apparentDepthModel(30, 1.333).coin.y).toBeCloseTo(TANK.Y_FLOOR_MAX, 9)
    expect(PX_PER_CM).toBeCloseTo(160 / 30, 9)
  })

  it('traced apparent depth is close to the paraxial d / n and the coin looks raised', () => {
    const m = apparentDepthModel(20, 1.333)
    expect(m.apparent).not.toBeNull()
    expect(m.paraxialDepthCm).toBeCloseTo(15.0, 1)
    // Oblique rays (6°, 12°) give a slightly smaller apparent depth than the paraxial formula.
    expect(m.tracedDepthCm!).toBeLessThan(m.paraxialDepthCm)
    expect(Math.abs(m.tracedDepthCm! - m.paraxialDepthCm) / m.paraxialDepthCm).toBeLessThan(0.05)
    // The image sits (almost) directly above the coin.
    expect(Math.abs(m.apparent!.x - m.coin.x)).toBeLessThan(1)
    expect(m.apparent!.y).toBeLessThan(m.coin.y)
    expect(m.apparent!.y).toBeGreaterThan(TANK.Y_SURFACE)
  })

  it('rays bend away from the normal on leaving water', () => {
    const m = apparentDepthModel(20, 1.333)
    for (const r of m.rays) expect(r.rDeg).toBeGreaterThan(r.thetaDeg)
    // Both rays reach the eye height and the eye sits between them.
    expect(m.eye.x).toBeGreaterThan(m.rays[0].end.x)
    expect(m.eye.x).toBeLessThan(m.rays[1].end.x)
  })

  it('with n = 1 nothing is lifted', () => {
    const m = apparentDepthModel(15, TANK.N_AIR)
    expect(m.tracedDepthCm!).toBeCloseTo(15, 3)
  })

  it('glass lifts the coin more than water', () => {
    const w = apparentDepthModel(20, 1.333)
    const g = apparentDepthModel(20, 1.52)
    expect(g.tracedDepthCm!).toBeLessThan(w.tracedDepthCm!)
  })
})

describe('strawModel', () => {
  it('kinks at the surface with the underwater end lifted by 1/n', () => {
    const s = strawModel(270, 1.333)
    expect(s.entry.y).toBe(TANK.Y_SURFACE)
    expect(s.entry.x).toBeGreaterThan(s.bottom.x)
    expect(s.entry.x).toBeLessThan(s.top.x)
    expect(s.apparentBottom.y).toBeCloseTo(110 + 160 / 1.333, 6)
    expect(s.apparentBottom.y).toBeLessThan(s.bottom.y)
  })
})
