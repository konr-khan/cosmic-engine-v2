# ADR 0017: Quad-View Celestial Meridian Profiles & Multi-Perspective Horizon Observatory

## Status
Accepted

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

### 4. Real-Time Vertical & Radial Kinematics (No Pulsing/Zooming)
- **Above Horizon ($h(t) \ge 0^\circ$)**: Active beads ascend/descend radially along the culmination spoke from $(130, 104)$ to peak at culmination ($h = h_{\text{peak}}$).
- **Below Horizon ($h(t) < 0^\circ$)**: Active beads drop vertically from $(130, 104)$ into the sub-horizon twilight strata ($Y \in [104, 132.4]$) with a ghosted vertical dashed guide line and $0.45$ opacity, providing a natural visual cue of position when not in view.
- Removed all `animate-ping` and pulsing/zooming animations across both meridian views for serene visual stability.
- `SkyDomeBase` keeps `isVisible = true` when `showZenithAxis` is true, ensuring continuous sub-horizon bead visibility down to deep night.

### 5. Interactive Mode Toggles & Redundancy Elimination
- **Sun Meridian Dome**: Includes `[ Std | Twilight ]` segmented toggle. In Twilight mode, sub-horizon atmospheric twilight bands (Civil $-6^\circ$, Nautical $-12^\circ$, Astronomical $-18^\circ$) are projected.
- **Moon Meridian Dome**: Includes `[ Std | ☊ Nodes ]` segmented toggle. In Nodal mode, the Moon bead and swaths adopt Eclipse-convention coloring (Sky Blue `#38bdf8` for $\beta \ge 0^\circ$ North of ecliptic, Rose Red `#f43f5e` for $\beta < 0^\circ$ South of ecliptic), an Ecliptic Node Crossing pin (☊/☋) is rendered, and live nodal telemetry is displayed.
- **Information Architecture De-duplication**: Stripped redundant AU distance, Equation of Time, and duplicate snap buttons from meridian domes. Footer bars are strictly non-redundant and display meridian-specific geometry:
  - Sun: `Solstice Span (Δδ 46.9°)`, `Summer Peak`, `Winter Peak`, and `Mode View`.
  - Moon: `Standstill Span (Δδ 57.2°)`, `Monthly Range`, `Nodal State`, and `Mode View`.

### 6. Branded Unit Safety & Performance Invariants
- 100% compliance with branded unit safety guardrails: zero `asDegrees()` or `asRadians()` casts in UI components.
- Zero floating labels on canvas arcs: all bounds and limits are communicated via tick pins, native tooltips, and dedicated stats strips below the domes.

---

## Consequences & Invariants

* **Comprehensive Spherical Perspective**: Observers can monitor both the diurnal East-to-West transit and the North-South meridian profile simultaneously in a unified $2 \times 2$ layout.
* **Sub-Horizon Grace**: Both diurnal and nocturnal phases are clearly depicted with vertical elevation descent into twilight strata.
* **Clean Vector Aesthetics**: The elimination of redundant info boxes and floating text labels preserves full visual harmony with the Cosmic Engine design system.
* **Full Test Coverage**: Validated with 518 passing unit tests across 38 suites, strict TypeScript compilation, and AST unit safety verification.
