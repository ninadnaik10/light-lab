/**
 * Small helpers shared by the Refraction and TIR sections.
 */
import { MEDIA } from '../../data/media'
import { speedInMedium } from '../../lib/optics'

/** Angle-of-incidence range used by every control that writes `iDeg`. */
export const I_MIN = 0
export const I_MAX = 89.9

/** Refractive-index slider range. */
export const N_MIN = 1.0
export const N_MAX = 2.5

export const MEDIUM_PRESETS = MEDIA.map((m) => ({ label: m.label, value: m.n }))

/** 1.0003 for near-vacuum values, otherwise three decimals (matches MediumRegion). */
export const fmtIndex = (n: number): string => n.toFixed(n < 1.01 ? 4 : 3)

/** "2.25 × 10⁸ m/s" */
export const fmtSpeed = (n: number): string => `${(speedInMedium(n) / 1e8).toFixed(2)} × 10⁸ m/s`

/**
 * Name of the closest preset (within tol), else "Custom". Unlike the shared
 * `mediumLabelFor` this picks the nearest preset, so 1.0003 reads "Air", not "Vacuum".
 */
export function mediumName(n: number, tol = 0.0015): string {
  let best: { label: string; d: number } | null = null
  for (const m of MEDIA) {
    const d = Math.abs(m.n - n)
    if (d <= tol && (!best || d < best.d)) best = { label: m.label, d }
  }
  return best ? best.label : 'Custom'
}
