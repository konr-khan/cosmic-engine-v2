# ADR 0009: Ground-Truth Heliocentric & Geocentric Prograde Kinematics and Seasonal Milestone Realignment

## Status
Accepted

## Context

Prior to this architectural milestone, an audit of the astronomical simulation identified fundamental kinematic and orientation discrepancies between physical reality, classical astrolabes, and the 2D/3D SVG viewports:

1. **Heliocentric Retrograde & Cardinal Misalignment**:
   - In the **Solar System Macro Orbit** (`MacroOrbitView.tsx`) and **Gyro-Morph Heliocentric Mode** (`☉ Orbit`), an external observer situated above the Sun's North Pole (looking down onto the ecliptic plane from $+Z$) expects Earth and the Moon to revolve **prograde (counter-clockwise)**.
   - However, due to standard SVG vertical axis inversion ($+Y$ points downward) and uncoordinated sign conventions, the Earth's orbit and seasonal milestones were oriented out of phase: the March Equinox rendered at ~8:30 o'clock and the September Equinox at ~1:30 o'clock, rather than along the canonical horizontal axis.
   - In exaggerated eccentricity scale mode ($e = 0.25$), the empty focus $F_2$ was constrained to 1D horizontal translation, and an artificial $-c/2$ track offset in the Armillary model caused the Earth and milestone halo nodes to separate from the Keplerian ellipse.

2. **Geocentric Apparent Sphere Clockwise Discrepancy**:
   - In the **Gyro-Morph Armillary** widget's 3D geocentric apparent mode (`⊕ Apparent`), scrubbing calendar dates caused the apparent Sun, Moon, and seasonal milestones to sweep **clockwise** around Earth.
   - Mathematically, relative orbital motion preserves chirality: because Earth revolves counter-clockwise around the Sun ($\vec{r}_\oplus(t)$), the apparent position of the Sun relative to Earth ($\vec{r}_\odot(t) = -\vec{r}_\oplus(t)$) must also advance counter-clockwise through the seasons (Aries $\to$ Taurus $\to$ Gemini $\to$ Cancer).

3. **Milestone Definition Triplication & Dependency Inversion**:
   - Seasonal milestones were triplicated across [`components/widgets/macro/milestones.ts`](../../src/components/widgets/macro/milestones.ts), [`armillary/constants.ts`](../../src/utils/cosmicMath/armillary/constants.ts), and [`scene/generator.ts`](../../src/utils/cosmicMath/scene/generator.ts).
   - The pure math domain module `scene/generator.ts` was importing from the presentation widget directory (`components/widgets/macro/milestones.ts`), violating clean architecture boundary constraints.
   - Furthermore, `scene/generator.ts` maintained an internal `milestoneLongitudes` dictionary with Sun geocentric longitudes ($0^\circ, 90^\circ, 180^\circ, 270^\circ$) masquerading as Earth heliocentric longitudes.

---

## Decisions

### 1. Ground-Truth Heliocentric Coordinates & Cardinal Milestone Alignment
Re-anchored the heliocentric orbital coordinate system to standard astronomical definitions:
* **Heliocentric Orientation**:
  $$\text{Earth}(t) = \left( -r \cos\lambda_\odot, \, r \sin\lambda_\odot, \, 0 \right)$$
