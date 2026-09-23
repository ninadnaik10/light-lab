import type { QuizQuestion } from '../../components/ui'
import type { ElementKind } from '../../lib/optics'

export type ImagingSetters = {
  setKind: (k: ElementKind) => void
  setFMag: (f: number) => void
  setUMag: (u: number) => void
  setH: (h: number) => void
}

/** Predict-then-reveal questions. "Show me" drives the diagram through the setters. */
export function makeImagingQuiz(family: 'mirror' | 'lens', s: ImagingSetters): QuizQuestion[] {
  const scenario = (kind: ElementKind, uMag: number, fMag = 10) => () => {
    s.setKind(kind)
    s.setFMag(fMag)
    s.setUMag(uMag)
    s.setH(4)
  }

  if (family === 'mirror') {
    return [
      {
        id: 'mirror-between-c-f',
        prompt: 'An object is placed between F and C of a concave mirror. The image is…',
        options: [
          { label: 'Between F and C, real, inverted and diminished', explain: 'That is what happens when the object is beyond C, not between C and F.' },
          { label: 'Beyond C, real, inverted and magnified', correct: true, explain: 'Object between C and F → image beyond C: real, inverted and magnified (like a shaving mirror held far away).' },
          { label: 'Behind the mirror, virtual, erect and magnified', explain: 'A virtual, erect, magnified image needs the object between P and F.' },
          { label: 'At C, real and the same size', explain: 'Same-size images only happen with the object exactly at C.' },
        ],
        applyScenario: scenario('concave-mirror', 15),
      },
      {
        id: 'mirror-convex-always',
        prompt: 'A convex mirror always gives an image that is…',
        options: [
          { label: 'Real, inverted and diminished', explain: 'Reflected rays from a convex mirror diverge, so they never meet in front to form a real image.' },
          { label: 'Virtual, erect and magnified', explain: 'A convex mirror never magnifies; only a concave mirror with the object inside F does.' },
          { label: 'Virtual, erect and diminished, behind the mirror', correct: true, explain: 'Whatever the object distance, a convex mirror forms a virtual, erect, diminished image between P and F behind the mirror. That is why it is used as a rear-view mirror.' },
          { label: 'Real, erect and the same size', explain: 'Real images from a single mirror are always inverted; and a convex mirror never forms a real image.' },
        ],
        applyScenario: scenario('convex-mirror', 20),
      },
      {
        id: 'mirror-same-size',
        prompt: 'Where must you place an object in front of a concave mirror to get an image of the same size?',
        options: [
          { label: 'At F', explain: 'At F the reflected rays come out parallel, so the image is at infinity.' },
          { label: 'At C (the centre of curvature)', correct: true, explain: 'At C, u = 2f gives v = 2f and m = −1: a real, inverted image of the same size, right on top of the object.' },
          { label: 'Between P and F', explain: 'Between P and F the image is virtual, erect and magnified.' },
          { label: 'Beyond C', explain: 'Beyond C the image is diminished.' },
        ],
        applyScenario: scenario('concave-mirror', 20),
      },
    ]
  }

  return [
    {
      id: 'lens-inside-f',
      prompt: 'An object is 5 cm from a convex lens of focal length 10 cm. The image is…',
      options: [
        { label: 'Real, inverted, 10 cm on the other side', explain: '1/v = 1/f + 1/u = 1/10 − 1/5 is negative, so v is negative: the image is on the same side as the object.' },
        { label: 'Virtual, erect and magnified, on the same side as the object', correct: true, explain: 'Object inside F₁ → v = −10 cm, m = +2: a virtual, erect, magnified image on the object side. This is how a magnifying glass works.' },
        { label: 'At infinity', explain: 'The image goes to infinity only when the object is exactly at F₁ (10 cm here).' },
        { label: 'Real, erect and diminished', explain: 'A real image from a single lens is always inverted, and it forms only when the object is beyond F₁.' },
      ],
      applyScenario: scenario('convex-lens', 5),
    },
    {
      id: 'lens-concave-always',
      prompt: 'A concave lens always forms…',
      options: [
        { label: 'A real, inverted image beyond 2F₂', explain: 'A concave lens spreads rays out, so they never meet on the other side to form a real image.' },
        { label: 'A virtual, erect, diminished image between O and F₁', correct: true, explain: 'For every object position a concave lens gives a virtual, erect, diminished image between O and F₁ on the object side.' },
        { label: 'A virtual, erect, magnified image', explain: 'Magnified virtual images come from a convex lens with the object inside F₁.' },
        { label: 'An image at infinity', explain: 'Only a converging element with the object at its focus sends the image to infinity.' },
      ],
      applyScenario: scenario('concave-lens', 20),
    },
    {
      id: 'lens-at-2f',
      prompt: 'For a convex lens, an object at 2F₁ gives an image at…',
      options: [
        { label: 'F₂, highly diminished', explain: 'The image is at F₂ only for an object at infinity.' },
        { label: 'Infinity', explain: 'The image is at infinity only when the object is at F₁.' },
        { label: '2F₂, the same size and inverted', correct: true, explain: 'u = −2f gives v = +2f and m = −1: a real, inverted image of the same size at 2F₂.' },
        { label: 'Between F₂ and 2F₂, diminished', explain: 'That happens for an object beyond 2F₁, not exactly at it.' },
      ],
      applyScenario: scenario('convex-lens', 20),
    },
  ]
}
