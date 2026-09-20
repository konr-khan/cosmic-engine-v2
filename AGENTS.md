# AGENTS.md — Agent Guidelines, Operating Protocols & Architecture Map

Welcome to **Cosmic Engine V2.0**. This document provides essential architectural context, operational protocols, mathematical contracts, and coding conventions for AI agents and developer tools working on this codebase.

---

## 1. Project Overview & Single Source of Truth Hierarchy

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded nominal units), Vite, and Tailwind CSS v4.

To eliminate documentation drift and adhere to **Smallest Effective Difference (SED)** principles, consult the authoritative **Single Source of Truth (SSoT)** for each domain:
- **Active Feature Ledger & Milestones**: Consult [`PROJECT.md`](PROJECT.md) for master architecture diagrams, the feature ledger (F1–F57), and milestone matrix (M1–M32).
- **Astronomical Math & Ephemerides**: Consult [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) for canonical algorithms, coordinate transformations, and Jean Meeus citations.
- **Visual Tokens & Design Grammar**: Consult [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for semantic color palettes, vector stroke encodings, and glassmorphic telemetry rules.
- **Historical Anti-Patterns**: Consult [`DEAD_ENDS.md`](DEAD_ENDS.md) for the tabular registry of failed historical approaches and their validated solutions.
- **Architectural Decision Records**: Consult [`docs/adr/`](docs/adr/) for milestone decisions (0001–0032) and evolutionary amendment banners.
- **Public System Overview & Setup**: Consult [`README.md`](README.md) for user-facing features and quick-start guides.

---

## 2. Tech Stack & Essential Commands

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 7.0+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 8+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Application-level Web Worker singleton manager (`src/workers/ephemerisWorkerManager.ts`) offloading to dedicated worker thread (`src/workers/ephemerisWorker.ts`)
- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 47 modules, 740 tests)

### Essential Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run typecheck` | Runs TypeScript compiler in typecheck mode (`tsc --noEmit`) |
| `npm test` | Runs Vitest unit test suite in native single-run mode (`vitest run`) |
| `npm test -- --run` | Runs full Vitest suite in single-run CI mode (equivalent/redundant with `npm test`) |
| `npm run test:coverage` | Runs Vitest with v8 code coverage reporting |
| `npm run lint:units` | Runs Babel AST branded unit-safety linter across all UI components |
| `npm run sync:docs` | Runs automated Vitest test metric synchronizer |
| `npm run sync:dossier` | Compiles master documentation dossier on demand (`--dossier`) |
| `npm run build` | Builds production distribution to `dist/` (`tsc --noEmit && vite build`) |
| `npm run preview` | Previews built production bundle locally |

---

## 3. High-Level Subsystem Architecture Map

```
src/
├── types/                 # Branded nominal units, coordinates, astronomy, worker RPC & store contracts
├── utils/cosmicMath/      # Pure astronomical math domain modules
│   ├── astroConstants.ts  # Centralized IAU/WGS-84/Meeus physical constants & J2000 epoch
│   ├── core.ts            # Julian dates, UTC invariance, slerp3D, GMST & LST
│   ├── solar.ts           # Solar declination, EoT, twilight algorithms & annual solar matrix
│   ├── lunar.ts           # Lunar ephemeris solver, disc illumination, Newton-Raphson crossing solver
│   ├── eclipse.ts         # Syzygy shadow geometry & eclipse recurrence scanner
│   ├── today/             # Decomposed topocentric horizon (elevation, meridian, draconic)
│   ├── terminatorTracks.ts# Diurnal celestial ground tracks & antimeridian seam
│   ├── globe.ts           # Spherical continent projection & analytical limb horizon clipping
│   ├── projection.ts      # Earth axial tilt 3D projection, observer pin & 4-quadrant orbital stroke segments
│   ├── scene/             # Unified 3D Astronomical Scene Graph & Camera Rigs
│   └── armillary/         # Gyro-Morph Armillary & Astrolabe math continuum
├── store/                 # External state stores (cosmicStore, atomic hoverStore)
├── workers/               # Dedicated worker thread & singleton multiplexer manager
├── hooks/                 # Selective domain hooks (useCosmicScene, useEphemerisWorker, useDashboardLayout)
└── components/            # Grouped component architecture
    ├── widgets/           # Code-split observatory visualizers (today, armillary, solar, lunar, eclipse, terminator, macro, tides)
    ├── controls/          # Interactive astrolabe dials, sliders, and coordinate inputs
    ├── layout/            # Window layout, navigation bar, and Orbital Chronometer dock
    └── common/            # Shared primitives (MiniGlobe, WindowErrorBoundary, PhaseVisual)
```

