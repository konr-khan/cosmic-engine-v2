# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, Vite, and Tailwind CSS v4.

---

## ✨ Features

- ☀️ **Solar Almanac & Twilight Bands**: Solstice/equinox pathing, civil, nautical, and astronomical twilight durations, equation of time, and daylight length.
- 🌙 **Lunar Almanac & Tidal Vectors**: 365-day lunar matrix, moon phases, apogee/perigee, parallactic angle, and tidal force visualization.
- 🌒 **Eclipse Mechanics & Shadow Geometry**: Umbra/penumbra shadow geometry, solar & lunar eclipse alignment predictors, and historical/future presets.
- 🌐 **Celestial Sphere & Horizon View**: Equatorial/ecliptic coordinate mapping, declination, and right ascension visualizers.
- 🗺️ **Centered Daylight Terminator Map**: Real-time Earth map showing solar sub-point and illumination shadow terminator.
- 🪐 **Macro & Micro Views**: Heliocentric planetary orbit view and Earth gravitational tidal force micro-view.
- ⚡ **Web Worker Ephemeris Offloading**: Asynchronous, off-main-thread computation for heavy Meeus lunar and syzygy shadow algorithms via a singleton worker manager with multiplexed requests and automatic synchronous fallback.
- ⏱️ **External Chronometer Store**: High-frequency animation loops powered by `useSyncExternalStore` for 60 FPS performance without React re-render thrashing.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (JSX)
- **Bundler & Dev Server**: Vite 6+
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: `useSyncExternalStore` external store subscription pattern (`src/store/cosmicStore.js`)
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer (`src/workers/ephemerisWorkerManager.js`)
- **Icons & Data Viz**: `lucide-react`, `recharts`
- **Testing**: `vitest` (36 unit tests across math, hooks, state store, and worker manager)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit test suite (36 unit tests across 4 test suites)
npm test

# Build production bundle
npm run build
```

---

## 🤖 Agent & AI Guidelines

This project includes an [`AGENTS.md`](./AGENTS.md) guide specifying architecture maps, mathematical invariants in `src/utils/cosmicMath.js`, state hooks, Web Worker offloading patterns, and guidelines for AI agents working on this codebase.
