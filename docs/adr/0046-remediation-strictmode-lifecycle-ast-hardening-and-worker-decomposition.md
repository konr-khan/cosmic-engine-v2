# ADR 0046: Phases 1–3 Remediation, Persistent 60 FPS Worker Subscriptions, `<StrictMode>` DOM Harness & Worker Subsystem Decomposition

## Status
Accepted

## Context
Following Milestone M45, a multi-phase repository remediation (Phases 1–3) addressed runtime correctness defects, high-frequency worker cancellation under 60 FPS playback, AST/doc-linter edge cases, residual component duplication, missing real-DOM `<StrictMode>` integration tests, and monolith concentration in `src/workers/ephemerisWorkerManager.ts`:

1. **Astronomical & Widget Correctness (`F95`)**:
   - `OrbitalChronometer` twilight branching, lunar illumination terminator orientation, eclipse 3D scene velocities and axial alignment, South Pole meridian Zenith labels (`Z (+90°)`), and `useDashboardLayout` schema/preset persistence required targeted accuracy and boundary fixes.
2. **60 FPS Ephemeris Starvation & Fail-Closed Guardrails (`F96`, `DE-52`)**:
   - Cancelling per-request `requestCalculation()` subscriptions inside `useEphemerisWorker`'s per-tick `useEffect` cleanup caused in-flight worker requests to abort every 16.6 ms whenever animations ran faster than worker round-trip latency (`DE-52`).
   - Inline visual tokens in domain helpers and permissive error handling in AST/doc scripts needed strict fail-closed enforcement.
3. **Component Consolidation, Real-DOM Coverage & Worker Monolith Split (`F97`, `F98`)**:
   - Lunar elevation/meridian hooks duplicated lunar phase/distance/node math, quad-mode fallback SVG gradients risked static ID collisions, `SolarAlmanacCard` / `SolarRibbonChart` duplicated symmetric day lookup logic, and `OrbitSvgCanvas` retained legacy `as any` casts.
   - All existing unit suites ran exclusively under Node without real-DOM `<StrictMode>` lifecycle verification, `localStorage` persistence round-trips, or native non-passive wheel/pointer event testing.
   - `ephemerisWorkerManager.ts` had grown to 840 lines mixing worker spawning/timeouts, trailing-edge throttling, persistent subscriptions, and annual matrix LRU caching.

---

## Decisions

### 1. Persistent Worker Subscription Channel (`F96`, `DE-52`)
- Introduced [`src/workers/ephemerisSubscription.ts`](../../src/workers/ephemerisSubscription.ts) (`createManagedEphemerisSubscription`) and retained subscription instances across 60 FPS `[julianDate, timeOfDay]` ticks in [`src/hooks/useEphemerisWorker.ts`](../../src/hooks/useEphemerisWorker.ts), disposing strictly on unmount or orbital disable.
- Extracted pure visual tokens into `armillaryTokens.ts` and `todayTokens.ts`, and hardened `math-purity`, `unit-safety`, and `doc-integrity` checks in [`scripts/lintUnitSafety.mjs`](../../scripts/lintUnitSafety.mjs) and [`scripts/syncDocMetrics.mjs`](../../scripts/syncDocMetrics.mjs).

### 2. Shared UI Helpers & Opt-In `jsdom` `<StrictMode>` Test Harness (`F97`)
- Consolidated lunar dome calculations in [`src/components/widgets/today/hooks/useLunarDomeSharedMath.ts`](../../src/components/widgets/today/hooks/useLunarDomeSharedMath.ts), extracted `findMirrorSolarDay`, scoped quad-mode fallback `<defs>` IDs, and eliminated remaining `as any` casts in `OrbitSvgCanvas.tsx`.
- Added [`src/hooks/workerLifecycle.dom.test.tsx`](../../src/hooks/workerLifecycle.dom.test.tsx) and [`src/App.dom.test.tsx`](../../src/App.dom.test.tsx) opted into `// @vitest-environment jsdom` (keeping Vitest's global `node` default intact while binding `jsdom.window.localStorage` for Node 26 WebStorage compatibility).

### 3. Acyclic Web Worker Multiplexer Decomposition (`F98`)
- Decomposed [`src/workers/ephemerisWorkerManager.ts`](../../src/workers/ephemerisWorkerManager.ts) (840 -> 352 LOC facade) into five cohesive, non-circular modules:
  - [`src/workers/ephemerisTypes.ts`](../../src/workers/ephemerisTypes.ts) (shared contracts & `buildEphemerisSignature`)
  - [`src/workers/workerTransport.ts`](../../src/workers/workerTransport.ts) (singleton worker lifecycle, unload hooks, timeouts, sequence filter)
  - [`src/workers/ephemerisThrottle.ts`](../../src/workers/ephemerisThrottle.ts) (trailing-edge 100ms flag-merging coalescer)
  - [`src/workers/ephemerisSubscription.ts`](../../src/workers/ephemerisSubscription.ts) (persistent 60 FPS consumer subscription state machine)
  - [`src/workers/ephemerisAnnualCache.ts`](../../src/workers/ephemerisAnnualCache.ts) (bounded 16-entry solar/lunar LRU caches & fallback delegation)
- Preserved all existing public fields, getters/setters, and test spy methods on `EphemerisWorkerManager` without altering caller contracts.

---

## Consequences
- **60 FPS Resilience**: Continuous chronometer playback no longer aborts in-flight worker requests across React effect ticks, and real `<StrictMode>` remount behavior is verified continuously in `jsdom`.
- **Clean Module Boundaries**: Worker transport, throttling, subscription management, and LRU caching evolve independently in focused modules (< 300 LOC each) verified under TypeScript strict mode, Vite production worker bundling, and `ARCHITECTURE.md` 1:1 file parity.
