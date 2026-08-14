# AGENTS.md — Agent Guidelines & Architecture Map

Welcome to **Cosmic Engine V2.0**. This document provides essential context, architectural layout, commands, and coding conventions for AI agents and developer tools working on this codebase.

---

## 1. Project Overview

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, Vite, and Tailwind CSS v4. 

Key capabilities include:
- **Solar Almanac & Twilight Bands**: Solstice/equinox pathing, civil/nautical/astronomical twilight durations, and day length calculations.
- **Lunar Almanac & Tidal Vectors**: 365-day lunar matrix, moon phases, apogee/perigee, and tidal force visualization.
- **Eclipse Mechanics & Shadow Geometry**: Umbra/penumbra shadow geometry, solar & lunar eclipse alignment predictors.
- **Celestial Sphere & Horizon View**: Equatorial/ecliptic coordinate mapping, declination, and right ascension visualizers.
- **Daylight Terminator Map**: Real-time Earth map showing solar sub-point and illumination terminator.
- **Macro & Micro Views**: Heliocentric planetary orbit view and Earth gravitational tidal force micro-view.

---

## 2. Tech Stack & Commands

- **Framework**: React 19 (JSX)
- **Bundler & Dev Server**: Vite 6+ (`npm run dev`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: `useSyncExternalStore` subscription model (`src/store/cosmicStore.js`)
- **Concurrency**: Application-level Web Worker singleton manager (`src/workers/ephemerisWorkerManager.js`) offloading to dedicated worker thread (`src/workers/ephemerisWorker.js`)
- **Icons & Visualization**: `lucide-react`, `recharts`
- **Testing**: `vitest` (`npm test` — 36 unit tests across math, hooks, store, and worker fallback)

### Essential Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm test` | Runs Vitest unit test suite (cosmicMath, hooks, state store, ephemeris worker) |
| `npm run build` | Builds production distribution to `dist/` |
| `npm run preview` | Previews built production bundle locally |

---

## 3. Repository Architecture

```
Cosmic Engine V2.0/
├── index.html                   # HTML entry point with title & viewport config
├── package.json                 # Project dependencies & Vite scripts
├── vite.config.js               # Vite configuration & plugin setup
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Repository documentation & getting started
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
│   │   │   ├── solar.js         # Solar declination, EoT & twilight algorithms
│   │   │   ├── lunar.js         # Lunar ephemeris solver & parallactic angle
│   │   │   └── eclipse.js       # Syzygy shadow geometry & eclipse scanner
│   │   └── cosmicMath.test.js   # Vitest unit tests for math engine
│   ├── store/                   # External state store & chronometer controls
│   │   ├── cosmicStore.js       # External state store & animation frame ticker
│   │   └── cosmicStore.test.js  # Vitest unit tests for state store & selector equality
│   ├── workers/                 # Web Worker offload scripts
│   │   ├── ephemerisWorker.js   # Dedicated worker for Meeus ephemeris & eclipse geometry
│   │   └── ephemerisWorkerManager.js # Application singleton worker manager & multiplexer
│   ├── hooks/
│   │   ├── useCosmicEngine.js   # Selective domain engine hook (solar, lunar, eclipse, tides)
│   │   ├── useCosmicEngine.test.js # Vitest hook unit tests (state transitions & polar edge cases)
│   │   ├── useEphemerisWorker.js   # Custom hook managing Web Worker messaging & sync fallback
│   │   └── useEphemerisWorker.test.js # Vitest hook tests (worker integration & fallback)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets (SolarAlmanac, LunarAlmanacCard, etc.)
│       │   └── eclipse/         # Decomposed eclipse demonstrator subsystem modules
│       ├── controls/            # Interactive astrolabe inputs (ArmillaryRail, LatitudeSlider, etc.)
│       ├── layout/              # Container layout modules (DashboardWindow, OrbitalChronometer)
│       └── common/              # Shared visual components (LivingMarble, PhaseVisual, AnnualChart)
```

---

## 4. Key Subsystems & Data Flow

### A. Mathematical Engine (`src/utils/cosmicMath/`)
- Contains all pure astronomical functions with full JSDoc type & unit annotations (Julian Date conversions, solar declination, equation of time, lunar phase angles, twilight elevation thresholds, eclipse alignment angles, and tidal vector forces).
- Contains default constants (`CONFIG`) for solar twilight angles (`OFFICIAL: -0.833°`, `CIVIL: -6.0°`, `NAUTICAL: -12.0°`, `ASTRONOMICAL: -18.0°`), orbital radii, and visual theme tokens.
- Tested by `src/utils/cosmicMath.test.js`.
- **Rule for Agents**: Keep math pure, deterministic, and free of React or UI side-effects.

### B. External Store & Chronometer Ticker (`src/store/cosmicStore.js`)
- Decouples high-frequency animation ticking (`requestAnimationFrame`) and observer state updates from React's component render tree.
- Uses React 18/19 `useSyncExternalStore` with shallow equality selectors to eliminate unnecessary re-renders during high-speed animation ticks.
- Tested by `src/store/cosmicStore.test.js`.
- **Rule for Agents**: Update time/location via `cosmicActions` rather than managing local interval timers inside components.

### C. Simulation Engine Hook (`src/hooks/useCosmicEngine.js`)
- Manages core astronomical calculations derived from date/time, observer latitude/longitude, and active widget flags.
- **Selective Calculation Optimization**: Accepts `activeWidgets` flags to bypass heavy Meeus lunar ephemeris series (`calculateLunarEvents`) and eclipse shadow solvers (`calculateEclipseData`) during high-speed animation ticks when corresponding domain widgets are inactive.
- Tested by `src/hooks/useCosmicEngine.test.js` under `jsdom`.
- **Rule for Agents**: Use this hook as the single source of truth for simulation time and observer location.

### D. Off-Main-Thread Worker Processing (`src/workers/ephemerisWorkerManager.js`, `src/workers/ephemerisWorker.js` & `src/hooks/useEphemerisWorker.js`)
- Multiplexes calculation requests from mounted components through an application-level singleton Web Worker manager (`ephemerisWorkerManager.js`) to eliminate thread proliferation.
- Offloads heavy Meeus lunar ephemeris calculations and eclipse shadow geometry solvers to a dedicated Web Worker to maintain 60 FPS UI performance.
- Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending initial worker response.
- Tested by `src/hooks/useEphemerisWorker.test.js`.
- **Rule for Agents**: Pass calculation flags (`isLunarActive`, `isEclipseActive`) to ensure background worker calculation is requested only when needed.

### E. Master Observatory Layout (`src/App.jsx`)
- Controls module visibility, layout presets (`Master Observatory`, `Solar Suite`, `Lunar & Tide Suite`, `Celestial Observatory`), and grid windowing via `DashboardWindow`.
- Employs a glassmorphism dark-space aesthetic using slate/zinc backgrounds (`#0f172a`), glowing borders, and crisp typography.

---

## 5. Agent Guidelines & Coding Standards

1. **Preserve Math Accuracy**: When altering or adding formulas in `cosmicMath.js`, cite standard astronomical references (e.g. Jean Meeus *Astronomical Algorithms* or IAU standards) and verify equinox/solstice edge cases (polar day/night).
2. **Component Modularity**: Each widget in `src/components/` should accept relevant parameters from `useCosmicEngine` or `cosmicMath` and remain self-contained.
3. **Styling & Aesthetics**:
   - Maintain the sleek, dark cosmic aesthetic (slate/zinc dark mode with indigo, cyan, and amber highlights).
   - Use Tailwind CSS classes for layouts and positioning.
   - Ensure responsive behavior and proper container scaling for SVG/Canvas rendering.
4. **Verification Step**: Always run `npm test` and `npm run build` after making modifications to confirm math precision, absence of JSX syntax errors, or broken dependencies.
