# ADR 0004: Hierarchical 3D Astronomical Scene Graph & Canonical Camera Rigs

## Status
Accepted (Phase 1)

## Context
**Cosmic Engine V2.0** renders complex multi-body celestial phenomena across several distinct visualizer subsystems:
1. **Heliocentric Macro Orbit View**: Keplerian planetary orbit with 6 seasonal milestones (Perihelion, Aphelion, Solstices, Equinoxes) and lunar orbit.
2. **Eclipse Demonstrator**: Dual-perspective side-on syzygy profile (Transverse Ecliptic Profile) and down-the-barrel sightline along the Sun-Earth axis through Earth (Axial Sightline Profile) with $5.14^\circ$ inclined lunar orbit and ray-traced Umbra/Penumbra shadow cones.
3. **Gyro-Morph Dynamic Armillary & Astrolabe**: 5-model continuum spanning Heliocentric Copernican Orbit, Geocentric Celestial Armillary Sphere, Stereographic Conformal Rete, Rojas Universal Orthographic, and Topocentric Horizon stereonet.
4. **Today's Sky Horizon Dome & Daylight Terminator Map**: Topocentric elevation domes and global equirectangular solar/lunar terminator projections.

Prior to Phase 1, each widget calculated its 2D graphical coordinates independently from raw ephemeris values or simplified planar approximations. This created three major architectural drawbacks:
- **Coordinate Inconsistencies & Visual Disconnects**: Slight mathematical differences between widgets (e.g., lunar latitude $\beta$ and elongation angle differed between Macro Orbit, Eclipse Demonstrator, and Armillary View).
- **Duplicated Trigonometric Logic**: Planetary orbit ellipses, nodal angles, and axial tilt rotations were recalculated in each UI component.
- **Inconsistent Planetary Representation**: Earth was rendered as a flat circle in Macro Orbit, a custom 2D line-drawn sphere in Eclipse, and a static bead in the Armillary, lacking a unified 3D-oriented globe with physical day/night terminator clipping.

## Decision Drivers
1. **Single Geometric Source of Truth**: Establish a pure 3D scene graph (`src/utils/cosmicMath/scene/`) providing true 3D inertial coordinates for Sun, Earth, Moon, 6 seasonal milestone nodes, and the $5.14^\circ$ inclined lunar orbit with continuous nodal precession $\Omega(t)$.
2. **Mathematical Authenticity & Exact Conic Geometry**:
   - Keplerian orbit parameterization for both True Scale ($e = 0.01671$) and Exaggerated Eccentricity ($e = 0.25$) modes with identical milestone true anomaly $\nu(t)$ arc spacing.
   - Analytical 3D Umbra and Penumbra shadow cones derived from physical solar/lunar/terrestrial radii ($R_\odot = 696,340\text{ km}$, $R_\oplus = 6,378.137\text{ km}$, $R_{\text{moon}} = 1,737.4\text{ km}$).
   - Physical $23.439281^\circ$ Earth axial obliquity $\varepsilon$ preserved in 3D inertial space.
3. **Reusable Modular `<MiniGlobe />` SVG Component (`src/components/common/MiniGlobe.tsx`)**:
   - Analytical day/night terminator hemisphere clipping relative to the 3D solar illumination vector $\vec{S}_{\text{cam}}$.
   - Civil, Nautical, and Astronomical twilight boundary bands.
   - Demarcated Equator and Tropics of Cancer/Capricorn parallels with $23.44^\circ$ rotational polar axis.
   - Pulsing topocentric observer pin ("YOU") reporting live local daylight status.
4. **Canonical Camera Projection Pipelines (`src/utils/cosmicMath/scene/cameras.ts`)**:
   - `projectHeliocentricTopDown`: Top-down orthographic projection on Ecliptic plane $(X, Y)$.
   - `projectGeocentricTransverse`: Side-on ecliptic transverse profile with Umbra/Penumbra shadow cones.
   - `projectGeocentricAxial`: Down-the-barrel Sun-Earth sightline through Earth.
   - `projectEulerCamera`: Generalized 3D Euler camera $(\text{Pitch}, \text{Yaw}, \text{Roll})$ with analytical limb clipping and depth sorting.
