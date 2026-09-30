# ADR 0038: Codebase Health Refactoring, Domain Purity, and Widget Decoupling

## Status
Accepted

## Context
Following Milestone 37, a comprehensive codebase health audit across the 45,000-line codebase identified several maintainability opportunities, deadwood relics, and presentation-domain coupling:

1. **Deprecated Facades and Barrel Asymmetry**:
   - `src/utils/cosmicMath/todaySky.ts` remained as a legacy 40-line re-export facade following the M18 modular decomposition of `today/` (`elevation.ts`, `meridian.ts`, `draconic.ts`), with only a single test file still referencing it.
   - `src/components/widgets/armillary/index.ts` exported non-existent primitives (`AstrolabeReteView`, `AlmucantarTympanView`, `RojasPlateView`) from an early pre-continuum prototype, while failing to export modern components (`ArmillarySvgCanvas`, `ArmillaryControls`, `ArmillaryHoverHud`).
   - `src/utils/cosmicMath/milestones.ts` maintained a redundant uppercase alias `MILESTONES = SEASONAL_MILESTONES`.
2. **Domain Math Misplacement & Duplicate Worker Calculations**:
   - `getTerminatorShadowPaths` was located in `src/utils/cosmicMath/globe.ts` rather than `terminatorTracks.ts`, violating single-responsibility boundaries for diurnal ground track rendering.
   - `ephemerisWorkerManager.ts` processed two simultaneous annual matrix recalculations (`fetchAnnualSolarMatrix` and `fetchAnnualLunarMatrix`) when updating years or observers, rather than batching them through worker memoization.
   - `SunMeridianDome.tsx` and `MoonMeridianDome.tsx` shared ~70 lines of identical footer markup that had not yet been extracted into a reusable `MeridianDomeFooter` primitive.
3. **Presentation Leaks in Mathematical Domain Modules**:
   - `src/utils/cosmicMath/milestones.ts` embedded Tailwind utility class strings (`text-indigo-400`, `fill-amber-500/20`), CSS filters, and 2D SVG pixel offsets (`xOffset: -40`) directly within astronomical coordinate definitions.
   - `src/utils/cosmicMath/constants.ts` contained an unused, unbranded `ASTRO_CONSTANTS` record duplicating `astroConstants.ts`, along with presentation-layer UI color codes.
   - `src/utils/cosmicMath/scene/generator.ts` relied on hardcoded Cartesian fallback coordinates instead of analytically deriving 3D seasonal milestone coordinates from Keplerian orbital mechanics.
4. **Heavy Math Coupled Inside Widget Presenters**:
   - `MicroTideView.tsx` inlined ~110 lines of complex geometry, true lunar node crossing event solvers (Dead End #16), and 4-quadrant SVG path builders.
   - `NodalPlaneVisualizer.tsx` inlined ~80 lines of dynamic apparent angular diameter scaling, 3D axial sightline depth sorting (Dead End #33), and orbital plane slicing.

---

## Decisions

### 1. Barrel & Architecture Alignment (Phase 1)
- **Standardize `armillary/index.ts`**: Purged phantom exports and exported canonical public components: `GyroArmillaryView`, `ArmillarySvgCanvas`, `ArmillaryControls`, `ArmillaryHoverHud`, and interactive hooks.
- **Purge `todaySky.ts` Facade**: Deleted `todaySky.ts`. Migrated `todaySky.test.ts` to import directly from `src/utils/cosmicMath/today`.
- **Eliminate `MILESTONES` Alias**: Removed redundant uppercase alias in `milestones.ts` and updated call sites to canonical `SEASONAL_MILESTONES`.
- **Documentation Count Reconciliation**: Reconciled master ADR count in `PROJECT.md`.

### 2. Mathematical Purity & Worker Optimization (Phase 2)
- **Relocate `getTerminatorShadowPaths`**: Moved `getTerminatorShadowPaths` and `TerminatorShadowPaths` from `globe.ts` to `terminatorTracks.ts`.
- **Extract `MeridianDomeFooter`**: Created [`src/components/widgets/today/MeridianDomeFooter.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/MeridianDomeFooter.tsx) and updated `SunMeridianDome.tsx` and `MoonMeridianDome.tsx`.
- **Deduplicate Worker Annual Matrix Dispatching**: Added active request deduplication in `ephemerisWorkerManager.ts` to prevent redundant parallel generation for the same parameters.

### 3. Presentation Decoupling & Token Modernization (Phase 3)
- **Purge Presentation Tokens from Domain Math**: Removed Tailwind classes and pixel offsets from `milestones.ts`, establishing pure astronomical types.
- **Create `macroTokens.ts`**: Established [`src/components/widgets/macro/macroTokens.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/macro/macroTokens.ts) housing visual tokens, badge styles, and hover state classes for `OrbitSvgCanvas.tsx`.
- **Retire `constants.ts`**: Safely deleted `src/utils/cosmicMath/constants.ts` and migrated all references to canonical SSoT modules (`astroConstants.ts` and `macroTokens.ts`).
- **Analytical 3D Seasonal Milestone Derivation**: Derived milestone positions in `scene/generator.ts` analytically via Keplerian radius $r(\nu) = a(1 - e^2) / (1 + e\cos\nu)$ and true anomaly $\nu$.
- **AST Presentation Token Linter Guardrail**: Extended `scripts/lintUnitSafety.mjs` and `src/types/unitSafety.test.ts` to verify 0 UI presentation tokens in `src/utils/cosmicMath/**`.

### 4. Widget Sub-View Decoupling & Hook Standardization (Phase 4)
- **Extract `useTideMath` Hook**: Created [`src/components/widgets/tides/hooks/useTideMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/tides/hooks/useTideMath.ts), encapsulating true lunar node events (Dead End #16), 4-quadrant segments, and Moon position vectors. Refactored `MicroTideView.tsx`.
- **Extract `useNodalPlaneMath` Hook**: Created [`src/components/widgets/eclipse/hooks/useNodalPlaneMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/eclipse/hooks/useNodalPlaneMath.ts), isolating apparent angular scaling and axial sightline depth sorting (Dead End #33). Refactored `NodalPlaneVisualizer.tsx`.
- **Establish Dedicated Hook Barrel Exports**: Created `hooks/index.ts` for tides and eclipse widget subsystems.
- **Dedicated Hook Unit Tests**: Added `useTideMath.test.ts` (8 tests) and `useNodalPlaneMath.test.ts` (6 tests).

---

## Consequences

- **100% Mathematical Domain Purity**: `src/utils/cosmicMath/**` contains strictly pure astronomical algorithms with zero UI classes, Tailwind tokens, or presentation-layer offsets.
- **Strict AST Guardrail Enforcement**: Automated linter ensures future modifications cannot leak presentation tokens into pure math.
- **Declarative, Clean Presenters**: `MicroTideView.tsx` and `NodalPlaneVisualizer.tsx` are now pure presentational components decoupled from heavy trigonometric and Keplerian calculations.
- **Full Invariant Preservation**: Dead Ends #16 (true node crossings) and #33 (axial sightline depth sorting) remain rigorously protected and tested.
- **Expanded Test Suite**: Comprehensive test harness expanded to 58 test files and 856 tests with zero regressions.
