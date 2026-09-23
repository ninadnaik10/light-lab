import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Badge, Button, Card, FormulaCard, Legend, PresetChips, QuizCard, Readout, ReadoutGrid, SectionLayout, Segmented, Slider } from '../components/ui'
import { useSweep } from '../hooks/useSweep'
import { RAY_COLORS, wavelengthToRGB } from '../lib/color'
import { clamp, fmt, fmtDeg, roundTo } from '../lib/format'
import { GLASSES, cauchyIndex, prismIncidenceForMinDeviation, prismMinDeviationDeg, type GlassId } from '../lib/optics'
import {
  A_MAX,
  A_MIN,
  FRAC_MAX,
  FRAC_MIN,
  I_MAX,
  I_MIN,
  LAMBDA_MAX,
  LAMBDA_MIN,
  MID_NM,
  RED_NM,
  VIOLET_NM,
  WHITE,
  WHITE_WAVELENGTHS,
  buildSetup,
  traceWavelength,
} from './dispersion/model'
import { PhenomenaPanel } from './dispersion/phenomena/PhenomenaPanel'
import { PrismDiagram } from './dispersion/PrismDiagram'
import { dispersionQuiz } from './dispersion/quiz'

type Mode = 'white' | 'mono'

const SWEEP_DEG_PER_SEC = 20
const GLASS_OPTIONS: { label: string; value: GlassId }[] = [
  { label: 'Crown (BK7)', value: 'crown' },
  { label: 'Flint (F2)', value: 'flint' },
]
const BOOST_OPTIONS = [
  { label: '×1 (real)', value: 1 },
  { label: '×2', value: 2 },
  { label: '×3', value: 3 },
  { label: '×5', value: 5 },
]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm text-slate-300">{label}</div>
      {children}
    </div>
  )
}

