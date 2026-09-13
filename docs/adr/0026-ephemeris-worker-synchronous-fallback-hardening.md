# ADR 0026: Ephemeris Worker Synchronous Fallback Hardening, Defensive Boundary Clamping & Guaranteed Callback Delivery

## Status
Accepted

## Context
Cosmic Engine V2.0 utilizes an application-level singleton Web Worker (`src/workers/ephemerisWorkerManager.ts`) to offload heavy Meeus lunar ephemeris series, syzygy eclipse shadow cones, and 365-day annual solar/lunar matrices away from the main UI thread.

To ensure continuous dashboard operation across all user environments, the architecture mandates an automated synchronous fallback path when:
1. Web Workers are unsupported (e.g. legacy browsers or restricted SSR contexts).
2. Web Workers are blocked by strict enterprise Content Security Policies (CSP) or Cross-Origin-Embedder-Policy (COEP) restrictions.
3. A background calculation request hangs or exceeds the safety timeout threshold (5,000 ms).
4. The user makes large discontinuous date jumps where immediate Frame 0 synchronization is required before the background worker returns.

However, an audit of the synchronous fallback paths in [`src/workers/ephemerisWorkerManager.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/ephemerisWorkerManager.ts) and [`src/hooks/useEphemerisWorker.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/hooks/useEphemerisWorker.ts) revealed critical vulnerabilities:
1. **Unchecked Pathological Inputs on Main Thread**:
   If an invalid, non-finite, or extreme value (`NaN`, `Infinity`, extreme years like `999999` or `-100000`, or out-of-range coordinates) was passed, synchronous fallback routines directly executed on the main UI thread. This risked running 365-iteration loops on invalid dates, exhausting CPU resources, or propagating `NaN` across React render trees.
2. **Callback Starvation on Calculation Exceptions**:
   In `EphemerisWorkerManager._executeSyncFallbackForEntry`, a top-level `try/catch` block caught calculation errors and logged them to `console.error`, but failed to notify registered subscriber callbacks. If a calculation failed, callbacks remained permanently uncalled, stranding consuming widgets in an unresolved loading or ghosting state.
3. **Unguarded Main-Thread React Render Cascades**:
   Synchronous fallback hooks (`syncResult`, `syncSolar`, and `syncLunar`) invoked domain mathematical functions directly inside `useMemo` without `try/catch` boundaries. An unexpected calculation error would immediately crash the React component tree rather than degrading gracefully to safe visual fallbacks.

---

## Decisions

### 1. Pure Parameter Sanitization Gatekeepers (`src/workers/workerSanitizers.ts`)
Created pure, deterministic parameter sanitizers that validate and clamp inputs before any ephemeris or matrix calculation:
- **`sanitizeYear(year)`**: Clamps calendar years strictly to the Jean Meeus validity range $[-2000, 3000]$. Automatically handles `NaN`, non-finite values, and non-integers by defaulting safely to standard epoch year `2000`.
- **`sanitizeLatitude(lat)`**: Clamps observer latitude to valid geographic bounds $[-90, +90]$; defaults to `0.0` (Equator) on `NaN` or non-finite inputs.
- **`sanitizeLongitude(lon)`**: Normalizes observer longitude into standard geographic bounds $[-180, +180]$ using Euclidean positive modulo; defaults to `0.0` (Prime Meridian) on `NaN` or non-finite inputs.
- **`sanitizeJulianDate(jd)`**: Clamps astronomical Julian Dates to $[0, 5000000]$; defaults to `J2000_JD` (`2451545.0`) on `NaN`, negative, or non-finite values.
- **`sanitizeTimeOfDay(tod)`**: Normalizes time of day into standard decimal hours $[0, 24)$; defaults to `12.0` (solar noon) on `NaN` or non-finite values.
- **`sanitizeEphemerisParams(params)`**: Bundles all parameter sanitizers for atomic validation of multi-parameter ephemeris requests.

### 2. Guaranteed Callback Delivery Invariant in `EphemerisWorkerManager`
Hardened `_executeSyncFallbackForEntry` with granular error handling and guaranteed delivery:
- Parameter inputs are sanitized before triggering domain calculations.
- Calculations (`calculateAnnualSolarMatrix`, `calculateAnnualLunarMatrix`, `calculateLunarEvents`, `calculateEclipseData`) are isolated in granular `try/catch` blocks.
- **Guaranteed Callback Delivery**: If a calculation fails or throws, all registered callbacks in `entry.callbacks` are guaranteed to be invoked with safe non-crashing empty/null fallback payloads (`{ annualSolar: [] }`, `{ annualLunar: [] }`, or `{ lunarEvents: null, eclipse: null, timestamp: Date.now() }`). Callbacks are never starved or left hanging in zombie states.
- Applied identical sanitization and safe payload guarantees to direct synchronous execution paths in `requestAnnualSolarCalculation` and `requestAnnualLunarCalculation`.

### 3. Hook-Level Synchronous Fallback Resilience (`src/hooks/useEphemerisWorker.ts`)
Hardened all three consuming worker hooks against main-thread runtime exceptions:
- **`useEphemerisWorker`**: Sanitizes `latitude`, `longitude`, `julianDate`, and `timeOfDay` before computing midnight Julian Date. Wraps `syncResult` in a `try/catch` boundary returning `{ lunarEvents: null, eclipse: null }` on error.
- **`useAnnualSolarWorker`**: Sanitizes `year` and `latitude`. Wraps `syncSolar` in a `try/catch` boundary returning `[]` on error.
- **`useAnnualLunarWorker`**: Sanitizes `year`, `latitude`, and `longitude`. Wraps `syncLunar` in a `try/catch` boundary returning `[]` on error.

### 4. Worker Thread Message Handling Defense (`src/workers/ephemerisWorker.ts`)
Added defensive parameter sanitization to the background Web Worker thread itself across `CALCULATE_EPHEMERIS`, `CALCULATE_ANNUAL_SOLAR`, and `CALCULATE_ANNUAL_LUNAR` message handlers, preventing malformed external messages from corrupting worker thread execution.

---

## Consequences

### Positive
- **Zero Main-Thread Freezes**: Pathological inputs (`NaN`, extreme years, out-of-range coordinates) are intercepted and sanitized before CPU-intensive loops execute.
- **Resilient Subscriber Lifecycle**: Registered callbacks always resolve, preventing permanent loading states in observatory widgets.
- **Graceful UI Degradation**: Calculation failures in single visualizers fall back cleanly to empty/null payloads without crashing parent React render trees.
- **Comprehensive Test Coverage**: Expanded test matrix with 22 new tests across [`workerSanitizers.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/workerSanitizers.test.ts) (16 tests) and [`useEphemerisWorker.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/hooks/useEphemerisWorker.test.ts) (6 tests).

### Invariants Maintained
- Total project test suite expanded to **679 tests across 45 suites** (100% pass rate).
- Zero AST branded unit violations (`npm run lint:units`).
- Zero TypeScript diagnostics (`tsc --noEmit`).
- Fast production bundle compilation (`545ms`).
