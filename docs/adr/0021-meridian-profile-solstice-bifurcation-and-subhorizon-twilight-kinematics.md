# ADR 0021: Meridian Profile Solstice Arc Bifurcation, Directional Migration Kinematics & Sub-Horizon Twilight Depiction

## Status
Accepted

## Context
Following the deployment of the Quad-View Celestial Meridian Profiles (`SunMeridianDome`, `MoonMeridianDome`, `MeridianDomeBase`) in `TodayHorizonView`, user feedback and high-latitude astronomical evaluation identified four visual, kinematic, and contextual enhancements:

1. **Visual Confusion in Solstice Corridor Representation**:
   - The annual solstice migration corridor ($\Delta \delta = 46.88^\circ$, spanning from June Solstice $\delta = +23.44^\circ$ to December Solstice $\delta = -23.44^\circ$) was previously rendered as a single continuous solid yellow arc connecting the two solstice tick pins.
   - Because Today's active diurnal chord was also rendered with a solid stroke, the visual hierarchy was ambiguous. Observers could not intuitively distinguish which portion of the seasonal corridor represented the path toward the upcoming seasonal milestone versus the path away from the receding one.

2. **Telemetry Redundancy on Lower Meridian Profile Cards**:
   - Lower meridian profile cards displayed duplicate telemetry beneath the dome: an elevation readout badge (e.g. `+52.4° above horizon`) and an observer perspective banner (e.g. `Looking South · S-Sky Arc`).
   - Because the upper Diurnal Elevation Domes already present the elevation badge prominently and the lower meridian cards feature dedicated non-redundant stats strips, the middle banner created unnecessary vertical clutter on the lower cards.

3. **Diurnal Track Mode Coupling**:
   - In `SunMeridianDome`, Today's diurnal chord continued down into the sub-horizon twilight strata even when the user was in Standard (`Std`) mode, instead of strictly coupling its sub-horizon extension to the active `Twilight` mode toggle.

4. **Polar Night & Sub-Horizon Solstice Depiction in Twilight Mode**:
   - In high-latitude locations during polar winter (e.g., Tromsø, Norway at $\phi = 69.65^\circ\text{ N}$), the Sun never rises above the horizon at the December Solstice, reaching a maximum noon culmination of $h = 90^\circ - \phi + \delta_\odot = 90^\circ - 69.65^\circ - 23.44^\circ = -3.09^\circ$ (within Civil Twilight).
   - In `Twilight` mode, the solstice arc stopped abruptly at the horizon line ($Y = 104$) rather than continuing down into the appropriate twilight stratum. Furthermore, at extreme latitudes (e.g., Alert, Nunavut or the North Pole), noon culmination plunges below the Astronomical Twilight floor ($h < -18^\circ$), where rendering an orphan tick pin outside the dome canvas would introduce clipping artifacts.

---

## Decisions

### 1. Solstice Arc Bifurcation & Milestone Directional Vector ($d\delta/dt$)
- **Dual Dashed Milestone Arcs**: Bifurcated the single yellow swath into two distinct dashed arcs (`strokeDasharray="3 2"`), anchored at **Today's Noon Culmination Peak** on the outer circular meridian rim ($R=92, CY=104, CX=130$):
  - **June Solstice Arc (`solstice-swath-june`)**: Warm Gold (`#fbbf24`), spanning from Today's Noon Peak (`todayPeakPoint.thetaDeg`) to the June Solstice Peak (`junePeakPoint.thetaDeg`).
  - **December Solstice Arc (`solstice-swath-december`)**: Rich Bronze (`#d97706`), spanning from Today's Noon Peak (`todayPeakPoint.thetaDeg`) to the December Solstice Peak (`decPeakPoint.thetaDeg`).
