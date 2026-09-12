# ADR 0023: Principles & Design System Alignment Pass

## Status
Accepted

## Context
Following milestones M1 through M22, the engine achieved complete astronomical and visual capabilities across all 8 observatory windows. However, rapid evolutionary iteration introduced subtle drift between persistent specifications ([`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md), [`docs/MATH_SPEC.md`](../MATH_SPEC.md)) and component implementations:

1. **Mathematical Domain & Coordinate Discrepancies**:
   - Terrestrial subsolar and sublunar ground track longitudes were derived in `frame.ts` via $\lambda = \operatorname{wrap180}(\alpha - \text{GMST})$ but lacked formal grounding in Section 2.D of `MATH_SPEC.md`.
   - Conversions between the 3D Astronomical Scene Graph ($\mathcal{F}_{\text{scene}}$, $Z$-up) and the Gyro-Morph Armillary continuum ($\mathcal{F}_{\text{arm}}$, $Y$-up) were performed ad-hoc rather than through an explicit, unit-tested bijective matrix.
   - The Axial Sightline camera depth sorting formula cited in `MATH_SPEC.md` used positive cosine depth ($\cos(\text{phaseRad}) \cdot R_x$), inverting near-side vs far-side occlusion relative to the background Sun.

2. **Vector Stroke & Layout Parity**:
   - The Eclipse Demonstrator's side-on Syzygy profile (`ShadowRayDiagram.tsx`) was documented on an obsolete $340 \times 220$ canvas, whereas the unified implementation operates on a symmetrical $520 \times 220$ layout sharing an identical $y=110$ ecliptic baseline with `NodalPlaneVisualizer.tsx`.
   - Applying Macro Orbit halo tokens ($r = 11 \to 18\text{px}$) in unprojected SVG space to the compact $300 \times 300$ Armillary canvas caused milestones to appear detached and fly across the viewport during 3D camera rotations.
   - `MiniGlobe` lacked documentation for its complete 3-tier twilight strata including the $-18^\circ$ Astronomical Twilight limb curve (`astroPath`, `#0f172a`).

3. **Semantic Color Tokens & Glassmorphic Standardization**:
   - Time tracks in the Orbital Chronometer and Astrolabe Dial used inconsistent Indigo tones instead of semantic Sky Blue (`#38bdf8`).
   - Polar Longitude Selector dials and city presets used Indigo instead of canonical Longitude Amber (`#f59e0b`).
   - Active cursor indicators and selected phases in Solar and Lunar Ribbon Charts used generic red (`#ef4444`) instead of semantic Rose Red (`#f43f5e`).
   - Today's diurnal transit chord in `SunMeridianDome` used pale amber `#fbbf24` without glow, diverging from the glowing warm gold `#f59e0b` chord in `SunElevationDome`.

---

## Decisions

### 1. Terrestrial Ground Track Longitude Formulation
Codified in `MATH_SPEC.md` Section 2.D.3 the exact terrestrial sub-body ground track longitude:
\[
\lambda_{\text{geo}} = \operatorname{wrap180}(\alpha - \text{GMST}) = ((((\alpha - \text{GMST} + 540^\circ) \bmod 360^\circ) + 360^\circ) \bmod 360^\circ) - 180^\circ
\]
mapping directly into $[-180^\circ, +180^\circ]$ (positive East). When $\alpha = \text{GMST}$, the body culminates over the Greenwich Prime Meridian ($\lambda_{\text{geo}} = 0^\circ$).

### 2. Bijective Scene Graph $\longleftrightarrow$ Armillary Frame Involution Matrix
Implemented and unit-tested pure conversion utilities `transformSceneToArmillary` and `transformArmillaryToScene` in `sceneMath.ts`:
\[
\mathbf{M}_{\text{scene}\to\text{arm}} = \mathbf{M}_{\text{arm}\to\text{scene}} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & 1 & 0 \end{pmatrix}, \quad \mathbf{M}_{\text{scene}\leftrightarrow\text{arm}}^2 = \mathbf{I}_3
\]
guaranteeing lossless, zero-drift coordinate conversion across the 3D scene graph and armillary continuum.

### 3. Symmetrical Dual-Pane Eclipse Viewport Parity
Standardized both panes of the Eclipse Demonstrator on `viewBox="0 0 520 220"` ($26:11$ aspect ratio) with an aligned horizontal ecliptic plane at $y = 110$:
- **Left Transverse Pane (`ShadowRayDiagram.tsx` / `LiveSyzygyView.tsx`)**: Sun light source at $X_\odot = 50, R_\odot = 28\text{px}$; Earth center at $(X_\oplus, Y_\oplus) = (310, 110), R_\oplus = 18\text{px}$; transverse orbit $R_x = 85\text{px}$.
- **Right Axial Pane (`NodalPlaneVisualizer.tsx`)**: Concentric background Sun at $(260, 110), R_\odot = 46\text{px}$; foreground Earth at $(260, 110), R_\oplus = 24\text{px}$; axial orbit $R_x = 150\text{px}$.

### 4. Axial Sightline Depth Sign Standard
Codified depth along the Sun-Earth sightline as:
\[
\text{depth} = -\cos(\text{phaseRad}) \cdot R_x
\]
where $\text{depth} > 0$ represents the viewer-side near hemisphere (Full Moon at $+R_x$ in front of Earth towards camera/shadows) and $\text{depth} \le 0$ represents the far side (New Moon at $-R_x$ behind Earth towards the background Sun).

### 5. Dedicated Armillary Milestone Tokens & 3D Camera Projection
Separated milestone halo tokens by canvas scale and coordinate frame:
- **Macro Orbit ($580 \times 560$)**: Screen-space halos with base $r = 11\text{px}$ expanding to $18\text{px}$ on hover.
- **Gyro-Morph Armillary ($300 \times 300$)**: 3D camera-projected halos with base $r = 4.5\text{px}$ expanding to $7.0\text{px}$ on hover, anchored strictly to the rotated 3D ellipse.

### 6. Harmonized Warm Gold Glowing Diurnal Chords
Standardized `SunMeridianDome` today's diurnal chord on warm gold `#f59e0b` at `strokeOpacity: 0.95` with a `3.5px` blurred SVG glow underlayer at `0.25` opacity, achieving visual parity with `SunElevationDome`. Added solid `#f59e0b` twilight continuation down to $-18^\circ$.

### 7. Semantic Color Token Standard
- **Time Tracks**: Standardized to Sky Blue `#38bdf8` (`text-sky-400`, `focus:ring-sky-500/40`).
- **Longitude & Sun Tracks**: Standardized to Warm Amber/Gold `#f59e0b` (`fill-amber-400`, `bg-amber-500 text-slate-950 font-bold`).
- **Active Cursors & Lunar Phases**: Standardized to Rose Red `#f43f5e`.
- **High Tide Indicator**: Standardized to Sky Blue `#38bdf8`.
- **Contrast Overlays**: Added `drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]` to horizon cardinal labels and zenith markers.

---

## Consequences

### Positive
- **Zero Documentation Drift**: `MATH_SPEC.md`, `DESIGN_SYSTEM.md`, `README.md`, and `AGENTS.md` are in complete 1:1 agreement with the live code.
- **Visual Consistency**: Consistent color grammar across all 8 observatory windows ensures immediate intelligibility of time, space, and celestial bodies.
- **Mathematical Rigor**: All frame conversions, ground track coordinates, and depth orderings are backed by closed-form equations and deterministic unit tests.

### Test Coverage
- Total tests expanded to **600 tests across 40 test suites**.
- 0 TypeScript compiler diagnostics (`tsc --noEmit`).
- 80/80 UI components conform to branded unit safety AST guardrails (`0` illegal unit calls).
- Production build passes in $< 600\text{ms}$.
