import type { RayRole } from '../../lib/imaging'
import type { ElementKind } from '../../lib/optics'

export const KIND_TITLE: Record<ElementKind, string> = {
  'concave-mirror': 'Concave mirror',
  'convex-mirror': 'Convex mirror',
  'convex-lens': 'Convex lens',
  'concave-lens': 'Concave lens',
}

export const ROLE_LABEL: Record<RayRole, string> = {
  parallel: 'Parallel ray',
  focal: 'Focal ray',
  centre: 'Centre ray',
  pole: 'Pole ray',
}

/** One-line rule for each construction ray, worded per element. */
export function roleHint(role: RayRole, kind: ElementKind): string {
  switch (kind) {
    case 'concave-mirror':
      return { parallel: 'Parallel to the axis → reflects through F', focal: 'Through F → reflects parallel to the axis', centre: 'Through C → retraces its own path', pole: 'Hits the pole → reflects symmetrically about the axis' }[role]
    case 'convex-mirror':
      return { parallel: 'Parallel to the axis → reflects as if from F behind the mirror', focal: 'Aimed at F behind the mirror → reflects parallel', centre: 'Aimed at C behind the mirror → retraces its own path', pole: 'Hits the pole → reflects symmetrically about the axis' }[role]
    case 'convex-lens':
      return { parallel: 'Parallel to the axis → refracts through F₂', focal: 'Through F₁ → emerges parallel to the axis', centre: 'Through O → goes straight, undeviated', pole: '' }[role]
    case 'concave-lens':
      return { parallel: 'Parallel to the axis → diverges as if from F₁', focal: 'Aimed at F₂ → emerges parallel to the axis', centre: 'Through O → goes straight, undeviated', pole: '' }[role]
  }
}
