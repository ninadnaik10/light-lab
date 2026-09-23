import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Card, FormulaCard, Legend, QuizCard, Readout, ReadoutGrid, SectionLayout, Segmented, Slider, Toggle, type LegendItem } from '../../components/ui'
import { RAY_COLORS } from '../../lib/color'
import { clamp, fmtSigned } from '../../lib/format'
import type { RayRole } from '../../lib/imaging'
import { isConverging, isMirror, lensPowerDioptres, type ElementKind } from '../../lib/optics'
import { LENS_VIEWPORT, MIRROR_VIEWPORT, type Viewport } from '../../lib/viewport'
import { KIND_TITLE, ROLE_LABEL, roleHint } from './constants'
import { ImageSummaryTable } from './ImageSummaryTable'
import { ImagingDiagram } from './ImagingDiagram'
import { makeImagingQuiz } from './quiz'
import { droppedReason, H_MIN, H_STEP, hMaxFor, U_MIN, U_STEP, uMaxFor, useImaging, type ImagingResult } from './useImaging'
import { ZoneBadge } from './ZoneBadge'
import { ZoneBar } from './ZoneBar'

export type Family = 'mirror' | 'lens'

type FamilyConfig = {
  title: string
  subtitle: string
  elementWord: string
  kinds: [ElementKind, ElementKind]
  kindLabels: [string, string]
  viewport: Viewport
  roles: RayRole[]
  keyIdea: ReactNode
}

const FAMILIES: Record<Family, FamilyConfig> = {
  mirror: {
    title: 'Spherical Mirrors',
    subtitle: 'Concave and convex mirrors: drag the object through the zones and watch the image move, flip and resize.',
    elementWord: 'Mirror',
    kinds: ['concave-mirror', 'convex-mirror'],
    kindLabels: ['Concave', 'Convex'],
    viewport: MIRROR_VIEWPORT,
    roles: ['parallel', 'focal', 'centre', 'pole'],
    keyIdea: (
      <>
        Where the object sits relative to <strong>F</strong> and <strong>C</strong> decides everything about the image: real or virtual, upright or inverted, bigger or smaller. Move the object through the
        zones and watch.
      </>
    ),
  },
  lens: {
    title: 'Lenses',
    subtitle: 'Convex and concave thin lenses: drag the object through the zones and watch the image move, flip and resize.',
    elementWord: 'Lens',
    kinds: ['convex-lens', 'concave-lens'],
    kindLabels: ['Convex', 'Concave'],
    viewport: LENS_VIEWPORT,
    roles: ['parallel', 'focal', 'centre'],
    keyIdea: (
      <>
        Where the object sits relative to <strong>F</strong> and <strong>2F</strong> decides everything about the image: real or virtual, upright or inverted, bigger or smaller. Move the object through the
        zones and watch.
      </>
    ),
  },
}

const F_MIN = 5
const F_MAX = 30

