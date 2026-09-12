# ADR 0017: Quad-View Celestial Meridian Profiles & Multi-Perspective Horizon Observatory

## Status
Accepted (Extended by ADR 0021 and ADR 0022)

> [!NOTE]
> **Evolutionary Scope**: The Quad-View $2 \times 2$ observatory matrix, 3D direction cosine diurnal projections, Approach C parked ghost anchors, and central ribbon architecture remain authoritative.
> Note that solstice arcs were bifurcated into distinct milestone arcs and extended below the horizon into twilight ($h \ge -18^\circ$) in [ADR 0021](0021-meridian-profile-solstice-bifurcation-and-subhorizon-twilight-kinematics.md), and polar horizon baselines were rectified to longitudinal colures in [ADR 0022](0022-polar-directional-singularity-rectification.md).

## Context

The **Today's Sky Horizon Subsystem** ([`SkyDomeBase.tsx`](../../src/components/widgets/today/SkyDomeBase.tsx), [`SunElevationDome.tsx`](../../src/components/widgets/today/SunElevationDome.tsx), [`MoonElevationDome.tsx`](../../src/components/widgets/today/MoonElevationDome.tsx)) originally rendered a 2-dome view capturing the diurnal elevation arcs of the Sun and Moon from East to West across the observer's sky.

While diurnal paths depict altitude variations as a function of hour angle, they compress the North–South celestial meridian into a single culmination point. Observers could not visualize:
1. **The Annual Solstice Migration Corridor**: How the Sun's daily noon culmination migrates across a $\Delta \delta = 46.88^\circ$ arc between the Summer and Winter Solstices along the local meridian ($S \longleftrightarrow Z \longleftrightarrow N$).
2. **The 18.6-Year Major Lunar Standstill & Monthly Nodal Swaths**: How the Moon's culmination varies monthly over an envelope of up to $\sim 57^\circ$, bounded by the 18.6-year nodal precession cycle ($\pm 28.58^\circ$).
3. **Sub-Horizon Sighting When Celestial Bodies Are Not in View**: A clear visual indicator showing where the Sun and Moon reside when below the observer's horizon without visual clutter or distracting pulsating animations.

---

## Decisions

### 1. Symmetrical Quad-View $2 \times 2$ Matrix & Segmented Mode Control
- Implemented a segmented control `[ 2-Dome Diurnal | ⊞ 4-Dome Quad ]` in [`TodayHorizonView.tsx`](../../src/components/widgets/today/TodayHorizonView.tsx).
- `2-Dome` diurnal view remains the default (`initialDomeMode = '2-dome'`).
- In `4-Dome` mode, the layout expands to a coordinated $2 \times 2$ observatory matrix:
  - **Left Column (Sun)**: `SunElevationDome` (Diurnal East $\to$ West) stacked above `SunMeridianDome` (Meridian South $\longleftrightarrow$ Zenith $\longleftrightarrow$ North).
  - **Right Column (Moon)**: `MoonElevationDome` (Diurnal East $\to$ West) stacked above `MoonMeridianDome` (Meridian South $\longleftrightarrow$ Zenith $\longleftrightarrow$ North).

