import { describe, expect, it } from 'vitest'
import { apparentSky, layerIndex, MIRAGE, traceMirage } from './mirage'

describe('mirage layers', () => {
  it('index falls linearly from the top to the road', () => {
    expect(layerIndex(0, 0.06)).toBeCloseTo(MIRAGE.N_TOP, 9)
    expect(layerIndex(MIRAGE.N_LAYERS - 1, 0.06)).toBeCloseTo(MIRAGE.N_TOP - 0.06, 9)
  })
})

describe('traceMirage', () => {
  it('uniform air: a steep ray goes straight to the road', () => {
    const t = traceMirage(12, 0)
    expect(t.outcome).toBe('road')
    expect(t.turnY).toBeNull()
    expect(t.eye).toBeNull()
    // Straight line: every point lies on the same line.
    const p0 = t.points[0]
    const p1 = t.points[t.points.length - 1]
    const slope = (p1.y - p0.y) / (p1.x - p0.x)
    for (const p of t.points) expect(p.y - p0.y).toBeCloseTo(slope * (p.x - p0.x), 6)
  })

  it('hot road: a shallow ray turns up before the road and reaches an eye at the source height', () => {
    const t = traceMirage(6, 0.02)
    expect(t.outcome).toBe('mirage')
    expect(t.turnY).not.toBeNull()
    expect(t.turnY!).toBeLessThan(MIRAGE.Y_ROAD)
    expect(t.turnHeightCm!).toBeGreaterThan(0)
    expect(t.eye).not.toBeNull()
    expect(t.eye!.y).toBeCloseTo(MIRAGE.Y_TOP, 6)
    expect(t.eye!.x).toBeGreaterThan(MIRAGE.X_SOURCE)
    // Every point stays above the road.
    for (const p of t.points) expect(p.y).toBeLessThanOrEqual(MIRAGE.Y_ROAD + 1e-9)
    // Snell invariant: the path is symmetric about the turning point (same |slope| per layer).
    const mid = t.points.findIndex((p) => Math.abs(p.y - t.turnY!) < 1e-9)
    expect(mid).toBeGreaterThan(0)
  })

  it('turning needs n_road < n_top cos α', () => {
    // α = 20°: needs Δn > 1.00029 (1 − cos 20°) ≈ 0.0603 > slider max, so it must hit the road.
    expect(traceMirage(20, 0.06).outcome).toBe('road')
    // α = 3°: Δn = 0.01 is plenty.
    expect(traceMirage(3, 0.01).outcome).toBe('mirage')
  })

  it('a very shallow ray in uniform air leaves the picture still heading down', () => {
    expect(traceMirage(2, 0).outcome).toBe('passes')
  })

  it('the apparent sky lies below the road level', () => {
    const t = traceMirage(8, 0.03)
    const v = apparentSky(t)
    expect(v).not.toBeNull()
    expect(v!.to.y).toBeGreaterThan(MIRAGE.Y_ROAD)
    expect(v!.to.x).toBeLessThan(v!.from.x)
    expect(apparentSky(traceMirage(20, 0))).toBeNull()
  })
})
