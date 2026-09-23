import { useState } from 'react'
import { Card, Segmented } from '../../../components/ui'
import { RainbowDemo } from './RainbowDemo'
import { SkyDemo } from './SkyDemo'

type View = 'rainbow' | 'sky'

/** Two everyday phenomena that follow from wavelength-dependent optics: rainbows (dispersion in water) and sky colours (Rayleigh scattering). */
export function PhenomenaPanel() {
  const [view, setView] = useState<View>('rainbow')
  return (
    <Card title="Dispersion and scattering in the sky">
      <div className="space-y-4">
        <Segmented
          ariaLabel="Phenomenon"
          options={[
            { label: 'Rainbow in a raindrop', value: 'rainbow' },
            { label: 'Blue sky, red sunset', value: 'sky' },
          ]}
          value={view}
          onChange={setView}
        />
        {view === 'rainbow' ? <RainbowDemo /> : <SkyDemo />}
      </div>
    </Card>
  )
}
