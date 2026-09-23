import { useMemo, type ReactNode } from 'react'
import { ArrowFigure, AxisMarkers, DragHandle, Label, LensShape, MirrorShape, Ray, Stage, useStage } from '../../components/svg'
import { RAY_COLORS, ZONE_COLORS } from '../../lib/color'
import { clamp, fmtSigned, roundTo } from '../../lib/format'
import { clipRayToRect, type Vec2 } from '../../lib/geometry'
import { axisPoints, type RayRole, type ZoneId } from '../../lib/imaging'
import { isConverging, isMirror, type ElementKind, type ImageSolution } from '../../lib/optics'
import { toScreen, toWorld, worldBounds, type Viewport } from '../../lib/viewport'
import { KIND_TITLE } from './constants'
import { elementHalfHeightPx, H_MIN, H_STEP, hMaxFor, snapU, U_STEP, uMaxFor, useImaging, type ImagingResult } from './useImaging'

export type ImagingDiagramProps = {
  kind: ElementKind
  fMag: number
  uMag: number
  h: number
  viewport: Viewport
  roles: RayRole[]
  showZones: boolean
  /** Object drag / keyboard nudge writes back the single source of truth. */
  onChange?: (uMag: number, h: number) => void
  /** Shorter labels for side-by-side use. */
  compact?: boolean
}

/**
 * Ray diagram for one spherical mirror or thin lens: element, axis markers,
 * construction rays from `constructionRays`, object (draggable) and image
 * arrows, off-stage / infinity indicators and the in-SVG zone ribbon.
 */
export function ImagingDiagram(props: ImagingDiagramProps) {
  const { kind, fMag, uMag, h, viewport, roles } = props
  const res = useImaging(kind, uMag, h, fMag, roles, viewport)
  const what = isMirror(kind) ? 'mirror' : 'lens'
  const imageText = res.image.atInfinity ? 'image at infinity' : `image ${fmtSigned(res.image.v, 1)} cm from the ${what}, magnification ${fmtSigned(res.image.m, 2)}`
  return (
    <Stage viewBox={{ w: viewport.w, h: viewport.h }} ariaLabel={`${KIND_TITLE[kind]} ray diagram. Object ${uMag} cm in front, height ${h} cm; ${imageText}.`}>
      <DiagramContent {...props} res={res} />
    </Stage>
  )
}

type ContentProps = ImagingDiagramProps & { res: ImagingResult }

