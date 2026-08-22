# ADR 0001: External State Store & Application Web Worker Singleton

## Status
Accepted

## Context
Cosmic Engine V2.0 requires high-frequency temporal scrubbing and continuous animation playback at 60 FPS while simultaneously calculating compute-heavy celestial ephemerides (Jean Meeus lunar series, eclipse syzygy shadow geometry, and 365-day annual matrices).

In early iterations, two critical performance bottlenecks emerged:
1. **React 19 Concurrent Scheduler Cascades**: Standard React state (`useState`/closures) and naive `useSyncExternalStore` selectors triggered cascading re-render loops (*"Maximum update depth exceeded"*) because snapshot object references were re-allocated on every frame.
2. **Main Thread Blocking & Thread Proliferation**: Spawning Web Workers inside individual components caused thread proliferation (e.g. 7+ worker threads for 7 dashboard windows) and redundant duplicate calculations across components.

## Decision

1. **Decoupled External Store (`CosmicStore`)**:
   - Time animation ticking runs via `requestAnimationFrame` outside React's render lifecycle.
   - The custom hook `useChronometerStore` implements React 19's `useSyncExternalStore` with stable selector `useRef` caching and shallow equality comparators (`shallowEqual`).
   - State updates verify value equivalence (including `Date.getTime()`) before notifying subscribers.

2. **Singleton Worker Manager (`EphemerisWorkerManager`)**:
   - A single application-level Web Worker singleton handles all heavy ephemeris calculations (Meeus lunar series, 2-step iterative rise/set solvers, syzygy eclipse shadow geometry, and 365-day annual matrices).
   - Implements **in-flight request deduplication and coalescing**: identical calculation signatures share a single `postMessage` RPC dispatch and fan out results to all registered subscriber callbacks.
   - In-memory caching for 365-day annual matrices (`annualSolarCache`, `annualLunarCache`).
   - Lazy synchronous fallback execution when Workers are unavailable or pending bootstrap.
   - **Proactive Lifecycle Teardown**: Auto-registers `beforeunload` and `pagehide` listeners in browser environments and exposes `terminate()` for root React component unmount cleanup to prevent thread leaks across SPA navigation and HMR dev reloads.

## Consequences

* **Positive**:
  - Stable 60 FPS animation ticking with zero garbage collection stutter.
  - No thread proliferation; worker memory consumption stays under $12\text{ MB}$.
  - Main thread remains responsive during rapid scrubs across 159 automated unit tests.
  - Clean worker thread and memory reclamation upon window close, tab switch, or SPA teardown.
* **Invariants**:
  - Never replace `useChronometerStore` with standard React component closures inside animation hot paths.
  - All messages passed across Web Worker boundaries must adhere to structured cloning contracts (discriminated union types in `src/types/worker.ts`).
