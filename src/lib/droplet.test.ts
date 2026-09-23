import { describe, expect, it } from 'vitest'
import { degToRad } from './geometry'
import { impactForIncidence, rainbowAngle, rayleighRelative, rayleighTransmission, traceDroplet } from './droplet'

const bounds = { xMin: -1000, xMax: 1000, yMin: -1000, yMax: 1000 }
const center = { x: 0, y: 0 }
const R = 100

describe('rainbowAngle', () => {
  it('primary rainbow is about 42° and secondary about 51° for water', () => {
    const p = rainbowAngle(1.333, 1)!
    expect(p.rainbowAngleDeg).toBeCloseTo(42.1, 0)
    expect(p.incidenceDeg).toBeCloseTo(59.4, 0)
    const s = rainbowAngle(1.333, 2)!
    expect(s.rainbowAngleDeg).toBeCloseTo(50.8, 0)
  })
  it('red exits at a larger angle than violet', () => {
    expect(rainbowAngle(1.331, 1)!.rainbowAngleDeg).toBeGreaterThan(rainbowAngle(1.343, 1)!.rainbowAngleDeg)
  })
})

describe('traceDroplet', () => {
  it('traces enter → reflect → exit and matches the analytic rainbow angle', () => {
    const geo = rainbowAngle(1.333, 1)!
    const ray = { origin: { x: -400, y: -geo.impact * R }, dir: { x: 1, y: 0 } }
    const res = traceDroplet(ray, center, R, 1.333, { bounds, reflections: 1 })
    expect(res.missed).toBe(false)
    expect(res.events.map((e) => e.kind)).toEqual(['enter', 'reflect', 'exit'])
    expect(res.events[0].iDeg).toBeCloseTo(geo.incidenceDeg, 1)
    expect(res.rainbowAngleDeg!).toBeCloseTo(geo.rainbowAngleDeg, 1)
    expect(res.segments.length).toBe(4)
  })
  it('two reflections give the secondary rainbow', () => {
    const geo = rainbowAngle(1.333, 2)!
    const ray = { origin: { x: -400, y: -geo.impact * R }, dir: { x: 1, y: 0 } }
    const res = traceDroplet(ray, center, R, 1.333, { bounds, reflections: 2 })
    expect(res.events.filter((e) => e.kind === 'reflect').length).toBe(2)
    expect(res.rainbowAngleDeg!).toBeCloseTo(geo.rainbowAngleDeg, 1)
  })
  it('reports a miss for rays outside the droplet', () => {
    const res = traceDroplet({ origin: { x: -400, y: 150 }, dir: { x: 1, y: 0 } }, center, R, 1.333, { bounds })
    expect(res.missed).toBe(true)
  })
  it('impact parameter helper', () => {
    expect(impactForIncidence(30)).toBeCloseTo(Math.sin(degToRad(30)), 9)
  })
})

describe('rayleigh', () => {
  it('blue scatters much more than red', () => {
    expect(rayleighRelative(450)).toBeCloseTo(2.23, 1)
    expect(rayleighRelative(700)).toBeCloseTo(0.38, 1)
    expect(rayleighTransmission(450, 1)).toBeLessThan(rayleighTransmission(700, 1))
    expect(rayleighTransmission(450, 20)).toBeLessThan(0.05)
    expect(rayleighTransmission(700, 20)).toBeGreaterThan(0.4)
  })
})
