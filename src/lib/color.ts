/**
 * Approximate sRGB colour for a visible wavelength (nm). Piecewise linear
 * approximation (Bruton) with a brightness floor so violet and deep red stay
 * visible on a dark background.
 */
export function wavelengthToRGB(nm: number): string {
  let r = 0
  let g = 0
  let b = 0
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380)
    b = 1
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440)
    b = 1
  } else if (nm >= 490 && nm < 510) {
    g = 1
    b = -(nm - 510) / (510 - 490)
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510)
    g = 1
  } else if (nm >= 580 && nm < 645) {
    r = 1
    g = -(nm - 645) / (645 - 580)
  } else if (nm >= 645 && nm <= 780) {
    r = 1
  } else if (nm < 380) {
    r = 0.4
    b = 1
  } else {
    r = 1
  }
  let factor = 1
  if (nm >= 380 && nm < 420) factor = 0.45 + (0.55 * (nm - 380)) / (420 - 380)
  else if (nm > 700 && nm <= 780) factor = 0.45 + (0.55 * (780 - nm)) / (780 - 700)
  const gamma = 0.8
  const c = (v: number) => Math.round(255 * Math.pow(Math.max(0, v * factor), gamma))
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
}

/** Colour tokens shared by every diagram. */
export const RAY_COLORS = {
  incident: '#fde047',
  reflected: '#fb923c',
  refracted: '#22d3ee',
  normal: '#94a3b8',
  virtual: '#a78bfa',
  guide: '#64748b',
  parallel: '#fde047',
  focal: '#22d3ee',
  centre: '#f472b6',
  pole: '#a3e635',
  object: '#34d399',
  realImage: '#fb7185',
  virtualImage: '#c084fc',
  glass: '#7dd3fc',
} as const

export const ZONE_COLORS = {
  'beyond-C': '#38bdf8',
  'at-C': '#f472b6',
  'between-C-F': '#fbbf24',
  'at-F': '#f87171',
  'inside-F': '#a78bfa',
  anywhere: '#a78bfa',
} as const
