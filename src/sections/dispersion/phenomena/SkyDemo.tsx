import { useId, useMemo, useState } from 'react'
import { Label, Stage, useStage } from '../../../components/svg'
import { Readout, ReadoutGrid, Slider } from '../../../components/ui'
import { wavelengthToRGB } from '../../../lib/color'
import { rayleighRelative, rayleighTransmission } from '../../../lib/droplet'
import { clamp, fmt } from '../../../lib/format'
import { BAR_SAMPLES, BEAM, SKY_STAGE, airMassFor, scatterDots, skyColour, sunColour, type ScatterDot } from './skyModel'

export function SkyDemo() {
  const [elevation, setElevation] = useState(90)
  const model = useMemo(() => {
    const airMass = airMassFor(elevation)
    return { airMass, sun: sunColour(airMass), sky: skyColour(airMass), dots: scatterDots(airMass), t450: rayleighTransmission(450, airMass), t700: rayleighTransmission(700, airMass) }
  }, [elevation])
  const maxRel = rayleighRelative(BAR_SAMPLES[0].nm)

  return (
    <div className="space-y-4">
      <Stage viewBox={SKY_STAGE} ariaLabel="Rayleigh scattering of sunlight in air">
        <SkyScene elevation={elevation} sun={model.sun} sky={model.sky} dots={model.dots} />
      </Stage>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Slider label="Sun height above the horizon" value={elevation} min={0} max={90} step={1} unit="°" onChange={(v) => setElevation(clamp(Math.round(v), 0, 90))} hint="90° = noon overhead, 0° = sunrise / sunset" />
          <div>
            <div className="mb-1 flex items-baseline justify-between text-xs text-slate-400">
              <span>Relative scattering strength</span>
              <span className="font-mono">∝ 1/λ⁴</span>
            </div>
            <div className="flex h-24 items-end gap-2">
              {BAR_SAMPLES.map((s) => {
                const rel = rayleighRelative(s.nm)
                return (
                  <div key={s.nm} className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1 font-mono text-[10px] text-slate-300">×{fmt(rel, 1)}</span>
                    <div className="w-full rounded-t" style={{ height: `${(rel / maxRel) * 80}%`, background: wavelengthToRGB(s.nm) }} />
                  </div>
                )
              })}
            </div>
            <div className="mt-1 grid grid-cols-5 text-center text-[10px] text-slate-400">
              {BAR_SAMPLES.map((s) => (
                <span key={s.nm}>
                  {s.name}
                  <br />
                  {s.nm} nm
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <ReadoutGrid>
            <Readout label="Sun elevation" value={`${fmt(elevation, 0)}°`} />
            <Readout label="Air-mass factor" hint="path length through air relative to noon" value={`×${fmt(model.airMass, 1)}`} tone="accent" />
            <Readout label="Transmitted at 450 nm (blue)" value={`${fmt(model.t450 * 100, 0)} %`} tone={model.t450 < 0.3 ? 'warn' : 'default'} />
            <Readout label="Transmitted at 700 nm (red)" value={`${fmt(model.t700 * 100, 0)} %`} />
          </ReadoutGrid>
          <p className="text-sm leading-relaxed text-slate-300">
            Air molecules scatter short wavelengths far more (∝ 1/λ⁴), so scattered skylight is blue. At sunset the light travels through much more air, most of the blue is scattered away before it
            reaches you, and the sun looks orange-red.
          </p>
        </div>
      </div>
    </div>
  )
}

function SkyScene({ elevation, sun, sky, dots }: { elevation: number; sun: string; sky: string; dots: ScatterDot[] }) {
  const { unitsPerPx: upp } = useStage()
  const beamGrad = useId()
  const compact = upp > 1.8
  const horizonY = 245
  const sunY = 100 + (1 - elevation / 90) * 90
  const sunX = 640
  const sunR = 44

  return (
    <g>
      <defs>
        <linearGradient id={beamGrad} gradientUnits="userSpaceOnUse" x1={BEAM.x1} y1={0} x2={BEAM.x2} y2={0}>
          <stop offset={0} stopColor="#f8fafc" stopOpacity={0.4} />
          <stop offset={1} stopColor={sun} stopOpacity={0.45} />
        </linearGradient>
      </defs>

      {/* Left half: beam through air with scattered light */}
      <rect x={BEAM.x1} y={BEAM.yTop} width={BEAM.x2 - BEAM.x1} height={BEAM.yBottom - BEAM.yTop} fill={`url(#${beamGrad})`} />
      <line x1={BEAM.x1} y1={BEAM.yTop} x2={BEAM.x2} y2={BEAM.yTop} stroke="#f8fafc" strokeOpacity={0.35} strokeWidth={1 * upp} />
      <line x1={BEAM.x1} y1={BEAM.yBottom} x2={BEAM.x2} y2={BEAM.yBottom} stroke="#f8fafc" strokeOpacity={0.35} strokeWidth={1 * upp} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r * upp} fill={d.color} fillOpacity={0.9} />
      ))}
      <Label x={BEAM.x1 + 8 * upp} y={BEAM.yTop - 14 * upp} text="white sunlight →" anchor="start" color="#f8fafc" sizePx={11} />
      {!compact && <Label x={BEAM.x2 - 4 * upp} y={BEAM.yBottom + 14 * upp} text="light that gets through" anchor="end" color={sun} sizePx={10} />}
      <Label x={(BEAM.x1 + BEAM.x2) / 2} y={SKY_STAGE.h - 18 * upp} text="air molecules scatter mostly blue light" color="#93c5fd" sizePx={11} />

      <line x1={480} y1={30} x2={480} y2={SKY_STAGE.h - 30} stroke="#334155" strokeWidth={1 * upp} strokeDasharray={`${4 * upp} ${6 * upp}`} />

      {/* Right half: what you see */}
      <line x1={560} y1={horizonY} x2={725} y2={horizonY} stroke="#64748b" strokeWidth={1.4 * upp} />
      <circle cx={sunX} cy={sunY} r={sunR * 1.5} fill={sun} fillOpacity={0.25} filter="url(#glow)" />
      <circle cx={sunX} cy={sunY} r={sunR} fill={sun} />
      <Label x={sunX} y={horizonY + 16 * upp} text="the Sun you see" color="#e2e8f0" sizePx={11} />
      <rect x={750} y={60} width={130} height={horizonY - 60} rx={8} fill={sky} />
      <Label x={815} y={horizonY + 16 * upp} text="the sky you see" color="#e2e8f0" sizePx={11} />
    </g>
  )
}
