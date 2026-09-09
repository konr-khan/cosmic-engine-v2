# ADR 0016: Dynamic Sighting-Aware Horizon Dome, Tropical Culmination Inversions & Canvas Uncluttering

## Status
Accepted

## Context

The **Today's Sky Horizon Subsystem** ([`SkyDomeBase.tsx`](../../src/components/widgets/today/SkyDomeBase.tsx), [`SunElevationDome.tsx`](../../src/components/widgets/today/SunElevationDome.tsx), [`MoonElevationDome.tsx`](../../src/components/widgets/today/MoonElevationDome.tsx)) renders symmetrical 2D elevation arcs representing the diurnal progression of the Sun and Moon from rise to set.

Prior to this architectural revision, two significant limitations affected accuracy and visual clarity:

1. **Static Hemisphere Meridian Labeling (`latitude < 0 ? 'N' : 'S'`)**:
   - The central meridian tick at $(X=130, Y=101)$ assumed that all observers in the Northern hemisphere ($\phi \ge 0^\circ$) observe the Sun and Moon culminate to the **South**, while observers in the Southern hemisphere ($\phi < 0^\circ$) observe culmination to the **North**.
   - **Tropical Culmination Inversion**: Between the tropics ($-23.44^\circ \le \phi \le +23.44^\circ$), the midday Sun's position is governed by the sign of $\Delta = \delta_\odot - \phi$. For an observer in Honolulu ($\phi = +21.3^\circ\text{N}$) in June ($\delta_\odot = +23.44^\circ$), $\delta_\odot > \phi$, meaning the Sun culminates at $87.9^\circ$ altitude in the **Northern sky**, requiring the observer to face North. Under the static rule, this was erroneously labeled `S`.
   - **Lunar Super-Tropical Reach ($\pm 28.58^\circ$)**: Due to the Moon's $5.145^\circ$ orbital inclination, lunar declination ranges up to $\pm 28.58^\circ$ during major lunar standstills. Observers outside the solar tropics—such as in Miami ($25.8^\circ\text{N}$) or Taipei ($25.0^\circ\text{N}$)—regularly experience the Moon culminating in their **Northern sky** for half the month and in their **Southern sky** two weeks later.
   - **Zero-Shadow / Overhead Zenith Transits**: When $|\delta - \phi| < 0.25^\circ$ (e.g. tropical "Lahaina Noon"), the celestial body passes directly overhead through the Zenith ($+90^\circ$). The static labeling failed to indicate this zero-shadow event.

2. **Floating SVG Canvas Reference Labels & Upper-Quadrant Clutter**:
   - Floating `<text>` labels (e.g., `57° S`, `66° S`, `43°`) placed along reference curves (summer solstice, winter solstice, equinox) inside the 260x138 SVG canvas clustered in the upper-right quadrant ($X \approx 180, Y \approx 20 \dots 50$) at mid-to-high altitudes.
   - These labels collided with one another, obstructed the animated Sun bead and twilight transition zones, and duplicated data already cleanly reported in the dedicated stats strip below the dome.

---

## Decisions

### 1. Analytical Culmination Bearing Solver (`calculateCulminationBearing`)
Implemented in [`src/utils/cosmicMath/todaySky.ts`](../../src/utils/cosmicMath/todaySky.ts):
- Evaluates the signed angular difference:
  \[
  \Delta = \delta - \phi
  \]
- **Tri-State Meridian Classification**:
  - **Zenith Overhead Transit** ($|\Delta| < 0.25^\circ$): `direction = 'Zenith'`, `meridianLabel = 'Z'`, `altitude = 90.0^\circ`, `sightingSummary = 'Overhead Zenith Transit'`.
  - **South Culmination** ($\Delta < 0$, $\delta < \phi$): `direction = 'South'`, `meridianLabel = 'S'`, `altitude = 90^\circ - |\phi - \delta|`, `sightingSummary = 'Looking South · S-Sky Arc'`.
  - **North Culmination** ($\Delta > 0$, $\delta > \phi$): `direction = 'North'`, `meridianLabel = 'N'`, `altitude = 90^\circ - |\delta - \phi|`, `sightingSummary = 'Looking North · N-Sky Arc'`.

### 2. Dynamic Sighting Perspective & Signed Altitude Readouts
- In `SkyDomeBase.tsx`:
  - **Header Readout**: Renders signed altitude bearings (e.g., `87.9° N` vs. `45.3° S` vs. `90.0° ZENITH`) via `peakDirectionSuffix`.
  - **Meridian Indicator**: The center baseline mark dynamically reflects `meridianDirection` (`S`, `N`, or `Z`) with an accessible `<title>` tooltip.
  - **Observer Sighting Perspective Micro-Banner**: Rendered as a compact monospace glassmorphic pill in the live elevation bar:
    `[ 👁️ Looking North · N-Sky Arc ]` vs. `[ 👁️ Looking South · S-Sky Arc ]` vs. `[ 👁️ Overhead Zenith Transit ]`.

### 3. Horizon Rise & Set Azimuth Octants (`calculateRiseSetAzimuth`)
- Computes analytical rising and setting azimuths:
  \[
  \cos(\text{Az}_{\text{rise}}) = \frac{\sin\delta}{\cos\phi}, \quad \text{Az}_{\text{set}} = (360^\circ - \text{Az}_{\text{rise}}) \bmod 360^\circ
  \]
- Converts decimal azimuths into 16-point compass octants (`ENE`, `ESE`, `WNW`, `WSW`, etc.) using $22.5^\circ$ bins with an $11.25^\circ$ half-step phase shift.
- Renders 16-point compass octants as a compact subline under the sunrise/sunset and moonrise/moonset badges (e.g., `068° ENE` / `292° WNW` in tooltips, `ENE · WNW` on card).

### 4. Canvas Uncluttering & Reference Line Hierarchy
- Suppressed floating canvas text labels on diurnal reference curves (summer solstice, winter solstice, equinox).
- **Preserved Information Architecture**:
  - Reference curves render as clean, elegant dashed hairlines with native SVG `<title>` tooltips on hover.
  - Precise numerical limits and physical sky directions are consolidated cleanly in the dedicated stats strip below the dome (`Summer Sol: 87.9° N · Winter Sol: 45.3° S · Zenith Cap: None (90°)`).

---

## Consequences & Invariants

* **Tropical & Polar Robustness**: The horizon dome adapts seamlessly to all latitudes—equatorial, tropical, temperate, and polar—accurately communicating which hemisphere of the sky the observer is facing.
* **Zero Visual Collision**: Eliminating floating SVG text labels leaves the 260x138 elevation dome completely free of text overlaps across all seasons and latitudes.
* **Full Test Coverage**: Comprehensive domain unit tests in `todaySky.test.ts`, `SkyDomeBase.test.tsx`, and `TodayWidget.test.tsx` guarantee zero regression across the 38-suite Vitest test suite.