### 2. Meridian Coordinate Projection & Polar Axis Geometry
Implemented in [`src/utils/cosmicMath/todaySky.ts`](../../src/utils/cosmicMath/todaySky.ts):
- **Coordinate Mapping (`calculateMeridianPoint`)**:
  - Maps topocentric altitude $h$ and culmination bearing (South vs. North vs. Zenith) along the canonical $R=92$ semicircle:
    \[
    \theta_{\text{South}} = 180^\circ - h, \quad \theta_{\text{North}} = h, \quad \theta_{\text{Zenith}} = 90^\circ
    \]
    where South is at $\theta = 180^\circ$ (Left, 9 o'clock), Zenith is at $\theta = 90^\circ$ (Top, 12 o'clock), and North is at $\theta = 0^\circ$ (Right, 3 o'clock).
- **Vertical Zenith Axis**: Added `showZenithAxis` prop to [`SkyDomeBase.tsx`](../../src/components/widgets/today/SkyDomeBase.tsx), drawing a dashed vertical axis from $(X=130, Y=104)$ straight up to $(X=130, Y=12)$ with $+90^\circ$ apex label.
- **Custom Horizon Baseline Labels**: Extended `SkyDomeBase` with `leftHorizonLabel="S"`, `centerHorizonLabel="Z"`, and `rightHorizonLabel="N"`.

### 3. Swath Arcs & Perpendicular Radial Tick Pins
- **Dome Perimeter Swaths (`generateMeridianSwathD`)**: Generates swept circular arc SVG path commands (`A 92 92 0 0 0`) along the dome perimeter between minimum and maximum culmination angles.
- **Perpendicular Radial Ticks (`calculateMeridianRadialTick`)**: Computes exact radial pins crossing the $R=92$ perimeter (e.g. from $R=86$ to $R=98$) to mark Solstices, Equinox, Standstill extrema, and Ecliptic Node Crossings without floating label collisions.

### 4. Continuous 3D Diurnal Colure Kinematics & Today's Diurnal Chord
Rather than artificial vertical drops to the origin, the Meridian Profile domes render true 3D orbital kinematics projected onto the observer's North–South celestial colure:
- **Colure Direction Cosine Projection (`calculateMeridianDiurnalPoint`)**:
  Projects 3D topocentric direction cosines $(y_{\text{north}}, z_{\text{zenith}})$ directly into SVG canvas coordinates:
  \[
  y_{\text{north}}(H) = \cos\phi \sin\delta - \sin\phi \cos\delta \cos H
  \]
  \[
  z_{\text{zenith}}(H) = \sin\phi \sin\delta + \cos\phi \cos\delta \cos H
  \]
  \[
  X = CX + R \cdot y_{\text{north}}, \quad Y = CY - R \cdot z_{\text{zenith}}
  \]
  where $CX = 130$, $CY = 104$, $R = 92$, South is Left ($X < CX$), and North is Right ($X > CX$).
- **Today's Diurnal Chord (`calculateMeridianDiurnalChord`)**:
  Connects the body's rise endpoint, meridian culmination, and setting/twilight endpoints as an inclined chord with constant slope $\frac{dY}{dX} = \cot\phi$. At meridian culmination ($H = 0$), the chord touches the circular dome perimeter $R = 92$ tangentially ($y_{\text{north}}^2 + z_{\text{zenith}}^2 = 1$).
  - **Sun**: Daytime segment ($h \ge 0^\circ$) rendered in solid gold (`#fbbf24`, $1.5\text{px}$); sub-horizon twilight segment ($0^\circ > h \ge -18^\circ$) rendered in dashed deep amber (`#d97706`, $1.0\text{px}$, `strokeDasharray="2 2"`).
  - **Moon**: Daytime segment rendered in solid silver (`#e2e8f0`) or nodal color (`#38bdf8` / `#f43f5e`).
- **Approach C: Parked Ghost Anchors**:
  Because $y_{\text{north}}$ and $z_{\text{zenith}}$ depend on $\cos H$, the side-on projection exhibits morning/evening symmetry ($\cos H = \cos(-H)$). Sinking past the physical observation gate would cause the bead to reverse direction and slide back toward culmination during deep night ($H \to 180^\circ$).
  Under **Approach C**:
  - **Sun Twilight Gate**: When the Sun sinks below $-18^\circ$ astronomical twilight ($z_{\text{zenith}} \le \sin(-18^\circ)$), the active bead parks cleanly at the static twilight gate anchor (`#sun-twilight-gate-anchor`, $R=3.5\text{px}$, `#64748b` dashed) as a subdued ghost bead (`#1e293b` fill, dashed stroke, $0.35$ opacity).
  - **Moon Horizon Gate**: Because atmospheric twilight is strictly a solar phenomenon, the Moon's physical observational boundary is the horizon ($z_{\text{zenith}} \le 0$). When sub-horizon, the active Moon bead parks at the static horizon gate anchor (`#moon-horizon-gate-anchor`).
  - Active beads remain parked until rising back across their respective gates in the morning, eliminating deep-night reverse sliding.

### 5. Central Ribbon Architecture & Single Unified Mode Toggles
- **Hoisted Single Unified Mode Toggles**:
  Moved the `[ Std | Twilight ]` and `[ Std | ☊ Nodes ]` mode controls to the top level of [`TodayHorizonView.tsx`](../../src/components/widgets/today/TodayHorizonView.tsx). A single toggle controls both the upper diurnal elevation arc and lower meridian profile in lockstep, eliminating duplicate buttons.
- **Central Ribbon Footer Consolidation**:
  In 4-window expansion mode, duplicate footer bars are completely eliminated:
  - **Upper Cards (`isQuadMode={true}`)**: Expand their summary footers into a consolidated 4-column responsive grid (`grid-cols-4 gap-2`) housing Solstice Span ($\Delta\delta = 46.9^\circ$), Summer/Winter Peak readouts, Standstill Span ($\Delta\delta = 57.2^\circ$), Monthly Range, and the unified mode toggles.
  - **Lower Meridian Cards (`hideFooter={true}`)**: Strip redundant footers entirely, rendering borderless flush bottom domes that seamlessly extend the upper instrument viewports without visual clutter.

### 6. Branded Unit Safety & Performance Invariants
- 100% compliance with branded unit safety guardrails: zero `asDegrees()` or `asRadians()` casts in UI components.
- Zero floating labels on canvas arcs: all bounds and limits are communicated via tick pins, native tooltips, and dedicated stats strips below the domes.

---

## Consequences & Invariants

* **Comprehensive Spherical Perspective**: Observers can monitor both the diurnal East-to-West transit and the North-South meridian profile simultaneously in a unified $2 \times 2$ layout.
* **Continuous Physical Kinematics**: Celestial bodies glide along their actual 3D diurnal orbits with linear colure projection, touching culmination tangentially and parking at exact physical gates ($-18^\circ$ twilight for the Sun, $0^\circ$ horizon for the Moon).
* **Information Architecture Elegance**: Central Ribbon footer consolidation and unified hoisted mode toggles eliminate all duplicated stats and redundant controls.
* **Clean Vector Aesthetics**: The elimination of redundant info boxes and floating text labels preserves full visual harmony with the Cosmic Engine design system.
* **Full Test Coverage**: Validated with 532 passing unit tests across 38 suites, strict TypeScript compilation, and AST unit safety verification.
