import { useEffect, useId, useState } from 'react'
import { clamp } from '../../lib/format'

export type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
  /** Custom display of the value (default: fixed decimals from step). */
  format?: (v: number) => string
  disabled?: boolean
  hint?: string
}

const decimalsOf = (step: number) => Math.max(0, Math.min(4, Math.ceil(-Math.log10(step))))

/** Labelled range slider with a synced number input. */
export function Slider({ label, value, min, max, step, onChange, unit, format, disabled, hint }: SliderProps) {
  const id = useId()
  const decimals = decimalsOf(step)
  const [text, setText] = useState(value.toFixed(decimals))
  useEffect(() => setText(value.toFixed(decimals)), [value, decimals])
  const commit = () => {
    const n = parseFloat(text)
    if (!isNaN(n)) onChange(clamp(n, min, max))
    else setText(value.toFixed(decimals))
  }
  return (
    <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-1 font-mono text-sm text-slate-100">
          {format ? (
            <span>{format(value)}</span>
          ) : (
            <input
              type="number"
              className="w-20 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right text-sm tabular-nums outline-none focus:border-cyan-500"
              value={text}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              aria-label={`${label} value`}
            />
          )}
          {unit && <span className="text-slate-400">{unit}</span>}
        </div>
      </div>
      <input id={id} type="range" className="w-full" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(parseFloat(e.target.value))} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
