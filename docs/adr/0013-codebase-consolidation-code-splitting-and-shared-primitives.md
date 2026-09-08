# ADR 0013: Codebase Consolidation, Widget Code-Splitting, Shared Primitives & Test Suite Decomposition

## Status
Accepted

## Context
During the scaling of the Cosmic Engine V2.0 observatory platform, five architectural bottlenecks and redundancies emerged:

1. **Monolithic Bundle Size**:
   - All 8 primary observatory widgets were imported and bundled into the initial client bundle synchronously in [`DashboardWindow.tsx`](../../src/components/layout/DashboardWindow.tsx), resulting in an uncompressed initial bundle exceeding 526 kB.
2. **Duplicate Elevation Arc Dome Geometry**:
   - [`SunElevationDome.tsx`](../../src/components/widgets/today/SunElevationDome.tsx) and [`MoonElevationDome.tsx`](../../src/components/widgets/today/MoonElevationDome.tsx) duplicated 260x120 SVG elevation arc geometry (`EL_R = 92`, `EL_CX = 130`, `EL_CY = 104`), polar/equatorial horizon baselines, cardinal azimuth labels (E, S, W), unreachable zenith caps, and reference chords.
3. **Duplicate 2D Timeline Dragging & Scrubbing**:
   - [`SolarRibbonChart.tsx`](../../src/components/widgets/solar/SolarRibbonChart.tsx) (365-day annual Zulu ribbon) and [`LunarRibbonChart.tsx`](../../src/components/widgets/lunar/LunarRibbonChart.tsx) (365-day synodic lunar braided ribbon) each maintained separate implementations of bidirectional linear coordinate projection (`dayToX`/`xToDay`, `timeToY`/`yToTime`) and pointer event dragging lifecycles.
4. **Divergent Globe Implementations**:
   - The chronometer dock in [`AstrolabeDial.tsx`](../../src/components/controls/AstrolabeDial.tsx) relied on a legacy 4-layer `LivingMarble.tsx` component with custom canvas rendering, uncalibrated subsolar positioning, and inconsistent observer orientation compared to the canonical 9-layer [`<MiniGlobe />`](../../src/components/common/MiniGlobe.tsx) component.
5. **Monolithic Test Suites**:
   - Test suites were concentrated in massive test files (such as `cosmicMath.test.ts` with 134 tests and `widgets.test.ts` spanning 1,344 lines with 46 tests), making test failure isolation difficult, increasing test runner feedback latency, and obscuring component-level domain boundaries.

---

## Decisions

### 1. Dynamic Widget Code-Splitting & Modular Lazy Loading
* Re-architected [`DashboardWindow.tsx`](../../src/components/layout/DashboardWindow.tsx) to lazy-load all 8 primary observatory visualizers using `React.lazy()`:
  - `ArmillaryWidget`, `SolarWidget`, `LunarWidget`, `TodayWidget`, `EclipseWidget`, `TerminatorMap`, `MacroOrbitWidget`, and `TidesWidget`.
* Implemented a reusable glassmorphic `<WidgetSkeleton />` fallback wrapped in `<Suspense>`, providing animated shimmer states, title bar placeholders, and subtle borders matching the design system tokens.
* Reduced initial client bundle size by **50.4%** (from 526.91 kB to 261.29 kB; 75.89 kB gzip).

### 2. Shared Elevation Arc Primitive (`<SkyDomeBase />`)
* Extracted [`SkyDomeBase.tsx`](../../src/components/widgets/today/SkyDomeBase.tsx) as a shared 260x120 SVG elevation dome primitive:
  - Standardized elevation geometry (`EL_R = 92`, `EL_CX = 130`, `EL_CY = 104`).
  - Unified cardinal compass markers (E, S, W), zenith markers (+90°), horizon line chords, and unreachable zenith cap arcs.
  - Dynamically switches hemisphere culmination meridian indicator (**S** for $\phi \ge 0^\circ$, **N** for $\phi < 0^\circ$).
  - Accepts custom SVG child elements for celestial body paths and position indicators.
