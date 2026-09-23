import { Badge, type BadgeTone } from '../../components/ui'
import { zoneRow } from '../../data/zones'
import { ZONE_COLORS } from '../../lib/color'
import { fmt } from '../../lib/format'
import { natureFor, type ZoneId } from '../../lib/imaging'
import type { ElementKind, ImageSolution } from '../../lib/optics'

export type ZoneBadgeProps = {
  kind: ElementKind
  zone: ZoneId
  image: ImageSolution
  size?: 'sm' | 'md'
}

/** Headline "Object between C and F" in the zone colour + nature chips + location sentence. */
export function ZoneBadge({ kind, zone, image, size = 'md' }: ZoneBadgeProps) {
  const row = zoneRow(kind, zone)
  const color = ZONE_COLORS[zone]
  const nature = natureFor(kind, zone)
  const chips: { tone: BadgeTone; text: string }[] = []
  if (nature.real === null) {
    chips.push({ tone: 'neutral', text: 'At infinity' })
  } else {
    chips.push(nature.real ? { tone: 'danger', text: 'Real' } : { tone: 'violet', text: 'Virtual' })
    chips.push(nature.erect ? { tone: 'ok', text: 'Erect' } : { tone: 'warn', text: 'Inverted' })
    const am = Math.abs(image.m)
    const sizeText = nature.size === 'same' ? 'Same size' : nature.size === 'magnified' ? `Magnified ×${fmt(am, 2)}` : `Diminished ×${fmt(am, 2)}`
    chips.push({ tone: 'info', text: sizeText })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
        <span className={`${size === 'sm' ? 'text-sm' : 'text-base'} font-semibold`} style={{ color }}>
          {row.headline}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <Badge key={c.text} tone={c.tone} size={size === 'sm' ? 'sm' : 'md'}>
            {c.text}
          </Badge>
        ))}
      </div>
      <p className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-300`}>
        {nature.real === null ? 'Image at infinity: the outgoing rays are parallel and never meet.' : `Image forms ${nature.locationText}.`}
      </p>
    </div>
  )
}
