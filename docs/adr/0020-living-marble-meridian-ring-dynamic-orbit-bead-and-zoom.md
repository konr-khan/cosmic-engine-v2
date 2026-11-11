# ADR 0020: Living Marble Great Meridian Ring, Dynamic 3D Orbit Bead & Multi-Scale Orbit Zoom Controls

## Status
Accepted

## Context
Following user testing of the Gyro-Morph Armillary and Solar System Macro Orbit visualizers, four geometric, kinematic, and interaction enhancements were identified:

1. **Living Marble Longitudinal Grid & Optical Bifurcation**:
   - The 3D Living Marble (`MiniGlobe.tsx` in `euler3d` mode) rendered an artificial static vertical line across the globe diameter (`miniglobe-polar-axis`). Because this line was fixed in screen space and did not rotate with Greenwich Mean Sidereal Time / UTC hour angle or observer longitude, it appeared as an artificial bifurcation dividing the globe in half and breaking the floating 3D spherical illusion.
   - Initial implementation of the $0^\circ$ Greenwich Prime Meridian clipped points at the spherical horizon ($z_{\text{cam}} \ge -0.02$). This caused the meridian curve to abruptly vanish whenever Greenwich rotated onto the far hemisphere of Earth, preventing users from viewing the complete Great Meridian Ring continuously through the translucent marble like the Equator parallel.

2. **Orbiting Earth Bead Kinematics in Gyro-Morph Orbit View**:
   - In 3D Heliocentric Orbit mode (`projectionMode === 'heliocentric'`), the miniature Earth bead orbiting the central Sun was rendered with a flat 2D `topdown` sticker.
   - When the user pitched or yawed the 3D camera, the flat sticker snapped and flipped hemispheres abruptly. Furthermore, its day/night terminator was decoupled from the 3D camera vector pointing toward the central Sun at $(0, 0, 0)$.

3. **Telephoto Inset Camera Angle (`ArmillaryEarthPip`)**:
   - The "Terra Living Marble" Picture-in-Picture inset in the Orbit view was rendered from a static camera orientation that did not match the user's active viewport line-of-sight or physical subsolar illumination vector, leading to inconsistent lighting between the inset and the main view.

4. **Multi-Scale Orbit Zoom**:
   - Both the 3D Gyro-Morph Orbit view and the 2D Solar System Macro Orbit view lacked direct zoom magnification, preventing close-up inspection of orbital milestones, planetary beads, and rotating continental landmasses.

---

## Decisions

### 1. Full Great Meridian Ring ($0^\circ$ Prime Meridian & $180^\circ$ Antimeridian)
- In `src/components/common/MiniGlobe.tsx`, implemented the complete $360^\circ$ Great Meridian Ring in `euler3d` space:
  - **$0^\circ$ Prime Meridian**: $\phi \in [-90^\circ, +90^\circ]$ from South Pole to North Pole at Greenwich hour angle $H_0 = (t - 12) \times 15^\circ$.
  - **$180^\circ$ Antimeridian**: $\phi \in [+90^\circ, -90^\circ]$ from North Pole to South Pole at opposite hour angle $H_{180} = H_0 + 180^\circ$.
- **Continuous Through-Marble Visibility**: Removed horizon-crossing depth clipping ($z_{\text{cam}} \ge -0.02$). Because both semicircles project isometrically into $X^2 + Y^2 \le R^2$, both front and back segments remain visible at all times through the marble, matching the visual convention of the Equator ellipse parallel.
- Styled both paths in `MiniGlobeSphere.tsx` Layer 4 with Equator-matching Sky Blue (`#38bdf8`, `strokeWidth="0.65"`, `strokeDasharray="2 1.5"`, `opacity="0.75"`) and semantic `<title>` elements (`0° Prime Meridian (Greenwich)` and `180° Antimeridian`).
- Gated out the static `miniglobe-polar-axis` chord in `euler3d` mode, eliminating the artificial bifurcation line.

