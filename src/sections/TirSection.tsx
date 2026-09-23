import { useCallback, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, FormulaCard, Legend, QuizCard, Readout, ReadoutGrid, SectionLayout, Slider } from '../components/ui'
import type { BadgeTone } from '../components/ui'
import { useSweep } from '../hooks/useSweep'
import { RAY_COLORS } from '../lib/color'
import { clamp, fmt, fmtDeg } from '../lib/format'
import { criticalAngleDeg, fresnelReflectance, snellAngle } from '../lib/optics'
import { MediumControl } from './refraction/MediumControl'
import { RefractionDiagram } from './refraction/RefractionDiagram'
import { fmtIndex, I_MAX, I_MIN } from './refraction/shared'
import { FibreDemo } from './tir/FibreDemo'
import { tirQuestions } from './tir/quiz'

const GLASS = 1.5
const AIR = 1.0003
const CRITICAL_COLOR = '#f87171'

type TirState = 'none' | 'refraction' | 'critical' | 'tir'

const STATE_UI: Record<TirState, { tone: BadgeTone; title: string; text: string; box: string }> = {
  none: { tone: 'neutral', title: 'No TIR possible', text: 'Light must start in the denser medium', box: 'border-slate-700 bg-slate-900/60' },
  refraction: { tone: 'info', title: 'Refraction', text: 'Refraction + weak reflection', box: 'border-cyan-700/60 bg-cyan-950/30' },
  critical: { tone: 'warn', title: 'Critical', text: 'Critical angle: the refracted ray grazes the surface', box: 'border-amber-700/60 bg-amber-950/30' },
  tir: { tone: 'danger', title: 'TIR', text: 'Total internal reflection: no refracted ray', box: 'border-rose-700/60 bg-rose-950/30' },
}