* **Cardinal Milestones**:
  - **March Equinox** ($\lambda_\odot = 0^\circ, \lambda_\oplus = 180^\circ$): Located at $(-200, 0)$ ($9\text{ o'clock}$, Left).
  - **June Solstice** ($\lambda_\odot = 90^\circ, \lambda_\oplus = 270^\circ$): Located at $(0, 200)$ ($6\text{ o'clock}$, Bottom).
  - **September Equinox** ($\lambda_\odot = 180^\circ, \lambda_\oplus = 0^\circ$): Located at $(200, 0)$ ($3\text{ o'clock}$, Right).
  - **December Solstice** ($\lambda_\odot = 270^\circ, \lambda_\oplus = 90^\circ$): Located at $(0, -200)$ ($12\text{ o'clock}$, Top).
  - **Perihelion** ($\lambda_\oplus \approx 102.94^\circ$): Located at $(-44.79, -194.92)$ ($\sim 11\text{:}30$ o'clock).
  - **Aphelion** ($\lambda_\oplus \approx 282.94^\circ$): Located at $(44.79, 194.92)$ ($\sim 5\text{:}30$ o'clock).
* **Line of Apsides & Kepler Foci**:
  - Empty focus $F_2$ derived as a complete 2D vector $(focus2X, focus2Y)$ in [`useCosmicScene.ts`](../../src/hooks/useCosmicScene.ts) and consumed by [`OrbitSvgCanvas.tsx`](../../src/components/widgets/macro/OrbitSvgCanvas.tsx).
  - In `generator.ts`, removed the $-c/2$ track offset, anchoring Earth, the orbital ellipse, and all 6 milestone nodes to the shared origin while the Sun displaces to $F_1 = (-c, 0, 0)$.

### 2. Prograde 3D Geocentric Celestial Sphere
Reconciled the 3D Armillary Apparent mode with prograde right-handed kinematics:
* In [`generatorGeometry.ts`](../../src/utils/cosmicMath/armillary/generatorGeometry.ts), inverted the $Z$-axis basis for geocentric bodies:
  $$x = a \cos\lambda, \quad y = a \sin\lambda \sin\epsilon, \quad z = -a \sin\lambda \cos\epsilon$$
* In [`generator.ts`](../../src/utils/cosmicMath/armillary/generator.ts), aligned the golden Ecliptic ring and Lunar Orbit ring to the same prograde $Z$-orientation when `projectionMode === 'geocentric'`.
* Preserved 2D Astrolabe plate invariance: Conformal Stereographic, Universal Rojas, and Topocentric Horizon projections remain 100% compliant with historical plate invariants.

### 3. Canonical Domain Single Source of Truth
Established a dedicated domain module for orbital milestones:
* Created **[`src/utils/cosmicMath/milestones.ts`](../../src/utils/cosmicMath/milestones.ts)** defining `EARTH_MILESTONES` with branded units (`helioEclipticLon: Degrees`), physical distances, speeds, descriptions, and UI offsets.
* Resolved dependency inversion: `scene/generator.ts` imports directly from `../milestones`.
* Deduplicated presentation layers: `widgets/macro/milestones.ts` and `armillary/constants.ts` re-export from the pure math domain.
* Purged the stale `milestoneLongitudes` dictionary from `scene/generator.ts`.

### 4. Directional Derivative ($d/dt$) Invariant Testing
Codified rigorous physical invariants in [`cameras.stress.test.ts`](../../src/utils/cosmicMath/scene/cameras.stress.test.ts):
* **`C6.1` (Earth Top-Down CCW)**: Advancing time $\Delta t = +5\text{ days} \implies \frac{d\theta_{\text{math}}}{dt} > 0$ where $\theta_{\text{math}} = \text{atan2}(-y, x)$.
* **`C6.1b` (Moon Top-Down CCW)**: Advancing time $\Delta t = +2\text{ days} \implies \frac{d\theta_{\text{moon}}}{dt} > 0$ around Earth.
* **`C6.2` (Transverse Left-to-Right)**: Phase $0.05 \to 0.48 \implies \frac{dX}{dt} > 0$ (monotonic motion toward shadow cone).
* **`C6.3` (Axial Right-to-Left)**: Solar eclipse $\implies \frac{dX}{dt} < 0$ (monotonic West-to-East transit across Sun).

---

## Consequences

* **Astronomical Accuracy**: Earth and Moon orbital motions are strictly prograde (counter-clockwise) from the North Pole perspective across all observatory subsystems.
* **Seamless Continuum Transitions**: Switching between `☉ Orbit` and `⊕ Apparent` preserves orbital velocity direction and physical intuition.
* **Clean Architecture**: Boundary layers strictly enforced with pure math modules independent of UI components.
* **Test Suite Expansion**: Total test count expanded to **389 tests across 20 suites**, passing with 100% determinism.
