import { useMemo } from 'react'
import { clamp, roundTo } from '../../lib/format'
import { classifyZone, constructionRays, natureFor, type ConstructionResult, type ImageNature, type RayRole, type ZoneId } from '../../lib/imaging'
import type { ElementKind } from '../../lib/optics'
import type { Viewport } from '../../lib/viewport'

/** Tolerance (cm) for "at F" / "at C": half the slider step. */
export const ZONE_TOL = 0.25
export const U_STEP = 0.5
export const H_STEP = 0.5
export const U_MIN = 1
export const H_MIN = 0.5
/** The element spans ±42% of the stage height. */
export const ELEMENT_HALF_FRACTION = 0.42

/** Element half-height in viewBox units. */
export const elementHalfHeightPx = (vp: Viewport): number => ELEMENT_HALF_FRACTION * vp.h
/** Element half-height in world cm (what `constructionRays` wants). */
export const elementHalfHeightCm = (vp: Viewport): number => elementHalfHeightPx(vp) / vp.scale
/** Largest |u| that keeps the object ≥ 30 viewBox units from the left edge. */
export const uMaxFor = (vp: Viewport): number => (vp.cx - 30) / vp.scale
/** Largest object height: 80% of the element half-height, on the h step. */
export const hMaxFor = (vp: Viewport): number => Math.floor((0.8 * elementHalfHeightCm(vp)) / H_STEP) * H_STEP

/** Round |u| to the step, clamp, and snap to F / C (2F) when within the zone tolerance. */
export function snapU(raw: number, fMag: number, uMax: number): number {
  let u = clamp(roundTo(raw, U_STEP), U_MIN, uMax)
  if (Math.abs(u - fMag) <= ZONE_TOL) u = fMag
  else if (Math.abs(u - 2 * fMag) <= ZONE_TOL) u = 2 * fMag
  return clamp(u, U_MIN, uMax)
}

export type ImagingResult = ConstructionResult & {
  kind: ElementKind
  /** Signed object distance (negative). */
  u: number
  h: number
  /** Signed image height m·h (±Infinity at infinity). */
  hPrime: number
  zone: ZoneId
  nature: ImageNature
  /** World cm */
  elementHalfHeight: number
}

export function computeImaging(kind: ElementKind, uMag: number, h: number, fMag: number, roles: RayRole[], viewport: Viewport): ImagingResult {
  const u = -uMag
  const elementHalfHeight = elementHalfHeightCm(viewport)
  const res = constructionRays(kind, u, h, fMag, { roles, elementHalfHeight })
  const zone = classifyZone(kind, u, fMag, ZONE_TOL)
  return { ...res, kind, u, h, hPrime: res.image.m * h, zone, nature: natureFor(kind, zone), elementHalfHeight }
}

/** Memoised construction-ray geometry + zone classification for one element. */
export function useImaging(kind: ElementKind, uMag: number, h: number, fMag: number, roles: RayRole[], viewport: Viewport): ImagingResult {
  const rolesKey = roles.join('|')
  return useMemo(
    () => computeImaging(kind, uMag, h, fMag, rolesKey ? (rolesKey.split('|') as RayRole[]) : [], viewport),
    [kind, uMag, h, fMag, rolesKey, viewport],
  )
}

/** Why a requested ray is not drawn, for tooltips. */
export function droppedReason(role: RayRole, res: ImagingResult): string {
  const what = res.kind.endsWith('mirror') ? 'mirror' : 'lens'
  if (role === 'focal' && res.image.atInfinity) return 'Focal ray cannot be drawn: the object is at F, so this ray would run along the axis'
  if (role === 'centre' && res.zone === 'at-C' && what === 'mirror') return 'Centre ray cannot be drawn: the object tip is above C, so this ray is vertical'
  return `Would miss the ${what} for this object position`
}