- **Stable Milestone Anchoring Principle**: Anchoring both arcs to Today's Noon Culmination Peak on the outer rim ($R=92$) preserves the calibrated seasonal scale. The arcs do not jitter or distort with the moving daytime Sun bead.
- **Directional Migration Vector ($d\delta/dt$)**: Evaluated the instantaneous solar declination rate of change:
  $$\frac{d\delta}{dt} \propto \cos\lambda_\odot$$
  - When $\cos\lambda_\odot > 0$ ($\lambda_\odot \in [0^\circ, 90^\circ) \cup (270^\circ, 360^\circ)$), $\frac{d\delta}{dt} > 0$: the Sun is migrating Northward toward the June Solstice (`isApproachingJune = true`).
  - When $\cos\lambda_\odot < 0$ ($\lambda_\odot \in (90^\circ, 270^\circ)$), $\frac{d\delta}{dt} < 0$: the Sun is migrating Southward toward the December Solstice (`isApproachingJune = false`).
- **Dynamic Vibrancy Weighting**:
  - Approaching milestone arc: rendered at full vibrancy (`opacity = 0.85`, `strokeWidth = 1.25px`).
  - Receding milestone arc: rendered in subdued tone (`opacity = 0.40`, `strokeWidth = 0.9px`).

### 2. Compact Meridian Telemetry & Duplicate Banner Suppression
- Added `hideElevationBanner?: boolean` (default `false`) to `<SkyDomeBase />`.
- Configured `<MeridianDomeBase />` to pass `hideElevationBanner = true` by default.
- Suppressed the duplicate middle elevation badge and sighting perspective banner on lower meridian cards while preserving full telemetry on upper diurnal elevation domes.

### 3. Twilight Mode-Coupled Diurnal Chord & Gate Anchor
- In `SunMeridianDome.tsx`, strictly conditioned sub-horizon extension on `isTwilightModeActive`:
  - **Standard (`Std`) Mode**: `todayChord` and `gateAnchor` stop cleanly at the horizon ($h = 0^\circ, Y = 104$).
  - **Twilight Mode**: `todayChord` and `gateAnchor` extend down to the $-18^\circ$ Astronomical Twilight floor ($Y = 132.43\text{px}$).

### 4. Sub-Horizon Solstice Depiction & 3-Tier Kinematics
- Updated `calculateMeridianPoint(altitudeDeg, bearing, cx, cy, r, minAltitudeDeg = 0)` in `src/utils/cosmicMath/today/meridian.ts` to accept configurable `minAltitudeDeg`.
- In `SunMeridianDome.tsx`, when `isTwilightModeActive = true`, set `minAltitudeDeg = -18`:
  - **Twilight Noon Culmination ($0^\circ > h \ge -18^\circ$)**: The solstice arc extends along the circular meridian perimeter into the sub-horizon canvas ($Y \in [104, 132.43]$). A dedicated tick pin and label render at the true sub-horizon culmination point, displaying signed altitude and twilight tier (e.g. `-3.1° S (Civil)`).
  - **Astronomical Night Culmination ($h < -18^\circ$)**: The solstice tick pin disappears completely (suppressed), eliminating orphan off-canvas ticks, and the solstice arc terminates cleanly at the $-18^\circ$ floor.
  - **Standard (`Std`) Mode**: Sub-horizon solstice ticks are suppressed, preventing daytime horizon clutter.

---

## Consequences

### Positive
- **Intuitive Seasonal Milestones**: Users immediately understand whether the Sun is approaching or receding from June or December based on color coding (`#fbbf24` vs `#d97706`) and directional vibrancy ($0.85$ vs $0.40$).
- **High-Latitude Polar Night Precision**: Observers in Arctic and Antarctic locations observe exact winter solstice culmination depths across Civil, Nautical, and Astronomical twilight strata.
- **Clean Profile Canvas**: Suppressing duplicate telemetry badges on lower meridian cards maximizes visual focus on celestial meridian kinematics.
- **Strict Mode Alignment**: Diurnal chords and solstice arcs respect user mode selections without visual bleeding between Standard and Twilight representations.

### Test Coverage
- Unit tests added in `src/components/widgets/today/SkyDomeBase.test.tsx` verifying `hideElevationBanner`.
- Math tests added in `src/utils/cosmicMath/todaySky.test.ts` verifying `calculateMeridianPoint` down to $-18^\circ$.
- Integration tests added in `src/components/widgets/today/TodayWidget.test.tsx` verifying split solstice swaths, twilight mode chord/gate conditionality, Tromsø Civil Twilight peak, and North Pole tick disappearance.
- 592 tests passing across 40 test suites.
- 0 unit-safety violations across all UI components.
