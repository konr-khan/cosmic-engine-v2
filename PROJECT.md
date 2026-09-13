# Project: Cosmic Engine V2.0 — Architecture Roadmap, Feature Inventory & Milestone Matrix

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
| F15 | Full Test Suite & Build Verification | Full regression run (648 tests across 43 suites), TypeScript check, and production build | Final | ORIGINAL_REQUEST §Acceptance Criteria |
| F16 | Directional Derivative Invariants | Property-based physical $\Delta t$ derivative tests in `cameras.stress.test.ts` (Rig 6 suite) | M10 | ADR-0008 |
| F17 | Sky View Simulator Prograde Kinematics | Signed $\Delta\lambda$ transit coordinates in `SkyViewSimulator.tsx`, eliminating bouncing moon bug | M10 | ADR-0008 |
| F18 | Ground-Truth Prograde Kinematics | Ground-truth CCW heliocentric and geocentric orbits, 2D Kepler focus vector, single source of truth milestones | M11 | ADR-0009 |
| F19 | Deadwood Purge & Armillary Harmonization | Purged legacy toy orbital positions, rendered Armillary lunar nodes, aligned `orbit_path` ring, deduplicated types | M12 | REFACTOR_PLAN |
| F20 | Domain Invariants & Physics Conservation Laws | SSoT constants, falsy-0 chirality guards, positive modulo wrapping, degeneracy clamping, independent physics conservation harness | M13 | ADR-0010 |
| F21 | Axial Sightline Anti-Solar Rectification | Reoriented camera projection frame ($z_{\text{body}} = -\cos\phi\cos H$) to perpetual night hemisphere and un-mirrored prograde West-to-East rotating continents ($x_{\text{body}} = -\cos\phi\sin H$) | M14 | ADR-0011 |
| F22 | Lunar Orbit Line-of-Sight Depth Sorting | Depth-split transverse ($Z = \sin t \cdot R_x$) and axial ($Z = -\cos t \cdot R_x$) orbits; unmasked viewer-side ($Z > 0$) waxing paths at 0.9 vibrancy; far-side ($Z \le 0$) ghosted 0.22 X-ray chords; occluded moon outline preservation | M14 | ADR-0012 |
| F23 | Dynamic Widget Code-Splitting & Lazy Loading | Dynamic `React.lazy()` imports wrapped in dark glassmorphic `<Suspense>` skeletons across all 8 observatory windows, reducing initial bundle by 50.4% (from 526.91 kB to 261.29 kB) | M14 | ADR-0013 |
| F24 | Shared `<SkyDomeBase />` Primitive & `useRibbonScrubber` | Shared 260x138 SVG elevation dome primitive and unified bidirectional timeline scrubbing hook supporting 365-day annual and synodic sub-window coordinate scaling | M14 | ADR-0013 |
| F25 | Symmetrical Sky Dome ViewBox & Twilight Strata | Symmetrical `viewBox="0 0 260 138"` parity (`CX=130, CY=104, R=92`), cross-widget atmospheric twilight strata palette (`#f59e0b`, `#64748b`, `#334155`), non-dashed nocturnal trajectories, serene lunar silver in Std mode, and 24h crossing gate (`nearestNodeDistDays <= 1.0`) | M14 | ADR-0014 |
| F26 | Centered $\pm 15$-Day Draconic Progress Micro-Rail | Centered lookback/lookahead Draconic rail anchored at Today ($T=0, X=120$), dynamic approaching node beacon pin, and 4-quadrant orbital loop color encoding | M14 | ADR-0014 |
| F27 | True Ecliptic Lunar Node Crossing Kinematics | Astronomical ground truth based on true ecliptic latitude crossing ($\beta = 0^\circ$) replacing mean argument $F$, and high-precision Newton-Raphson root solver (`findTrueLunarNodeCrossing`) | M15 | ADR-0015 |
| F28 | Cross-Widget True Node Synchronization | Unified chronological node event scheduler (`calculateTrueLunarNodeEvents`) synchronizing Today Sky, Tides Widget, and Eclipse Demonstrator | M15 | ADR-0015 |
| F29 | Dynamic Sighting-Aware Horizon Dome & Tropical Culmination | Analytical culmination bearing solver (`calculateCulminationBearing`) resolving tropical culmination inversions ($\delta > \phi$ vs $\delta < \phi$) and lunar standstills ($\pm 28.58^\circ$), tri-state meridian indicators (`S`, `N`, `Z`), signed peak altitudes (`87.9° N`, `45.3° S`), and observer perspective micro-banners | M16 | ADR-0016 |
| F30 | 16-Point Compass Rise/Set Azimuth Octants & Uncluttering | Exact rising/setting azimuth calculation (`calculateRiseSetAzimuth`) mapped to 16-point compass octants (`ENE`, `WNW`), and canvas uncluttering suppressing floating curve labels | M16 | ADR-0016 |
| F31 | Quad-View Celestial Meridian Matrix | Segmented control `[ 2-Dome Diurnal | ⊞ 4-Dome Quad ]` in `TodayHorizonView.tsx` expanding into a coordinated $2 \times 2$ observatory matrix (`SunElevationDome` + `SunMeridianDome`, `MoonElevationDome` + `MoonMeridianDome`) | M17 | ADR-0017 |
| F32 | 3D Diurnal Colure Direction Cosines & Today's Diurnal Chord | 3D topocentric direction cosine projection (`calculateMeridianDiurnalPoint`) with invariant slope $\cot\phi$, and Today's Diurnal Chord (`calculateMeridianDiurnalChord`) touching dome tangentially at culmination | M17 | ADR-0017 |
| F33 | Approach C Parked Ghost Anchors | Static observation gate anchors ($-18^\circ$ twilight gate for Sun, $0^\circ$ horizon gate for Moon) parking sub-horizon celestial bodies as ghost beads, eliminating deep-night reverse sliding | M17 | ADR-0017 |
| F34 | Central Ribbon Architecture & Hoisted Unified Mode Toggles | Single hoisted toggle controls (`[Std | Twilight]` and `[Std | ☊ Nodes]`) controlling upper and lower domes in lockstep, 4-column summary metric panel (`grid-cols-4`), and flush lower cards | M17 | ADR-0017 |
| F35 | Dedicated External Atomic `hoverStore` | React 19 `useSyncExternalStore` micro-store isolating high-frequency scrubber state (`hoveredDate`, `hoveredTime`, `hoverPosition`), eliminating 60 FPS re-render cascades | M18 | ADR-0018 |
| F36 | Ephemeris Worker Throttling & Monotonic Sequence Stamping | 100ms (~10 Hz) throttle interval on ephemeris worker dispatcher and monotonic integer request sequence stamping (`requestId` / `latestCompletedRequestId`) preventing stale frame overwrites | M18 | ADR-0018 |
| F37 | Ephemeris Mathematical Consolidation & Sidereal Hoisting | Hoisted `calculateGMST` and `calculateLST` to `core.ts`, SSoT `calculateSolarPosition`, and centralized astronomical constants in `astroConstants.ts` | M18 | ADR-0018 |
| F38 | Modular Decomposition of `todaySky.ts` | Decomposed 1,061-line monolith into focused submodules under `src/utils/cosmicMath/today/` (`elevation.ts`, `meridian.ts`, `draconic.ts`) with lightweight facade re-export | M18 | ADR-0018 |
| F39 | Reusable `<MeridianDomeBase />` Component Primitive | Extracted shared SVG canvas (`viewBox="0 0 260 138"`), S-Z-N horizon baseline, vertical Zenith axis, Solstice/Standstill swaths, radial ticks, tangent diurnal chords, and parked gate anchors, eliminating 450+ lines of duplicate markup | M18 | ADR-0018 |
| F40 | Production Build Hardening & Expanded Test Harness | Hardened production build script (`tsc --noEmit && vite build`), eliminated bundle leakage via widget barrel deletion, and expanded test harness to 40 suites / 559 tests | M18 | ADR-0018 |
| F41 | Singularity-Free Polar Diurnal Chords & Azimuth Suppression | Direction cosine elevation sine bounds ($\sin(h_{\min}), \sin(h_{\max})$), exact horizontal colure chords ($Y = cy \mp r\sin\delta$) at $\phi = \pm 90^\circ$, and degenerate azimuth suppression (`riseAzimuth: null`) | M19 | ADR-0019 |
| F42 | Physical Apparent Radius Ratio Eclipse Totality Criterion | Replaced scalar distance threshold with astronomical apparent angular radius ratio ($k = s_{\text{moon}} / s_{\text{sun}} \ge 1.0$) governing Total vs Annular solar eclipses, strictly vertical equatorial colure chords ($\Delta X = 0$), and 400-year century leap rules | M19 | ADR-0019 |
| F43 | Living Marble Great Meridian Ring & Bifurcation Removal | Authentic diurnally rotating $0^\circ$ Prime Meridian (Greenwich) and $180^\circ$ Antimeridian curves in `MiniGlobe.tsx`, visible through the marble at all times matching the equator convention, and suppression of static polar axis in `euler3d` mode | M20 | ADR-0020 |
| F44 | Dynamic 3D Orbiting Earth Bead & Telephoto Inset Camera Alignment | Replaced flat 2D sticker in Gyro-Morph Orbit view with dynamic 3D Euler rendering (`euler3d`) and physical Sun-to-Earth camera-vector terminator shading, aligning Terra Living Marble PIP inset lighting with main viewport | M20 | ADR-0020 |
| F45 | Heliocentric Multi-Scale Orbit Zoom Controls | Interactive wheel zoom and floating controls ($0.75\times$ to $3.5\times$) in Gyro-Morph Orbit view with automatic 2D plate reset, dynamic `viewBox` scaling ($0.5\times$ to $3.5\times$) and continent rendering in Solar System Macro Orbit | M20 | ADR-0020 |
| F46 | Solstice Arc Bifurcation & Milestone Directional Migration Vector | Bifurcated solid solstice corridor into dual dashed milestone arcs (`#fbbf24` June Solstice vs `#d97706` December Solstice), anchored to Today's Noon Culmination Peak ($R=92$); dynamic $d\delta/dt \propto \cos\lambda_\odot$ solar migration vector weights approaching milestone at full vibrancy (`0.85`) and receding at subdued tone (`0.40`) | M21 | ADR-0021 |
| F47 | Sub-Horizon Solstice Depiction & Compact Meridian Telemetry | In Twilight Mode, solstice arcs and culmination ticks extend below horizon ($0^\circ > h \ge -18^\circ$) into Civil, Nautical, or Astronomical twilight strata with signed altitude and tier badges; below $-18^\circ$, ticks disappear completely and arcs terminate cleanly; `hideElevationBanner` suppresses duplicate middle banners on lower profile cards | M21 | ADR-0021 |
| F48 | Polar Directional Singularity Rectification & Longitudinal Horizon Reference Geometry | At polar latitudes ($|\phi| \ge 89.9^\circ$), replaces misleading mid-latitude labels (`N`, `E`, `W`, `Noon Peak`) with astronomically authentic longitudinal colures (`S (0°) — Z (+90°) — S (180°)` at North Pole, `N (0°) — Z (-90°) — N (180°)` at South Pole; `90°E — 0° (Grw) — 90°W` on elevation domes), constant altitude peak telemetry, and polar sighting banners | M22 | ADR-0022 |
| F49 | Deadwood Purge & Domain Invariants Hardening | Purged unreferenced legacy type files, deleted dead test mocks, unified AST unit-safety enforcement across all 80 UI files, and expanded empirical physics conservation tests | M23 | ADR-0023 |
| F50 | Principles & Design System Alignment Pass | Reconciled codebase against `docs/DESIGN_SYSTEM.md` and `docs/MATH_SPEC.md`: subsolar/sublunar ground track longitude $\lambda_{\text{geo}} = \operatorname{wrap180}(\alpha - \text{GMST})$, 3D scene involution matrix $\mathbf{M}_{\text{scene}\leftrightarrow\text{arm}}$, unified $520\times 220$ dual-pane eclipse canvas parity, axial sightline negative cosine depth convention, warm gold glowing diurnal chords (`#f59e0b`), Armillary milestone tokens ($r=4.5\to 7\text{px}$), and complete 3-tier twilight strata | M23 | ADR-0023 |
| F51 | Sky & Moon Dome Container/Presenter Hooks & Shared UI Primitives | Extracted calculation cascades into `useMoonElevationMath` & `useSunElevationMath`; unified shared presentation primitives (`SkyDomeFooter`, `DraconicTimelineRail`, `LunarPhaseDisc`), cutting dome monoliths by 40–62% with zero visual divergence | M25 | ADR-0025 |
| F52 | Ephemeris Worker Fallback Hardening & Parameter Boundary Gatekeepers | Defensive parameter clamping gatekeepers (`workerSanitizers.ts`), failsafe callback delivery invariant in `EphemerisWorkerManager`, and synchronous fallback exception isolation across hooks | M26 | ADR-0026 |
| F53 | 24-Hour Diurnal Ground Tracks & Antimeridian Seam Interpolation | 24-hour diurnal subsolar & sublunar ground tracks on Terminator Map (`terminatorTracks.ts`, `TerminatorMap.tsx`), independent top-rail toggles (`[☀️ Sun]`, `[🌙 Moon]`), boundary-safe antimeridian seam wrapping (`buildSeamSafeSvgPath`), active ecliptic nodal beacons ($\Omega / \mho$), forward-weighted temporal dash conventions, and proximity-gated hover HUD telemetry | M27 | ADR-0027 |

