import { useCallback, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, FormulaCard, Legend, QuizCard, Readout, ReadoutGrid, SectionLayout, Slider } from '../components/ui'
import { useSweep } from '../hooks/useSweep'
import { RAY_COLORS } from '../lib/color'
import { clamp, fmt, fmtDeg } from '../lib/format'
import { criticalAngleDeg, fresnelReflectance, snellAngle } from '../lib/optics'
import { MediumControl } from './refraction/MediumControl'
import { RefractionDiagram } from './refraction/RefractionDiagram'
import { refractionQuestions } from './refraction/quiz'
import { fmtIndex, fmtSpeed, I_MAX, I_MIN } from './refraction/shared'

const AIR = 1.0003
const WATER = 1.333

export default function RefractionSection() {
  const [n1, setN1] = useState(AIR)
  const [n2, setN2] = useState(WATER)
  const [iDeg, setIDeg] = useState(40)
  const [sweep, setSweep] = useState(false)
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)

  /** Any manual input wins over the sweep. */
  const setIManual = useCallback((v: number) => {
    setSweep(false)
    setIDeg(clamp(v, I_MIN, I_MAX))
  }, [])
  /** Drag only pauses the sweep (it resumes on release); keyboard nudges stop it. */
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

  useSweep({ enabled: sweep, paused: dragging, value: iDeg, min: I_MIN, max: I_MAX, degPerSec: 25, onChange: setIDeg })

  const applyScenario = useCallback((a: number, b: number, i: number) => {
    setSweep(false)
    setN1(a)
    setN2(b)
    setIDeg(clamp(i, I_MIN, I_MAX))
  }, [])
  const questions = useMemo(() => refractionQuestions(applyScenario), [applyScenario])

  const rDeg = snellAngle(n1, n2, iDeg)
  const R = fresnelReflectance(n1, n2, iDeg)
  const tc = criticalAngleDeg(n1, n2)
  const isTir = rDeg === null || (tc !== null && iDeg >= tc)
  const lhs = n1 * Math.sin((iDeg * Math.PI) / 180)
  const rhs = rDeg !== null ? n2 * Math.sin((rDeg * Math.PI) / 180) : null
  const sameIndex = Math.abs(n1 - n2) < 1e-4

  const bending = (() => {
    if (isTir) return null
    if (iDeg < 0.05) return { tone: 'neutral' as const, text: 'Along the normal: no bending' }
    if (sameIndex) return { tone: 'neutral' as const, text: 'No bending' }
    if (n2 > n1) return { tone: 'info' as const, text: 'Bends toward the normal' }
    return { tone: 'warn' as const, text: 'Bends away from the normal' }
  })()

  return (
    <SectionLayout
      title="Refraction"
      subtitle="Drag the source or change the media and watch Snell’s law bend the ray."
      keyIdea={
        <>
          When light enters a denser medium it slows down and bends toward the normal; entering a rarer medium it speeds up and bends away.
          Snell’s law fixes exactly how much.
        </>
      }
      stage={<RefractionDiagram n1={n1} n2={n2} iDeg={iDeg} onChangeI={setIFromDiagram} onDragStart={onDragStart} onDragEnd={onDragEnd} />}
      controls={
        <Card title="Controls">
          <div className="space-y-4">
            <MediumControl title="Medium 1 (light starts here)" subscript="₁" n={n1} onChange={setN1} />
            <MediumControl title="Medium 2" subscript="₂" n={n2} onChange={setN2} />
            <Button
              onClick={() => {
                setN1(n2)
                setN2(n1)
              }}
              className="w-full"
            >
              ⇅ Swap media
            </Button>
            <Slider label="Angle of incidence i" value={iDeg} min={I_MIN} max={I_MAX} step={0.1} unit="°" onChange={setIManual} hint="Measured from the normal. Drag the yellow source or use arrow keys on it." />
            <Button variant={sweep ? 'primary' : 'ghost'} active={sweep} onClick={() => setSweep((s) => !s)} className="w-full" aria-pressed={sweep}>
              {sweep ? '■ Stop sweep' : '▶ Auto-sweep i (0° → 89.9°)'}
            </Button>
          </div>
        </Card>
      }
      readouts={
        <Card title="Live values">
          <div className="space-y-3">
            <ReadoutGrid>
              <Readout label="n₁ (first medium)" value={fmtIndex(n1)} />
              <Readout label="n₂ (second medium)" value={fmtIndex(n2)} />
              <Readout label="Angle of incidence i" value={fmtDeg(iDeg)} tone="accent" />
              <Readout label="Angle of refraction r" value={rDeg === null ? '— (total internal reflection)' : fmtDeg(rDeg)} tone={rDeg === null ? 'danger' : 'accent'} />
            </ReadoutGrid>

            {rDeg !== null && rhs !== null ? (
              <FormulaCard
                title="Snell’s law"
                symbolic="n₁ sin i = n₂ sin r"
                substituted={`${fmtIndex(n1)} × sin ${fmtDeg(iDeg)} = ${fmtIndex(n2)} × sin ${fmtDeg(rDeg)}`}
                result={`${fmt(lhs, 3)} = ${fmt(rhs, 3)}`}
              />
            ) : (
              <FormulaCard
                title="Snell’s law"
                symbolic="n₁ sin i = n₂ sin r"
                substituted={`${fmtIndex(n1)} × sin ${fmtDeg(iDeg)} = ${fmt(lhs, 3)}`}
                result={`${fmt(lhs, 3)} > n₂ = ${fmtIndex(n2)} → sin r > 1: no refracted ray`}
                tone="danger"
              />
            )}

            <ReadoutGrid>
              <Readout label="Speed in medium 1" value={fmtSpeed(n1)} hint="v = c / n₁" />
              <Readout label="Speed in medium 2" value={fmtSpeed(n2)} hint="v = c / n₂" />
              <Readout label="Reflected fraction R" value={`${fmt(R * 100, 1)} %`} hint="Fresnel, unpolarised" />
              {tc !== null && <Readout label="Critical angle θc" value={fmtDeg(tc)} hint="sin θc = n₂ / n₁" tone="warn" />}
            </ReadoutGrid>

            <div className="flex flex-wrap items-center gap-2">
              {bending && <Badge tone={bending.tone}>{bending.text}</Badge>}
              {isTir && (
                <>
                  <Badge tone="danger">Total internal reflection</Badge>
                  <a href="#tir" className="text-xs font-medium text-cyan-300 underline-offset-2 hover:underline">
                    Explore TIR →
                  </a>
                </>
              )}
            </div>

            <Legend
              items={[
                { color: RAY_COLORS.incident, label: 'Incident' },
                { color: RAY_COLORS.refracted, label: 'Refracted' },
                { color: RAY_COLORS.reflected, label: 'Reflected (partial)' },
                { color: RAY_COLORS.normal, label: 'Normal', dashed: true },
              ]}
            />
          </div>
        </Card>
      }
      quiz={<QuizCard questions={questions} />}
    />
  )
}
