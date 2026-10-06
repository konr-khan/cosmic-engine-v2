# ADR 0039: Codebase Hardening, UTC Temporal Invariance, and Type-Safe Worker RPC

## Status
Accepted

## Context
Following a comprehensive independent codebase audit, several latent numerical bugs, temporal leaks, referential churn issues, and type escapes were identified across the 27,000-line production codebase:

1. **Ticker Floating-Point Quantization Freeze**:
   - In `src/store/cosmicStore.ts`, `tickTime(deltaSeconds)` formatted intermediate time with `parseFloat(newTime.toFixed(4))`.
   - At 60 FPS ($16.67\text{ ms}$/frame), the time increment $\Delta h = (0.01667 \times 1) / 3600 \approx 4.63 \times 10^{-6}\text{ hours}$. Because `toFixed(4)` truncates at 4 decimal places ($10^{-4}\text{ h} = 0.36\text{ s}$), each frame increment rounded down to $0.0000$, permanently freezing clock accumulation at $1\times$ playback speed. Existing unit tests only asserted macroscopic time jumps ($3600\text{ s}$ or $500\text{ ms}$ catch-up clamps), concealing the defect.
2. **UTC vs. Local Timezone Leaks**:
   - Several components mixed client-local timezone methods with astronomical UTC epoch times:
     - `App.tsx` passed `year={date.getFullYear()}` while its slider callback used `date.getUTCFullYear()`.
     - `OrbitalChronometer.tsx` and `LunarAlmanacCard.tsx` called `getFullYear()` for annual calculations and date formatting.
     - `useSunMeridianMath.ts` reinvoked ad-hoc start-of-year calculations with `new Date(currentDate.getFullYear(), 0, 1)`, introducing local timezone offsets into the day-of-year count.
     - `OrbitSvgCanvas.tsx` evaluated `const currentYear = new Date().getFullYear();`, snapping the calendar date back to the client's current wall-clock year during orbital drag scrubbing.
     - `src/utils/cosmicMath/eclipse.ts` formatted recurrence candidate titles via `toLocaleDateString()` without `timeZone: 'UTC'`, injecting host machine timezones into the pure domain mathematical engine.
3. **`currentDate = new Date()` Default Parameter Anti-Pattern**:
   - 19 components and hooks assigned `currentDate = new Date()` as a default parameter. When callers omitted `currentDate`, a brand-new `Date` object reference was allocated on every render. Because `currentDate` sits in `useMemo` dependency arrays across calculation hooks, referential inequality (`prev !== next`) invalidated memoized geometry on every frame and triggered garbage collection churn.
4. **Worker Manager Type Leakage**:
   - In `src/workers/ephemerisWorkerManager.ts`, `_requestAnnualCalculation` took `cache: LruCache<string, any>`, cast callbacks `as any` five times, and cast the request entry `as unknown as PendingRequestEntry`, accounting for over 60% of all type escapes in the production codebase.
5. **Documentation Drift & Repository Inconsistencies**:
   - `AGENTS.md` referenced deprecated `useCosmicStore(s => s.julianDate)`, when the exported hook is `useChronometerStore` and `julianDate` is computed in `useCosmicEngine`.
   - The repository lacked `.gitattributes`, leading to mixed CRLF/LF line endings on Windows.
   - `App.tsx` contained redundant nominal casts (`12 as HoursDecimal`).
6. **Meridian Hook View-Model Duplication**:
   - `useSunMeridianMath.ts` and `useMoonMeridianMath.ts` repeated identical object construction boilerplate for swaths, radial ticks, gate anchors, and peak targets.

---

## Decisions

### 1. Ticker Precision & Double-Precision Store Accumulation (Phase 1)
- **Eliminate `toFixed(4)` Quantization**: Removed string rounding inside `cosmicStore.tickTime()`. Stored `timeOfDay` as full IEEE-754 double precision (`HoursDecimal`), allowing per-frame deltas ($\approx 4.63 \times 10^{-6}\text{ h}$) to accumulate smoothly at arbitrary speeds.
- **Precision Test Suite**: Added Vitest test cases simulating 600 frames at 60 FPS ($16.67\text{ ms}$ increments) at $1\times$ speed, fractional speed ($0.25\times$), and negative speed ($-1\times$) across midnight boundaries, verifying that time advances accurately without quantization loss.