## Milestones

### Completed Foundation Milestones (M1–M20)
| Milestones | Focus Areas | Key Deliverables & ADRs |
| :--- | :--- | :--- |
| **M1–M5** | 3D Scene Graph, MiniGlobe & Cameras | Unified scene graph, `<MiniGlobe />`, reactive scene hooks, ADR-0001–0005 |
| **M6–M10** | Performance, Benchmark & Canonical Rigs | < 0.8ms hot loop, controls harness, canonical camera alignments, ADR-0006–0008 |
| **M11–M15** | Ground Truth Kinematics & Nodal Crossing | Prograde orbits, physics invariants, depth sorting, code-splitting, true node solver, ADR-0009–0015 |
| **M16–M20** | Horizon Dome, Meridian Matrix & Zoom | Culmination solver, quad-view meridian, atomic hover store, polar chords, living marble, ADR-0016–0020 |

### Recent Milestones (M21–M28)
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M21 | Meridian Profile Solstice Bifurcation & Sub-Horizon Twilight | `SunMeridianDome.tsx`, `MeridianDomeBase.tsx`, `meridian.ts`, ADR-0021 | M1–M20 | DONE |
| M22 | Polar Directional Singularity Rectification & Horizon Geometry | `elevation.ts`, `SkyDomeBase.tsx`, `MeridianDomeBase.tsx`, ADR-0022 | M1–M21 | DONE |
| M23 | Principles & Design Alignment, Invariant Hardening | Pure domain math & invariants, dual-pane eclipse 520x220, ADR-0023 | M1–M22 | DONE |
| M24 | Concurrency Hardening, Domain Math Purity & Component Tests | Ephemeris memoization, date cache invalidation, expanded tests, ADR-0024 | M1–M23 | DONE |
| M25 | Sky & Moon Dome Container/Presenter Hooks & Primitives | `useMoonElevationMath.ts`, `SkyDomeFooter.tsx`, ADR-0025 | M1–M24 | DONE |
| M26 | Web Worker Fallback Hardening & Parameter Gatekeepers | `workerSanitizers.ts`, `ephemerisWorkerManager.ts`, ADR-0026 | M1–M25 | DONE |
| M27 | Terminator Map Diurnal Ground Tracks & Seam Interpolation | `terminatorTracks.ts`, `TerminatorMap.tsx`, ADR-0027 | M1–M26 | DONE |
| M28 | Gyro-Morph Mathematical Hardening & Modular Ring Subsystem | `src/utils/cosmicMath/armillary/`, ADR-0028 | M1–M27 | DONE |

