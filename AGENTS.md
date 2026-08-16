# AGENTS.md — Agent Guidelines, Operating Protocols & Architecture Map

Welcome to **Cosmic Engine V2.0**. This document provides essential architectural context, operational protocols, mathematical contracts, and coding conventions for AI agents and developer tools working on this codebase.

---

## 1. Project Overview

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4. 

Key capabilities include:
- **Solar Almanac & Twilight Bands**: Solstice/equinox pathing, civil/nautical/astronomical twilight durations, equation of time (analemma correction), and daylight length calculations with polar bounds handling.
- **Polar Sunlight Clock & Sun Elevation Arc**: 24-hour polar sector dial oriented with **00:00 UTC at the top** and **12:00 UTC at the bottom** with clockwise progression, paired with an instantaneous **$+90^\circ$ Sun Elevation Arc** horizon dome visualizer.
- **Lunar Almanac & Tidal Vectors**: 365-day 24-hour moonrise and moonset braided ribbon chart (0000Z to 2400Z), moon phases, perigee/apogee distance metrics, astronomical parallactic angles, and harmonized ocean tidal bulge oscillator.
- **Eclipse Mechanics & Shadow Geometry**: Umbra/penumbra shadow geometry, $5.14^\circ$ lunar nodal plane corridor, smooth $C^1$-continuous syzygy obscuration predictions, and 5 historical/future presets (Apr 2024, Oct 2024, Mar 2025, Aug 2026, Aug 2027).
- **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct dragging of date, time, longitude, and latitude, with fast season jumps and direct military/time string parser.
- **Celestial Sphere & Horizon View**: Equatorial/ecliptic coordinate mapping, declination, right ascension, and 3D orthographic projection visualizer with geocentric and heliocentric modes.
- **Daylight Terminator Map**: Real-time Earth map with continental landmasses showing solar sub-point and illumination terminator.
- **Macro & Micro Views**: Heliocentric Keplerian planetary orbit view with 1 AU orbital physics HUD and Earth gravitational tidal force micro-view.
- **LivingMarble Globe Visualizer**: Analytical spherical limb intersection and evenodd annular cutout eliminating backside terminator tearing and preserving deep-night contrast.
- **Cross-Card Interactive Hover Sync**: Hovering over timestamps or calendar dates in any widget synchronizes time/elevation across all visible cards simultaneously.

---

## 2. Tech Stack & Essential Commands

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 6+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Application-level Web Worker singleton manager (`src/workers/ephemerisWorkerManager.ts`) offloading to dedicated worker thread (`src/workers/ephemerisWorker.ts`)
- **Icons & Visualization**: `lucide-react`
- **Testing**: `vitest` (`npm test` — 112 unit tests across 6 test suites)

### Essential Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run typecheck` | Runs TypeScript compiler in typecheck mode (`tsc --noEmit`) |
| `npm test` | Runs Vitest unit test suite (112 unit tests across 6 test suites) |
| `npm test -- --run` | Runs full Vitest suite in single-run CI mode |
| `npm run build` | Builds production distribution to `dist/` |
| `npm run preview` | Previews built production bundle locally |

---

## 3. Repository Architecture

