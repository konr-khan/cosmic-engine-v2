# ADR 0035: Visual Polish, Universal MiniMoon Harmonization, and Gyro-Morph Nodal Sightline

## Status
Accepted

## Context
Following the completion of Milestone 34 and user review of observatory visual fidelity, five targeted visual polish and interaction refinements were identified across multiple widgets:

1. **Lunar Almanac Synodic Viewport Stability & Scrubber Precision**:
   In the 30-day synodic mode of [`LunarRibbonChart.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/ribbon/LunarRibbonChart.tsx), horizontal pointer drag scrubbing caused erratic date jumps and viewport jitter within the compact $\pm 15$-day window, conflicting with hover time inspection. Furthermore, the vertical hover time guideline required precise synchronization with the external chronometer store.
2. **Macro Orbit Chronometer Synchronization & Scrubbing**:
   In [`MacroOrbitView.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/macro/MacroOrbitView.tsx), Earth's diurnal terminator and topocentric observer pin did not rotate intra-day with live chronometer playback, and the Earth bead lacked direct interactive drag scrubbing along its heliocentric orbit.
3. **Gyro-Morph Edge-On Ring Slicing Artifacts**:
   In [`ArmillaryRingsLayer.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/canvas/ArmillaryRingsLayer.tsx), splitting 3D armillary rings strictly into front ($z_{\text{cam}} \ge 0$) solid and back ($z_{\text{cam}} < 0$) dashed paths caused visual flickering and broken half-dashed ellipses when viewing rings edge-on (such as the Celestial Equator at camera pitch $\approx 0^\circ$).
4. **Disparate Moon Renderings & Axial Sightline Physics**:
   While the Gyro-Morph Armillary orbital view rendered a rich 3D spherical lunar model with directional dayside terminator and corona glow, the Live Syzygy view ([`LiveSyzygyView.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/eclipse/LiveSyzygyView.tsx)) and Axial Sightline view ([`NodalPlaneVisualizer.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/eclipse/NodalPlaneVisualizer.tsx)) rendered flat, monochrome `<circle>` shapes. Moreover, in the Axial Sightline view, the observer looks down the Sun-Earth axis toward the background Sun, which means the observer is physically observing the Moon's unilluminated nightside facing Earth; rendering a white dayside crescent in that perspective violated sightline optics. At the same time, the existing visual grammar—dashed/solid outlines and Sky Blue / Rose Red nodal encodings—needed strict preservation.
5. **Gyro-Morph Nodal Plane Alignment Affordance**:
   In the Gyro-Morph Heliocentric Orbit view, manually rotating the 3D camera to inspect the Moon's $5.145^\circ$ orbital inclination edge-on was cumbersome and required precision trial-and-error.

---

## Decisions

### 1. Lunar Almanac Viewport Stabilization
* In [`LunarRibbonChart.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/ribbon/LunarRibbonChart.tsx), disabled horizontal drag scrubbing in 30-day synodic mode while preserving single-click day snapping, smooth hover day inspection, and vertical hover time guideline scrubbing.
* Repaired hover time coordinate derivation across synodic and annual modes, ensuring the floating dual-time badge and vertical hairline track pointer coordinates with zero latency.

### 2. Macro Orbit Real-Time Chronometer Synchronization & Scrubbing
* Subscribed [`MacroOrbitView.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/macro/MacroOrbitView.tsx) to intra-day chronometer ticking via `useCosmicStore(s => s.timeOfDay)`, ensuring continuous, smooth rotation of Earth's diurnal terminator and topocentric observer pin on `<MiniGlobe />`.
* Implemented interactive pointer drag scrubbing directly on Earth around its elliptical orbit, seamlessly updating the chronometer's Julian Date.

### 3. Edge-On Ring Solid Line Unification
* In [`ArmillaryRingsLayer.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/canvas/ArmillaryRingsLayer.tsx), computed the camera-space normal component $|n_z|$ for each ring plane:
  \[
  \vec{n}_{\text{cam}} = \mathbf{R}_{\text{pitch}}(\psi) \mathbf{R}_{\text{yaw}}(\theta) \vec{n}_{\text{ring}}, \quad n_z = \vec{n}_{\text{cam}} \cdot \hat{\mathbf{e}}_z
  \]
* When $|n_z| \le 0.08$ (edge-on view within $\approx 4.6^\circ$), a smooth transition weight $u_{\text{edge-on}} = 1 - \operatorname{clamp}(|n_z| / 0.08, 0, 1)$ unifies the path into an unbroken solid stroke (`fullPathD`), eliminating broken half-dashed line artifacts.

### 4. Universal `<MiniMoon />` Component Primitive (`src/components/common/MiniMoon.tsx`)
* Extracted and unified lunar rendering into a shared primitive supporting:
  - 3D analytical spherical terminator paths via `subsolarCameraVector`.
  - Topocentric 2D apparent phase crescents via `phase` and `sunAngleDeg`.
  - Dark backside illumination (`isDark={true}`) for views looking down the Sun-Earth axis toward the background Sun, suppressing the white sunward crescent while preserving the dark midnight disc (`#0f172a` / `#475569` or eclipse blood-red/copper), soft corona glow, and sightline pin dot.
  - Strict preservation of vector outline grammar: Sky Blue (`#38bdf8`) for Ascending Node ($\beta \ge 0$), Rose Red (`#f43f5e`) for Descending Node ($\beta < 0$), Amber Gold (`#fbbf24`) for active eclipse, solid outline for waxing / viewer-side, and dashed outline (`strokeDasharray="3 2"`) for waning / far-side.
* Integrated `<MiniMoon />` across `LiveSyzygyView.tsx`, `NodalPlaneVisualizer.tsx`, and `ArmillaryBeadsLayer.tsx`.

### 5. Gyro-Morph Nodal Plane Alignment Pill (`[ ☊ Nodal ]`)
* Added `handleSnapToNodal(nodeLonDeg: number)` and `handleResetFromNodal()` to [`useStagedCamera.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/useStagedCamera.ts):
  - Targets $\text{targetPitch} = 0^\circ$ and $\text{targetYaw} = ((\Omega + 90^\circ) \bmod 360^\circ)$, which aligns the Moon's line of nodes directly along the camera sightline ($Z_{\text{cam}}$), exposing the complete $5.145^\circ$ lunar orbital inclination at maximum transverse deflection.
  - Smoothly animates orientation via a 650 ms ease-out cubic spring curve with shortest angular geodesic wrapping.
  - `handleResetFromNodal` restores the previously saved custom 3D perspective.
* Added `[ ☊ Nodal ]` toggle pill to [`ArmillaryModePills.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/controls/ArmillaryModePills.tsx), highlighted with Sky Blue accents (`bg-sky-500 text-slate-950 font-bold ring-1 ring-sky-300`) and accompanied by header telemetry badge `'☊ Nodal Plane (5.145° Sightline)'`.
* Automatically deactivates nodal lock upon canvas dragging, preset switching, or morph rail adjustments.

---

## Consequences

### Positive
* **Harmonized Visual Language**: Complete design consistency between 3D Armillary, Syzygy Ray Diagram, and Axial Sightline windows through `<MiniMoon />`.
* **Physical Sightline Fidelity**: In the Axial Sightline view, the Moon is correctly perceived from its dark unilluminated back, eliminating unphysical white crescents when looking toward the background Sun.
* **Effortless Orbital Analysis**: Users can instantly snap to the edge-on lunar nodal line in the Gyro-Morph Orbit view with a single click, clearly observing the Moon's $5.145^\circ$ inclination.
* **Artifact-Free Ring Rendering**: Edge-on rings smoothly render as solid continuous paths without numerical flickering or disjointed dashed segments.
* **Stable Calendar Navigation**: 30-day synodic lunar almanac viewport remains rock-solid during inspection.
* **Zero Regressions**: 50 test files and 808 tests pass with 100% clean verification.
