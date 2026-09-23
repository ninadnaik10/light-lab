import { degToRad, radToDeg } from './geometry'

/* ---------------- Reflection / refraction ---------------- */

/** Angle of refraction in degrees, or null on total internal reflection. */
export function snellAngle(n1: number, n2: number, iDeg: number): number | null {
  const s = (n1 * Math.sin(degToRad(iDeg))) / n2
  if (s > 1 + 1e-12) return null
  return radToDeg(Math.asin(Math.min(1, s)))
}

/** Critical angle in degrees for light going from n1 into n2. Null unless n1 > n2. */
export function criticalAngleDeg(n1: number, n2: number): number | null {
  if (n1 <= n2) return null
  return radToDeg(Math.asin(n2 / n1))
}

/**
 * Unpolarised Fresnel reflectance (average of s and p polarisations) for light
 * going from n1 into n2 at incidence angle iDeg. Returns 1 at/after TIR.
 */
export function fresnelReflectance(n1: number, n2: number, iDeg: number): number {
  const i = degToRad(iDeg)
  const cosI = Math.cos(i)
  const sinT = (n1 / n2) * Math.sin(i)
  if (sinT >= 1) return 1
  const cosT = Math.sqrt(1 - sinT * sinT)
  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT)
  const rp = (n1 * cosT - n2 * cosI) / (n1 * cosT + n2 * cosI)
  return Math.min(1, Math.max(0, (rs * rs + rp * rp) / 2))
}

/** v1 / v2 = n2 / n1 */
export const speedRatio = (n1: number, n2: number): number => n2 / n1

export const SPEED_OF_LIGHT = 299_792_458 // m/s

/** Speed of light in a medium, in m/s. */
export const speedInMedium = (n: number): number => SPEED_OF_LIGHT / n

/* ---------------- Mirrors and lenses (New Cartesian) ---------------- */

export type ElementKind = 'concave-mirror' | 'convex-mirror' | 'convex-lens' | 'concave-lens'

export const isMirror = (kind: ElementKind): boolean => kind.endsWith('mirror')
export const isConverging = (kind: ElementKind): boolean => kind === 'concave-mirror' || kind === 'convex-lens'

export type ImageSolution = {
  /** Signed image distance (cm). ±Infinity when the object is at F. */
  v: number
  /** Magnification (signed). ±Infinity when the object is at F. */
  m: number
  atInfinity: boolean
  virtual: boolean
}

/** Signed focal length for a given element kind and focal-length magnitude. */
export function signedFocalLength(kind: ElementKind, fMag: number): number {
  switch (kind) {
    case 'concave-mirror':
      return -fMag
    case 'convex-mirror':
      return fMag
    case 'convex-lens':
      return fMag
    case 'concave-lens':
      return -fMag
  }
}

/** Mirror formula 1/v + 1/u = 1/f, m = −v/u. u must be negative. */
export function mirrorImage(u: number, f: number): ImageSolution {
  const inv = 1 / f - 1 / u
  if (Math.abs(inv) < 1e-9) {
    return { v: -Infinity, m: Infinity, atInfinity: true, virtual: false }
  }
  const v = 1 / inv
  return { v, m: -v / u, atInfinity: false, virtual: v > 0 }
}

/** Lens formula 1/v − 1/u = 1/f, m = v/u. u must be negative. */
export function lensImage(u: number, f: number): ImageSolution {
  const inv = 1 / f + 1 / u
  if (Math.abs(inv) < 1e-9) {
    return { v: Infinity, m: Infinity, atInfinity: true, virtual: false }
  }
  const v = 1 / inv
  return { v, m: v / u, atInfinity: false, virtual: v < 0 }
}

export function imageFor(kind: ElementKind, u: number, fMag: number): ImageSolution {
  const f = signedFocalLength(kind, fMag)
  return isMirror(kind) ? mirrorImage(u, f) : lensImage(u, f)
}

/** Power of a lens in dioptres, f in cm. */
export const lensPowerDioptres = (fCm: number): number => 100 / fCm

/* ---------------- Dispersion ---------------- */

export type GlassId = 'crown' | 'flint' | 'water'

/** Cauchy coefficients n(λ) = A + B/λ², λ in nm. */
export const GLASSES: Record<GlassId, { label: string; A: number; B: number }> = {
  crown: { label: 'Crown glass (BK7)', A: 1.5046, B: 4200 },
  flint: { label: 'Flint glass (F2)', A: 1.5877, B: 9870 },
  water: { label: 'Water', A: 1.3252, B: 2850 },
}

/**
 * Refractive index from Cauchy's equation. `boost` multiplies the dispersive
 * term (B) so the spectrum can be exaggerated for visibility; boost = 1 is real.
 */
export function cauchyIndex(glass: GlassId, wavelengthNm: number, boost = 1): number {
  const { A, B } = GLASSES[glass]
  return A + (B * boost) / (wavelengthNm * wavelengthNm)
}

/** δ = i + e − A */
export const prismDeviationDeg = (iDeg: number, eDeg: number, apexDeg: number): number => iDeg + eDeg - apexDeg

/** Minimum deviation δmin = 2·asin(n·sin(A/2)) − A, or null if no ray can pass. */
export function prismMinDeviationDeg(n: number, apexDeg: number): number | null {
  const s = n * Math.sin(degToRad(apexDeg / 2))
  if (s >= 1) return null
  return 2 * radToDeg(Math.asin(s)) - apexDeg
}

/** Incidence angle giving minimum deviation: i = asin(n·sin(A/2)). */
export function prismIncidenceForMinDeviation(n: number, apexDeg: number): number | null {
  const s = n * Math.sin(degToRad(apexDeg / 2))
  if (s >= 1) return null
  return radToDeg(Math.asin(s))
}
