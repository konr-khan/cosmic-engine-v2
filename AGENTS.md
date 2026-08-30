# AGENTS.md — Agent Guidelines, Operating Protocols & Architecture Map

Welcome to **Cosmic Engine V2.0**. This document provides essential architectural context, operational protocols, mathematical contracts, and coding conventions for AI agents and developer tools working on this codebase.

---

## 1. Project Overview

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4. 

Key capabilities include:
- **Gyro-Morph Dynamic Armillary & Astrolabe**: 
  - **Universal 5-Model Continuum**: Seamlessly unites the Copernican Solar System and historical Astrolabes across 5 continuous modes: `☉ Orbit` (Heliocentric Keplerian planetary orbit), `⊕ Apparent` (Geocentric apparent motion & 3D Celestial Armillary Sphere), `🧭 Rete` (Stereographic Conformal planisphere), `📐 Rojas` (Universal Rojas Orthographic on solstitial colure), and `🔭 Horizon` (Topocentric Horizon stereonet).
  - **Spherical SLERP & Geodesic Celestial Trajectories**: Pure great-circle spherical linear interpolation (`slerp3D`) on $S^2$ for the Sun, Moon, Earth, and all 6 seasonal orbital milestones, preserving exact radii and eliminating chord-cutting or center-dipping artifacts.
  - **Staged $SO(3)$ Camera Alignment Choreography & Memory**: Synchronized camera reorientation to canonical projection poles ($\text{Pitch} = 90^\circ$ for Stereographic/Horizon, $\text{Pitch} = 0^\circ$ for Rojas) while preserving custom user 3D viewing angles in heliocentric and geocentric modes, completely eliminating diagonal axis shear during flattening.
  - **Continuous Conformal & Circle-Preserving Projections**: Smooth cross-projection transitions (`computeContinuousProjection2D`) with optical focal pulling ($d \in [R_0, \infty)$) and $SO(3)$ observer latitude rotation, ensuring celestial rings maintain their circularity without peanut distortion or vertex pulling.
  - **Progressive Almucantar & Bezel Materialization**: Smooth radial expansion ($94\% \to 100\%$) of the double-grooved brass bezel, progressive elevation curve fading from $\lambda = 0.15 \to 1.0$, and continuous sliding between eccentric stereographic almucantars and concentric horizon stereonet rings (`generateContinuousAlmucantars`).
  - **Overhauled Morph $\lambda$ Slider**: Expanded $28\text{px}$ touch target with event isolation (`stopPropagation`, `touch-action: none`) and fluid 60 FPS direct slider-to-canvas binding.
  - **Keplerian Orbital Dynamics & Scale Controls**: True Scale ($1\times$, $e=0.0167$) vs. Exaggerated Eccentricity ($e=0.25$) modes, 6 seasonal milestone halo nodes (Perihelion, Aphelion, Solstices, Equinoxes), and live orbital physics HUD reporting Earth distance (AU/km), velocity (km/s), solar irradiance (%), and apparent diameter (arcmin).
  - **Clamped Ecliptic Track Sun Bead**: Mathematical clamping of the Sun bead directly to the Ecliptic ring curve ($r_0 \cos \lambda, r_0 \sin \lambda \sin \epsilon, r_0 \sin \lambda \cos \epsilon$), eliminating drift across seasons and Rete rotation.
  - **SED Precision Hairline Astrolabe Redesign**: Precision double-grooved hairline brass bezel (`#b45309`/`#78350f`, $0.75\text{px}$), delicate monospace Roman numeral micro-labels, slim $1.6\text{px}$ Alidade sighting arm with cyan laser sightline, and muted almucantars.
  - **Free Rete Spinning & Analog Astrolabe Solver**: Unlocked mouse/touch dragging of the golden Rete with real-time **Apparent Solar Time** solver (`☉ HH:MM`) and instant **Snap Now** sidereal clock resync.
  - **Volumetric Laser Projection Cones & Focal Beacon**: Optical Center of Projection beacon at $(0, -R_0, 0)$ with radiating laser rays and translucent conic light envelopes.
  - **Interactive Alidade Sighting Arm & Snap-to-Star**: Authentic dual pinnule sighting vanes, laser sightline, and **Click-to-Snap Target Locking** on stars (*Sirius*, *Vega*, *Arcturus*, *Rigel*), Sun, and Moon with live Alt/Az and RA/Dec sighting telemetry HUD.
  - **Historical Horology**: 12 classical navigational astrolabe stars, Roman/Medieval 12 Unequal Planetary Hours with Chaldean planetary rulers, and Greenwich/Local Sidereal Time.
