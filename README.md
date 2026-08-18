# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4.

---

## ✨ Features

- ☀️ **Solar Almanac & 24h Polar Sector Dial**: Solstice/equinox pathing, civil, nautical, and astronomical twilight durations, equation of time (analemma correction), solar noon, and daylight duration calculations with polar bounds handling, integrated side-by-side with the 24-hour circular Polar Clock dial (00:00 UTC at top, 12:00 UTC at bottom).
- 👁️ **Today's Sky Horizon Dome**: Instantaneous dual $+90^\circ$ Sun & Moon Elevation Arc domes with live zenith angles, solar noon / lunar transit peak tracking, borderless $1.5\times$ Moon Phase disc with rich glassmorphic hover popovers, and mirrored daily sunrise/sunset, moonrise/moonset, and declination metrics.
- 🌙 **Lunar Almanac & Ephemeris**: 365-day 24-hour moonrise and moonset braided ribbon chart with Zulu time indexing (0000Z to 2400Z), real-time hairline time guide scanning, perigee/apogee distance metrics in km and $R_E$, and astronomical parallactic angles.
- 🌊 **Gravitational Tidal Force Micro-View**: 2D Earth gravitational tidal vector disc harmonized with the dynamic ocean tidal wave oscillator, reporting live Tidal Deformation Ratios from quadrature neap to syzygy spring tides.
- 🌒 **Eclipse Mechanics & Shadow Geometry**: Umbra/penumbra shadow ray geometry, $5.14^\circ$ lunar nodal plane corridor, smooth $C^1$-continuous syzygy obscuration predictions, explicit orbital elongation tracking ($0^\circ \to 360^\circ$), and 5 historical/future eclipse presets (Apr 2024, Oct 2024, Mar 2025, Aug 2026, Aug 2027).
- 🧭 **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct dragging of date (with full year tooltip), time, longitude, and linear latitude slider, with fast season jumps and direct military/time string parser.
- 🌐 **Celestial Sphere & Horizon View**: Equatorial/ecliptic coordinate mapping, declination, right ascension, and 3D orthographic projection visualizer with geocentric and heliocentric modes, featuring a **3D Misalignment Scale Toggle** (True $23.4^\circ / 5.1^\circ$ vs Exaggerated $45^\circ / 15^\circ$).
- 🗺️ **Daylight Terminator Map**: Real-time Earth map with centered observer meridian, glowing Subsolar Point (Sun Zenith) and Sublunar Point (Moon Zenith), and unclosed horizon boundary curves dividing daylight from civil, nautical, and astronomical twilight shadows with interactive glassmorphic HUD popovers.
- 🪐 **Solar System Macro Orbit**: Heliocentric Keplerian planetary orbit view with high-visibility milestone nodes (Perihelion, Solstices, Equinoxes, Aphelion), 1 AU orbital physics HUD with collision-free diagonal arc labeling, and true vs exaggerated eccentricity modes.
- 🌍 **LivingMarble Globe Visualizer**: Analytical spherical limb intersection and evenodd annular cutout eliminating backside terminator tearing and preserving deep-night contrast.
- 🎯 **Cross-Card Interactive Hover Sync**: Hovering over timestamps or calendar dates in any widget synchronizes time/elevation across all visible cards simultaneously.
- ⚡ **Web Worker Ephemeris Offloading**: Asynchronous, off-main-thread computation for heavy Meeus lunar and syzygy shadow algorithms via an application-level singleton worker manager with request multiplexing and automatic synchronous fallback.
- ⏱️ **External Chronometer Store**: High-frequency animation loops powered by React 19 `useSyncExternalStore` and `requestAnimationFrame` for 60 FPS performance without React re-render thrashing.
- 🛡️ **Fault-Tolerant Window Error Boundaries**: Dedicated React Error Boundaries wrap each visualization module, isolating rendering exceptions and providing an in-place module retry mechanism without crashing the dashboard.
- 🪟 **Modular Window Grid & Workspace Presets**: Drag-and-drop column reordering, resizing, locking, maximize/minimize modes, and curated presets (*Master Observatory*, *Solar Observation Suite*, *Lunar & Tidal Suite*, *Eclipse Mechanics Suite*, *Ultrawide 21:9 Observatory*).

---

## 🎨 Design Philosophy & UX Principles

Cosmic Engine adheres to two foundational principles of scientific information design and human-computer interaction:

1. **Smallest Effective Difference (SED)**:
   - High-density astronomical data is rendered with minimal visual clutter, subtle contrast gradations, muted coordinate grids, and clean vector geometry.
   - Eliminates decorative noise ("chartjunk") so the astronomical physics, trajectories, and curves speak for themselves.
2. **Progressive Disclosure**:
   - Primary viewports remain clean, uncluttered, and instantly glanceable.
   - Rich underlying astronomical physics (parallactic angles, exact syzygy obscuration percentages, orbital speeds, perigee/apogee distance metrics) are readily discoverable via interactive scrubbers, hover cards, tooltips, and modal fine-tuning popovers—making it immediately obvious how to access deeper mathematical detail without overwhelming the primary display.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 6+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer (`src/workers/ephemerisWorkerManager.ts`)
