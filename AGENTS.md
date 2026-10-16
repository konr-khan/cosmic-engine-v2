# AGENTS.md — Agent Guidelines, Operating Protocols & Architecture Kernel

Welcome to **Cosmic Engine V2.0**. This operational prompt kernel defines essential protocols, architectural invariants, mathematical guardrails, and coding standards for AI agents working on this codebase.

---

## 1. Project Overview & Single Source of Truth Hierarchy

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded nominal units), Vite, and Tailwind CSS v4.

To eliminate documentation drift and adhere to **Smallest Effective Difference (SED)** principles, consult the authoritative **Single Source of Truth (SSoT)** for each domain:
- **System Topology, Code Layout & Task Routing**: Consult [`ARCHITECTURE.md`](ARCHITECTURE.md) for the master dataflow diagram, subsystem contracts, exhaustive file tree, and targeted Vitest task routing matrix.
- **Active Feature Ledger & Milestones**: Consult [`PROJECT.md`](PROJECT.md) for the complete Feature Inventory (`F1–F87`) and Milestone Matrix (`M1–M42`).
- **Astronomical Math & Ephemerides**: Consult [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) for canonical algorithms, coordinate transformations, and Jean Meeus citations.
- **Visual Tokens & Design Grammar**: Consult [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for semantic color palettes, vector stroke encodings, and glassmorphic telemetry rules.
- **Historical Anti-Patterns**: Consult [`DEAD_ENDS.md`](DEAD_ENDS.md) for the tabular registry of failed historical approaches and their validated solutions.
- **Architectural Decision Records**: Consult [`docs/adr/`](docs/adr/) for milestone decisions (`0001–0042`) and evolutionary amendment banners.
- **Public System Overview & Setup**: Consult [`README.md`](README.md) for user-facing features and quick-start guides.

---

## 2. Tech Stack & Essential Commands

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 7.0+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 8+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Application-level Web Worker singleton manager (`src/workers/ephemerisWorkerManager.ts`) offloading to dedicated worker thread (`src/workers/ephemerisWorker.ts`)
- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 59 modules, 886 tests)

### Essential Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run typecheck` | Runs TypeScript compiler in typecheck mode (`tsc --noEmit`) |
| `npm test` | Runs Vitest unit test suite in native single-run mode (`vitest run`) |
| `npm run test:coverage` | Runs Vitest with v8 code coverage reporting |
| `npm run lint:units` | Runs Babel AST branded unit-safety linter across all UI components |
| `npm run sync:docs` | Runs automated Vitest test metric synchronizer |
| `npm run sync:dossier` | Compiles master documentation dossier on demand (`--dossier`) |
| `npm run verify` | Runs full verification suite (`typecheck`, `lint:units`, `vitest`, and `build`) |
| `npm run build` | Builds production distribution to `dist/` (`tsc --noEmit && vite build`) |
| `npm run preview` | Previews built production bundle locally |

---

## 3. Subsystem Architecture & Key Contracts

