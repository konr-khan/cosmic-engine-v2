# Project: Unified 3D Astronomical Scene Graph & Canonical Camera Rigs (Phase 1)

## Architecture
A unified, hierarchical 3D astronomical scene graph engine establishing a single geometric source of truth across Macro Orbit, Eclipse Demonstrator, and Gyro-Morph Armillary.

```
                  ┌──────────────────────────────────────────────┐
                  │          Meeus Ephemeris Core                │
                  │   (Solar / Lunar / Planetary Algorithms)     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │         generateCosmicScene(params)          │
                  │   • Heliocentric Ecliptic Frame (J2000)      │
                  │   • Geocentric Ecliptic Frame                │
                  │   • Geocentric Equatorial & Inertial Tilt    │
                  │   • Terrestrial Topocentric Frame            │
                  │   • Scale Modes: 'true' (e=0.0167) vs        │
                  │                  'exaggerated' (e=0.25)      │
                  │   • 6 Seasonal Milestones & Lunar Orbit 5.14°│
                  │   • Umbra / Penumbra Syzygy Shadow Cones     │
                  └──────────────────────┬───────────────────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
        ┌─────────────────────┐┌───────────────────┐┌───────────────────┐
        │projectHeliocentric  ││projectGeocentric  ││projectGeocentric  │
        │      TopDown        ││    Transverse     ││      Axial        │
        │(Top-down Helioc.)   ││(Side-on Syzygy)   ││(Sightline Miss)   │
        └──────────┬──────────┘└─────────┬─────────┘└─────────┬─────────┘
                   │                     │                    │
                   ▼                     ▼                    ▼
        ┌──────────────────────────────────────────────────────────────┐
        │             Reactive Scene Hook: useCosmicScene()            │
        │   • useHeliocentricScene()                                   │
        │   • useEclipseScene()                                        │
        │   • useArmillaryScene()                                      │
        └──────────────────────────────┬───────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│Macro Orbit    │              │Eclipse        │              │Gyro-Morph     │
│Widget         │              │Demonstrator   │              │Armillary      │
│• OrbitSvg     │              │• LiveSyzygy   │              │• Armillary-   │
│• MiniGlobe    │              │• NodalPlane   │              │  BeadsLayer   │
│• Physics HUD  │              │• ShadowRays   │              │• MiniGlobe    │
└───────────────┘              └───────────────┘              └───────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | `CosmicScene3D` Types & Interfaces | Comprehensive type definitions for 3D bodies, orbits, frames, shadow cones, and projected 2D elements | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Coordinate Frame Transforms | Vector math & matrix transforms: Heliocentric $\leftrightarrow$ Geocentric $\leftrightarrow$ Equatorial $\leftrightarrow$ Topocentric | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Scene Graph Generator | `generateCosmicScene(params)` with True Scale ($e=0.0167$) & Exaggerated ($e=0.25$) Keplerian orbits, 6 milestones, and $5.14^\circ$ lunar orbit | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Canonical Camera Rigs | `projectHeliocentricTopDown`, `projectGeocentricTransverse`, `projectGeocentricAxial`, and `projectEulerCamera` | M1 | ORIGINAL_REQUEST §R1 |
| F5 | Scene Graph Math Tests | Unit tests in `src/utils/cosmicMath/scene/scene.test.ts` verifying coordinates, scale modes, shadow cones, and cameras | M1 | ORIGINAL_REQUEST §R1 |
| F6 | `<MiniGlobe />` Component | Reusable SVG Earth mini-globe with $23.439^\circ$ inertial axial tilt, subsolar day/night terminator clipping, and equator/tropics | M2 | ORIGINAL_REQUEST §R2 |
| F7 | MiniGlobe Component Tests | Comprehensive unit tests in `src/components/common/MiniGlobe.test.tsx` verifying view modes, illumination, and accessibility | M2 | ORIGINAL_REQUEST §R2 |
| F8 | Reactive Scene Hook `useCosmicScene` | Memoized 60 FPS scene calculations and sub-hooks (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`) | M3 | ORIGINAL_REQUEST §R3 |
| F9 | Macro Orbit Refactor | Migrate `MacroOrbitView` & `OrbitSvgCanvas` to `useHeliocentricScene()` and render `<MiniGlobe />` | M3 | ORIGINAL_REQUEST §R3 |
| F10 | Eclipse Demonstrator Refactor | Migrate `EclipseDemonstrator`, `LiveSyzygyView`, `NodalPlaneVisualizer` to `useEclipseScene()` | M3 | ORIGINAL_REQUEST §R3 |
| F11 | Reactive Scene Hook Tests | Unit tests in `src/hooks/useCosmicScene.test.ts` verifying memoization, subscriptions, and sub-hooks | M3 | ORIGINAL_REQUEST §R3 |
| F12 | Armillary MiniGlobe Integration | Replace static central Earth bead in `ArmillaryBeadsLayer.tsx` with `<MiniGlobe />` | M4 | ORIGINAL_REQUEST §R4 |
| F13 | Architecture Decision Record ADR-0004 | Document `docs/adr/0004-hierarchical-3d-scene-graph-and-camera-rigs.md` | M4 | ORIGINAL_REQUEST §R4 |
| F14 | Technical Documentation Sync | Update `docs/MATH_SPEC.md`, `docs/DESIGN_SYSTEM.md`, and `AGENTS.md` | M4 | ORIGINAL_REQUEST §R4 |
| F15 | Full Test Suite & Build Verification | Full regression run (223+ existing tests + new tests), TypeScript check, and production build | Final | ORIGINAL_REQUEST §Acceptance Criteria |
| F16 | Directional Derivative Invariants | Property-based physical $\Delta t$ derivative tests in `cameras.stress.test.ts` (Rig 6 suite) | M10 | ADR-0008 |
| F17 | Sky View Simulator Prograde Kinematics | Signed $\Delta\lambda$ transit coordinates in `SkyViewSimulator.tsx`, eliminating bouncing moon bug | M10 | ADR-0008 |
| F18 | Ground-Truth Prograde Kinematics | Ground-truth CCW heliocentric and geocentric orbits, 2D Kepler focus vector, single source of truth milestones | M11 | ADR-0009 |
| F19 | Deadwood Purge & Armillary Harmonization | Purged legacy toy orbital positions, rendered Armillary lunar nodes, aligned `orbit_path` ring, deduplicated types | M12 | REFACTOR_PLAN |
| F20 | Domain Invariants & Physics Conservation Laws | SSoT constants, falsy-0 chirality guards, positive modulo wrapping, degeneracy clamping, independent physics conservation harness | M13 | ADR-0010 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Pure 3D Scene Graph & Coordinate Transforms | `src/utils/cosmicMath/scene/` (`types.ts`, `transforms.ts`, `cameras.ts`, `generator.ts`, `index.ts`, `scene.test.ts`) | none | DONE |
| M2 | Reusable High-Precision `<MiniGlobe />` SVG Component | `src/components/common/MiniGlobe.tsx`, `src/components/common/MiniGlobe.test.tsx` | M1 | DONE |
| M3 | Reactive Scene Hook & Widget Refactoring | `src/hooks/useCosmicScene.ts`, `src/hooks/useCosmicScene.test.ts`, `MacroOrbitView.tsx`, `OrbitSvgCanvas.tsx`, `EclipseDemonstrator.tsx`, `LiveSyzygyView.tsx`, `NodalPlaneVisualizer.tsx` | M1, M2 | DONE |
| M4 | Armillary Groundwork, Architecture Record & Documentation | `ArmillaryBeadsLayer.tsx`, `docs/adr/0004-hierarchical-3d-scene-graph-and-camera-rigs.md`, `docs/MATH_SPEC.md`, `docs/DESIGN_SYSTEM.md`, `AGENTS.md` | M1, M2, M3 | DONE |
| M5 | MiniGlobe Ecosystem & Tidal Nodal Loops | `ArmillaryEarthPip.tsx`, `MicroTideView.tsx` (Nodal mode), ADR-0005, AST unit safety | M1, M2, M3, M4 | DONE |
| M6 | Sub-Renderer Decomposition & Math Extraction | `MiniGlobeFlat.tsx`, `MiniGlobeSphere.tsx`, `globe.ts`, `generatorGeometry.ts`, `generatorBeads.ts`, `astroConstants.ts` | M1-M5 | DONE |
| M7 | Armillary Hot-Loop Performance & Latency Benchmark | Pre-computed Euler rotators, single-pass SVG streaming, `armillaryBenchmark.test.ts` (< 0.8ms), ADR-0006 | M6 | DONE |
| M8 | Controls & Layout Test Harness | `controls.test.tsx` (19 tests), `DashboardWindow.test.tsx` (16 tests), header drag gating | M7 | DONE |
| M9 | Complete Documentation Review & Alignment | Reconcile `AGENTS.md`, `README.md`, `MATH_SPEC.md` Section 11, `DESIGN_SYSTEM.md`, `DEAD_ENDS.md` | M1-M8 | DONE |
| M10 | Canonical Camera Rig Alignment & Sky View Prograde Kinematics | `cameras.ts`, `useCosmicScene.ts`, `SkyViewSimulator.tsx`, `cameras.stress.test.ts`, ADR-0008, 387 tests | M1-M9 | DONE |
| M11 | Ground-Truth Heliocentric & Geocentric Prograde Kinematics | `scene/generator.ts`, `milestones.ts`, `cameras.stress.test.ts`, ADR-0009, 389 tests | M1-M10 | DONE |
| M12 | Post-Kinematics Deadwood Purge & Prograde Model Harmonization | `useCosmicEngine.ts`, `generatorBeads.ts`, `ArmillaryBeadsLayer.tsx`, `generator.ts`, type deduplication, 393 tests | M1-M11 | DONE |
| M13 | Domain Invariant & Physics Conservation Hardening | `astroConstants.ts`, `domainInvariants.test.ts`, ADR-0010, 412 tests across 21 suites | M1-M12 | DONE |

