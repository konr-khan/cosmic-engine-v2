# ADR 0003: Continuous Vector Morphing & Analytical Projections for Gyro-Morph Armillary

## Status
Accepted

## Context
Cosmic Engine V2.0 introduces the **Gyro-Morph Dynamic Armillary & Astrolabe** visualizer, bridging classical Ptolemaic and Renaissance instrumentation with modern 3D celestial mechanics.

The visualizer must satisfy three conflicting constraints:
1. **Historical Mathematical Authenticity**: Accurate implementation of 3 classical projection geometries:
   - Hipparchus / Ptolemy **Stereographic Conformal Projection** (Equatorial plane, conformal circle preservation).
   - Juan de Rojas **Universal Orthographic Projection** (Solstitial colure plane, latitude-independent).
   - Topocentric **Horizon Stereonet** (Observer Zenith-centered azimuthal).
2. **Smooth 60 FPS Continuous Morphing**:
   - Continuous vector interpolation between 3D Euler camera space ($\lambda = 0.0$) and 2D historical plates ($\lambda = 1.0$).
   - Direct, liquid $2\text{D} \leftrightarrow 2\text{D}$ cross-projection morphing without forcing a reset back to the 3D sphere.
3. **Zero Heavy WebGL / Three.js Bundle Inflation**: Rendering must remain purely vector SVG with minimal CPU overhead to maintain the application's lightweight architecture.

## Decision

1. **Universal Any-to-Any Vector Interpolation & Staged Choreography**:
   - Pure domain math functions implemented in `src/utils/cosmicMath/armillary/`.
   - Generalizes morphing across all 5 coordinate model spaces (`☉ Orbit`, `⊕ Apparent`, `🧭 Rete`, `📐 Rojas`, `🔭 Horizon`) via continuous topological vector blending and ease-out cubic spring physics; formal derivations and staged timing intervals are canonically defined in [`../MATH_SPEC.md#7-gyro-morph-armillary-multi-model-unification--astrolabe-projections`](../MATH_SPEC.md#7-gyro-morph-armillary-multi-model-unification--astrolabe-projections).
   - Staged choreography coordinates camera pitch/yaw alignment ($T \in [0.0, 0.4]$), geometric unwrapping ($T \in [0.2, 0.8]$), and astrolabe plate decoration materialization ($T \in [0.6, 1.0]$).

2. **Analytical Circle Almucantar Derivations**:
   - For observer latitude $\phi$ and altitude $a$, compute stereographic Almucantar centers and radii using exact analytical circle formulas (see [`../MATH_SPEC.md#e-2d-astrolabe-historical-projections`](../MATH_SPEC.md#e-2d-astrolabe-historical-projections)) rather than approximating with discretized line segments.

3. **Depth-Sorted Front/Back Vector Splitting**:
   - Segments with $z_{\text{cam}} \ge 0$ render with solid, vibrant strokes; segments with $z_{\text{cam}} < 0$ render with dashed, muted strokes (`buildSegmentedSvgPaths`).
   - At $\lambda \ge 0.98$, all segments unify into solid 2D astrolabe lines.

4. **Spring Physics Transition Loop**:
   - Animate transition progress $T$ using `requestAnimationFrame` with ease-out cubic deceleration ($1 - (1 - p)^3$) over 500–550ms.

5. **Analog Astrolabe Free Rete Solver Mode**:
   - Allow user to uncouple the Rete from the live astronomical clock and rotate it manually.
   - Calculate Apparent Local Sidereal Time ($\theta_{\text{apparent}}$) and Apparent Solar Time ($T_{\text{solar}}$) instantaneously as an interactive analog computer (see [`../MATH_SPEC.md#g-free-rete-spinning--analog-solar-time-solver`](../MATH_SPEC.md#g-free-rete-spinning--analog-solar-time-solver)).

6. **Volumetric Optical Laser Cones & Center of Projection Beacon**:
   - Render the physical projection center $(0, -R_0, 0)$ as a glowing focal beacon with 8 radiating laser rays and a translucent conic envelope linking the 3D sphere to the 2D projective plate.

7. **Historical Alidade Sighting Arm & Star Snapping**:
   - Equip the astrolabe rule with dual pinnule sighting vanes (pinhole slits) and an extended laser sightline.
   - Smoothly animate the sighting arm to lock onto stars (*Sirius*, *Vega*, *Arcturus*, *Rigel*), Sun, or Moon upon user click.

8. **Decomposed Modular Math & Canvas Architecture**:
   - Math functions decomposed into dedicated domain sub-modules under `src/utils/cosmicMath/armillary/` (`coordinates`, `projections`, `astrolabe`, `focalBeacon`, `alidade`, `paths`, `generator`).
   - SVG visual canvas decomposed into modular visual layers under `src/components/widgets/armillary/canvas/` (`ArmillaryDefs`, `ArmillaryBezelLayer`, `ArmillaryTympanLayer`, `ArmillaryLaserLayer`, `ArmillaryObserverConeLayer`, `ArmillaryRingsLayer`, `ArmillaryStarsLayer`, `ArmillaryBeadsLayer`, `ArmillaryAlidadeLayer`).

9. **Clamped Ecliptic Track Sun Bead**:
   - Sun bead position $\vec{P}_\odot$ is mathematically clamped directly to the parametric Ecliptic track (see [`../MATH_SPEC.md#b-clamped-ecliptic-track-sun-bead`](../MATH_SPEC.md#b-clamped-ecliptic-track-sun-bead)), eliminating drift across seasons and Rete rotations.

## Consequences

* **Positive**:
  - Delivers fluid, liquid topological transformations at a steady 60 FPS without GPU/WebGL overhead.
  - Streamlines the continuum into 5 intuitive modes (`heliocentric`, `geocentric`, `stereographic`, `rojas`, `horizon`), merging 3D Sphere into Geocentric Apparent motion.
  - Mathematically authentic across all historical projections and Renaissance horology.
  - Highly maintainable modular architecture with clear separation of math routines and rendering layers; verified across comprehensive Vitest domain test suites.

* **Invariants**:
  - Keep domain projection math pure and deterministic in `src/utils/cosmicMath/armillary/`.
  - Isolate pointer and drag events on interactive SVG groups and canvas sliders (via `e.stopPropagation()`, explicit `touch-action: none`, and `cursor-grab`) to prevent gesture bubbling from triggering parent dashboard window drag-and-drop.
