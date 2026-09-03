# ADR 0008: Canonical Camera Math Layer Alignment & Prograde Sky View Transit Kinematics

## Status
Accepted

## Context
Following the completion of ADR 0007 (Eclipse Demonstrator Viewport Upsizing & Prograde Astronomical Kinematics), a comprehensive audit of the Ground Truth 3D Astronomical Scene Graph and component consumers identified three architectural considerations:

1. **Math-Layer Viewport Asymmetry & Legacy Retrogression**:
   * While [`NodalPlaneVisualizer.tsx`](../../src/components/widgets/eclipse/NodalPlaneVisualizer.tsx) was upsized to $520 \times 220$ layout parity ($X_c = 260, Y_c = 110, R_x = 150\text{px}$, vertical scale $10.5\text{px/deg}$), the underlying pure math pipeline in [`cameras.ts`](../../src/utils/cosmicMath/scene/cameras.ts) (`projectGeocentricAxial`) retained the legacy default dimensions ($400 \times 180$, $X_c = 200, Y_c = 90, R_x = 110\text{px}$, scale $8.5\text{px/deg}$).
   * In [`useCosmicScene.ts`](../../src/hooks/useCosmicScene.ts) (`useEclipseScene`), the ascending node coordinate was calculated with an inverted retrograde sign (`+ Math.sin(tAsc)` instead of `- Math.sin(tAsc)`) and hardcoded to the old $200 \times 90$ center.

2. **Presentational UI Decoupling vs. Store Hook Coupling**:
   * A proposal was evaluated to force UI visualizers ([`NodalPlaneVisualizer.tsx`](../../src/components/widgets/eclipse/NodalPlaneVisualizer.tsx), [`ShadowRayDiagram.tsx`](../../src/components/widgets/eclipse/ShadowRayDiagram.tsx), and [`MicroTideView.tsx`](../../src/components/widgets/tides/MicroTideView.tsx)) to directly consume the reactive hook `useEclipseScene()` and camera projections.
   * **Analysis revealed this would be an architectural regression**:
     - [`MicroTideView.tsx`](../../src/components/widgets/tides/MicroTideView.tsx) is an Earth-centric ($R=60\text{px}$) 2D tidal vector diagram with local water potential and oscillator, not a Sun-centered Keplerian macro orbit ($R=200\text{px}$). Forcing it into `projectHeliocentricTopDown` would be a category error.
     - The Eclipse Demonstrator visualizers receive `eclipse`, `currentDate`, and `timeOfDay` as pure props from [`EclipseDemonstrator.tsx`](../../src/components/widgets/eclipse/EclipseDemonstrator.tsx). Subscribing directly to global store hooks would break the instant preset jumping in the *Scanner* tab and introduce unnecessary hook coupling for simple presentational components.

3. **Sky View Simulator "Bouncing Moon" Kinematic Defect**:
   * In [`SkyViewSimulator.tsx`](../../src/components/widgets/eclipse/SkyViewSimulator.tsx), the Moon's screen position across the Sun was previously derived from an unsigned scalar formula: `offset = (1 - eclipse.obscuration / 100) * 80` placed at `cx = 120 + offset`.
   * Because `obscuration` is an unsigned scalar percentage ($0\% \to 100\% \to 0\%$), `offset` was strictly non-negative ($\ge 0$). As a result, the Moon approached from the Right ($X \approx 200$) during ingress, reached the Center ($X = 120$) at totality, and then **reversed direction and retreated back to the Right** during egress past peak eclipse.
   * Furthermore, the viewport was labeled generic `"🌍 Earth Observer Sky Simulator"`, causing users with specific GPS coordinates (e.g. Olympia, WA) to expect local topocentric partial obscuration rather than the global central umbral track.

---

## Decisions

### 1. Synchronize the Pure Math Layer (`cameras.ts` & `useCosmicScene.ts`)
* Updated `projectGeocentricAxial` default viewport from $400 \times 180$ to the canonical $520 \times 220$ layout ($X_c = 260, Y_c = 110$).
* Updated body radii and scales to match ADR 0007 / [`MATH_SPEC.md`](../MATH_SPEC.md):
  - Sun radius: $r = 46 \cdot s$
  - Earth radius: $r = 24 \cdot s$
  - Moon radius: $r = 10.5 \cdot s$
  - Orbital semi-major axis: $R_x = 150 \cdot s$
  - Vertical inclination scale: $\text{scalePxPerDeg} = 10.5 \cdot s$
  - Ecliptic reference chord: `M 20 ${cy} L 500 ${cy}`
