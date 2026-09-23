import type { QuizQuestion } from '../../components/ui'
import { criticalAngleDeg } from '../../lib/optics'

export type TirScenario = (n1: number, n2: number, iDeg: number) => void

const AIR = 1.0003
const WATER = 1.333
const GLASS = 1.5

/** Predict-then-reveal questions for the TIR section. `apply` drives the diagram for "Show me". */
export function tirQuestions(apply: TirScenario): QuizQuestion[] {
  return [
    {
      id: 'glass-air-45',
      prompt: 'Light in glass (n = 1.5) hits the surface with air at 45°. What happens?',
      options: [
        { label: 'It refracts out into the air, bending away from the normal', explain: 'That only happens below the critical angle.' },
        { label: 'It grazes along the surface', explain: 'Grazing happens exactly at the critical angle, 41.8°, not above it.' },
        { label: 'Total internal reflection: none of it escapes', correct: true, explain: 'θc = sin⁻¹(1/1.5) = 41.8°. Since 45° > 41.8°, sin r would exceed 1, so all the light reflects.' },
      ],
      applyScenario: () => apply(GLASS, AIR, 45),
    },
    {
      id: 'water-air-critical',
      prompt: 'The critical angle for water → air is about…',
      options: [
        { label: '41.8°', explain: 'That is the value for glass (n = 1.5) → air.' },
        { label: '48.6°', correct: true, explain: 'sin θc = 1 / 1.333 = 0.750, so θc ≈ 48.6°.' },
        { label: '90°', explain: '90° would mean light can never escape, which is not the case for water.' },
      ],
      applyScenario: () => apply(WATER, AIR, criticalAngleDeg(WATER, AIR) ?? 48.6),
    },
    {
      id: 'fibre',
      prompt: 'Optical fibres carry light around bends because…',
      options: [
        { label: 'the core absorbs the light and re-emits it further along', explain: 'Absorption would lose the signal, not carry it.' },
        {
          label: 'each time light meets the core–cladding boundary at an angle larger than the critical angle it reflects totally',
          correct: true,
          explain: 'The core is denser than the cladding, so shallow-angle light meets the wall beyond θc and is totally reflected again and again with no loss.',
        },
        { label: 'the cladding is coated with a metal mirror', explain: 'No metal is needed: total internal reflection at the glass–glass boundary does the job with far less loss.' },
      ],
      applyScenario: () => apply(GLASS, 1.4, 80),
    },
  ]
}
