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
   - Direct, liquid 2D \leftrightarrow 2D cross-projection morphing without forcing a reset back to the 3D sphere.
3. **Zero Heavy WebGL / Three.js Bundle Inflation**: Rendering must remain purely vector SVG with minimal CPU overhead to maintain the application's lightweight architecture.

## Decision

1. **Analytical 3D-to-2D and 2D-to-2D Interpolation Engine**:
   - Implement pure domain math functions in `src/utils/cosmicMath/armillary.ts`.
   - Transform vertices via 3D Euler rotation matrix $\mathbf{R}_{\text{cam}}(\text{pitch}, \text{yaw}, \text{roll})$.
   - Compute target 2D coordinates $\vec{P}_{\text{target}}$ and optional source 2D coordinates $\vec{P}_{\text{source}}$ analytically.
   - Blend 2D cross-projections with transition parameter $t \in [0.0, 1.0]$:
     \[
     \vec{P}_{\text{2D}}(t) = (1 - t) \vec{P}_{\text{source}} + t \vec{P}_{\text{target}}
     \]
   - Blend with 3D camera projection via global morph parameter $\lambda \in [0.0, 1.0]$:
     \[
     \vec{P}_{\text{screen}}(\lambda, t) = (1 - \lambda) \mathbf{\Pi}_{\text{ortho}}(\mathbf{R}_{\text{cam}} \vec{P}_{\text{3D}}) + \lambda \vec{P}_{\text{2D}}(t)
     \]

2. **Analytical Circle Almucantar Derivations**:
   - For observer latitude $\phi$ and altitude $a$, compute stereographic Almucantar center $y_c = R_0 \frac{\cos\phi}{\sin\phi + \sin a}$ and radius $r = R_0 \frac{\cos a}{\sin\phi + \sin a}$ rather than approximating with discretized line segments.

3. **Depth-Sorted Front/Back Vector Splitting**:
   - Segments with $z_{\text{cam}} \ge 0$ render with solid, vibrant strokes; segments with $z_{\text{cam}} < 0$ render with dashed, muted strokes (`buildSegmentedSvgPaths`).
   - At $\lambda \ge 0.98$, all segments unify into solid 2D astrolabe lines.

4. **Spring Physics Transition Loop**:
   - Animate $\lambda$ and $t$ using `requestAnimationFrame` with ease-out cubic deceleration ($1 - (1 - p)^3$) over 500–550ms.

## Consequences

* **Positive**:
  - Delivers fluid, liquid topological transformations at a steady 60 FPS without GPU/WebGL overhead.
  - Mathematically authentic across all historical projections.
  - Decoupled from React render bottlenecks; verified by 155 unit tests.
* **Invariants**:
  - Keep domain projection math pure and deterministic in `src/utils/cosmicMath/armillary.ts`.
  - Isolate pointer and drag events on SVG canvases and sliders to prevent triggering dashboard window drag-and-drop.
