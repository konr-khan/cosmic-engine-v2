# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, Vite, and Tailwind CSS v4.

---

## ✨ Features

- ☀️ **Solar Almanac & Twilight Bands**: Solstice/equinox pathing, civil, nautical, and astronomical twilight durations, equation of time (analemma correction), solar noon, and daylight duration calculations with polar bounds handling.
- 🌙 **Lunar Almanac & Tidal Vectors**: 365-day lunar phase matrix, orbital perigee/apogee distance metrics, astronomical parallactic angle calculation, and spring/neap gravitational tidal force visualization.
- 🌒 **Eclipse Mechanics & Shadow Geometry**: Umbra/penumbra shadow ray geometry, 5.14° lunar nodal plane corridor, syzygy obscuration predictions, and 5 historical/future eclipse presets (Apr 2024, Oct 2024, Mar 2025, Aug 2026, Aug 2027).
- 🧭 **Interactive Astrolabe Chronometer**: 4-concentric SVG astrolabe dial for direct dragging of date, time, longitude, and latitude, paired with direct input military/time string parser, fast season jumps, and modal fine-tuning.
- 🌐 **Celestial Sphere & Horizon View**: Equatorial/ecliptic coordinate mapping, declination, right ascension, and 3D orthographic projection visualizer.
- 🗺️ **Daylight Terminator Map**: Real-time Earth map with continental landmasses showing solar sub-point and illumination shadow terminator.
- 🪐 **Macro & Micro Views**: Heliocentric planetary orbit view and Earth gravitational tidal force micro-view.
- 🎯 **Cross-Card Interactive Hover Sync**: Hovering over timestamps or calendar dates in any widget synchronizes time/elevation across all visible cards simultaneously.
- ⚡ **Web Worker Ephemeris Offloading**: Asynchronous, off-main-thread computation for heavy Meeus lunar and syzygy shadow algorithms via an application-level singleton worker manager with request multiplexing and automatic synchronous fallback.
- ⏱️ **External Chronometer Store**: High-frequency animation loops powered by `useSyncExternalStore` and `requestAnimationFrame` for 60 FPS performance without React re-render thrashing.
- 🛡️ **Fault-Tolerant Window Error Boundaries**: Dedicated React Error Boundaries wrap each visualization module, isolating rendering exceptions and providing an in-place module retry mechanism without crashing the dashboard.
- 🪟 **Modular Window Grid & Workspace Presets**: Drag-and-drop column reordering, resizing, locking, maximize/minimize modes, and curated presets (*Master Observatory*, *Solar Suite*, *Lunar & Tidal Suite*, *Eclipse Mechanics*, *Ultrawide 21:9*).

---

## 🛠️ Tech Stack

- **Framework**: React 19 (JSX)
- **Bundler & Dev Server**: Vite 6+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.js`)
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer (`src/workers/ephemerisWorkerManager.js`)
- **Icons & Data Viz**: `lucide-react`
- **Testing**: `vitest` (102 automated unit tests across 5 test suites: pure math, hooks, state store, error boundaries, and worker fallback)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run Vitest test suite (102 unit tests across 5 suites)
npm test

# Build production bundle to dist/
npm run build

# Preview built production bundle
npm run preview
```

---

## 🏛️ Architecture Overview

```
Cosmic Engine V2.0/
├── index.html                   # HTML entry point with title & viewport config
├── package.json                 # Project dependencies & Vite scripts
├── vite.config.js               # Vite configuration & plugin setup
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Repository documentation & quick start
├── AGENTS.md                    # Agent guidelines & architecture map
├── src/
│   ├── main.jsx                 # React root renderer
│   ├── App.jsx                  # Master Observatory dashboard & layout preset manager
│   ├── index.css                # Global styles & Tailwind imports
│   ├── utils/
│   │   ├── cosmicMath/          # Pure astronomical math domain modules
│   │   │   ├── index.js         # Central re-export entry file
│   │   │   ├── constants.js     # Orbital radii, twilight thresholds & theme tokens
│   │   │   ├── core.js          # Julian dates, hour formatting & trig helpers
│   │   │   ├── solar.js         # Solar declination, EoT, twilight algorithms & annual solar matrix
│   │   │   ├── lunar.js         # Lunar ephemeris solver, nodal precession, parallactic angle & annual lunar matrix
│   │   │   └── eclipse.js       # Syzygy shadow geometry & eclipse scanner
│   │   └── cosmicMath.test.js   # Vitest unit tests for math engine (61 tests)
│   ├── store/                   # External state store & chronometer controls
│   │   ├── cosmicStore.js       # External state store & animation frame ticker
│   │   └── cosmicStore.test.js  # Vitest unit tests for state store & selector equality (5 tests)
│   ├── workers/                 # Web Worker offload scripts
│   │   ├── ephemerisWorker.js   # Dedicated worker for Meeus ephemeris, eclipse geometry & 365-day matrices
│   │   └── ephemerisWorkerManager.js # Application singleton worker manager, deduplication & matrix cache
│   ├── hooks/
│   │   ├── useCosmicEngine.js   # Selective domain engine hook (solar, lunar, eclipse, tides)
│   │   ├── useCosmicEngine.test.js # Vitest hook unit tests (13 tests)
│   │   ├── useEphemerisWorker.js   # Custom hooks (instantaneous & annual solar/lunar matrix workers)
│   │   └── useEphemerisWorker.test.js # Vitest hook tests (17 tests)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets
│       │   ├── SolarAlmanac.jsx # 365-day solar twilight bands & solstice paths
│       │   ├── SunClock.jsx     # Polar sun elevation sector dial
│       │   ├── LunarAlmanacCard.jsx # 365-day lunar matrix & tidal wave
│       │   ├── EclipseDemonstrator.jsx # Eclipse demonstrator orchestrator
│       │   ├── CelestialSphereView.jsx # 3D orthographic celestial coordinate sphere with dynamic node alignment
│       │   ├── TerminatorMap.jsx # Centered daylight terminator world map
│       │   ├── MacroOrbitView.jsx # Solar system macro orbit view
│       │   ├── MicroTideView.jsx # Earth gravitational tidal force micro-view
│       │   └── eclipse/         # Decomposed eclipse demonstrator subsystem modules
│       ├── controls/            # Interactive astrolabe inputs
│       ├── layout/              # Container layout modules (DashboardWindow, OrbitalChronometer)
│       │   └── chronometer/     # Decomposed astrolabe chronometer subsystem modules
│       └── common/              # Shared visual components (WindowErrorBoundary, LivingMarble, PhaseVisual)
```

---

## 🧪 Testing

The test harness uses **Vitest** to validate mathematical precision, hook edge cases, error boundary recovery, and asynchronous worker operations:

| Test Suite | File | Tests | Focus Areas |
| :--- | :--- | :--- | :--- |
| **Cosmic Math** | `src/utils/cosmicMath.test.js` | 61 | Polar daylight singularities ($\pm 90^\circ$, continuous twilight), Julian dates, Meeus lunar series, nodal precession ($\Omega$), 365/366-day solar & lunar matrices, eclipse presets & 2028 edge cases |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.js` | 13 | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$) |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.js` | 17 | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, automatic synchronous fallback |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.jsx` | 6 | Fault isolation, derived state error capture, and in-place module reset recovery |
| **Cosmic State Store** | `src/store/cosmicStore.test.js` | 5 | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping |

Run the full suite with:
```bash
npm test
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, and verification standards for AI pair programming sessions.