> [!NOTE]
> For the exhaustive, line-by-line file tree and module breakdown, consult the canonical Code Layout in [`PROJECT.md`](PROJECT.md).

---

## 4. Agent Operating Protocols & Subagent Delegation

### A. Manager-Worker Pattern
- **Orchestrator Role**: The primary agent acts as the **Lead Architect / Orchestrator**. Implementation, noisy terminal runs, diagnostics, and multi-file modifications should be delegated to specialized worker subagents.
- **Context Hygiene**: Never execute broad file rewrites or heavy terminal commands directly in the parent context. Isolate diagnostic scans, lint runs, and test executions within dedicated subagent sandboxes.
- **Verification Before Completion**: No task is marked complete without passing automated type checking (`npm run typecheck`), unit testing (`npm test -- --run`), and production build (`npm run build`) verification.
- **No Automatic Commits Rule**: Do not commit changes to git automatically after completing a phase. Always present the changes and verification steps first, and only commit when the user explicitly says 'commit'.

### B. Subagent Delegation & Invariants
- **Delegation Rules**: Delegate multi-file refactoring, diagnostic scans, and test runs to worker subagents. Provide subagents with minimal, scoped context (target paths, type contracts, phase objectives). Subagents self-heal minor build regressions in their sandbox and return clean summary diffs.
- **Nominal Branded Units Guardrail**: Never modify `src/types/units.ts` without running `npm test` and `npm run typecheck`. When crossing from presentation types (`Latitude`, `Longitude`) into mathematical routines, explicitly bridge via `toRadians(asDegrees(lat))` or dedicated helper functions—never use raw force casts (`as unknown as Radians`).
- **UI Unit Safety AST Guardrail**: Presentation components under `src/components/**` must never call `asDegrees()` or `asRadians()` (`npm run lint:units` / `src/types/unitSafety.test.ts`).
- **Unified 3D Scene Graph**: `OrbitalPositions` and `OrbitalData.userRotation` / `positions` are deprecated in favor of the Unified 3D Scene Graph (`useCosmicScene` / `CosmicScene3D`). The `<MiniGlobe />` component self-contains its internal orientation, rotational continents, terminator, and topocentric observer pin.
- **Barrel Export Integrity**: Never modify root or subsystem barrel exports (`index.ts`) without verifying that no circular dependencies or type-only export breaks are introduced.
- **Mathematical Provenance Guardrail**: Never delete, minify, or rewrite comments citing Jean Meeus chapter references or IAU standard models in `src/utils/cosmicMath/`.
- **Temporal Purity & J2000 Standardization**: Pure domain algorithms and generator functions in `src/utils/cosmicMath/` must never instantiate unparameterized `new Date()` internally. Temporal inputs must be explicitly supplied as `JulianDate` or `Date` and default to `J2000_JD` (`2451545.0`).
- **`< 0.8 ms` Hot-Loop Latency Budget**: Armillary model generation hot loops must compute frames in $< 0.8\text{ ms}$ on average across 1,000 frames (`armillaryBenchmark.test.ts`). Reuse pre-computed Euler rotators (`createEulerCameraRotator`), cached 3x3 matrices, and single-pass SVG path streaming in `paths.ts` without allocating temporary objects inside per-frame render loops.
- **Documentation Synchronization**: When adding features or modifying contracts, keep `README.md`, `AGENTS.md`, and relevant `docs/` specifications updated in tandem.
- **Context Budget Guardrail**: `AGENTS.md` is an operational prompt kernel, not a domain wiki. Never write astronomical formulas, pixel coordinates, SVG markup, or feature changelogs in this file. Delegate mathematical models to `docs/MATH_SPEC.md` and visual tokens to `docs/DESIGN_SYSTEM.md`. Maintain file size strictly $\le 18\text{ KB}$ (enforced by `unitSafety.test.ts` and `syncDocMetrics.mjs`).

