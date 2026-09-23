/** Pure model for the blue-sky / red-sunset demo. */
import { wavelengthToRGB } from '../../../lib/color'
import { rayleighRelative, rayleighTransmission } from '../../../lib/droplet'
import { clamp } from '../../../lib/format'
import { degToRad } from '../../../lib/geometry'

export const SKY_STAGE = { w: 900, h: 300 }
export const MAX_AIR_MASS = 38

/** Relative path length through the atmosphere (air mass) for a sun elevation in degrees. */
export const airMassFor = (elevationDeg: number): number => clamp(1 / Math.max(0.03, Math.sin(degToRad(elevationDeg))), 1, MAX_AIR_MASS)

type RGB = [number, number, number]
const parseRGB = (s: string): RGB => {
  const m = s.match(/\d+/g)
  return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0]
}
const toCSS = (c: RGB) => `rgb(${c.map((v) => Math.round(clamp(v, 0, 255))).join(', ')})`

const SPECTRUM = Array.from({ length: 31 }, (_, i) => 400 + 10 * i).map((nm) => ({ nm, rgb: parseRGB(wavelengthToRGB(nm)) }))

/** Per-channel sums for the overhead sun, used as the white balance so noon looks white. */
const NOON: RGB = SPECTRUM.reduce<RGB>(
  (acc, { nm, rgb }) => {
    const t = rayleighTransmission(nm, 1)
    return [acc[0] + rgb[0] * t, acc[1] + rgb[1] * t, acc[2] + rgb[2] * t]
  },
  [0, 0, 0],
)

/** Colour of the direct sunlight after a path of `airMass`: Σ colour(λ)·T(λ), white-balanced to noon. */
export function sunColour(airMass: number): string {
  const s = SPECTRUM.reduce<RGB>(
    (acc, { nm, rgb }) => {
      const t = rayleighTransmission(nm, airMass)
      return [acc[0] + rgb[0] * t, acc[1] + rgb[1] * t, acc[2] + rgb[2] * t]
    },
    [0, 0, 0],
  )
  const v: RGB = [s[0] / NOON[0], s[1] / NOON[1], s[2] / NOON[2]]
  // Keep the disc bright enough to read its hue: the point is the colour shift, not the dimming.
  const peak = Math.max(v[0], v[1], v[2], 1e-9)
  const gain = peak < 0.85 ? 0.85 / peak : 1
  return toCSS([255 * v[0] * gain, 255 * v[1] * gain, 255 * v[2] * gain])
}

/** Colour of the scattered skylight: Σ colour(λ)·(1 − T(λ)), white-balanced and normalised to full brightness. */
export function skyColour(airMass: number): string {
  const s = SPECTRUM.reduce<RGB>(
    (acc, { nm, rgb }) => {
      const sc = 1 - rayleighTransmission(nm, airMass)
      return [acc[0] + (rgb[0] * sc) / NOON[0], acc[1] + (rgb[1] * sc) / NOON[1], acc[2] + (rgb[2] * sc) / NOON[2]]
    },
    [0, 0, 0],
  )
  const max = Math.max(s[0], s[1], s[2], 1e-9)
  return toCSS([(255 * s[0]) / max, (255 * s[1]) / max, (255 * s[2]) / max])
}

/** Wavelengths used for the scattered dots and the bar chart. */
export const SCATTER_SAMPLES = [
  { nm: 400, name: 'violet' },
  { nm: 450, name: 'blue' },
  { nm: 500, name: 'cyan' },
  { nm: 550, name: 'green' },
  { nm: 600, name: 'yellow' },
  { nm: 650, name: 'orange' },
  { nm: 700, name: 'red' },
] as const

export const BAR_SAMPLES = [
  { nm: 400, name: 'violet' },
  { nm: 450, name: 'blue' },
  { nm: 550, name: 'green' },
  { nm: 580, name: 'yellow' },
  { nm: 700, name: 'red' },
] as const

export type ScatterDot = { x: number; y: number; r: number; color: string; nm: number }

/** Small deterministic PRNG so the dot cloud is stable between renders. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const BEAM = { x1: 20, x2: 445, yTop: 122, yBottom: 178 }

/**
 * Dots scattered out of the beam. Counts per colour ∝ 1/λ⁴ (Rayleigh); the total
 * grows gently with the air mass because a longer path scatters more light.
 */
export function scatterDots(airMass: number): ScatterDot[] {
  const total = Math.round(90 + 70 * (1 - 1 / airMass))
  const weights = SCATTER_SAMPLES.map((s) => rayleighRelative(s.nm))
  const wSum = weights.reduce((a, b) => a + b, 0)
  const rnd = mulberry32(7)
  const dots: ScatterDot[] = []
  SCATTER_SAMPLES.forEach((s, idx) => {
    const count = Math.round((total * weights[idx]) / wSum)
    const color = wavelengthToRGB(s.nm)
    for (let i = 0; i < count; i++) {
      const x = BEAM.x1 + 12 + rnd() * (BEAM.x2 - BEAM.x1 - 24)
      const above = rnd() < 0.5
      const off = 6 + rnd() * rnd() * 90
      const y = above ? BEAM.yTop - off : BEAM.yBottom + off
      dots.push({ x, y, r: 1.4 + rnd() * 1.4, color, nm: s.nm })
    }
  })
  return dots
}