```
Cosmic Engine V2.0/
├── index.html                   # HTML entry point with title & viewport config
├── package.json                 # Project dependencies & Vite scripts
├── tsconfig.json                # TypeScript root configuration (strict mode)
├── tsconfig.node.json           # TypeScript build tooling configuration
├── vite.config.ts               # Vite configuration & plugin setup
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Repository documentation & getting started
├── AGENTS.md                    # Agent guidelines, operating protocols & architecture map
├── src/
│   ├── main.tsx                 # React root renderer
│   ├── App.tsx                  # Master Observatory dashboard container
│   ├── vite-env.d.ts            # Vite client environment types
│   ├── index.css                # Global styles & Tailwind imports
│   ├── types/                   # Foundational TypeScript domain models
│   │   ├── units.ts             # Branded types (Degrees, Radians, JulianDate) & converters
│   │   ├── coordinates.ts       # Coordinate systems (AltAzimuth, Equatorial, Ecliptic, 2D/3D vectors)
│   │   ├── astronomy.ts         # Astronomical models (SolarPosition, LunarPosition, EclipseData)
│   │   ├── worker.ts            # Web Worker RPC contracts & serialization payloads
│   │   ├── store.ts             # Store contracts & window layout types
│   │   └── index.ts             # Central re-export entry
│   ├── utils/
│   │   ├── cosmicMath/          # Pure astronomical math domain modules
│   │   │   ├── index.ts         # Central re-export entry file
│   │   │   ├── constants.ts     # Orbital radii, twilight thresholds & theme tokens
│   │   │   ├── core.ts          # Julian dates, hour formatting & trig helpers
│   │   │   ├── solar.ts         # Solar declination, EoT, twilight algorithms & annual solar matrix
│   │   │   ├── lunar.ts         # Lunar ephemeris solver, nodal precession, parallactic angle & annual lunar matrix
│   │   │   └── eclipse.ts       # Syzygy shadow geometry & eclipse scanner
│   │   └── cosmicMath.test.ts   # Vitest unit tests for math engine (64 tests)
│   ├── store/                   # External state store & chronometer controls
│   │   ├── cosmicStore.ts       # External state store & animation frame ticker
│   │   └── cosmicStore.test.ts  # Vitest unit tests for state store & selector equality (5 tests)
│   ├── workers/                 # Web Worker offload scripts
│   │   ├── ephemerisWorker.ts   # Dedicated worker for Meeus ephemeris, eclipse geometry & 365-day matrices
│   │   └── ephemerisWorkerManager.ts # Application singleton worker manager, deduplication & matrix cache
│   ├── hooks/
│   │   ├── useCosmicEngine.ts   # Selective domain engine hook (solar, lunar, eclipse, tides)
│   │   ├── useCosmicEngine.test.ts # Vitest hook unit tests (13 tests: state transitions & polar edge cases)
│   │   ├── useEphemerisWorker.ts # Custom hooks (instantaneous & annual solar/lunar matrix workers)
│   │   ├── useEphemerisWorker.test.ts # Vitest hook tests (17 tests: worker integration, coalescing, matrix caching & fallback)
│   │   ├── useDashboardLayout.ts # Window layout state, drag-and-drop, resize, locking, presets & storage
│   │   └── useDashboardLayout.test.ts # Vitest hook tests for layout manager (7 tests)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets
│       │   ├── SolarAlmanac.tsx # 365-day solar twilight bands & solstice paths
│       │   ├── SunClock.tsx     # 24h polar dial (00:00Z top, 12:00Z bottom) & Sun Elevation Arc
│       │   ├── LunarAlmanacCard.tsx # Backward-compatible re-export entry
│       │   ├── EclipseDemonstrator.tsx # Master eclipse demonstrator dock container
│       │   ├── CelestialSphereView.tsx # Backward-compatible re-export entry
│       │   ├── TerminatorMap.tsx # Centered daylight terminator world map
│       │   ├── MacroOrbitView.tsx # Keplerian orbital physics HUD & seasonal milestones
│       │   ├── MicroTideView.tsx # Earth gravitational tidal force micro-view
│       │   ├── celestial/       # Decomposed celestial sphere subsystem modules
│       │   │   ├── projection3D.tsx        # Pure 3D projection & SVG ring builder
│       │   │   ├── GeocentricSphereView.tsx # 3D equatorial sphere, zenith ray, ecliptic & lunar tilt
│       │   │   ├── HeliocentricOrbitView.tsx # 1 AU Keplerian Earth orbit ring & seasonal nodes
│       │   │   ├── CelestialSphereView.tsx  # Subsystem coordinator container
│       │   │   └── index.ts                 # Barrel export
│       │   ├── lunar/           # Decomposed lunar almanac subsystem modules
│       │   │   ├── LunarRibbonChart.tsx    # 365-day 24h braided ribbon SVG chart
│       │   │   ├── TidalWaveOscillator.tsx # Harmonized ocean tidal bulge oscillator
│       │   │   ├── LunarShortcutsRail.tsx  # Fast-jump phase & solstice shortcut pills
│       │   │   ├── LunarAlmanacCard.tsx    # Subsystem coordinator container
│       │   │   └── index.ts                # Barrel export
│       │   └── eclipse/         # Decomposed eclipse demonstrator subsystem modules
│       │       ├── EclipseStatusBadge.tsx      # Syzygy classification & proximity badge
│       │       ├── ShadowRayDiagram.tsx        # SVG shadow ray tracing & geometry viewer
│       │       ├── NodalPlaneVisualizer.tsx    # 5.14° nodal plane corridor & alignment bar
│       │       ├── SkyViewSimulator.tsx        # Observer sky viewport (Corona, Blood Moon)
│       │       ├── EclipseScanner.tsx          # Historical presets & 365-day scanner list
│       │       └── index.ts                    # Barrel export
│       ├── controls/            # Interactive astrolabe inputs
│       │   ├── ArmillaryRail.tsx          # Slider control rail
│       │   ├── BufferedInput.tsx          # Blur/Enter commit input wrapper
│       │   ├── ControlRing.tsx            # Concentric drag ring
│       │   ├── LatitudeSlider.tsx         # Latitude coordinate slider
│       │   └── PolarLongitudeSelector.tsx # Polar stereographic longitude selector
│       ├── layout/              # Container layout modules
│       │   ├── ObsNavbar.tsx              # Top observatory brand navbar, presets & simulation layers
│       │   ├── DashboardWindow.tsx        # Draggable, resizable, lockable window wrapper
│       │   ├── OrbitalChronometer.tsx     # Master astrolabe dock container
│       │   └── chronometer/     # Decomposed astrolabe chronometer subsystem modules
│       │       ├── AstrolabeDial.tsx           # 4-concentric interactive SVG astrolabe dial
│       │       ├── ChronometerReadoutCards.tsx # Direct input cards & parseTimeString validator
│       │       ├── SolsticeJumpControls.tsx    # Twilight phase pill & solstice fast jumps
│       │       └── ChronometerModalPopovers.tsx # Accessible modal wrappers for Lat/Lon sliders
│       └── common/              # Shared visual components
│           ├── WindowErrorBoundary.tsx         # Fault-tolerant module error boundary
│           ├── WindowErrorBoundary.test.tsx    # Unit tests for error boundary (6 tests)
│           ├── LivingMarble.tsx                # Non-tearing 3D Earth globe visualizer
│           └── PhaseVisual.tsx                 # Lunar phase disc with parallactic tilt
```

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
- Contains pure astronomical algorithms with JSDoc type and unit annotations (Julian Date conversions, solar declination, equation of time, lunar phase angles, twilight elevation thresholds, eclipse alignment angles, and tidal vector forces).
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
- Handle continuous polar day (midnight sun) and polar night without dividing by zero in hour angle computations ($\cos \omega = \frac{\sin h_0 - \sin \phi \sin \delta}{\cos \phi \cos \delta}$, clamped to $[-1, 1]$).
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
- Hovering over timestamps or day-of-year points in `SunClock` or `SolarAlmanac` propagates synchronized coordinates across `TerminatorMap`, `MacroOrbitView`, and `LunarAlmanacCard`.
- **Anti-Feedback Loop Invariant**: Widgets must **only emit hover events in response to direct user pointer interactions** (`onPointerMove`, `onMouseMove`), never within `useEffect` or render lifecycle methods, preventing infinite ping-pong re-render loops among sibling cards.