export default function DispersionSection() {
  const [apexDeg, setApexDegRaw] = useState(60)
  const [entryFrac, setEntryFracRaw] = useState(0.55)
  const [iDeg, setIDegRaw] = useState(50)
  const [mode, setMode] = useState<Mode>('white')
  const [lambda, setLambdaRaw] = useState(550)
  const [glass, setGlass] = useState<GlassId>('crown')
  const [boost, setBoost] = useState(3)
  const [sweeping, setSweeping] = useState(false)
  const [dragging, setDragging] = useState(false)

  const setIDeg = useCallback((v: number) => setIDegRaw(clamp(roundTo(v, 0.1), I_MIN, I_MAX)), [])
  const setIDegManual = useCallback(
    (v: number) => {
      setSweeping(false)
      setIDeg(v)
    },
    [setIDeg],
  )
  const setApexDeg = useCallback((v: number) => setApexDegRaw(clamp(Math.round(v), A_MIN, A_MAX)), [])
  const setEntryFrac = useCallback((v: number) => setEntryFracRaw(clamp(roundTo(v, 0.01), FRAC_MIN, FRAC_MAX)), [])
  const setLambda = useCallback((v: number) => setLambdaRaw(clamp(Math.round(v), LAMBDA_MIN, LAMBDA_MAX)), [])
  const nudge = useCallback((dir: -1 | 1, big: boolean) => setIDegManual(iDeg + dir * (big ? 5 : 1)), [iDeg, setIDegManual])

  useSweep({ enabled: sweeping, paused: dragging, value: iDeg, min: I_MIN, max: I_MAX, degPerSec: SWEEP_DEG_PER_SEC, onChange: setIDeg })

  const setup = useMemo(() => buildSetup(apexDeg, entryFrac, iDeg), [apexDeg, entryFrac, iDeg])
  const traces = useMemo(
    () => (mode === 'white' ? WHITE_WAVELENGTHS : [lambda]).map((nm) => traceWavelength(setup, glass, boost, nm)),
    [setup, glass, boost, mode, lambda],
  )
  const refNm = mode === 'white' ? MID_NM : lambda
  const refTrace = useMemo(() => (mode === 'mono' ? traces[0] : traceWavelength(setup, glass, boost, MID_NM)), [mode, traces, setup, glass, boost])
  const red = useMemo(() => traceWavelength(setup, glass, boost, RED_NM), [setup, glass, boost])
  const violet = useMemo(() => traceWavelength(setup, glass, boost, VIOLET_NM), [setup, glass, boost])

  const nRef = cauchyIndex(glass, refNm, boost)
  const iMinDev = prismIncidenceForMinDeviation(nRef, apexDeg)
  const deltaMin = prismMinDeviationDeg(nRef, apexDeg)
  const canSetMinDev = iMinDev !== null && iMinDev >= I_MIN && iMinDev <= I_MAX

  const applyMinDeviation = useCallback(
    (g: GlassId, b: number) => {
      const i = prismIncidenceForMinDeviation(cauchyIndex(g, MID_NM, b), apexDeg)
      if (i !== null) setIDegManual(i)
    },
    [apexDeg, setIDegManual],
  )

  const questions = useMemo(
    () => dispersionQuiz({ setMode, setGlass, setLambda, setBoost, setToMinDeviation: applyMinDeviation }),
    [setLambda, applyMinDeviation],
  )

  const spread = red.clean && violet.clean && red.result.deviationDeg !== null && violet.result.deviationDeg !== null ? violet.result.deviationDeg - red.result.deviationDeg : null
  const dev = refTrace.result.deviationDeg
  const problem = !refTrace.clean
    ? refTrace.result.events.some((e) => e.kind === 'tir')
      ? 'TIR at the second face: increase i or reduce A'
      : refTrace.exitEdge === 1
        ? 'Ray leaves through the base: increase i or move the entry point up'
        : 'Ray does not pass cleanly through both faces'
    : null

  const glassLabel = `${GLASSES[glass].label} · n(${refNm} nm) = ${fmt(nRef, 4)}`

  return (
    <SectionLayout
      title="Dispersion"
      subtitle="A prism fans white light into a spectrum because the refractive index of glass depends on wavelength."
      keyIdea={<>White light is a mix of colours. Glass slows violet light more than red (higher n), so violet bends more at each face and the colours fan out.</>}
      stage={
        <PrismDiagram
          setup={setup}
          traces={traces}
          refTrace={refTrace}
          mode={mode}
          iDeg={iDeg}
          glassLabel={glassLabel}
          boost={boost}
          onDrag={setIDegManual}
          onDragStart={() => {
            setSweeping(false)
            setDragging(true)
          }}
          onDragEnd={() => setDragging(false)}
          onNudge={nudge}
        />
      }
      controls={
        <Card title="Controls">
          <div className="space-y-4">
            <Segmented
              ariaLabel="Light source type"
              options={[
                { label: 'White light', value: 'white' },
                { label: 'Single wavelength', value: 'mono' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {mode === 'mono' && (
              <div className="flex items-center gap-3">
                <span className="mt-4 inline-block h-4 w-4 shrink-0 rounded-full ring-2 ring-white/20" style={{ background: wavelengthToRGB(lambda) }} aria-hidden />
                <div className="flex-1">
                  <Slider label="Wavelength λ" value={lambda} min={LAMBDA_MIN} max={LAMBDA_MAX} step={1} unit="nm" onChange={setLambda} />
                </div>
              </div>
            )}
            <Field label="Glass">
              <PresetChips options={GLASS_OPTIONS} value={glass} onSelect={setGlass} ariaLabel="Glass type" />
            </Field>
            <Field label="Dispersion boost (exaggerates how n changes with λ)">
              <div className="flex flex-wrap items-center gap-2">
                <PresetChips options={BOOST_OPTIONS} value={boost} onSelect={setBoost} ariaLabel="Dispersion boost" />
                {boost > 1 && <Badge tone="warn">spread exaggerated ×{boost}</Badge>}
              </div>
              <p className="text-xs text-slate-500">Real crown glass spreads red to violet by only about 1.5° through a 60° prism, so the boost makes the fan easier to see.</p>
            </Field>
            <Slider label="Apex angle A" value={apexDeg} min={A_MIN} max={A_MAX} step={1} unit="°" onChange={setApexDeg} />
            <Slider label="Entry point on the left face" value={entryFrac} min={FRAC_MIN} max={FRAC_MAX} step={0.01} onChange={setEntryFrac} hint="0 = apex, 1 = base" />
            <Slider label="Angle of incidence i" value={iDeg} min={I_MIN} max={I_MAX} step={0.1} unit="°" onChange={setIDegManual} hint="Drag the source on the stage, or focus it and use ← → (Shift for 5° steps)." />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={sweeping ? 'primary' : 'ghost'} active={sweeping} onClick={() => setSweeping((s) => !s)} aria-pressed={sweeping}>
                {sweeping ? 'Stop sweep' : 'Auto-sweep i'}
              </Button>
              <Button onClick={() => iMinDev !== null && setIDegManual(iMinDev)} disabled={!canSetMinDev} title={canSetMinDev ? undefined : 'No minimum-deviation angle exists for this A and n'}>
                Set to minimum deviation
              </Button>
              {sweeping && <Badge tone="info">{dragging ? 'paused' : `${SWEEP_DEG_PER_SEC}°/s`}</Badge>}
            </div>
          </div>
        </Card>
      }
      readouts={
        <Card title="Live values">
          <ReadoutGrid>
            <Readout label={<span style={{ color: red.color }}>n (red, {RED_NM} nm)</span>} value={fmt(red.n, 4)} hint={boost > 1 ? `Cauchy, dispersion ×${boost}` : 'Cauchy, real glass'} />
            <Readout label={<span style={{ color: violet.color }}>n (violet, {VIOLET_NM} nm)</span>} value={fmt(violet.n, 4)} />
            {mode === 'mono' && <Readout label={<span style={{ color: refTrace.color }}>n ({lambda} nm)</span>} value={fmt(refTrace.n, 4)} tone="accent" />}
            <Readout label="δ red" hint="deviation of the 700 nm ray" value={red.clean && red.result.deviationDeg !== null ? fmtDeg(red.result.deviationDeg) : '—'} />
            <Readout label="δ violet" hint="deviation of the 400 nm ray" value={violet.clean && violet.result.deviationDeg !== null ? fmtDeg(violet.result.deviationDeg) : '—'} />
            <Readout label="Angular spread Δδ" hint="δ violet − δ red" value={spread !== null ? fmtDeg(spread) : '—'} tone="accent" />
            <Readout label={`δ min (${refNm} nm)`} hint="2·sin⁻¹(n·sin(A/2)) − A" value={deltaMin !== null ? fmtDeg(deltaMin) : '—'} tone={canSetMinDev && Math.abs(iDeg - (iMinDev ?? 0)) < 0.3 ? 'ok' : 'default'} />
          </ReadoutGrid>
          <div className="mt-3 space-y-3">
            <FormulaCard
              title={`Deviation of the ${refNm} nm ray`}
              symbolic="δ = i + e − A"
              substituted={refTrace.clean && dev !== null && refTrace.eDeg !== null ? `${fmtDeg(dev)} = ${fmtDeg(iDeg)} + ${fmtDeg(refTrace.eDeg)} − ${fmtDeg(apexDeg)}` : '—'}
              result={refTrace.clean && dev !== null ? `δ = ${fmtDeg(dev)}` : undefined}
              note="i = angle of incidence at the first face, e = angle of emergence at the second face, A = apex angle. Deviation is smallest when the ray passes symmetrically (i = e)."
              tone={refTrace.clean ? 'default' : 'danger'}
            />
            {problem && <Badge tone="danger">{problem}</Badge>}
            <Legend
              items={[
                { color: WHITE, label: mode === 'white' ? 'Incident white light' : 'Incident beam (single λ)' },
                { color: wavelengthToRGB(RED_NM), label: 'Red (700 nm) bends least' },
                { color: wavelengthToRGB(VIOLET_NM), label: 'Violet (400 nm) bends most' },
                { color: RAY_COLORS.normal, label: 'Normal', dashed: true },
                { color: RAY_COLORS.guide, label: 'Undeviated path (guide)', dashed: true },
              ]}
            />
          </div>
        </Card>
      }
      quiz={<QuizCard questions={questions} />}
      below={<PhenomenaPanel />}
    />
  )
}
