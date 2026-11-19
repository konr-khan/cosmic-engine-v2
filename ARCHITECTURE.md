# ARCHITECTURE.md — System Topology, Runtime Contracts, Code Layout & Task Routing

Welcome to the authoritative structural blueprint for **Cosmic Engine V2.0**. This document serves as the Single Source of Truth (SSoT) for live system topology, subsystem runtime contracts, TypeScript domain models, canonical file layout, and targeted Vitest task routing.

> [!NOTE]
> - For agent operating protocols, coding standards, and cognitive guardrails, consult [`AGENTS.md`](AGENTS.md).
> - For the historical Feature Inventory (`F1–F94`) and Milestone Matrix (`M1–M45`), consult [`PROJECT.md`](PROJECT.md).
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
- **Dual-Perspective Eclipse Geometry**: Synchronized transverse syzygy profile (`ShadowRayDiagram.tsx` mounting live sub-layer `LiveSyzygyView.tsx`) and axial sightline down-the-barrel view (`NodalPlaneVisualizer.tsx`). Canonical transverse displacement equations, prograde right-to-left kinematics, and shadow cone geometry conform strictly to [`docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry`](docs/MATH_SPEC.md#6-syzygy-eclipse-shadow-geometry) and [`docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings`](docs/DESIGN_SYSTEM.md#2-2d--3d-vector-stroke--path-encodings).
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

> [!NOTE]
> Every non-test production module under `src/` is inventoried 1:1 below and verified bijectively by `runDocIntegrityCheck()` in [`scripts/lintUnitSafety.mjs`](scripts/lintUnitSafety.mjs). For the auto-synchronized 59-suite `.test.ts(x)` registry, consult [`README.md`](README.md#-verification--test-harness) and [`AGENTS.md`](AGENTS.md#3-file-glob-action--test-router).

- `src/`
  - `main.tsx` — React 19 root renderer
  - `App.tsx` — Master Observatory dashboard container & memoized widget wrappers
  - `index.css` — Tailwind CSS v4 entry stylesheet
  - `vite-env.d.ts` — Vite client ambient TypeScript declarations
  - `constants/`
    - `dashboardPresets.ts` — Observatory window arrangement layout presets
  - `types/` — Branded nominal units, coordinates, astronomy, worker RPC & store contracts (`astronomy.ts`, `coordinates.ts`, `index.ts`, `store.ts`, `units.ts`, `worker.ts`)
  - `utils/`
    - `formatters.ts` — Human-readable coordinate and UTC temporal formatting/parsing
    - `lruCache.ts` — Generic bounded LRU cache utility
    - `cosmicMath/`
      - `astroConstants.ts` — Centralized IAU/WGS-84/Meeus physical constants & `J2000_DATE` / `J2000_JD` epoch
      - `core.ts` — Julian dates, UTC invariance, spherical linear interpolation (`slerp3D`), GMST & LST
      - `solar.ts` — Solar declination, EoT, twilight algorithms & annual solar matrix
      - `lunar.ts` — Lunar ephemeris, phase angle, disc illumination & Newton-Raphson node solver
      - `eclipse.ts` — Syzygy shadow geometry & eclipse recurrence scanner
      - `globe.ts` — Spherical continent projection & analytical limb horizon clipping
      - `projection.ts` — Earth axial tilt 3D projection, observer pin & 4-quadrant orbital stroke segments
      - `geoData.ts` — World landmass continent outline polygons
      - `milestones.ts` — Canonical Earth orbital milestones (pure mathematical SSoT)
      - `frame.ts` — Centralized `EphemerisFrame` snapshot generator
      - `terminatorTracks.ts` — Diurnal celestial ground tracks & antimeridian seam interpolation
      - `index.ts` — Pure mathematical barrel exports
      - `today/` — Topocentric Horizon & Meridian submodules (`draconic.ts`, `elevation.ts`, `index.ts`, `meridian.ts`)
      - `scene/` — Unified 3D Astronomical Scene Graph & Camera Rigs (`cameras.ts`, `generator.ts`, `index.ts`, `transforms.ts`, `types.ts`)
      - `armillary/` — Decomposed Gyro-Morph Armillary & Astrolabe math engine (`alidade.ts`, `astrolabe.ts`, `constants.ts`, `coordinates.ts`, `focalBeacon.ts`, `generator.ts`, `generatorBeads.ts`, `generatorGeometry.ts`, `generatorObserverCone.ts`, `generatorRings.ts`, `index.ts`, `paths.ts`, `projections.ts`, `types.ts`)
  - `store/` — External `useSyncExternalStore` state engines (`cosmicStore.ts`, `hoverStore.ts`)
  - `workers/` — Web Worker ephemeris thread, singleton multiplexer, sanitizers, fallback & test double (`ephemerisWorker.ts`, `ephemerisWorkerManager.ts`, `mockWorkerFixture.ts`, `workerFallback.ts`, `workerSanitizers.ts`)
  - `hooks/` — Reactive engine, 3D scene, worker RPC & dashboard layout hooks (`useCosmicEngine.ts`, `useCosmicScene.ts`, `useDashboardLayout.ts`, `useEphemerisWorker.ts`)
  - `components/`
    - `common/` — Shared SVG & fault-isolation primitives (`MiniGlobe.tsx`, `MiniMoon.tsx`, `PhaseVisual.tsx`, `WidgetSkeleton.tsx`, `WindowErrorBoundary.tsx`, `useSafeSvgId.ts`)
      - `miniglobe/` — Decomposed `<MiniGlobe />` renderers & pure view-mode builders (`MiniGlobeFlat.tsx`, `MiniGlobeSphere.tsx`, `globeGeometry.ts`, `types.ts`)
    - `controls/` — Accessible astrolabe & coordinate controls (`ArmillaryRail.tsx`, `BufferedInput.tsx`, `ControlRing.tsx`, `LatitudeSlider.tsx`, `PolarLongitudeSelector.tsx`)
    - `layout/` — Workspace window grid, navbar & bottom dock (`DashboardWindow.tsx`, `ObsNavbar.tsx`, `OrbitalChronometer.tsx`)
      - `chronometer/` — Concentric astrolabe dial, readouts, solstice jumps & popovers (`AstrolabeDial.tsx`, `ChronometerModalPopovers.tsx`, `ChronometerReadoutCards.tsx`, `SolsticeJumpControls.tsx`, `index.ts`)
    - `widgets/` — Lazy-loaded observatory visualizers (`React.lazy()`)
      - `common/` — Shared widget scrubbing & shortcut rails (`AlmanacShortcutsRail.tsx`, `useRibbonScrubber.ts`)
      - `today/` — Today's Sky Horizon & Meridian subsystem (`MeridianDomeBase.tsx`, `MoonElevationDome.tsx`, `MoonMeridianDome.tsx`, `SkyDomeBase.tsx`, `SunElevationDome.tsx`, `SunMeridianDome.tsx`, `TodayHorizonView.tsx`, `index.ts`, `todayTokens.ts`)
        - `hooks/` — Elevation/meridian math hooks & view-model builders (`index.ts`, `meridianConfigHelpers.ts`, `useMoonElevationMath.ts`, `useMoonMeridianMath.ts`, `useSunElevationMath.ts`, `useSunMeridianMath.ts`)
        - `common/` — Shared horizon footers, draconic rail & phase disc (`DraconicTimelineRail.tsx`, `LunarPhaseDisc.tsx`, `MeridianDomeFooter.tsx`, `SkyDomeFooter.tsx`, `index.ts`)
      - `armillary/` — Gyro-Morph Armillary & Astrolabe container, HUDs & camera hooks (`ArmillaryEarthPip.tsx`, `ArmillaryHeaderControls.tsx`, `ArmillaryHoverHud.tsx`, `ArmillarySvgCanvas.tsx`, `ArmillaryTelemetryHud.tsx`, `GyroArmillaryView.tsx`, `armillaryTokens.ts`, `index.ts`, `types.ts`, `useArmillaryInteractions.ts`, `useStagedCamera.ts`)
        - `canvas/` — Modular SVG layers & instance-scoped `<defs>` (`ArmillaryAlidadeLayer.tsx`, `ArmillaryBeadsLayer.tsx`, `ArmillaryBezelLayer.tsx`, `ArmillaryDefs.tsx`, `ArmillaryLaserLayer.tsx`, `ArmillaryObserverConeLayer.tsx`, `ArmillaryRingsLayer.tsx`, `ArmillaryStarsLayer.tsx`, `ArmillaryTympanLayer.tsx`, `index.ts`)
        - `controls/` — Mode pills, morph slider rail & layer toggles (`ArmillaryLayerToggles.tsx`, `ArmillaryModePills.tsx`, `ArmillaryMorphRail.tsx`, `index.ts`)
      - `solar/` — Solar Almanac & 24h Polar Dial (`PolarSunlightDial.tsx`, `SolarAlmanacCard.tsx`, `SolarRibbonChart.tsx`, `SolarShortcutsRail.tsx`, `index.ts`, `polarDialGeometry.ts`)
        - `ribbon/` — Memoized 365-day solar ribbon layers (`SolarRibbonAxes.tsx`, `SolarRibbonBands.tsx`, `SolarRibbonOverlay.tsx`, `index.ts`)
      - `lunar/` — Lunar Almanac & tidal wave oscillator (`LunarAlmanacCard.tsx`, `LunarRibbonChart.tsx`, `LunarShortcutsRail.tsx`, `TidalWaveOscillator.tsx`, `index.ts`)
        - `ribbon/` — Memoized braided lunar ribbon layers (`LunarRibbonAxes.tsx`, `LunarRibbonCurves.tsx`, `LunarRibbonHud.tsx`, `index.ts`)
      - `eclipse/` — Dual-Perspective Eclipse Demonstrator (`EclipseDemonstrator.tsx`, `EclipseScanner.tsx`, `EclipseStatusBadge.tsx`, `LiveSyzygyView.tsx`, `NodalPlaneVisualizer.tsx`, `ShadowRayDiagram.tsx`, `ShadowRayHoverHud.tsx`, `SkyViewSimulator.tsx`, `index.ts`)
        - `hooks/` — Memoized syzygy & nodal plane math hooks (`index.ts`, `useNodalPlaneMath.ts`, `useSyzygyMath.ts`)
      - `terminator/` — Observer-centered Daylight Terminator Map (`TerminatorGroundTracks.tsx`, `TerminatorHoverHud.tsx`, `TerminatorLandmasses.tsx`, `TerminatorMap.tsx`, `index.ts`)
        - `hooks/` — Terminator coordinate & disc-scaling hook (`useTerminatorMapMath.ts`)
      - `macro/` — Heliocentric Macro Orbit (`MacroOrbitView.tsx`, `OrbitHeaderControls.tsx`, `OrbitHoverHud.tsx`, `OrbitPhysicsHud.tsx`, `OrbitSvgCanvas.tsx`, `index.ts`, `macroTokens.ts`, `milestones.ts`, `types.ts`)
      - `tides/` — Earth Gravitational Tidal Micro-View (`MicroTideView.tsx`, `index.ts`)
        - `hooks/` — Tidal bulge & nodal alignment hook (`index.ts`, `useTideMath.ts`)
- `scripts/`
  - `lintUnitSafety.mjs` — Babel AST & documentation SSoT parity linter (UI unit safety, math purity, SVG `<defs>` ID scoping, default `new Date()` ban, `AGENTS.md` size budget, link/anchor/ledger/inventory checks)
  - `lintUnitSafety.d.mts` — TypeScript declarations for AST & doc linter exports
  - `syncDocMetrics.mjs` — Automated Vitest suite counter, SSoT index/ledger synchronizer (`--check` read-only gate & `--dossier` compiler)
- `.gitattributes` — Standard line-ending normalization (`eol=lf`) and binary asset flags
- `AGENTS.md` — Always-loaded operational prompt kernel & enforced guardrails (`5–18 KB`)
- `ARCHITECTURE.md` — System topology, runtime contracts, 100% canonical code layout & task routing matrix
- `PROJECT.md` — Historical Feature Inventory (`F1–F94`) and Milestone Matrix (`M1–M45`)
- `DEAD_ENDS.md` — Critical log of failed historical approaches & resolved solutions (`DE-01–DE-51`)
- `docs/`
  - `MATH_SPEC.md` — Canonical astronomical math & coordinate specification
  - `DESIGN_SYSTEM.md` — Canonical visual tokens, color semantics & stroke encodings
  - `adr/` — Architecture Decision Records (`0001` through `0045` + `README.md` subsystem index)

---

## 5. Subsystem Task Routing Matrix

| Observatory Subsystem | Domain Mathematical Core | Presenter / Math Hook | UI Container & Layers | Primary Targeted Vitest Suite |
| :--- | :--- | :--- | :--- | :--- |
| **Today's Horizon Dome** | `today/{elevation,meridian,draconic}.ts` | `use{Sun,Moon}ElevationMath.ts`, `use{Sun,Moon}MeridianMath.ts` | `TodayHorizonView.tsx`, `SkyDomeBase.tsx`, `MeridianDomeBase.tsx` | `npx vitest run TodayWidget.test.tsx` |
| **Solar Almanac** | `solar.ts`, `astroConstants.ts` | `useCosmicEngine.ts` | `SolarAlmanacCard.tsx`, `SolarRibbonChart.tsx`, `PolarSunlightDial.tsx` | `npx vitest run SolarWidget.test.tsx` |
| **Lunar Almanac** | `lunar.ts`, `astroConstants.ts` | `useCosmicEngine.ts` | `LunarAlmanacCard.tsx`, `LunarRibbonChart.tsx`, `TidalWaveOscillator.tsx` | `npx vitest run LunarWidget.test.tsx` |
| **Eclipse Demonstrator** | `eclipse.ts`, `scene/cameras.ts` | `useCosmicScene()`, `useNodalPlaneMath.ts`, `useSyzygyMath.ts` | `EclipseDemonstrator.tsx`, `ShadowRayDiagram.tsx`, `LiveSyzygyView.tsx`, `NodalPlaneVisualizer.tsx` | `npx vitest run EclipseWidget.test.tsx` |
| **Terminator Map** | `terminatorTracks.ts`, `globe.ts` | `useTerminatorMapMath.ts` | `TerminatorMap.tsx`, `TerminatorLandmasses.tsx`, `TerminatorGroundTracks.tsx` | `npx vitest run TerminatorMap.test.tsx` |
| **Macro Orbit** | `scene/generator.ts`, `milestones.ts` | `useHeliocentricScene()` | `MacroOrbitView.tsx`, `OrbitSvgCanvas.tsx`, `OrbitPhysicsHud.tsx` | `npx vitest run MacroOrbitWidget.test.tsx` |
| **Gyro-Morph Armillary** | `armillary/{generator,projections}.ts` | `useArmillaryInteractions.ts`, `useStagedCamera.ts` | `GyroArmillaryView.tsx`, `ArmillarySvgCanvas.tsx`, `ArmillaryBeadsLayer.tsx` | `npx vitest run ArmillaryWidget.test.tsx` |
| **Gravitational Tides** | `lunar.ts`, `projection.ts` | `useTideMath.ts` | `MicroTideView.tsx`, `MiniGlobe.tsx` | `npx vitest run TidesWidget.test.tsx` |
| **Observatory Layout & Controls** | `useDashboardLayout.ts` | `useChronometerStore`, `useHoverStore` | `DashboardWindow.tsx`, `ObsNavbar.tsx`, `OrbitalChronometer.tsx`, `ControlRing.tsx`, `LatitudeSlider.tsx` | `npx vitest run controls.test.tsx DashboardWindow.test.tsx layout.test.tsx` |
