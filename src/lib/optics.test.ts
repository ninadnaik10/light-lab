import { describe, expect, it } from 'vitest'
import {
  cauchyIndex,
  criticalAngleDeg,
  fresnelReflectance,
  lensImage,
  mirrorImage,
  prismIncidenceForMinDeviation,
  prismMinDeviationDeg,
  signedFocalLength,
  snellAngle,
} from './optics'

describe('snell', () => {
  it('computes refraction angles', () => {
    expect(snellAngle(1, 1.5, 30)).toBeCloseTo(19.47, 2)
    expect(snellAngle(1, 1.333, 40)).toBeCloseTo(28.83, 2)
    expect(snellAngle(1.5, 1, 30)).toBeCloseTo(48.59, 2)
    expect(snellAngle(1, 1.5, 0)).toBeCloseTo(0, 6)
  })
  it('returns null on TIR and ~90 at the critical angle', () => {
    expect(snellAngle(1.5, 1, 45)).toBeNull()
    expect(snellAngle(1.5, 1, 41.81)).toBeGreaterThan(89.5)
  })
})

describe('critical angle', () => {
  it('matches textbook values', () => {
    expect(criticalAngleDeg(1.333, 1)).toBeCloseTo(48.61, 2)
    expect(criticalAngleDeg(1.5, 1)).toBeCloseTo(41.81, 2)
    expect(criticalAngleDeg(2.417, 1)).toBeCloseTo(24.44, 2)
    expect(criticalAngleDeg(1, 1.5)).toBeNull()
    expect(criticalAngleDeg(1.5, 1.5)).toBeNull()
  })
})

describe('fresnel', () => {
  it('reflectance', () => {
    expect(fresnelReflectance(1, 1.5, 0)).toBeCloseTo(0.04, 3)
    expect(fresnelReflectance(1, 1.5, 45)).toBeCloseTo(0.05, 2)
    expect(fresnelReflectance(1, 1.5, 89.9)).toBeGreaterThan(0.9)
    expect(fresnelReflectance(1.5, 1, 45)).toBe(1)
  })
})

describe('mirror formula (New Cartesian)', () => {
  it('concave mirror f = −10', () => {
    let s = mirrorImage(-15, -10)
    expect(s.v).toBeCloseTo(-30, 6)
    expect(s.m).toBeCloseTo(-2, 6)
    expect(s.virtual).toBe(false)
    s = mirrorImage(-30, -10)
    expect(s.v).toBeCloseTo(-15, 6)
    expect(s.m).toBeCloseTo(-0.5, 6)
    s = mirrorImage(-5, -10)
    expect(s.v).toBeCloseTo(10, 6)
    expect(s.m).toBeCloseTo(2, 6)
    expect(s.virtual).toBe(true)
    s = mirrorImage(-20, -10)
    expect(s.v).toBeCloseTo(-20, 6)
    expect(s.m).toBeCloseTo(-1, 6)
    expect(mirrorImage(-10, -10).atInfinity).toBe(true)
  })
  it('convex mirror f = +10', () => {
    const s = mirrorImage(-20, 10)
    expect(s.v).toBeCloseTo(6.667, 3)
    expect(s.m).toBeCloseTo(0.333, 3)
    expect(s.virtual).toBe(true)
  })
})

describe('lens formula (New Cartesian)', () => {
  it('convex lens f = 10', () => {
    let s = lensImage(-15, 10)
    expect(s.v).toBeCloseTo(30, 6)
    expect(s.m).toBeCloseTo(-2, 6)
    expect(s.virtual).toBe(false)
    s = lensImage(-5, 10)
    expect(s.v).toBeCloseTo(-10, 6)
    expect(s.m).toBeCloseTo(2, 6)
    expect(s.virtual).toBe(true)
    s = lensImage(-20, 10)
    expect(s.v).toBeCloseTo(20, 6)
    expect(s.m).toBeCloseTo(-1, 6)
    expect(lensImage(-10, 10).atInfinity).toBe(true)
  })
  it('concave lens f = −10', () => {
    const s = lensImage(-20, -10)
    expect(s.v).toBeCloseTo(-6.667, 3)
    expect(s.m).toBeCloseTo(0.333, 3)
    expect(s.virtual).toBe(true)
  })
  it('signed focal lengths', () => {
    expect(signedFocalLength('concave-mirror', 10)).toBe(-10)
    expect(signedFocalLength('convex-mirror', 10)).toBe(10)
    expect(signedFocalLength('convex-lens', 10)).toBe(10)
    expect(signedFocalLength('concave-lens', 10)).toBe(-10)
  })
})

describe('dispersion', () => {
  it('cauchy index', () => {
    expect(cauchyIndex('crown', 400)).toBeCloseTo(1.531, 2)
    expect(cauchyIndex('crown', 700)).toBeCloseTo(1.513, 2)
    let prev = Infinity
    for (let l = 400; l <= 700; l += 20) {
      const n = cauchyIndex('crown', l)
      expect(n).toBeLessThan(prev)
      prev = n
    }
    const spread1 = cauchyIndex('crown', 400) - cauchyIndex('crown', 700)
    const spread3 = cauchyIndex('crown', 400, 3) - cauchyIndex('crown', 700, 3)
    expect(spread3 / spread1).toBeCloseTo(3, 6)
  })
  it('minimum deviation', () => {
    expect(prismMinDeviationDeg(1.5, 60)).toBeCloseTo(37.18, 2)
    expect(prismIncidenceForMinDeviation(1.5, 60)).toBeCloseTo(48.59, 2)
    expect(prismMinDeviationDeg(1.5, 90)).toBeNull()
  })
})

describe('water dispersion', () => {
  it('cauchy water index near 1.333 at 589 nm', () => {
    expect(cauchyIndex('water', 589)).toBeCloseTo(1.333, 2)
    expect(cauchyIndex('water', 400)).toBeGreaterThan(cauchyIndex('water', 700))
  })
})
