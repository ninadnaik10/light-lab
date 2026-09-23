export type Medium = { id: string; label: string; n: number }

/** Refractive index presets (at ~589 nm). */
export const MEDIA: Medium[] = [
  { id: 'vacuum', label: 'Vacuum', n: 1.0 },
  { id: 'air', label: 'Air', n: 1.0003 },
  { id: 'ice', label: 'Ice', n: 1.31 },
  { id: 'water', label: 'Water', n: 1.333 },
  { id: 'glycerin', label: 'Glycerin', n: 1.473 },
  { id: 'crown', label: 'Crown glass', n: 1.52 },
  { id: 'flint', label: 'Flint glass', n: 1.62 },
  { id: 'diamond', label: 'Diamond', n: 2.417 },
]

/** Name of the closest preset (within tol) or a generic label. */
export function mediumLabelFor(n: number, tol = 0.0015): string {
  const hit = MEDIA.find((m) => Math.abs(m.n - n) <= tol)
  return hit ? hit.label : `Custom (n = ${n.toFixed(2)})`
}
