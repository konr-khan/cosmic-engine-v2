# ADR 0011: Axial Sightline Anti-Solar Camera Rectification & Armillary Subsystem Hardening

## Status
Accepted

## Context
Following the stabilization of prograde celestial kinematics and 3D scene camera rigs (ADR-0007, ADR-0008, ADR-0009), testing identified four architectural and geometric discrepancies across the Eclipse Demonstrator and Gyro-Morph Armillary subsystems:

1. **Axial Sightline $180^\circ$ Camera Inversion & Mirrored Continents**:
   - In [`NodalPlaneVisualizer.tsx`](../../src/components/widgets/eclipse/NodalPlaneVisualizer.tsx), the background Sun disc is rendered along the sightline at $-Z$ (behind Earth). The viewer is situated in deep space looking through Earth toward the background Sun.
   - However, the underlying projection math in [`globe.ts`](../../src/utils/cosmicMath/globe.ts) and [`projection.ts`](../../src/utils/cosmicMath/projection.ts) projected the sub-solar (daylight) hemisphere as the front visible face ($Z > 0$).
   - This produced an inverted $180^\circ$ phase shift: at local solar noon (e.g. Olympia, WA at 16:17Z), North America was rendered facing the viewer on a globe backlit by the background Sun, while at local midnight (08:07Z), Africa and Asia (daylight hemisphere) faced the viewer.
   - Furthermore, the screen horizontal axis $X$ was inverted relative to terrestrial body coordinates, causing continents to appear horizontally mirrored (e.g., California on the right, Florida on the left) and rotate backwards (retrograde) when scrubbing through time.

2. **Visual Clutter from Lunar Nodes in 3D Apparent Armillary View**:
   - The Ascending (☊) and Descending (☋) node pins rendered in 3D `⊕ Apparent` Celestial Armillary view created unnecessary visual clutter on historical armillary spheres and astrolabe plates where nodal loops are not represented.

3. **Detached Lunar Bead in ☉ Orbit View**:
   - In `☉ Orbit` view, the Moon appeared to float detached in space without an orbit track because the $5.14^\circ$ lunar orbit ring was tied to `celestialRingsOpacity` (which transitions to 0 in heliocentric mode).

4. **Redundant Header Controls**:
   - The standalone `POV Cone` button in the Armillary header duplicated functionality, while the Volumetric Laser Projection Rays & Cones button (`<Zap />`) was inactive in Orbit view.

---

## Decisions

### 1. Reorient Axial Sightline to Anti-Solar Perspective
* Reoriented the axial camera projection frame in [`globe.ts`](../../src/utils/cosmicMath/globe.ts) and [`projection.ts`](../../src/utils/cosmicMath/projection.ts) so that the line of sight looks at the Sun through Earth:
  \[
  z_{\text{body}} = -\cos\phi_{\text{geo}} \cos H
  \]
* Any point with $z_{\text{body}} > 0$ faces the viewer on the **perpetual anti-solar (night) hemisphere**, while the sub-solar (daylight) hemisphere ($z_{\text{body}} < 0$) faces the background Sun and is clipped.

### 2. Un-Mirror Horizontal Coordinates for Prograde Left-to-Right Rotation
* Corrected the body horizontal coordinate sign:
  \[
  x_{\text{body}} = -\cos\phi_{\text{geo}} \sin H
  \]
* Establishes standard Earth geography (West on the left, East on the right with North UP): North America renders un-mirrored with California on the left and Florida on the right.
* As time advances, continents and the observer pin rotate prograde from **LEFT to RIGHT**.

### 3. Harmonize Day/Night Observer Pin Metric & Universal Visibility
* Harmonized `calculateEarthSideGeometry` and `calculateEarthAxialGeometry` to compute `isDaylight` using the exact astronomical solar elevation formula:
  \[
  \sin\phi \sin\delta_\odot + \cos\phi \cos\delta_\odot \cos H \ge 0
  \]
* Retained universal observer pin visibility across all hours in [`MiniGlobeSphere.tsx`](../../src/components/common/miniglobe/MiniGlobeSphere.tsx), conforming to the application-wide visual convention:
  - **Daylight**: Solid pulsing Sky Blue dot (`#38bdf8`, `animate-pulse`).
  - **Nighttime**: Hollow ring (`fill="none" stroke="#94a3b8"`).

### 4. Restrict Lunar Nodes to Heliocentric Orbit Mode
* Gated rendering of `lunarNodes` (☊ and ☋) in [`ArmillaryBeadsLayer.tsx`](../../src/components/widgets/armillary/canvas/ArmillaryBeadsLayer.tsx) to `isHeliocentric === true`. Nodes are cleanly excluded from 3D Apparent and 2D Astrolabe plate modes.

### 5. Decouple Lunar Orbit Ring Opacity in Orbit View
* Added `lunarOrbitOpacity?: number` to `ArmillaryRingsLayerProps` in [`ArmillaryRingsLayer.tsx`](../../src/components/widgets/armillary/canvas/ArmillaryRingsLayer.tsx) and wired it from [`ArmillarySvgCanvas.tsx`](../../src/components/widgets/armillary/ArmillarySvgCanvas.tsx).
* In `☉ Orbit` view, the silver $5.14^\circ$ inclined lunar orbit ring renders stably around Earth at full opacity.

### 6. Unify Observer Sky Cone Toggle on `<Zap />` Button
* Removed the standalone `POV Cone` button from [`ArmillaryHeaderControls.tsx`](../../src/components/widgets/armillary/ArmillaryHeaderControls.tsx).
* In Orbit view (`isOrbital`), the `<Zap />` button dynamically toggles `onToggleObserverCone` with title `"Toggle Observer Sky Cone (FOV)"`, consolidating toolset actions.

---

## Consequences

* **Physical Realism & Visual Parity**: The Axial Sightline window faithfully presents Earth's night hemisphere backlit by the Sun, with prograde West-to-East rotating continents and accurate day/night observer pin status.
* **Streamlined Gyro-Morph Experience**: 3D Apparent mode is uncluttered by nodal pins, the Moon orbit track is rendered in heliocentric view, and header controls are unified.
* **Deterministic Verification**: All 21 Vitest suites and 412 unit tests pass deterministically.
