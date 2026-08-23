# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4.

---

## ✨ Features

- 🪐 **Gyro-Morph Dynamic Armillary & Astrolabe**: 
  - **Universal 5-Model Continuum**: Seamlessly unites the Copernican Solar System and historical Astrolabes across 5 continuous modes: `☉ Orbit` (Heliocentric Keplerian planetary orbit), `⊕ Apparent` (Geocentric apparent motion & 3D Celestial Armillary Sphere), `🧭 Rete` (Stereographic Conformal planisphere), `📐 Rojas` (Universal Rojas Orthographic on solstitial colure), and `🔭 Horizon` (Topocentric Horizon stereonet).
  - **Universal Any-to-Any 60 FPS Morphing & Staged Choreography**: Smooth topological vector morphing between any source model and any target model driven by animated ease-out cubic spring physics, with staged camera alignment, geometric unwrapping, and progressive astrolabe plate materialization.
  - **Keplerian Orbital Dynamics & Scale Controls**: True Scale ($1\times$, $e=0.0167$) vs. Exaggerated Eccentricity ($e=0.25$) modes, 6 seasonal milestone halo nodes (Perihelion, Aphelion, Solstices, Equinoxes), and live orbital physics HUD reporting Earth distance (AU/km), velocity (km/s), solar irradiance (%), and apparent diameter (arcmin).
  - **Clamped Ecliptic Track Sun Bead**: Mathematical clamping of the Sun bead directly to the Ecliptic ring curve ($r_0 \cos \lambda, r_0 \sin \lambda \sin \epsilon, r_0 \sin \lambda \cos \epsilon$), eliminating drift across seasons and Rete rotation.
  - **SED Precision Hairline Astrolabe Redesign**: Precision double-grooved hairline brass bezel (`#b45309`/`#78350f`, $0.75\text{px}$), delicate monospace Roman numeral micro-labels, slim $1.6\text{px}$ Alidade sighting arm with cyan laser sightline, and muted almucantars.
  - **Free Rete Spinning & Analog Astrolabe Solver**: Unlocks the golden Rete to spin freely with mouse/touch, converting the astrolabe into a functional analog computing instrument that solves the resulting **Apparent Solar Time** (`☉ HH:MM`) in real-time with **Snap to Now** clock resynchronization.
  - **Volumetric Laser Projection Cones & Focal Beacon**: Optical Center of Projection beacon (South Celestial Pole at $(0, -R_0, 0)$, Rojas orthogonal beam, Nadir) with radiating laser rays and translucent conic light envelopes.
  - **Interactive Alidade Sighting Arm with Pinnules & Snap-to-Star**: Authentic brass sighting arm with dual pinnule sighting vanes (pinhole slits), extended laser sightline, and **Click-to-Snap Target Locking** on stars (*Sirius*, *Vega*, *Arcturus*, *Rigel*), Sun, and Moon with live Alt/Az and RA/Dec sighting telemetry.
  - **Historical Horology**: Roman/Medieval 12 Unequal Planetary Hours with Chaldean planetary rulers, Local Sidereal Time ($\theta_{\text{LST}}$), and Greenwich Mean Sidereal Time ($\theta_{\text{GMST}}$).
