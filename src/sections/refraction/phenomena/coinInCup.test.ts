import { describe, expect, it } from 'vitest'
import { CUP, cupModel, depthCm, findSurfacePoint, surfaceY } from './coinInCup'

const WATER = 1.333

describe('cupModel', () => {
  it('empty cup: the straight path to the eye is stopped by the wall', () => {
    const m = cupModel(0, WATER)
    expect(m.kind).toBe('empty')
    if (m.kind === 'empty') {
      expect(m.blocked.x).toBe(CUP.X_R)
      expect(m.blocked.y).toBeGreaterThan(CUP.Y_RIM)
      expect(m.blocked.y).toBeLessThan(CUP.Y_BOTTOM)
    }
  })

  it('surface point satisfies Snell’s law', () => {
    const ys = surfaceY(85)
    const s = findSurfacePoint(ys, WATER)
    const lhs = WATER * Math.sin((s.thetaWaterDeg * Math.PI) / 180)
    const rhs = Math.sin((s.thetaAirDeg * Math.PI) / 180)
    expect(lhs).toBeCloseTo(rhs, 6)
    expect(s.x).toBeGreaterThan(CUP.COIN.x)
    expect(s.x).toBeLessThan(CUP.X_R)
  })

  it('pouring to 85 % makes the coin visible and lifts its image', () => {
    const m = cupModel(CUP.POUR_TARGET, WATER)
    expect(m.kind).toBe('visible')
    if (m.kind === 'visible') {
      expect(m.rimClearance).toBeGreaterThan(5)
      expect(m.apparentCoin.y).toBeLessThan(CUP.COIN.y)
      expect(m.liftCm).toBeGreaterThan(2)
      expect(m.thetaAirDeg).toBeGreaterThan(m.thetaWaterDeg)
    }
  })

  it('a little water is not enough', () => {
    const m = cupModel(20, WATER)
    expect(m.kind).toBe('hidden')
  })

  it('visibility switches on once and stays on as the level rises', () => {
    let seenVisible = false
    for (let lvl = 0; lvl <= 100; lvl += 1) {
      const vis = cupModel(lvl, WATER).kind === 'visible'
      if (seenVisible) expect(vis).toBe(true)
      if (vis) seenVisible = true
    }
    expect(seenVisible).toBe(true)
  })

  it('depth readout: full cup is 12 cm', () => {
    expect(depthCm(100)).toBeCloseTo(12, 9)
    expect(depthCm(0)).toBe(0)
  })
})
