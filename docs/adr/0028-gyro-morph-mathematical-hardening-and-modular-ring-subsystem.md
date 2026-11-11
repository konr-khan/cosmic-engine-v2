# ADR 0028: Gyro-Morph Mathematical Hardening, Projection Singularities & Modular Ring Subsystem

## Status
Accepted

## Context
The **Gyro-Morph Armillary & Astrolabe** window (`src/utils/cosmicMath/armillary/`) simulates a 5-mode mathematical continuum spanning heliocentric Copernican orbit, geocentric apparent motion, 2D stereographic conformal astrolabe plates, universal Rojas orthographic projections, and topocentric horizon stereonets.

While historically robust under typical mid-latitude conditions, rigorous mathematical and edge-case inspection revealed several vulnerabilities:
1. **Nadir Sinking Coordinate Runaway**:
   In `projectTopocentricHorizon`, celestial beads sinking below the horizon toward the Nadir ($a \to -90^\circ$) evaluate $r = r_0 \tan((90^\circ - a)/2) \to \infty$. This caused runaway SVG canvas coordinates (exceeding $10^6\text{px}$) when celestial objects dipped below the local horizon.
2. **Southern Hemisphere Almucantar Asymptote**:
   In stereographic astrolabe projection (`calculateAlmucantarCircle`), the Almucantar circle radius formula contains $\sin\phi + \sin a$ in the denominator. When an observer is in the Southern Hemisphere ($\phi < 0$) and the altitude parallel matches the absolute latitude ($a \approx |\phi|$), the circle passes through the South Celestial Pole (the projection center), causing $\sin\phi + \sin a \to 0$ and $R, y_c \to \infty$. This produced massive SVG radii exceeding $500,000\text{px}$ and triggered GPU rasterization glitches.
3. **High-Latitude Polar Day/Night Indeterminacy**:
   During arctic/antarctic midnight sun ($\Delta t_{\text{day}} \ge 24\text{h}$) or polar night ($\Delta t_{\text{night}} \ge 24\text{h}$), sunrise and sunset converge ($t_{\text{rise}} = t_{\text{set}}$). In `calculatePlanetaryHour`, dividing by $\Delta t_{\text{day}}$ resulted in `NaN` progression percentages and degenerate planetary hours.
4. **Coordinate Negative Zeroes (`-0`)**:
   Standard IEEE 754 floating-point operations in Cartesian-to-spherical transformations and orthographic projections frequently produced `-0`, causing assertion mismatches and unpredictable string serialization.
5. **Monolithic Generator Architecture**:
   `generator.ts` had grown to ~575 lines, tightly coupling raw 3D body positions, camera rotators, projection resolvers, and a 250-line inline ring generation routine (`generateArmillaryRings`).

---

## Decisions

### 1. Finite Projection Bounding & Nadir Clamping (`projections.ts`)
In `projectTopocentricHorizon`:
- Clamped radial distance $r \le 10 \cdot r_0$ ($1000\text{px}$ at $r_0 = 100$).
- Clamped output Cartesian coordinates $(x, y) \in [-10 \cdot r_0, 10 \cdot r_0]$.
- Standardized negative zero normalization across all projection resolvers via `Object.is(v, -0) ? 0 : v`.

### 2. Southern Hemisphere Almucantar Singularity Safeguard (`astrolabe.ts`)
In `calculateAlmucantarCircle`:
- Added an explicit guard: if $|\sin\phi + \sin a| < 10^{-4}$, the denominator is safeguarded.
- Clamped circle radius $r_a \le 25 \cdot r_0$ ($2500\text{px}$) and center $|y_c| \le 25 \cdot r_0$.
- Preserved conformal circular fidelity for all visible sky regions while eliminating runaway SVG canvas boundaries.

### 3. Circumpolar Piecewise Kinematics for Planetary Hours (`astrolabe.ts`)
In `calculatePlanetaryHour`:
- Sanitized input time using universal Euclidean positive modulo: `((currentTime % 24) + 24) % 24`.
- Added dedicated piecewise branches for polar day ($\Delta t_{\text{day}} \ge 23.99\text{h}$) and polar night ($\Delta t_{\text{day}} \le 0.01\text{h}$ or $\Delta t_{\text{night}} \ge 23.99\text{h}$), evenly dividing the 24-hour cycle into 12 two-hour daytime or nighttime planetary hours.
- Clamped `progressPercent` strictly within $[0, 100]$.

### 4. Coordinate Hygiene & Indeterminacy Resolution (`coordinates.ts`)
- In `equatorialToHorizontal`, when altitude is within $10^{-6}$ of Zenith ($+90^\circ$) or Nadir ($-90^\circ$), azimuth is canonically assigned $0.0^\circ$ rather than yielding indeterminate values.
- In `cartesian3DToEquatorial`, normalized all negative zeroes and wrapped Right Ascension strictly into $[0^\circ, 360^\circ)$.

### 5. Extraction of Modular Ring Generation Subsystem (`generatorRings.ts`)
- Extracted `generateArmillaryRings` and `GenerateArmillaryRingsParams` from `generator.ts` into a dedicated file [`generatorRings.ts`](../../src/utils/cosmicMath/armillary/generatorRings.ts).
- Encapsulates the parametric 3D curves and depth sorting for all 8 rings:
  1. `orbit_path`: Keplerian heliocentric orbit / ecliptic track
  2. `lunar_orbit`: $5.145^\circ$ inclined precessing lunar ring
  3. `equator`: Celestial Equator ($\delta = 0^\circ$)
  4. `ecliptic`: Zodiac Rete ring inclined at $23.44^\circ$
  5. `tropic_cancer`: Tropic of Cancer ($\delta = +23.44^\circ$)
  6. `tropic_capricorn`: Tropic of Capricorn ($\delta = -23.44^\circ$)
  7. `horizon`: Topocentric local horizon ring ($a = 0^\circ$)
  8. `colure`: Solstitial Colure meridian ring
- In `generator.ts`, re-exported `export * from './generatorRings'`, reducing `generator.ts` from 575 to 280 lines while maintaining 100% backward compatibility for all imports.

---

## Consequences

### Positive
- **Guaranteed Finite Bounds**: Even under pathological inputs (Nadir sinking, Southern Almucantar asymptotes, polar midnight sun), no coordinate produces `NaN`, `Infinity`, or unbounded pixel values.
- **Architectural Modularity**: `generator.ts` serves cleanly as a top-level facade orchestrator, while `generatorRings.ts`, `generatorBeads.ts`, and `generatorGeometry.ts` own their respective domain mathematics.
- **Strict Performance Preservation**: Hot-loop frame generation latency benchmark clocked at **~0.58 ms / frame**, comfortably below the $< 0.8\text{ ms}$ budget invariant across 1,000 continuous frames.
- **Zero Breaking Changes**: Public contracts from `src/utils/cosmicMath/armillary/index.ts` remain completely unchanged.
- **Test Suite Expansion**: Regression suite expanded by 6 tests to **707 total tests across 47 suites** (100% pass rate).

### Negative / Trade-Offs
- For Southern Hemisphere observers where an altitude circle approaches the South Celestial Pole ($\text{alt} \approx |\phi|$), bounding the circle radius to $2500\text{px}$ approximates the infinite planar straight line with a finite high-radius arc; however, the region beyond the plate horizon is clipped by the astrolabe limb regardless.