- **Icons & Data Viz**: `lucide-react`
- **Testing**: `vitest` (114 automated unit tests across 6 test suites: pure math, hooks, layout state, state store, error boundaries, and worker fallback)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run Vitest test suite (114 unit tests across 6 suites)
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
├── vite.config.ts               # Vite configuration & plugin setup
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Repository documentation & quick start
├── AGENTS.md                    # Agent guidelines & architecture map
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
│   │   ├── useEphemerisWorker.test.ts # Vitest hook tests (17 tests)
│   │   ├── useDashboardLayout.ts # Window layout state, drag-and-drop, resize, locking, presets & storage
│   │   └── useDashboardLayout.test.ts # Vitest hook tests for layout manager (7 tests)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets
│       │   ├── TodayHorizonView.tsx # Instantaneous Sun & Moon +90° elevation arcs & moon phase
│       │   ├── SolarAlmanac.tsx # 365-day solar twilight bands & 24h polar clock dial
│       │   ├── LunarAlmanacCard.tsx # 365-day lunar ribbon chart & 3-box summary grid
│       │   ├── EclipseDemonstrator.tsx # Barrel export for eclipse subsystem
│       │   ├── CelestialSphereView.tsx # 3D celestial sphere & heliocentric orbit view
│       │   ├── TerminatorMap.tsx # Centered daylight terminator map with subsolar & sublunar points
│       │   ├── MacroOrbitView.tsx # Keplerian orbital physics HUD & seasonal milestones
│       │   ├── MicroTideView.tsx # Earth gravitational tidal force micro-view & ocean wave oscillator
│       │   ├── celestial/       # Decomposed celestial sphere subsystem modules
│       │   │   ├── projection3D.tsx        # Pure 3D projection & SVG ring builder
│       │   │   ├── GeocentricSphereView.tsx # 3D equatorial sphere, zenith ray, ecliptic & lunar tilt
│       │   │   ├── HeliocentricOrbitView.tsx # 1 AU Keplerian Earth orbit ring & seasonal nodes
│       │   │   ├── CelestialSphereView.tsx  # Subsystem coordinator container
│       │   │   └── index.ts                 # Barrel export
│       │   ├── lunar/           # Decomposed lunar almanac subsystem modules
│       │   │   ├── LunarRibbonChart.tsx    # 365-day 24h braided ribbon SVG chart
│       │   │   ├── TidalWaveOscillator.tsx # Harmonized ocean tidal bulge oscillator
│       │   │   ├── LunarShortcutsRail.tsx  # Fast-jump phase & solstice shortcut pills
│       │   │   ├── LunarAlmanacCard.tsx    # Subsystem coordinator container
│       │   │   └── index.ts                # Barrel export
│       │   └── eclipse/         # Decomposed eclipse demonstrator subsystem modules
│       │       ├── EclipseDemonstrator.tsx     # Master eclipse demonstrator container
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

## 📐 TypeScript Unit Typing Strategy

Cosmic Engine employs a **pragmatic hybrid typing model** that balances compile-time mathematical safety in orbital/trigonometric algorithms with frictionless React UI state management:

1. **Nominal Symbol Branding for High-Risk Invariants**:
   - Angular metrics (`Degrees`, `Radians`) and temporal epochs (`JulianDate`, `JulianCenturies`) use unique symbol-branded nominal types ([`src/types/units.ts`](src/types/units.ts)).
   - The TypeScript compiler will reject any attempt to pass degrees into trigonometric solvers expecting radians (`Math.sin`, Meeus ephemeris equations) without an explicit conversion.
2. **Ergonomic Type Aliases for Presentation & UI**:
   - Coordinates, sliders, and timeline parameters (`Latitude`, `Longitude`, `HoursDecimal`, `DayOfYear`, `Pixels`) remain pure `number` type aliases.
   - This eliminates casting friction across React components, SVG viewports, and native `<input>` form handlers.
3. **Conversion Gatekeepers**:
   - Dedicated gatekeeper utility functions (`toRadians(deg: Degrees): Radians`, `toDegrees(rad: Radians): Degrees`, `julianDateToCenturies(jd: JulianDate): JulianCenturies`) serve as the verified, compile-time bridges between distinct unit spaces.

---

## 🧪 Testing

The test harness uses **Vitest** to validate mathematical precision, hook edge cases, error boundary recovery, and asynchronous worker operations:

| Test Suite | File | Tests | Focus Areas |
| :--- | :--- | :--- | :--- |
| **Cosmic Math** | `src/utils/cosmicMath.test.ts` | 65 | Polar daylight singularities ($\pm 90^\circ$, continuous twilight), Julian dates, Meeus lunar series, disc illumination ($k$), nodal precession ($\Omega$), 365/366-day solar & lunar matrices, eclipse presets, smooth obscuration continuity |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` | 13 | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$) |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` | 17 | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, automatic synchronous fallback |
| **Dashboard Layout Hook** | `src/hooks/useDashboardLayout.test.ts` | 7 | Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` | 6 | Fault isolation, derived state error capture, and in-place module reset recovery |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` | 5 | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping |

Run the full suite with:
```bash
npm test -- --run
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, mathematical contracts, and verification standards for AI pair programming sessions.
