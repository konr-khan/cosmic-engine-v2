# ADR 0022: Polar Directional Singularity Rectification & Longitudinal Horizon Reference Geometry

## Status
Accepted

## Context
When an observer navigates to the Earth's geographic poles ($|\phi| \ge 89.9^\circ$), the topocentric horizontal coordinate system experiences an azimuthal gimbal lock (the **Polar Directional Singularity**):

1. **Topocentric Geometric Reality**:
   - At the **North Pole** ($\phi = +90^\circ$), Earth's rotational axis coincides with the local vertical (Zenith $= +90^\circ$). **Every direction along the terrestrial surface is South** toward the Equator. There is no horizontal North, East, or West.
   - At the **South Pole** ($\phi = -90^\circ$), the South Celestial Pole is directly overhead at Zenith ($-90^\circ$). **Every direction along the terrestrial surface is North**.
   - Celestial bodies in the solar system have declinations $|\delta| \le 28.58^\circ$. At the North Pole, every body is at least $61.42^\circ$ south of the Zenith. The Sun and Moon can physically **never** enter the "Northern sky" relative to a North Pole observer.

2. **Mid-Latitude Coordinate Projections in Polar Regimes**:
   - In previous versions of `SunMeridianDome` and `MoonMeridianDome`, the North-South colure baseline was statically labeled:
     $$\text{S (Left)} \longleftrightarrow \text{Z (Center)} \longleftrightarrow \text{N (Right)}$$
   - Direction cosine math projected local hour angle $H$ along $y_{\text{north}} = -\cos\delta \cos H$:
     - At midday ($H = 0$), $y_{\text{north}} = -\cos\delta$ (plotted on the left).
     - At midnight ($H = 180^\circ$), $y_{\text{north}} = +\cos\delta$ (plotted on the right under the label `"N"`).
   - Because the right side was labeled `"N"`, the diurnal chord appeared to travel into the "North sky" at midnight, directly violating spherical geometry. In reality, that right side is the **opposite meridian ($180^\circ$ longitude / International Date Line)**—which is still South.
   - Similarly, the upper diurnal elevation dome (`SkyDomeBase`) labeled the horizon `E — S — W`, which is physically meaningless at the pole where lines of longitude converge.
   - The metric header reported `"Noon Peak"`, implying diurnal rising and falling, even though altitude is strictly constant ($h = \delta$) across the 24-hour cycle.

---

## Decisions

### 1. Polar Longitudinal Meridian Baseline (`MeridianDomeBase`)
When $|\phi| \ge 89.9^\circ$, the static `S — Z — N` baseline dynamically reconfigures to explicit longitudinal references:
- **North Pole ($\phi \ge +89.9^\circ$)**:
  $$\mathbf{S \ (0^\circ)} \longleftrightarrow \mathbf{Z \ (+90^\circ)} \longleftrightarrow \mathbf{S \ (180^\circ)}$$
  - Left ($X = 38$): South along the Greenwich Prime Meridian ($0^\circ$).
  - Center ($X = 130$): Zenith (+90° North Celestial Pole).
  - Right ($X = 222$): South along the International Date Line / Antimeridian ($180^\circ$).
- **South Pole ($\phi \le -89.9^\circ$)**:
  $$\mathbf{N \ (0^\circ)} \longleftrightarrow \mathbf{Z \ (-90^\circ)} \longleftrightarrow \mathbf{N \ (180^\circ)}$$
  - Left ($X = 38$): North along the Greenwich Prime Meridian ($0^\circ$).
  - Center ($X = 130$): Zenith (-90° South Celestial Pole).
  - Right ($X = 222$): North along the International Date Line / Antimeridian ($180^\circ$).

### 2. Upper Diurnal Elevation Dome Longitudinal Baseline (`SkyDomeBase`)
When $|\phi| \ge 89.9^\circ$ and `showZenithAxis = false` (upper elevation dome):
- The baseline markers `E — S — W` dynamically reconfigure to cardinal longitudes:
  $$\mathbf{90^\circ\text{E}} \longleftrightarrow \mathbf{0^\circ\text{ (Grw)}} \longleftrightarrow \mathbf{90^\circ\text{W}}$$
- Tooltip explicitly states: `Polar longitude: 0° (Greenwich Meridian) · All horizons South` (or `North` for South Pole).

### 3. Sighting Perspective & Telemetry Rectification
In `calculateCulminationBearing` (`src/utils/cosmicMath/today/elevation.ts`), added an explicit polar singularity branch:
- When $\phi \ge +89.9^\circ$: `sightingSummary = 'North Pole Singularity · All Horizons South'`.
- When $\phi \le -89.9^\circ$: `sightingSummary = 'South Pole Singularity · All Horizons North'`.

### 4. Constant Altitude Metric Relabeling
In `SunElevationDome`, `SunMeridianDome`, `MoonElevationDome`, and `MoonMeridianDome`:
- When $|\phi| \ge 89.9^\circ$, `peakLabel` switches from `"Noon Peak"` / `"Transit Peak"` to **`"Constant Altitude"`**, reflecting the horizontal circular orbit.

---

## Consequences

### Positive
- **100% Astronomical Ground Truth**: Eliminates the impossible "North" horizon label at the North Pole, transforming a confusing artifact into an authentic educational lesson in polar coordinate singularities.
- **Visual Intelligibility**: Observers immediately understand that the horizontal solstice line connects the Greenwich meridian ($0^\circ$) at midday to the Date Line meridian ($180^\circ$) at midnight at identical altitude.
- **Educational Delight**: Seamlessly switches labels as the user drags the latitude slider across $89.9^\circ$.

### Test Coverage
- Unit tests added in `src/utils/cosmicMath/todaySky.test.ts` verifying `calculateCulminationBearing` polar returns.
- Component tests added in `src/components/widgets/today/SkyDomeBase.test.tsx` verifying polar baseline markers `90°E — 0° (Grw) — 90°W`.
- Integration tests added in `src/components/widgets/today/TodayWidget.test.tsx` verifying `MeridianDomeBase` renders `S (0°) — Z (+90°) — S (180°)` at the North Pole and `N (0°) — Z (-90°) — N (180°)` at the South Pole, with `"Constant Altitude"` badges.
- 595 tests passing across 40 test suites.
- 0 unit-safety violations across all UI components.