## Interface Contracts

### `src/utils/cosmicMath/scene/types.ts`
```typescript
export type ScaleMode = 'true' | 'exaggerated';

export interface SceneBody3D {
  position: Vector3D; // AU or astronomical units in current scale
  radius: number;
  velocity?: Vector3D;
  orbitalElements?: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: Radians;
    longitudeOfAscendingNode: Radians;
    argumentOfPeriapsis: Radians;
    trueAnomaly: Radians;
  };
}

export interface ShadowCones3D {
  umbraApex: Vector3D;
  umbraAngle: Radians;
  penumbraApex: Vector3D;
  penumbraAngle: Radians;
  axisDirection: Vector3D;
  moonCenter: Vector3D;
  earthCenter: Vector3D;
}

export interface CosmicScene3D {
  timestamp: Date;
  scaleMode: ScaleMode;
  sun: SceneBody3D;
  earth: SceneBody3D & {
    obliquity: Radians;
    subsolarPoint: Vector3D; // Normalized direction to Sun in Earth body frame
    axialTiltVector: Vector3D; // Inertial north pole vector
  };
  moon: SceneBody3D & {
    eclipticLatitude: Degrees;
    eclipticLongitude: Degrees;
    ascendingNodeLongitude: Degrees;
    descendingNodeLongitude: Degrees;
    quadrant: 1 | 2 | 3 | 4;
  };
  milestones: Array<{
    id: string;
    label: string;
    position: Vector3D;
    longitude: Degrees;
    date: string;
  }>;
  shadowCones: ShadowCones3D;
}

export interface ProjectedScene2D {
  camera: {
    name: 'topdown' | 'transverse' | 'axial' | 'euler3d' | 'custom';
    viewport: { width: number; height: number; scale: number; centerX: number; centerY: number };
  };
  elements: {
    sun: { x: number; y: number; r: number; visible: boolean; depth: number };
    earth: { x: number; y: number; r: number; visible: boolean; depth: number; axialTiltAngle2D: number };
    moon: { x: number; y: number; r: number; visible: boolean; depth: number };
    orbitPath: string; // SVG path d-string
    lunarOrbitPath?: string;
    lunarOrbitSegments?: Array<{ path: string; stroke: string; strokeDasharray?: string; isFront: boolean }>;
    shadowCones?: {
      umbraPath: string;
      penumbraPath: string;
      axisLine: { x1: number; y1: number; x2: number; y2: number };
    };
    milestones: Array<{ id: string; label: string; x: number; y: number; visible: boolean }>;
  };
}
```

