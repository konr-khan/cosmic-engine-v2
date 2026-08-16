# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4.

---

## ✨ Features

- ☀️ **Solar Almanac & Twilight Bands**: Solstice/equinox pathing, civil, nautical, and astronomical twilight durations, equation of time (analemma correction), solar noon, and daylight duration calculations with polar bounds handling.
- 🕒 **Polar Sunlight Clock & Sun Elevation Arc**: 24-hour polar sector dial oriented with **00:00 UTC at the top** and **12:00 UTC at the bottom** with clockwise progression, paired with an instantaneous **$+90^\circ$ Sun Elevation Arc** horizon dome visualizer.
- 🌙 **Lunar Almanac & Tidal Vectors**: 365-day 24-hour moonrise and moonset braided ribbon chart (0000Z to 2400Z), moon phases, perigee/apogee distance metrics, astronomical parallactic angles, and harmonized ocean tidal bulge oscillator.
- 🌒 **Eclipse Mechanics & Shadow Geometry**: Umbra/penumbra shadow ray geometry, $5.14^\circ$ lunar nodal plane corridor, smooth $C^1$-continuous syzygy obscuration predictions, and 5 historical/future eclipse presets (Apr 2024, Oct 2024, Mar 2025, Aug 2026, Aug 2027).
- 🧭 **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct dragging of date, time, longitude, and latitude, with fast season jumps and direct military/time string parser.
- 🌐 **Celestial Sphere & Horizon View**: Equatorial/ecliptic coordinate mapping, declination, right ascension, and 3D orthographic projection visualizer with geocentric and heliocentric modes.
- 🗺️ **Daylight Terminator Map**: Real-time Earth map with continental landmasses showing solar sub-point and illumination shadow terminator.
- 🪐 **Macro & Micro Views**: Heliocentric Keplerian planetary orbit view with 1 AU orbital physics HUD and Earth gravitational tidal force micro-view.
- 🌍 **LivingMarble Globe Visualizer**: Analytical spherical limb intersection and evenodd annular cutout eliminating backside terminator tearing and preserving deep-night contrast.
- 🎯 **Cross-Card Interactive Hover Sync**: Hovering over timestamps or calendar dates in any widget synchronizes time/elevation across all visible cards simultaneously.
- ⚡ **Web Worker Ephemeris Offloading**: Asynchronous, off-main-thread computation for heavy Meeus lunar and syzygy shadow algorithms via an application-level singleton worker manager with request multiplexing and automatic synchronous fallback.
- ⏱️ **External Chronometer Store**: High-frequency animation loops powered by React 19 `useSyncExternalStore` and `requestAnimationFrame` for 60 FPS performance without React re-render thrashing.
- 🛡️ **Fault-Tolerant Window Error Boundaries**: Dedicated React Error Boundaries wrap each visualization module, isolating rendering exceptions and providing an in-place module retry mechanism without crashing the dashboard.
- 🪟 **Modular Window Grid & Workspace Presets**: Drag-and-drop column reordering, resizing, locking, maximize/minimize modes, and curated presets (*Master Observatory*, *Solar Observation Suite*, *Lunar & Tidal Suite*, *Eclipse Mechanics Suite*, *Ultrawide 21:9 Observatory*).

---

## 🛠️ Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 6+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer (`src/workers/ephemerisWorkerManager.ts`)
- **Icons & Data Viz**: `lucide-react`
- **Testing**: `vitest` (105 automated unit tests across 5 test suites: pure math, hooks, state store, error boundaries, and worker fallback)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run Vitest test suite (105 unit tests across 5 suites)
npm test

# Run full test suite in single-run CI mode
npm test -- --run

# Build production bundle to dist/
npm run build

# Preview built production bundle locally
npm run preview
```

---

## 🏛️ Architecture Overview

```
Cosmic Engine V2.0/
├── index.html                   # HTML entry point with title & viewport config
├── package.json                 # Project dependencies & Vite scripts
├── tsconfig.json                # TypeScript root configuration (strict mode)
├── tsconfig.node.json           # TypeScript build tooling configuration
├── vite.config.js               # Vite configuration & plugin setup
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Repository documentation & quick start
├── AGENTS.md                    # Agent guidelines & architecture map
├── src/
│   ├── main.tsx                 # React root renderer
│   ├── App.tsx                  # Master Observatory dashboard & layout preset manager
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
│   │   │   ├── solar.js         # Solar declination, EoT, twilight algorithms & annual solar matrix
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
│   │   ├── useCosmicEngine.test.ts # Vitest hook unit tests (13 tests)
│   │   ├── useEphemerisWorker.ts # Custom hooks (instantaneous & annual solar/lunar matrix workers)
│   │   └── useEphemerisWorker.test.ts # Vitest hook tests (17 tests)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets
│       │   ├── SolarAlmanac.tsx # 365-day solar twilight bands & solstice paths
│       │   ├── SunClock.tsx     # 24h polar dial (00:00Z top, 12:00Z bottom) & Sun Elevation Arc
│       │   ├── LunarAlmanacCard.tsx # 365-day 24h moonrise/moonset braided ribbon & tidal wave
│       │   ├── EclipseDemonstrator.tsx # Master eclipse demonstrator container
│       │   ├── CelestialSphereView.tsx # 3D orthographic celestial coordinate sphere
│       │   ├── TerminatorMap.tsx # Centered daylight terminator world map
│       │   ├── MacroOrbitView.tsx # Keplerian orbital physics HUD & seasonal milestones
│       │   ├── MicroTideView.tsx # Earth gravitational tidal force micro-view
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

## 🧪 Testing

The test harness uses **Vitest** to validate mathematical precision, hook edge cases, error boundary recovery, and asynchronous worker operations:

| Test Suite | File | Tests | Focus Areas |
| :--- | :--- | :--- | :--- |
| **Cosmic Math** | `src/utils/cosmicMath.test.ts` | 64 | Polar daylight singularities ($\pm 90^\circ$, continuous twilight), Julian dates, Meeus lunar series, nodal precession ($\Omega$), 365/366-day solar & lunar matrices, eclipse presets, smooth obscuration continuity |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` | 13 | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$) |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` | 17 | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, automatic synchronous fallback |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` | 6 | Fault isolation, derived state error capture, and in-place module reset recovery |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` | 5 | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping |

Run the full suite with:
```bash
npm test -- --run
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, mathematical contracts, and verification standards for AI pair programming sessions.