- **Solar Almanac & Twilight Bands**: Solstice/equinox pathing, civil/nautical/astronomical twilight durations, equation of time (analemma correction), and daylight length calculations with polar bounds handling, integrated side-by-side with the 24-hour circular Polar Sector Dial featuring **Solar Noon vs. UTC Mode** segmented controls.
- **Today's Sky Horizon Dome**: Symmetrical dual $+90^\circ$ Sun & Moon Elevation Arc domes with live zenith angles, interactive **Solar Noon Click-to-Snap** action, solar noon / lunar transit peak tracking, borderless $1.5\times$ Moon Phase disc with rich glassmorphic hover popovers, and mirrored daily sunrise/sunset, moonrise/moonset, and declination metrics.
- **Lunar Almanac & Tidal Vectors**: 365-day 24-hour moonrise and moonset braided ribbon chart with Zulu time ticks (0000Z to 2400Z vs Local Mean Time), real-time hairline time guide scanning, Meeus Ch. 48 true geocentric phase angle ($i$) and disc illumination ($k$), 2-step iterative high-latitude rise/set solver, perigee/apogee distance metrics in km and $R_E$, astronomical parallactic angles, and streamlined summary ephemeris.
- **Gravitational Tidal Force Micro-View**: 2D Earth gravitational tidal force micro-view with an oceanic blue daylight hemisphere, harmonized multi-layered twilight boundary transitions (Astronomical, Nautical, Civil), and a dynamic ocean tidal wave oscillator reporting live Tidal Deformation Ratios from quadrature neap to syzygy spring tides.
- **Side-by-Side Dual-Perspective Eclipse Demonstrator**: 
  - **Left (Syzygy Profile & Shadow Rays)**: Strictly side-on ecliptic transverse profile with a 3D-projected inclined lunar orbital ring through Earth, tracking orbital elongation ($0^\circ \to 360^\circ$), ray-traced Umbra/Penumbra shadow cones, and minimalist vector Earth with $23.44^\circ$ seasonal axial tilt, dashed blue equator chord, and longitude-synchronized day/night observer pin.
  - **Right (Axial Sightline & 5.14° Nodes)**: Down-the-barrel view along the Sun-Earth sightline through Earth with partially eclipsed background Sun, vector Earth with $23.44^\circ$ projected axial tilt, dashed blue equator chord, dynamic rotating observer pin, and an open 3D elliptical orbital loop with physical 2D positioning on $X$ (transverse elongation) and $Y$ (ecliptic latitude $\beta$) showing true above/below miss geometry.
  - **Color-Coded Nodes & 2D Stroke Encoding**: Subtle **Sky Blue** (`#38bdf8`) for Ascending ($\beta \ge 0$, North of ecliptic) vs. **Crimson Red** (`#f43f5e`) for Descending ($\beta < 0$, South of ecliptic), and **Solid stroke** for Waxing ($0^\circ \to 180^\circ$) vs. **Dashed stroke** for Waning ($180^\circ \to 360^\circ$).
  - **Real-Time Annual Nodal Seasons**: Annual dynamic modulation of the orbital plane tilt driven by the Sun-Earth-Node angle ($\Delta \Omega = \lambda_{\text{sun}} - \Omega_{\text{node}}$) and dynamically gliding Ascending ($\Omega$) and Descending ($\mho$) nodes.
  - **Exact Peak UTC Eclipse Presets**: Direct snapping to exact fractional UTC peak hours of greatest eclipse for 5 historical and future presets (Apr 2024, Oct 2024, Mar 2025 Blood Moon, Aug 2026, Aug 2027 Luxor).
  - **Terrestrial & Lunar POV Sky View**: Dynamic perspective switching between Earth observer sky (Totality Corona, Baily's Beads, Diamond Ring) and the astronaut Lunar Surface perspective (Earth eclipsing the Sun with the atmospheric crimson "Blood Ring").
- **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct dragging of date (with full year tooltip), time, longitude, and linear latitude slider, with fast season jumps and direct military/time string parser.
- **Daylight Terminator Map**: Real-time Earth map with centered observer meridian, unified **Sky Blue (`#38bdf8`) observer location pin** with coordinate crosshairs, glowing Subsolar Point (Sun Zenith) and Sublunar Point (Moon Zenith) with **dynamic orbital distance and apparent diameter scaling** ($0.983\text{ AU} \to 1.017\text{ AU}$, $356,400\text{ km} \to 406,700\text{ km}$), and unclosed horizon boundary curves dividing daylight from civil, nautical, and astronomical twilight shadows with interactive glassmorphic HUD popovers.
- **Solar System Macro Orbit**: Heliocentric Keplerian planetary orbit view with **segmented True Scale vs. Exaggerated toggle controls**, persistent glowing translucent halo nodes (Perihelion, Solstices, Equinoxes, Aphelion), 1 AU orbital physics HUD with collision-free diagonal arc labeling, and live syzygy indicators.
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
- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 7 modules)

