# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4.

---

## ✨ Features

- 🪐 **Gyro-Morph Dynamic Armillary & Astrolabe**: Seamless 5-model continuum uniting Copernican planetary orbits (`☉ Orbit`), geocentric celestial spheres (`⊕ Apparent`), stereographic astrolabes (`🧭 Rete`), universal orthographic plates (`📐 Rojas`), and topocentric horizon nets (`🔭 Horizon`). Features 2-stage staged camera alignment with memory retention, circle-preserving conformal projections, free Rete spinning with real-time Apparent Solar Time solving, interactive Alidade sighting with star-locking, and volumetric projection cones.
- ☀️ **Solar Almanac & 24h Polar Sector Dial**: Solstice and equinox pathing, 3-tier twilight durations (civil, nautical, astronomical), analemma equation of time, solar noon tracking, and polar day/night handling, integrated side-by-side with an interactive 24-hour circular polar dial with Solar Noon vs. UTC modes.
- 👁️ **Today's Sky Horizon Dome**: Real-time dual elevation domes for the Sun and Moon with live zenith tracking, dynamic hemisphere culmination detection (resolving tropical inversions), solar noon click-to-snap, 3-tier atmospheric twilight strata, lunar standstill and solstice swaths, and interactive Draconic nodal crossing countdown rails.
- 🌙 **Lunar Almanac & Ephemeris**: 365-day braided moonrise/moonset ribbon chart with Zulu time indexing, Meeus true geocentric phase angle ($i$) and disc illumination ($k$), iterative high-latitude rise/set solver with circumpolar continuous visibility detection, perigee/apogee distance metrics, and parallactic angles.
- 🌊 **Gravitational Tidal Force Micro-View**: 2D Earth-Moon gravitational tidal vector simulation featuring a 3D rotating `<MiniGlobe />`, prograde counter-clockwise orbital coordination, 4-quadrant color/stroke-coded nodal loops, and a dynamic ocean tidal wave oscillator tracking neap-to-spring deformation ratios.
- 🌒 **Side-by-Side Dual-Perspective Eclipse Demonstrator**: Synchronized dual perspectives uniting an edge-on ecliptic transverse profile with ray-traced Umbra/Penumbra shadow cones, and an axial sightline down-the-barrel view displaying true prograde lunar transits, color-coded nodal crossings, and 5 historical/future peak UTC presets.
- 🧭 **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct manipulation of calendar date (with full year tooltip), time, longitude, and latitude, with astronomical turning point jumps and direct military time string parsing.
- 🗺️ **Daylight Terminator Map**: Real-time cylindrical Earth projection with observer meridian centering, dynamic distance and apparent diameter scaling for Subsolar and Sublunar points, 4-tier twilight shadow boundaries, and 24-hour diurnal celestial ground tracks with antimeridian seam wrapping.
- 🪐 **Solar System Macro Orbit**: Heliocentric Keplerian planetary orbit view with True Scale ($e=0.0167$) vs. Exaggerated ($e=0.25$) scale modes, persistent glowing milestone halo nodes (Perihelion, Aphelion, Solstices, Equinoxes), and live orbital physics telemetry (irradiance, velocity, AU).
- 🧩 **Dynamic Code-Splitting & Lazy Loading**: Dynamic `React.lazy()` imports wrapped in dark glassmorphic `<Suspense>` skeletons across all observatory windows, cutting initial bundle size by 50% and eliminating chunk limit warnings.
- 🌐 **Unified 3D Astronomical Scene Graph**: Single geometric source of truth (`src/utils/cosmicMath/scene/`) uniting Heliocentric orbits, Geocentric inclined lunar orbits with continuous nodal precession, Earth axial obliquity, and reusable modular `<MiniGlobe />` with physical day/night terminator clipping.
- ⚡ **Web Worker Ephemeris Multiprocessing**: Offloads heavy Meeus ephemeris and syzygy shadow algorithms to dedicated Web Workers via a singleton manager with 100ms throttling, monotonic sequence stamping, and automatic synchronous fallback.
- ⏱️ **External 60 FPS Chronometer, Hover Stores & Render Decoupling**: High-frequency animation loops powered by React 19 `useSyncExternalStore` and `requestAnimationFrame`, isolating time ticking and ribbon scrubbing from the React render tree with parameterized selective hook selectors (`useCosmicEngine`, `useCosmicScene`) and decomposed, memoized widget content components to maintain smooth 60 FPS performance with zero unnecessary re-render cascades.
- 🛡️ **Fault-Tolerant Window Grid**: Responsive drag-and-drop workspace layout with customizable window sizing, lock states, curated workspace presets, and isolated React Error Boundaries for every widget.

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
- **Language**: TypeScript 7.0+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 8+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`)
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer
- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 49 modules, 793 tests)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run Vitest test suite in native single-run mode
npm test

# Run Vitest with v8 code coverage reporting
npm run test:coverage

# Run Babel AST branded unit-safety linter across all UI components
npm run lint:units

# Run automated documentation metric synchronizer
npm run sync:docs

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🏛️ Architecture Overview

```
Cosmic Engine V2.0/
├── index.html                   # HTML entry point with title & viewport config
├── package.json                 # Project dependencies & Vite scripts
├── tsconfig.json                # TypeScript root configuration (strict mode)
├── vite.config.ts               # Vite configuration & plugin setup
├── postcss.config.js            # PostCSS configuration
├── PROJECT.md                   # Master feature ledger (F1–F59) & milestone matrix (M1–M34)
├── README.md                    # Repository documentation & quick start
├── AGENTS.md                    # Agent protocols & full granular file navigation map
├── docs/                        # Persistent technical specifications & ADRs
│   ├── MATH_SPEC.md             # Canonical astronomical math & coordinate specification
│   ├── DESIGN_SYSTEM.md         # Canonical visual tokens, color semantics & stroke encodings
│   └── adr/                     # Architecture Decision Records (ADRs 0001–0034)
└── src/
    ├── main.tsx                 # React root renderer
    ├── App.tsx                  # Master Observatory dashboard container
    ├── types/                   # Symbol-branded nominal units, coordinates & RPC contracts
    ├── utils/cosmicMath/        # Pure astronomical mathematical algorithms, projections & scene graph
    │   └── scene/               # Unified 3D Astronomical Scene Graph & Camera Projection Rigs
    ├── store/                   # High-frequency external chronometer store (60 FPS ticker)
    ├── workers/                 # Web Worker offloading for Meeus ephemeris & annual matrices
    ├── hooks/                   # Custom domain hooks (engine, 3D scene, worker RPC, dashboard layout)
    └── components/              # Grouped visual component architecture
        ├── widgets/             # 8 core observatory subsystems (Armillary, Solar, Lunar, etc.)
        ├── controls/            # Interactive astrolabe dials, sliders & longitude selector
        ├── layout/              # Observatory navbar, window wrappers & chronometer dock
        └── common/              # Shared error boundaries, mini globe & phase discs
