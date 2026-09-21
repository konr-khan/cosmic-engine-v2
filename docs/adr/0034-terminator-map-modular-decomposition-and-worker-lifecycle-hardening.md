# ADR 0034: Terminator Map Modular Decomposition and Worker Lifecycle Hardening

## Status
Accepted

## Context
Following Milestone 33 and an in-depth codebase audit, two architectural opportunities were identified:
1. **Worker Concurrency Lifecycle & Cache Migration**:
   [`EphemerisWorkerManager.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/ephemerisWorkerManager.ts) registered anonymous window event listeners (`beforeunload`, `pagehide`) during construction, but never detached them inside [`terminate()`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/workers/ephemerisWorkerManager.ts#L788). In multi-instance test harnesses, listeners leaked onto `window`. Furthermore, although a generic [`LruCache`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/lruCache.ts) utility existed with 14 unit tests, the manager still maintained internal caches as raw `Map` objects with legacy manual eviction code paths.
2. **Monolithic Terminator Map & Subsystem Asymmetry**:
   While other observatory visualizers ([`SunElevationDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SunElevationDome.tsx), [`MoonElevationDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/MoonElevationDome.tsx), [`SunMeridianDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SunMeridianDome.tsx)) adhered strictly to the container/presenter hook paradigm (ADR-0025, ADR-0030), [`TerminatorMap.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/terminator/TerminatorMap.tsx) remained a 439-line monolith embedding ~110 lines of complex Keplerian scaling, polygon wrapping, twilight shadow generation, and diurnal track simulation inline with SVG presentation.
3. **React 19 SVG Namespace Warnings**:
   In test harnesses using `renderToStaticMarkup` on isolated SVG `<g>` elements ([`LiveSyzygyView.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/eclipse/LiveSyzygyView.tsx)), React 19 defaulted to the HTML namespace, emitting casing warnings on camelCase SVG elements (`<clipPath>`, `<radialGradient>`).

---

## Decisions

### 1. Worker Lifecycle Hardening & Complete LRU Cache Adoption
* **Bound Listener Detachment**:
  - Bound unload handler to a persistent instance variable `private readonly _boundOnUnload: () => void = () => this.terminate();`.
  - Registered with `typeof window.addEventListener === 'function'` defensive guard.
  - In `terminate()`, cleanly removed via `window.removeEventListener(...)`.
* **Bounded LRU Cache Migration**:
  - Replaced raw `Map` caches with `LruCache<string, AnnualSolarMatrixItem[]>` and `LruCache<string, AnnualLunarMatrixItem[]>` capped at `MAX_ANNUAL_CACHE_SIZE = 16`.
  - Streamlined `_setInAnnualCache` and `_getFromAnnualCache` to delegate to `cache.set()` and `cache.get()`.
* **Dedicated Unit Test**:
  - Added unit test in `src/hooks/useEphemerisWorker.test.ts` verifying listener unregistration on `terminate()`.

### 2. Terminator Map Modular Decomposition (`src/components/widgets/terminator/`)
* **[`hooks/useTerminatorMapMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/terminator/hooks/useTerminatorMapMath.ts)**:
  - Pure container hook isolating Keplerian Earth-Sun distance scaling, sublunar ephemeris coordinates, 24-hour diurnal ground tracks, Draconic nodal detection, and 4-tier spherical twilight shadow paths.
  - Accompanied by a dedicated unit test suite (`useTerminatorMapMath.test.ts`) covering 5 core mathematical domains.
* **[`TerminatorLandmasses.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/terminator/TerminatorLandmasses.tsx)**:
  - Extracted continent polygon paths with $[-360, 0, +360]$ antimeridian wrapping offsets.
  - Wrapped in `React.memo` keyed on `longitude` to eliminate polygon recalculations during timeline scrubbing.
* **[`TerminatorGroundTracks.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/terminator/TerminatorGroundTracks.tsx)**:
  - Extracted 24-hour diurnal tracks for Sun and Moon (dotted past, dashed future) and the pulsing Draconic nodal marker.
* **Declarative Orchestrator (`TerminatorMap.tsx`)**:
  - Reduced from **439 LOC to 195 LOC** (~55% reduction).
  - Cleanly composes `TerminatorHoverHud`, `TerminatorLandmasses`, `TerminatorGroundTracks`, and celestial markers.

### 3. SVG Namespace Hygiene in Test Harnesses
* Wrapped isolated `<LiveSyzygyView>` test renders in `EclipseWidget.test.tsx` with an `<svg>` container, matching real production architecture inside `ShadowRayDiagram.tsx` and eliminating all 8 lines of React 19 test casing warnings.

---

## Consequences

### Positive
* **Subsystem Architectural Parity**: `TerminatorMap` now adheres to the same container/presenter hook paradigm as the rest of the observatory suite.
* **Performance & Memoization**: Landmass polygons are memoized on longitude, eliminating redundant SVG path strings during time-only scrubbing.
* **Memory & Lifecycle Safety**: Worker manager cleanly releases window listeners on termination, eliminating multi-instance memory leaks.
* **Console Hygiene**: Full test suite runs 49 modules and 792 tests with 100% clean output.
* **Zero Regressions**: 100% backward-compatible; all original DOM markers, classes, and assertions pass identically.
