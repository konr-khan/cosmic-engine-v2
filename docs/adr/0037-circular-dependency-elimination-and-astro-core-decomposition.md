# ADR 0037: Circular Dependency Elimination, Astro-Math Core Decomposition, and Architectural Non-Goal Registration

## Status
Accepted

## Context
Following Milestone 36, an architectural audit of the dependency graph and module responsibilities across the 45,000-line codebase revealed three areas of structural tech debt and maintainability opportunities:

1. **Circular Dependency Between Core Math and Formatters**:
   [`src/utils/formatters.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/formatters.ts) imported `clamp` from [`src/utils/cosmicMath/core.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/core.ts), while `core.ts` re-exported `formatYMD`, `parseTimeString`, and `formatTimeHHMM` from `formatters.ts`. This created a cyclic dependency between fundamental astronomical domain math and UI string formatters, creating risk for module initialization race conditions and tree-shaking ambiguity during production builds.

2. **Domain Pollution in `cosmicMath/core.ts`**:
   `core.ts` housed pure Meeus astronomical foundation algorithms (`getJulianDate`, `calculateGMST`, `calculateLST`, `slerp3D`), but also contained presentation-layer utilities: `formatTime` (HH:MM:SS string formatter) and `getSectorPath` (SVG arc wedge generator used exclusively by `PolarSunlightDial.tsx`).

3. **Sub-Barrel Symmetry Disparity**:
   `src/components/widgets/terminator/index.ts` was the only unreferenced file in the entire repository because `TerminatorMap.test.tsx` imported directly from `./TerminatorMap`, unlike the other 7 observatory widgets whose test suites import through their respective sub-barrels.

4. **Potential Anti-Patterns & False Unifications (Non-Goals)**:
   A surface-level code audit suggested potentially merging `useSunMeridianMath.ts` and `useMoonMeridianMath.ts` to reduce boilerplate, as well as purging `currentDate = new Date()` default parameter assignments across UI components. A rigorous risk/reward analysis revealed that both approaches are hazardous anti-patterns.

---

## Decisions

### 1. Sever Circular Dependency & Establish Direct Import Boundaries (Phase 1)
* **Local Numeric Clamp**: Localized `clamp = (val, min, max) => Math.max(min, Math.min(max, val))` directly within [`src/utils/formatters.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/formatters.ts), eliminating the inward dependency on `cosmicMath/core.ts`.
* **Remove Formatter Re-Exports**: Removed line 145 re-exports from [`src/utils/cosmicMath/core.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/core.ts).
* **Direct UI Import Call Sites**: Migrated [`ChronometerReadoutCards.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/layout/chronometer/ChronometerReadoutCards.tsx) and [`EclipseScanner.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/eclipse/EclipseScanner.tsx) to import string formatters directly from `src/utils/formatters`.
* **Dedicated Test Suite**: Created [`src/utils/formatters.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/formatters.test.ts) (10 tests) and pruned duplicate formatting assertions from [`core.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/core.test.ts).
* **Terminator Sub-Barrel Symmetry**: Updated [`TerminatorMap.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/terminator/TerminatorMap.test.tsx) to import via `.`, activating [`terminator/index.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/terminator/index.ts) symmetrically with the other 7 widgets.

### 2. Domain Decomposition of `core.ts` (Phase 2)
* **Consolidate `formatTime`**: Relocated `formatTime` into [`src/utils/formatters.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/formatters.ts), unifying all date/time string serialization under a single module. Migrated unit test coverage to [`src/utils/formatters.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/formatters.test.ts).
* **Extract `getSectorPath`**: Extracted `getSectorPath` into [`src/components/widgets/solar/polarDialGeometry.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/polarDialGeometry.ts), re-exported through [`src/components/widgets/solar/index.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/index.ts), and added unit tests in [`SolarWidget.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/SolarWidget.test.tsx).
* **Pure Astronomical Math Core**: `src/utils/cosmicMath/core.ts` is now 100% pure astronomical algorithms and coordinate foundations (`getJulianDate`, `dateToJulianDate`, `julianDateToDate`, `isLeapYear`, `getDaysInYear`, `getDayOfYear`, `slerp3D`, `calculateGMST`, `calculateLST`, and numeric `clamp`).
* **UI Call Site Migration**: Updated all 6 remaining UI components ([`LunarAlmanacCard.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/LunarAlmanacCard.tsx), [`LunarRibbonChart.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/LunarRibbonChart.tsx), [`LunarRibbonCurves.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/ribbon/LunarRibbonCurves.tsx), [`SolarRibbonOverlay.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/ribbon/SolarRibbonOverlay.tsx), [`MoonElevationDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/MoonElevationDome.tsx), [`SunElevationDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SunElevationDome.tsx)) to import `formatTime` directly from `src/utils/formatters`.

### 3. Codification of Architectural Non-Goals in `DEAD_ENDS.md` (Phase 3)
* **Registered Dead End #49 (Universal Meridian Presenter Hook / Sun-Moon False Equivalence)**:
  Documented that merging `useSunMeridianMath.ts` and `useMoonMeridianMath.ts` violates Dead End #21. The Sun and Moon follow fundamentally different meridian physics (Rayleigh atmospheric twilight strata down to $-18^\circ$ vs $0^\circ$ physical horizon gating; fixed June/Dec solstice bounds vs 18.6-year nodal standstill oscillation; true ecliptic nodal crossings via Newton-Raphson; apparent lunar phase discs). The shared mathematical coordinates are already unified in `today/meridian.ts`; maintaining separate presenter hooks preserves domain clarity and prevents regressions.
* **Registered Dead End #50 (Purging UI Test-Harness Date Fallback Defaults)**:
  Documented that removing `currentDate = new Date()` default parameter assignments from presentation components and hooks breaks isolated component testing with zero production benefit. In production, `App.tsx` strictly supplies parameterized dates from `cosmicStore`, while pure domain math in `cosmicMath/**` is verified 100% deterministic and free of unparameterized `new Date()` by AST guardrails.

---

## Consequences

* **Zero Circular Dependencies**: AST dependency graph traversal confirms 0 cycles across the entire 45,000-line codebase.
* **Zero Deadwood / Unreferenced Files**: All 8 widget sub-barrels are actively imported and verified in tests.
* **Astronomical Domain Purity**: `src/utils/cosmicMath/core.ts` contains only pure mathematical algorithms; all presentation string formatting is consolidated in `src/utils/formatters.ts`.
* **Preserved Test Ergonomics & Domain Invariants**: Zero test breakages, zero regressions, and clear architectural records in `DEAD_ENDS.md` preventing false unifications.
