# Light Lab

Interactive optics for high-school physics. Drag a light source, slide a lens, change the glass, and watch the rays, angles and formulas update together.

**Live site:** https://light-lab.ninadnaik.me/

![Light Lab demo screenshot](image.png)

## What's inside

Light Lab has six sections, one per topic in a typical high-school light chapter. Every section follows the same layout:

- **Key idea:** the concept in one or two sentences.
- **Stage:** a ray diagram you can drag.
- **Controls:** sliders, presets and toggles.
- **Live values:** every quantity on the diagram, plus the governing formula written out symbolically and again with the current numbers substituted in.
- **Quiz:** short multiple-choice questions. Each answer explains why it is right or wrong, and a **Show me** button sets the diagram to that question's scenario.

### Reflection

- A plane mirror with a draggable source. The angle of incidence and the angle of reflection stay equal as you move it.
- Readouts for the angle between the two rays (2i) and the glancing angle (90° − i).
- An optional image of the source behind the mirror, with the reflected ray traced back to it, showing that the image is as far behind the mirror as the source is in front.
- **Auto-sweep** runs the angle from 0° to 89° on its own.

### Refraction

- Choose the two media from presets (vacuum, air, ice, water, glycerin, crown glass, flint glass, diamond) or set any refractive index.
- Snell's law (n₁ sin i = n₂ sin r) is written out with the live numbers, so both sides visibly match.
- A label tells you whether the ray bends toward or away from the normal, along with the speed of light in each medium (v = c / n) and the fraction of light partially reflected at the surface.
- **Swap media** reverses the direction of travel. When the angle gets too large, the section flags total internal reflection and links to the next topic.

### Total internal reflection

- Light starts in the denser medium. The critical angle is shown as a reference line and worked out from sin θc = n₂ / n₁.
- A status banner moves through **Refraction**, **Critical** and **TIR** as the angle grows. Readouts show the reflected and transmitted percentages reaching 100 % and 0 %.
- **Set i = θc** jumps straight to the critical angle. The auto-sweep slows down near it, so you can watch the refracted ray flatten along the surface and disappear.
- **Optical fibre demo:** adjust the core and cladding indices and the launch angle to see when light stays trapped in the fibre.

### Dispersion

- White light, or a single wavelength from 400 to 700 nm, passes through a prism of crown or flint glass. You can change the apex angle, the entry point and the angle of incidence.
- Readouts for the refractive index of red and violet light, each colour's deviation, and the angular spread between them. The deviation formula δ = i + e − A is shown with live numbers.
- **Set to minimum deviation** moves the ray to the symmetric path through the prism.
- **Dispersion boost** (×1 to ×5) exaggerates the colour spread so the fan is easy to see. The diagram clearly labels when the boost is on, and ×1 shows real glass.
- **Rainbow in a raindrop:** trace a sunbeam through a water drop with one reflection (primary bow) or two (secondary bow).
- **Blue sky, red sunset:** change the sun's height to see how scattering of light by the air (Rayleigh scattering) changes the colour of the sky.

### Spherical mirrors and lenses

- Concave and convex mirrors, and convex and concave lenses. Drag the object, or set the focal length, object distance and object height with sliders.
- Toggle the standard construction rays one by one: the ray parallel to the axis, the ray through the focus, the ray through the centre, and (for mirrors) the ray hitting the pole.
- A **zone bar** marks the object positions (for a concave mirror: beyond C, at C, between C and F, at F, and between P and F; the lens zones use F and 2F). Click a zone to move the object there.
- An **image summary table** lists the image's position, nature, orientation and size for every zone and highlights the current row.
- The mirror formula (1/v + 1/u = 1/f), the lens formula (1/v − 1/u = 1/f) and magnification are shown with signed live numbers. Lenses also show power in dioptres.
- **Compare** puts the two element types side by side for the same object.

## How it helps high-school students

Most textbook optics is taught with static diagrams. Light Lab turns each diagram into something students can change, which helps in a few specific ways.

- **Rules become things you can see.** "Bends toward the normal in a denser medium" is easier to believe after dragging the source and watching it happen at every angle, and after pressing **Swap media** to watch it reverse.
- **Formulas stay attached to the picture.** Every formula card shows the symbolic form and the same formula with the current numbers substituted. Students can check by hand that n₁ sin i really equals n₂ sin r, or that 1/v − 1/u equals 1/f, for the exact diagram in front of them.
- **The thresholds are visible.** Total internal reflection, minimum deviation, and an object placed exactly at F are moments a textbook picture can show only once. Here, students can sweep up to the threshold, cross it, and come back.
- **"Learn the table" becomes "explore the table".** For mirrors and lenses, the zone bar and summary table connect where the object is to what the image is like. Students can move the object through every zone and see why the table says what it says, instead of memorising rows.
- **The sign convention is always shown.** Distances are signed according to the New Cartesian sign convention, with a hint on each readout explaining the sign. This targets one of the commonest sources of errors in mirror and lens problems.
- **Quizzes link back to the diagram.** After answering a question, **Show me** sets up that exact situation on the stage, so the explanation comes with a picture.
- **Everyday applications are included.** Optical fibres, rainbows, blue skies and red sunsets connect each topic to something students have seen.

It works on phones (down to 375 px wide) and with a keyboard: the sliders are standard controls, and draggable points can be moved with the arrow keys (Shift for larger steps). If the device asks for reduced motion, the flowing-dash animation on the rays is switched off.

**Conventions:** angles are measured from the normal, distances are in cm, and mirrors and lenses use the New Cartesian sign convention (object distance u is negative, a concave mirror has f < 0, a convex lens has f > 0).

## Development

Built with Vite, React 19, TypeScript, Tailwind CSS v4 and Vitest. The diagrams are hand-drawn SVG.

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest unit tests for the optics math in src/lib
npm run typecheck
npm run build      # type check + production build into dist/
```

- `src/sections/`: one folder per topic.
- `src/lib/`: the tested physics (Snell's law, Fresnel reflectance, prism and raindrop ray tracing, mirror and lens imaging).
- `src/components/`: shared SVG and UI pieces.

[CONTRACTS.md](CONTRACTS.md) documents the shared components, the physics conventions and the rules for interactions.

## Deployment

The site is hosted on Vercel as the `light-lab` project. To deploy to production, run:

```bash
vercel --prod
```