### Essential Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run typecheck` | Runs TypeScript compiler in typecheck mode (`tsc --noEmit`) |
| `npm test` | Runs Vitest unit test suite (pure math, hooks, layout state, state store, error boundaries, widgets, worker fallbacks) |
| `npm test -- --run` | Runs full Vitest suite in single-run CI mode |
| `npm run test:coverage` | Runs Vitest with v8 code coverage reporting |
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
├── docs/                        # Persistent technical specifications & ADRs
│   ├── MATH_SPEC.md             # Astronomical math specification & coordinate formulas
│   ├── DESIGN_SYSTEM.md         # Visual tokens, color semantics & vector stroke encodings
│   └── adr/                     # Architecture Decision Records (ADRs)
│       ├── 0001-external-store-and-worker-architecture.md
│       ├── 0002-branded-nominal-unit-typing.md
│       └── 0003-gyro-morph-armillary-projections.md
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
│   │   │   ├── lunar.ts         # Lunar ephemeris solver, disc illumination, nodal precession, parallactic angle & annual lunar matrix
│   │   │   ├── eclipse.ts       # Syzygy shadow geometry & eclipse scanner
│   │   │   ├── armillary/       # Decomposed Gyro-Morph Armillary & Astrolabe math module
│   │   │   │   ├── index.ts          # Barrel re-export
│   │   │   │   ├── types.ts          # Armillary domain types & 5-model continuum definitions
│   │   │   │   ├── constants.ts      # Milestones, 12 Astrolabe Stars, Zodiac Signs, Chaldean Planets
│   │   │   │   ├── coordinates.ts    # GMST, LST, 3D Euler rotations, Alt/Az & RA/Dec coordinate conversions
│   │   │   │   ├── projections.ts    # Stereographic Conformal, Rojas Orthographic, Topocentric Horizon
│   │   │   │   ├── astrolabe.ts      # Almucantar curves, Unequal planetary hours, Free Rete LST solver
│   │   │   │   ├── focalBeacon.ts    # Center of projection focal pole beacon & laser rays
│   │   │   │   ├── alidade.ts        # Real-time Alidade sighting telemetry & snap-to-target solver
│   │   │   │   ├── paths.ts          # Depth-sorted SVG path segment generator
│   │   │   │   └── generator.ts      # generateArmillaryModel with staged morph & clamped Sun bead
│   │   │   ├── armillary.ts     # Re-export bridge to ./armillary
│   │   │   ├── projection.ts    # Earth axial tilt 3D projection, observer pin & 4-quadrant orbital stroke segments
│   │   │   └── geoData.ts       # World landmass continent outline polygons
│   │   └── cosmicMath.test.ts   # Vitest unit tests for math engine (114 tests)
│   ├── store/                   # External state store & chronometer controls
│   │   ├── cosmicStore.ts       # External state store & animation frame ticker
│   │   └── cosmicStore.test.ts  # Vitest unit tests for state store & selector equality (7 tests)
│   ├── workers/                 # Web Worker offload scripts
│   │   ├── ephemerisWorker.ts   # Dedicated worker for Meeus ephemeris, eclipse geometry & 365-day matrices
│   │   └── ephemerisWorkerManager.ts # Application singleton worker manager, deduplication & matrix cache
│   ├── hooks/
│   │   ├── useCosmicEngine.ts   # Selective domain engine hook (solar, lunar, eclipse, tides)
│   │   ├── useCosmicEngine.test.ts # Vitest hook unit tests (13 tests: state transitions & polar edge cases)
│   │   ├── useEphemerisWorker.ts # Custom hooks (instantaneous & annual solar/lunar matrix workers)
│   │   ├── useEphemerisWorker.test.ts # Vitest hook tests (19 tests: worker integration, coalescing, matrix caching & fallback)
│   │   ├── useDashboardLayout.ts # Window layout state, drag-and-drop, resize, locking, presets & storage
│   │   └── useDashboardLayout.test.ts # Vitest hook tests for layout manager (7 tests)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets
│       │   ├── index.ts         # Central barrel export for all 8 observatory subsystems
│       │   ├── widgets.test.ts  # Vitest unit tests for 8 observatory widgets (11 tests)
│       │   ├── armillary/       # Decomposed Gyro-Morph Armillary & Astrolabe subsystem
│       │   │   ├── canvas/                   # Modular SVG canvas layers
│       │   │   │   ├── index.ts              # Canvas barrel export
│       │   │   │   ├── ArmillaryDefs.tsx     # SVG gradients & glow filters
│       │   │   │   ├── ArmillaryBezelLayer.tsx # Hairline double-grooved brass bezel & 24h Roman markings
│       │   │   │   ├── ArmillaryTympanLayer.tsx # Almucantar altitude curves for stereographic plate
│       │   │   │   ├── ArmillaryLaserLayer.tsx # Volumetric laser projection beacon, cone wash & radiating rays
│       │   │   │   ├── ArmillaryObserverConeLayer.tsx # Topocentric observer FOV cone, zenith ray & pin
│       │   │   │   ├── ArmillaryRingsLayer.tsx # Depth-sorted celestial rings & Zodiac ecliptic glyph markers
│       │   │   │   ├── ArmillaryStarsLayer.tsx # 12 Classical Navigational Astrolabe Stars & sighting pointers
│       │   │   │   ├── ArmillaryBeadsLayer.tsx # Earth, Sun (clamped), Moon, milestones, lunar nodes & connector
│       │   │   │   └── ArmillaryAlidadeLayer.tsx # Hairline Alidade sighting rule, laser sightline & pinnules
│       │   │   ├── ArmillarySvgCanvas.tsx      # Interactive 3D Euler SVG viewport coordinator
│       │   │   ├── ArmillaryHeaderControls.tsx # 5-mode pills, morph slider & spring-snap triggers
│       │   │   ├── ArmillaryHoverHud.tsx       # Floating star, sun/moon & Alidade telemetry HUD
│       │   │   ├── ArmillaryTelemetryHud.tsx  # 4-column horological telemetry footer
│       │   │   ├── types.ts                    # Armillary domain interfaces & props
│       │   │   ├── GyroArmillaryView.tsx      # Subsystem coordinator container
│       │   │   └── index.ts                    # Barrel export
│       │   ├── terminator/      # Decomposed daylight terminator map subsystem modules
│       │   │   ├── TerminatorMap.tsx           # Centered daylight terminator map with subsolar & sublunar points
│       │   │   └── index.ts                    # Barrel export
│       │   ├── tides/           # Decomposed gravitational tidal force subsystem modules
│       │   │   ├── MicroTideView.tsx           # Earth gravitational tidal force micro-view & ocean wave oscillator
│       │   │   └── index.ts                    # Barrel export
│       │   ├── macro/           # Decomposed heliocentric macro-orbit subsystem modules
│       │   │   ├── OrbitSvgCanvas.tsx      # SVG heliocentric viewport & orbital ellipses
│       │   │   ├── OrbitHoverHud.tsx       # Floating glassmorphic hover popovers
│       │   │   ├── OrbitPhysicsHud.tsx     # 4-column telemetry physics footer
│       │   │   ├── OrbitHeaderControls.tsx # True scale vs. exaggerated scale toggle
│       │   │   ├── milestones.ts           # Extracted seasonal orbital milestones
│       │   │   ├── types.ts                # Macro-orbit domain interfaces & props
│       │   │   ├── MacroOrbitView.tsx      # Subsystem coordinator container
│       │   │   └── index.ts                # Barrel export
│       │   ├── solar/           # Decomposed solar almanac subsystem modules
│       │   │   ├── SolarRibbonChart.tsx    # 365-day 24h daylight & twilight ribbons SVG chart
│       │   │   ├── PolarSunlightDial.tsx   # 24-hour circular polar sunlight sector clock
│       │   │   ├── SolarShortcutsRail.tsx  # Solstice & equinox fast-jump shortcut pills
│       │   │   ├── SolarAlmanacCard.tsx    # Subsystem coordinator container
│       │   │   └── index.ts                # Barrel export
│       │   ├── today/           # Decomposed today's horizon subsystem modules
│       │   │   ├── SunElevationDome.tsx    # Symmetrical +90° Sun elevation arc & solar orbit bar
│       │   │   ├── MoonElevationDome.tsx   # Symmetrical +90° Moon elevation arc & moon phase disc
│       │   │   ├── TodayHorizonView.tsx    # Subsystem coordinator container
│       │   │   └── index.ts                # Barrel export
│       │   ├── lunar/           # Decomposed lunar almanac subsystem modules
│       │   │   ├── LunarRibbonChart.tsx    # 365-day 24h braided ribbon SVG chart
│       │   │   ├── TidalWaveOscillator.tsx # Harmonized ocean tidal bulge oscillator
│       │   │   ├── LunarShortcutsRail.tsx  # Fast-jump phase & solstice shortcut pills
│       │   │   ├── LunarAlmanacCard.tsx    # Subsystem coordinator container
│       │   │   └── index.ts                # Barrel export
│       │   └── eclipse/         # Decomposed eclipse demonstrator subsystem modules
│       │       ├── EclipseDemonstrator.tsx     # Master eclipse demonstrator container
│       │       ├── EclipseStatusBadge.tsx      # Syzygy classification & proximity badge
│       │       ├── ShadowRayDiagram.tsx        # Decomposed coordinator container
│       │       ├── ShadowRayHoverHud.tsx       # Floating glassmorphic hover popovers
│       │       ├── LiveSyzygyView.tsx          # Side-on ecliptic profile & shadow rays
│       │       ├── LunarSurfacePovView.tsx     # Lunar sky POV with corona & blood ring
│       │       ├── NodalPlaneVisualizer.tsx    # 5.14° nodal plane corridor & alignment bar
│       │       ├── SkyViewSimulator.tsx        # Observer sky viewport (Corona, Blood Moon & Lunar POV)
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
- **File Operation & Critical Path Guardrails**:
  - **Nominal Branded Units Guardrail**: Never modify `src/types/units.ts` without running the full test matrix (`npm test -- --run` and `npm run typecheck`). Branded nominal unit regressions silently cascade across all coordinate and ephemeris solvers.
  - **Barrel Export Integrity**: Never modify root or subsystem barrel exports (`index.ts`) without verifying that no circular dependencies or type-only export breaks are introduced.
  - **Mathematical Provenance Guardrail**: Agents must never delete, minify, or rewrite comments citing Jean Meeus chapter references or IAU standard models in `src/utils/cosmicMath/`.

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
- Hovering over timestamps or day-of-year points in `SunClock` or `SolarAlmanac` propagates synchronized coordinates across `TerminatorMap`, `MacroOrbitView`, and `LunarAlmanacCard`.
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
   - Transverse cross-axis displacement follows $s = \sin(\text{phaseRad}) \in [-1, 1]$ (Syzygy at center $X = 200$, Quarters at extremities $X = 200 \pm 100$).
   - Dynamic Ascending ($\Omega$) and Descending ($\mho$) nodes glide along the orbital line ($s_{\text{node}} = -\sin(\Delta \Omega)$), converging into the center target during eclipse seasons and moving to outer extremities during off-seasons.
3. **Exact UTC Preset Snapping**:
   - `EclipsePresetItem` requires explicit `timeOfDay: number` (fractional UTC hour) to guarantee that clicking presets snaps directly to peak totality (e.g., $06:58\text{ UTC}$ for Mar 14, 2025 Blood Moon).

### H. Orbital Milestones & Persistent Translucent Halo Nodes (`MacroOrbitView.tsx`, `HeliocentricOrbitView.tsx`)
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

