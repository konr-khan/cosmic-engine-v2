# ADR 0013: Dynamic Widget Code-Splitting, Monolith Test Decomposition, and Shared SkyDomeBase Primitive

## Status
Accepted

## Context
Following the completion of Tier 1 stabilization (type casting purity, canonical `toRadians`/`toDegrees` centralization, and camera pipeline depth harmonization), the codebase health review identified three primary areas of technical debt and modularity bottlenecks:

1. **Monolithic Bundle Size & Static Imports**:
   - All 8 primary observatory widgets and their extensive mathematical sub-components were statically imported in `src/App.tsx`.
   - The production client bundle reached **526.91 kB (142.33 kB gzip)**, triggering Vite's chunk size limit warning (`(!) Some chunks are larger than 500 kB`).
   - Initial page loads required downloading all widgets simultaneously, regardless of the active dashboard preset layout.
2. **Monolithic Test Suite in `src/utils/cosmicMath.test.ts`**:
   - `src/utils/cosmicMath.test.ts` had expanded to 2,895 lines containing 134 unit tests spanning 6 disparate astronomical domains (Julian calendar, solar ephemeris, lunar illumination, eclipse geometry, 3D projections, and Gyro-Morph armillary/astrolabe math).
   - Test execution, fault isolation, and IDE responsiveness were compromised by the monolithic structure despite the modular decomposition of `src/utils/cosmicMath/`.
3. **Duplicated Sky Elevation Arc Geometry**:
   - `SunElevationDome.tsx` and `MoonElevationDome.tsx` duplicated identical 260x120 SVG elevation arc canvas geometry (`elR = 92`, `elCx = 130`, `elCy = 104`), horizon chords, zenith markers (+90°), and card shells.
   - The meridian transit indicator lacked dynamic adaptation to the observer's geographic hemisphere.

---

## Decisions

### 1. Dynamic Widget Code-Splitting via `React.lazy` & `<Suspense>`
* Converted the 8 primary observatory widgets in [`src/App.tsx`](../../src/App.tsx) to dynamic imports:
  - `TodayHorizonView`, `SolarAlmanac`, `LunarAlmanacCard`, `EclipseDemonstrator`, `TerminatorMap`, `MacroOrbitView`, `GyroArmillaryView`, `MicroTideView`.
* Added `export default GyroArmillaryView;` to [`src/components/widgets/armillary/GyroArmillaryView.tsx`](../../src/components/widgets/armillary/GyroArmillaryView.tsx) to establish uniform ES module default export compliance.
* Wrapped widget rendering in [`src/components/layout/DashboardWindow.tsx`](../../src/components/layout/DashboardWindow.tsx) within a `<Suspense>` boundary nested inside `<WindowErrorBoundary>`.
* Designed a dark glassmorphic skeleton fallback (`bg-slate-900/50 backdrop-blur-sm animate-pulse rounded-xl border border-slate-800/60 min-h-[240px]`) featuring an orbital spinner and shimmering metric bars.

### 2. Decomposed `src/utils/cosmicMath.test.ts` into Domain Suites
* Segmented the 2,895-line monolith into 6 focused test files mirroring the `src/utils/cosmicMath/` module layout:
  - [`core.test.ts`](../../src/utils/cosmicMath/core.test.ts) (36 tests): Julian dates, UTC date invariance, time parsing/formatting, SLERP, physical constants, floating-point protection.
  - [`solar.test.ts`](../../src/utils/cosmicMath/solar.test.ts) (16 tests): Solar declination, equation of time, daily events, twilight bands, polar state bounds, annual solar matrix.
  - [`lunar.test.ts`](../../src/utils/cosmicMath/lunar.test.ts) (16 tests): Meeus lunar series, phase angles, disc illumination ($k$), rise/set solver, annual lunar matrix.
  - [`eclipse.test.ts`](../../src/utils/cosmicMath/eclipse.test.ts) (21 tests): Syzygy shadow geometry, analytical Umbra/Penumbra cones, all 5 presets, multi-year scanner.
  - [`projection.test.ts`](../../src/utils/cosmicMath/projection.test.ts) (11 tests): Earth axial obliquity ($23.439^\circ$), side/axial geometry, observer pin, 4-quadrant orbital loops, continent landmass clipping.
  - [`armillary/armillary.test.ts`](../../src/utils/cosmicMath/armillary/armillary.test.ts) (34 tests): Universal 5-model continuum, GMST/LST, plate projections, Almucantars, unequal hours, astrolabe stars, Free Rete solver, and closed-form stereographic invariants ($R_0\sec\epsilon$).
* Preserved 100% of the 134 original test assertions without regression and removed `src/utils/cosmicMath.test.ts`.

### 3. Extracted Shared `<SkyDomeBase />` Primitive
* Implemented [`src/components/widgets/today/SkyDomeBase.tsx`](../../src/components/widgets/today/SkyDomeBase.tsx):
  - Consolidates canonical constants: `EL_R = 92`, `EL_CX = 130`, `EL_CY = 104`.
  - Renders 0° horizon line, 0° endpoints, semicircular dashed elevation arc, unreachable Zenith Cap, reference chord lines (solstices, standstills), and +90° zenith marker.
  - Dynamically computes the culmination meridian label based on observer latitude:
    \[
    \text{Meridian Label} = \begin{cases} \mathbf{S}, & \text{if } \phi \ge 0^\circ \\ \mathbf{N}, & \text{if } \phi < 0^\circ \end{cases}
    \]
  - Flanks the meridian with East (**E**) on the left (sunrise) and West (**W**) on the right (sunset).
* Refactored `SunElevationDome.tsx` and `MoonElevationDome.tsx` to compose `<SkyDomeBase />`.
* Created [`src/components/widgets/today/SkyDomeBase.test.tsx`](../../src/components/widgets/today/SkyDomeBase.test.tsx) with 10 unit tests validating geometric constants, hemisphere meridian switching, and SVG element rendering.

### 4. Automated Documentation Synchronization
* Updated `scripts/syncDocMetrics.mjs` to register the new decomposed test suites in `CANONICAL_SUITES`.
* Automated two-way metric synchronization across `README.md`, `AGENTS.md`, and `docs/COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md`.

---

## Consequences

### Positive
- **Initial Bundle Slashed by 50.4%**: Client JS bundle dropped from **526.91 kB to 261.29 kB (78.89 kB gzip)**. Vite build generates zero chunk size warnings.
- **Fast First Paint & Lazy Loading**: Users loading specific dashboard presets only fetch the required widget code chunks.
- **Fault-Isolated Loading**: Individual widgets stream asynchronously inside protected `<WindowErrorBoundary>` and `<Suspense>` wrappers.
- **Modular Test Architecture**: Domain tests are isolated, accelerating development cycles and clarifying test failures. Total test count expanded to **429 tests across 27 suites**.
- **Astronomical Fidelity in Sky Domes**: Observers in the Southern Hemisphere correctly see the Northern meridian (`N`) culmination label.

### Neutral / Trade-offs
- Slight increase in initial HTTP requests due to code-split chunks (mitigated by HTTP/2 multiplexing and lazy viewport loading).
