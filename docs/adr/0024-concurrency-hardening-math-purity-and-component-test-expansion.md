# ADR 0024: Concurrency Hardening, Domain Math Purity, Visual Polish & Component Test Expansion

## Status
Accepted

## Context
Following Milestone M23, Cosmic Engine V2.0 achieved mathematical precision and design system alignment across all observatory windows. However, a rigorous architectural audit of animation loops, worker synchronization, and component boundaries revealed six latency, purity, and coverage bottlenecks:

1. **Redundant Per-Frame Ephemeris Computations**:
   During continuous chronometer playback (60 FPS `requestAnimationFrame`), `calculateEphemerisFrame` in `src/utils/cosmicMath/frame.ts` was invoked independently by up to 8 separate widgets and hooks on every tick with identical parameters (`julianDate`, `latitude`, `longitude`, `useAnalemma`), computing redundant solar coordinates, lunar positions, GMST, and LST across multiple subscribers.

2. **Worker Throttling Lag on Discontinuous Date Jumps**:
   The singleton Web Worker throttles calculation dispatches to 100ms (~10 Hz) to avoid flooding the background thread during rapid chronometer scrubbing. However, on large discontinuous date jumps (e.g., clicking Solstice jump buttons, Eclipse presets, or dragging the date dial across months), consuming components continued rendering the stale worker payload for up to 100ms before the worker returned, resulting in visual ghosting and trailing orbital beads in the Eclipse and Lunar visualizers.

3. **Presentation Leakage into Pure Domain Math**:
   `calculateDaylightDurationPrecise` in `src/utils/cosmicMath/today/elevation.ts` coupled pure domain astronomy with presentation concerns by directly injecting Tailwind CSS utility classes (`badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'`) into domain return contracts.

4. **Worker-Throttled Parallactic Crescent Rotation**:
   In `MoonElevationDome.tsx`, the lunar crescent rotation relied on `ephemeris.lunarEvents.parallacticAngle` provided by the Web Worker. Because worker responses are throttled to 100ms, the crescent disk stuttered during interactive time scrubbing rather than rotating smoothly at 60 FPS alongside the elevation vector.

5. **Coupled Presets and Ad-Hoc Cache Structures**:
   Observatory dashboard window layout presets were embedded inside the layout state hook (`src/hooks/useDashboardLayout.ts`), and tile/computation caches used ad-hoc objects rather than an isolated, bounded LRU cache with strict eviction semantics.

6. **Component Test Coverage Gaps**:
   While pure astronomical algorithms and mathematical transforms maintained comprehensive coverage, critical interactive chronometer controls (`AstrolabeDial.tsx`, `SolsticeJumpControls.tsx`) and general caching utilities lacked dedicated unit test suites.

---

## Decisions

### 1. 1-Entry Deterministic Ephemeris Frame Memoization
Implemented a 1-entry deterministic reference cache in `src/utils/cosmicMath/frame.ts`:
- Memoizes the most recent `EphemerisFrame` based on parameter equality:
  `lastJd === jd && lastLat === latitude && lastLon === longitude && lastAnalemma === useAnalemma`
- Eliminates ~87% of redundant solar/lunar ephemeris, GMST, and LST calculations across subscriber widgets during 60 FPS animation loops.
- Exposes `_clearEphemerisFrameCache()` for complete test isolation.

### 2. Worker Epoch Tracking & Instant Synchronous Syzygy Snapping
Enhanced `src/hooks/useEphemerisWorker.ts` with epoch displacement detection:
- Tracks worker payload Julian Date against active chronometer state.
- If a discontinuous jump exceeds $|\Delta\text{JD}| > 0.01\text{ days}$ (~14.4 minutes), the hook marks the worker epoch as stale (`isWorkerEpochStale = true`) and immediately invalidates `activePayload`.
- Synchronously computes instantaneous fallback frames (`calculateLunarEvents`, `calculateEclipseData`) on the main thread for Frame 0, completely eliminating trailing orbit lag and visual ghosting during preset jumping.

### 3. Domain Math Purity & Token Decoupling
Decoupled UI presentation from astronomical computation:
- Extracted semantic badge token definitions to `src/components/widgets/today/todayTokens.ts`.
- Refactored `calculateDaylightDurationPrecise` in `src/utils/cosmicMath/today/elevation.ts` to return pure semantic metadata (`phase: TwilightPhase`, `label: string`, `subtitle: string`).
- Consuming UI components (`SunElevationDome.tsx`, `SunMeridianDome.tsx`) map semantic phases to styling tokens via `getTwilightBadgeClasses(phase)`.

### 4. Synchronous 60 FPS Parallactic Angle Rotation
Decoupled Moon dome crescent orientation from the 100ms worker throttle:
- Computes `currentParallacticAngle = calculateParallacticAngle(latitude, Number(moonDeclination), currentLST - Number(moonRightAscension))` synchronously on render within `MoonElevationDome.tsx`.
- Ensures smooth, fluid 60 FPS crescent rotation during active chronometer playback and dial scrubbing.

### 5. Layout Presets & LRU Cache Decoupling
- Extracted standard observatory window arrangement configurations into `src/constants/dashboardPresets.ts`.
- Implemented a generic, bounded `LRUCache<K, V>` in `src/utils/lruCache.ts` utilizing JavaScript `Map` insertion-order semantics with $O(1)$ lookup, eviction, and promotion.

### 6. Component Test Harness Expansion
Expanded the automated test suite with three new dedicated test suites:
1. `src/utils/lruCache.test.ts` (14 tests): Verifies generic LRU cache eviction order, capacity limits, promotion on `get`/`set`, and map iterator ordering.
2. `src/components/layout/chronometer/SolsticeJumpControls.test.tsx` (11 tests): Verifies astronomical milestone jump buttons (Equinoxes, Solstices), UTC date dispatch, and twilight badge styles.
3. `src/components/layout/chronometer/AstrolabeDial.test.tsx` (23 tests): Verifies concentric SVG rings (Date, Time, Longitude, Latitude), observer-locked camera yaw calculations, latitude rail positioning, pointer event callbacks, and rollover boundaries.

---

## Consequences

### Positive
- **60 FPS Fluidity**: Dial scrubbing and chronometer playback run smoothly without garbage-collection stutter or worker-induced visual lag.
- **Zero Trailing Ghosting**: Jumping to eclipse presets or solstice milestones immediately renders correct syzygy geometry without 100ms display delay.
- **Domain Purity**: Pure mathematical algorithms in `src/utils/cosmicMath/` remain strictly free of HTML, SVG, or CSS presentation dependencies.
- **Robust Component Coverage**: Critical chronometer controls are fully protected against regressions.

### Test Coverage & Build Invariants
- Total test coverage expanded from 600 tests across 40 suites to **648 tests across 43 suites** (100% pass rate).
- 0 TypeScript compiler diagnostics (`tsc --noEmit`).
- 0 Babel AST nominal unit safety violations across all UI components.
- Fast production bundle compilation (`tsc --noEmit && vite build`) under 600ms.