### F. Fault-Tolerant Window Architecture & Error Boundaries (`src/components/layout/DashboardWindow.tsx`)
- Interactive widgets inside `src/components/widgets/` must be wrapped in React Error Boundaries within `DashboardWindow.tsx`.
- An isolated calculation or SVG rendering failure in a single visualizer (e.g. 3D orthographic sphere or eclipse ray tracer) will display a local fallback state without unmounting or crashing the rest of the Observatory dashboard.
- Layout management supports dragging, resizing, locking, and responsive column spanning (`colSpan={12}` spans full width on standard screens, collapsing to 6 columns on ultra-wide displays: `2xl:col-span-6 3xl:col-span-6`). Presets persist in `localStorage` under `cosmic_window_layout_v5`.

---

## 7. Coding Standards, Architectural Invariants & Testing

### A. Code Standards & Refactoring Invariants
1. **Modernize Deprecations**: Modernize legacy library APIs and deprecated framework methods when refactoring touched files (e.g., modern React 19 paradigms, Tailwind v4 CSS directives).
2. **Modularity & Clean Architecture**: Ensure single responsibility per component/module; prevent circular imports.
3. **Strict Type & Linter Integrity**: Zero tolerance for suppressed type errors, loose unchecked type assertions, or disabling linters without explicit approval. Run `npm run typecheck` (`tsc --noEmit`) to verify.
4. **Preserve Math Accuracy**: Cite standard astronomical references for formula changes and verify polar/solstice edge cases.
5. **No Regressions**: All 112 unit tests across the 6 test suites must pass on every modification. If extending functions or APIs, add corresponding unit tests to `cosmicMath.test.ts`, `useCosmicEngine.test.ts`, `useEphemerisWorker.test.ts`, `useDashboardLayout.test.ts`, `WindowErrorBoundary.test.tsx`, or `cosmicStore.test.ts`.

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

### A. Semantic Color Mapping

| Astronomical Layer / Domain | Color Semantics | Tailwind CSS v4 Classes / Hex |
| :--- | :--- | :--- |
| **Solar Path & Corona** | Golden / Amber | `text-amber-400`, `fill-amber-300` (`#fbbf24`, `#fde047`) |
| **Civil Twilight** | Warm Amber | `fill-amber-400/80` (`#fcd34d`) |
| **Nautical Twilight** | Medium Slate Blue | `fill-slate-500` (`#64748b`) |
| **Astronomical Twilight** | Deep Slate | `fill-slate-700` (`#334155`) |
| **Night & Backgrounds** | Deep Space Slate | `bg-slate-900`, `bg-slate-950`, `fill-slate-900` (`#0f172a`, `#020617`) |
| **Lunar & Tidal Vectors** | Electric Cyan / Sky | `text-cyan-400`, `stroke-sky-400` (`#38bdf8`, `#06b6d4`) |
| **Syzygy & Node Corridor** | Emerald Green | `text-emerald-400`, `stroke-emerald-500` (`#10b981`) |
| **Horizon Grid & Celestial Axis** | Deep Indigo | `text-indigo-400`, `stroke-indigo-500` (`#6366f1`) |

### B. Container & Layout Guidelines
- Widgets in `src/components/widgets/` must remain unbordered and flush with `DashboardWindow`'s body container.
- Use top inline control rails for interactive mode switches rather than duplicating window titles (`<h3>`).
- Ensure responsive SVG scaling with proper `viewBox` coordinates and fluid container adaptation.