## Interface Contracts & Domain Models

All canonical mathematical models, branded nominal units, 3D scene-graph structures, and worker RPC protocols are maintained as single sources of truth in their respective compiler-checked TypeScript modules:

- **3D Astronomical Scene Graph & Camera Pipelines**: [`src/utils/cosmicMath/scene/types.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/utils/cosmicMath/scene/types.ts) (`CosmicScene3D`, `SceneBody3D`, `ShadowCones3D`, `ProjectedScene2D`, `ScaleMode`)
- **Branded Nominal Units & Coordinates**: [`src/types/units.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/types/units.ts) (`Degrees`, `Radians`, `JulianDate`, `JulianCenturies`, `Latitude`, `Longitude`) and [`src/types/coordinates.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/types/coordinates.ts) (`Vector2D`, `Vector3D`, `AltAzimuthCoordinates`, `EquatorialCoordinates`)
- **Astronomical Data Models**: [`src/types/astronomy.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/types/astronomy.ts) (`EphemerisFrame`, `SolarPositionFull`, `LunarPositionFull`, `EclipseData`)
- **Web Worker Concurrency Contracts**: [`src/types/worker.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/types/worker.ts) (`EphemerisWorkerRequest`, `EphemerisWorkerResponse`, monotonic sequence stamps)
- **Observatory Store State & Window Layout**: [`src/types/store.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/types/store.ts) (`CosmicStoreState`, `DashboardLayoutState`, `WindowPositionState`)
- **Shared Component Primitives**:
  - MiniGlobe: [`src/components/common/MiniGlobe.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/common/MiniGlobe.tsx) (`MiniGlobeProps`, `MiniGlobeViewMode`)
  - Sky Dome Base: [`src/components/widgets/today/SkyDomeBase.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SkyDomeBase.tsx) (`SkyDomeBaseProps`)
  - Meridian Dome Base: [`src/components/widgets/today/MeridianDomeBase.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/MeridianDomeBase.tsx) (`MeridianDomeBaseProps`)

## Code Layout
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
      - `constants.ts` — Orbital radii, twilight thresholds & theme tokens
      - `core.ts` — Julian dates, UTC invariance, spherical linear interpolation (`slerp3D`), GMST & LST
      - `solar.ts` — Solar declination, EoT, twilight algorithms & annual solar matrix
      - `lunar.ts` — Lunar ephemeris, phase angle, disc illumination, Newton-Raphson crossing solver
      - `eclipse.ts` — Syzygy shadow geometry & eclipse recurrence scanner
      - `today/` — Decomposed Topocentric Horizon & Meridian submodules
        - `elevation.ts` — Prime vertical dome projection, diurnal paths & rise/set azimuth octants
        - `meridian.ts` — S-Z-N meridian profiles, Solstice/Standstill swaths & diurnal chords
        - `draconic.ts` — True lunar node crossings, 18.6y standstills & micro-rail
      - `todaySky.ts` — Backward-compatible facade re-exporting elevation, meridian & draconic submodules
      - `globe.ts` — Spherical continent projection & analytical limb horizon clipping
      - `projection.ts` — Earth axial tilt 3D projection, observer pin & 4-quadrant orbital stroke segments
      - `geoData.ts` — World landmass continent outline polygons
      - `milestones.ts` — Canonical Earth orbital milestones (single source of truth)
      - `frame.ts` — Centralized EphemerisFrame snapshot generator
      - `terminatorTracks.ts` — Diurnal celestial ground tracks & antimeridian seam interpolation (ADR-0027)
      - `scene/` — Unified 3D Astronomical Scene Graph & Camera Rigs (`types.ts`, `transforms.ts`, `generator.ts`, `cameras.ts`)
      - `armillary/` — Decomposed Gyro-Morph Armillary & Astrolabe math module (5-model continuum, stereographic conformal, Rojas orthographic, almucantars, focal beacon, alidade, `generatorRings.ts`, `generatorBeads.ts`, `generatorGeometry.ts`)
      - `domainInvariants.test.ts` — Empirical domain invariants & physics conservation laws
  - `constants/`
    - `dashboardPresets.ts` — Observatory dashboard window layouts & configuration presets
  - `store/`
    - `cosmicStore.ts` — External state store & animation frame ticker
    - `hoverStore.ts` — Atomic external store for 60 FPS ribbon scrubber isolation
  - `workers/`
    - `ephemerisWorker.ts` — Dedicated worker thread for Meeus ephemeris & 365-day matrices
    - `ephemerisWorkerManager.ts` — Application singleton worker manager, deduplication & matrix cache
    - `workerSanitizers.ts` — Parameter boundary clamping & defensive input gatekeepers
    - `workerSanitizers.test.ts` — Boundary validation & pathological input test suite
  - `hooks/`
    - `useCosmicEngine.ts` — Selective domain engine hook
    - `useCosmicScene.ts` — Reactive 3D scene hook & specialized projection selectors
    - `useEphemerisWorker.ts` — Worker dispatch hook with 100ms throttling & sequence stamping
    - `useDashboardLayout.ts` — Window layout state, drag-and-drop, resize, locking, presets & storage
  - `components/`
    - `widgets/` — Lazy-loaded observatory visualizers (`React.lazy()`)
      - `common/useRibbonScrubber.ts` — Bidirectional timeline coordinate & pointer dragging hook
      - `today/` — Today's Sky Horizon subsystem (`SkyDomeBase`, `MeridianDomeBase`, `SunElevationDome`, `SunMeridianDome`, `MoonElevationDome`, `MoonMeridianDome`, `TodayHorizonView`, `todayTokens.ts`)
        - `hooks/` — Mathematical derivation hooks (`useMoonElevationMath.ts`, `useSunElevationMath.ts`)
        - `common/` — Shared today visual primitives (`SkyDomeFooter.tsx`, `DraconicTimelineRail.tsx`, `LunarPhaseDisc.tsx`)
      - `armillary/` — Gyro-Morph Armillary & Astrolabe (`GyroArmillaryView`, `ArmillarySvgCanvas`, `useStagedCamera`, modular canvas layers)
      - `solar/` — Solar Almanac subsystem (`SolarAlmanacCard`, `SolarRibbonChart`, `PolarSunlightDial`)
      - `lunar/` — Lunar Almanac subsystem (`LunarAlmanacCard`, `LunarRibbonChart`, `TidalWaveOscillator`, `ribbon/`)
      - `eclipse/` — Eclipse Demonstrator subsystem (`EclipseDemonstrator`, `LiveSyzygyView`, `NodalPlaneVisualizer`, `SkyViewSimulator`, `EclipseScanner`, `ShadowRayHoverHud.tsx`)
      - `terminator/` — Daylight Terminator Map (`TerminatorMap`, `TerminatorHoverHud.tsx`)
      - `macro/` — Heliocentric Macro Orbit (`MacroOrbitView`, `OrbitSvgCanvas`, `OrbitPhysicsHud.tsx`)
      - `tides/` — Earth Gravitational Tidal Force (`MicroTideView`)
    - `controls/` — Astrolabe controls (`ControlRing`, `LatitudeSlider`, `PolarLongitudeSelector`, `BufferedInput`, `ArmillaryRail`)
    - `layout/` — Layout & window management (`DashboardWindow`, `ObsNavbar`, `OrbitalChronometer`, `chronometer/`, `AstrolabeDial.test.tsx`, `SolsticeJumpControls.test.tsx`)
    - `common/` — Shared primitives (`MiniGlobe`, `miniglobe/`, `WindowErrorBoundary`, `PhaseVisual`)
- `DEAD_ENDS.md` — Critical log of failed historical approaches & solutions
- `docs/`
  - `MATH_SPEC.md` — Canonical astronomical math & coordinate specification
  - `DESIGN_SYSTEM.md` — Canonical visual tokens, color semantics & stroke encodings
  - `adr/` — Architecture Decision Records (`0001` through `0028`)
