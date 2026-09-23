import type { QuizQuestion } from '../../components/ui'

export type RefractionScenario = (n1: number, n2: number, iDeg: number) => void

const AIR = 1.0003
const WATER = 1.333

/** Predict-then-reveal questions for the Refraction section. `apply` drives the diagram for "Show me". */
export function refractionQuestions(apply: RefractionScenario): QuizQuestion[] {
  return [
    {
      id: 'air-glass-30',
      prompt: 'Light goes from air into glass (n = 1.5) at 30°. The angle of refraction is…',
      options: [
        { label: 'Exactly 30°: the angle never changes', explain: 'The angle only stays the same when both media have the same index.' },
        { label: 'About 19.5°', correct: true, explain: 'sin r = (1.0 × sin 30°) / 1.5 = 0.333, so r ≈ 19.5°: the ray bends toward the normal.' },
        { label: 'About 48.6°', explain: 'That would be bending away from the normal, which happens when light enters a rarer medium.' },
      ],
      applyScenario: () => apply(AIR, 1.5, 30),
    },
    {
      id: 'water-air-bend',
      prompt: 'Light goes from water into air. It bends…',
      options: [
        { label: 'Toward the normal', explain: 'Bending toward the normal happens when light slows down in a denser medium.' },
        { label: 'Away from the normal', correct: true, explain: 'Air is rarer than water, so light speeds up and swings away from the normal (r > i).' },
        { label: 'Not at all', explain: 'Only a ray along the normal, or equal indices, gives no bending.' },
      ],
      applyScenario: () => apply(WATER, AIR, 30),
    },
    {
      id: 'along-normal',
      prompt: 'A ray hits the surface along the normal (i = 0°). It…',
      options: [
        { label: 'Bends toward the normal', explain: 'It is already on the normal: there is nowhere to bend toward.' },
        { label: 'Passes straight through with no bending', correct: true, explain: 'sin 0° = 0, so Snell’s law gives r = 0°. The light slows down but its direction is unchanged.' },
        { label: 'Is totally reflected', explain: 'Total internal reflection needs a large angle in the denser medium, not i = 0°.' },
      ],
      applyScenario: () => apply(AIR, 1.5, 0),
    },
  ]
}
