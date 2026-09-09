# 🌌 Cosmic Engine V2.0

**Cosmic Engine V2.0** is an interactive, browser-based astronomical simulation and ephemeris dashboard built with React 19, TypeScript (Strict Mode with Symbol-branded units), Vite, and Tailwind CSS v4.

---

## ✨ Features

- 🪐 **Gyro-Morph Dynamic Armillary & Astrolabe**: 
  - **Universal 5-Model Continuum**: Seamlessly unites the Copernican Solar System and historical Astrolabes across 5 continuous modes: `☉ Orbit` (Heliocentric Keplerian planetary orbit), `⊕ Apparent` (Geocentric apparent motion & 3D Celestial Armillary Sphere), `🧭 Rete` (Stereographic Conformal planisphere), `📐 Rojas` (Universal Rojas Orthographic on solstitial colure), and `🔭 Horizon` (Topocentric Horizon stereonet).
  - **Spherical SLERP & Geodesic Celestial Trajectories**: Pure great-circle spherical linear interpolation (`slerp3D`) on $S^2$ for the Sun, Moon, Earth, and all 6 seasonal orbital milestones, preserving exact radii and eliminating chord-cutting or center-dipping artifacts.
  - **Decoupled 2-Stage Staged $SO(3)$ Camera Alignment Choreography & Memory**: Strict 2-phase transition from 3D to 2D historical plates:
    - *Phase A ($\lambda \in [0.0 \to 0.45]$)*: Reorients camera pitch and yaw to canonical projection poles ($\text{Pitch} = 90^\circ$ for Stereographic/Horizon, $\text{Pitch} = 0^\circ$ for Rojas; $\text{Yaw} \to 0^\circ$) using shortest geodesic angular delta while preserving 100% rigid 3D spherical geometry ($\lambda_{\text{geom}} = 0$).
    - *Phase B ($\lambda \in [0.45 \to 1.0]$)*: Camera remains locked overhead while continuous projective flattening and plate decorations materialize.
    - *Symmetric Reverse Transitions*: Folds 2D geometry back into 3D sphere first, then smoothly restores custom user viewing angles with zero drift.
  - **Closed-Form Stereographic Conformal Projections**: True stereographic target geometry for the Ecliptic ring ($Y_c = -R_0\tan\epsilon$, $R_{\text{ecl}} = R_0/\cos\epsilon = R_0\sec\epsilon$) and celestial parallels (Equator $R=R_0$, Tropics $R=R_0\tan((90^\circ \mp \epsilon)/2)$), preserving true astronomical obliquity $\epsilon = 23.439^\circ$ without artificial decay.
  - **Continuous Depth-Split Stroke Unification**: Smoothly blends dashed back segments ($z < 0$) into solid paths over $\lambda \in [0.85, 1.0]$ with continuous opacity ($0.35 \to 1.0$), width matching front width, and dash gap closure.
  - **Continuous Conformal & Circle-Preserving Cross-Projections**: Smooth cross-projection transitions (`computeContinuousProjection2D`) with optical focal pulling ($d \in [R_0, \infty)$) and $SO(3)$ observer latitude rotation, ensuring celestial rings maintain their circularity without peanut distortion or vertex pulling.
  - **Progressive Almucantar & Bezel Materialization**: Smooth radial expansion ($94\% \to 100\%$) of the double-grooved brass bezel, progressive elevation curve fading from $\lambda = 0.15 \to 1.0$, and continuous sliding between eccentric stereographic almucantars and concentric horizon stereonet rings (`generateContinuousAlmucantars`).
  - **Overhauled Morph $\lambda$ Slider**: Expanded $28\text{px}$ touch target with event isolation (`stopPropagation`, `touch-action: none`) and fluid 60 FPS direct slider-to-canvas binding.
  - **Keplerian Orbital Dynamics & Scale Controls**: True Scale ($1\times$, $e=0.0167$) vs. Exaggerated Eccentricity ($e=0.25$) modes, dynamic $5.14^\circ$ lunar orbit silver ring in `☉ Orbit` mode, Orbit-mode exclusive lunar ascending/descending nodes (☊ and ☋), unified FOV/laser toggle button (`<Zap />`), 6 seasonal milestone halo nodes (Perihelion, Aphelion, Solstices, Equinoxes), and live orbital physics HUD reporting Earth distance (AU/km), velocity (km/s), solar irradiance (%), and apparent diameter (arcmin).
  - **Clamped Ecliptic Track Sun Bead**: Mathematical clamping of the Sun bead directly to the Ecliptic ring curve ($r_0 \cos \lambda, r_0 \sin \lambda \sin \epsilon, r_0 \sin \lambda \cos \epsilon$), eliminating drift across seasons and Rete rotation (residual $< 1.42 \times 10^{-13}\text{ px}$).
  - **SED Precision Hairline Astrolabe Redesign**: Precision double-grooved hairline brass bezel (`#b45309`/`#78350f`, $0.75\text{px}$), delicate monospace Roman numeral micro-labels, slim $1.6\text{px}$ Alidade sighting arm with cyan laser sightline, and muted almucantars.
  - **Free Rete Spinning & Analog Astrolabe Solver**: Unlocks the golden Rete to spin freely with mouse/touch, converting the astrolabe into a functional analog computing instrument that solves the resulting **Apparent Solar Time** (`☉ HH:MM`) in real-time with **Snap to Now** clock resynchronization.
  - **Volumetric Laser Projection Cones & Focal Beacon**: Optical Center of Projection beacon (South Celestial Pole at $(0, -R_0, 0)$, Rojas orthogonal beam, Nadir) with radiating laser rays and translucent conic light envelopes.
  - **Interactive Alidade Sighting Arm with Pinnules & Snap-to-Star**: Authentic brass sighting arm with dual pinnule sighting vanes (pinhole slits), extended laser sightline, and **Click-to-Snap Target Locking** on stars (*Sirius*, *Vega*, *Arcturus*, *Rigel*), Sun, and Moon with live Alt/Az and RA/Dec sighting telemetry.
  - **Historical Horology**: Roman/Medieval 12 Unequal Planetary Hours with Chaldean planetary rulers, Local Sidereal Time ($\theta_{\text{LST}}$), and Greenwich Mean Sidereal Time ($\theta_{\text{GMST}}$).
