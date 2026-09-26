# ADR 0036: Codebase Health, SSoT Astronomical Constants, Worker Fallback Decomposition, and High-LOC Test Suite Partitioning

## Status
Accepted

## Context
Following the completion of Milestone 35, a comprehensive architectural health audit of the Cosmic Engine V2.0 codebase was performed across TypeScript type integrity, Babel AST branded unit-safety rules, Vitest suites, bundle distribution, and file complexity.

The audit revealed an exceptionally healthy foundation with zero build errors or unit violations, but identified four distinct architectural tech debt and maintainability opportunities:

1. **SSoT Constant Centralization & Float Redeclaration**:
   While [`astroConstants.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/astroConstants.ts) canonically provides [`EARTH_AXIAL_OBLIQUITY_J2000_DEG`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/astroConstants.ts#L82) ($23.439281^\circ$) and [`LUNAR_MAJOR_STANDSTILL_DEG`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/astroConstants.ts#L106) ($28.584^\circ$), local hardcoded floats (`OBLIQUITY = 23.439281`, `LUNAR_MAX_DEC = 28.584`, and `MiniGlobe` default props) were defined in presentation hooks (`useSunMeridianMath`, `useSunElevationMath`, `useMoonMeridianMath`, `useMoonElevationMath`, `MiniGlobe`). Additionally, polar colure labeling logic (`S (0°) — Z (+90°) — S (180°)`) was duplicated inline across Sun and Moon meridian hooks.

2. **Ephemeris Worker Concurrency vs Fallback Coupling**:
   [`ephemerisWorkerManager.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/ephemerisWorkerManager.ts) had grown to 755 lines (the largest non-test source file in the repository). More than 150 lines handled synchronous fallback calculation routines (`_executeSyncFallbackForEntry`) and duplicate inline fallback blocks across `requestAnnualSolarCalculation` and `requestAnnualLunarCalculation`, intertwining thread lifecycle and throttling with mathematical fallback execution.

3. **`ArmillaryBeadsLayer` Prop Alias Redundancy**:
   [`ArmillaryBeadsLayer.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/canvas/ArmillaryBeadsLayer.tsx) maintained multiple layers of evolutionary prop aliases (`modelType` vs `projectionMode`, `lambda` vs `morphLambda`, `pitch`/`yaw`/`roll` vs `camera`, `observerLat`/`observerLon` vs `latitude`/`longitude`), requiring runtime fallback resolution. While the production canvas passed canonical props, ~14 unit test call sites in `ArmillaryWidget.test.tsx` still passed legacy aliases.

4. **Mega-Test Suite Monoliths**:
   Two test files had grown to extreme lengths: [`ArmillaryWidget.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/ArmillaryWidget.test.tsx) (2,325 lines, 48 tests) and [`armillary.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/armillary/armillary.test.ts) (1,784 lines, 54 tests). These files created editor lag, high friction during targeted feature development, and limited Vitest's ability to distribute test executions across multi-core worker threads.

---

## Decisions

### 1. SSoT Constant Centralization & Polar Colure Helper (Phase 1)
* Standardized [`LUNAR_MAJOR_STANDSTILL_DEG: Degrees = asDegrees(28.584)`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/astroConstants.ts#L106) in [`astroConstants.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/astroConstants.ts).
* Replaced local scalar constants across `useSunMeridianMath.ts`, `useSunElevationMath.ts`, `useMoonMeridianMath.ts`, `useMoonElevationMath.ts`, and `MiniGlobe.tsx` with canonical imports of `EARTH_AXIAL_OBLIQUITY_J2000_DEG` and `LUNAR_MAJOR_STANDSTILL_DEG`, preserving AST unit-safety compliance (0 `asDegrees()` or `asRadians()` calls in `src/components/**`).
* Preserved re-exports in [`src/components/widgets/today/hooks/index.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/hooks/index.ts) for full downstream test compatibility.
* Extracted pure helper `getPolarColureInfo(latitude: number): PolarColureInfo` in [`src/utils/cosmicMath/today/meridian.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/today/meridian.ts), unifying polar colure axes, zenith labels, and sighting perspective telemetry across Sun and Moon meridian domes.

