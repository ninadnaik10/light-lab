import { ZONES } from '../../data/zones'
import { ZONE_COLORS } from '../../lib/color'
import { clamp } from '../../lib/format'
import { classifyZone, type ZoneId } from '../../lib/imaging'
import type { ElementKind } from '../../lib/optics'
import { U_MIN, ZONE_TOL } from './useImaging'

export type ZoneBarProps = {
  kind: ElementKind
  fMag: number
  zone: ZoneId
  uMax: number
  /** Called with the representative |u| factor; the section sets |u| = factor · |f|. */
  onSelect: (factor: number) => void
}

/** Clickable row of object zones. The active zone is lifted and ringed in its colour. */
export function ZoneBar({ kind, fMag, zone, uMax, onSelect }: ZoneBarProps) {
  const rows = ZONES[kind]
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Object zones">
      {rows.map((row) => {
        const color = ZONE_COLORS[row.zone]
        const active = row.zone === zone
        const target = clamp(row.representativeUFactor * fMag, U_MIN, uMax)
        const reachable = row.zone === 'anywhere' || classifyZone(kind, -target, fMag, ZONE_TOL) === row.zone
        return (
          <button
            key={row.zone}
            type="button"
            onClick={() => onSelect(row.representativeUFactor)}
            disabled={!reachable}
            aria-pressed={active}
            title={reachable ? `Move the object ${row.objectText.toLowerCase()} (|u| = ${row.representativeUFactor}|f|)` : 'Off the stage for this focal length. Reduce |f| to reach this zone.'}
            className={`flex min-w-[6.5rem] flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
              active ? '-translate-y-0.5 text-slate-50 shadow-lg' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
            }`}
            style={active ? { borderColor: color, backgroundColor: `${color}22`, boxShadow: `0 0 0 2px ${color}, 0 6px 16px -6px ${color}` } : undefined}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
            <span>{row.short}</span>
          </button>
        )
      })}
    </div>
  )
}