Consult [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full 3D scene graph dataflow diagram, TypeScript interface contracts, and exhaustive file layout (`src/types/`, `src/utils/cosmicMath/`, `src/store/`, `src/workers/`, `src/hooks/`, `src/components/`).

- **Pure Mathematical Engine (`src/utils/cosmicMath/`)**: Deterministic functions free of React state, UI tokens, or unparameterized `new Date()`. Conforms strictly to [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md).
- **External Chronometer Store (`src/store/cosmicStore.ts`)**: Decouples 60 FPS animation ticking from React render trees via `useSyncExternalStore` with memoized selectors (`useChronometerStore(s => s.timeOfDay)`).
- **Atomic Hover Store (`src/store/hoverStore.ts`)**: Isolates high-frequency ribbon scrubber state (`hoverTime`, `hoverDate`, `setHoverState`, `setHoverTime`, `setHoverDate`), preventing 60 FPS cascades across unhovered widgets.
- **Web Worker Ephemeris Processing (`src/workers/`)**: Multiplexes requests via `ephemerisWorkerManager.ts` with 100ms trailing-edge flag-merging throttling, monotonic `requestId` stamping, mount-time LRU cache seeding, and synchronous fallback (`workerFallback.ts`).
- **Unified 3D Scene Graph & Primitives**: `useCosmicScene()` and `useHeliocentricScene()` drive Macro Orbit, Eclipse Demonstrator (`LiveSyzygyView.tsx` + `NodalPlaneVisualizer.tsx`), and Gyro-Morph Armillary. `<MiniGlobe />` and `<MiniMoon />` self-contain their 3D orientation and terminator clipping.
- **Fault-Tolerant Window Grid (`DashboardWindow.tsx`)**: Every lazy-loaded widget is wrapped in `WindowErrorBoundary.tsx` with dynamic chunk retry recovery.

---

## 4. Agent Operating Protocols & Subagent Delegation

### A. Manager-Worker Pattern
- **Orchestrator Role**: The primary agent acts as the **Lead Architect / Orchestrator**. Delegate implementation, noisy terminal runs, diagnostics, and multi-file edits to specialized worker subagents.
- **Context Hygiene**: Never execute broad file rewrites or heavy terminal commands directly in the parent context. Isolate diagnostic scans, lint runs, and test executions within subagent sandboxes.
- **Verification Before Completion**: No task is complete without passing `npm run verify` (`typecheck`, `lint:units`, `vitest`, and `build` in serial).
- **No Automatic Commits Rule**: Never commit changes to git automatically. Present changes and verification results first, and only execute `git commit` when the user explicitly says `'commit'`.

### B. Subagent Delegation & Core Invariants
- **Nominal Branded Units Guardrail**: Never modify `src/types/units.ts` without running `npm test` and `npm run typecheck`. Bridge presentation types (`Latitude`, `Longitude`) into math routines via `latToRadians(lat)`, `lonToRadians(lon)`, or `toRadians(asDegrees(lat))`—never use raw casts (`as unknown as Radians`).
- **UI Unit Safety AST Guardrail**: Presentation components under `src/components/**` must never import or call `asDegrees()` or `asRadians()` (`npm run lint:units` / `src/types/unitSafety.test.ts`).
- **Barrel Export Integrity**: Never modify barrel exports (`index.ts`) without verifying zero circular dependencies or type-only export breaks.
- **Mathematical Provenance Guardrail**: Never delete, minify, or rewrite comments citing Jean Meeus chapter references or IAU standard models in `src/utils/cosmicMath/`.
- **Temporal Purity & J2000 Standardization**: Pure math modules (`src/utils/cosmicMath/**`) must never instantiate unparameterized `new Date()`. Components and hooks must use immutable `J2000_DATE` (`2451545.0`) instead of `= new Date()` default parameters.
- **`< 0.8 ms` Hot-Loop Latency Budget**: Armillary model generation must compute frames in $< 0.8\text{ ms}$ on average across 1,000 frames (`armillaryBenchmark.test.ts`). Reuse cached 3x3 Euler matrices and single-pass SVG path streaming without per-frame object allocations.
- **Documentation Synchronization & Context Budget**: Keep `README.md`, `ARCHITECTURE.md`, `PROJECT.md`, `AGENTS.md`, and `docs/` synchronized. Maintain `AGENTS.md` strictly $\le 18\text{ KB}$ (enforced by `unitSafety.test.ts` and `syncDocMetrics.mjs`).

---

## 5. Phased Execution & Human Gates

All complex architectural changes and feature additions follow a structured 3-phase lifecycle:

1. **Plan Phase**: Analyze requirements, generate an **Implementation Plan Artifact**, and pause at a **HUMAN GATE** for explicit confirmation before modifying code.
2. **Execution Phase**: Execute one phase at a time in an isolated subagent sandbox, verifying each phase before advancing.
3. **Verification & Review Phase**: Run `npm run verify`, produce a **Verification Walkthrough Artifact**, and pause at a **HUMAN GATE** for review. Only commit when explicitly instructed.

---

## 6. Coding Standards, Architectural Invariants & Testing

### A. Code Standards & Refactoring Invariants
1. **Modernize Deprecations**: Use modern React 19 paradigms and Tailwind v4 CSS directives when touching files.
2. **Modularity & Clean Architecture**: Ensure single responsibility per module and zero circular imports.
3. **Strict Type & Linter Integrity**: Zero tolerance for suppressed type errors, unchecked assertions, or disabled linters (`npm run typecheck`).
4. **No Regressions**: All unit tests must pass on every modification. Add unit tests to the appropriate domain suite when extending functionality.
5. **React 19 Directives**:
   - **Direct `ref` Passing**: Pass `ref` as a standard prop; never use deprecated `React.forwardRef()`.
   - **Data Flow & Store Invariants**: Maintain stable selector references in `useSyncExternalStore` for 60 FPS ticker loops; do not place Suspense boundaries on per-frame hot paths.
   - **Memoization Hygiene**: Keep pure mathematical routines in `src/utils/cosmicMath/` as standalone top-level functions without unnecessary `useCallback`/`useMemo` wrappers outside render loops.

### B. Testing & Mocking Standards
- **Vitest Mocking**: Mock `Worker` and `ephemerisWorkerManager` with deterministic synchronous responses for hook tests; mock `requestAnimationFrame` with timer stubs for store tests; mock `localStorage` for layout tests.
- **Floating-Point Precision**: Use `expect(val).toBeCloseTo(expected, 4)` for astronomical calculations (or `2` decimal places for empirical angles/distances).

### C. AI Pair-Programming Invariants & Cognitive Guardrails
1. **Zero Ad-Hoc Math Re-implementation**: Import canonical IAU/Meeus algorithms and constants from `src/utils/cosmicMath/` and `astroConstants.ts`.
2. **Zero Lossy Constant Rounding**: Never hardcode magic numbers (`23.44`, `5.14`); use `EARTH_AXIAL_OBLIQUITY_J2000_DEG` and `MOON_ORBIT_INCLINATION_DEG`.
3. **Zero High-Frequency React State**: Route 60 FPS animation and ribbon scrubbing exclusively through `cosmicStore` or `hoverStore`.
4. **Direct Execution Over Brittle Mocking**: Invoke deterministic math utilities directly in tests rather than mocking them.
5. **Targeted Subsystem Routing**: For fast feedback, consult the Subsystem Task Routing Matrix in [`ARCHITECTURE.md#5-subsystem-task-routing-matrix`](ARCHITECTURE.md#5-subsystem-task-routing-matrix) to run targeted test suites (`npx vitest run <file>`) before executing `npm run verify`.

---

## 7. Design System & UX Principles

All semantic colors (Sky Blue for observer/ascending node, Rose Red for descending node, Amber for subsolar/daylight), vector stroke encodings, and glassmorphic telemetry rules are canonically defined in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
- **Smallest Effective Difference (SED)**: Render high-density astronomical data with minimal visual clutter, subtle contrast gradations, muted coordinate grids, and clean vector geometry.
- **Progressive Disclosure**: Keep primary viewports clean and glanceable; expose rich ephemeris telemetry via hover tooltips, scrubbers, and modal popovers.
- **Affordance Clarity & Window Hierarchy**: Interactive controls must present unambiguous visual affordances (`cursor-pointer`, `cursor-crosshair`, hover highlights). Widgets remain unbordered and flush within `DashboardWindow`.