### 2. Dynamic 3D Euler Orbiting Earth Bead
- Upgraded the Earth bead in `ArmillaryBeadsLayer.tsx` from `topdown` to `viewMode="euler3d"`.
- Dynamically derived the normalized camera-space Sun-to-Earth unit vector:
  $$\vec{S}_{\text{cam}} = \frac{\vec{P}_{\text{sun, cam}} - \vec{P}_{\text{earth, cam}}}{\|\vec{P}_{\text{sun, cam}} - \vec{P}_{\text{earth, cam}}\|}$$
- Passed `subsolarCameraVector={subsolarCamVec}` into `MiniGlobe`, ensuring that the day/night terminator continuously and physically faces the central Sun at all times as the camera pitches and yaws, with zero popping or flipping.

### 3. Telephoto Inset Camera Alignment (`ArmillaryEarthPip`)
- Computed `subsolarCameraVector` in `ArmillarySvgCanvas.tsx` and passed it directly to `ArmillaryEarthPip`.
- The Terra Living Marble PIP inset now shares the exact line-of-sight and physical subsolar illumination vector of the main 3D Orbit viewport.

### 4. Heliocentric Multi-Scale Orbit Zoom Controls
- **Gyro-Morph Orbit Canvas (`ArmillarySvgCanvas.tsx`)**:
  - Implemented dynamic `zoom` state ($0.75\times$ to $3.5\times$, default $1.0\times$) adjusting SVG `viewBox` dynamically:
    $$\text{viewBox} = \left[ -\frac{150}{\text{zoom}}, -\frac{150}{\text{zoom}}, \frac{300}{\text{zoom}}, \frac{300}{\text{zoom}} \right]$$
  - Attached non-passive wheel zoom listener (`onWheel`) isolated strictly to 3D Heliocentric Orbit mode (`isOrbital && morphLambda <= 0.05`).
  - Added auto-reset hook returning zoom cleanly to $1.0\times$ whenever transitioning into 2D historical plates (`🧭 Rete`, `📐 Rojas`, `🔭 Horizon`).
  - Rendered a floating glassmorphic zoom pill at `bottom-3 right-3` with `[-]`, `zoom×` readout, `[+]`, and conditional `[Reset]` button.
- **Solar System Macro Orbit (`MacroOrbitView.tsx` & `OrbitSvgCanvas.tsx`)**:
  - Added smooth wheel zoom ($0.5\times$ to $3.5\times$, default $1.0\times$) and floating zoom pill controls.
  - Enabled `showContinents={true}` on Earth's `MiniGlobe` in `OrbitSvgCanvas.tsx`, allowing users to zoom into Earth and inspect rotating continental landmasses.

---

## Consequences

### Positive
- **Visual Parity & Floating 3D Illusion**: Suppressing the static polar axis in `euler3d` restores the uninterrupted spherical depth of the Living Marble, while the continuous Great Meridian Ring ($0^\circ / 180^\circ$) provides an authentic, rotating astronomical reference.
- **Continuous 3D Lighting**: The orbiting Earth bead in Gyro-Morph Orbit view is now a genuine 3D body with physically accurate terminator orientation across all camera pitch and yaw angles.
- **Enhanced Observational Inspection**: Users can fluidly zoom into both heliocentric orbit visualizers from wide Keplerian perspectives down to close-up planetary inspections.
- **Plate Calibration Isolation**: Automatic reset guards ensure historical astrolabe plates (`🧭 Rete`, `📐 Rojas`, `🔭 Horizon`) remain anchored to their strict mathematical projections ($R_0 = 100\text{px}$) without scale distortion.

### Test Coverage
- Comprehensive tests added in `MiniGlobe.test.tsx`, `ArmillaryWidget.test.tsx`, and `MacroOrbitWidget.test.tsx`.
- All 588 tests pass across 40 test suites.
- 0 unit-safety violations across all 80 UI components.