* Refactored `SunElevationDome` and `MoonElevationDome` into clean, declarative consumers of `<SkyDomeBase />`.

### 3. Shared Ribbon Scrubber Hook (`useRibbonScrubber`)
* Extracted [`useRibbonScrubber.ts`](../../src/components/widgets/common/useRibbonScrubber.ts) consolidating bidirectional timeline coordinate math and pointer dragging:
  - Supports full 365-day annual domains and synodic sub-window day ranges $[d_{\text{start}}, d_{\text{end}}]$.
  - Maps 24-hour diurnal Zulu time $[0, 24]\text{h}$ along the vertical axis.
  - Encapsulates pointer capture lifecycles (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`) with reactive SVG bounding client rect caching.
* Re-implemented `SolarRibbonChart` and `LunarRibbonChart` using `useRibbonScrubber`, eliminating ~150 lines of duplicate code.

### 4. Canonical MiniGlobe Integration & Observer-Locked Reticle
* Replaced `LivingMarble.tsx` in [`AstrolabeDial.tsx`](../../src/components/controls/AstrolabeDial.tsx) with the unified 9-layer [`<MiniGlobe />`](../../src/components/common/MiniGlobe.tsx).
* Implemented an **Observer-Locked Reticle**:
  - Observer pin remains centered along the prime vertical axis at $Y_{\text{obs}} = -R\sin\phi$ and $X_{\text{obs}} = 0$.
  - Connected camera yaw directly to the negative hour angle ($\text{yaw} = -H$), causing sunlight and the day/night terminator to rotate around the globe while the observer location remains facing the user.
  - Upsized observer pin by 20% ($R = 3.6\text{px}$) with pulsing gold/cyan crosshairs.
  - Synchronized vertical meridian with chronometer gold accent (`#f59e0b`) and removed redundant equator-meridian junction dot.
* Deleted legacy `LivingMarble.tsx`.

### 5. Domain Test Suite Decomposition & Full Coverage
* Decomposed monolithic `cosmicMath.test.ts` into specialized math domain test suites: `core.test.ts`, `solar.test.ts`, `lunar.test.ts`, `eclipse.test.ts`, `projection.test.ts`, and `armillary.test.ts`.
* Decomposed 1,344-line `widgets.test.ts` into 7 co-located widget test suites:
  - `ArmillaryWidget.test.tsx` (17 tests)
  - `SolarWidget.test.tsx` (4 tests)
  - `LunarWidget.test.tsx` (5 tests)
  - `TodayWidget.test.tsx` (3 tests)
  - `EclipseWidget.test.tsx` (9 tests)
  - `MacroOrbitWidget.test.tsx` (3 tests)
  - `TidesWidget.test.tsx` (3 tests)
  - Preserved root `widgets.test.ts` (2 tests) verifying public barrel re-exports from `src/components/widgets/index.ts`.
* Expanded UI component test coverage:
  - [`layout.test.tsx`](../../src/components/layout/layout.test.tsx) (8 tests): ObsNavbar presets, chronometer dock expansion/collapse, coordinate clamping, and time parsing.
  - [`TerminatorMap.test.tsx`](../../src/components/widgets/terminator/TerminatorMap.test.tsx) (6 tests): Observer meridian centering, subsolar/sublunar AU/km distance scaling, and 4-tier twilight boundaries.
* Updated `scripts/syncDocMetrics.mjs` to register all 37 canonical suites and synchronized metrics across all documentation files.

---

## Consequences
* **Bundle Performance**: Initial production JS bundle reduced by **50.4%** (from 526.91 kB to 261.29 kB).
* **Architectural Simplicity**: Reusable primitives `<MiniGlobe />`, `<SkyDomeBase />`, and `useRibbonScrubber` eliminate duplicate code across views.
* **Test Isolation & Speed**: 37 modular test suites enable rapid targeted testing with clear domain boundaries.
* **Strict Type Safety**: Full adherence to branded nominal units with 0 AST violations across all 77 UI components.
* **Verification**: 100% test pass rate across 37 test files and 454 unit tests.