---

## 5. Phased Execution & Human Gates

All complex architectural changes and feature additions must follow the structured 3-phase lifecycle:

1. **Plan Phase**:
   - The orchestrator analyzes the codebase, dependency maps, and requirements.
   - Generates an **Implementation Plan Artifact** detailing discrete phases, affected components, and verification steps.
   - **HUMAN GATE**: The orchestrator pauses and awaits explicit human confirmation before making code modifications.
2. **Execution Phase**:
   - Execute one phase at a time using an isolated subagent sandbox.
   - Verify each phase before advancing to dependent phases.
3. **Verification & Review Phase**:
   - Run the complete project test suite (`npm test -- --run`), typecheck (`npm run typecheck`), and production build (`npm run build`).
   - Produce a **Verification Walkthrough Artifact** demonstrating test passes and diffs.
   - **HUMAN GATE**: Prompt the user for review and approval with interactive verification steps.
   - **Git Commit Protocol**: Never commit changes to git automatically. Only execute `git commit` when the user explicitly gives the command (e.g. `'commit'`).

---

## 6. Subsystem Architecture & Key Contracts

- **Pure Mathematical Engine (`src/utils/cosmicMath/`)**: Deterministic, pure domain functions free of React state or UI side-effects. All algorithms, coordinate systems (Alt-Az, Equatorial, Ecliptic), and polar singularity clamping criteria conform strictly to [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md).
- **External Chronometer Store (`src/store/cosmicStore.ts`)**: Decouples 60 FPS animation ticking from React render trees using `useSyncExternalStore` with granular subscriptions (e.g. `useCosmicStore(s => s.julianDate)`).
- **Atomic Hover Store (`src/store/hoverStore.ts`)**: Isolates high-frequency ribbon scrubber state (`hoveredDate`, `hoveredTime`, `hoverPosition`), eliminating 60 FPS cascades across unhovered widgets.
- **Web Worker Ephemeris Processing (`src/workers/`)**: Multiplexes calculation requests through `ephemerisWorkerManager.ts` with 100ms throttling and monotonic integer sequence stamping (`requestId`) to prevent stale frame overwrites.
- **Fault-Tolerant Window Grid (`DashboardWindow.tsx`)**: Every visualizer is wrapped in a React Error Boundary with dynamic chunk retry mechanisms, isolating rendering exceptions to individual widgets.
- **Dual-Perspective Eclipse Geometry**: Synchronized transverse syzygy profile (`ShadowRayDiagram.tsx`) and axial sightline down-the-barrel view (`NodalPlaneVisualizer.tsx`). Canonical transverse displacement equations, prograde right-to-left kinematics, and shadow cone geometry conform strictly to [`docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry`](docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry) and [`docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings`](docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings).
- **Orbital Milestones & Scaling**: Keplerian milestone halo nodes and apparent diameter scaling conform to [`docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings`](docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings) and [`docs/MATH_SPEC.md#9-dynamic-ephemeris-distance--apparent-diameter-scaling`](docs/MATH_SPEC.md#9-dynamic-ephemeris-distance--apparent-diameter-scaling).

---

## 7. Coding Standards, Architectural Invariants & Testing

### A. Code Standards & Refactoring Invariants
1. **Modernize Deprecations**: Modernize legacy library APIs and deprecated framework methods when refactoring touched files (e.g., modern React 19 paradigms, Tailwind v4 CSS directives).
2. **Modularity & Clean Architecture**: Ensure single responsibility per component/module; prevent circular imports.
3. **Strict Type & Linter Integrity**: Zero tolerance for suppressed type errors, loose unchecked type assertions, or disabling linters without explicit approval. Run `npm run typecheck` (`tsc --noEmit`) to verify.
4. **Preserve Math Accuracy & Provenance**: Preserve all formal Jean Meeus / IAU chapter citations, constant derivations, and inline LaTeX/math derivation comments when refactoring `src/utils/cosmicMath/`.
5. **No Regressions**: All unit tests across the comprehensive test suite must pass on every modification without regressions. When extending functions or APIs, add corresponding unit tests to the appropriate domain suite (`src/utils/cosmicMath/core.test.ts` for pure math, `src/hooks/useEphemerisWorker.test.ts` for worker RPC, `src/hooks/useCosmicEngine.test.ts` for engine hooks, `src/components/widgets/today/TodayWidget.test.tsx` for widgets, `src/hooks/useDashboardLayout.test.ts` for layout state, `src/store/cosmicStore.test.ts` for state store, or `src/components/common/WindowErrorBoundary.test.tsx` for error boundaries).
6. **React 19 & Modern Directives**:
   - **Direct `ref` Passing**: Pass `ref` directly as a standard component prop; do not wrap components in `React.forwardRef()` (deprecated in React 19).
   - **Document Metadata**: Leverage React 19's native document metadata tags (`<title>`, `<meta>`) or React 19 form/action primitives where applicable instead of legacy third-party wrappers (e.g. `react-helmet`).
   - **Data Flow & Store Invariants**: Maintain stable selector references in `useSyncExternalStore` for 60 FPS animation ticker loops; do not replace with `React.use()` or Suspense boundaries on per-frame render hot paths.
   - **Memoization Hygiene**: Avoid unnecessary `useCallback` or `useMemo` wrappers around pure math calls outside render loops. Pure mathematical routines in `src/utils/cosmicMath/` should remain pure, standalone top-level functions.

### B. Testing & Mocking Standards for Agents
- **Vitest Mocking Guidelines**:
  - Mock `Worker` and `ephemerisWorkerManager` using deterministic synchronous responses when testing hook integration.
  - Mock `requestAnimationFrame` and `cancelAnimationFrame` with controllable timer stubs for store tests.
  - Mock `localStorage` when testing window layout persistence.
- **Floating-Point Precision Tolerance**:
  - Use `expect(val).toBeCloseTo(expected, 4)` for general astronomical calculations (or 2 decimal places for empirical angles/distances) to avoid fragile assertions caused by floating-point differences across JavaScript engines.

---

## 8. Design System & UX Principles

All semantic colors (Sky Blue for observer/ascending node, Rose Red for descending node, Amber for subsolar/daylight), vector stroke encodings, and glassmorphic telemetry rules are canonically defined in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
- **Smallest Effective Difference (SED)**: High-density astronomical data is rendered with minimal visual clutter, subtle contrast gradations, muted coordinate grids, and clean vector geometry. Let the physical trajectories carry the focal weight.
- **Progressive Disclosure**: Primary viewports remain clean, uncluttered, and instantly glanceable. Rich ephemeris metrics (parallactic angles, orbital speeds, nodal angles) are discovered via hover tooltips, scrubbers, and modal popovers.
- **Affordance Clarity**: Interactive controls must present unambiguous visual affordances (`cursor-pointer`, `cursor-crosshair`, hover ring highlights, or pill badges).
- **Window Hierarchy**: Widgets remain unbordered and flush with `DashboardWindow`'s container. Use top inline control rails for interactive mode switches.

