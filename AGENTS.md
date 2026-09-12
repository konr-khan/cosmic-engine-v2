# AGENTS.md — Agent Guidelines, Operating Protocols & Architecture Map

Welcome to **Cosmic Engine V2.0**. This document provides essential architectural context, operational protocols, mathematical contracts, and coding conventions for AI agents and developer tools working on this codebase.

---

## 1. Project Overview & Single Source of Truth Hierarchy

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded nominal units), Vite, and Tailwind CSS v4.

To eliminate documentation drift and adhere to **Smallest Effective Difference (SED)** principles, consult the authoritative **Single Source of Truth (SSoT)** for each domain:
- **Active Feature Ledger & Milestones**: Consult [`PROJECT.md`](PROJECT.md) for master architecture diagrams, the complete F1–F50 feature ledger, and M1–M24 milestone matrix.
- **Astronomical Math & Ephemerides**: Consult [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) for canonical algorithms, coordinate transformations, and Jean Meeus citations.
- **Visual Tokens & Design Grammar**: Consult [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for semantic color palettes, vector stroke encodings, and glassmorphic telemetry rules.
- **Historical Anti-Patterns**: Consult [`DEAD_ENDS.md`](DEAD_ENDS.md) for the tabular registry of failed historical approaches and their validated solutions.
- **Architectural Decision Records**: Consult [`docs/adr/`](docs/adr/) for milestone decisions (0001–0024) and evolutionary amendment banners.
- **Public System Overview & Setup**: Consult [`README.md`](README.md) for user-facing features and quick-start guides.

---

## 2. Tech Stack & Essential Commands

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 7.0+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 8+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Application-level Web Worker singleton manager (`src/workers/ephemerisWorkerManager.ts`) offloading to dedicated worker thread (`src/workers/ephemerisWorker.ts`)
- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 43 modules, 648 tests)

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

### B. Delegation & Subagent Rules
- **Automatic Task Delegation**:
  - When an approved implementation plan involves multi-file refactoring or heavy computational diagnostics, the orchestrator spawns a dedicated subagent for each discrete phase or decoupled module.
  - Spawning occurs sequentially or in parallel depending on module dependencies.
- **Subagent Context Constraints**:
  - Provide subagents with minimal, scoped context: only target file paths, relevant type signatures/constants, and specific phase objectives.
  - Subagents operate inside their isolated sandbox, self-heal minor build/test regressions, and return a clean, structured summary diff to the orchestrator.
- **Terminal Execution**:
  - Run linters, type checks, and test suites inside the worker subagent sandbox to maintain a clean parent conversation thread.
- **File Operation & Critical Path Guardrails**:
  - **Nominal Branded Units Guardrail**: Never modify `src/types/units.ts` without running the full test matrix (`npm test -- --run` and `npm run typecheck`). Branded nominal unit regressions silently cascade across all coordinate and ephemeris solvers. When crossing from presentation types (`Latitude`, `Longitude`) into core mathematical routines, explicitly bridge via `toRadians(asDegrees(lat))` or dedicated helper functions—never use raw force casts (`as unknown as Radians`).
  - **UI Unit Safety AST Guardrail**: Presentation components under `src/components/**` must never call `asDegrees()` or `asRadians()`. Compile-time branded unit enforcement is validated via Babel AST parsing (`node scripts/lintUnitSafety.mjs` / `src/types/unitSafety.test.ts`).
  - **Scene Graph vs Legacy Contracts**: `OrbitalPositions` and `OrbitalData.userRotation` / `positions` are deprecated in favor of the Unified 3D Scene Graph (`useCosmicScene` / `CosmicScene3D`). The `<MiniGlobe />` component self-contains its internal orientation, rotational continents, terminator, and topocentric observer pin.
  - **Barrel Export Integrity**: Never modify root or subsystem barrel exports (`index.ts`) without verifying that no circular dependencies or type-only export breaks are introduced.
  - **Mathematical Provenance Guardrail**: Agents must never delete, minify, or rewrite comments citing Jean Meeus chapter references or IAU standard models in `src/utils/cosmicMath/`.
  - **Temporal Purity & J2000 Standardization Guardrail**: Pure domain algorithms and generator functions in `src/utils/cosmicMath/` must never instantiate unparameterized `new Date()` internally. Temporal inputs must be explicitly supplied as `JulianDate` or `Date` and default to `J2000_JD` (`2451545.0`) to guarantee deterministic evaluation, timezone invariance, and repeatable unit test execution.
  - **`< 0.8 ms` Hot-Loop Latency Budget Invariant**: Armillary model generation hot loops must compute frames in $< 0.8\text{ ms}$ on average across 1,000 continuous frames (enforced by `src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts`). Coordinate calculations in animation loops must reuse pre-computed Euler rotators (`createEulerCameraRotator`), cached 3x3 rotation matrices, and single-pass SVG path streaming in `paths.ts` without allocating temporary objects inside per-frame render loops.

