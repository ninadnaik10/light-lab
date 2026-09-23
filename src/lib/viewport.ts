import type { Rect, Vec2 } from './geometry'

/**
 * Maps world coordinates (cm, New Cartesian, y-up, origin at the pole /
 * optical centre) to SVG viewBox coordinates (y-down).
 */
export type Viewport = {
  /** viewBox x of the world origin */
  cx: number
  /** viewBox y of the principal axis */
  cy: number
  /** viewBox units per cm */
  scale: number
  /** viewBox width and height */
  w: number
  h: number
}

export const toScreen = (vp: Viewport, p: Vec2): Vec2 => ({ x: vp.cx + vp.scale * p.x, y: vp.cy - vp.scale * p.y })
export const toWorld = (vp: Viewport, p: Vec2): Vec2 => ({ x: (p.x - vp.cx) / vp.scale, y: (vp.cy - p.y) / vp.scale })

/** The visible world rectangle for a viewport. */
export function worldBounds(vp: Viewport): Rect {
  return {
    xMin: -vp.cx / vp.scale,
    xMax: (vp.w - vp.cx) / vp.scale,
    yMin: -(vp.h - vp.cy) / vp.scale,
    yMax: vp.cy / vp.scale,
  }
}

/** Default viewports used by the imaging sections. */
export const MIRROR_VIEWPORT: Viewport = { cx: 600, cy: 240, scale: 10, w: 900, h: 480 }
export const LENS_VIEWPORT: Viewport = { cx: 450, cy: 240, scale: 10, w: 900, h: 480 }
