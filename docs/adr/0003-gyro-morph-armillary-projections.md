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
   - Strict 2-phase decoupling separates camera orientation from geometric planar flattening:
     - **Phase A ($\lambda \in [0.0 \to 0.45]$)**: Align camera orientation $(\text{Pitch} \to 90^\circ / 0^\circ, \text{Yaw} \to 0^\circ)$ via shortest geodesic angular delta while geometry remains a rigid 3D sphere ($\lambda_{\text{geom}} = 0$).
     - **Phase B ($\lambda \in [0.45 \to 1.0]$)**: Camera locks at the canonical projection pole while continuous projective flattening ($\lambda_{\text{geom}} \in [0, 1]$) and progressive plate decorations materialize.
     - **Symmetric Reverse Transitions**: Folds 2D plate back into 3D sphere under locked camera before restoring custom user 3D viewing angles with zero drift.

2. **Analytical Circle Almucantar Derivations**:
   - For observer latitude $\phi$ and altitude $a$, compute stereographic Almucantar centers and radii using exact analytical circle formulas (see [`../MATH_SPEC.md#e-2d-astrolabe-historical-projections`](../MATH_SPEC.md#e-2d-astrolabe-historical-projections)) rather than approximating with discretized line segments.

3. **Depth-Sorted Front/Back Vector Splitting & Continuous Unification**:
   - Segments with $z_{\text{cam}} \ge 0$ render with solid, vibrant strokes; segments with $z_{\text{cam}} < 0$ render with dashed, muted strokes (`buildSegmentedSvgPaths`).
   - Over $\lambda \in [0.85, 1.0]$, back segment strokes continuously unify: opacity interpolates from $0.35 \to 1.0$, stroke width expands to match front width, and dash gaps close ($2 \cdot (1 - u)$ where $u = \operatorname{clamp}((\lambda - 0.85)/0.15, 0, 1)$), producing a seamless solid line without double-drawing `fullPathD`.

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

10. **Spherical SLERP & Geodesic Celestial Trajectories (`slerp3D`)**:
    - Pure spherical linear interpolation on $S^2$ for the Sun, Moon, Earth, and all 6 seasonal orbital milestones, preserving exact orbital radii ($r = R_0$) and eliminating chord-cutting or center-dipping artifacts.
    - Rigid $X$-axis rotation $\alpha(t) = (1 - t) \cdot 23.44^\circ$ for Keplerian-to-Ecliptic orbital ring transitions.

11. **Decoupled 2-Stage $SO(3)$ Camera Alignment Choreography & Memory**:
    - Reorients camera pitch and yaw to canonical projection poles ($\text{Pitch} = 90^\circ, \text{Yaw} = 0^\circ$ for Stereographic and Horizon; $\text{Pitch} = 0^\circ, \text{Yaw} = 0^\circ$ for Rojas) during Phase A ($\lambda \in [0.0, 0.45]$) while geometry remains 100% spherical 3D.
    - Locks camera at canonical pole during Phase B ($\lambda \in [0.45, 1.0]$) while projective unwrapping executes.
    - Caches and restores the user's custom 3D viewing perspective in Heliocentric and Geocentric modes, completely eliminating diagonal axis shear during flattening.

12. **Continuous Conformal & Closed-Form Circle-Preserving Projections (`computeContinuousProjection2D`)**:
    - **Closed-Form Stereographic Conformal Orbit Target**: The Ecliptic ring projects directly as an eccentric circle with Center $Y_c = -R_0\tan(\epsilon/2)$ and Radius $R_{\text{ecl}} = R_0/\cos\epsilon = R_0\sec\epsilon$, preserving true astronomical obliquity $\epsilon = 23.439^\circ$ without artificial decay.
    - Stereographic $\longleftrightarrow$ Horizon: Continuous $SO(3)$ observer latitude rotation $\phi(t) = 90^\circ - (90^\circ - \phi) \cdot t$ and $LST(t)$ before applying conformal stereographic projection, mathematically guaranteeing that every celestial circle remains an exact circle throughout the transition.
    - Stereographic $\longleftrightarrow$ Rojas: Continuous optical perspective focal pull $d(t) \in [R_0, \infty)$ combined with $90^\circ$ solstitial colure rotation, transforming circles into Rojas parallel chords without vertex pinching.

13. **Progressive Radial Expansion & Continuous Almucantars (`generateContinuousAlmucantars`)**:
    - Continuous interpolation of altitude circle centers and radii between eccentric stereographic curves and concentric horizon stereonet rings.
    - Progressive radial expansion ($94\% \to 100\%$) and smooth opacity fading ($\lambda \in [0.15, 1.0]$) for the brass bezel, tympan almucantars, and alidade sighting rule.

## Consequences

* **Positive**:
  - Delivers fluid, liquid topological transformations at a steady 60 FPS without GPU/WebGL overhead.
  - Streamlines the continuum into 5 intuitive modes (`heliocentric`, `geocentric`, `stereographic`, `rojas`, `horizon`), merging 3D Sphere into Geocentric Apparent motion.
  - Mathematically authentic across all historical projections and Renaissance horology.
  - Highly maintainable modular architecture with clear separation of math routines and rendering layers; verified across comprehensive Vitest domain test suites.

* **Invariants**:
  - Keep domain projection math pure and deterministic in `src/utils/cosmicMath/armillary/`.
  - Isolate pointer and drag events on interactive SVG groups and canvas sliders (via `e.stopPropagation()`, explicit `touch-action: none`, and `cursor-grab`) to prevent gesture bubbling from triggering parent dashboard window drag-and-drop.
