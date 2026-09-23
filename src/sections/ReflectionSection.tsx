import { useCallback, useMemo, useState } from 'react'
import { Badge, Button, Card, FormulaCard, Legend, QuizCard, Readout, ReadoutGrid, SectionLayout, Slider, Toggle } from '../components/ui'
import { useSweep } from '../hooks/useSweep'
import { RAY_COLORS } from '../lib/color'
import { clamp, fmt, fmtDeg, roundTo } from '../lib/format'
import { I_MAX, I_MIN, SOURCE_RADIUS } from './reflection/geometry'
import { ReflectionDiagram } from './reflection/ReflectionDiagram'
import { reflectionQuiz } from './reflection/quiz'

const SWEEP_DEG_PER_SEC = 25

export default function ReflectionSection() {
  const [iDeg, setIDegRaw] = useState(40)
  const [sweeping, setSweeping] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showImage, setShowImage] = useState(false)

  /** Single source of truth: every writer goes through here (rounded to 0.1°, clamped). */
  const setIDeg = useCallback((v: number) => setIDegRaw(clamp(roundTo(v, 0.1), I_MIN, I_MAX)), [])
  /** Manual input always wins over the sweep. */
  const setIDegManual = useCallback(
    (v: number) => {
      setSweeping(false)
      setIDeg(v)
    },
    [setIDeg],
  )
  const nudge = useCallback((dir: -1 | 1, big: boolean) => setIDegManual(iDeg + dir * (big ? 5 : 1)), [iDeg, setIDegManual])

  useSweep({ enabled: sweeping, paused: dragging, value: iDeg, min: I_MIN, max: I_MAX, degPerSec: SWEEP_DEG_PER_SEC, onChange: setIDeg })

  const questions = useMemo(() => reflectionQuiz({ setIDeg: setIDegManual, setShowImage }), [setIDegManual])

  const distanceCm = (SOURCE_RADIUS * Math.cos((iDeg * Math.PI) / 180)) / 10

  return (
    <SectionLayout
      title="Reflection"
      subtitle="Plane mirror. Drag the source (or sweep the angle) and compare the angle of incidence with the angle of reflection."
      keyIdea={<>Light bounces off a mirror so that the angle of incidence equals the angle of reflection, both measured from the normal.</>}
      stage={
        <ReflectionDiagram
          iDeg={iDeg}
          showImage={showImage}
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
            <Slider label="Angle of incidence i" value={iDeg} min={I_MIN} max={I_MAX} step={0.1} unit="°" onChange={setIDegManual} hint="Drag the yellow source on the stage, or focus it and use ← → (Shift for 5° steps)." />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={sweeping ? 'primary' : 'ghost'} active={sweeping} onClick={() => setSweeping((s) => !s)} aria-pressed={sweeping}>
                {sweeping ? 'Stop sweep' : 'Auto-sweep 0° → 89°'}
              </Button>
              {sweeping && <Badge tone="info">{dragging ? 'paused while dragging' : `sweeping ${SWEEP_DEG_PER_SEC}°/s`}</Badge>}
            </div>
            <Toggle label="Show the image of the source" checked={showImage} onChange={setShowImage} hint="Mirrors the source to S′ behind the mirror and traces the reflected ray back to it." />
          </div>
        </Card>
      }
      readouts={
        <Card title="Live values">
          <ReadoutGrid>
            <Readout label="Angle of incidence" hint="from the normal" value={fmtDeg(iDeg)} tone="accent" />
            <Readout label="Angle of reflection" hint="from the normal" value={fmtDeg(iDeg)} tone="warn" />
            <Readout label="Difference i − r" value={fmtDeg(0)} tone="ok" />
            <Readout label="Angle between the two rays" hint="i + r = 2i" value={fmtDeg(2 * iDeg)} />
            <Readout label="Angle between ray and mirror" hint="90° − i (glancing angle)" value={fmtDeg(90 - iDeg)} />
            {showImage && (
              <>
                <Readout label="Source in front of the mirror" value={fmt(distanceCm, 1)} unit="cm" />
                <Readout label="Image behind the mirror" value={fmt(distanceCm, 1)} unit="cm" tone="accent" />
              </>
            )}
          </ReadoutGrid>
          <div className="mt-3 space-y-3">
            <FormulaCard
              title="Law of reflection"
              symbolic="∠i = ∠r"
              substituted={`${fmtDeg(iDeg)} = ${fmtDeg(iDeg)}`}
              note="Laws of reflection: the incident ray, reflected ray and normal lie in the same plane; angle of incidence equals angle of reflection."
              tone="ok"
            />
            <Legend
              items={[
                { color: RAY_COLORS.incident, label: 'Incident ray' },
                { color: RAY_COLORS.reflected, label: 'Reflected ray' },
                { color: RAY_COLORS.normal, label: 'Normal', dashed: true },
                { color: RAY_COLORS.virtual, label: 'Virtual ray (to the image)', dashed: true, muted: !showImage },
              ]}
            />
          </div>
        </Card>
      }
      quiz={<QuizCard questions={questions} />}
    />
  )
}
