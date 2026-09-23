import { INFINITY_ROW, ZONES } from '../../data/zones'
import { ZONE_COLORS } from '../../lib/color'
import type { ZoneId } from '../../lib/imaging'
import type { ElementKind } from '../../lib/optics'

export type ImageSummaryTableProps = {
  kind: ElementKind
  zone: ZoneId
  /** Optional: clicking a row moves the object to that zone (factor · |f|). */
  onSelect?: (factor: number) => void
}

const cell = 'py-1.5 pr-2 align-top'

/** The full Class-10 reference table with the current row highlighted. */
export function ImageSummaryTable({ kind, zone, onSelect }: ImageSummaryTableProps) {
  const rows = ZONES[kind]
  const inf = INFINITY_ROW[kind]
  return (
    <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
      <colgroup>
        <col className="w-[30%] sm:w-[22%]" />
        <col className="w-[36%] sm:w-[28%]" />
        <col className="w-[34%] sm:w-[16%]" />
        <col className="hidden sm:table-column sm:w-[16%]" />
        <col className="hidden sm:table-column sm:w-[18%]" />
      </colgroup>
      <thead>
        <tr className="text-[11px] uppercase tracking-wide text-slate-500">
          <th className="pb-2 pl-2 pr-2 font-semibold">Object position</th>
          <th className="pb-2 pr-2 font-semibold">Image position</th>
          <th className="pb-2 pr-2 font-semibold">Nature</th>
          <th className="hidden pb-2 pr-2 font-semibold sm:table-cell">Orientation</th>
          <th className="hidden pb-2 pr-2 font-semibold sm:table-cell">Size</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/70">
        <tr className="text-slate-500">
          <td className={`${cell} border-l-[3px] border-transparent pl-2`}>{inf.objectText}</td>
          <td className={cell}>{inf.imageText}</td>
          <td className={cell}>
            {inf.nature}
            <span className="sm:hidden">
              {' · '}
              {inf.orientation} · {inf.size}
            </span>
          </td>
          <td className={`${cell} hidden sm:table-cell`}>{inf.orientation}</td>
          <td className={`${cell} hidden sm:table-cell`}>{inf.size}</td>
        </tr>
        {rows.map((r) => {
          const active = r.zone === zone
          const color = ZONE_COLORS[r.zone]
          return (
            <tr
              key={r.zone}
              onClick={onSelect ? () => onSelect(r.representativeUFactor) : undefined}
              className={`${onSelect ? 'cursor-pointer hover:bg-slate-800/40' : ''} ${active ? 'bg-slate-800/60 font-medium text-slate-50' : 'text-slate-300'}`}
              aria-current={active ? 'true' : undefined}
            >
              <td className={`${cell} border-l-[3px] pl-2`} style={{ borderLeftColor: active ? color : 'transparent' }}>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                {r.objectText}
              </td>
              <td className={cell}>{r.imageText}</td>
              <td className={cell}>
                {r.nature}
                <span className="sm:hidden">
                  {' · '}
                  {r.orientation} · {r.size}
                </span>
              </td>
              <td className={`${cell} hidden sm:table-cell`}>{r.orientation}</td>
              <td className={`${cell} hidden sm:table-cell`}>{r.size}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