function DiagramContent({ kind, fMag, uMag, h, viewport, showZones, onChange, compact = false, res }: ContentProps) {
  const { unitsPerPx: px } = useStage()
  const mirror = isMirror(kind)
  const S = (p: Vec2): Vec2 => toScreen(viewport, p)
  const bounds = worldBounds(viewport)
  const half = elementHalfHeightPx(viewport)
  const uMax = uMaxFor(viewport)
  const hMax = hMaxFor(viewport)
  const origin = S({ x: 0, y: 0 })
  const objTip = S({ x: res.u, y: h })
  const objBase = S({ x: res.u, y: 0 })
  const { image, imageTip, imageBase } = res

  const points = useMemo(
    () =>
      axisPoints(kind, fMag)
        .map((p) => ({ label: p.label, x: viewport.cx + viewport.scale * p.x, behind: p.behind }))
        .filter((p) => p.x >= 0 && p.x <= viewport.w),
    [kind, fMag, viewport],
  )

  const onDrag = (p: Vec2) => {
    if (!onChange) return
    const w = toWorld(viewport, p)
    onChange(snapU(-w.x, fMag, uMax), clamp(roundTo(w.y, H_STEP), H_MIN, hMax))
  }
  const onNudge = (dir: -1 | 1, big: boolean) => {
    if (!onChange) return
    // Right / Up moves the object toward the element, i.e. |u| decreases.
    onChange(snapU(uMag - dir * (big ? 2 : U_STEP), fMag, uMax), h)
  }

  // Where the image sits relative to the visible world.
  const margin = 1 // cm
  const offX: 'left' | 'right' | null = imageTip ? (imageTip.x < bounds.xMin + margin ? 'left' : imageTip.x > bounds.xMax - margin ? 'right' : null) : null
  const offY = !!imageTip && !offX && Math.abs(imageTip.y) > bounds.yMax - margin
  const exitSide: 'left' | 'right' = mirror ? 'left' : 'right'

  // Outgoing ray end points (screen) and, for the infinity label, their mean exit height.
  const outgoing = useMemo(() => {
    const ends = res.rays.map((r) => ({ role: r.role, end: clipRayToRect(r.outgoing, bounds) }))
    const edgeX = exitSide === 'left' ? bounds.xMin : bounds.xMax
    const pts = ends.map((e) => e.end).filter((p): p is Vec2 => !!p)
    const onEdge = pts.filter((p) => Math.abs(p.x - edgeX) < 1e-6)
    const use = onEdge.length ? onEdge : pts
    const meanY = use.length ? use.reduce((a, p) => a + p.y, 0) / use.length : 4
    return { ends, meanY }
  }, [res.rays, bounds, exitSide])

  const imageColor = image.virtual ? RAY_COLORS.virtualImage : RAY_COLORS.realImage
  const imageLabel = compact ? (image.virtual ? 'Virtual image' : 'Real image') : image.virtual ? 'Image (virtual)' : 'Image (real)'

  return (
    <g>
      {showZones && <ZoneRibbons kind={kind} fMag={fMag} zone={res.zone} image={image} viewport={viewport} compact={compact} />}

      <AxisMarkers y={viewport.cy} x1={0} x2={viewport.w} points={points} labelBelow={false} />

      {mirror ? (
        <MirrorShape kind={kind === 'concave-mirror' ? 'concave' : 'convex'} pole={origin} halfHeight={half} />
      ) : (
        <LensShape kind={kind === 'convex-lens' ? 'convex' : 'concave'} centre={origin} halfHeight={half} />
      )}
      <Label x={origin.x} y={Math.max(origin.y - half - 14 * px, 12 * px)} text={KIND_TITLE[kind]} color="#cbd5e1" sizePx={12} weight={700} bg />

      {/* Construction rays: guides and virtual extensions first, real light on top. */}
      {res.rays.map((r, i) => {
        const color = RAY_COLORS[r.role]
        const end = outgoing.ends[i]?.end ?? null
        return (
          <g key={r.role}>
            {r.preGuide && <Ray from={S(r.preGuide.a)} to={S(r.preGuide.b)} color={color} variant="guide" />}
            {r.aimGuide && <Ray from={S(r.aimGuide.a)} to={S(r.aimGuide.b)} color={color} variant="guide" />}
            {r.virtualExtension && <Ray from={S(r.virtualExtension.b)} to={S(r.virtualExtension.a)} color={color} variant="virtual" />}
            <Ray from={S(r.incident.a)} to={S(r.incident.b)} color={color} arrowhead />
            {end && <Ray from={S(r.hit)} to={S(end)} color={color} arrowhead />}
          </g>
        )
      })}

      {/* Object */}
      <ArrowFigure base={objBase} tip={objTip} color={RAY_COLORS.object} />

      {/* Image */}
      {imageTip && imageBase && <ArrowFigure base={S(imageBase)} tip={S(imageTip)} color={imageColor} dashed={image.virtual} label={offX ? undefined : imageLabel} />}
      {imageTip && offX && (
        <EdgeNote
          side={offX}
          y={S(imageTip).y}
          color={imageColor}
          viewport={viewport}
          text={`${compact ? '' : 'image at '}v = ${fmtSigned(image.v, 0)} cm${image.virtual ? ' (virtual)' : ''}`}
        />
      )}
      {imageTip && offY && (
        <Label
          x={clamp(S(imageTip).x, 60 * px, viewport.w - 60 * px)}
          y={imageTip.y > 0 ? 16 * px : viewport.h - 16 * px}
          text={`${imageLabel}: h′ = ${fmtSigned(res.hPrime, 1)} cm ${imageTip.y > 0 ? '↑' : '↓'}`}
          color={imageColor}
          sizePx={11}
          weight={600}
          bg
        />
      )}
      {image.atInfinity && (
        <g>
          <EdgeNote side={exitSide} y={S({ x: 0, y: outgoing.meanY }).y} color={RAY_COLORS.realImage} viewport={viewport} text="image at ∞" />
          <Label
            x={exitSide === 'left' ? 24 * px : viewport.w - 24 * px}
            y={clamp(S({ x: 0, y: outgoing.meanY }).y, 30 * px, viewport.h - 30 * px) + 18 * px}
            text="outgoing rays are parallel"
            color="#cbd5e1"
            sizePx={10}
            anchor={exitSide === 'left' ? 'start' : 'end'}
            bg
          />
        </g>
      )}

      {/* Object tip handle (on top of everything) */}
      <DragHandle
        pos={objTip}
        onDrag={onChange ? onDrag : () => {}}
        onNudge={onChange ? onNudge : undefined}
        color={RAY_COLORS.object}
        ariaLabel={`Object tip: ${uMag} cm in front of the ${mirror ? 'mirror' : 'lens'}, ${h} cm tall. Arrow keys move the object.`}
        label="Object"
        labelOffset={{ x: 0, y: -22 * px }}
      />
    </g>
  )
}

