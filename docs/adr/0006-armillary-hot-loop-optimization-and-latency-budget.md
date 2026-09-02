# ADR 0006: Armillary Hot-Loop Projection Optimization & < 0.8ms Latency Budget Guardrail

## Status
Accepted

## Context
The **Gyro-Morph Dynamic Armillary & Astrolabe** is an interactive, continuous 5-model continuum instrument uniting the Copernican Heliocentric Solar System, Geocentric 3D Armillary Sphere, Stereographic Conformal Astrolabe Rete, Rojas Universal Orthographic Plate, and Topocentric Horizon Stereonet.

The visualizer operates on a continuous 60 FPS animation ticker driven by React 19 `useSyncExternalStore` and `requestAnimationFrame`. On every tick, the model dynamically computes:
* 8 depth-sorted 3D celestial rings sampled at 72 angular intervals (Celestial Equator, Ecliptic track, Horizon, Solstitial/Equinoctial Colures, Tropics of Cancer/Capricorn).
* Analytical Stereographic almucantars (altitude curves) and historical Unequal Planetary Hour curves.
* Clamped Ecliptic Sun bead, Moon, Earth MiniGlobe, milestone nodes, and lunar orbital nodes.
* Volumetric laser projection cones and Alidade sighting telemetry.

Prior to optimization:
1. **Repeated Trigonometric Redundancy**: Euler camera rotation matrices and stereographic cross-projection resolvers were instantiated and recomputed per vertex across thousands of points per frame.
2. **Intermediate Array Allocation**: SVG path generation allocated intermediate arrays of transformed coordinate objects before concatenating SVG path `d` strings, inducing heavy garbage collection (GC) pressure and micro-stuttering during active slider scrubbing.
3. **Reverse Transition Dislocation**: Transitioning from 2D historical plates back to 3D spheres suffered from camera pitch/yaw snapping when geometric morph unwinding was decoupled from user angle restoration.
4. **Lack of Performance Invariant Enforcement**: No automated regression test existed to prevent subsequent refactors from degrading per-frame execution latency.

## Decision

### 1. Higher-Order Closure-Cached Rotator & Projection Factories
Pre-calculate all trigonometric values ($\sin, \cos$) and scale coefficients once per frame, returning fast, allocation-free coordinate mapping closures:
* **`createEulerCameraRotator(pitch, yaw, roll)`** ([`src/utils/cosmicMath/armillary/coordinates.ts`](../../src/utils/cosmicMath/armillary/coordinates.ts)):
  Evaluates camera pitch, yaw, and roll angles into constant scalar multipliers once, transforming any 3D vector $(x, y, z) \to (x', y', z')$ with direct scalar arithmetic.
* **`createContinuousProjectionResolver(pMode, fromMode, transT, lat, r0)`** ([`src/utils/cosmicMath/armillary/projections.ts`](../../src/utils/cosmicMath/armillary/projections.ts)):
  Pre-computes optical focal pulling distances ($d \in [R_0, \infty)$), latitude rotations, and boundary regimes once per frame, eliminating branching in hot ring evaluation loops.

### 2. Single-Pass SVG Path Streaming (`paths.ts`)
Refactor **`generateParametricRing3D`** ([`src/utils/cosmicMath/armillary/paths.ts`](../../src/utils/cosmicMath/armillary/paths.ts)) to stream SVG path commands (`M`, `L`, `A`) directly into string buffers:
* Eliminates intermediate vertex array allocations and transformations.
* Applies a single, efficient coordinate formatting pass (`.toFixed(2)`) at point emission.
* Generates front-facing and back-facing depth segments in a single traversal.

### 3. Cached 3x3 Coordinate Transformations
Pre-compute and cache static $\mathbf{M}_{\text{ecl}\to\text{eq}}$ and $\mathbf{M}_{\text{eq}\to\text{ecl}}$ rotation matrices in [`src/utils/cosmicMath/scene/transforms.ts`](../../src/utils/cosmicMath/scene/transforms.ts) and [`cameras.ts`](../../src/utils/cosmicMath/scene/cameras.ts) to eliminate runtime matrix instantiation.

### 4. Symmetric 2-Stage Reverse Camera Choreography
Enforce strict two-phase reverse transition choreography in [`useStagedCamera.ts`](../../src/components/widgets/armillary/useStagedCamera.ts):
* **Phase 1 (Un-flattening, $\lambda \in [1.0 \to 0.45]$):** 2D plate geometry continuously folds back into a rigid 3D sphere while camera pitch remains locked at the canonical projection pole.
* **Phase 2 (Angle Restoration, $\lambda \in [0.45 \to 0.0]$):** With 3D geometry fully restored, camera pitch and yaw smoothly interpolate along shortest geodesic deltas back to the user's custom viewing angles with zero drift.

### 5. Continuous Automated Latency Benchmark Guardrail
Codify a permanent performance benchmark suite in [`src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts`](../../src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts):
* Computes 1,000 continuous frames across all 5 continuum modes with a strict threshold: **average latency < 0.8 ms per frame** (over $\times 20$ faster than the 16.6 ms 60 FPS frame budget).
* Enforces deterministic mathematical repeatability across repeated calls.
* Verifies non-NaN, non-Infinity geometric invariants and SVG path syntax validity.
* Validates astronomical milestone node counts and physics telemetry preservation.

## Consequences

* **Zero GC Stutter**: Per-frame heap allocation in rendering hot loops is eliminated, guaranteeing fluid 60 FPS interaction during continuous slider scrubbing.
* **Predictable Reverse Camera Navigation**: Users can inspect 2D astrolabe plates and return to 3D armillary exploration without losing their viewing orientation.
* **Regression Immunity**: Any future architectural change that inadvertently degrades projection efficiency beyond 0.8 ms fails automated CI testing immediately.