export default function TirSection() {
  const [n1, setN1] = useState(GLASS)
  const [n2, setN2] = useState(AIR)
  const [iDeg, setIDeg] = useState(30)
  const [sweep, setSweep] = useState(false)
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)

  const setIManual = useCallback((v: number) => {
    setSweep(false)
    setIDeg(clamp(v, I_MIN, I_MAX))
  }, [])
  const setIFromDiagram = useCallback(
    (v: number) => {
      if (draggingRef.current) setIDeg(clamp(v, I_MIN, I_MAX))
      else setIManual(v)
    },
    [setIManual],
  )
  const onDragStart = useCallback(() => {
    draggingRef.current = true
    setDragging(true)
  }, [])
  const onDragEnd = useCallback(() => {
    draggingRef.current = false
    setDragging(false)
  }, [])

  const tc = criticalAngleDeg(n1, n2)

  useSweep({
    enabled: sweep,
    paused: dragging,
    value: iDeg,
    min: I_MIN,
    max: I_MAX,
    degPerSec: 15,
    onChange: setIDeg,
    slowNear: tc !== null ? { at: tc, within: 5, factor: 0.25 } : undefined,
  })

  const applyScenario = useCallback((a: number, b: number, i: number) => {
    setSweep(false)
    setN1(a)
    setN2(b)
    setIDeg(clamp(i, I_MIN, I_MAX))
  }, [])
  const questions = useMemo(() => tirQuestions(applyScenario), [applyScenario])

  const rDeg = snellAngle(n1, n2, iDeg)
  const R = fresnelReflectance(n1, n2, iDeg)
  const state: TirState = tc === null ? 'none' : iDeg < tc - 0.05 ? 'refraction' : Math.abs(iDeg - tc) <= 0.05 ? 'critical' : 'tir'
  const ui = STATE_UI[state]
  const reflectedPct = R >= 0.9995 ? '100 %' : `${fmt(R * 100, 1)} %`

  return (
    <SectionLayout
      title="Total Internal Reflection"
      subtitle="Light starts in the denser medium below. Push the angle past the critical angle and nothing gets out."
      keyIdea={
        <>
          If light inside a denser medium meets the boundary at an angle larger than the critical angle, none of it escapes: it is totally reflected back.
          Optical fibres and diamonds rely on this.
        </>
      }
      stage={<RefractionDiagram n1={n1} n2={n2} iDeg={iDeg} onChangeI={setIFromDiagram} onDragStart={onDragStart} onDragEnd={onDragEnd} sourceSide="bottom" showCriticalRef />}
      controls={
        <Card title="Controls">
          <div className="space-y-4">
            <MediumControl title="Denser medium (light starts here)" subscript="₁" n={n1} onChange={setN1} />
            <MediumControl title="Rarer medium" subscript="₂" n={n2} onChange={setN2} />
            <Slider label="Angle of incidence i" value={iDeg} min={I_MIN} max={I_MAX} step={0.1} unit="°" onChange={setIManual} hint="Measured from the normal. Drag the yellow source or use arrow keys on it." />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => tc !== null && setIManual(tc)} disabled={tc === null} title={tc === null ? 'Needs n₁ > n₂' : `Set i to ${fmtDeg(tc)}`}>
                Set i = θc
              </Button>
              <Button variant={sweep ? 'primary' : 'ghost'} active={sweep} onClick={() => setSweep((s) => !s)} aria-pressed={sweep}>
                {sweep ? '■ Stop sweep' : '▶ Auto-sweep'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">The sweep slows down near θc so you can watch the refracted ray flatten out and vanish.</p>
          </div>
        </Card>
      }
      readouts={
        <>
          <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${ui.box}`} role="status" aria-live="polite">
            <Badge tone={ui.tone} size="lg">
              {ui.title}
            </Badge>
            <span className="text-sm text-slate-200">{ui.text}</span>
          </div>
          <Card title="Live values">
            <div className="space-y-3">
              {tc !== null ? (
                <FormulaCard
                  title="Critical angle"
                  symbolic="sin θc = n₂ / n₁"
                  substituted={`sin θc = ${fmtIndex(n2)} / ${fmtIndex(n1)} = ${fmt(n2 / n1, 3)}`}
                  result={`θc = ${fmtDeg(tc)}`}
                  tone={state === 'tir' ? 'danger' : state === 'critical' ? 'warn' : 'default'}
                />
              ) : (
                <FormulaCard
                  title="Critical angle"
                  symbolic="sin θc = n₂ / n₁"
                  substituted={`n₂ / n₁ = ${fmtIndex(n2)} / ${fmtIndex(n1)} = ${fmt(n2 / n1, 3)} ≥ 1`}
                  result="No critical angle: sin θc cannot exceed 1"
                  note="Swap the media so light starts in the denser one."
                />
              )}
              <ReadoutGrid>
                <Readout label="Angle of incidence i" value={fmtDeg(iDeg)} tone="accent" />
                <Readout label="Critical angle θc" value={tc === null ? '—' : fmtDeg(tc)} tone="warn" />
                <Readout label="Angle of refraction r" value={rDeg === null ? '—' : fmtDeg(rDeg)} hint={rDeg === null ? 'No refracted ray' : rDeg > 89.7 ? 'Grazing along the surface' : undefined} tone={rDeg === null ? 'danger' : 'accent'} />
                <Readout label="Reflected" value={reflectedPct} hint="Fraction of light energy reflected (Fresnel)" tone={R >= 0.9995 ? 'danger' : 'default'} />
                <Readout label="Transmitted" value={R >= 0.9995 ? '0 %' : `${fmt((1 - R) * 100, 1)} %`} />
              </ReadoutGrid>
              <Legend
                items={[
                  { color: RAY_COLORS.incident, label: 'Incident' },
                  { color: RAY_COLORS.refracted, label: 'Refracted' },
                  { color: RAY_COLORS.reflected, label: 'Reflected' },
                  { color: CRITICAL_COLOR, label: 'θc reference', dashed: true },
                  { color: RAY_COLORS.normal, label: 'Normal', dashed: true },
                ]}
              />
            </div>
          </Card>
        </>
      }
      quiz={<QuizCard questions={questions} />}
      below={<FibreDemo />}
    />
  )
}