```

> [!TIP]
> For the complete, granular submodule file tree with all individual SVG canvas layers and decomposed modules, see [`PROJECT.md`](./PROJECT.md#code-layout).

---

## 📐 TypeScript Unit Typing Strategy

Cosmic Engine employs a **pragmatic hybrid typing model** that balances compile-time mathematical safety in orbital/trigonometric algorithms with frictionless React UI state management:

1. **Nominal Symbol Branding for High-Risk Invariants**:
   - Angular metrics (`Degrees`, `Radians`) and temporal epochs (`JulianDate`, `JulianCenturies`) use unique symbol-branded nominal types ([`src/types/units.ts`](src/types/units.ts)).
   - The TypeScript compiler will reject any attempt to pass degrees into trigonometric solvers expecting radians (`Math.sin`, Meeus ephemeris equations) without an explicit conversion.
2. **Ergonomic Type Aliases for Presentation & UI**:
   - Coordinates, sliders, and timeline parameters (`Latitude`, `Longitude`, `HoursDecimal`, `DayOfYear`, `Pixels`) remain pure `number` type aliases.
   - This eliminates casting friction across React components, SVG viewports, and native `<input>` form handlers.
3. **Conversion Gatekeepers & Boundary Contracts**:
   - Dedicated gatekeeper utility functions (`toRadians(deg: Degrees): Radians`, `toDegrees(rad: Radians): Degrees`, `julianDateToCenturies(jd: JulianDate): JulianCenturies`, `latToRadians(lat: Latitude): Radians`, `radiansToLat(rad: Radians): Latitude`, `lonToRadians(lon: Longitude): Radians`, `radiansToLon(rad: Radians): Longitude`) serve as verified, compile-time bridges between distinct unit spaces.
   - When crossing from UI parameters (`Latitude`, `Longitude`) into trigonometric solvers, parameters are explicitly wrapped and converted via `latToRadians(lat)` (or `toRadians(asDegrees(lat))`) to ensure type safety without unsafe casts.

---

## 🧪 Testing

The test harness uses **Vitest** to validate mathematical precision, hook edge cases, error boundary recovery, adversarial camera transitions, depth stroke unification, 3D scene graphs, and asynchronous worker operations across 49 specialized domain suites (**793 tests**):

| Domain Module | File | Focus Areas |
| :--- | :--- | :--- |
| **Core Astronomy & Time** | `src/utils/cosmicMath/core.test.ts` (41 tests) | Julian date engines, UTC date invariance & `createUTCDate`, time parsing & formatting, spherical linear interpolation (`slerp3D`), physical constants (`astroConstants`), and floating-point degeneracy protection |
| **Solar Ephemeris & Twilight** | `src/utils/cosmicMath/solar.test.ts` (16 tests) | Solar declination, equation of time, daily solar events (rise/set), civil/nautical/astronomical twilight bands, polar boundaries (midnight sun, polar night), and annual solar matrix |
| **Lunar Ephemeris & Illumination** | `src/utils/cosmicMath/lunar.test.ts` (16 tests) | Meeus lunar series, true geocentric phase angle ($i$), disc illumination ($k$), 2-step iterative rise/set solver, parallactic angle, nodal precession, and annual lunar matrix |
| **Today Sky & Diurnal Kinematics** | `src/utils/cosmicMath/todaySky.test.ts` (66 tests) | Sky dome coordinate projection ($X, Y$), diurnal path generation, celestial meridian coordinate projection and swaths (`calculateMeridianPoint`, `generateMeridianSwathD`), radial tick pins, monthly lunar declination bounds, Draconic nodal crossings (±15 days), and twilight status classification |
| **Eclipse Geometry & Presets** | `src/utils/cosmicMath/eclipse.test.ts` (25 tests) | Syzygy shadow geometry, analytical Umbra/Penumbra cones, all 5 historical and future eclipse presets, and recurrence scanner (`findUpcomingEclipses`) |
| **3D Obliquity & Earth Projections** | `src/utils/cosmicMath/projection.test.ts` (11 tests) | Earth axial obliquity ($23.439^circ$), side & axial 3D geometry, observer pin projection, 4-quadrant orbital loops, and world continent landmass projections with analytical limb clipping |
| **Armillary Continuum & Projections** | `src/utils/cosmicMath/armillary/armillary.test.ts` (54 tests) | Universal 5-model Gyro-Morph continuum, GMST/LST solvers, Stereographic Conformal, Rojas Orthographic, Topocentric Horizon, Almucantars, unequal planetary hours, astrolabe stars, Free Rete solver, and closed-form stereographic conformal ring invariants ($R_0secepsilon$) |
| **Armillary Benchmark** | `src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts` (5 tests) | 1,000-frame continuous latency budget (< 0.8 ms/frame), deterministic mathematical repeatability, non-NaN/non-Infinity geometric invariants across all 5 continuum modes, and milestone preservation |
| **Armillary Adversarial** | `src/utils/cosmicMath/armillary/m3_adversarial.test.ts` (7 tests) | Analytical closed-form Stereographic Ecliptic invariant ($R_0secepsilon$), Sun bead clamping residuals ($< 1.42 	imes 10^{-13}	ext{ px}$), and 10,000-sample randomized Monte Carlo transitions |
| **Domain Invariants & Physics Conservation** | `src/utils/cosmicMath/domainInvariants.test.ts` (24 tests) | Empirical physics conservation laws: Keplerian areal velocity invariance ($r^2 dot{	heta} = 	ext{const}$), vis-viva orbital energy conservation, syzygy collinearity bounds, and non-negative solar irradiance |
| **3D Scene Graph Math** | `src/utils/cosmicMath/scene/scene.test.ts` (34 tests) | 3D coordinate consistency across frames (Heliocentric, Geocentric, Terrestrial), True vs. Exaggerated Keplerian scale modes, 6 seasonal milestone coordinates, dynamic $5.14^circ$ inclined lunar orbit with continuous nodal precession $Omega(t)$, and 3D syzygy shadow cones |
| **Scene Cameras Stress** | `src/utils/cosmicMath/scene/cameras.stress.test.ts` (23 tests) | Stress testing canonical camera projections (TopDown, Transverse, Axial, Euler) under boundary epochs, extreme orbital distances, and rapid coordinate shifts |
| **Scene Coordinate Adversarial** | `src/utils/cosmicMath/scene/m1_adversarial.test.ts` (18 tests) | Coordinate frame invariants, axial tilt matrix preservation ($23.439^circ$) in inertial space, and singular polar viewing angles |
| **Unit-Safety AST Guardrails** | `src/types/unitSafety.test.ts` (4 tests) | Babel AST lint enforcement banning `asDegrees()` and `asRadians()` across all UI components (`src/components/**`), and strict $\le 18\text{ KB}$ `AGENTS.md` kernel size budget |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` (9 tests) | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` (23 tests) | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^circ	ext{N}, -90^circ	ext{S}$) |
| **Cosmic Scene Hook** | `src/hooks/useCosmicScene.test.ts` (5 tests) | Reactive 3D scene graph subscription, memoization stability, projection selector consistency (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`), and `shallowEqual` protection |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` (30 tests) | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, window lifecycle cleanup (`beforeunload`/`pagehide`), automatic synchronous fallback |
| **Worker Parameter Sanitization & Clamping** | `src/workers/workerSanitizers.test.ts` (16 tests) | Boundary validation and clamping gatekeepers: Meeus year validity range ([-2000, 3000]), geographic latitude/longitude bounds, astronomical Julian Date clamping, decimal hour wrapping, and NaN/Infinity resilience |
| **Dashboard Layout Hook** | `src/hooks/useDashboardLayout.test.ts` (8 tests) | Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset |
| **MiniGlobe SVG Component** | `src/components/common/MiniGlobe.test.tsx` (12 tests) | 9-layer SVG rendering across 5 canonical view modes (`topdown`, `transverse`, `axial`, `euler3d`, `flat`), physical axial tilt rotation, subsolar terminator clipping, civil/nautical twilight bands, and DOM collision-safe `useId()` clipping |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` (9 tests) | Fault isolation, derived state error capture, and in-place module reset recovery for isolated module resilience |
| **Interactive Controls** | `src/components/controls/controls.test.tsx` (19 tests) | Interactive astrolabe controls: `ControlRing` 360° dial and wrapping, `LatitudeSlider` projection & presets, `PolarLongitudeSelector` needle & city jump, `BufferedInput` commit semantics, and `ArmillaryRail` arc sweep flags |
| **Dashboard Window Layout** | `src/components/layout/DashboardWindow.test.tsx` (17 tests) | Layout container architecture: `WindowErrorBoundary` containment, responsive grid column spanning (`col-span-12` vs `2xl:col-span-6`), 1-Col/2-Col action toggles, lock state protections, and HTML5 drag-and-drop contracts |
| **Layout & Chronometer Dock** | `src/components/layout/layout.test.tsx` (8 tests) | Integration tests for ObsNavbar workspace presets and simulation layers, OrbitalChronometer dock expansion/collapse with 7-branch twilight classification, and ChronometerReadoutCards coordinate clamping and military/AM-PM time parsing |
| **Ribbon Scrubber Hook** | `src/components/widgets/common/useRibbonScrubber.test.ts` (10 tests) | Bidirectional 2D coordinate scaling (dayToX, xToDay, timeToY, yToTime), synodic sub-window scaling, dragging state, and pointer capture lifecycle |
| **SkyDomeBase Primitive** | `src/components/widgets/today/SkyDomeBase.test.tsx` (18 tests) | Shared 260x120 SVG elevation arc geometry (`elR = 92`, `elCx = 130`, `elCy = 104`), zenith markers (+90°), cardinal compass labels (E, S, W), unreachable zenith cap, reference chords, and body elevation vectors |
| **Sky Dome Hooks & Primitives** | `src/components/widgets/today/SkyDomeHooksAndPrimitives.test.tsx` (11 tests) | Container/presenter hooks (`useMoonElevationMath`, `useSunElevationMath`), unified 4-column `SkyDomeFooter`, interactive `DraconicTimelineRail`, and reusable `LunarPhaseDisc` miniature crescent SVG renderer |
| **Today Horizon Widget** | `src/components/widgets/today/TodayWidget.test.tsx` (24 tests) | SunElevationDome and MoonElevationDome diurnal paths, SunMeridianDome and MoonMeridianDome celestial profiles, 2-Dome vs. 4-Dome Quad view switching, real-time vertical elevation kinematics, Solstice and Standstill swaths, and twilight/nodal mode toggles |
| **Solar Almanac Widget** | `src/components/widgets/solar/SolarWidget.test.tsx` (7 tests) | Keplerian solar metrics, perihelion orbital dynamics, interactive SolarRibbonChart hover hairline, and PolarSunlightDial 24h circular polar sector dial |
| **Lunar Almanac Widget** | `src/components/widgets/lunar/LunarWidget.test.tsx` (5 tests) | 30-day synodic daily phase discs, 365-day annual braided ribbon, polar circumpolar statuses (24h moonlight / down all day), and TidalWaveOscillator ocean deformation wave |
| **Eclipse Demonstrator Widget** | `src/components/widgets/eclipse/EclipseWidget.test.tsx` (9 tests) | Historic Great American Eclipse data, 520x220 viewBox parity, dual-zone masking, nodal depth muting behind Earth, and prograde right-to-left SkyViewSimulator transit without bounce |
| **Terminator Map Widget** | `src/components/widgets/terminator/TerminatorMap.test.tsx` (10 tests) | Dynamic observer meridian centering, wrapped landmass polygons, topocentric YOU pin crosshairs, distance-scaled Subsolar (AU) and Sublunar (km) disc markers, and 4-tier twilight shadow boundaries |
| **Terminator Map Math Hook** | `src/components/widgets/terminator/hooks/useTerminatorMapMath.test.ts` (5 tests) | Astronomical coordinates, Keplerian disc scaling, hover overrides, ground-track toggles, and null-data fallbacks |
| **Macro Orbit Widget** | `src/components/widgets/macro/MacroOrbitWidget.test.tsx` (4 tests) | Heliocentric planetary orbit view, 6 Keplerian orbital milestones, True vs. Exaggerated scale toggles, and 1 AU orbital physics HUD |
| **Micro Tide Widget** | `src/components/widgets/tides/TidesWidget.test.tsx` (5 tests) | MicroTideView Earth tidal gravity, MiniGlobe 3D vector integration, segmented Nodal Loop and potential toggles, and counter-clockwise prograde Moon revolution |
| **Armillary Visualizer Widget** | `src/components/widgets/armillary/ArmillaryWidget.test.tsx` (46 tests) | Continuum model generation, camera staging timing (pitch/yaw at $lambda=0.45$), Keplerian milestones, Ecliptic Sun bead clamping, double-grooved hairline bezel, volumetric laser cones, sighting alidade, and top-down ring stroke unification |
| **Staged Camera Hook** | `src/components/widgets/armillary/useStagedCamera.test.ts` (9 tests) | 2-phase Euler angle interpolation ($lambda le 0.45$), canonical pole locking ($lambda ge 0.45$), memory angle retention, and reverse transition unwinding |
| **Camera Staging Adversarial** | `src/components/widgets/armillary/m2_adversarial.test.ts` (9 tests) | Camera alignment timing ($0 le lambda le 0.45$), canonical pole lock ($0.45 le lambda le 1.0$), geodesic wrapping, and custom user 3D angle restoration |
| **Depth Stroke Unification** | `src/components/widgets/depthUnificationStress.test.ts` (11 tests) | Continuous stroke width scaling, dash gap closure, opacity interpolation, and duplicate path prevention over $lambda in [0.85, 1.0]$ |
| **Spherical Globe Projection & Clipping** | `src/utils/cosmicMath/globe.test.ts` (14 tests) | Spherical continent projection across 5 camera projections, analytical limb horizon clipping, polar edge cases, and twilight solar elevation limits |
| **Observatory Root Dashboard** | `src/App.test.tsx` (5 tests) | 12-column responsive layout grid, master preset windows, ObsNavbar branding, and OrbitalChronometer dock integration |
| **LRU Cache Utility** | `src/utils/lruCache.test.ts` (14 tests) | Generic LRU cache eviction order, capacity limits, promotion on get/set, and Map iterator ordering |
| **Solstice Jump Controls** | `src/components/layout/chronometer/SolsticeJumpControls.test.tsx` (9 tests) | Astronomical turning point buttons (Mar/Sep Equinox, Jun/Dec Solstice), UTC date dispatch, and twilight badge styles |
| **Astrolabe Dial Component** | `src/components/layout/chronometer/AstrolabeDial.test.tsx` (21 tests) | Concentric SVG control rings (Date, Time, Lon, Lat), observer-locked camera yaw calculations, latitude rail positioning, pointer event callbacks, and rollover boundaries |
| **Atomic Hover Store** | `src/store/hoverStore.test.ts` (4 tests) | High-frequency ribbon scrubber state isolation (`hoveredDate`, `hoveredTime`, `hoverPosition`), shallow equality memoization, and zero-cascade subscriber notifications |
| **Terminator Ground Tracks Math** | `src/utils/cosmicMath/terminatorTracks.test.ts` (15 tests) | 24-hour diurnal ground tracks ($[-12\text{h}, +12\text{h}]$) for Subsolar and Sublunar points, antimeridian seam wrapping (`buildSeamSafeSvgPath`), active ecliptic nodal beacons, and temporal vector dashes |
| **Armillary Interactions Hook** | `src/components/widgets/armillary/useArmillaryInteractions.test.ts` (24 tests) | Astrolabe touch and pointer interactions, camera dragging state isolation, model click-to-snap target dispatch, Free Rete angle calculation, and pointer capture lifecycles |
| **Terminator Hover HUD Component** | `src/components/widgets/terminator/TerminatorHoverHud.test.tsx` (4 tests) | Interactive Subsolar and Sublunar point hover cards, distance and apparent diameter telemetry, $\pm 24\text{h}$ proximity-gated nodal status badges, and astronomical coordinate formatting |

Run the full suite with:
```bash
npm test -- --run
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, mathematical contracts, and verification standards for AI pair programming sessions.