- ☀️ **Solar Almanac & 24h Polar Sector Dial**: Solstice/equinox pathing, civil, nautical, and astronomical twilight durations, equation of time (analemma correction), solar noon, and daylight duration calculations with polar bounds handling, integrated side-by-side with the 24-hour circular Polar Clock dial featuring **Solar Noon vs. UTC Mode** segmented controls.
- 👁️ **Today's Sky Horizon Dome**: Shared `<SkyDomeBase />` and `<MeridianDomeBase />` primitives consolidating symmetrical 260x138 SVG elevation arc and celestial colure meridian geometry (`EL_R = 92`, `EL_CX = 130`, `EL_CY = 104`), instantaneous symmetrical twin $+90^\circ$ Sun & Moon Elevation Arc domes with live zenith angles, dynamic hemisphere culmination meridian indicator (**S** for $\phi \ge 0^\circ$ vs. **N** for $\phi < 0^\circ$), interactive **Solar Noon Click-to-Snap** action, solar noon / lunar transit peak tracking, borderless $1.5\times$ Moon Phase disc with rich glassmorphic hover popovers, mirrored daily metrics with bottom 4-column summary metric panel (`grid-cols-4`) housing inline `[Std | Twilights]` and `[Std | ☊ Nodes]` mode toggles, harmonized atmospheric twilight strata colors (`#f59e0b`, `#64748b`, `#334155`), serene lunar silver (`#e2e8f0`) in Std mode, 4-quadrant Eclipse-convention nodal color/stroke encoding in Nodal mode, non-dashed subdued nocturnal trajectories (`strokeOpacity: 0.20`), strict 24-hour crossing gate (`nearestNodeDistDays <= 1.0`) targeting the nearest node event, and a centered $\pm 15$-day lookback/lookahead Draconic Progress Micro-Rail anchored at Today ($T=0, X=120$).
- 🧩 **Dynamic Widget Code-Splitting & Lazy Loading**: Dynamic `React.lazy()` imports wrapped in dark glassmorphic `<Suspense>` skeletons across all 8 observatory windows, slashing initial client bundle size by **50.4%** (down to 261 kB) and eliminating Vite chunk limit warnings.
- 🌙 **Lunar Almanac & Ephemeris**: 365-day 24-hour moonrise and moonset braided ribbon chart with Zulu time indexing (0000Z to 2400Z vs Local Mean Time), letterbox-immune timeline scanning via SVG CTM inverse transforms (`getScreenCTM()?.inverse()`), high-latitude circumpolar continuous visibility solver (`circumpolar_up` continuous moonlight, `circumpolar_down` sub-horizon), Meeus Ch. 48 true geocentric phase angle ($i$) and disc illumination ($k$), 2-step iterative high-latitude rise/set solver, perigee/apogee distance metrics in km and $R_E$, and astronomical parallactic angles.
- 🌊 **Gravitational Tidal Force Micro-View**: 2D Earth gravitational tidal force micro-view with unified 9-layer `<MiniGlobe />` featuring rotating 3D vector continents and day/night terminator, prograde counter-clockwise orbital coordination ($\theta_{\text{svg}} = -\theta_{\text{math}}$) aligning lunar revolution with Earth's rotation, segmented `[Standard | ☊ Nodal Loop]` toggle control decomposing the lunar orbit into 4 color/stroke-coded quadrants (Sky Blue `#38bdf8` for Ascending, Rose Red `#f43f5e` for Descending, Solid for Waxing, Dashed for Waning), dynamic Ascending ($\Omega$) and Descending ($\mho$) node pins, and a dynamic ocean tidal wave oscillator reporting live Tidal Deformation Ratios from quadrature neap to syzygy spring tides.
- 🌒 **Side-by-Side Dual-Perspective Eclipse Demonstrator**: 
  - **Left Pane (Orbital Syzygy Profile & Shadow Rays)**: Strictly side-on ecliptic transverse profile with a 3D-projected inclined lunar orbital ring through Earth, tracking orbital elongation ($0^\circ \to 360^\circ$), ray-traced Umbra/Penumbra shadow cones, and a minimalist vector Earth with $23.44^\circ$ seasonal axial tilt, dashed blue equator chord, and longitude-synchronized day/night observer pin.
  - **Right Pane (Axial Sightline & 5.14° Nodes)**: Down-the-barrel anti-solar view along the Sun-Earth sightline through Earth looking toward the partially eclipsed background Sun (perpetual night hemisphere on the front face of Earth), vector Earth with $23.44^\circ$ projected axial tilt, dashed blue equator chord, un-mirrored prograde West-to-East rotating continents ($xBody = -\cos\phi\sin H, zBody = -\cos\phi\cos H$), universal observer location pin (solid Sky Blue `#38bdf8` in daylight, hollow `#94a3b8` ring at night), and an open 3D elliptical orbital loop in full dimensional parity (`viewBox="0 0 520 220"`, $26:11$ aspect ratio, $R_x = 150\text{px}$, Earth $R = 24\text{px}$, Sun $R = 46\text{px}$) with physical prograde West-to-East positioning on $X$ ($s = -\sin(\text{phaseRad})$, transiting Right-to-Left across the Sun) and $Y$ (ecliptic latitude $\beta$) showing true above/below miss geometry.
  - **Color-Coded Nodes & 2D Stroke Encoding**: Subtle **Sky Blue** (`#38bdf8`) for Ascending ($\beta \ge 0$, North of ecliptic) vs. **Rose Red** (`#f43f5e`) for Descending ($\beta < 0$, South of ecliptic), and **Solid stroke** for Waxing ($0^\circ \to 180^\circ$) vs. **Dashed stroke** for Waning ($180^\circ \to 360^\circ$).
  - **Real-Time Annual Nodal Seasons**: Annual dynamic modulation of the orbital plane tilt driven by the Sun-Earth-Node angle ($\Delta \Omega$) and dynamically gliding Ascending ($\Omega$) and Descending ($\mho$) nodes.
  - **Exact Peak UTC Eclipse Presets**: Direct snapping to exact fractional UTC peak hours of greatest eclipse for 5 historical and future presets (Apr 2024, Oct 2024, Mar 2025 Blood Moon, Aug 2026, Aug 2027 Luxor).
  - **Central Path & Lunar POV Sky View**: Dynamic perspective switching between central totality track sky (Totality Corona, Baily's Beads, Diamond Ring) and the astronaut Lunar Surface perspective (Earth eclipsing the Sun with the atmospheric crimson "Blood Ring").
- 🧭 **Interactive Astrolabe Chronometer**: 4-concentric interactive SVG dial for direct dragging of date (with full year tooltip), time, longitude, and linear latitude slider, with fast season jumps and direct military/time string parser.
- 🗺️ **Daylight Terminator Map**: Real-time Earth map with centered observer meridian, unified **Sky Blue (`#38bdf8`) observer location pin** with coordinate crosshairs, glowing Subsolar Point (Sun Zenith) and Sublunar Point (Moon Zenith) with **dynamic orbital distance and apparent diameter scaling** ($0.983\text{ AU} \to 1.017\text{ AU}$, $356,400\text{ km} \to 406,700\text{ km}$), and unclosed horizon boundary curves dividing daylight from civil, nautical, and astronomical twilight shadows with interactive glassmorphic HUD popovers.
- 🪐 **Solar System Macro Orbit**: Heliocentric Keplerian planetary orbit view with **segmented True Scale vs. Exaggerated toggle controls**, persistent glowing translucent halo nodes (Perihelion, Solstices, Equinoxes, Aphelion), 1 AU orbital physics HUD with collision-free diagonal arc labeling, and live syzygy indicators.
- 🌍 **LivingMarble Globe Visualizer**: Analytical spherical limb intersection and evenodd annular cutout eliminating backside terminator tearing and preserving deep-night contrast.
- 🎯 **Cross-Card Interactive Hover Sync & Atomic Hover Store**: Dedicated external atomic `hoverStore` powered by React 19 `useSyncExternalStore` isolating high-frequency ribbon scrubber state (`hoveredDate`, `hoveredTime`, `hoverPosition`) from root component state, eliminating 60 FPS re-render cascades across un-hovered widgets and 3D scenes.
- ⚡ **Web Worker Ephemeris Offloading**: Asynchronous, off-main-thread computation for heavy Meeus lunar and syzygy shadow algorithms via an application-level singleton worker manager with monotonic sequence stamping (`requestId`), 100ms dispatch throttling, request multiplexing, and automatic synchronous fallback.
- 🌐 **Unified 3D Astronomical Scene Graph & Canonical Camera Rigs**:
  - **Single 3D Geometric Source of Truth**: Pure 3D inertial coordinates (`src/utils/cosmicMath/scene/`) uniting Heliocentric Keplerian orbits, Geocentric 5.14° inclined lunar orbit with continuous nodal precession $\Omega(t)$, physical $23.439^\circ$ Earth axial obliquity, and analytical Umbra/Penumbra syzygy shadow cones.
  - **Reusable High-Precision `<MiniGlobe />` SVG Component**: Modular 9-layer SVG Earth sphere (`src/components/common/MiniGlobe.tsx`) with physical $23.439^\circ$ axial tilt rotation, analytical subsolar day/night terminator hemisphere clipping, civil/nautical/astronomical twilight bands, Equator/Tropics parallels, and pulsing topocentric observer pin across 5 canonical view modes (`topdown`, `transverse`, `axial`, `euler3d`, `flat`).
  - **Canonical Camera Projection Pipelines**: Pure functional mathematical projections (`projectHeliocentricTopDown`, `projectGeocentricTransverse`, `projectGeocentricAxial`, `projectEulerCamera`) translating 3D scene geometry to 2D SVG canvas viewports.
  - **Reactive 60 FPS Scene Hooks**: `useCosmicScene` master hook and specialized selectors (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`) memoizing 3D scene data and projection outputs with React 19 `useSyncExternalStore` subscription and `shallowEqual` protection.
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
- **Concurrency**: Web Worker dedicated thread & singleton multiplexer
- **Testing**: `vitest` (Comprehensive automated unit test suite covering pure math, hooks, layout state, state store, error boundaries, observatory widgets, and worker fallback)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run Vitest test suite
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
├── vite.config.ts               # Vite configuration & plugin setup
├── tailwind.config.js           # Tailwind CSS configuration
├── README.md                    # Repository documentation & quick start
├── AGENTS.md                    # Agent protocols & full granular file navigation map
├── docs/                        # Persistent technical specifications & ADRs
│   ├── MATH_SPEC.md             # Canonical astronomical math & coordinate specification
│   ├── DESIGN_SYSTEM.md         # Canonical visual tokens, color semantics & stroke encodings
│   └── adr/                     # Architecture Decision Records (ADRs 0001-0014)
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
> For the complete, granular submodule file tree with all individual SVG canvas layers and decomposed modules, see [`AGENTS.md`](./AGENTS.md#3-repository-architecture).

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

The test harness uses **Vitest** to validate mathematical precision, hook edge cases, error boundary recovery, adversarial camera transitions, depth stroke unification, 3D scene graphs, and asynchronous worker operations across 40 specialized domain suites (**559 tests**):

| Domain Module | File | Focus Areas |
| :--- | :--- | :--- |
| **Core Astronomy & Time** | `src/utils/cosmicMath/core.test.ts` (39 tests) | Julian date engines, UTC date invariance & `createUTCDate`, time parsing & formatting, spherical linear interpolation (`slerp3D`), physical constants (`astroConstants`), and floating-point degeneracy protection |
| **Solar Ephemeris & Twilight** | `src/utils/cosmicMath/solar.test.ts` (16 tests) | Solar declination, equation of time, daily solar events (rise/set), civil/nautical/astronomical twilight bands, polar boundaries (midnight sun, polar night), and annual solar matrix |
| **Lunar Ephemeris & Illumination** | `src/utils/cosmicMath/lunar.test.ts` (16 tests) | Meeus lunar series, true geocentric phase angle ($i$), disc illumination ($k$), 2-step iterative rise/set solver, parallactic angle, nodal precession, and annual lunar matrix |
| **Today Sky & Diurnal Kinematics** | `src/utils/cosmicMath/todaySky.test.ts` (53 tests) | Sky dome coordinate projection ($X, Y$), diurnal path generation, celestial meridian coordinate projection and swaths (`calculateMeridianPoint`, `generateMeridianSwathD`), radial tick pins, monthly lunar declination bounds, Draconic nodal crossings (±15 days), and twilight status classification |
| **Eclipse Geometry & Presets** | `src/utils/cosmicMath/eclipse.test.ts` (22 tests) | Syzygy shadow geometry, analytical Umbra/Penumbra cones, all 5 historical and future eclipse presets, and recurrence scanner (`findUpcomingEclipses`) |
| **3D Obliquity & Earth Projections** | `src/utils/cosmicMath/projection.test.ts` (11 tests) | Earth axial obliquity ($23.439^circ$), side & axial 3D geometry, observer pin projection, 4-quadrant orbital loops, and world continent landmass projections with analytical limb clipping |
| **Armillary Continuum & Projections** | `src/utils/cosmicMath/armillary/armillary.test.ts` (34 tests) | Universal 5-model Gyro-Morph continuum, GMST/LST solvers, Stereographic Conformal, Rojas Orthographic, Topocentric Horizon, Almucantars, unequal planetary hours, astrolabe stars, Free Rete solver, and closed-form stereographic conformal ring invariants ($R_0secepsilon$) |
| **Armillary Benchmark** | `src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts` (5 tests) | 1,000-frame continuous latency budget (< 0.8 ms/frame), deterministic mathematical repeatability, non-NaN/non-Infinity geometric invariants across all 5 continuum modes, and milestone preservation |
| **Armillary Adversarial** | `src/utils/cosmicMath/armillary/m3_adversarial.test.ts` (7 tests) | Analytical closed-form Stereographic Ecliptic invariant ($R_0secepsilon$), Sun bead clamping residuals ($< 1.42 	imes 10^{-13}	ext{ px}$), and 10,000-sample randomized Monte Carlo transitions |
| **Domain Invariants & Physics Conservation** | `src/utils/cosmicMath/domainInvariants.test.ts` (10 tests) | Empirical physics conservation laws: Keplerian areal velocity invariance ($r^2 dot{	heta} = 	ext{const}$), vis-viva orbital energy conservation, syzygy collinearity bounds, and non-negative solar irradiance |
| **3D Scene Graph Math** | `src/utils/cosmicMath/scene/scene.test.ts` (33 tests) | 3D coordinate consistency across frames (Heliocentric, Geocentric, Terrestrial), True vs. Exaggerated Keplerian scale modes, 6 seasonal milestone coordinates, dynamic $5.14^circ$ inclined lunar orbit with continuous nodal precession $Omega(t)$, and 3D syzygy shadow cones |
| **Scene Cameras Stress** | `src/utils/cosmicMath/scene/cameras.stress.test.ts` (23 tests) | Stress testing canonical camera projections (TopDown, Transverse, Axial, Euler) under boundary epochs, extreme orbital distances, and rapid coordinate shifts |
| **Scene Coordinate Adversarial** | `src/utils/cosmicMath/scene/m1_adversarial.test.ts` (18 tests) | Coordinate frame invariants, axial tilt matrix preservation ($23.439^circ$) in inertial space, and singular polar viewing angles |
| **Unit-Safety AST Guardrails** | `src/types/unitSafety.test.ts` (2 tests) | Babel AST lint enforcement banning `asDegrees()` and `asRadians()` across all UI components (`src/components/**`), ensuring verified boundary conversion gatekeepers |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` (7 tests) | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` (20 tests) | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^circ	ext{N}, -90^circ	ext{S}$) |
| **Cosmic Scene Hook** | `src/hooks/useCosmicScene.test.ts` (9 tests) | Reactive 3D scene graph subscription, memoization stability, projection selector consistency (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`), and `shallowEqual` protection |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` (20 tests) | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, window lifecycle cleanup (`beforeunload`/`pagehide`), automatic synchronous fallback |
| **Dashboard Layout Hook** | `src/hooks/useDashboardLayout.test.ts` (8 tests) | Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset |
| **MiniGlobe SVG Component** | `src/components/common/MiniGlobe.test.tsx` (11 tests) | 9-layer SVG rendering across 5 canonical view modes (`topdown`, `transverse`, `axial`, `euler3d`, `flat`), physical axial tilt rotation, subsolar terminator clipping, civil/nautical twilight bands, and DOM collision-safe `useId()` clipping |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` (6 tests) | Fault isolation, derived state error capture, and in-place module reset recovery for isolated module resilience |
| **Interactive Controls** | `src/components/controls/controls.test.tsx` (19 tests) | Interactive astrolabe controls: `ControlRing` 360° dial and wrapping, `LatitudeSlider` projection & presets, `PolarLongitudeSelector` needle & city jump, `BufferedInput` commit semantics, and `ArmillaryRail` arc sweep flags |
| **Dashboard Window Layout** | `src/components/layout/DashboardWindow.test.tsx` (17 tests) | Layout container architecture: `WindowErrorBoundary` containment, responsive grid column spanning (`col-span-12` vs `2xl:col-span-6`), 1-Col/2-Col action toggles, lock state protections, and HTML5 drag-and-drop contracts |
| **Layout & Chronometer Dock** | `src/components/layout/layout.test.tsx` (8 tests) | Integration tests for ObsNavbar workspace presets and simulation layers, OrbitalChronometer dock expansion/collapse with 7-branch twilight classification, and ChronometerReadoutCards coordinate clamping and military/AM-PM time parsing |
| **Ribbon Scrubber Hook** | `src/components/widgets/common/useRibbonScrubber.test.ts` (9 tests) | Bidirectional 2D coordinate scaling (dayToX, xToDay, timeToY, yToTime), synodic sub-window scaling, dragging state, and pointer capture lifecycle |
| **SkyDomeBase Primitive** | `src/components/widgets/today/SkyDomeBase.test.tsx` (16 tests) | Shared 260x120 SVG elevation arc geometry (`elR = 92`, `elCx = 130`, `elCy = 104`), zenith markers (+90°), cardinal compass labels (E, S, W), unreachable zenith cap, reference chords, and body elevation vectors |
| **Today Horizon Widget** | `src/components/widgets/today/TodayWidget.test.tsx` (19 tests) | SunElevationDome and MoonElevationDome diurnal paths, SunMeridianDome and MoonMeridianDome celestial profiles, 2-Dome vs. 4-Dome Quad view switching, real-time vertical elevation kinematics, Solstice and Standstill swaths, and twilight/nodal mode toggles |
| **Solar Almanac Widget** | `src/components/widgets/solar/SolarWidget.test.tsx` (4 tests) | Keplerian solar metrics, perihelion orbital dynamics, interactive SolarRibbonChart hover hairline, and PolarSunlightDial 24h circular polar sector dial |
| **Lunar Almanac Widget** | `src/components/widgets/lunar/LunarWidget.test.tsx` (5 tests) | 30-day synodic daily phase discs, 365-day annual braided ribbon, polar circumpolar statuses (24h moonlight / down all day), and TidalWaveOscillator ocean deformation wave |
| **Eclipse Demonstrator Widget** | `src/components/widgets/eclipse/EclipseWidget.test.tsx` (9 tests) | Historic Great American Eclipse data, 520x220 viewBox parity, dual-zone masking, nodal depth muting behind Earth, and prograde right-to-left SkyViewSimulator transit without bounce |
| **Terminator Map Widget** | `src/components/widgets/terminator/TerminatorMap.test.tsx` (6 tests) | Dynamic observer meridian centering, wrapped landmass polygons, topocentric YOU pin crosshairs, distance-scaled Subsolar (AU) and Sublunar (km) disc markers, and 4-tier twilight shadow boundaries |
| **Macro Orbit Widget** | `src/components/widgets/macro/MacroOrbitWidget.test.tsx` (3 tests) | Heliocentric planetary orbit view, 6 Keplerian orbital milestones, True vs. Exaggerated scale toggles, and 1 AU orbital physics HUD |
| **Micro Tide Widget** | `src/components/widgets/tides/TidesWidget.test.tsx` (5 tests) | MicroTideView Earth tidal gravity, MiniGlobe 3D vector integration, segmented Nodal Loop and potential toggles, and counter-clockwise prograde Moon revolution |
| **Armillary Visualizer Widget** | `src/components/widgets/armillary/ArmillaryWidget.test.tsx` (17 tests) | Continuum model generation, camera staging timing (pitch/yaw at $lambda=0.45$), Keplerian milestones, Ecliptic Sun bead clamping, double-grooved hairline bezel, volumetric laser cones, sighting alidade, and top-down ring stroke unification |
| **Staged Camera Hook** | `src/components/widgets/armillary/useStagedCamera.test.ts` (9 tests) | 2-phase Euler angle interpolation ($lambda le 0.45$), canonical pole locking ($lambda ge 0.45$), memory angle retention, and reverse transition unwinding |
| **Camera Staging Adversarial** | `src/components/widgets/armillary/m2_adversarial.test.ts` (9 tests) | Camera alignment timing ($0 le lambda le 0.45$), canonical pole lock ($0.45 le lambda le 1.0$), geodesic wrapping, and custom user 3D angle restoration |
| **Depth Stroke Unification** | `src/components/widgets/depthUnificationStress.test.ts` (11 tests) | Continuous stroke width scaling, dash gap closure, opacity interpolation, and duplicate path prevention over $lambda in [0.85, 1.0]$ |
| **Spherical Globe Projection & Clipping** | `src/utils/cosmicMath/globe.test.ts` (14 tests) | Spherical continent projection across 5 camera projections, analytical limb horizon clipping, polar edge cases, and twilight solar elevation limits |
| **Observatory Root Dashboard** | `src/App.test.tsx` (5 tests) | 12-column responsive layout grid, master preset windows, ObsNavbar branding, and OrbitalChronometer dock integration |

Run the full suite with:
```bash
npm test -- --run
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, mathematical contracts, and verification standards for AI pair programming sessions.
