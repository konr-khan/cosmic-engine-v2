# Active Task Specification: Cosmic Engine V2.0 Architectural Refactor

> **Status**: PHASE 2 ACTIVE
> **Architectural Ref**: [`AGENTS.md`](../../AGENTS.md)
> **Goal**: Decouple state propagation, offload ephemeris computation, and harden polar math edge cases across 3 phases.

---

## ✅ Phase 1: Engine Core Decoupling & State Isolation (COMPLETED)

### Objective
Decouple simulation time ticks (`date`, `timeOfDay`) from the top-level React state in [`App.jsx`](../../src/App.jsx) to eliminate top-down re-render cascades across all widgets during high-frequency animation ticks.

### Target Files
- **[NEW]** [`src/store/cosmicStore.js`](../../src/store/cosmicStore.js)
- **[MODIFY]** [`src/hooks/useCosmicEngine.js`](../../src/hooks/useCosmicEngine.js)
- **[MODIFY]** [`src/App.jsx`](../../src/App.jsx)

### Technical Specifications
1. **Cosmic Store (`cosmicStore.js`)**:
   - Implement lightweight subscription state store (or React Context with selector optimization).
   - Export state slices: `useChronometerStore` (`date`, `timeOfDay`, `speed`, `isPlaying`, `latitude`, `longitude`, `useAnalemma`).
   - Export batch update actions for high-speed ticker loops (`tickTime`, `setObserverLocation`).

2. **Simulation Engine Hook (`useCosmicEngine.js`)**:
   - Refactor hook to accept store selector parameters or consume `cosmicStore` directly.
   - Maintain pure calculation outputs and memoized domain evaluation.

3. **Master Dashboard (`App.jsx`)**:
   - Move continuous `requestAnimationFrame` ticker loop out of `App.jsx` root rendering into store action triggers.
   - Ensure widgets only re-render when their specific subscribed domain data changes.

### Acceptance Criteria
- [x] 60 FPS animation ticks trigger re-renders **only** in active subscribed widgets.
- [x] Inactive widgets perform 0 render passes during time animation ticks.
- [x] `npm test` unit test suite passes cleanly with 0 regressions.
- [x] `npm run build` succeeds without JSX or compilation errors.

---

## 🚀 Phase 2: Asynchronous Ephemeris Worker Integration (CURRENTLY ACTIVE)

### Objective
Offload Meeus lunar perturbation series (`calculateLunarEvents`) and syzygy shadow geometry solvers (`calculateEclipseData`) to a dedicated Web Worker to ensure zero UI thread micro-stutters during time scrubbing.

### Target Files
- **[NEW]** `src/workers/ephemerisWorker.js`
- **[NEW]** `src/hooks/useEphemerisWorker.js`
- **[MODIFY]** `src/hooks/useCosmicEngine.js`

### Technical Specifications
1. **Worker Script (`ephemerisWorker.js`)**:
   - Import pure math solvers from `src/utils/cosmicMath/`.
   - Process `CALCULATE_EPHEMERIS` postMessage requests and return structured `CosmicEphemerisSnapshot`.

2. **Worker Hook (`useEphemerisWorker.js`)**:
   - Manage worker lifecycle, message passing, and automatic synchronous fallback if Workers are unsupported or blocked.

### Acceptance Criteria
- [ ] Meeus lunar perturbation series and syzygy shadow geometry execute off-main-thread.
- [ ] Main thread frame rate remains at stable 60 FPS during fast-forward scrubbing.
- [ ] System falls back gracefully to synchronous execution if Web Worker initialization fails.

---

## 📋 Phase 3: Mathematical Boundary & Polar Edge Case Hardening (QUEUED)

### Objective
Eliminate edge-case math singularities (e.g. `NaN` or unhandled division) for extreme polar latitudes ($|\phi| > 66.5^\circ$) during twilight duration calculations.

### Target Files
- **[MODIFY]** `src/utils/cosmicMath/solar.js`
- **[MODIFY]** `src/utils/cosmicMath.test.js`

### Technical Specifications
1. **Polar Bounds (`solar.js`)**:
   - Implement explicit piecewise functions for solar elevation where $|\phi \pm \delta| > 90^\circ - \text{threshold}$.
   - Return structured polar state enums (`PERPETUAL_DAY`, `PERPETUAL_NIGHT`, `PERPETUAL_TWILIGHT`) instead of invalid sub-durations.

2. **Test Coverage (`cosmicMath.test.js`)**:
   - Add unit test suites for latitudes $\pm 70^\circ, \pm 80^\circ, \pm 90^\circ$ across all equinoxes and solstices.

### Acceptance Criteria
- [ ] Twilight duration calculation never outputs `NaN` or `null` across all latitudes $[-90, +90]$.
- [ ] Vitest unit test coverage includes extreme polar coordinate edge cases.
