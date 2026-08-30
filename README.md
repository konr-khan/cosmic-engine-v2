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
  - **Closed-Form Stereographic Conformal Projections**: True stereographic target geometry for the Ecliptic ring ($Y_c = -R_0\tan(\epsilon/2)$, $R_{\text{ecl}} = R_0/\cos\epsilon$) and celestial parallels (Equator $R=R_0$, Tropics $R=R_0\tan((90^\circ \mp \epsilon)/2)$), preserving true astronomical obliquity $\epsilon = 23.439^\circ$ without artificial decay.
  - **Continuous Depth-Split Stroke Unification**: Smoothly blends dashed back segments ($z < 0$) into solid paths over $\lambda \in [0.85, 1.0]$ with continuous opacity ($0.35 \to 1.0$), width matching front width, and dash gap closure.
  - **Continuous Conformal & Circle-Preserving Cross-Projections**: Smooth cross-projection transitions (`computeContinuousProjection2D`) with optical focal pulling ($d \in [R_0, \infty)$) and $SO(3)$ observer latitude rotation, ensuring celestial rings maintain their circularity without peanut distortion or vertex pulling.
  - **Progressive Almucantar & Bezel Materialization**: Smooth radial expansion ($94\% \to 100\%$) of the double-grooved brass bezel, progressive elevation curve fading from $\lambda = 0.15 \to 1.0$, and continuous sliding between eccentric stereographic almucantars and concentric horizon stereonet rings (`generateContinuousAlmucantars`).
  - **Overhauled Morph $\lambda$ Slider**: Expanded $28\text{px}$ touch target with event isolation (`stopPropagation`, `touch-action: none`) and fluid 60 FPS direct slider-to-canvas binding.
  - **Keplerian Orbital Dynamics & Scale Controls**: True Scale ($1\times$, $e=0.0167$) vs. Exaggerated Eccentricity ($e=0.25$) modes, 6 seasonal milestone halo nodes (Perihelion, Aphelion, Solstices, Equinoxes), and live orbital physics HUD reporting Earth distance (AU/km), velocity (km/s), solar irradiance (%), and apparent diameter (arcmin).
  - **Clamped Ecliptic Track Sun Bead**: Mathematical clamping of the Sun bead directly to the Ecliptic ring curve ($r_0 \cos \lambda, r_0 \sin \lambda \sin \epsilon, r_0 \sin \lambda \cos \epsilon$), eliminating drift across seasons and Rete rotation (residual $< 1.42 \times 10^{-13}\text{ px}$).
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
│   └── adr/                     # Architecture Decision Records (ADRs 0001-0003)
└── src/
    ├── main.tsx                 # React root renderer
    ├── App.tsx                  # Master Observatory dashboard container
    ├── types/                   # Symbol-branded nominal units, coordinates & RPC contracts
    ├── utils/cosmicMath/        # Pure astronomical mathematical algorithms & projections
    ├── store/                   # High-frequency external chronometer store (60 FPS ticker)
    ├── workers/                 # Web Worker offloading for Meeus ephemeris & annual matrices
    ├── hooks/                   # Custom domain hooks (engine, worker RPC, dashboard layout)
    └── components/              # Grouped visual component architecture
        ├── widgets/             # 8 core observatory subsystems (Armillary, Solar, Lunar, etc.)
        ├── controls/            # Interactive astrolabe dials, sliders & longitude selector
        ├── layout/              # Observatory navbar, window wrappers & chronometer dock
        └── common/              # Shared error boundaries, globe visualizer & phase discs
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
3. **Conversion Gatekeepers**:
   - Dedicated gatekeeper utility functions (`toRadians(deg: Degrees): Radians`, `toDegrees(rad: Radians): Degrees`, `julianDateToCenturies(jd: JulianDate): JulianCenturies`) serve as the verified, compile-time bridges between distinct unit spaces.

---

## 🧪 Testing

The test harness uses **Vitest** to validate mathematical precision, hook edge cases, error boundary recovery, adversarial camera transitions, depth stroke unification, and asynchronous worker operations across 9 specialized domain suites:

| Domain Module | File | Focus Areas |
| :--- | :--- | :--- |
| **Cosmic Math** | `src/utils/cosmicMath.test.ts` (130 tests) | Polar daylight singularities ($\pm 90^\circ$, continuous twilight), UTC date invariance & `createUTCDate`, Julian dates, Meeus lunar series, disc illumination ($k$), nodal precession ($\Omega$), 365/366-day solar & lunar matrices, eclipse presets, 3D projection obliquity & observer pin geometry, closed-form stereographic conformal ring invariants ($R_0 \sec\epsilon$), and 5-model Gyro-Morph continuum |
| **Observatory Widgets** | `src/components/widgets/widgets.test.ts` (24 tests) | Modular barrel exports, contract assertions, and integrated domain ephemeris across all 8 observatory window subsystems, including camera pole timing and depth stroke unification |
| **Camera Staging Adversarial** | `src/components/widgets/armillary/m2_adversarial.test.ts` (6 tests) | Camera alignment timing ($0 \le \lambda \le 0.45$), canonical pole lock ($0.45 \le \lambda \le 1.0$), geodesic wrapping, and custom user 3D angle restoration |
| **Depth Stroke Unification** | `src/components/widgets/depthUnificationStress.test.ts` (5 tests) | Continuous stroke width scaling, dash gap closure, opacity interpolation, and duplicate path prevention over $\lambda \in [0.85, 1.0]$ |
| **Cosmic Engine Hook** | `src/hooks/useCosmicEngine.test.ts` (13 tests) | Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$) |
| **Ephemeris Worker Hook** | `src/hooks/useEphemerisWorker.test.ts` (19 tests) | Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, window lifecycle cleanup (`beforeunload`/`pagehide`), automatic synchronous fallback |
| **Dashboard Layout Hook** | `src/hooks/useDashboardLayout.test.ts` (7 tests) | Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset |
| **Window Error Boundary** | `src/components/common/WindowErrorBoundary.test.tsx` (0 isolated errors) | Fault isolation, derived state error capture, and in-place module reset recovery |
| **Cosmic State Store** | `src/store/cosmicStore.test.ts` (7 tests) | Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping |

Run the full suite with:
```bash
npm test -- --run
```

---

## 🤖 Agent & Pair Programming Guidelines

This project maintains an active [`AGENTS.md`](./AGENTS.md) guide detailing architecture maps, coding invariants, performance rules, mathematical contracts, and verification standards for AI pair programming sessions.
