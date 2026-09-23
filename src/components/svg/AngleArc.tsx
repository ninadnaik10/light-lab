import { add, angleBetweenDeg, arcPathBetweenDirs, bisector, scale, type Vec2 } from '../../lib/geometry'
import { Label } from './Label'
import { useStage } from './Stage'

export type AngleArcProps = {
  vertex: Vec2
  /** Unit (or any) direction vectors from the vertex to each arm. */
  dirA: Vec2
  dirB: Vec2
  /** Radius in viewBox units. */
  radius: number
  color: string
  label: string
  /** Hide the arc (label only) when the angle is smaller than this (deg). */
  minDeg?: number
  /** Distance factor for the label along the bisector (default 1.45). */
  labelFactor?: number
  /** Where to put the label if the arc is hidden. */
  fallbackLabelDir?: Vec2
}

/** Angle arc between two directions with a live label placed on the bisector. */
export function AngleArc({ vertex, dirA, dirB, radius, color, label, minDeg = 4, labelFactor = 1.45, fallbackLabelDir }: AngleArcProps) {
  const { unitsPerPx } = useStage()
  const angle = angleBetweenDeg(dirA, dirB)
  const bis = angle < minDeg && fallbackLabelDir ? fallbackLabelDir : bisector(dirA, dirB)
  const lp = add(vertex, scale(bis, radius * labelFactor))
  return (
    <g>
      {angle >= minDeg && (
        <path d={arcPathBetweenDirs(vertex, radius, dirA, dirB)} fill="none" stroke={color} strokeWidth={1.6 * unitsPerPx} strokeOpacity={0.9} />
      )}
      <Label x={lp.x} y={lp.y} text={label} color={color} sizePx={13} weight={600} bg />
    </g>
  )
}