### 2. Ephemeris Worker Fallback Decomposition (Phase 2)
* Extracted [`src/workers/workerFallback.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/workerFallback.ts) containing deterministic fallback routines:
  - `executeSyncAnnualSolarFallback`: Computes 365-day annual solar matrix with boundary sanitization and cache updates.
  - `executeSyncAnnualLunarFallback`: Computes 365-day annual lunar matrix with boundary sanitization and cache updates.
  - `executeSyncEphemerisFallback`: Computes instantaneous lunar events and syzygy shadow geometry.
  - `executeSyncFallbackForEntry`: Dispatches fallback calculation for any `PendingRequestEntry` (`ANNUAL_SOLAR`, `ANNUAL_LUNAR`, or `EPHEMERIS`) with failsafe callback dispatch.
* Retained `_executeSyncFallbackForEntry` as a lightweight delegation wrapper on `EphemerisWorkerManager`, preserving the public contract expected by unit tests in [`useEphemerisWorker.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/hooks/useEphemerisWorker.test.ts).
* Eliminated four duplicate inline fallback calculation blocks in `requestAnnualSolarCalculation` and `requestAnnualLunarCalculation`.
* Verified strictly acyclic imports (`workerFallback.ts` imports only from pure domain math, types, and sanitizers; zero imports from `ephemerisWorkerManager.ts`).
* Added 26 unit tests in [`src/workers/workerFallback.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/workerFallback.test.ts).

### 3. `ArmillaryBeadsLayer` Prop Contract Normalization (Phase 3)
* Purged legacy prop aliases (`modelType`, `lambda`, `pitch`, `yaw`, `roll`, `observerLat`, `observerLon`) from [`ArmillaryBeadsLayer.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/canvas/ArmillaryBeadsLayer.tsx).
* Normalized internal derivations strictly to canonical structured types:
  - `isHeliocentric = projectionMode === 'heliocentric' || !!isOrbital`
  - `isGeocentric = projectionMode === 'geocentric'`
  - `cameraPitch = camera?.pitch ?? 0`, `cameraYaw = camera?.yaw ?? 0`, `cameraRoll = camera?.roll ?? 0`
  - `lat = latitude ?? 47.06`, `lon = longitude ?? -122.81`
* Migrated 14 direct test call sites in [`ArmillaryWidget.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/ArmillaryWidget.test.tsx) in lockstep to modern prop signatures.

### 4. High-LOC Test Suite Partitioning (Phase 4)
* Partitioned `ArmillaryWidget.test.tsx` (2,325 $\to$ 1,050 lines; -55.3%):
  - Extracted [`ArmillaryBeadsLayer.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/ArmillaryBeadsLayer.test.tsx) (800 lines, 14 tests: lunar phase illumination, 3D terminator, edge-on perspective, depth sorting behind Earth, interactive node pins).
  - Extracted [`ArmillaryControls.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/armillary/ArmillaryControls.test.tsx) (258 lines, 9 tests: mode pills, morph rail, layer toggles, HUD formatting).
  - Retained top-level container integration, camera geodesics, and edge-on ring solid path unification in `ArmillaryWidget.test.tsx` (1,050 lines, 25 tests).
* Partitioned `armillary.test.ts` (1,784 $\to$ 996 lines; -44.2%):
  - Extracted [`armillaryMorph.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/armillary/armillaryMorph.test.ts) (359 lines, 10 tests: Copernican $\leftrightarrow$ Geocentric translation and laser rays morph).
  - Extracted [`armillaryStereographic.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/armillary/armillaryStereographic.test.ts) (490 lines, 8 tests: conformal circles, scale invariance, closed-form Ecliptic center).
  - Retained core coordinate transforms and singularity safeguards in `armillary.test.ts` (996 lines, 36 tests).
* Preserved all 102 armillary tests (0 lost assertions); live harness expanded to 840 tests across 55 suites.

---

## Consequences

### Positive
* **Peak Complexity Reduced**: Not a single file in the entire repository exceeds 1,050 lines. The largest source file ([`ephemerisWorkerManager.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/ephemerisWorkerManager.ts)) is reduced from 755 to 651 lines.
* **Cognitive Guardrail Enforcement**: Complies strictly with *"Zero Lossy Constant Rounding"* by establishing a single source of truth for obliquity and standstill bounds.
* **Vitest Parallelization**: Partitioned test suites run concurrently across worker threads, improving targeted test iteration speed (`npx vitest run ArmillaryControls.test.tsx`).
* **Clean Prop Taxonomy**: Eliminates defensive fallback chains and dead aliases in the 3D beads pipeline.

### Negative / Trade-offs
* None identified. Full backward compatibility was maintained across all public interfaces and test harnesses.
