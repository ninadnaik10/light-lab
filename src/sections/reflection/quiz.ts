import type { QuizQuestion } from '../../components/ui'

export type ReflectionSetters = {
  setIDeg: (v: number) => void
  setShowImage: (v: boolean) => void
}

export function reflectionQuiz({ setIDeg, setShowImage }: ReflectionSetters): QuizQuestion[] {
  return [
    {
      id: 'ray-to-mirror',
      prompt: 'If the angle of incidence is 35°, what is the angle between the reflected ray and the mirror surface?',
      options: [
        { label: '35°', explain: '35° is the angle of reflection, but that is measured from the normal, not from the mirror.' },
        { label: '55°', correct: true, explain: 'r = i = 35° from the normal, and the normal is 90° from the mirror, so the ray makes 90° − 35° = 55° with the mirror.' },
        { label: '70°', explain: '70° is the angle between the incident and reflected rays (2i), not the angle with the mirror.' },
        { label: '90°', explain: 'Only a ray along the normal (i = 0°) would leave at 90° to the mirror.' },
      ],
      applyScenario: () => setIDeg(35),
    },
    {
      id: 'double-angle',
      prompt: 'You double the angle of incidence from 20° to 40°. The angle between the incident and reflected rays…',
      options: [
        { label: 'stays the same', explain: 'The gap between the two rays is i + r = 2i, so it changes with i.' },
        { label: 'doubles from 40° to 80°', correct: true, explain: 'The rays are separated by i + r = 2i. At 20° that is 40°; at 40° it is 80°.' },
        { label: 'goes from 20° to 40°', explain: 'That is the angle of incidence itself. The angle between the rays is twice that, i + r.' },
        { label: 'halves', explain: 'A bigger angle of incidence spreads the two rays further apart, not closer.' },
      ],
      applyScenario: () => setIDeg(40),
    },
    {
      id: 'image-distance',
      prompt: 'How far behind a plane mirror is your image if you stand 2 m in front of it?',
      options: [
        { label: '1 m', explain: 'The image is not half-way; it sits exactly as far behind the mirror as you are in front.' },
        { label: '2 m', correct: true, explain: 'A plane mirror forms a virtual image the same distance behind the mirror as the object is in front, so 2 m.' },
        { label: '4 m', explain: '4 m is the distance from you to your image; the image itself is 2 m behind the mirror.' },
        { label: 'It depends on the size of the mirror', explain: 'Mirror size changes how much of the image you can see, not where the image is.' },
      ],
      applyScenario: () => {
        setShowImage(true)
        setIDeg(30)
      },
    },
  ]
}
