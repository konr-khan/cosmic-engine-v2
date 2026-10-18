# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, real-time astronomical observatory and ephemeris simulation engine built with React 19, TypeScript 7 (Strict Nominal Units), Vite 8, Tailwind CSS v4, and a dedicated Web Worker Ephemeris Engine.

Conceived and engineered from day one as an **exclusively AI pair-programmed system**, Cosmic Engine V2.0 pairs high-precision Jean Meeus astronomical algorithms and a unified 3D celestial scene graph with a deterministic, machine-verifiable engineering harness designed for zero-regression human-AI collaboration.

---

## 🤖 AI-Native Engineering & Guardrail Architecture

Rather than relying on informal conventions that drift across sessions, Cosmic Engine V2.0 encodes its mathematical, architectural, and visual invariants into **compile-time type firewalls, Babel AST linters, empirical physics conservation suites, and a strict Single-Source-of-Truth (SSoT) documentation graph**:

1. **Always-Loaded Operational Prompt Kernel ([`AGENTS.md`](./AGENTS.md))**:
   - Bounded strictly under `18.0 KB` (enforced by [`unitSafety.test.ts`](./src/types/unitSafety.test.ts)) to prevent context truncation.
   - Governs every AI session via a **3-Tier Blast-Radius Triage Protocol**, a **File-Glob $\rightarrow$ Test Router**, and explicit `DO` / `NEVER` AST code cards.
2. **Compile-Time Nominal Unit Firewall ([`src/types/units.ts`](./src/types/units.ts))**:
   - Angular metrics (`Degrees`, `Radians`) and epochs (`JulianDate`, `JulianCenturies`) use unique Symbol brands with forbidden brand intersections (`NotRadians`, `NotDegrees`).
   - Passing degrees into a trigonometric solver expecting radians (`Math.sin`, Meeus ephemeris series) or double-converting branded values fails at compile time (`npm run typecheck`).
3. **Programmatic Babel AST Guardrails ([`scripts/lintUnitSafety.mjs`](./scripts/lintUnitSafety.mjs))**:
   - **UI Unit Boundary**: Bans `asDegrees()` and `asRadians()` across all 116+ UI files in `src/components/**`, forcing presentation components through verified conversion gatekeepers (`latToRadians`, `lonToRadians`, `toRadians`).
   - **Mathematical Domain Purity**: Scans `src/utils/cosmicMath/**` to guarantee 0 React imports, 0 UI component imports, 0 Tailwind presentation tokens, and 0 unparameterized `new Date()` calls.
   - **Prop Identity Stability**: Bans `= new Date()` default parameter fallbacks across `src/components/**` and `src/hooks/**` (enforcing immutable `J2000_DATE` fallbacks) to prevent 60 FPS referential churn.
4. **Empirical Physics Conservation & Adversarial Stress Suites**:
   - Domain tests verify physical conservation laws directly—including Keplerian areal velocity invariance ($r^2\dot{\theta} = \text{const}$), vis-viva orbital energy conservation, 10,000-sample Monte Carlo stereographic ring invariants ($R_0\sec\epsilon$), and a strict **$< 0.8\text{ ms/frame}$ hot-loop latency budget** across 1,000 continuous frames.
5. **Institutional Memory & Anti-Pattern Ledger ([`DEAD_ENDS.md`](./DEAD_ENDS.md) & [`docs/adr/`](./docs/adr/))**:
   - Documents 43 Architecture Decision Records (`ADR 0001–0043`) and historical mathematical/rendering dead ends so future AI sessions never repeat discarded approaches.

---

## 🔭 The 8 Observatory Instruments & Core Engine

### Interactive Observatory Subsystems