/** Shared implementation of the Mirrors and Lenses sections. */
export function ImagingSection({ family }: { family: Family }) {
  const cfg = FAMILIES[family]
  const { viewport } = cfg
  const uMax = uMaxFor(viewport)
  const hMax = hMaxFor(viewport)

  const [kind, setKind] = useState<ElementKind>(cfg.kinds[0])
  const [fMag, setFMagRaw] = useState(10)
  const [uMag, setUMagRaw] = useState(15)
  const [h, setHRaw] = useState(4)
  const [roles, setRoles] = useState<RayRole[]>(cfg.roles)
  const [compare, setCompare] = useState(false)
  const [showZones, setShowZones] = useState(true)

  const setFMag = useCallback((v: number) => setFMagRaw(clamp(v, F_MIN, F_MAX)), [])
  const setUMag = useCallback((v: number) => setUMagRaw(clamp(v, U_MIN, uMax)), [uMax])
  const setH = useCallback((v: number) => setHRaw(clamp(v, H_MIN, hMax)), [hMax])
  const onDiagramChange = useCallback((u: number, hh: number) => {
    setUMagRaw(u)
    setHRaw(hh)
  }, [])
  const selectZone = useCallback((factor: number) => setUMag(factor * fMag), [fMag, setUMag])
  const toggleRole = (r: RayRole) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : cfg.roles.filter((x) => x === r || prev.includes(x))))

  // Both kinds are always computed (cheap) so compare mode has no hook-order issues.
  const resA = useImaging(cfg.kinds[0], uMag, h, fMag, roles, viewport)
  const resB = useImaging(cfg.kinds[1], uMag, h, fMag, roles, viewport)
  const primary = kind === cfg.kinds[0] ? resA : resB
  const results = compare ? [resA, resB] : [primary]
  const convergingKind = cfg.kinds.find(isConverging) ?? cfg.kinds[0]
  const zoneBarKind = compare ? convergingKind : kind
  const zoneBarRes = zoneBarKind === cfg.kinds[0] ? resA : resB

  const dropped = useMemo(() => {
    const set = new Set<RayRole>()
    for (const r of results) for (const d of r.dropped) set.add(d)
    return set
  }, [results])

  const quiz = useMemo(() => makeImagingQuiz(family, { setKind, setFMag, setUMag, setH }), [family, setFMag, setUMag, setH])

  const legendItems: LegendItem[] = [
    ...cfg.roles.map((r) => {
      const on = roles.includes(r)
      const isDropped = on && dropped.has(r)
      return {
        color: RAY_COLORS[r],
        label: ROLE_LABEL[r] + (isDropped ? ' (not drawn)' : ''),
        muted: !on || isDropped,
        hint: isDropped ? droppedReason(r, primary) : on ? roleHint(r, kind) : 'Hidden. Turn it on in Controls.',
      }
    }),
    { color: RAY_COLORS.object, label: 'Object' },
    { color: RAY_COLORS.realImage, label: 'Real image' },
    { color: RAY_COLORS.virtualImage, label: 'Virtual image', dashed: true },
    { color: RAY_COLORS.guide, label: 'Virtual extension / guide', dashed: true },
  ]

  const diagram = (k: ElementKind) => (
    <ImagingDiagram key={k} kind={k} fMag={fMag} uMag={uMag} h={h} viewport={viewport} roles={roles} showZones={showZones} onChange={onDiagramChange} compact={compare} />
  )

  return (
    <SectionLayout
      title={cfg.title}
      subtitle={cfg.subtitle}
      keyIdea={cfg.keyIdea}
      stage={
        <div className="space-y-2">
          {compare ? <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-2">{cfg.kinds.map(diagram)}</div> : diagram(kind)}
          <Legend items={legendItems} />
        </div>
      }
      below={
        <div className="space-y-4">
          <Card title="Object zones" action={<span className="text-xs text-slate-500">Click a zone to move the object there</span>}>
            <ZoneBar kind={zoneBarKind} fMag={fMag} zone={zoneBarRes.zone} uMax={uMax} onSelect={selectZone} />
            {compare ? (
              <div className="mt-4 grid grid-cols-1 gap-3 min-[900px]:grid-cols-2">
                {results.map((r) => (
                  <div key={r.kind} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{KIND_TITLE[r.kind]}</div>
                    <ZoneBadge kind={r.kind} zone={r.zone} image={r.image} size="sm" />
                    <div className="mt-2">
                      <MiniReadouts res={r} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <ZoneBadge kind={kind} zone={primary.zone} image={primary.image} />
              </div>
            )}
          </Card>
          <Card title={`Image summary: ${KIND_TITLE[kind].toLowerCase()}`} action={<span className="text-xs text-slate-500">Current row highlighted · click a row to jump there</span>}>
            <ImageSummaryTable kind={kind} zone={primary.zone} onSelect={selectZone} />
          </Card>
        </div>
      }
      controls={
        <Card title="Controls">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-xs font-medium text-slate-400">{cfg.elementWord} type</div>
              <Segmented options={[{ label: cfg.kindLabels[0], value: cfg.kinds[0] }, { label: cfg.kindLabels[1], value: cfg.kinds[1] }]} value={kind} onChange={setKind} ariaLabel={`${cfg.elementWord} type`} />
              {compare && <p className="mt-1 text-xs text-slate-500">Both are shown side by side; the formula card and table follow this choice.</p>}
            </div>
            <Slider label="Focal length |f|" value={fMag} min={F_MIN} max={F_MAX} step={0.5} unit="cm" onChange={setFMag} />
            <Slider label="Object distance |u|" value={uMag} min={U_MIN} max={uMax} step={U_STEP} unit="cm" onChange={setUMag} hint="Or drag the object tip in the diagram (arrow keys nudge it)" />
            <Slider label="Object height h" value={h} min={H_MIN} max={hMax} step={H_STEP} unit="cm" onChange={setH} />
            <div>
              <div className="mb-1.5 text-xs font-medium text-slate-400">Construction rays</div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Construction rays">
                {cfg.roles.map((r) => {
                  const on = roles.includes(r)
                  const isDropped = on && dropped.has(r)
                  const color = RAY_COLORS[r]
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleRole(r)}
                      title={isDropped ? droppedReason(r, primary) : roleHint(r, kind)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        on ? 'bg-slate-800 text-slate-100' : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                      } ${isDropped ? 'opacity-40' : ''}`}
                      style={on ? { borderColor: color } : undefined}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: color, opacity: on ? 1 : 0.4 }} />
                      {ROLE_LABEL[r]}
                      {isDropped && <span className="text-[10px] font-normal text-slate-400">not drawn</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            <Toggle label={`Compare ${cfg.kindLabels[0].toLowerCase()} vs ${cfg.kindLabels[1].toLowerCase()} side by side`} checked={compare} onChange={setCompare} />
            <Toggle label="Show zone ribbon on the axis" checked={showZones} onChange={setShowZones} />
          </div>
        </Card>
      }
      readouts={
        <Card title={`Live values · ${KIND_TITLE[kind]}`}>
          <ReadoutsPanel res={primary} />
        </Card>
      }
      quiz={<QuizCard questions={quiz} />}
    />
  )
}

/** "(+30.0)" style operand for substituted formulas; infinities become (+∞) / (−∞). */
const paren = (x: number) => `(${fmtSigned(x, 1)})`

const sizeWord = (m: number) => (Math.abs(m) > 1.005 ? 'magnified' : Math.abs(m) < 0.995 ? 'diminished' : 'same size')

function ReadoutsPanel({ res }: { res: ImagingResult }) {
  const mirror = isMirror(res.kind)
  const { image, u, f, h, hPrime } = res
  const inf = image.atInfinity
  const orient = image.m > 0 ? 'erect' : 'inverted'
  return (
    <div className="space-y-3">
      <FormulaCard
        title={mirror ? 'Mirror formula' : 'Lens formula'}
        symbolic={mirror ? '1/v + 1/u = 1/f' : '1/v − 1/u = 1/f'}
        substituted={mirror ? `1/${paren(image.v)} + 1/${paren(u)} = 1/${paren(f)}` : `1/${paren(image.v)} − 1/${paren(u)} = 1/${paren(f)}`}
        note={inf ? 'Object at F: 1/v = 0, so the image is at infinity.' : undefined}
        tone={inf ? 'warn' : image.virtual ? 'default' : 'ok'}
      />
      <FormulaCard
        title="Magnification"
        symbolic={mirror ? 'm = −v/u = h′/h' : 'm = v/u = h′/h'}
        substituted={inf ? 'h′ → ∞ (no finite image)' : mirror ? `m = −${paren(image.v)}/${paren(u)} = ${paren(hPrime)}/${paren(h)}` : `m = ${paren(image.v)}/${paren(u)} = ${paren(hPrime)}/${paren(h)}`}
        result={inf ? 'm → ∞ (image at infinity)' : `m = ${fmtSigned(image.m, 2)} → ${orient}, ${sizeWord(image.m)}`}
      />
      <ReadoutGrid>
        <Readout label="Object distance u" value={fmtSigned(u, 1)} unit="cm" hint="negative: in front, New Cartesian" />
        <Readout label="Focal length f" value={fmtSigned(f, 1)} unit="cm" hint={`${f < 0 ? 'negative' : 'positive'}: ${KIND_TITLE[res.kind].toLowerCase()}`} />
        <Readout label="Image distance v" value={inf ? '∞' : fmtSigned(image.v, 1)} unit={inf ? undefined : 'cm'} tone="accent" hint={inf ? undefined : image.virtual ? 'virtual image' : 'real image'} />
        <Readout label="Magnification m" value={inf ? '∞' : fmtSigned(image.m, 2)} tone={inf ? 'warn' : image.m > 0 ? 'ok' : 'default'} />
        <Readout label="Image height h′ = m·h" value={inf ? '∞' : fmtSigned(hPrime, 1)} unit={inf ? undefined : 'cm'} />
        {!mirror && <Readout label="Power P = 100/f" value={fmtSigned(lensPowerDioptres(f), 2)} unit="D" hint="f in cm" />}
      </ReadoutGrid>
    </div>
  )
}

function MiniReadouts({ res }: { res: ImagingResult }) {
  const inf = res.image.atInfinity
  return (
    <ReadoutGrid>
      <Readout label="v" value={inf ? '∞' : fmtSigned(res.image.v, 1)} unit={inf ? undefined : 'cm'} tone="accent" />
      <Readout label="m" value={inf ? '∞' : fmtSigned(res.image.m, 2)} />
      <Readout label="h′" value={inf ? '∞' : fmtSigned(res.hPrime, 1)} unit={inf ? undefined : 'cm'} />
      {!isMirror(res.kind) && <Readout label="P" value={fmtSigned(lensPowerDioptres(res.f), 2)} unit="D" />}
    </ReadoutGrid>
  )
}