### `<MiniGlobe />` Props Contract (`src/components/common/MiniGlobe.tsx`)
```typescript
export type MiniGlobeViewMode = 'topdown' | 'transverse' | 'axial' | 'euler3d' | 'flat';

export interface MiniGlobeProps {
  cx: number;
  cy: number;
  radius?: number; // default 14
  viewMode: MiniGlobeViewMode;
  obliquity?: Degrees; // default 23.439281
  sunAngle?: Radians; // Angle of incoming sunlight in 2D projection
  subsolarVector?: Vector3D; // 3D subsolar vector for spherical illumination
  pitch?: Degrees; // Camera pitch for euler3d mode
  yaw?: Degrees; // Camera yaw for euler3d mode
  observerLat?: Latitude;
  observerLon?: Longitude;
  showObserverPin?: boolean;
  showParallels?: boolean;
  showPolarAxis?: boolean;
  className?: string;
  onClick?: () => void;
}
```

### `useCosmicScene` Hook Contracts (`src/hooks/useCosmicScene.ts`)
```typescript
export interface UseCosmicSceneOptions {
  date?: Date;
  timeOfDay?: number;
  latitude?: number;
  longitude?: number;
  scaleMode?: ScaleMode;
}

export function useCosmicScene(options?: UseCosmicSceneOptions): {
  julianDate: JulianDate;
  scene3D: CosmicScene3D;
  scaleMode: ScaleMode;
  ephemeris: EphemerisFrame;
  projectTopDown: () => ProjectedScene2D;
  projectTransverse: () => ProjectedScene2D;
  projectAxial: () => ProjectedScene2D;
  projectEuler: (pitch: Degrees, yaw: Degrees, roll?: Degrees) => ProjectedScene2D;
};

export function useHeliocentricScene(options?: UseHeliocentricOptions): HeliocentricSceneData;
export function useEclipseScene(options?: UseEclipseOptions): EclipseSceneData;
export function useArmillaryScene(options?: UseArmillaryOptions): ArmillarySceneData;
```

