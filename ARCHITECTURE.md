# ARCHITECTURE.md — System Topology, Runtime Contracts, Code Layout & Task Routing

Welcome to the authoritative structural blueprint for **Cosmic Engine V2.0**. This document serves as the Single Source of Truth (SSoT) for live system topology, subsystem runtime contracts, TypeScript domain models, canonical file layout, and targeted Vitest task routing.

> [!NOTE]
> - For agent operating protocols, coding standards, and cognitive guardrails, consult [`AGENTS.md`](AGENTS.md).
> - For the historical Feature Inventory (`F1–F89`) and Milestone Matrix (`M1–M44`), consult [`PROJECT.md`](PROJECT.md).
> - For astronomical equations and coordinate transformations, consult [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md).
> - For semantic color tokens and SVG vector stroke encodings, consult [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

---

## 1. System Topology & Dataflow Diagram

Cosmic Engine V2.0 executes a decoupled dual-pipeline architecture: a **60 FPS Reactive Chronometer & Web Worker Ephemeris Pipeline** driving 2D horizon visualizers and HUD controls, alongside a **Hierarchical 3D Scene Graph Engine** providing a single geometric source of truth across 3D visualizers.

```
                                 ┌──────────────────────────────────────────────────────────────┐
                                 │                   Meeus Ephemeris Core                       │
                                 │       `src/utils/cosmicMath/{core,solar,lunar,frame}.ts`     │
                                 └──────────────┬───────────────────────────────┬───────────────┘
                                                │                               │
                        ┌───────────────────────┴──────┐         ┌──────────────┴────────────────────────┐
                        ▼                              ▼         ▼                                       ▼
        ┌──────────────────────────────────────────────┐         ┌──────────────────────────────────────────────┐
        │ PIPELINE A: 60 FPS Store & Worker Engine     │         │ PIPELINE B: Hierarchical 3D Scene Graph      │
        │ • 60 FPS Ticker (`cosmicStore.ts` rAF)       │         │ • generateCosmicScene(params)                │
        │ • Atomic Scrubber (`hoverStore.ts`)          │         │ • Frames: Heliocentric / Geocentric / Topo   │
        │ • Ephemeris Web Worker (100ms throttle)      │         │ • 6 Seasonal Milestones & 5.14° Lunar Orbit   │
        │ • Deterministic Fallback (`workerFallback`)  │         │ • Analytical Umbra & Penumbra Shadow Cones   │
        └──────────────────────┬───────────────────────┘         └──────────────────────┬───────────────────────┘
                               │                                                        │
                               ▼                                                        ▼
        ┌──────────────────────────────────────────────┐         ┌──────────────────────────────────────────────┐
        │ Hook Facade: `useCosmicEngine(params)`       │         │ Camera Rigs (`src/utils/cosmicMath/scene/`)   │
        │ • Parameterized selective store selectors    │         │ • projectHeliocentricTopDown (Ecliptic)      │
        │ • 1-entry frame memoization cache            │         │ • projectGeocentricTransverse (Syzygy)       │
        │ • Synchronous warm cache bootstrap           │         │ • projectGeocentricAxial (Anti-Solar)        │
        └──────────────────────┬───────────────────────┘         └──────────────────────┬───────────────────────┘
                               │                                                        │
                               │                                 ┌──────────────────────┴───────────────────────┐
                               │                                 │ Scene Hooks (`useCosmicScene.ts`)            │
                               │                                 │ • useCosmicScene()                           │
                               │                                 │ • useHeliocentricScene()                     │
                               │                                 └──────────────────────┬───────────────────────┘
                               ▼                                                        ▼
        ┌──────────────────────────────────────────────┐         ┌──────────────────────────────────────────────┐
        │ 2D Presenters & Horizon Visualizers          │         │ 3D Celestial Visualizers                     │
        │ • Today's Horizon Dome (`TodayHorizonView`)   │         │ • Heliocentric Macro Orbit (`MacroOrbitView`)│
        │ • Solar Almanac (`SolarAlmanacCard`)         │         │ • Eclipse Demonstrator (`EclipseDemonstrator`)│
        │ • Lunar Almanac (`LunarAlmanacCard`)         │         │ • Gyro-Morph Armillary (`GyroArmillaryView`) │
        │ • Daylight Terminator Map (`TerminatorMap`)  │         │ • 2-Phase Camera Rigs (`useStagedCamera`)    │
        │ • Micro-Tidal Force (`MicroTideView`)        │         │ • Shared `<MiniGlobe />` & `<MiniMoon />`    │
        └──────────────────────────────────────────────┘         └──────────────────────────────────────────────┘
```

---

## 2. Subsystem Architecture & Key Runtime Contracts

- **Pure Mathematical Engine (`src/utils/cosmicMath/`)**: Deterministic, pure domain functions free of React state, UI side-effects, or unparameterized `new Date()` calls. All algorithms, coordinate systems (Alt-Az, Equatorial, Ecliptic), and polar singularity clamping criteria conform strictly to [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md).
- **External Chronometer Store (`src/store/cosmicStore.ts`)**: Decouples 60 FPS animation ticking from React render trees using `useSyncExternalStore` with granular selector memoization (`lastSelectorRef`, e.g. `useChronometerStore(s => s.timeOfDay)`) and full IEEE-754 double-precision time accumulation.
- **Atomic Hover Store (`src/store/hoverStore.ts`)**: Isolates high-frequency ribbon scrubber state (`hoverTime`, `hoverDate`, `setHoverState`, `setHoverTime`, `setHoverDate`), eliminating 60 FPS re-render cascades across unhovered widgets.
- **Web Worker Ephemeris Processing (`src/workers/`)**: Multiplexes calculation requests through `ephemerisWorkerManager.ts` with 100ms trailing-edge flag-merging throttling, monotonic integer sequence stamping (`requestId`), synchronous mount-time LRU cache seeding, and deterministic main-thread fallback (`workerFallback.ts`).
- **Fault-Tolerant Window Grid (`DashboardWindow.tsx`)**: Every lazy-loaded visualizer is wrapped in a React Error Boundary (`WindowErrorBoundary.tsx`) with dynamic chunk retry mechanisms, isolating rendering exceptions to individual observatory windows.
- **Dual-Perspective Eclipse Geometry**: Synchronized transverse syzygy profile (`LiveSyzygyView.tsx`) and axial sightline down-the-barrel view (`NodalPlaneVisualizer.tsx`). Canonical transverse displacement equations, prograde right-to-left kinematics, and shadow cone geometry conform strictly to [`docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry`](docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry) and [`docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings`](docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings).
- **Orbital Milestones & Scaling**: Keplerian milestone halo nodes and apparent diameter scaling conform to [`docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings`](docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings) and [`docs/MATH_SPEC.md#9-dynamic-ephemeris-distance--apparent-diameter-scaling`](docs/MATH_SPEC.md#9-dynamic-ephemeris-distance--apparent-diameter-scaling).

---

## 3. Interface Contracts & Domain Models

All canonical mathematical models, branded nominal units, 3D scene-graph structures, and worker RPC protocols are maintained as single sources of truth in their respective compiler-checked TypeScript modules:

- **3D Astronomical Scene Graph & Camera Pipelines**: [`src/utils/cosmicMath/scene/types.ts`](src/utils/cosmicMath/scene/types.ts) (`CosmicScene3D`, `SceneBody3D`, `ShadowCones3D`, `ProjectedScene2D`, `ScaleMode`) and [`src/hooks/useCosmicScene.ts`](src/hooks/useCosmicScene.ts) (`useCosmicScene`, `useHeliocentricScene`)
- **Branded Nominal Units & Coordinates**: [`src/types/units.ts`](src/types/units.ts) (`Degrees`, `Radians`, `JulianDate`, `JulianCenturies`, `Latitude`, `Longitude`, forbidden brand intersections `NotRadians` / `NotDegrees`) and [`src/types/coordinates.ts`](src/types/coordinates.ts) (`Vector2D`, `Vector3D`, `AltAzimuthCoordinates`, `EquatorialCoordinates`)
- **Astronomical Data Models**: [`src/types/astronomy.ts`](src/types/astronomy.ts) (`EphemerisFrame`, `SolarPositionFull`, `LunarPositionFull`, `EclipseData`)
- **Web Worker Concurrency Contracts**: [`src/types/worker.ts`](src/types/worker.ts) (`EphemerisWorkerRequest`, `EphemerisWorkerResponse`, discriminated RPC payload maps, monotonic sequence stamps) and [`src/workers/ephemerisWorkerManager.ts`](src/workers/ephemerisWorkerManager.ts) (trailing-edge flag-merging multiplexer & pre-seeded annual LRU caches)
- **Observatory Store State & Window Layout**: [`src/types/store.ts`](src/types/store.ts) (`CosmicStoreState`, `WindowLayoutConfig`, `WindowLayoutDictionary`, `WindowLayoutPreset`) and [`src/store/hoverStore.ts`](src/store/hoverStore.ts) (`HoverState`: `hoverTime`, `hoverDate`, `setHoverState`, `setHoverTime`, `setHoverDate`)
- **Shared Component Primitives**:
  - MiniGlobe: [`src/components/common/MiniGlobe.tsx`](src/components/common/MiniGlobe.tsx) (`MiniGlobeProps`, `MiniGlobeViewMode`)
  - MiniMoon: [`src/components/common/MiniMoon.tsx`](src/components/common/MiniMoon.tsx) (`MiniMoonProps`)
  - Almanac Shortcuts Rail: [`src/components/widgets/common/AlmanacShortcutsRail.tsx`](src/components/widgets/common/AlmanacShortcutsRail.tsx) (`AlmanacShortcutsRailProps`)
  - Sky Dome Base: [`src/components/widgets/today/SkyDomeBase.tsx`](src/components/widgets/today/SkyDomeBase.tsx) (`SkyDomeBaseProps`)
  - Meridian Dome Base: [`src/components/widgets/today/MeridianDomeBase.tsx`](src/components/widgets/today/MeridianDomeBase.tsx) (`MeridianDomeBaseProps`)

---

## 4. Canonical Code Layout

- `src/`
  - `main.tsx` — React root renderer
  - `App.tsx` — Master Observatory dashboard container
  - `App.test.tsx` — Root dashboard mounting, layout grid & dock integration tests
  - `constants/`
    - `dashboardPresets.ts` — Observatory window arrangement layout presets
  - `types/` — Foundational branded units, coordinates, astronomy, worker RPC & store contracts
  - `utils/`
    - `formatters.ts` — Human-readable coordinate and temporal formatting
    - `lruCache.ts` — Generic bounded LRU cache utility
    - `lruCache.test.ts` — LRU cache eviction order and capacity tests
    - `cosmicMath/`
      - `astroConstants.ts` — Centralized IAU/WGS-84/Meeus physical constants & J2000 epoch
      - `core.ts` — Julian dates, UTC invariance, spherical linear interpolation (`slerp3D`), GMST & LST
      - `solar.ts` — Solar declination, EoT, twilight algorithms & annual solar matrix
      - `lunar.ts` — Lunar ephemeris, phase angle, disc illumination, Newton-Raphson crossing solver
      - `eclipse.ts` — Syzygy shadow geometry & eclipse recurrence scanner
      - `today/` — Decomposed Topocentric Horizon & Meridian submodules (`index.ts` barrel)
        - `elevation.ts` — Prime vertical dome projection, diurnal paths & rise/set azimuth octants
        - `meridian.ts` — S-Z-N meridian profiles, Solstice/Standstill swaths & diurnal chords
        - `draconic.ts` — True lunar node crossings, 18.6y standstills & micro-rail
      - `globe.ts` — Spherical continent projection & analytical limb horizon clipping
      - `projection.ts` — Earth axial tilt 3D projection, observer pin & 4-quadrant orbital stroke segments
      - `geoData.ts` — World landmass continent outline polygons
      - `milestones.ts` — Canonical Earth orbital milestones (single source of truth)
      - `frame.ts` — Centralized EphemerisFrame snapshot generator
      - `terminatorTracks.ts` — Diurnal celestial ground tracks & antimeridian seam interpolation (ADR-0027)
      - `scene/` — Unified 3D Astronomical Scene Graph & Camera Rigs (`types.ts`, `transforms.ts`, `generator.ts`, `cameras.ts`)
      - `armillary/` — Decomposed Gyro-Morph Armillary & Astrolabe math module (5-model continuum, stereographic conformal, Rojas orthographic, almucantars, focal beacon, alidade, `generatorRings.ts`, `generatorBeads.ts`, `generatorGeometry.ts`, `generatorObserverCone.ts`)
      - `domainInvariants.test.ts` — Empirical domain invariants & physics conservation laws
  - `store/`
    - `cosmicStore.ts` — External state store & animation frame ticker
    - `hoverStore.ts` — Atomic external store for 60 FPS ribbon scrubber isolation (`hoverTime`, `hoverDate`)
  - `workers/`
    - `ephemerisWorker.ts` — Dedicated worker thread for Meeus ephemeris & 365-day matrices
    - `ephemerisWorkerManager.ts` — Application singleton worker manager, trailing-edge coalescing & matrix cache
    - `workerFallback.ts` — Deterministic synchronous main-thread fallback routines
    - `workerFallback.test.ts` — Main-thread fallback and cache integration tests
    - `workerSanitizers.ts` — Parameter boundary clamping & defensive input gatekeepers
    - `workerSanitizers.test.ts` — Boundary validation & pathological input test suite
  - `hooks/`
    - `useCosmicEngine.ts` — Selective domain engine hook
    - `useCosmicScene.ts` — Reactive 3D scene hook (`useCosmicScene`, `useHeliocentricScene`)
    - `useEphemerisWorker.ts` — Worker dispatch hook with 100ms throttling & sequence stamping
    - `useDashboardLayout.ts` — Window layout state, drag-and-drop, resize, locking, presets & storage
  - `components/`
    - `widgets/` — Lazy-loaded observatory visualizers (`React.lazy()`)
      - `common/` — Shared widget primitives (`useRibbonScrubber.ts`, `AlmanacShortcutsRail.tsx`)
      - `today/` — Today's Sky Horizon subsystem (`SkyDomeBase`, `MeridianDomeBase`, `SunElevationDome`, `SunMeridianDome`, `MoonElevationDome`, `MoonMeridianDome`, `TodayHorizonView`, `todayTokens.ts`)
        - `hooks/` — Mathematical derivation hooks (`useMoonElevationMath.ts`, `useSunElevationMath.ts`, `useSunMeridianMath.ts`, `useMoonMeridianMath.ts`, `meridianConfigHelpers.ts`)
        - `common/` — Shared today visual primitives (`SkyDomeFooter.tsx`, `MeridianDomeFooter.tsx`, `DraconicTimelineRail.tsx`, `LunarPhaseDisc.tsx`)
      - `armillary/` — Gyro-Morph Armillary & Astrolabe (`GyroArmillaryView`, `ArmillarySvgCanvas`, `useStagedCamera`, `useArmillaryInteractions`, `controls/`, `canvas/`)
      - `solar/` — Solar Almanac subsystem (`SolarAlmanacCard`, `SolarRibbonChart`, `PolarSunlightDial`, `polarDialGeometry.ts`, `ribbon/`)
      - `lunar/` — Lunar Almanac subsystem (`LunarAlmanacCard`, `LunarRibbonChart`, `TidalWaveOscillator`, `ribbon/`)
      - `eclipse/` — Eclipse Demonstrator subsystem (`EclipseDemonstrator`, `LiveSyzygyView`, `NodalPlaneVisualizer`, `SkyViewSimulator`, `EclipseScanner`, `ShadowRayHoverHud.tsx`, `hooks/useNodalPlaneMath.ts`)
      - `terminator/` — Daylight Terminator Map (`TerminatorMap`, `TerminatorHoverHud.tsx`, `TerminatorLandmasses.tsx`, `TerminatorGroundTracks.tsx`, `hooks/useTerminatorMapMath.ts`)
      - `macro/` — Heliocentric Macro Orbit (`MacroOrbitView`, `OrbitSvgCanvas`, `OrbitPhysicsHud.tsx`, `macroTokens.ts`)
      - `tides/` — Earth Gravitational Tidal Force (`MicroTideView`, `hooks/useTideMath.ts`)
    - `controls/` — Astrolabe controls (`ControlRing`, `LatitudeSlider`, `PolarLongitudeSelector`, `BufferedInput`, `ArmillaryRail`)
    - `layout/` — Layout & window management (`DashboardWindow`, `ObsNavbar`, `OrbitalChronometer`, `chronometer/` (`AstrolabeDial.test.tsx`, `SolsticeJumpControls.test.tsx`))
    - `common/` — Shared primitives (`MiniGlobe`, `miniglobe/`, `MiniMoon`, `MiniMoon.test.tsx`, `WindowErrorBoundary`, `PhaseVisual`)
- `scripts/`
  - `lintUnitSafety.mjs` — Babel AST linter for UI unit safety, domain math purity, default `new Date()` ban & `AGENTS.md` size budget
  - `lintUnitSafety.d.mts` — TypeScript declarations for AST linter exports
  - `syncDocMetrics.mjs` — Automated Vitest suite counter and master documentation dossier compiler
- `.gitattributes` — Standard line-ending normalization (`eol=lf`) and binary asset flags
- `ARCHITECTURE.md` — System topology, runtime contracts, canonical code layout & task routing matrix
- `PROJECT.md` — Historical Feature Inventory (`F1–F89`) and Milestone Matrix (`M1–M44`)
- `DEAD_ENDS.md` — Critical log of failed historical approaches & solutions
- `docs/`
  - `MATH_SPEC.md` — Canonical astronomical math & coordinate specification
  - `DESIGN_SYSTEM.md` — Canonical visual tokens, color semantics & stroke encodings
  - `adr/` — Architecture Decision Records (`0001` through `0044`)

---

## 5. Subsystem Task Routing Matrix

| Observatory Subsystem | Domain Mathematical Core | Presenter / Math Hook | UI Container & Layers | Primary Targeted Vitest Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Today's Horizon Dome** | `today/{elevation,meridian,draconic}.ts` | `use{Sun,Moon}ElevationMath.ts`, `use{Sun,Moon}MeridianMath.ts` | `TodayHorizonView.tsx`, `SkyDomeBase.tsx`, `MeridianDomeBase.tsx` | `npx vitest run TodayWidget.test.tsx` |
| **Solar Almanac** | `solar.ts`, `astroConstants.ts` | `useCosmicEngine.ts` | `SolarAlmanacCard.tsx`, `SolarRibbonChart.tsx`, `PolarSunlightDial.tsx` | `npx vitest run SolarWidget.test.tsx` |
| **Lunar Almanac** | `lunar.ts`, `astroConstants.ts` | `useCosmicEngine.ts` | `LunarAlmanacCard.tsx`, `LunarRibbonChart.tsx`, `TidalWaveOscillator.tsx` | `npx vitest run LunarWidget.test.tsx` |
| **Eclipse Demonstrator** | `eclipse.ts`, `scene/cameras.ts` | `useCosmicScene()`, `useNodalPlaneMath.ts` | `EclipseDemonstrator.tsx`, `LiveSyzygyView.tsx`, `NodalPlaneVisualizer.tsx` | `npx vitest run EclipseWidget.test.tsx` |
| **Terminator Map** | `terminatorTracks.ts`, `globe.ts` | `useTerminatorMapMath.ts` | `TerminatorMap.tsx`, `TerminatorLandmasses.tsx`, `TerminatorGroundTracks.tsx` | `npx vitest run TerminatorMap.test.tsx` |
| **Macro Orbit** | `scene/generator.ts`, `milestones.ts` | `useHeliocentricScene()` | `MacroOrbitView.tsx`, `OrbitSvgCanvas.tsx`, `OrbitPhysicsHud.tsx` | `npx vitest run MacroOrbitWidget.test.tsx` |
| **Gyro-Morph Armillary** | `armillary/{generator,projections}.ts` | `useArmillaryInteractions.ts`, `useStagedCamera.ts` | `GyroArmillaryView.tsx`, `ArmillarySvgCanvas.tsx`, `ArmillaryBeadsLayer.tsx` | `npx vitest run ArmillaryWidget.test.tsx` |
| **Gravitational Tides** | `lunar.ts`, `projection.ts` | `useTideMath.ts` | `MicroTideView.tsx`, `MiniGlobe.tsx` | `npx vitest run TidesWidget.test.tsx` |
| **Observatory Layout & Controls** | `useDashboardLayout.ts` | `useChronometerStore`, `useHoverStore` | `DashboardWindow.tsx`, `ObsNavbar.tsx`, `OrbitalChronometer.tsx`, `ControlRing.tsx`, `LatitudeSlider.tsx` | `npx vitest run controls.test.tsx DashboardWindow.test.tsx layout.test.tsx` |
