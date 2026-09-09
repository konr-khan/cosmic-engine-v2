# ADR 0018: Performance Optimization, Modular Ephemeris Decoupling, and Build Hardening

## Status
Accepted

## Context

Following comprehensive static and runtime analysis of **Cosmic Engine V2.0**, several architectural friction points and optimization opportunities were identified across four critical domains:

1. **React 19 Rendering & Concurrency Friction**:
   - High-frequency ribbon scrubber tracking (`hoveredDate`, `hoveredTime`, `hoverPosition`) stored in global root state caused 60 FPS re-render cascades across all 8 observatory widgets during rapid cursor movement.
   - The ephemeris Web Worker lacked dispatch throttling, allowing rapid chronometer scrubbing to flood the worker thread with asynchronous requests. In addition, absence of request sequence numbering created race conditions where older ephemeris responses could overwrite newer ones.
   - `MacroOrbitView` recalculated planetary ephemeris redundantly rather than subscribing to existing state.
2. **Mathematical Redundancy & Circular Dependencies**:
   - Sidereal time functions (`calculateGMST` and `calculateLST`) were located in `src/components/widgets/armillary/astrolabeMath.ts`, creating an inverted circular architectural dependency from presentation widgets back into pure astronomy modules.
   - Solar position calculations were duplicated with manual trigonometric formulas across `lunar.ts` and `todaySky.ts` instead of calling `calculateSolarPosition(julianDate)`.
   - Key astronomical constants (`MOON_DRACONIC_PERIOD_DAYS` and `SOLAR_TWILIGHT_THRESHOLDS`) were scattered in local component files rather than the centralized `astroConstants.ts` registry.
3. **Module Bloat & Duplicated UI Markup**:
   - `src/utils/cosmicMath/todaySky.ts` grew to 1,061 lines, coupling three distinct mathematical sub-domains: topocentric elevation dome projection, S-Z-N celestial meridian colure kinematics, and draconic nodal crossings.
   - `SunMeridianDome.tsx` and `MoonMeridianDome.tsx` contained over 450 lines of identical SVG structural markup for S-Z-N baselines, vertical Zenith axes, Solstice/Standstill corridor swaths, and tangent diurnal chords.
4. **Bundle Leakage & Build Pipeline Hardening**:
   - A central widget barrel (`src/components/widgets/index.ts`) imported all 8 observatory widgets into a single module, risking bundle merging across dynamic `React.lazy()` boundaries.
   - Deprecated Tailwind v3 configuration (`tailwind.config.js`) and redundant `autoprefixer` remained present despite Tailwind CSS v4's native CSS engine.
   - The production build command (`"build": "vite build"`) lacked a preceding typecheck verification pass.

---

## Decisions

### 1. Dedicated External Atomic `hoverStore` (`src/store/hoverStore.ts`)
- Created an atomic external micro-store using React 19 `useSyncExternalStore` for high-frequency scrubber state (`hoveredDate: Date | null`, `hoveredTime: number | null`, `hoverPosition: number | null`).
- Created a lightweight custom hook `useRibbonScrubber` that isolates mouse move/leave handlers and subscriptions entirely to the active chart component.
- Removed all hover prop-drilling from `App.tsx`, completely insulating the 8 primary observatory widgets and 3D scenes from 60 FPS scrubber re-render cascades.

### 2. Ephemeris Worker Throttling & Monotonic Sequence Stamping
- Implemented a 100ms (~10 Hz) throttle interval on the ephemeris Web Worker dispatcher in `useEphemerisWorker.ts`, reducing worker message thread contention during continuous scrubbing.
- Added a monotonic `requestId` sequence counter: each dispatched worker task is tagged with an incrementing integer. Upon receiving a response, the main thread discards payloads with `responseId < latestCompletedRequestId`, eliminating stale, out-of-order frame overwrites.
- Stabilized temporal reference objects (`stableDate`, `stableOrbitalData`) with `shallowEqual` protection and added a warm-up gate (`skipWorkerCalc` until warm) to prevent worker dispatch on initial mount.

### 3. Ephemeris Mathematical Consolidation
- **Hoisted Sidereal Solvers**: Relocated `calculateGMST` and `calculateLST` to foundational `src/utils/cosmicMath/core.ts` with comprehensive unit tests (`core.test.ts`), establishing pure bottom-up dependency flow.
- **Single Source of Truth for Solar Position**: Replaced duplicate hand-rolled solar equations in `lunar.ts` and `todaySky.ts` with `calculateSolarPosition(julianDate)`.
- **Astronomical Constants Centralization**: Centralized `MOON_DRACONIC_PERIOD_DAYS = 27.212220817` and `SOLAR_TWILIGHT_THRESHOLDS` (`civil: -6.0`, `nautical: -12.0`, `astronomical: -18.0`) in `astroConstants.ts`.