| Instrument | Coordinate Frame & Projection | Key Capabilities | Primary Entry Point |
| :--- | :--- | :--- | :--- |
| **🪐 Gyro-Morph Armillary & Astrolabe** | Continuous 5-Model Morph (`☉ Orbit` $\leftrightarrow$ `⊕ Apparent` $\leftrightarrow$ `🧭 Rete` $\leftrightarrow$ `📐 Rojas` $\leftrightarrow$ `🔭 Horizon`) | 2-phase staged camera ($\lambda = 0.45$ pole lock), nodal plane snap (`[ ☊ Nodal ]`), conformal stereographic rings, Free Rete apparent solar time solver, star-locking Alidade & volumetric cones | [`GyroArmillaryView.tsx`](./src/components/widgets/armillary/GyroArmillaryView.tsx) |
| **👁️ Today's Sky Horizon Dome** | Topocentric Prime Vertical & Local Celestial Meridian (`2-Dome` / `4-Dome Quad`) | Dual Sun/Moon elevation & meridian domes, tropical culmination inversion detection, solstice & 18.6y lunar standstill swaths, 3-tier twilight strata & Draconic nodal countdown rail | [`TodayHorizonView.tsx`](./src/components/widgets/today/TodayHorizonView.tsx) |
| **☀️ Solar Almanac & Polar Dial** | Geocentric Declination & 24h Topocentric Polar Sector | Annual daylight ribbon scrubber, Equation of Time analemma metrics, civil/nautical/astronomical twilight bands, and interactive 24h circular polar sector dial (Solar Noon vs. UTC) | [`SolarAlmanacCard.tsx`](./src/components/widgets/solar/SolarAlmanacCard.tsx) |
| **🌙 Lunar Almanac & Ephemeris** | Geocentric Ecliptic & Topocentric Iterative Rise/Set | 365-day braided moonrise/moonset ribbon, 30-day synodic phase grid, Meeus phase angle ($i$) & illumination ($k$), circumpolar visibility solver, and ocean tidal wave oscillator | [`LunarAlmanacCard.tsx`](./src/components/widgets/lunar/LunarAlmanacCard.tsx) |
| **🌒 Dual-Perspective Eclipse Demonstrator** | Synchronized Geocentric Transverse Profile & Axial Sightline | Ray-traced Umbra/Penumbra shadow cones, prograde right-to-left lunar transit with dark backside optics, 4-quadrant nodal loop depth sorting, and 5 historical/future eclipse presets + recurrence scanner | [`EclipseDemonstrator.tsx`](./src/components/widgets/eclipse/EclipseDemonstrator.tsx) |
| **🗺️ Daylight Terminator Map** | Observer-Centered Cylindrical Equirectangular | Dynamic subsolar (AU) & sublunar (km) apparent disc scaling, 4-tier twilight shadow boundaries, analytical continent wrapping, and $\pm 12\text{h}$ diurnal ground tracks with antimeridian seam interpolation | [`TerminatorMap.tsx`](./src/components/widgets/terminator/TerminatorMap.tsx) |
| **🪐 Solar System Macro Orbit** | Heliocentric Ecliptic Top-Down (`True` $e=0.0167$ vs. `Exaggerated` $e=0.25$) | Interactive Keplerian orbit scrubbing, 6 persistent seasonal/orbital milestone halo nodes (Perihelion, Aphelion, Solstices, Equinoxes), and live 1 AU orbital physics telemetry | [`MacroOrbitView.tsx`](./src/components/widgets/macro/MacroOrbitView.tsx) |
| **🌊 Gravitational Tidal Micro-View** | Geocentric Equatorial & Lunar Nodal Plane | Earth-Moon gravitational differential vector field, 3D rotating `<MiniGlobe />`, prograde counter-clockwise Moon revolution, and spring-to-neap ocean potential ellipse deformation | [`MicroTideView.tsx`](./src/components/widgets/tides/MicroTideView.tsx) |

### Core Runtime & Concurrency Architecture

- **Unified 3D Astronomical Scene Graph ([`src/utils/cosmicMath/scene/`](./src/utils/cosmicMath/scene/))**: Single geometric source of truth generating Heliocentric, Geocentric, and Topocentric coordinates, $23.439^\circ$ Earth axial obliquity, $5.14^\circ$ inclined lunar orbit with continuous nodal precession $\Omega(t)$, and reusable `<MiniGlobe />` / `<MiniMoon />` SVG primitives.
- **60 FPS External Chronometer & Hover Stores ([`src/store/`](./src/store/))**: High-frequency animation loops (`cosmicStore.ts`) and 365-day ribbon scrubbing (`hoverStore.ts`) are isolated from React's top-level state tree via React 19 `useSyncExternalStore` with granular selector memoization.
- **Web Worker Ephemeris Multiplexer ([`src/workers/`](./src/workers/))**: Offloads heavy Meeus series and 365-day annual matrices to a dedicated worker thread via `ephemerisWorkerManager.ts` with 100ms trailing-edge flag-merging throttling, monotonic `requestId` stamps, pre-seeded LRU caches, and synchronous main-thread fallback (`workerFallback.ts`).
- **Interactive Astrolabe Chronometer & Fault-Tolerant Grid ([`src/components/layout/`](./src/components/layout/))**: 4-ring concentric SVG astrolabe dial (Date, Time, Longitude, Latitude) docked inside a 12-column drag-and-drop workspace where every lazy-loaded widget is isolated inside a self-recovering `<WindowErrorBoundary />`.