* Populated `nodeMarkers` in `elements` with exact Ascending ($\Omega$) and Descending ($\mho$) node coordinates.
* Fixed the legacy retrograde sign in `useEclipseScene` (`+ Math.sin` $\to$ `- Math.sin`) and bound node positions directly to `axialProjected.elements.nodeMarkers` at $(260, 110)$.

### 2. Preserve Pure Presentational Decoupling of UI Visualizers
* Deliberately retained [`NodalPlaneVisualizer.tsx`](../../src/components/widgets/eclipse/NodalPlaneVisualizer.tsx), [`ShadowRayDiagram.tsx`](../../src/components/widgets/eclipse/ShadowRayDiagram.tsx), and [`MicroTideView.tsx`](../../src/components/widgets/tides/MicroTideView.tsx) as pure, prop-driven presentational components.
* Maintained clean separation between:
  - The **central 3D math engine** (`src/utils/cosmicMath/scene/`) providing canonical camera projections and contracts.
  - The **UI widgets** consuming pure props for rapid rendering, interactive preset jumping in `EclipseScanner`, and apparent angular diameter badges.

### 3. Rectify Sky View Simulator Prograde Kinematics & Totality Context
* Replaced the unsigned obscuration offset formula in [`SkyViewSimulator.tsx`](../../src/components/widgets/eclipse/SkyViewSimulator.tsx) with signed prograde longitudinal elongation:
  \[
  \Delta \lambda = ((\text{elongation} + 180^\circ) \bmod 360^\circ) - 180^\circ
  \]
  \[
  X_{\text{moon}} = 120 - (\Delta \lambda \cdot 75\text{px/deg})
  \]
  \[
  Y_{\text{moon}} = 120 - (\beta \cdot 8\text{px/deg})
  \]
* In sky view (looking South toward the Sun in Northern Hemisphere), West is to the Right ($\Delta \lambda < 0 \implies +X$) and East is to the Left ($\Delta \lambda > 0 \implies -X$).
* Guarantees that the Moon transits monotonically from **Right to Left (West to East)** across the entire eclipse, exiting cleanly to the left without bouncing or reversing.
* Clarified the perspective selector and overlay labels to:
  - Header: **`🌍 Central Path Sky Simulator (Totality Track)`**
  - Subtitle: `Simulating central path perspective • Prograde transit West → East (Right → Left)`

### 4. Codify Directional Derivative Invariant Tests ($\Delta t$)
* Added property-based directional derivative invariant tests in [`cameras.stress.test.ts`](../../src/utils/cosmicMath/scene/cameras.stress.test.ts) asserting physical vector deltas across all three canonical camera pipelines:
  - **Rig 1 (Top-Down Heliocentric)**: $\Delta t = +5\text{ days} \implies \frac{d\theta}{dt} > 0$ (prograde counter-clockwise orbit in SVG).
  - **Rig 2 (Transverse Geocentric Profile)**: New Moon $\to$ Full Moon $\implies \frac{dX_{\text{screen}}}{dt} > 0$ (monotonic Left-to-Right motion from Sun to Shadow cone).
  - **Rig 3 (Axial Geocentric Sightline)**: Advancing time across solar eclipse $\implies \frac{dX_{\text{screen}}}{dt} < 0$ (monotonic Right-to-Left / West-to-East transit across the Sun).
* Added automated unit test in [`widgets.test.ts`](../../src/components/widgets/widgets.test.ts) verifying prograde transit without bouncing in `SkyViewSimulator`.

---

## Consequences

* **Full Dimensional Parity**: The pure math layer (`cameras.ts`), reactive hook layer (`useCosmicScene.ts`), and UI visualizers (`NodalPlaneVisualizer.tsx`) share identical $520 \times 220$ coordinates, $(260, 110)$ origin centers, and prograde signs.
* **Continuous Astronomical Kinematics**: The Moon faithfully obeys prograde orbital motion across all four eclipse perspectives: Syzygy Profile (Transverse), Axial Sightline, Central Path Sky Simulator, and Lunar Surface POV.
* **Component Architecture Stability**: Presentational components remain decoupled, fast, and free of unnecessary store subscriptions, allowing flawless date/time jumps in `EclipseScanner`.
* **Zero Regressions**: Full test suite passes deterministically with 387 tests across 20 modules.