### 4. Modular Decomposition of `todaySky.ts`
Decomposed the 1,061-line monolith into focused submodules under `src/utils/cosmicMath/today/`:
- **`elevation.ts`** (404 lines): Topocentric elevation dome projections, diurnal path SVG curves, solar/lunar twilight classification, and azimuth compass octants.
- **`meridian.ts`** (361 lines): S-Z-N celestial meridian colure kinematics, Solstice/Standstill corridor swaths, perpendicular radial tick pins, 3D colure diurnal chords, and Approach C parked gate anchors.
- **`draconic.ts`** (260 lines): True lunar node crossings, 18.6-year standstill bounds, monthly 30-day declination extrema, and draconic progress tracks.
- **Facade Re-Export**: Converted `src/utils/cosmicMath/todaySky.ts` into a pure, lightweight facade re-exporting all three submodules, preserving 100% backward compatibility.

### 5. Shared `MeridianDomeBase.tsx` Component Primitive
- Extracted [`MeridianDomeBase.tsx`](../../src/components/widgets/today/MeridianDomeBase.tsx) providing the shared SVG canvas (`viewBox="0 0 260 138"`), S-Z-N horizon baseline, vertical Zenith axis, Solstice/Standstill corridor swaths (`MeridianSwath`), radial tick pins (`MeridianRadialTick`), tangent diurnal chords (`MeridianDiurnalChordPath`), and Approach C parked gate anchors (`MeridianGateAnchor`).
- Refactored `SunMeridianDome.tsx` and `MoonMeridianDome.tsx` to consume `MeridianDomeBase`, eliminating over 450 lines of duplicate SVG markup while preserving all IDs, styling, and interactivity.

### 6. Dynamic Code-Splitting Protection & Dead Code Cleanup
- Deleted the root barrel file `src/components/widgets/index.ts` and obsolete `widgets.test.ts`, preventing dynamic lazy-loaded widget chunks from merging into shared bundles. Isolated sub-barrels (`src/components/widgets/*/index.ts`) remain intact for domain testing.
- Removed deprecated `tailwind.config.js` and purged redundant `autoprefixer` from `postcss.config.js` and `package.json`, allowing Tailwind CSS v4's native `@tailwindcss/postcss` plugin to process styles without legacy overhead.
- Added `"sideEffects": false` in `package.json` for aggressive module tree-shaking.
- Updated the production build script to `"build": "tsc --noEmit && vite build"`, ensuring that build artifacts cannot be emitted if TypeScript compilation errors exist.

### 7. Domain Test Harness Expansion
- Created [`src/utils/cosmicMath/globe.test.ts`](../../src/utils/cosmicMath/globe.test.ts) (**14 tests**), validating continent landmass projection across all 5 camera pipelines (`topdown`, `transverse`, `axial`, `euler3d`, `flat`), coordinate degenerate poles ($0, \pm 90^\circ$), and analytical limb horizon clipping across Cases A/B/C and twilight thresholds ($0^\circ, -6^\circ, -12^\circ, -18^\circ$).
- Created [`src/App.test.tsx`](../../src/App.test.tsx) (**5 tests**), validating root dashboard mounting, 12-column panoramic responsive grid, `ObsNavbar` branding, master preset layout windows, fixed bottom chronometer dock, and store coordinate synchronization.
- Expanded the Vitest domain test suite to **40 test modules, 559 tests**, all passing with zero regressions.

---

## Consequences

### Positive
- **Rendering Performance**: Scrubbing timelines in ribbon charts is completely decoupled from the root dashboard, eliminating frame drops and UI thread stalls.
- **Worker Stability**: Monotonic request stamping guarantees ephemeris responses always reflect the latest user state without out-of-order race conditions.
- **Code Maintainability**: Monolithic `todaySky.ts` reduced from 1,061 lines to a 12-line facade, with modular, isolated submodules that can be maintained and tested independently.
- **DRY Visualizations**: `MeridianDomeBase.tsx` eliminates massive SVG boilerplate across meridian dome visualizers.
- **Build Security**: Production builds are strictly typechecked before Vite runs Rollup bundling, preventing broken builds from deploying.
- **Bundle Optimization**: Elimination of the root barrel guarantees clean dynamic chunk boundaries for all 8 lazily-loaded observatory widgets.

### Invariants Maintained
- 100% backward-compatible public API across `src/utils/cosmicMath/` and `todaySky.ts`.
- Zero raw `asDegrees` or `asRadians` assertions in UI components (`lintUnitSafety.mjs` clean).
- Strict adherence to Symbol-branded nominal units and UTC temporal purity.