---

## 🗺️ Single-Source-of-Truth (SSoT) Documentation Map

To prevent documentation drift across AI pair-programming sessions, every architectural, mathematical, and visual concern lives in an **exclusive, non-overlapping Single Source of Truth**:

| Document | Exclusive Responsibility |
| :--- | :--- |
| **[`AGENTS.md`](./AGENTS.md)** | **Always-Loaded AI Prompt Kernel**: 3-tier blast-radius triage, file-glob test router, and enforced AST `DO`/`NEVER` code cards |
| **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** | **System Topology & Runtime Contracts**: 3D scene-graph dataflow diagram, TypeScript interface contracts, canonical file tree, and subsystem task router |
| **[`docs/MATH_SPEC.md`](./docs/MATH_SPEC.md)** | **Astronomical Math Specification**: Jean Meeus equations, coordinate transformations, stereographic invariants, and syzygy shadow geometry |
| **[`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)** | **Visual Tokens & Stroke Grammar**: Smallest Effective Difference (SED) principles, semantic colors (Sky Blue / Rose Red / Amber), and 2D/3D SVG stroke encodings |
| **[`DEAD_ENDS.md`](./DEAD_ENDS.md)** | **Historical Anti-Pattern Log**: Critical post-mortems of failed geometric, projection, camera staging, and worker concurrency approaches |
| **[`PROJECT.md`](./PROJECT.md)** | **Feature & Milestone Ledger**: Complete chronological inventory of completed features (`F1–F88`) and engineering milestones (`M1–M43`) |
| **[`docs/adr/`](./docs/adr/)** | **Architecture Decision Records**: 43 immutable decision records (`ADR 0001–0043`) with evolutionary amendment tracking |

---

## 🛠️ Tech Stack & Quick Start

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 7.0+ (Strict Mode with Symbol-branded units: `Degrees`, `Radians`, `JulianDate`, `JulianCenturies`)
- **Bundler & Dev Server**: Vite 8+ (`vite`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **State Management**: React 19 `useSyncExternalStore` subscription model (`src/store/cosmicStore.ts`, `src/store/hoverStore.ts`)
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer (`src/workers/ephemerisWorkerManager.ts`)
- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 59 modules, 886 tests)

```bash
# Install dependencies
npm install

# Start local development server (Vite HMR)
npm run dev

# Run the full mandatory verification gate (typecheck -> lint:units -> vitest -> build)
npm run verify

# Run targeted inner-loop checks
npm run typecheck          # TypeScript 7 strict nominal brand check (tsc --noEmit)
npm run lint:units         # Babel AST unit-safety, math-purity, default-Date & AGENTS.md budget linter
npm test                   # Full Vitest suite in single-run mode
npm run test:coverage      # Vitest with v8 coverage report

# Synchronize automated documentation metrics & master dossier
npm run sync:docs          # Updates live Vitest suite/test counts in README.md and AGENTS.md
npm run sync:dossier       # Compiles docs/COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md
```

---

## 🧪 Verification & Test Harness

The verification harness uses **Vitest** to validate mathematical precision, physical conservation laws, AST unit boundaries, error boundary recovery, adversarial camera transitions, depth stroke unification, 3D scene graphs, and asynchronous worker operations across 59 specialized domain suites (**886 tests**):

<details>
<summary><strong>📊 Expand Full 59-Suite Domain Test Registry (Auto-Synchronized via <code>npm run sync:docs</code>)</strong></summary>

| Domain Module | File | Focus Areas |
| :--- | :--- | :--- |
| **Core Astronomy & Time** | `src/utils/cosmicMath/core.test.ts` (30 tests) | Julian date engines, UTC date invariance & `createUTCDate`, time parsing & formatting, spherical linear interpolation (`slerp3D`), physical constants (`astroConstants`), and floating-point degeneracy protection |
| **Solar Ephemeris & Twilight** | `src/utils/cosmicMath/solar.test.ts` (15 tests) | Solar declination, equation of time, daily solar events (rise/set), civil/nautical/astronomical twilight bands, polar boundaries (midnight sun, polar night), and annual solar matrix |
| **Lunar Ephemeris & Illumination** | `src/utils/cosmicMath/lunar.test.ts` (16 tests) | Meeus lunar series, true geocentric phase angle ($i$), disc illumination ($k$), 2-step iterative rise/set solver, parallactic angle, nodal precession, and annual lunar matrix |
| **Today Sky & Diurnal Kinematics** | `src/utils/cosmicMath/todaySky.test.ts` (70 tests) | Sky dome coordinate projection ($X, Y$), diurnal path generation, celestial meridian coordinate projection and swaths (`calculateMeridianPoint`, `generateMeridianSwathD`), radial tick pins, monthly lunar declination bounds, Draconic nodal crossings (±15 days), and twilight status classification |
| **Eclipse Geometry & Presets** | `src/utils/cosmicMath/eclipse.test.ts` (26 tests) | Syzygy shadow geometry, analytical Umbra/Penumbra cones, all 5 historical and future eclipse presets, and recurrence scanner (`findUpcomingEclipses`) |
| **3D Obliquity & Earth Projections** | `src/utils/cosmicMath/projection.test.ts` (11 tests) | Earth axial obliquity ($23.439^\circ$), side & axial 3D geometry, observer pin projection, 4-quadrant orbital loops, and world continent landmass projections with analytical limb clipping |
| **Armillary Continuum & Projections** | `src/utils/cosmicMath/armillary/armillary.test.ts` (36 tests) | Universal 5-model Gyro-Morph continuum, GMST/LST solvers, Stereographic Conformal, Rojas Orthographic, Topocentric Horizon, Almucantars, unequal planetary hours, astrolabe stars, Free Rete solver, and closed-form stereographic conformal ring invariants ($R_0\sec\epsilon$) |
| **Armillary Benchmark** | `src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts` (5 tests) | 1,000-frame continuous latency budget (< 0.8 ms/frame), deterministic mathematical repeatability, non-NaN/non-Infinity geometric invariants across all 5 continuum modes, and milestone preservation |
| **Armillary Adversarial** | `src/utils/cosmicMath/armillary/m3_adversarial.test.ts` (7 tests) | Analytical closed-form Stereographic Ecliptic invariant ($R_0\sec\epsilon$), Sun bead clamping residuals ($< 1.42 \times 10^{-13}\text{ px}$), and 10,000-sample randomized Monte Carlo transitions |
| **Domain Invariants & Physics Conservation** | `src/utils/cosmicMath/domainInvariants.test.ts` (25 tests) | Empirical physics conservation laws: Keplerian areal velocity invariance ($r^2 \dot{\theta} = \text{const}$), vis-viva orbital energy conservation, syzygy collinearity bounds, and non-negative solar irradiance |
| **3D Scene Graph Math** | `src/utils/cosmicMath/scene/scene.test.ts` (34 tests) | 3D coordinate consistency across frames (Heliocentric, Geocentric, Terrestrial), True vs. Exaggerated Keplerian scale modes, 6 seasonal milestone coordinates, dynamic $5.14^\circ$ inclined lunar orbit with continuous nodal precession $\Omega(t)$, and 3D syzygy shadow cones |
| **Scene Cameras Stress** | `src/utils/cosmicMath/scene/cameras.stress.test.ts` (23 tests) | Stress testing canonical camera projections (TopDown, Transverse, Axial, Euler) under boundary epochs, extreme orbital distances, and rapid coordinate shifts |
| **Scene Coordinate Adversarial** | `src/utils/cosmicMath/scene/m1_adversarial.test.ts` (18 tests) | Coordinate frame invariants, axial tilt matrix preservation ($23.439^\circ$) in inertial space, and singular polar viewing angles |
| **Unit-Safety AST Guardrails** | `src/types/unitSafety.test.ts` (8 tests) | Babel AST lint enforcement banning `asDegrees()` and `asRadians()` across all UI components (`src/components/**`), and strict $\le 18\text{ KB}$ `AGENTS.md` kernel size budget |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` (13 tests) | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` (23 tests) | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$) |
| **Cosmic Scene Hook** | `src/hooks/useCosmicScene.test.ts` (5 tests) | Reactive 3D scene graph subscription, memoization stability, projection selector consistency (`useCosmicScene` and `useHeliocentricScene`), and `shallowEqual` protection |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` (31 tests) | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, window lifecycle cleanup (`beforeunload`/`pagehide`), automatic synchronous fallback |
| **Worker Parameter Sanitization & Clamping** | `src/workers/workerSanitizers.test.ts` (16 tests) | Boundary validation and clamping gatekeepers: Meeus year validity range ([-2000, 3000]), geographic latitude/longitude bounds, astronomical Julian Date clamping, decimal hour wrapping, and NaN/Infinity resilience |
| **Dashboard Layout Hook** | `src/hooks/useDashboardLayout.test.ts` (10 tests) | Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset |
| **MiniGlobe SVG Component** | `src/components/common/MiniGlobe.test.tsx` (14 tests) | 9-layer SVG rendering across 5 canonical view modes (`topdown`, `transverse`, `axial`, `euler3d`, `flat`), physical axial tilt rotation, subsolar terminator clipping, civil/nautical twilight bands, and DOM collision-safe `useId()` clipping |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` (9 tests) | Fault isolation, derived state error capture, and in-place module reset recovery for isolated module resilience |
| **Interactive Controls** | `src/components/controls/controls.test.tsx` (21 tests) | Interactive astrolabe controls: `ControlRing` 360° dial and wrapping, `LatitudeSlider` projection & presets, `PolarLongitudeSelector` needle & city jump, `BufferedInput` commit semantics, and `ArmillaryRail` arc sweep flags |
| **Dashboard Window Layout** | `src/components/layout/DashboardWindow.test.tsx` (17 tests) | Layout container architecture: `WindowErrorBoundary` containment, responsive grid column spanning (`col-span-12` vs `2xl:col-span-6`), 1-Col/2-Col action toggles, lock state protections, and HTML5 drag-and-drop contracts |
| **Layout & Chronometer Dock** | `src/components/layout/layout.test.tsx` (10 tests) | Integration tests for ObsNavbar workspace presets and simulation layers, OrbitalChronometer dock expansion/collapse with 7-branch twilight classification, and ChronometerReadoutCards coordinate clamping and military/AM-PM time parsing |
| **Ribbon Scrubber Hook** | `src/components/widgets/common/useRibbonScrubber.test.ts` (10 tests) | Bidirectional 2D coordinate scaling (dayToX, xToDay, timeToY, yToTime), synodic sub-window scaling, dragging state, and pointer capture lifecycle |
| **SkyDomeBase Primitive** | `src/components/widgets/today/SkyDomeBase.test.tsx` (19 tests) | Shared 260x120 SVG elevation arc geometry (`elR = 92`, `elCx = 130`, `elCy = 104`), zenith markers (+90°), cardinal compass labels (E, S, W), unreachable zenith cap, reference chords, and body elevation vectors |
| **Sky Dome Hooks & Primitives** | `src/components/widgets/today/SkyDomeHooksAndPrimitives.test.tsx` (12 tests) | Container/presenter hooks (`useMoonElevationMath`, `useSunElevationMath`), unified 4-column `SkyDomeFooter`, interactive `DraconicTimelineRail`, and reusable `LunarPhaseDisc` miniature crescent SVG renderer |
| **Today Horizon Widget** | `src/components/widgets/today/TodayWidget.test.tsx` (24 tests) | SunElevationDome and MoonElevationDome diurnal paths, SunMeridianDome and MoonMeridianDome celestial profiles, 2-Dome vs. 4-Dome Quad view switching, real-time vertical elevation kinematics, Solstice and Standstill swaths, and twilight/nodal mode toggles |
| **Meridian View-Model Config Helpers** | `src/components/widgets/today/hooks/meridianConfigHelpers.test.ts` (9 tests) | Strongly typed view-model builders for radial ticks, swaths, gate anchors, and peak targets deduplicating Sun and Moon meridian views |
| **Solar Almanac Widget** | `src/components/widgets/solar/SolarWidget.test.tsx` (8 tests) | Keplerian solar metrics, perihelion orbital dynamics, interactive SolarRibbonChart hover hairline, and PolarSunlightDial 24h circular polar sector dial |
| **Lunar Almanac Widget** | `src/components/widgets/lunar/LunarWidget.test.tsx` (6 tests) | 30-day synodic daily phase discs, 365-day annual braided ribbon, polar circumpolar statuses (24h moonlight / down all day), and TidalWaveOscillator ocean deformation wave |
| **Eclipse Demonstrator Widget** | `src/components/widgets/eclipse/EclipseWidget.test.tsx` (10 tests) | Historic Great American Eclipse data, 520x220 viewBox parity, dual-zone masking, nodal depth muting behind Earth, and prograde right-to-left SkyViewSimulator transit without bounce |
| **Terminator Map Widget** | `src/components/widgets/terminator/TerminatorMap.test.tsx` (10 tests) | Dynamic observer meridian centering, wrapped landmass polygons, topocentric YOU pin crosshairs, distance-scaled Subsolar (AU) and Sublunar (km) disc markers, and 4-tier twilight shadow boundaries |
| **Terminator Map Math Hook** | `src/components/widgets/terminator/hooks/useTerminatorMapMath.test.ts` (5 tests) | Astronomical coordinates, Keplerian disc scaling, hover overrides, ground-track toggles, and null-data fallbacks |
| **Macro Orbit Widget** | `src/components/widgets/macro/MacroOrbitWidget.test.tsx` (8 tests) | Heliocentric planetary orbit view, 6 Keplerian orbital milestones, True vs. Exaggerated scale toggles, and 1 AU orbital physics HUD |
| **Micro Tide Widget** | `src/components/widgets/tides/TidesWidget.test.tsx` (5 tests) | MicroTideView Earth tidal gravity, MiniGlobe 3D vector integration, segmented Nodal Loop and potential toggles, and counter-clockwise prograde Moon revolution |
| **Armillary Visualizer Widget** | `src/components/widgets/armillary/ArmillaryWidget.test.tsx` (25 tests) | Continuum model generation, camera staging timing (pitch/yaw at $\lambda=0.45$), Keplerian milestones, Ecliptic Sun bead clamping, double-grooved hairline bezel, volumetric laser cones, sighting alidade, and top-down ring stroke unification |
| **Staged Camera Hook** | `src/components/widgets/armillary/useStagedCamera.test.ts` (11 tests) | 2-phase Euler angle interpolation ($\lambda \le 0.45$), canonical pole locking ($\lambda \ge 0.45$), memory angle retention, and reverse transition unwinding |
| **Camera Staging Adversarial** | `src/components/widgets/armillary/m2_adversarial.test.ts` (9 tests) | Camera alignment timing ($0 \le \lambda \le 0.45$), canonical pole lock ($0.45 \le \lambda \le 1.0$), geodesic wrapping, and custom user 3D angle restoration |
| **Depth Stroke Unification** | `src/components/widgets/depthUnificationStress.test.ts` (11 tests) | Continuous stroke width scaling, dash gap closure, opacity interpolation, and duplicate path prevention over $\lambda \in [0.85, 1.0]$ |
| **Spherical Globe Projection & Clipping** | `src/utils/cosmicMath/globe.test.ts` (14 tests) | Spherical continent projection across 5 camera projections, analytical limb horizon clipping, polar edge cases, and twilight solar elevation limits |
| **Observatory Root Dashboard** | `src/App.test.tsx` (5 tests) | 12-column responsive layout grid, master preset windows, ObsNavbar branding, and OrbitalChronometer dock integration |
| **LRU Cache Utility** | `src/utils/lruCache.test.ts` (14 tests) | Generic LRU cache eviction order, capacity limits, promotion on get/set, and Map iterator ordering |
| **Solstice Jump Controls** | `src/components/layout/chronometer/SolsticeJumpControls.test.tsx` (9 tests) | Astronomical turning point buttons (Mar/Sep Equinox, Jun/Dec Solstice), UTC date dispatch, and twilight badge styles |
| **Astrolabe Dial Component** | `src/components/layout/chronometer/AstrolabeDial.test.tsx` (22 tests) | Concentric SVG control rings (Date, Time, Lon, Lat), observer-locked camera yaw calculations, latitude rail positioning, pointer event callbacks, and rollover boundaries |
| **Atomic Hover Store** | `src/store/hoverStore.test.ts` (4 tests) | High-frequency ribbon scrubber state isolation (`hoverTime`, `hoverDate`, and atomic batch updates), shallow equality memoization, and zero-cascade subscriber notifications |
| **Terminator Ground Tracks Math** | `src/utils/cosmicMath/terminatorTracks.test.ts` (16 tests) | 24-hour diurnal ground tracks ($[-12\text{h}, +12\text{h}]$) for Subsolar and Sublunar points, antimeridian seam wrapping (`buildSeamSafeSvgPath`), active ecliptic nodal beacons, and temporal vector dashes |
| **Armillary Interactions Hook** | `src/components/widgets/armillary/useArmillaryInteractions.test.ts` (24 tests) | Astrolabe touch and pointer interactions, camera dragging state isolation, model click-to-snap target dispatch, Free Rete angle calculation, and pointer capture lifecycles |
| **Terminator Hover HUD Component** | `src/components/widgets/terminator/TerminatorHoverHud.test.tsx` (4 tests) | Interactive Subsolar and Sublunar point hover cards, distance and apparent diameter telemetry, $\pm 24\text{h}$ proximity-gated nodal status badges, and astronomical coordinate formatting |
| **MiniMoon SVG Component** | `src/components/common/MiniMoon.test.tsx` (7 tests) | MiniMoon rendering across lunar phases, ascending/descending nodal coloring, waxing solid vs. waning dashed stroke styles, and eclipse umbral highlights |
| **Armillary Beads Layer** | `src/components/widgets/armillary/ArmillaryBeadsLayer.test.tsx` (14 tests) | Celestial body rendering, Moon phase illumination paths (`computeMoonPhasePath`), observer cone projections, 3D bead positioning, and Keplerian milestone styling |
| **Armillary Controls & HUD** | `src/components/widgets/armillary/ArmillaryControls.test.tsx` (9 tests) | Mode selector pills (`ArmillaryModePills`), continuum morph slider rail, layer visibility toggles, interactive hover HUD, and telemetry readout HUDs |
| **Nodal Plane Math Hook** | `src/components/widgets/eclipse/hooks/useNodalPlaneMath.test.ts` (6 tests) | Axial projection coordinates, umbra geometry and shadow containment, apparent angular diameters, 4-quadrant orbital stroke segments, and depth occlusion sorting |
| **Tide Math Hook** | `src/components/widgets/tides/hooks/useTideMath.test.ts` (8 tests) | Tidal gravity ellipse deformation ($r_x, r_y$), spring vs. neap alignment classification, orbital coordinate positioning, and presentation styling tokens |
| **Armillary Morphing Engine** | `src/utils/cosmicMath/armillary/armillaryMorph.test.ts` (10 tests) | Continuous 3D translation (Copernican to Geocentric, $\lambda \le 0.45$), observer horizon cone deformation, volumetric laser cone flattening, and boundary coordinate continuity |
| **Stereographic Conformal Invariants** | `src/utils/cosmicMath/armillary/armillaryStereographic.test.ts` (8 tests) | Analytical closed-form stereographic invariants ($R_0\sec\epsilon$), circle preservation under stereographic projection, non-degeneracy, and scale-invariance |
| **Temporal Formatters & Parsing** | `src/utils/formatters.test.ts` (11 tests) | UTC calendar date formatting (`formatYMD`), 24h & 12h AM/PM time string parsing (`parseTimeString`), HH:MM formatting, and edge case resilience |
| **Worker Synchronous Fallback** | `src/workers/workerFallback.test.ts` (26 tests) | Deterministic main-thread ephemeris fallback routines, annual matrix computation, cache integration, and failsafe zombie error handling |

</details>
