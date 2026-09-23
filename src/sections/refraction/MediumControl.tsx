import { PresetChips, Slider } from '../../components/ui'
import { fmtSpeed, MEDIUM_PRESETS, mediumName, N_MAX, N_MIN } from './shared'

/** Preset chips + index slider for one medium. */
export function MediumControl({ title, subscript, n, onChange }: { title: string; subscript: string; n: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <PresetChips options={MEDIUM_PRESETS} value={n} onSelect={onChange} tolerance={0.0001} ariaLabel={`${title} presets`} />
      <Slider label={`n${subscript}`} value={n} min={N_MIN} max={N_MAX} step={0.01} onChange={onChange} hint={`${mediumName(n)} · light travels at ${fmtSpeed(n)}`} />
    </div>
  )
}
