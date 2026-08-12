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
- **Icons & Visualization**: `lucide-react`, `recharts`
- **Testing**: `vitest` (`npm test`)

### Essential Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm test` | Runs Vitest unit test suite for astronomical math engine |
| `npm run build` | Builds production distribution to `dist/` |
| `npm run preview` | Previews built production bundle locally |

---

## 3. Repository Architecture

```
Cosmic Engine V2.0/
├── index.html                   # HTML entry point with title & viewport config
├── package.json                 # Project dependencies & Vite scripts
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
│   ├── hooks/
│   │   ├── useCosmicEngine.js   # Selective domain engine hook (solar, lunar, eclipse, tides)
│   │   └── useCosmicEngine.test.js # Vitest hook unit tests (state transitions & polar edge cases)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets (SolarAlmanac, LunarAlmanacCard, etc.)
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

### B. Simulation Engine Hook (`src/hooks/useCosmicEngine.js`)
- Manages core astronomical calculations and state derived from date/time, observer latitude/longitude, and active widget flags.
- **Selective Calculation Optimization**: Accepts `activeWidgets` flags to bypass heavy Meeus lunar ephemeris series (`calculateLunarEvents`) and eclipse shadow solvers (`calculateEclipseData`) during high-speed animation ticks when corresponding domain widgets are inactive.
- Tested by `src/hooks/useCosmicEngine.test.js` under `jsdom`.
- **Rule for Agents**: Use this hook as the single source of truth for simulation time and observer location.

### C. Master Observatory Layout (`src/App.jsx`)
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
