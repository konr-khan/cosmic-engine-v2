# ADR 0047: Phases 1–5 Codebase Hardening, Stale-While-Revalidate Worker Offloading, `jsdom` A11y Harness, Design Tokens & CI

## Status
Accepted

## Context
A full codebase audit following Milestone M46 identified concrete runtime defects, worker utilization leaks, thin interactive DOM coverage, scattered design/coordinate defaults, oversized modules, and CI/linting gaps:

1. **Runtime Correctness & Edge Cases (`F99`, `DE-54`)**:
   - `findUpcomingEclipses` derived `eventDate` from `startDate.getTime() + (peakJD - startJD) * 86400000` despite `startJD` being anchored at `12:00 UTC`, causing calendar-day drift for non-noon start dates (`DE-54`).
   - `EclipseDemonstrator` ran a 365-day eclipse scan on every date change even when the Scanner tab was inactive.
   - `AstrolabeDial` divided by `rect.width / 270` without zero-dimension guards, mixed raw CSS pixels with SVG units, and called unguarded `setPointerCapture` on `e.target`.
   - `CosmicStore` setters accepted `NaN`/`Infinity`/invalid dates without clamping; `createUTCDate` / `julianDateToDate` shifted years `0–99` to `1900–1999`; and `@babel/parser` was an undeclared phantom dependency of `scripts/lintUnitSafety.mjs`.
2. **Worker Offloading, Caching & Pure Math Boundaries (`F100`, `DE-53`)**:
   - `useAnnualMatrixWorker` computed and seeded 365-day matrices synchronously during render on every cache miss, bypassing Web Worker execution and double-rendering (`DE-53`).
   - `WorkerTransport` tracked a single global `latestProcessedEphemerisId` across heterogeneous capability lanes (`L-`, `-E`, `LE`).
   - `frame.ts` used a 1-entry cache that thrashed between noon-anchored almanac widgets and live-time 60 FPS widgets; tidal bulge math lived inline in `useCosmicEngine.ts`; and `EphemerisWorkerManager` retained ~100 lines of unused internal shims alongside a production-inventoried `mockWorkerFixture.ts`.
3. **Interactive DOM Coverage, Accessibility, Tokens, Splits & CI (`F101`, `F102`)**:
   - 22 of 24 `.test.tsx` suites relied solely on SSR markup snapshots; interactive keyboard/ARIA semantics were incomplete across `DashboardWindow`, `ObsNavbar`, `EclipseDemonstrator`, and `ArmillarySvgCanvas`.
   - Observer defaults (`47.06` / `-122.81`) were duplicated across 18 files, `animate-in` / `fade-in` / `zoom-in-*` classes had no CSS keyframes, `meridianConfigHelpers.ts` / `cameras.ts` / `ArmillaryBeadsLayer.tsx` exceeded 500 LOC, `useDashboardLayout` read `localStorage` three times on mount, and `npm run verify` ran Vitest twice with no CI workflow.

---

## Decisions

### 1. Runtime Bugfixes & Input Boundary Guards (`F99`, `DE-54`)
- Derived eclipse dates directly via `julianDateToDate(peakJD)` in [`src/utils/cosmicMath/eclipse.ts`](../../src/utils/cosmicMath/eclipse.ts) and gated `findUpcomingEclipses` behind `activeTab === 'scanner'` in [`src/components/widgets/eclipse/EclipseDemonstrator.tsx`](../../src/components/widgets/eclipse/EclipseDemonstrator.tsx).
- Hardened pointer math/capture in [`src/components/layout/chronometer/AstrolabeDial.tsx`](../../src/components/layout/chronometer/AstrolabeDial.tsx), unified twilight phase classification via `classifySolarTwilightPhase` in [`src/utils/cosmicMath/solar.ts`](../../src/utils/cosmicMath/solar.ts), preserved years `0–99` in [`src/utils/cosmicMath/core.ts`](../../src/utils/cosmicMath/core.ts), clamped `CosmicStore` mutations in [`src/store/cosmicStore.ts`](../../src/store/cosmicStore.ts), and declared `@babel/parser` in `devDependencies`.

### 2. Stale-While-Revalidate Annual Worker, Per-Lane Monotonicity & 4-Entry Frame LRU (`F100`, `DE-53`)
- Switched `useAnnualMatrixWorker` in [`src/hooks/useEphemerisWorker.ts`](../../src/hooks/useEphemerisWorker.ts) to stale-while-revalidate after initial cold mount so latitude/year updates execute off-thread without double-rendering.
- Scoped `WorkerTransport` sequence filtering per capability lane (`latestProcessedEphemerisIdByLane`) in [`src/workers/workerTransport.ts`](../../src/workers/workerTransport.ts).
- Extracted `calculateOrbitalTideMetrics` into [`src/utils/cosmicMath/lunar.ts`](../../src/utils/cosmicMath/lunar.ts), upgraded [`src/utils/cosmicMath/frame.ts`](../../src/utils/cosmicMath/frame.ts) to a 4-entry `LruCache`, added an `enabled` subscription bypass to `useChronometerStore`, slimmed [`src/workers/ephemerisWorkerManager.ts`](../../src/workers/ephemerisWorkerManager.ts), and moved `mockWorkerFixture.ts` to `tests/fixtures/mockWorkerFixture.ts`.

### 3. Real-DOM `jsdom` Suites, Accessibility, Token SSoT, Splits & CI (`F101`, `F102`)
- Added [`src/components/layout/layoutInteractions.dom.test.tsx`](../../src/components/layout/layoutInteractions.dom.test.tsx) and [`src/components/widgets/widgetsInteractions.dom.test.tsx`](../../src/components/widgets/widgetsInteractions.dom.test.tsx) alongside ARIA/keyboard controls across `DashboardWindow`, `ObsNavbar`, `EclipseDemonstrator`, and `ArmillarySvgCanvas`.
- Centralized `DEFAULT_OBSERVER_LATITUDE`/`DEFAULT_OBSERVER_LONGITUDE` in [`src/utils/cosmicMath/astroConstants.ts`](../../src/utils/cosmicMath/astroConstants.ts), created [`src/components/common/designTokens.ts`](../../src/components/common/designTokens.ts), and implemented `@keyframes ce-enter` utilities with `prefers-reduced-motion` support in [`src/index.css`](../../src/index.css).
- Split `meridianConfigHelpers.ts` (`sunMeridianConfig.ts`, `moonMeridianConfig.ts`), `cameras.ts` (`eulerCamera.ts`), and `ArmillaryBeadsLayer.tsx` (`ArmillaryNodesSublayer.tsx`); consolidated single-read `localStorage` initialization in [`src/hooks/useDashboardLayout.ts`](../../src/hooks/useDashboardLayout.ts); memoized `DashboardWindow` and `App.tsx` callbacks; deduplicated `npm run verify`; and added `.github/workflows/ci.yml` + correctness-only `eslint.config.js`.

---

## Consequences
- **True Off-Thread Annual Recomputations & Zero Cache Thrashing**: Latitude/year scrubbing offloads 365-day calculations cleanly to the Web Worker while noon-anchored and live-time frames coexist in a 4-entry LRU cache.
- **Stronger Behavioral & Governance Safety Net**: Real-DOM `<StrictMode>` coverage doubled (4 `jsdom` suites, 63 suites / 929 tests total), CI verification runs in a single Vitest pass, and all SSoT/AST guardrails remain 100% green.
