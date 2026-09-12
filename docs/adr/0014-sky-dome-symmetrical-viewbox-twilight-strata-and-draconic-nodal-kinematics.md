# ADR 0014: Sky Dome Symmetrical ViewBox, Atmospheric Twilight Strata, Bottom Footer Toggle Relocation & Draconic Nodal Kinematics

## Status
Accepted (Extended by ADR 0016, ADR 0017, and ADR 0022)

> [!NOTE]
> **Evolutionary Scope**: Symmetrical `viewBox="0 0 260 138"` parity, shared `<SkyDomeBase />` geometry, atmospheric twilight strata colors, and the centered $\pm 15$-day Draconic progress micro-rail remain foundational.
> Note that culmination bearings were enhanced in [ADR 0016](0016-dynamic-sighting-aware-horizon-dome-and-tropical-culmination.md), the system expanded into a 4-Dome Quad view in [ADR 0017](0017-quad-view-celestial-meridian-profiles.md), and polar horizon baselines were rectified to longitudinal colures in [ADR 0022](0022-polar-directional-singularity-rectification.md).

## Context
During user experience and visual inspection of the **Today's Sky Horizon Dome** widget ([`TodayWidget.tsx`](../../src/components/widgets/today/TodayWidget.tsx)), seven geometric, ergonomic, and physical discrepancies were identified between the Sun dome ([`SunElevationDome.tsx`](../../src/components/widgets/today/SunElevationDome.tsx)) and Moon dome ([`MoonElevationDome.tsx`](../../src/components/widgets/today/MoonElevationDome.tsx)):

1. **Asymmetrical Viewport Geometry**:
   - The Sun Elevation Dome operated on `viewBox="0 0 260 120"`, while the Moon Elevation Dome operated on `viewBox="0 0 260 138"` to accommodate its monthly declination excursion range.
   - This vertical asymmetry caused baseline misalignment and visual jarring when viewing the domes side by side.

2. **Twilight Strata Color Inconsistency**:
   - In [`SunElevationDome.tsx`](../../src/components/widgets/today/SunElevationDome.tsx), twilight elevation bands used inconsistent color schemes compared to the rest of the observatory (specifically the **Solar Almanac Ribbon Chart** and **Daylight Terminator Map**).
   - Civil twilight used bright amber (`#fbbf24`), nautical twilight used intermediate slate, and astronomical twilight lacked harmonious contrast.

3. **Header Clutter & Misaligned Card Heights from Top Mode Toggles**:
   - Initial toggle buttons (`[Std | Twilights]` on Sun, `[Std | ☊ Nodes]` on Moon) were placed in the widget card headers next to titles and actions.
   - This crowded the header area and broke horizontal visual alignment with other cards across the 12-column responsive dashboard grid.

4. **Ambiguous Nocturnal Sub-Horizon Dashed Trajectories**:
   - When celestial paths dipped below the horizon, dashed strokes (`strokeDasharray="3 3"`) were initially rendered.
   - However, in Cosmic Engine's design system (established in ADR-0007, ADR-0010, and ADR-0012 for the Eclipse Demonstrator and Tides Widget), dashed strokes have strict physical meaning: they denote **waning lunar phase** ($180^\circ \to 360^\circ$ elongation).
   - Using dashed strokes for sub-horizon diurnal paths collided with phase semantics, confusing users inspecting nocturnal waning vs. waxing transits.

5. **Loss of Serene Lunar Visual Identity**:
   - Applying dual-perspective eclipse nodal colors (Sky Blue `#38bdf8` for North vs. Rose Red `#f43f5e` for South) indiscriminately across all moon states stripped the Moon dome of its calm astronomical silver (`#e2e8f0`) aesthetic during standard observation.