5. **Reactive State & Concurrency Pipelines (`src/hooks/useCosmicScene.ts`)**:
   - 60 FPS memoized evaluation subscribed to `CosmicStore` via React 19's `useSyncExternalStore`.
   - Specialized projection selectors (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`) with `shallowEqual` protection.

## Considered Options

### Option 1: Ad-hoc Per-Widget 2D Calculations (Status Quo)
- *Pros*: Simple localized code per component.
- *Cons*: High code duplication, coordinate drift between visualizers, impossible to render consistent 3D Earth orientation. Rejected.

### Option 2: Heavy 3D WebGL / Three.js Scene Graph Engine
- *Pros*: Built-in 3D scene hierarchy and camera matrices.
- *Cons*: Significant bundle size inflation (+600KB+), high GPU battery consumption, conflicts with crisp vector SVG styling, and violates the lightweight architecture of Cosmic Engine V2.0. Rejected.

### Option 3: Pure TypeScript Mathematical 3D Scene Graph + Functional Camera Projections to Vector SVG (Chosen)
- *Pros*: Zero bundle inflation, deterministic pure functional math, sub-millisecond execution at 60 FPS, crisp SVG vector rendering across all display resolutions, full integration with React 19 state architecture.

## Decision Outcome

### 1. Pure 3D Scene Graph Architecture (`src/utils/cosmicMath/scene/`)
- **`types.ts`**: Defines foundational interfaces: `CosmicScene3D`, `SceneBody3D`, `SceneEarth3D`, `SceneMoon3D`, `MilestoneNode3D`, `LunarOrbit3D`, `ShadowCones3D`, `ProjectedScene2D`, `CameraViewport`.
- **`transforms.ts`**: Implements $3\times 3$ matrix algebra (`multiplyMatrix3x3`, `transformVector3D`, `rotationMatrixX`, `rotationMatrixY`, `rotationMatrixZ`), frame conversions between Heliocentric Ecliptic J2000 and Geocentric Equatorial/Ecliptic frames, inertial axial tilt vectors, subsolar vectors, and 3D shadow cone apex formulas.
- **`generator.ts`**: Implements `generateCosmicScene(params)`:
  - Generates Earth position on Keplerian orbit (True Scale $e=0.01671$ vs. Exaggerated $e=0.25$).
  - Calculates 6 seasonal milestones in 3D inertial space.
  - Dynamically modulates $5.14^\circ$ lunar orbital plane tilt via Sun-Earth-Node angle $\Delta\Omega(t) = \lambda_\odot - \Omega_{\text{node}}$.
  - Generates 72-point 3D lunar orbital ring with 4-quadrant depth and node coloring.
- **`cameras.ts`**: Implements pure projection pipelines:
  - `projectHeliocentricTopDown`: Viewport projection for Macro Orbit.
  - `projectGeocentricTransverse`: Viewport projection for Eclipse left pane.
  - `projectGeocentricAxial`: Viewport projection for Eclipse right pane.
  - `projectEulerCamera`: 3D Euler viewport for Armillary 3D Apparent mode.

### 2. Reusable High-Precision `<MiniGlobe />` Component (`src/components/common/MiniGlobe.tsx`)
Supports 5 canonical view modes:
- `'topdown'`: Heliocentric Keplerian Macro Orbit (sunward semicircle, $23.44^\circ$ tilt).
- `'transverse'`: Geocentric side-on transverse profile (Eclipse left pane, tilted polar axis $\theta_{\text{side}} = \varepsilon \sin\lambda_\odot$).
- `'axial'`: Geocentric down-the-barrel sightline (Eclipse right pane, curved 3D equator arc).
- `'euler3d'`: Free 3D Euler camera rotation with analytical spherical limb clipping (Armillary 3D Apparent mode).
- `'flat'`: 2D flattened astrolabe plate pin with concentric brass reticle rings (Astrolabe Rete, Rojas, Horizon modes).

### 3. Reactive Scene Hook (`src/hooks/useCosmicScene.ts`)
- Master hook `useCosmicScene(options)` derives 3D scene data and ephemeris snapshots.
- Specialized selector `useHeliocentricScene()` supplies pre-projected Keplerian coordinates and subsolar illumination to `MacroOrbitView`.
- Specialized selector `useEclipseScene()` supplies aligned transverse and axial geometries to `EclipseDemonstrator` (`LiveSyzygyView` and `NodalPlaneVisualizer`).
- Specialized selector `useArmillaryScene()` supplies 3D celestial coordinates to `GyroArmillaryView`.

### 4. Armillary Groundwork & MiniGlobe Integration (`ArmillaryBeadsLayer.tsx`)
- In 3D Apparent mode (`modelType === 'apparent'` / `geocentric` and $\lambda = 0$), renders `<MiniGlobe viewMode="euler3d" />`, rotating seamlessly with user 3D camera dragging in inertial space.
- In 2D astrolabe plate modes (`'rete'`, `'rojas'`, `'horizon'`) or when morphing ($\lambda > 0$), locks `<MiniGlobe viewMode="flat" />` stationary at center $(cx, cy)$ with radius matching plate proportions.
- Passes observer coordinates (`observerLat`, `observerLon`) to render the pulsing topocentric observer pin.

## Mathematical Invariants & Coordinate Contracts

1. **Right-Handed Coordinate Conventions**:
   - Heliocentric Ecliptic: $+X$ towards March Equinox ($\Upsilon$), $+Y$ in ecliptic plane ($90^\circ$ East / June Solstice), $+Z$ towards North Ecliptic Pole.
   - Geocentric Equatorial: $+X$ towards March Equinox ($\alpha = 0^\circ, \delta = 0^\circ$), $+Y$ towards $\alpha = 90^\circ, \delta = 0^\circ$, $+Z$ towards North Celestial Pole ($\delta = +90^\circ$).
2. **Coordinate Transformations**:
   \[
   \mathbf{M}_{\text{ecl}\to\text{eq}} = \mathbf{R}_x(-\varepsilon) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\varepsilon & -\sin\varepsilon \\ 0 & \sin\varepsilon & \cos\varepsilon \end{pmatrix}
   \]
   \[
   \mathbf{M}_{\text{eq}\to\text{ecl}} = \mathbf{R}_x(+\varepsilon) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\varepsilon & \sin\varepsilon \\ 0 & -\sin\varepsilon & \cos\varepsilon \end{pmatrix}
   \]
3. **Euler Camera Orientation Matrix**:
   \[
   \mathbf{R}_{\text{cam}}(\psi, \theta, \phi) = \mathbf{R}_x(\psi) \mathbf{R}_y(\theta) \mathbf{R}_z(\phi)
   \]
   where $\psi = \text{Pitch}$, $\theta = \text{Yaw}$, $\phi = \text{Roll}$.
4. **Analytical Umbra & Penumbra Shadow Geometry**:
   \[
   L_{\text{umbra}} = \frac{R_\oplus \cdot d_{\text{sun}}}{R_\odot - R_\oplus}, \quad \alpha_{\text{umbra}} = \arcsin\left(\frac{R_\odot - R_\oplus}{d_{\text{sun}}}\right)
   \]
   \[
   L_{\text{penumbra}} = \frac{R_\oplus \cdot d_{\text{sun}}}{R_\odot + R_\oplus}, \quad \alpha_{\text{penumbra}} = \arcsin\left(\frac{R_\odot + R_\oplus}{d_{\text{sun}}}\right)
   \]
5. **Subsolar Illumination Unit Vector in Camera Frame**:
   \[
   \vec{S}_{\text{cam}} = \mathbf{R}_{\text{cam}}(\text{Pitch}, \text{Yaw}, \text{Roll}) \begin{pmatrix} \cos\delta_\odot \cos\alpha_\odot \\ \cos\delta_\odot \sin\alpha_\odot \\ \sin\delta_\odot \end{pmatrix}
   \]

## Consequences

### Positive
- **Exact Coordinate Parity**: Macro Orbit, Eclipse Demonstrator, and Gyro-Morph Armillary share the exact same mathematical source of truth.
- **Enhanced Visual Realism**: All widgets render an illuminated, axially tilted `<MiniGlobe />` with subsolar daylight/twilight clipping.
- **Maintainability**: Pure domain math is isolated in `src/utils/cosmicMath/scene/`, decoupled from React component rendering.
- **Performance**: Zero GPU/WebGL overhead; entire 3D scene evaluation executes in $< 0.1\text{ms}$ per frame.
- **Type Safety**: Full integration with nominal branded typing (`Degrees`, `Radians`, `JulianDate`, `Latitude`, `Longitude`).

### Invariants
- Keep all scene calculations pure and free of side-effects.
- Never perform state mutations inside camera projection pipelines.
- Ensure all SVG elements maintain stable React `useId()` keys to prevent DOM clipPath identifier collisions.
- Preserve 100% test passage across the full Vitest suite.
