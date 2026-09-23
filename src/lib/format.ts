/** Formatting helpers for live readouts. */

const clean = (s: string) => (s === '-0' || /^-0\.0+$/.test(s) ? s.slice(1) : s)

export function fmt(x: number, digits = 2): string {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—'
  return clean(x.toFixed(digits)).replace('-', '−')
}

/** Always shows a sign: +12.0 / −12.0 */
export function fmtSigned(x: number, digits = 1): string {
  if (!isFinite(x)) return x > 0 ? '+∞' : x < 0 ? '−∞' : '—'
  const s = clean(Math.abs(x).toFixed(digits))
  const neg = x < 0 && Number(s) !== 0
  return (neg ? '−' : '+') + s
}

export function fmtDeg(x: number, digits = 1): string {
  return fmt(x, digits) + '°'
}

/** Wrap a negative number in parentheses for formulas: 1/(−15.0) */
export function fmtParen(x: number, digits = 1): string {
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞'
  return x < 0 ? `(${fmt(x, digits)})` : fmt(x, digits)
}

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

export const roundTo = (x: number, step: number): number => Math.round(x / step) * step