6. **Distant Upcoming Node Pin Buzzing During Recent Crossings**:
   - When the Moon crossed a node (e.g., crossing the Descending Node at $18:05\text{Z}$ on 9/09/2026), the system initially looked solely forward for the *next* upcoming node.
   - At $02:08\text{Z}$ on 9/10/2026 (mere hours after the crossing), the next node was the Ascending Node $12.6\text{ days}$ in the future.
   - Because the algorithm checked only future time distance without gating against past proximity, it immediately displayed the blue Ascending Node with a "crossing today" tag, despite the event being nearly two weeks away.

7. **Static Disconnected Draconic Nodal Rail**:
   - The original draconic rail in the lunar modal mapped argument of latitude $F \in [0^\circ, 360^\circ)$ linearly across an arbitrary horizontal track.
   - This representation lacked temporal perspective, failing to indicate whether a node was approaching or receding relative to the observer's present time ($T=0$).

---

## Decisions

### 1. Unified Symmetrical `viewBox="0 0 260 138"` Parity
* Standardized both [`SunElevationDome.tsx`](../../src/components/widgets/today/SunElevationDome.tsx) and [`MoonElevationDome.tsx`](../../src/components/widgets/today/MoonElevationDome.tsx) on `viewBox="0 0 260 138"`.
* Retained canonical baseline coordinates across all shared geometry in [`SkyDomeBase.tsx`](../../src/components/widgets/today/SkyDomeBase.tsx):
  \[
  CX = 130, \quad CY = 104, \quad R = 92
  \]
* Both domes now share identical horizon baselines, cardinal compass ticks (E, S, W), unreachable zenith markers, and $34\text{px}$ sub-horizon vertical headroom ($Y \in [104, 138]$).

### 2. Cross-Widget Atmospheric Twilight Strata Harmonization
* Harmonized twilight band colors in `SunElevationDome.tsx` with [`SolarRibbonChart.tsx`](../../src/components/widgets/solar/SolarRibbonChart.tsx) and [`TerminatorMap.tsx`](../../src/components/widgets/terminator/TerminatorMap.tsx):
  - **Daylight**: Amber / Gold (`#fbbf24`).
  - **Civil Twilight** ($-0.833^\circ \to -6^\circ$): Warm Golden Amber (`#f59e0b`).
  - **Nautical Twilight** ($-6^\circ \to -12^\circ$): Slate Navy (`#64748b`).
  - **Astronomical Twilight** ($-12^\circ \to -18^\circ$): Deep Indigo Slate (`#334155`).
  - **Night** ($< -18^\circ$): Deep Space Slate (`#020617`).

### 3. Footer Metric Relocation & 4-Column Panel (`grid-cols-4`)
* Relocated mode toggle controls out of card headers and into the 4th slot of the bottom summary metrics panel:
  - **Sun Dome**: `[Sunrise/Sunset | Solar Noon | Declination | [Std | Twilights]]`
  - **Moon Dome**: `[Moonrise/Moonset | Lunar Transit | Declination | [Std | ☊ Nodes]]`
* Restructured footer containers into a clean 4-column responsive grid (`grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80`).
* Card headers now retain clean, uncluttered titles, time readouts, and celestial actions (**Snap Solar Noon**, **Moon Phase popover**).

### 4. Lunar Arc Visual Fidelity & Mode Separation
* In **Standard (`Std`) Mode**:
  - The Moon's diurnal elevation arc renders in serene lunar silver (`#e2e8f0`, $1.2\text{px}$ width).
  - Preserves clean astronomical observational focus without distracting nodal color splits.
* In **Nodal (`☊ Nodes`) Mode**:
  - Adopts the canonical Eclipse Demonstrator and Tides Widget color and stroke encodings:
    - **Sky Blue (`#38bdf8`)**: Moon is North of Ecliptic ($\beta \ge 0$, Ascending).
    - **Rose Red (`#f43f5e`)**: Moon is South of Ecliptic ($\beta < 0$, Descending).
    - **Solid Stroke**: Waxing Moon ($0^\circ \le \text{elongation} < 180^\circ$).
    - **Dashed Stroke (`strokeDasharray="4 3"`)**: Waning Moon ($180^\circ \le \text{elongation} < 360^\circ$).