/** Chevron + label pinned to the left or right stage edge. */
function EdgeNote({ side, y, text, color, viewport }: { side: 'left' | 'right'; y: number; text: string; color: string; viewport: Viewport }) {
  const { unitsPerPx: px } = useStage()
  const pad = 10 * px
  const c = 7 * px
  const x = side === 'left' ? pad : viewport.w - pad
  const yy = clamp(y, 30 * px, viewport.h - 30 * px)
  const pts = side === 'left' ? `${x + c},${yy - c} ${x},${yy} ${x + c},${yy + c}` : `${x - c},${yy - c} ${x},${yy} ${x - c},${yy + c}`
  const lx = side === 'left' ? x + c + 8 * px : x - c - 8 * px
  return (
    <g>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.2 * px} strokeLinecap="round" strokeLinejoin="round" />
      <Label x={lx} y={yy} text={text} color={color} anchor={side === 'left' ? 'start' : 'end'} sizePx={11} weight={600} bg />
    </g>
  )
}

/**
 * Zone ribbon hugging the axis: row 1 (object side) segmented at C / F / P,
 * row 2 the region where the image can be, in the active zone's colour.
 */
function ZoneRibbons({ kind, fMag, zone, image, viewport, compact }: { kind: ElementKind; fMag: number; zone: ZoneId; image: ImageSolution; viewport: Viewport; compact: boolean }) {
  const { unitsPerPx: px } = useStage()
  const mirror = isMirror(kind)
  const converging = isConverging(kind)
  const bounds = worldBounds(viewport)
  const sx = (x: number) => viewport.cx + viewport.scale * x
  const y0 = viewport.cy + 7 * px
  const h0 = 12 * px
  const y1 = y0 + h0 + 3 * px
  const h1 = 7 * px
  const xC = sx(-2 * fMag)
  const xF = sx(-fMag)
  const xP = viewport.cx
  const f = fMag

  const band = (key: string, xa: number, xb: number, color: string, active: boolean, y: number, hh: number) => {
    const a = Math.max(0, Math.min(xa, xb))
    const b = Math.min(viewport.w, Math.max(xa, xb))
    if (b - a < 0.5) return null
    return <rect key={key} x={a} y={y} width={b - a} height={hh} fill={color} opacity={active ? 0.9 : 0.25} rx={1.5 * px} />
  }
  const marker = (key: string, x: number, color: string, active: boolean, y: number, hh: number) => {
    if (x < 0 || x > viewport.w) return null
    const w = 6 * px
    return <rect key={key} x={x - w / 2} y={y - 2 * px} width={w} height={hh + 4 * px} fill={color} opacity={active ? 1 : 0.35} rx={1.5 * px} />
  }

  const objectRow = converging
    ? [
        band('beyond-C', 0, xC, ZONE_COLORS['beyond-C'], zone === 'beyond-C', y0, h0),
        band('between-C-F', xC, xF, ZONE_COLORS['between-C-F'], zone === 'between-C-F', y0, h0),
        band('inside-F', xF, xP, ZONE_COLORS['inside-F'], zone === 'inside-F', y0, h0),
        marker('at-C', xC, ZONE_COLORS['at-C'], zone === 'at-C', y0, h0),
        marker('at-F', xF, ZONE_COLORS['at-F'], zone === 'at-F', y0, h0),
      ]
    : [band('anywhere', 0, xP, ZONE_COLORS.anywhere, true, y0, h0)]

  // Image-side span in world cm.
  const color = ZONE_COLORS[zone]
  let span: [number, number] | null = null
  let markerAt: number | null = null
  let toInfinity = false
  switch (zone) {
    case 'beyond-C':
      span = mirror ? [-2 * f, -f] : [f, 2 * f]
      break
    case 'at-C':
      markerAt = mirror ? -2 * f : 2 * f
      break
    case 'between-C-F':
      span = mirror ? [bounds.xMin, -2 * f] : [2 * f, bounds.xMax]
      break
    case 'at-F':
      toInfinity = true
      break
    case 'inside-F':
      span = image.atInfinity ? null : mirror ? [0, image.v] : [image.v, 0]
      break
    case 'anywhere':
      span = mirror ? [0, f] : [-f, 0]
      break
  }

  const imageRow: ReactNode[] = []
  if (span) {
    const a = sx(span[0])
    const b = sx(span[1])
    imageRow.push(band('image', a, b, color, true, y1, h1))
    const width = Math.min(viewport.w, Math.max(a, b)) - Math.max(0, Math.min(a, b))
    if (!compact && width > 44 * px) {
      imageRow.push(<Label key="image-tag" x={(Math.max(0, Math.min(a, b)) + Math.min(viewport.w, Math.max(a, b))) / 2} y={y1 + h1 + 8 * px} text="image" color={color} sizePx={9} weight={700} />)
    }
  }
  if (markerAt !== null) imageRow.push(marker('image-marker', sx(markerAt), color, true, y1, h1))
  if (toInfinity) {
    const side: 'left' | 'right' = mirror ? 'left' : 'right'
    const x = side === 'left' ? 6 * px : viewport.w - 6 * px
    const c = 5 * px
    const yc = y1 + h1 / 2
    const pts = side === 'left' ? `${x + c},${yc - c} ${x},${yc} ${x + c},${yc + c}` : `${x - c},${yc - c} ${x},${yc} ${x - c},${yc + c}`
    imageRow.push(<polyline key="inf-chevron" points={pts} fill="none" stroke={color} strokeWidth={2 * px} strokeLinecap="round" strokeLinejoin="round" />)
    imageRow.push(<Label key="inf-label" x={side === 'left' ? x + c + 10 * px : x - c - 10 * px} y={yc} text="image → ∞" color={color} sizePx={10} weight={700} anchor={side === 'left' ? 'start' : 'end'} />)
    // A fading band from the element toward the exit edge.
    imageRow.push(
      <rect
        key="inf-band"
        x={side === 'left' ? 0 : xP}
        y={y1}
        width={side === 'left' ? xP : viewport.w - xP}
        height={h1}
        fill={color}
        opacity={0.18}
        rx={1.5 * px}
      />,
    )
  }

  return (
    <g aria-hidden>
      {objectRow}
      {imageRow}
    </g>
  )
}
