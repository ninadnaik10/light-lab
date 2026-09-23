import type { ZoneId } from '../lib/imaging'
import type { ElementKind } from '../lib/optics'

/** One row of the Class-10 image summary table, plus what the zone UI needs. */
export type ZoneRow = {
  zone: ZoneId
  /** Headline for the badge, e.g. "Object between C and F" */
  headline: string
  /** Short label for the clickable zone bar */
  short: string
  objectText: string
  imageText: string
  nature: string
  orientation: string
  size: string
  /** Click on the zone bar sets |u| = factor · |f| */
  representativeUFactor: number
}

export type InfinityRow = Pick<ZoneRow, 'objectText' | 'imageText' | 'nature' | 'orientation' | 'size'>

export const ZONES: Record<ElementKind, ZoneRow[]> = {
  'concave-mirror': [
    { zone: 'beyond-C', headline: 'Object beyond C', short: 'Beyond C', objectText: 'Beyond C', imageText: 'Between F and C', nature: 'Real', orientation: 'Inverted', size: 'Diminished', representativeUFactor: 3 },
    { zone: 'at-C', headline: 'Object at C', short: 'At C', objectText: 'At C', imageText: 'At C', nature: 'Real', orientation: 'Inverted', size: 'Same size', representativeUFactor: 2 },
    { zone: 'between-C-F', headline: 'Object between C and F', short: 'Between C and F', objectText: 'Between C and F', imageText: 'Beyond C', nature: 'Real', orientation: 'Inverted', size: 'Magnified', representativeUFactor: 1.5 },
    { zone: 'at-F', headline: 'Object at F', short: 'At F', objectText: 'At F', imageText: 'At infinity', nature: 'Real', orientation: 'Inverted', size: 'Highly magnified', representativeUFactor: 1 },
    { zone: 'inside-F', headline: 'Object between P and F', short: 'Between P and F', objectText: 'Between P and F', imageText: 'Behind the mirror', nature: 'Virtual', orientation: 'Erect', size: 'Magnified', representativeUFactor: 0.5 },
  ],
  'convex-mirror': [
    {
      zone: 'anywhere',
      headline: 'Object anywhere in front of the mirror',
      short: 'Anywhere in front',
      objectText: 'Anywhere between P and infinity',
      imageText: 'Between P and F, behind the mirror',
      nature: 'Virtual',
      orientation: 'Erect',
      size: 'Diminished',
      representativeUFactor: 2,
    },
  ],
  'convex-lens': [
    { zone: 'beyond-C', headline: 'Object beyond 2F₁', short: 'Beyond 2F₁', objectText: 'Beyond 2F₁', imageText: 'Between F₂ and 2F₂', nature: 'Real', orientation: 'Inverted', size: 'Diminished', representativeUFactor: 3 },
    { zone: 'at-C', headline: 'Object at 2F₁', short: 'At 2F₁', objectText: 'At 2F₁', imageText: 'At 2F₂', nature: 'Real', orientation: 'Inverted', size: 'Same size', representativeUFactor: 2 },
    { zone: 'between-C-F', headline: 'Object between F₁ and 2F₁', short: 'Between F₁ and 2F₁', objectText: 'Between F₁ and 2F₁', imageText: 'Beyond 2F₂', nature: 'Real', orientation: 'Inverted', size: 'Magnified', representativeUFactor: 1.5 },
    { zone: 'at-F', headline: 'Object at F₁', short: 'At F₁', objectText: 'At F₁', imageText: 'At infinity', nature: 'Real', orientation: 'Inverted', size: 'Highly magnified', representativeUFactor: 1 },
    { zone: 'inside-F', headline: 'Object between O and F₁', short: 'Between O and F₁', objectText: 'Between O and F₁', imageText: 'On the same side as the object', nature: 'Virtual', orientation: 'Erect', size: 'Magnified', representativeUFactor: 0.5 },
  ],
  'concave-lens': [
    {
      zone: 'anywhere',
      headline: 'Object anywhere in front of the lens',
      short: 'Anywhere in front',
      objectText: 'Anywhere between O and infinity',
      imageText: 'Between O and F₁, same side as the object',
      nature: 'Virtual',
      orientation: 'Erect',
      size: 'Diminished',
      representativeUFactor: 2,
    },
  ],
}

/** The "object at infinity" row that textbooks list first. Not reachable by dragging. */
export const INFINITY_ROW: Record<ElementKind, InfinityRow> = {
  'concave-mirror': { objectText: 'At infinity', imageText: 'At F', nature: 'Real', orientation: 'Inverted', size: 'Highly diminished, point-sized' },
  'convex-mirror': { objectText: 'At infinity', imageText: 'At F, behind the mirror', nature: 'Virtual', orientation: 'Erect', size: 'Highly diminished, point-sized' },
  'convex-lens': { objectText: 'At infinity', imageText: 'At F₂', nature: 'Real', orientation: 'Inverted', size: 'Highly diminished, point-sized' },
  'concave-lens': { objectText: 'At infinity', imageText: 'At F₁, same side as the object', nature: 'Virtual', orientation: 'Erect', size: 'Highly diminished, point-sized' },
}

/** Row for a zone of the given element (falls back to the first row). */
export function zoneRow(kind: ElementKind, zone: ZoneId): ZoneRow {
  return ZONES[kind].find((r) => r.zone === zone) ?? ZONES[kind][0]
}
