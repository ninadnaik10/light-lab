import { Card, SectionLayout } from '../components/ui'
import { Stage } from '../components/svg'

/** Temporary stand-in used until a section is implemented. */
export function Placeholder({ title }: { title: string }) {
  return (
    <SectionLayout
      title={title}
      keyIdea="This section is being built."
      stage={
        <Stage viewBox={{ w: 900, h: 480 }} ariaLabel={`${title} placeholder`}>
          <text x={450} y={240} fill="#94a3b8" fontSize={20} textAnchor="middle">
            {title} — coming soon
          </text>
        </Stage>
      }
      controls={<Card title="Controls">—</Card>}
      readouts={<Card title="Live values">—</Card>}
    />
  )
}
