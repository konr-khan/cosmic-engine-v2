# ADR 0007: Eclipse Demonstrator Axial Viewport Upsizing & Prograde Astronomical Kinematics

## Status
Accepted

## Context
The **Side-by-Side Dual-Perspective Eclipse Demonstrator** (`activeTab === 'geometry'`) renders two simultaneous perspectives of syzygy eclipse mechanics:
1. **Left Pane (Syzygy Profile & Shadow Rays)**: Side-on ecliptic transverse profile (`ShadowRayDiagram.tsx`).
2. **Right Pane (Axial Sightline & 5.14° Nodes)**: Down-the-barrel view along the Sun-Earth axis through Earth (`NodalPlaneVisualizer.tsx`).

Prior to this architectural change:
1. **Asymmetrical Viewport Geometry**:
   * The left pane rendered in an expansive $520 \times 220$ canvas ($26:11$ aspect ratio), while the right pane was confined to an asymmetrical $400 \times 180$ canvas enclosed in restrictive CSS height bounds (`min-h-[140px] max-h-[170px]`).
   * Origin centers and horizontal ecliptic reference lines were misaligned ($y = 110$ on the left vs. $y = 90$ on the right), producing a noticeable discontinuity across the side-by-side display.
   * Elements and telemetry in the right pane were cramped, with redundant metric footers competing for vertical canvas space.
2. **Inverted Astronomical Transit Direction (Retrograde Motion)**:
   * Looking toward the Sun along the Sun-Earth sightline with North pointing UP, **East is to the LEFT** and **West is to the RIGHT**.
   * The Moon orbits Earth in a prograde (counter-clockwise) direction, moving from **West to East** (from Right to Left across the sky and across the face of the Sun).
   * The right pane's transverse coordinate formula used $+\sin(\text{phaseRad})$, causing the Moon to transit backwards (from Left to Right / East to West) across the Sun during solar eclipses, and to appear on the wrong side of the Sun during waxing/waning phases.
3. **SVG Coordinate Inversion in Top-Down Micro View**:
   * In the **Earth & Tidal Gravity Micro View** (`MicroTideView.tsx`), SVG's native coordinate system has $+Y$ pointing downward.
   * Standard mathematical counter-clockwise angles $(\cos\theta, \sin\theta)$ therefore rendered as clockwise motion on screen, causing the Moon, tidal bulge, and Sun vector to revolve clockwise while Earth's continents rotated counter-clockwise.

---

## Decision

### 1. Viewport & Aspect Ratio Harmonization
Harmonize the SVG canvas of `NodalPlaneVisualizer.tsx` to exact parity with `ShadowRayDiagram.tsx`:
* **Unified `viewBox`**: Standardized to `0 0 520 220` ($26:11$ aspect ratio).
* **Responsive Height**: Removed the restrictive `min-h-[140px] max-h-[170px]` wrapper div in favor of `w-full h-full block flex-1 min-h-[220px]`.
* **Aligned Center & Reference Plane**: Positioned the sightline origin at $(X_c, Y_c) = (260, 110)$, aligning the horizontal Ecliptic Plane reference chord directly along $y = 110$ continuously across both demonstrator panes.

### 2. Element Upsizing & Visual Hierarchy
Upsize all geometric components in `NodalPlaneVisualizer.tsx` for optimal readability:
* **Lunar Orbit Semi-Major Axis ($R_x$)**: Expanded from $110\text{px} \to 150\text{px}$, leaving balanced 110px margins on each side for labels and node pins.
* **Vertical Inclination Scale**: Increased from $8.5\text{px/deg} \to 10.5\text{px/deg}$, placing the $\pm 5.14^\circ$ orbit within $y \in [56, 164]$.
* **Earth MiniGlobe (Axial Mode)**: Radius expanded from $20\text{px} \to 24\text{px}$ (+20%).
* **Sun Disc & Corona**: Sun radius upsized from $38\text{px} \to 46\text{px}$, with corona wash extending to $62\text{px}$.
* **Shadow Target Cones**: Umbra core radius upsized from $15\text{px} \to 18\text{px}$; penumbra envelope radius from $28\text{px} \to 34\text{px}$.
* **Moon Bead**: Upsized from $8.5\text{px} \to 10.5\text{px}$ with dynamic angular scaling ($8.5\text{px} \dots 12.5\text{px}$).
* **Header Integration**: Streamlined apparent size ratio (`1.019×`) and capability badge (`Total Capable`) directly into the top header, eliminating redundant mini-footers.

### 3. Prograde West-to-East Astronomical Kinematics
Reconcile the camera projection equations with right-handed celestial mechanics:
* With camera view vector $\hat{\mathbf{u}}_{\text{view}} = -\mathbf{e}_X$ and up vector $\hat{\mathbf{u}}_{\text{up}} = +\mathbf{e}_Y$, the camera right vector is $\hat{\mathbf{u}}_{\text{right}} = -\mathbf{e}_Z$ (West).
* Formulate transverse displacement with the correct negative sign:
  \[
  X_{\text{screen}} = X_c - \sin(\text{phaseRad}) \cdot R_x
  \]
  \[
  Y_{\text{screen}} = Y_c - \beta \cdot \text{scalePxPerDeg}
  \]
* Updated matching node coordinates ($X_{\text{asc}}, X_{\text{desc}}$) and 4-quadrant orbital loop segments in `projection.ts` and `cameras.ts`.
* Guarantees that solar eclipses transit monotonically from **Right to Left (West to East)** across the Sun.

### 4. Top-Down SVG Counter-Clockwise Coordination
Account for SVG $Y$-axis inversion in `MicroTideView.tsx`:
* Coordinate angles using negated SVG angles ($\theta_{\text{svg}} = -\theta_{\text{math}}$):
  * `moonAngleDeg = -rawMoonAngle` $\implies (x = 60\cos\theta_{\text{svg}}, y = 60\sin\theta_{\text{svg}})$.
  * `sunAngleDeg = -rawSunAngle`.
  * Tidal bulge rotates with `rotate(${moonAngleDeg})`.
* Harmonizes lunar orbital revolution, tidal bulge orientation, and subsolar daylight terminator rotation with Earth's counter-clockwise axial spin.

### 5. Automated Regression & Invariant Tests
Codify permanent unit test suites:
* **`cameras.stress.test.ts` (Test `C3.2b`)**: Asserts that First Quarter ($phaseVal = 0.25$) is positioned to the Left ($-X$), Third Quarter ($phaseVal = 0.75$) is positioned to the Right ($+X$), and eclipse transit progresses monotonically from Right to Left.
* **`widgets.test.ts`**: Asserts identical `520 220` viewBox, `min-h-[220px]`, and $y=110$ ecliptic level across both demonstrator components, and asserts counter-clockwise $(0, -60)$ translation and `rotate(-90)` tidal bulge rotation in `MicroTideView`.

---

## Consequences

* **Visual & Structural Harmony**: The dual-pane Eclipse Demonstrator presents a balanced, symmetrical $26:11$ aspect ratio with continuous ecliptic horizon alignment.
* **Astronomical Accuracy**: The Moon faithfully obeys prograde orbital dynamics across both the axial eclipse sightline and the top-down tidal micro view.
* **Zero Regressions**: All 20 domain test suites and 382 unit tests pass deterministically.
