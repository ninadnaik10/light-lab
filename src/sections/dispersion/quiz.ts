import type { QuizQuestion } from '../../components/ui'
import type { GlassId } from '../../lib/optics'

export type DispersionSetters = {
  setMode: (m: 'white' | 'mono') => void
  setGlass: (g: GlassId) => void
  setLambda: (nm: number) => void
  setBoost: (b: number) => void
  /** Set i to the minimum-deviation angle for the given glass/boost (uses the 550 nm ray). */
  setToMinDeviation: (glass: GlassId, boost: number) => void
}

export function dispersionQuiz({ setMode, setGlass, setLambda, setBoost, setToMinDeviation }: DispersionSetters): QuizQuestion[] {
  return [
    {
      id: 'most-bent',
      prompt: 'White light passes through a glass prism. Which colour bends (deviates) the most?',
      options: [
        { label: 'Red', explain: 'Red has the longest wavelength, so the glass has its smallest n for red and bends it least.' },
        { label: 'Green', explain: 'Green is in the middle of the spectrum, so it is deviated by a middling amount.' },
        { label: 'Violet', correct: true, explain: 'Violet has the shortest wavelength, so n is largest for violet: it is slowed most and bends most at each face.' },
        { label: 'They all bend equally', explain: 'If every colour bent equally there would be no spectrum. n depends on wavelength, so each colour bends by a different amount.' },
      ],
      applyScenario: () => {
        setMode('white')
        setGlass('crown')
        setBoost(3)
        setToMinDeviation('crown', 3)
      },
    },
    {
      id: 'flint-vs-crown',
      prompt: 'You swap the crown-glass prism for a flint-glass prism of the same shape. The spectrum on the screen becomes…',
      options: [
        { label: 'narrower', explain: 'Flint glass is more dispersive than crown glass, so its spectrum is not narrower.' },
        { label: 'wider', correct: true, explain: 'Flint glass has a bigger change of n between red and violet (a larger Cauchy B), so the colours fan out more and the band is wider.' },
        { label: 'the same width', explain: 'The width depends on how strongly n changes with wavelength, which differs between glasses.' },
        { label: 'reversed, with red at the top', explain: 'The order of the colours is set by which bends more (violet always bends most); the glass type only changes the spread.' },
      ],
      applyScenario: () => {
        setMode('white')
        setGlass('flint')
      },
    },
    {
      id: 'monochromatic',
      prompt: 'A beam of single-colour (monochromatic) light passes through the same prism. It will…',
      options: [
        { label: 'split into a spectrum', explain: 'A spectrum needs several wavelengths. One wavelength has one value of n, so there is nothing to split.' },
        { label: 'deviate but not split', correct: true, explain: 'The beam still refracts at both faces and comes out deviated toward the base, but with a single wavelength there is only one n, so it stays one colour.' },
        { label: 'pass straight through undeviated', explain: 'Every colour refracts at the faces, so the beam is deviated even though it is not split.' },
        { label: 'be completely absorbed', explain: 'Clear glass transmits visible light; the prism bends it rather than absorbing it.' },
      ],
      applyScenario: () => {
        setMode('mono')
        setLambda(550)
      },
    },
  ]
}
