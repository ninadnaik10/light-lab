# Light Lab: shared contracts for section implementers

Read this before touching any section. Shared code (everything outside `src/sections/`) is
**read-only** for section agents. If you need a shared change, describe it in your final report
instead of editing the shared file. Do not install new npm packages.

## Project

- Vite 8 + React 19 + TypeScript (strict, `noUnusedLocals`), Tailwind CSS v4 (utility classes only,
  dark theme, slate palette), Vitest for pure math. Commands: `npm run dev` (already running on
  http://localhost:5173), `npm run typecheck`, `npm test`, `npm run build`.
- Routing: `src/App.tsx` lazily imports `src/sections/<Name>Section.tsx`. Each section file
  **default-exports a React component with no props**. Hash ids: `#reflection`, `#refraction`,
  `#tir`, `#dispersion`, `#mirrors`, `#lenses`.
- Physics conventions: angles in degrees measured from the normal; **New Cartesian** signs for
  mirrors/lenses (origin at pole / optical centre, light travels left → right, object distance
  `u < 0`, concave mirror `f < 0`, convex mirror `f > 0`, convex lens `f > 0`, concave lens `f < 0`).
  Mirror: `1/v + 1/u = 1/f`, `m = −v/u`. Lens: `1/v − 1/u = 1/f`, `m = v/u`. Distances in cm.
- Use the Unicode minus sign `−` in displayed numbers (the `fmt*` helpers do this).

## Layout: `SectionLayout` (src/components/ui/SectionLayout.tsx)

```tsx
<SectionLayout
  title="Refraction" subtitle="…"
  keyIdea={<>One or two sentences of the core concept.</>}
  stage={<Stage …>…</Stage>}
  controls={<Card title="Controls">…</Card>}
  readouts={<Card title="Live values">…</Card>}
  quiz={<QuizCard questions={QUESTIONS} />}
  below={/* optional full-width content under the stage: zone bar, compare readouts, fibre demo */}
/>
```

## SVG primitives (src/components/svg, import from `../components/svg`)

All coordinates are **viewBox units**. Sizes given in CSS px are converted internally through the
`unitsPerPx` context so text and handles stay readable on phones. Inside a `<Stage>`, use
`const { unitsPerPx } = useStage()` (or `const px = usePx()`) whenever you set a font size,
stroke width or radius yourself: `strokeWidth={2 * unitsPerPx}`.

| Component | Props | Notes |
|---|---|---|
| `Stage` | `{ viewBox: {w,h}, ariaLabel, className?, children }` | Owns the `<svg>`; provides context for `useDrag`. Use `viewBox={{ w: 900, h: 480 }}` for main stages. |
| `Ray` | `{ from, to, color, variant?: 'real'\|'virtual'\|'guide', opacity?, flow?, fast?, arrowhead?, widthPx? }` | `from` = where the light comes FROM (dashes flow toward `to`). Real = solid + animated dashes; virtual = static dashes; guide = dotted grey. |
| `Arrowhead` | `{ from, to, color, opacity?, t?, sizePx? }` | Small direction triangle at parameter `t` along a segment. |
| `AngleArc` | `{ vertex, dirA, dirB, radius, color, label, minDeg?, labelFactor?, fallbackLabelDir? }` | Pass direction vectors, not angles. Label sits on the bisector. Arc hidden below `minDeg` (4°). |
| `Label` | `{ x, y, text, color?, sizePx?, anchor?, weight?, bg?, mono?, opacity? }` | Constant on-screen size text; `bg` draws a dark pill. |
| `DragHandle` | `{ pos, onDrag(p), onDragStart?, onDragEnd?, color?, ariaLabel, label?, labelOffset?, hitRadiusPx?, onNudge?(dir, big) }` | Glowing draggable dot. `onDrag` receives viewBox coords; you clamp/convert to your state. Implement `onNudge` for keyboard arrows. |
| `NormalLine` | `{ at, dir, halfLength, color? }` | Dashed normal through a point. |
| `MediumRegion` | `{ x, y, w, h, n, label, color?, labelAnchor? }` | Tinted medium rect; opacity grows with n. |
| `ArrowFigure` | `{ base, tip, color, dashed?, label?, labelSide?, opacity? }` | Object / image arrow. `dashed` for virtual images. |
| `MirrorShape` | `{ kind: 'concave'\|'convex', pole, halfHeight, color? }` | Schematic mirror, hatched back on the right. |
| `LensShape` | `{ kind: 'convex'\|'concave', centre, halfHeight, color? }` | Schematic lens. |
| `AxisMarkers` | `{ y, x1, x2, points: {label, x, behind?, color?}[], labelBelow? }` | Principal axis with ticks. |

Shared `<defs>` available inside any Stage: `filter="url(#glow)"`, `fill="url(#hatch)"`.

## UI components (src/components/ui, import from `../components/ui`)

`Card {title?, children, action?, tone?: 'default'|'accent'}`, `Slider {label, value, min, max, step, onChange, unit?, format?, disabled?, hint?}`
(range + synced number input), `PresetChips {options: {label, value}[], value, onSelect, tolerance?}`,
`Toggle {label, checked, onChange, hint?}`, `Segmented {options: {label, value}[], value, onChange}`,
`Button {variant?: 'primary'|'ghost'|'danger', active?, size?}`, `Readout {label, value, unit?, hint?, tone?}`,
`ReadoutGrid {cols?}`, `FormulaCard {title?, symbolic, substituted?, result?, note?, tone?}`, `Frac {num, den}`,
`Badge {tone: 'info'|'ok'|'warn'|'danger'|'neutral'|'violet', size?}`, `Legend {items: {color, label, dashed?, muted?}[]}`,
`QuizCard {questions: QuizQuestion[]}` where
`QuizQuestion = { id, prompt, options: { label, correct?, explain }[], applyScenario?: () => void }`.
Put each section's questions in `src/sections/<name>/quiz.ts` (or next to the section) as a
function that receives setters so `applyScenario` can drive the visualization.

## Hooks (src/hooks)

- `useDrag(onMove, {onStart?, onEnd?}) → { onPointerDown, dragging }` — used by `DragHandle`; you rarely need it directly.
- `useSweep({ enabled, paused?, value, min, max, degPerSec, onChange, slowNear?: {at, within, factor}, step? })` —
  rAF ping-pong animation writing through `onChange`. Turn `enabled` off on any manual input (slider/drag) so the user wins.
- `useReducedMotion()` — boolean.

## Pure math (src/lib) — all tested, use these instead of re-deriving

- `geometry.ts`: `Vec2`, `Ray {origin, dir}`, `Segment {a,b}`, `Rect`; `add sub scale dot cross length dist normalize perp lerp negate`,
  `degToRad radToDeg fromAngle fromAngleDeg angleOf angleBetweenDeg`, `reflect(d, n)`, `refract(d, n, n1, n2) | null`,
  `intersectRaySegment`, `intersectRayVerticalLine`, `intersectRayHorizontalLine`, `intersectLines`, `clipRayToRect(ray, rect)`,
  `pointToLineDistance`, `pointInPolygon`, `arcPathBetweenDirs`, `bisector`.
- `optics.ts`: `snellAngle(n1,n2,iDeg) | null`, `criticalAngleDeg(n1,n2) | null`, `fresnelReflectance(n1,n2,iDeg)` (0..1, =1 at TIR),
  `speedRatio`, `speedInMedium(n)`, `SPEED_OF_LIGHT`; `ElementKind`, `isMirror`, `isConverging`, `signedFocalLength(kind, fMag)`,
  `mirrorImage(u,f)`, `lensImage(u,f)`, `imageFor(kind,u,fMag) → { v, m, atInfinity, virtual }`, `lensPowerDioptres(fCm)`;
  `GlassId = 'crown'|'flint'|'water'`, `GLASSES`, `cauchyIndex(glass, nm, boost=1)`, `prismDeviationDeg(i,e,A)`,
  `prismMinDeviationDeg(n,A) | null`, `prismIncidenceForMinDeviation(n,A) | null`.
- `imaging.ts`: `ZoneId`, `classifyZone(kind, u, fMag, tol)` (UI should pass `tol = 0.25`), `natureFor(kind, zone) → ImageNature`,
  `RayRole = 'parallel'|'focal'|'centre'|'pole'`, `axisPoints(kind, fMag)`,
  `constructionRays(kind, u, h, fMag, { roles, elementHalfHeight }) → { rays: ConstructionRay[], dropped, image, imageTip, imageBase, f }`.
  Each `ConstructionRay` = `{ role, preGuide?, incident, hit, outgoing: Ray, aimGuide?, virtualExtension? }` in **world cm**;
  draw `incident` as real, `outgoing` as real from `hit` to the stage edge (`clipRayToRect` with `worldBounds(viewport)`),
  `preGuide`/`aimGuide` as guide, `virtualExtension` as virtual.
- `prism.ts`: `tracePolygon(ray, poly, nInside, nOutside, { bounds, maxBounces? }) → { segments, events, exitRay, deviationDeg, standardPath, missed }`,
  `prismPolygon(apexDeg, apex, height, up=-1)` → `[apex, baseRight, baseLeft]` (left face is edge 2), `entryPointOnLeftFace(poly, frac)`,
  `incidentRayForAngle(entry, outwardNormal, iDeg, sourceDistance, side)`, `outwardNormal(poly, i)`.
- `droplet.ts`: `traceDroplet(ray, center, radius, n, { bounds, reflections = 1, nOutside = 1 }) → { segments, events, exitRay, deviationDeg, rainbowAngleDeg, missed }`,
  `rainbowAngle(n, k) → { incidenceDeg, impact, deviationDeg, rainbowAngleDeg } | null` (≈42.1° for k=1, ≈50.8° for k=2 with n=1.333),
  `impactForIncidence(iDeg)`, `rayleighRelative(nm)` (∝ 1/λ⁴ relative to 550 nm), `rayleighTransmission(nm, pathFactor, k = 0.1)`.
- `viewport.ts`: `Viewport {cx, cy, scale, w, h}`, `toScreen`, `toWorld`, `worldBounds`, `MIRROR_VIEWPORT` (900×480, pole at x=600, 10 px/cm),
  `LENS_VIEWPORT` (centre at x=450).
- `color.ts`: `wavelengthToRGB(nm)`, `RAY_COLORS` (incident, reflected, refracted, normal, virtual, guide, parallel, focal, centre, pole, object, realImage, virtualImage, glass), `ZONE_COLORS`.
- `format.ts`: `fmt(x, digits)`, `fmtSigned`, `fmtDeg`, `fmtParen` (wraps negatives: `1/(−15.0)`), `clamp`, `roundTo`.
- `data/media.ts`: `MEDIA` presets `{id, label, n}`, `mediumLabelFor(n)`.

## Visual language

Incident rays `RAY_COLORS.incident` (yellow), reflected `reflected` (orange), refracted `refracted` (cyan), normal grey dashed,
virtual rays/images violet, object arrow emerald, real image rose. Real light flows; virtual never flows. Labels use `Label`
with `bg` when they sit over rays. Keep stage padding ≥ 24 px so labels do not clip.

## Interaction rules

1. One source of truth per adjustable quantity (e.g. `iDeg`). Slider, number input, drag handle, sweep and quiz "Show me" all write it.
2. Any manual input stops a running sweep.
3. Drag handles clamp to their allowed region (a source stays in its medium; the object never crosses the element).
4. Live readouts update on every change; show the governing formula symbolically **and** with substituted numbers via `FormulaCard`.
5. Everything must work at 375 px width (stack) and with keyboard (sliders are native; handles support arrow keys via `onNudge`).

## File ownership (Phase B)

| Agent | Owns (create/edit freely) |
|---|---|
| A | `src/sections/ReflectionSection.tsx`, `src/sections/reflection/**`, `src/sections/DispersionSection.tsx`, `src/sections/dispersion/**` (incl. `phenomena/`) |
| B → D | `src/sections/RefractionSection.tsx`, `src/sections/refraction/**` (incl. `phenomena/`), `src/sections/TirSection.tsx`, `src/sections/tir/**` |
| C | `src/sections/MirrorsSection.tsx`, `src/sections/LensesSection.tsx`, `src/sections/imaging/**`, `src/data/zones.ts` |

Never edit files owned by another agent or any shared file. Duplication inside your own folder is acceptable.

## Verification tooling (headless Chrome via playwright-core, no extension needed)

- `node scripts/visual.mjs shot <hash> <out.png> [--mobile] [--full]`, `node scripts/visual.mjs all [--mobile]`, `node scripts/visual.mjs eval <hash> "<js>"`.
- `node scripts/interact.mjs drag|text|click|toggle|slider <hash> …` (see the file header for arguments).

## Acceptance before reporting done

- `npm run typecheck` clean; `npm test` still green; no runtime console errors on your section.
- Drag, slider and sweep agree; readouts match the numbers in the plan's verification list.
- Renders at 375 px without horizontal scroll; labels legible.