### 5. Continuous Sub-Horizon Nocturnal Trajectory Styling
* Eliminated dashed strokes for nocturnal sub-horizon paths.
* When celestial bodies traverse below the horizon ($Y > 104, h < 0^\circ$):
  - Retain **solid stroke** (`strokeDasharray = undefined`).
  - Subdue visibility using pure opacity: `strokeOpacity: 0.20` with `strokeWidth="1.0"`.
* Prevents collision with waning phase dashed encoding while maintaining clear diurnal path continuity below the horizon line.

### 6. Strict 24-Hour Crossing Gate & Nearest Node Targeting
* Replaced forward-only node tracking with bilateral nearest-node solver in [`calculateSkyDomeLunarNodes`](../../src/utils/cosmicMath/todaySky.ts):
  \[
  d_{\text{nearest}} = \min(t_{\text{next}}, t_{\text{prev}})
  \]
  where $t_{\text{next}}$ is days to upcoming node and $t_{\text{prev}}$ is days since previous node.
* Formulated the node crossing threshold:
  \[
  \text{isNearNode} = (d_{\text{nearest}} \le 1.0\text{ days}) \lor (|\beta| \le 0.8^\circ)
  \]
* Display logic evaluates `nearestNodeType` and `nearestNode`:
  - When $t_{\text{prev}} < t_{\text{next}}$, the system correctly attributes the active crossing to the node just crossed rather than jumping ahead to a distant node.
  - Node markers on the sky dome are strictly gated: they render only when `nearestNodeDistDays <= 1.0`, completely eliminating on-dome node buzzing across the lunar month.

### 7. Centered $\pm 15$-Day Draconic Progress Micro-Rail
* Redesigned the Draconic Nodal Rail in `MoonElevationDome.tsx` into a centered, rolling $\pm 15$-day lookback/lookahead timeline:
  - **Horizontal Domain**: $X \in [12, 228]$ ($216\text{px}$ width), centered at $X = 120$ for Today ($T = 0$).
  - **Linear Temporal Mapping**:
    \[
    X(t) = 120 + t \cdot \frac{108}{15} = 120 + t \cdot 7.2 \quad (t \in [-15, +15]\text{ days})
    \]
  - **Continuous Color Segments**: Evaluates orbital latitude sign $\beta(t)$ along the track to render continuous Sky Blue ($\beta \ge 0$) and Rose Red ($\beta < 0$) track chords.
  - **Historical & Future Node Pins**: Projects all node crossing events occurring within $[-15, +15]$ days with exact temporal offset tags (`-4.2d`, `+8.9d`), pin glyphs (☊, ☋), and status tooltips.

---

## Consequences

### Positive
- **Visual Uniformity**: Sun and Moon elevation domes now match exactly in height, baseline, and responsiveness across all display sizes.
- **Cognitive Clarity**: Nocturnal paths no longer collide with waning lunar phase dashes; users immediately distinguish phase encoding from horizon occlusion.
- **Harmonious Palette**: Twilight strata across the observatory now speak a single visual dialect (`#f59e0b`, `#64748b`, `#334155`).
- **Nodal Precision**: Eliminates false "crossing today" alerts when a node crossing occurred hours earlier, giving users trustworthy astronomical telemetry.
- **Intuitive Time Navigation**: The centered $\pm 15$-day draconic rail provides an instant mental model of where the Moon is in its 27.2-day nodal cycle relative to today.

### Verification & Compliance
- **Test Suite**: 476 automated tests passing across 38 suites (`npm test -- --run`).
- **Type Safety**: 0 TypeScript compiler diagnostics (`npm run typecheck`).
- **Unit Safety Linter**: 0 AST violations (`npm run lint:units`).
- **Performance**: Zero-allocation hot path; `calculateSkyDomeLunarNodes` executes in $< 0.04\text{ms}$.