### 2. Full UTC Temporal Invariance & Domain Decoupling (Phase 2)
- **Canonical UTC Year Handling**: Switched all calendar year evaluations to `date.getUTCFullYear()` in `App.tsx`, `OrbitalChronometer.tsx`, and `LunarAlmanacCard.tsx`.
- **Adopt Canonical `getDayOfYear()`**: Replaced ad-hoc local date math in `useSunMeridianMath.ts` with the canonical pure function `getDayOfYear(currentDate)`.
- **Preserve Simulation Epoch During Orbital Drag**: Passed `year={currentDate.getUTCFullYear()}` through `MacroOrbitView` to `OrbitSvgCanvas`, defaulting to 2026 when omitted and eliminating the wall-clock year snap.
- **Deterministic UTC Formatting**: Added `{ timeZone: 'UTC' }` to `toLocaleDateString` in `eclipse.ts` and `MacroOrbitView.tsx`, guaranteeing identical output strings across all timezones.

### 3. Immutable `J2000_DATE` Prop Identity Stability & AST Guardrail (Phase 3)
- **Export Immutable Constant `J2000_DATE`**: Defined `export const J2000_DATE = new Date(Date.UTC(2000, 0, 1, 12, 0, 0))` in `src/utils/cosmicMath/astroConstants.ts` and re-exported it from `src/utils/cosmicMath/index.ts`.
- **Replace Default Parameter Allocations**: Replaced `= new Date()` with `= J2000_DATE` across all 19 component and hook signatures. Preserved standalone test ergonomics while providing a stable object identity for React 19 `useMemo` hooks.
- **Automated AST Guardrail**: Added `runDefaultDateCheck` to `scripts/lintUnitSafety.mjs` and a unit test in `src/types/unitSafety.test.ts`, permanently banning `= new Date()` default parameters across all 118 UI component and hook files.

### 4. Discriminated Annual Ephemeris Worker RPC Maps (Phase 4)
- **Discriminated RPC Type Maps**: Defined `AnnualCalculationType`, `AnnualCalculationPayloadMap`, `AnnualCalculationParamsMap`, `AnnualCalculationRequestTypeMap`, and `AnnualCalculationCacheItemMap` in `src/types/worker.ts`.
- **Eliminate `any` Casts**: Refactored `_requestAnnualCalculation<K extends AnnualCalculationType>` in `src/workers/ephemerisWorkerManager.ts` to use generic parameter `K`, strongly typed caches, and typed callback sets. Completely eliminated all 5 `as any` and `as unknown as PendingRequestEntry` assertions.

### 5. Repository Standardization & Documentation Alignment (Phase 5)
- **Standardize Line Endings**: Added `.gitattributes` at root specifying `* text=auto eol=lf`, `*.svg text eol=lf`, and marking image/font assets as `binary`.
- **Reconcile Documentation**: Corrected `AGENTS.md` Section 6 to reference `useChronometerStore(s => s.timeOfDay)`.
- **Clean Up Presentation Casts**: Removed unused `HoursDecimal` import and pruned `12 as HoursDecimal` from `App.tsx`.

### 6. Meridian View-Model Helper Extraction (Phase 6)
- **Extract View-Model Builders**: Created `src/components/widgets/today/hooks/meridianConfigHelpers.ts` with strongly typed builders: `createMeridianRadialTickConfig`, `createMeridianSwathConfig`, `createMeridianGateAnchorConfig`, and `createMeridianPeakTargetConfig`.
- **Preserve Domain Separation**: Refactored `useSunMeridianMath.ts` and `useMoonMeridianMath.ts` to consume these builders, deduplicating boilerplate while strictly preserving separate domain logic for the Sun's 1-year tropical cycle vs. the Moon's 18.6-year nodal precession (Dead End #49).
- **Dedicated Test Suite**: Added `meridianConfigHelpers.test.ts` with 9 unit tests.

---

## Consequences
- **Continuous 60 FPS Clock Simulation**: The chronometer store advances smoothly without quantization freezing when the simulation ticker runs.
- **100% Deterministic UTC Temporal Model**: Ephemeris titles, orbital scrubbing, and chronometer labels produce identical outputs across Tokyo, UTC, and Los Angeles runtimes.
- **Zero Allocation Churn in Default Parameters**: Visualizer components and hooks no longer instantiate dynamic `Date` instances per render, maintaining strict referential equality in `useMemo` hooks.
- **-62.5% Reduction in Codebase Type Escapes**: Production `as any` / `as unknown` assertions dropped from 8 to 3, with 0 remaining in `ephemerisWorkerManager.ts`.
- **Automated Invariant Protection**: AST linting continuously enforces both nominal unit safety and default `Date` allocation prevention.
- **Expanded Test Coverage**: Test suite grew from 58 suites / 856 tests to **59 suites / 872 tests** with 100% green verification.