## Code Layout
- `src/utils/cosmicMath/scene/`
  - `types.ts` — 3D scene interfaces, coordinate frames, camera parameters
  - `transforms.ts` — Pure matrix & Euler rotation transformations
  - `cameras.ts` — Canonical camera projection pipelines (TopDown, Transverse, Axial, Euler)
  - `generator.ts` — `generateCosmicScene(params)` implementation
  - `index.ts` — Barrel export for scene module
  - `scene.test.ts` — Unit tests for scene generation & camera projections
- `src/components/common/`
  - `MiniGlobe.tsx` — Reusable SVG Earth mini-globe component
  - `MiniGlobe.test.tsx` — Unit tests for MiniGlobe
- `src/hooks/`
  - `useCosmicScene.ts` — Reactive scene hook & specialized sub-hooks
  - `useCosmicScene.test.ts` — Unit tests for reactive scene hook
- `src/components/widgets/macro/`
  - `MacroOrbitView.tsx` — Heliocentric Macro Orbit container
  - `OrbitSvgCanvas.tsx` — SVG heliocentric viewport consuming `useHeliocentricScene`
- `src/components/widgets/eclipse/`
  - `EclipseDemonstrator.tsx` — Eclipse Demonstrator container
  - `LiveSyzygyView.tsx` — Side-by-side syzygy visualizer consuming `useEclipseScene`
  - `NodalPlaneVisualizer.tsx` — 5.14° nodal plane visualizer
- `src/components/widgets/armillary/`
  - `canvas/ArmillaryBeadsLayer.tsx` — Armillary beads layer rendering `<MiniGlobe />`
- `docs/`
  - `adr/0004-hierarchical-3d-scene-graph-and-camera-rigs.md` — ADR for scene graph architecture
  - `MATH_SPEC.md` — Section 10 mathematical specification sync
  - `DESIGN_SYSTEM.md` — MiniGlobe design tokens sync
  - `AGENTS.md` — Agent architecture map sync
