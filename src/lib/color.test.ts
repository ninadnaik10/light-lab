import { describe, expect, it } from 'vitest'
import { wavelengthToRGB } from './color'

const parse = (s: string) => s.match(/\d+/g)!.map(Number)

describe('wavelengthToRGB', () => {
  it('has the expected dominant channel', () => {
    const [r1, g1, b1] = parse(wavelengthToRGB(700))
    expect(r1).toBeGreaterThan(g1)
    expect(r1).toBeGreaterThan(b1)
    const [r2, g2, b2] = parse(wavelengthToRGB(450))
    expect(b2).toBeGreaterThan(r2)
    expect(b2).toBeGreaterThan(g2)
    const [r3, g3, b3] = parse(wavelengthToRGB(550))
    expect(g3).toBeGreaterThan(r3)
    expect(g3).toBeGreaterThan(b3)
  })
  it('returns valid rgb strings at the ends', () => {
    expect(wavelengthToRGB(380)).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
    expect(wavelengthToRGB(750)).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })
})