- ☀️ **Solar Almanac & 24h Polar Sector Dial**: Solstice/equinox pathing, civil, nautical, and astronomical twilight durations, equation of time (analemma correction), solar noon, and daylight duration calculations with polar bounds handling, integrated side-by-side with the 24-hour circular Polar Clock dial featuring **Solar Noon vs. UTC Mode** segmented controls.
- 👁️ **Today's Sky Horizon Dome**: Instantaneous symmetrical twin $+90^\circ$ Sun & Moon Elevation Arc domes with live zenith angles, interactive **Solar Noon Click-to-Snap** action, solar noon / lunar transit peak tracking, borderless $1.5\times$ Moon Phase disc with rich glassmorphic hover popovers, and mirrored daily sunrise/sunset, moonrise/moonset, and declination metrics.
- 🌙 **Lunar Almanac & Ephemeris**: 365-day 24-hour moonrise and moonset braided ribbon chart with Zulu time indexing (0000Z to 2400Z vs Local Mean Time), real-time hairline time guide scanning, Meeus Ch. 48 true geocentric phase angle ($i$) and disc illumination ($k$), 2-step iterative high-latitude rise/set solver, perigee/apogee distance metrics in km and $R_E$, and astronomical parallactic angles.
- 🌊 **Gravitational Tidal Force Micro-View**: 2D Earth gravitational tidal force micro-view with an oceanic blue daylight hemisphere, harmonized multi-layered twilight boundary transitions (Astronomical, Nautical, Civil), and a dynamic ocean tidal wave oscillator reporting live Tidal Deformation Ratios from quadrature neap to syzygy spring tides.
- 🌒 **Side-by-Side Dual-Perspective Eclipse Demonstrator**: 
  - **Left Pane (Orbital Syzygy Profile & Shadow Rays)**: Strictly side-on ecliptic transverse profile with a 3D-projected inclined lunar orbital ring through Earth, tracking orbital elongation ($0^\circ \to 360^\circ$), ray-traced Umbra/Penumbra shadow cones, and a minimalist vector Earth with $23.44^\circ$ seasonal axial tilt, dashed blue equator chord, and longitude-synchronized day/night observer pin.
  - **Right Pane (Axial Sightline & 5.14° Nodes)**: Down-the-barrel view along the Sun-Earth sightline through Earth with partially eclipsed background Sun, vector Earth with $23.44^\circ$ projected axial tilt, dashed blue equator chord, dynamic rotating observer pin, and an open 3D elliptical orbital loop with physical 2D positioning on $X$ (transverse elongation) and $Y$ (ecliptic latitude $\beta$) showing true above/below miss geometry.
  - **Color-Coded Nodes & 2D Stroke Encoding**: Subtle **Sky Blue** (`#38bdf8`) for Ascending ($\beta \ge 0$, North of ecliptic) vs. **Crimson Red** (`#f43f5e`) for Descending ($\beta < 0$, South of ecliptic), and **Solid stroke** for Waxing ($0^\circ \to 180^\circ$) vs. **Dashed stroke** for Waning ($180^\circ \to 360^\circ$).
  - **Real-Time Annual Nodal Seasons**: Annual dynamic modulation of the orbital plane tilt driven by the Sun-Earth-Node angle ($\Delta \Omega$) and dynamically gliding Ascending ($\Omega$) and Descending ($\mho$) nodes.
  - **Exact Peak UTC Eclipse Presets**: Direct snapping to exact fractional UTC peak hours of greatest eclipse for 5 historical and future presets (Apr 2024, Oct 2024, Mar 2025 Blood Moon, Aug 2026, Aug 2027 Luxor).
  - **Terrestrial & Lunar POV Sky View**: Dynamic perspective switching between Earth observer sky (Totality Corona, Baily's Beads, Diamond Ring) and the astronaut Lunar Surface perspective (Earth eclipsing the Sun with the atmospheric crimson "Blood Ring").
- 🧭 **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct dragging of date (with full year tooltip), time, longitude, and linear latitude slider, with fast season jumps and direct military/time string parser.
- 🗺️ **Daylight Terminator Map**: Real-time Earth map with centered observer meridian, unified **Sky Blue (`#38bdf8`) observer location pin** with coordinate crosshairs, glowing Subsolar Point (Sun Zenith) and Sublunar Point (Moon Zenith) with **dynamic orbital distance and apparent diameter scaling** ($0.983\text{ AU} \to 1.017\text{ AU}$, $356,400\text{ km} \to 406,700\text{ km}$), and unclosed horizon boundary curves dividing daylight from civil, nautical, and astronomical twilight shadows with interactive glassmorphic HUD popovers.
- 🪐 **Solar System Macro Orbit**: Heliocentric Keplerian planetary orbit view with **segmented True Scale vs. Exaggerated toggle controls**, persistent glowing translucent halo nodes (Perihelion, Solstices, Equinoxes, Aphelion), 1 AU orbital physics HUD with collision-free diagonal arc labeling, and live syzygy indicators.
- 🌍 **LivingMarble Globe Visualizer**: Analytical spherical limb intersection and evenodd annular cutout eliminating backside terminator tearing and preserving deep-night contrast.
- 🎯 **Cross-Card Interactive Hover Sync**: Hovering over timestamps or calendar dates in any widget synchronizes time/elevation across all visible cards simultaneously.
- ⚡ **Web Worker Ephemeris Offloading**: Asynchronous, off-main-thread computation for heavy Meeus lunar and syzygy shadow algorithms via an application-level singleton worker manager with request multiplexing and automatic synchronous fallback.
- ⏱️ **External Chronometer Store**: High-frequency animation loops powered by React 19 `useSyncExternalStore` and `requestAnimationFrame` for 60 FPS performance without React re-render thrashing.
- 🛡️ **Fault-Tolerant Window Error Boundaries**: Dedicated React Error Boundaries wrap each visualization module, isolating rendering exceptions and providing an in-place module retry mechanism without crashing the dashboard.
- 🪟 **Modular Window Grid & Workspace Presets**: Drag-and-drop column reordering, resizing, locking, maximize/minimize modes, and curated presets (*Master Observatory*, *Renaissance Horology Suite*, *Solar Observation Suite*, *Lunar & Tidal Suite*, *Eclipse Mechanics Suite*, *Ultrawide 21:9 Observatory*).

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
- **Testing**: `vitest` (170 automated unit tests across 7 test suites: pure math, hooks, layout state, state store, error boundaries, widgets, armillary projections, and worker fallback)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run Vitest test suite (170 unit tests across 7 suites)
npm test

# Run full test suite in single-run CI mode
npm test -- --run
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
│   │   │   ├── lunar.ts         # Lunar ephemeris solver, nodal precession, parallactic angle & annual lunar matrix
│   │   │   ├── eclipse.ts       # Syzygy shadow geometry & eclipse scanner
│   │   │   ├── armillary.ts     # 3D Armillary & 2D Astrolabe projections (Stereo, Rojas, Horizon, Stars, Rete solver, Laser cones, Sighting alidade)
│   │   │   ├── projection.ts    # Earth axial tilt 3D projection, observer pin & 4-quadrant orbital stroke segments
│   │   │   └── geoData.ts       # World landmass continent outline polygons
│   │   └── cosmicMath.test.ts   # Vitest unit tests for math engine (98 tests)
│   ├── store/                   # External state store & chronometer controls
│   │   ├── cosmicStore.ts       # External state store & animation frame ticker
│   │   └── cosmicStore.test.ts  # Vitest unit tests for state store & selector equality (7 tests)
│   ├── workers/                 # Web Worker offload scripts
│   │   ├── ephemerisWorker.ts   # Dedicated worker for Meeus ephemeris, eclipse geometry & 365-day matrices
│   │   └── ephemerisWorkerManager.ts # Application singleton worker manager, deduplication & matrix cache
│   ├── hooks/
│   │   ├── useCosmicEngine.ts   # Selective domain engine hook (solar, lunar, eclipse, tides)
│   │   ├── useCosmicEngine.test.ts # Vitest hook unit tests (13 tests)
│   │   ├── useEphemerisWorker.ts # Custom hooks (instantaneous & annual solar/lunar matrix workers)
│   │   ├── useEphemerisWorker.test.ts # Vitest hook tests (19 tests)
│   │   ├── useDashboardLayout.ts # Window layout state, drag-and-drop, resize, locking, presets & storage
│   │   └── useDashboardLayout.test.ts # Vitest hook tests for layout manager (7 tests)
│   └── components/              # Grouped component architecture
│       ├── widgets/             # Core visualization widgets
│       │   ├── index.ts         # Central barrel export for all 8 observatory subsystems
│       │   ├── widgets.test.ts  # Vitest unit tests for 8 observatory widgets (10 tests)
│       │   ├── armillary/       # Decomposed Gyro-Morph Armillary & Astrolabe subsystem
│       │   │   ├── ArmillarySvgCanvas.tsx      # Interactive 3D Euler SVG viewport & Rete/Tympan
│       │   │   ├── ArmillaryHeaderControls.tsx # Mode pills, morph slider & spring-snap triggers
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
│   ├── controls/            # Interactive astrolabe inputs
│   │   ├── ArmillaryRail.tsx          # Slider control rail
│   │   ├── BufferedInput.tsx          # Blur/Enter commit input wrapper
│   │   ├── ControlRing.tsx            # Concentric drag ring
│   │   ├── LatitudeSlider.tsx         # Latitude coordinate slider
│   │   └── PolarLongitudeSelector.tsx # Polar stereographic longitude selector
│   ├── layout/              # Container layout modules
│   │   ├── ObsNavbar.tsx              # Top observatory brand navbar, presets & simulation layers
│   │   ├── DashboardWindow.tsx        # Draggable, resizable, lockable window wrapper
│   │   ├── OrbitalChronometer.tsx     # Master astrolabe dock container
│   │   └── chronometer/     # Decomposed astrolabe chronometer subsystem modules
│   │       ├── AstrolabeDial.tsx           # 4-concentric interactive SVG astrolabe dial
│   │       ├── ChronometerReadoutCards.tsx # Direct input cards & parseTimeString validator
│   │       ├── SolsticeJumpControls.tsx    # Twilight phase pill & solstice fast jumps
│   │       └── ChronometerModalPopovers.tsx # Accessible modal wrappers for Lat/Lon sliders
│   └── common/              # Shared visual components
│       ├── WindowErrorBoundary.tsx         # Fault-tolerant module error boundary
│       ├── WindowErrorBoundary.test.tsx    # Unit tests for error boundary (6 tests)
│       ├── LivingMarble.tsx                # Non-tearing 3D Earth globe visualizer
│       └── PhaseVisual.tsx                 # Lunar phase disc with parallactic tilt
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
| **Cosmic Math** | `src/utils/cosmicMath.test.ts` | 79 | Polar daylight singularities ($\pm 90^\circ$, continuous twilight), UTC date invariance & `createUTCDate`, Julian dates, Meeus lunar series, disc illumination ($k$), nodal precession ($\Omega$), 365/366-day solar & lunar matrices, eclipse presets, 3D projection obliquity & observer pin geometry |
| **Observatory Widgets** | `src/components/widgets/widgets.test.ts` | 9 | Modular barrel exports, contract assertions, and integrated domain ephemeris across all 7 observatory window subsystems |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` | 13 | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$) |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` | 19 | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, window lifecycle cleanup (`beforeunload`/`pagehide`), automatic synchronous fallback |
| **Dashboard Layout Hook** | `src/hooks/useDashboardLayout.test.ts` | 7 | Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` | 6 | Fault isolation, derived state error capture, and in-place module reset recovery |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` | 7 | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping |

Run the full suite with:
```bash
npm test -- --run
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, mathematical contracts, and verification standards for AI pair programming sessions.