### C. Mandatory Persistent Documentation Verification
Before implementing or modifying code, all agents must proactively consult and verify alignment with the persistent specifications in `docs/`:
1. **Mathematical Models & Ephemerides**: When touching calculations, coordinate frames, twilight thresholds, polar bound piecewise logic, or eclipse shadow geometries, inspect and conform strictly to [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md).
2. **Visual Tokens, Colors & Stroke Encodings**: When modifying UI styling, color tokens, SVG vector stroke encodings (solid vs. dashed, sky blue vs. rose nodes), or glassmorphic telemetry HUDs, inspect and conform strictly to [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
3. **Architecture Decisions & Invariants**: When modifying store subscription models (`CosmicStore` / `useSyncExternalStore`), Web Worker RPC multiprocessing (`EphemerisWorkerManager`), or nominal branded units (`src/types/units.ts`), inspect the records in [`docs/adr/`](docs/adr/) and update/author ADRs as architectural decisions evolve.
4. **Documentation Synchronization**: When adding new features or adjusting contracts, keep [`README.md`](README.md), [`AGENTS.md`](AGENTS.md), and relevant `docs/` specifications updated in tandem.

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

## 6. Key Subsystems, Data Flow & Mathematical Contracts

### A. Mathematical Engine & Pure Domain Functions (`src/utils/cosmicMath/`)
- Contains pure astronomical algorithms with JSDoc type and unit annotations (Julian Date conversions, solar declination, equation of time, Meeus Ch. 48 true geocentric lunar phase angles & disc illumination fractions, 2-step iterative high-latitude lunar rise/set solving, twilight elevation thresholds, eclipse alignment angles, and tidal vector forces).
- Algorithms reference Jean Meeus *Astronomical Algorithms* and IAU standard models.
- **Rule**: Keep domain math pure, deterministic, and free of React state or UI side-effects.

### B. Astronomical Coordinate Systems & Singularity Safeguards
Standard coordinate conventions used throughout the engine:
- **Alt-Azimuth**: Altitude $a \in [-90^\circ, 90^\circ]$ (Horizon $= 0^\circ$, Zenith $= +90^\circ$, Nadir $= -90^\circ$), Azimuth $A \in [0^\circ, 360^\circ)$ ($0^\circ = \text{North}, 90^\circ = \text{East}, 180^\circ = \text{South}, 270^\circ = \text{West}$).
- **Equatorial**: Right Ascension $\alpha \in [0\text{h}, 24\text{h})$ / $[0^\circ, 360^\circ)$, Declination $\delta \in [-90^\circ, 90^\circ]$.
- **Ecliptic**: Ecliptic Longitude $\lambda \in [0^\circ, 360^\circ)$, Ecliptic Latitude $\beta \in [-90^\circ, 90^\circ]$.
- **Polar Stereographic**: Used for planar azimuthal projections and the astrolabe dial.

**Singularity & Angle Safeguards**:
- Guard against polar singularities ($\pm 90^\circ$ latitude) where longitude converges; ensure zero `NaN` propagation.
- Handle continuous polar day (midnight sun) and polar night without dividing by zero in hour angle computations; all piecewise clamping criteria are canonically specified in [`docs/MATH_SPEC.md#4-twilight-thresholds--exact-polar-bound-handling`](docs/MATH_SPEC.md#4-twilight-thresholds--exact-polar-bound-handling).
- All angular calculations must strictly wrap outputs using helper functions (`wrap360` to $[0, 360^\circ)$, `wrap180` to $[-180^\circ, 180^\circ]$, and `wrap2Pi` to $[0, 2\pi)$).

### C. External Store & 60 FPS Performance Budget (`src/store/cosmicStore.ts`)
- Decouples high-frequency animation ticking (`requestAnimationFrame`) and observer state updates from React's component render tree.
- Uses React 19 `useSyncExternalStore` with shallow equality selectors.
- **Snapshot Reference Stability Invariant**: The `getSnapshot` callback passed to `useSyncExternalStore` must maintain a stable function reference across renders. Dynamic selectors and equality comparators must be tracked via `useRef` inside `useChronometerStore` to prevent React 19 concurrent scheduler cascading re-render loops (`forceStoreRerender` / *"Maximum update depth exceeded"*).
- **Static Selectors**: Components subscribing to observer parameters should reuse static top-level selector functions rather than creating anonymous closures inside component render trees.
- **State Change Detection**: `CosmicStore.setState` verifies value equivalence (including `Date.getTime()` timestamp comparison for `Date` objects) before dispatching subscriber updates to eliminate redundant renders.
- **Zero-Allocation Per Frame Rule**: The chronometer runs continuous `requestAnimationFrame` loops. Never allocate temporary objects, array literals, or anonymous closures inside per-frame tick handlers and math hot paths to prevent garbage collection stutter.
- **Selective Selector Granularity**: Enforce granular subscriptions (e.g., `useCosmicStore(s => s.julianDate)`) so time scrubbing updates only active visualizer components, avoiding dashboard-wide re-renders.

### D. Off-Main-Thread Worker Processing & Serialization (`src/workers/`, `src/hooks/useEphemerisWorker.ts`)
- Multiplexes calculation requests through the application-level singleton worker manager (`ephemerisWorkerManager.ts`).
- Offloads heavy Meeus lunar ephemeris series and eclipse shadow geometry solvers to dedicated Web Workers to maintain 60 FPS UI performance.
- **Worker Contract Discriminated Unions**: All pending calculation callbacks and RPC dispatch entries adhere to discriminated union typing (`PendingRequestEntry = PendingEphemerisEntry | PendingAnnualSolarEntry | PendingAnnualLunarEntry` in `src/types/worker.ts`), eliminating unsafe `any` casts.
- **Message Payload Serialization Contract**: All messages exchanged across `postMessage` must adhere to strict structured cloning contracts. Pass only plain serializable numbers, strings, arrays, and POJOs. Never pass functions, class instances with prototypes, DOM nodes, or cyclical structures.
- **Synchronous Fallback Invariant**: Any newly introduced astronomical solver must provide a synchronous fallback path within its consuming hook (`useEphemerisWorker.ts`) to guarantee functionality when Web Workers are blocked, unsupported, or executing in test/SSR environments.

### E. Cross-Widget Hover-Sync State & Anti-Feedback Loop Invariant
- `App.tsx` orchestrates shared `hoverTime` and `hoverDate` state.
- Hovering over timestamps or day-of-year points in `PolarSunlightDial` or `SolarAlmanacCard` propagates synchronized coordinates across `TerminatorMap`, `MacroOrbitView`, and `LunarAlmanacCard`.
- **Anti-Feedback Loop Invariant**: Widgets must **only emit hover events in response to direct user pointer interactions** (`onPointerMove`, `onMouseMove`), never within `useEffect` or render lifecycle methods, preventing infinite ping-pong re-render loops among sibling cards.

### F. Fault-Tolerant Window Architecture & Error Boundaries (`src/components/layout/DashboardWindow.tsx`)
- Interactive widgets inside `src/components/widgets/` must be wrapped in React Error Boundaries within `DashboardWindow.tsx`.
- An isolated calculation or SVG rendering failure in a single visualizer (e.g. 3D orthographic sphere or eclipse ray tracer) will display a local fallback state without unmounting or crashing the rest of the Observatory dashboard.
- Layout management supports dragging, resizing, locking, and responsive column spanning (`colSpan={12}` spans full width on standard screens, collapsing to 6 columns on ultra-wide displays: `2xl:col-span-6 3xl:col-span-6`). Presets persist in `localStorage` under `cosmic_window_layout_v7`.

### G. Side-by-Side Dual-Perspective Eclipse Geometry Contracts (`src/components/widgets/eclipse/`)
The Eclipse demonstrator renders synchronized dual perspectives in `activeTab === 'geometry'`. All geometric angles, shadow cone radii, transverse slope equations, and nodal alignment algorithms are canonically specified in [`docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry`](docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry):
1. **Transverse Syzygy Profile (`ShadowRayDiagram.tsx`)**:
   - Strictly edge-on transverse profile ($R_y = 0$).
   - The Moon's orbital plane line passes through Earth with slope dynamically modulated by real-time annual nodal alignment ($\Delta \Omega = \lambda_{\text{sun}} - \Omega_{\text{node}}$).
   - Moon linear position along the plane follows elongation $s = -\cos(\text{phaseRad}) \in [-1, 1]$ (New Moon at $s = -1$, Full Moon at $s = +1$).
2. **Axial Sightline Down-the-Barrel View (`NodalPlaneVisualizer.tsx`)**:
   - View looking directly along the Sun-Earth axis with Earth centered and the Sun partially eclipsed behind Earth.
   - Symmetrical layout parity (`viewBox="0 0 520 220"`, $26:11$ aspect ratio, `min-h-[220px]`) centered at $(260, 110)$ with horizontal Ecliptic Plane reference at $y = 110$.
   - Transverse cross-axis displacement follows prograde West-to-East astronomical kinematics:
     $$s = -\sin(\text{phaseRad}) \in [-1, 1]$$
     (Syzygy at center $X = 260$, Quarters at extremities $X = 260 \mp 150$; Waxing moves East/Left, Waning moves West/Right). The lunar transit traverses from **Right to Left (West to East)** across the face of the Sun during solar eclipses.
   - Dynamic Ascending ($\Omega$) and Descending ($\mho$) nodes glide along the orbital line ($X_{\text{node}} = 260 - \sin(t_{\text{node}}) \cdot 150$), converging into the center target during eclipse seasons and moving to outer extremities during off-seasons.
   - Scaled radii: Earth MiniGlobe $R = 24\text{px}$, Sun $R = 46\text{px}$, Umbra $R = 18\text{px}$, Penumbra $R = 34\text{px}$, Moon $R = 10.5\text{px}$.
3. **Exact UTC Preset Snapping**:
   - `EclipsePresetItem` requires explicit `timeOfDay: number` (fractional UTC hour) to guarantee that clicking presets snaps directly to peak totality (e.g., $06:58\text{ UTC}$ for Mar 14, 2025 Blood Moon).

### H. Orbital Milestones & Persistent Translucent Halo Nodes (`MacroOrbitView.tsx`, `OrbitSvgCanvas.tsx`)
- Milestone orbital nodes (Perihelion, Aphelion, Jun/Dec Solstices, Mar/Sep Equinoxes) feature persistent translucent glowing halo rings (`fill={color}`, `opacity="0.20"`, `r="11px"`) that expand responsively on hover (`opacity="0.45"`, `r="18px"`).
- Heliocentric 3D views feature matching glowing halo nodes along the 1 AU Earth orbit ring.

### I. Dynamic Ephemeris Distance & Apparent Diameter Scaling (`TerminatorMap.tsx`)
- Subsolar and Sublunar discs scale dynamically based on instantaneous orbital distance and apparent angular diameter formulas canonically documented in [`docs/MATH_SPEC.md#9-dynamic-ephemeris-distance--apparent-diameter-scaling`](docs/MATH_SPEC.md#9-dynamic-ephemeris-distance--apparent-diameter-scaling).
- Glassmorphic HUD popovers report live distance in AU / km and apparent diameter in arcminutes.

---

## 7. Coding Standards, Architectural Invariants & Testing

### A. Code Standards & Refactoring Invariants
1. **Modernize Deprecations**: Modernize legacy library APIs and deprecated framework methods when refactoring touched files (e.g., modern React 19 paradigms, Tailwind v4 CSS directives).
2. **Modularity & Clean Architecture**: Ensure single responsibility per component/module; prevent circular imports.
3. **Strict Type & Linter Integrity**: Zero tolerance for suppressed type errors, loose unchecked type assertions, or disabling linters without explicit approval. Run `npm run typecheck` (`tsc --noEmit`) to verify.
4. **Preserve Math Accuracy & Provenance**: Preserve all formal Jean Meeus / IAU chapter citations, constant derivations, and inline LaTeX/math derivation comments when refactoring `src/utils/cosmicMath/`.
5. **No Regressions**: All unit tests across the comprehensive test suite must pass on every modification without regressions. When extending functions or APIs, add corresponding unit tests to the appropriate domain suite (`src/utils/cosmicMath.test.ts` for pure math, `src/hooks/useEphemerisWorker.test.ts` for worker RPC, `src/hooks/useCosmicEngine.test.ts` for engine hooks, `src/components/widgets/widgets.test.ts` for widgets, `src/hooks/useDashboardLayout.test.ts` for layout state, `src/store/cosmicStore.test.ts` for state store, or `src/components/common/WindowErrorBoundary.test.tsx` for error boundaries).
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

## 8. Design System & Semantic Color Tokens

Cosmic Engine V2.0 maintains a sleek, dark observatory aesthetic (slate/zinc dark mode with indigo, cyan, amber, and emerald accents).

### A. Semantic Color Mapping & Visual Tokens
All visual tokens, color semantics, vector stroke encodings, and glassmorphic HUD styling rules are canonically defined in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md):
- **Canonical Design Reference**: Consult [`docs/DESIGN_SYSTEM.md#1-color-semantics--astronomical-meaning`](docs/DESIGN_SYSTEM.md#1-color-semantics--astronomical-meaning) for the complete semantic color palette table.
- **Vector Stroke Encodings**: Consult [`docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings`](docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings) for celestial ring front/back splitting, lunar waxing/waning strokes, and milestone halo nodes.
- **Glassmorphism & Micro-Typography**: Consult [`docs/DESIGN_SYSTEM.md#3-glassmorphic-popover--hud-hierarchy`](docs/DESIGN_SYSTEM.md#3-glassmorphic-popover--hud-hierarchy) for backdrop blur, monospace telemetry rules, and WCAG AAA contrast guidelines.

### B. Container & Layout Guidelines
- Widgets in `src/components/widgets/` must remain unbordered and flush with `DashboardWindow`'s body container.
- Use top inline control rails for interactive mode switches rather than duplicating window titles (`<h3>`).
- Ensure responsive SVG scaling with proper `viewBox` coordinates and fluid container adaptation.

### C. Information Architecture & Progressive Disclosure Invariants
- **Smallest Effective Difference (SED)**: Visual distinctions and gridlines must be rendered with minimal visual noise and subtle contrast gradations. Let the vector astronomical curves and orbital bodies carry the primary focal weight.
- **Progressive Disclosure**: Primary widget viewports must remain glanceable and uncluttered by default. Deep mathematical derivations, extended ephemeris metrics (e.g. parallactic angle, orbital velocities, exact nodal angles), and configuration controls must be accessible through obvious, discoverable affordances (hover tooltips, scrubbers, disclosure panels, modal popovers).
- **Affordance Clarity**: Any interactive control that reveals deeper data must present unambiguous visual affordances (`cursor-pointer`, `cursor-crosshair`, hover ring highlights, or pill badges) so users immediately recognize how to access extended information.

