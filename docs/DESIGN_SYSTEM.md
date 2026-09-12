# DESIGN_SYSTEM.md — Visual Tokens, Color Semantics & Interaction Grammar

This document codifies the design language, color tokens, 2D vector stroke encodings, and glassmorphic UI rules for **Cosmic Engine V2.0**.

---

## 1. Color Semantics & Astronomical Meaning

Cosmic Engine uses a strict semantic color palette to represent physical astronomical states and coordinate geometries consistently across all widgets:

| Color | Hex Token | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Sky Blue** | `#38bdf8` | `text-sky-400`, `fill-sky-400`, `bg-sky-400` | **Observer Location Pin ("YOU")**, **Ascending Lunar Orbital Node** ($\beta \ge 0$, North of ecliptic, $\Omega$ / $☊$), **High Tide Water Indicator** |
| **Rose Red** | `#f43f5e` | `text-rose-500`, `fill-rose-500`, `bg-rose-500` | **Descending Lunar Orbital Node** ($\beta < 0$, South of ecliptic, $\mho$ / $☋$), **Negative (Southern) Declination** |
| **Amber / Gold** | `#fbbf24` / `#fde047` | `text-amber-400`, `fill-amber-400`, `border-amber-400` | **Subsolar Point**, **Daylight Hemisphere** ($h \ge -0.833^\circ$), **Sun Ray Vectors**, **Daylight Terminator Rim**, **Solar Noon Action** |
| **Civil Twilight Amber** | `#fcd34d` | `fill-amber-400/80`, `text-amber-300` | **Civil Twilight Band** ($-6.0^\circ \le h < -0.833^\circ$, horizon visible, bright stars emerge) |
| **Nautical Twilight Slate** | `#64748b` | `fill-slate-500`, `text-slate-400` | **Nautical Twilight Band** ($-12.0^\circ \le h < -6.0^\circ$, sea horizon fades, navigation stars visible) |
| **Astronomical Twilight Slate** | `#334155` | `fill-slate-700`, `text-slate-500` | **Astronomical Twilight Band** ($-18.0^\circ \le h < -12.0^\circ$, faint skyglow before deep night) |
| **Deep Space Slate** | `#020617` / `#0b0f19` | `bg-slate-950`, `bg-slate-900`, `fill-slate-950` | **Deep Astronomical Night** ($h < -18.0^\circ$), **Ocean Baseline**, **Card Backgrounds** |
| **Indigo / Cyan** | `#6366f1` / `#06b6d4` | `text-indigo-400`, `text-cyan-400` | **Lunar Transit Action**, **Lunar Ray Vectors**, **Gravitational Syzygy / Spring Tide Potential** |
| **Emerald** | `#10b981` | `text-emerald-400`, `bg-emerald-500` | **Celestial Equator Ring**, **Date Ring / Selector**, **Orbital Alignment (100%)**, **Perigee Status** |
| **Antique Brass / Gold** | `#b45309` / `#f59e0b` | `text-amber-500`, `stroke-amber-600` | **Outer Mater Rim**, **Ecliptic Rete**, **12 Zodiac Arcs**, **Astrolabe Sighting Rule (Alidade)** |
| **Cyan / Steel** | `#06b6d4` | `stroke-cyan-500`, `text-cyan-400` | **Local Horizon Ring**, **Almucantar Elevation Plate (Tympan)** |

---

## 2. 2D & 3D Vector Stroke & Path Encodings

To maximize information density without adding text clutter, orbital loops and curves adhere to standard vector stroke encodings:

### A. Gyro-Morph Armillary Multi-Model Continuum & SED Astrolabe Styling
* **5 Unified Framework Modes**: `[☉ Orbit | ⊕ Apparent | 🧭 Rete | 📐 Rojas | 🔭 Horizon]`.
* **Decoupled 2-Stage Staged Choreography**:
  - **Phase A ($\lambda \in [0.0 \to 0.45]$)**: Rotates camera pitch and yaw to canonical poles ($\text{Pitch} = 90^\circ / 0^\circ, \text{Yaw} = 0^\circ$) via shortest angular geodesic delta while maintaining 100% spherical 3D geometry ($\lambda_{\text{geom}} = 0$).
  - **Phase B ($\lambda \in [0.45 \to 1.0]$)**: Locks camera at canonical pole while continuous projective flattening ($\lambda_{\text{geom}} \in [0, 1]$) and progressive plate decorations materialize.
  - **Symmetric Reverse Transitions**: Re-folds 2D plate into 3D sphere before restoring custom user 3D viewing angles with zero drift.
* **Closed-Form Stereographic Conformal Orbit Target**:
  - **Celestial Equator**: Concentric circle of radius $R_0$.
  - **Tropics of Cancer & Capricorn**: Concentric circles of radii $R_0 \tan((90^\circ \mp \epsilon)/2)$.
  - **Ecliptic Great Circle**: Eccentric circle with Center $(0, -R_0 \tan\epsilon)$ and Radius $R_{\text{ecl}} = R_0 / \cos\epsilon = R_0 \sec\epsilon$, preserving true astronomical obliquity $\epsilon = 23.439^\circ$ without artificial decay.
* **Continuous Depth-Split Stroke Unification**:
  - **Front Hemisphere ($z_{\text{cam}} \ge 0$)**: Solid stroke (`frontStrokeWidth = 2.0-2.2px`, `opacity = 0.9-1.0`).
  - **Back Hemisphere ($z_{\text{cam}} < 0$)**: Dashed stroke (`strokeDasharray = "3,2"`, `backStrokeWidth = 1.0px`, `opacity = 0.35`).
  - **Smooth Blending ($\lambda \in [0.85 \to 1.0]$)**: Back segments continuously interpolate opacity ($0.35 \to 1.0$), width ($1.0\text{px} \to 2.0\text{px}$), and dash gap closure ($2 \cdot (1 - u)$), unifying into seamless solid astrolabe plate lines without duplicate paths.
* **Progressive Radial Expansion**:
  - **Outer Double-Grooved Brass Bezel**: Expands radially (`transform="scale(0.94 + 0.06 * opacity)"`, `#b45309`/`#78350f`, $0.75\text{px}$) with $0.5\text{px}-0.75\text{px}$ micro-ticks and delicate monospace Roman numeral micro-labels (`text-[8px] font-mono fill-amber-300/80`).
  - **Tympan Altitude Arcs (Almucantars)**: Smoothly glide from eccentric stereographic circles to concentric horizon stereonet rings (`transform="scale(0.94 + 0.06 * progress)"`, `#06b6d4` for horizon, `#64748b` dashed for altitudes).
  - **Alidade Sighting Arm**: Expands radially (`transform="scale(0.92 + 0.08 * opacity)"`) from the center pivot reticle pin.
* **Keplerian Orbit Ring & Milestones**: Thin gold orbit path (`#fbbf24`, `0.75px`) with 6 milestone nodes featuring geodesic spherical SLERP trajectories:
  - **Milestone Color Codes**: Perihelion `#a855f7` (Purple), June Solstice `#38bdf8` (Sky Blue), December Solstice `#f43f5e` (Rose Red), March Equinox `#34d399` (Emerald), September Equinox `#fbbf24` (Amber), Aphelion `#818cf8` (Indigo).
  - **Seasonal Milestone Halo Tokens**:
    - *Resting State*: Translucent outer halo (`fill={color}`, `opacity="0.20"`, `r="11px"`), inner core node (`r="5.5px"`, `fill={color}`, `stroke="#ffffff"`, `strokeWidth="1.5"`, `className="drop-shadow-md"`).
    - *Hover State*: Expanded glowing halo (`opacity="0.45"`, `r="18px"`, `className="animate-pulse"`), expanded core node (`r="8px"`).
* **Dynamic 3D Orbiting Earth Bead**: Rendered in full 3D Euler space (`viewMode="euler3d"`) with dynamic camera-space subsolar vector $\vec{S}_{\text{cam}} = \text{normalize}(\vec{P}_{\text{sun, cam}} - \vec{P}_{\text{earth, cam}})$ providing continuous, physically accurate day/night terminator shading facing the central Sun across all camera orientations, eliminating 2D sticker angle flipping.
* **Heliocentric Orbit Zoom Controls**: Non-passive wheel zoom and glassmorphic floating control pill (`[-]`, `zoom×`, `[+]`, `[Reset]`) from $0.75\times$ to $3.5\times$ (default $1.0\times$). Zoom is strictly isolated to 3D Heliocentric Orbit mode (`isOrbital && morphLambda <= 0.05`) and automatically resets to $1.0\times$ upon transitioning into 2D historical plates (`🧭 Rete`, `📐 Rojas`, `🔭 Horizon`).
* **Parametric Sun Bead**: Mathematically clamped directly to $(r_0 \cos\lambda, r_0 \sin\lambda \sin\epsilon, r_0 \sin\lambda \cos\epsilon)$ on the Ecliptic track across all 4 seasons and free Rete rotation (residual $< 1.42 \times 10^{-13}\text{ px}$).
* **Ecliptic Rete**: Divided into 12 alternating $30^\circ$ zodiac arcs with standard unicode glyphs (♈, ♉, ♊, ♋, ♌, ♍, ♎, ♏, ♐, ♑, ♒, ♓) rotating with Local Sidereal Time ($\theta_{\text{LST}}$) or freely in Astrolabe Solver Mode.
* **Navigational Astrolabe Stars**: Rendered as delicate diamond florets (`strokeWidth="0.6"`, `r="1.2-3.2px"`) with hairline dashed flame pointers and glowing magnitude halos.
* **SED Hairline Alidade Sighting Arm**: Slim $1.6\text{px}$ brass ruler body with dark wood inlay (`#78350f`, $0.75\text{px}$), cyan laser sightline (`#38bdf8`, $0.75\text{px}$ dashed), dual pinhole pinnule sighting vanes, and central reticle pin.

### B. Lunar Orbit Segmentation & Dual-Zone Depth Encodings (Eclipse Demonstrator)
* **Solid Stroke (`stroke-width="1.2"`)**: **Waxing Moon** ($0^\circ \to 180^\circ$ elongation).
* **Dashed Stroke (`stroke-dasharray="4 3"`, `stroke-width="1.2"`)**: **Waning Moon** ($180^\circ \to 360^\circ$ elongation).
* **Sky Blue Stroke (`#38bdf8`)**: Orbital segment is **North of Ecliptic** ($\beta \ge 0$, Ascending hemisphere, $\Omega$ / $☊$).
* **Rose Red Stroke (`#f43f5e`)**: Orbital segment is **South of Ecliptic** ($\beta < 0$, Descending hemisphere, $\mho$ / $☋$).
* **Prograde Transit Direction (Axial Sightline)**: When looking toward the Sun with North UP, East is Left and West is Right. The lunar transit traverses from **Right to Left (West to East)** across the face of the Sun during solar eclipses ($s = -\sin(\text{phaseRad})$).
* **Dual-Zone Line-of-Sight Depth Masking**:
  - **Viewer-Side Foreground ($Z > 0$)**: Unmasked with **full vibrancy ($0.9$ opacity, $1.2\text{px}$ width)** in front of the Earth globe. Foreground paths are never muted across the planet disc.
  - **Sun-Facing Background ($Z \le 0$)**: Rendered with `mask="url(#outsideEarth)"` at $0.9$ opacity in open sky, and softened to a subtle **ghosted X-ray chord** at $0.22$ opacity (`strokeWidth="1.0"`) inside `clipPath="url(#axialEarthClip)"` / `clipPath="url(#syzygyEarthClip)"`.
* **Earth-Occluded Moon Outline Overlay**:
  - Whenever the far-side Moon ($Z \le 0$) overlaps the Earth disc ($dist < R_{\text{earth}} + R_{\text{moon}}$), an overlay disc clipped to `axialEarthClip` renders on top of `<MiniGlobe />`.
  - **Styling**: Translucent dark fill `#0f172a` ($0.45$ opacity), matching stroke width ($2.0\text{px}$), and phase-appropriate dash array (`strokeDasharray={isWaxing ? undefined : '3 2'}`), preserving a seamless, unbroken circular boundary across Earth's limb.
* **Ascending (☊) & Descending (☋) Node Pin Depth Muting**:
  - **Directly Behind Earth** ($Z_{\text{node}} \le 0 \land \|\mathbf{x}_{\text{node}} - \mathbf{x}_{\text{earth}}\| \le R_{\text{earth}}$): Ghosted X-ray styling at `opacity="0.35"`, dark translucent fill `#0f172a`, dashed ring `strokeDasharray="2 1.5"`, and muted text `/60 font-medium`.
  - **In Front of Earth ($Z > 0$) or in Open Sky ($r > R_{\text{earth}}$)**: 100% full vibrancy with solid color fill (`#38bdf8` / `#f43f5e`), crisp white border (`#ffffff`, $1\text{px}$), and bold bright labels.

### C. Sky View Simulator & Perspectival Eclipse Tokens
* **Central Path Sky Simulator (`viewBox="0 0 240 240"`, centered at $120, 120$)**:
  - **Sky Baseline Circle**: Radius $R=100\text{px}$, `#020617` (Deep Space Slate fill), `#334155` stroke $1.0\text{px}$.
  - **Sun Disc**: Radius $R=42\text{px}$, `#fbbf24` (Amber/Gold fill), `#ffffff` stroke $1.5\text{px}$.
  - **Solar Corona Glowing Rays (Totality)**: 12 radial rays (`#fde047`, stroke $2.5\text{px}$, opacity $0.75$, `strokeLinecap="round"`, `animate-pulse`), radiating from $r=40\text{px}$ to $r=75\text{px}$.
  - **Moon Disc**: Radius $R=42\text{px}$, `#020617` fill (silhouette), stroke `#334155` $1.0\text{px}$ (or `#fbbf24` $3\text{px}$ for Annular). Positioned at $X = 120 - \Delta\lambda \cdot 75, Y = 120 - \beta \cdot 8$.
  - **Earth Umbra Shadow Disc (Lunar Eclipse)**: Radius $R=70\text{px}$, `#450a0a` (Deep Crimson fill, opacity $0.4$), stroke `#ef4444` dashed (`strokeDasharray="4 4"`).
  - **Blood Moon Disc (Total Lunar)**: Radius $R=40\text{px}$, `#9f1239` fill, stroke `#f43f5e`, pulsing atmospheric halo `#fb7185`.
* **Lunar Surface POV Simulator (`viewBox="0 0 520 220"`)**:
  - **Lunar Horizon Landscape**: Base terrain `#1e293b` with `#334155` stroke along $Y=190$.
  - **Sun in Lunar Sky**: Radius $R=26\text{px}$, `#fbbf24` with outer radial glow gradient to $R=32\text{px}$.
  - **Earth Body**: Radius $R=44\text{px}$ ($1.9^\circ$ angular diameter, $3.7\times$ Sun size).
  - **Atmospheric Blood Ring**: Multi-layered concentric rings ($R=46\text{px}, 48\text{px}, 54\text{px}$, `#f43f5e`/`#9f1239`/`#fbbf24`) glowing during terrestrial lunar eclipses.

### D. Map & Horizon Curves
* **Dashed Amber Line (`stroke="#fbbf24" strokeDasharray="3 2"`)**: Exact daylight terminator boundary curve ($h = -0.833^\circ$).
* **Dashed Sky Blue Crosshair (`stroke="#38bdf8" strokeDasharray="4 2"`)**: User geographic latitude and centered prime meridian.

### E. Reusable High-Precision `<MiniGlobe />` Visual Tokens & Layer Hierarchy

The `<MiniGlobe />` component (`src/components/common/MiniGlobe.tsx`) unifies the graphical representation of planet Earth across all 2D and 3D visualizers. It renders a clean, non-tearing 9-layer SVG hierarchy with strict semantic tokens:

```
┌─────────────────────────────────────────────────────────────┐
│ 9. Enlarged Touch Hit Target (r = 1.6R, cursor-pointer)     │
│ 8. Monospace Label Overlay ("EARTH", drop-shadow-md)        │
│ 7. Observer Pin ("YOU") (Solid #38bdf8 day / Hollow #94a3b8 night│
│ 6. Specular Planetary Limb Rim (#60a5fa 1.2px / #93c5fd)    │
│ 5. Polar Axis Line (23.44° tilt, Ice Blue #93c5fd dashed)   │
│ 4. Parallels (Equator #38bdf8, Tropics #64748b dashed)       │
│ 3b. World Continents (Emerald #10b981 / Sage #34d399)       │
│ 3. Daylight & Twilight Bands (Ocean #2563eb / Civil #1e40af)│
│ 2. Nighttime Base Disc (Deep Space Slate #020617)           │
│ 1. Outer Atmospheric Halo (Cyan #38bdf8 radial gradient)    │
│ 0. Unique SVG Defs & ClipPath (React useId() isolation)     │
└─────────────────────────────────────────────────────────────┘
```

#### 1. Layer Tokens & Palette
| Layer | Element | Styling & Color Tokens | Description |
| :--- | :--- | :--- | :--- |
| **0. Defs** | `<clipPath>` & `<radialGradient>` | `useId()` safe prefix | Guarantees zero ID collision across multiple mounted instances |
| **1. Atmosphere** | Outer Halo | `#38bdf8` (35%) $\to$ `#0284c7` (15%) $\to$ `#0369a1` (0%) | Radial glow extending to $1.35\times$ radius |
| **2. Night Base** | Night Disc | `#020617` (Deep Space Slate) | Base sphere fill behind daylight terminator |
| **3. Daylight** | Sunlit Semicircle / 3D Patch | `#60a5fa` $\to$ `#2563eb` $\to$ `#1d4ed8` | Ocean core radial gradient clipped to subsolar vector |
| **3. Twilight** | Twilight Bands | Civil `#1e40af` ($-6^\circ$), Nautical `#1e293b` ($-12^\circ$) | Smooth non-tearing spherical limb arcs |
| **3b. Continents** | Living Marble Landmasses | Emerald `#10b981` (35% fill, `#34d399` stroke $0.4\text{px}$) | Rotational 3D vector continents with sidereal spin and front-hemisphere clipping |
| **4. Parallels & Meridians** | Equator / Tropics / Great Meridian Ring | Equator `#38bdf8` (`strokeWidth="0.75"`, dashed `2 1.5`); Tropics `#64748b` (`strokeWidth="0.5"`, dashed `2 1.5`); 0° Prime Meridian & 180° Antimeridian `#38bdf8` (`strokeWidth="0.65"`, dashed `2 1.5`, opacity `0.75`) | $0^\circ$ Celestial Equator, $\pm 23.44^\circ$ Solstice Tropics, and full $360^\circ$ Great Meridian Ring ($0^\circ$ Greenwich & $180^\circ$ Antimeridian) visible continuously through the marble at all times |
| **5. Polar Axis** | 23.44° Rotational Axis | `#93c5fd` (`strokeWidth="0.85"`, dashed `2.5 1.5`, opacity `0.75`) | Rotated rotational axis passing through poles (suppressed in `euler3d` mode to eliminate artificial bifurcation lines) |
| **6. Limb Rim** | Outer Rim | `#60a5fa` (`strokeWidth="1.2"`, opacity `0.8`) + inner `#93c5fd` (`strokeWidth="0.4"`) | Dual-layer specular spherical limb boundary |
| **7. Observer Pin** | Observer Marker ("YOU") | Day: Solid Sky Blue `#38bdf8` ($r=1.6-1.8\text{px}$) + white ring + pulse halo; Night: Hollow Slate `#94a3b8` ring (`fill="none"`, `strokeWidth="0.8px"`, $r=1.4-1.6\text{px}$) | True topocentric geographic observer pin conforming to solid (day) vs. hollow (night) rule |
| **8. Label** | Monospace Tag | Monospace `text-[9px] font-mono font-bold fill-blue-300` | High-contrast label with dark drop shadow |
| **9. Hit Target** | Pointer Target | `fill="transparent"`, $r = \max(16\text{px}, 1.6 R)$ | Generous hit area preventing hover flickering |

#### 2. Canonical View Modes
* **`topdown` (Heliocentric Macro Orbit)**: Renders Sunward daylight semicircle oriented dynamically toward Sun focus F1 (`sunAngleDeg`), with tilted $23.44^\circ$ polar axis and elliptical equator/tropics chords.
* **`transverse` (Eclipse Left Pane — Side Profile)**: Renders side-on transverse profile with Sun on left ($X < cx$), tilted polar axis $\theta_{\text{side}} = \varepsilon \sin\lambda_\odot$, and dashed equator chord.
* **`axial` (Eclipse Right Pane — Sightline View)**: Renders down-the-barrel sightline through Earth with curved 3D front equator arc and night-side viewer perspective.
* **`euler3d` (Armillary 3D Apparent View)**: Renders 3D sphere rotating dynamically with user Euler camera dragging $(\text{Pitch}, \text{Yaw}, \text{Roll})$ in inertial space with analytical limb clipping.
* **`flat` (Astrolabe 2D Plate Modes)**: Renders precision concentric brass pivot pin (`#b45309`/`#78350f`, $0.75\text{px}$) with dark core (`#0f172a`), pulsing Sky Blue center dot (`#38bdf8`), and fine crosshair reticle (`#78350f`, $0.5\text{px}$).

### F. Today's Horizon Observatory Domes & Draconic Kinematics
* **Canonical Symmetrical Viewport (`viewBox="0 0 260 138"`)**:
  - Shared geometric constants across `SunElevationDome` and `MoonElevationDome`: $CX = 130, CY = 104, R = 92$.
  - Horizon baseline at $Y = 104$, Zenith marker (+90°) at $Y = 12$, Cardinal Azimuth ticks: East ($X = 38$), Meridian ($X = 130$), West ($X = 222$).
  - Culmination Meridian indicator dynamically flips based on observer geographic latitude: **S** for Northern hemisphere ($\phi \ge 0^\circ$) vs. **N** for Southern hemisphere ($\phi < 0^\circ$).
  - Sub-horizon vertical headroom: $34\text{px}$ ($Y \in [104, 138]$) accommodating nocturnal paths down to $-18^\circ$ astronomical twilight and negative declination excursions.
* **Harmonized Atmospheric Twilight Strata Tokens**:
  - **Daylight**: Amber / Gold (`#fbbf24`, $h \ge -0.833^\circ$).
  - **Civil Twilight**: Warm Golden Amber (`#f59e0b`, $-6.0^\circ \le h < -0.833^\circ$).
  - **Nautical Twilight**: Slate Navy (`#64748b`, $-12.0^\circ \le h < -6.0^\circ$).
  - **Astronomical Twilight**: Deep Indigo Slate (`#334155`, $-18.0^\circ \le h < -12.0^\circ$).
  - **Night**: Deep Space Slate (`#020617`, $h < -18.0^\circ$).
* **Lunar Diurnal Arc Styling & Mode Separation**:
  - **Standard (`Std`) Mode**: Diurnal elevation arc renders in serene lunar silver (`stroke="#e2e8f0"`, `strokeWidth="1.2"`), maintaining calm astronomical observation.
  - **Nodal (`☊ Nodes`) Mode**: Diurnal elevation arc inherits canonical Eclipse-demonstrator 4-quadrant color and stroke encodings:
    - **Sky Blue (`#38bdf8`)**: Moon North of Ecliptic ($\beta \ge 0$, Ascending hemisphere).
    - **Rose Red (`#f43f5e`)**: Moon South of Ecliptic ($\beta < 0$, Descending hemisphere).
    - **Solid Stroke**: Waxing Moon ($0^\circ \le \text{elongation} < 180^\circ$).
    - **Dashed Stroke (`strokeDasharray="4 3"`)**: Waning Moon ($180^\circ \le \text{elongation} < 360^\circ$).
* **Continuous Nocturnal Sub-Horizon Trajectory Styling**:
  - Sub-horizon nocturnal paths ($h < 0^\circ, Y > 104$) are rendered strictly with **solid strokes** (`strokeDasharray = undefined`) and subdued opacity (`strokeOpacity="0.20"`, `strokeWidth="1.0"`).
  - Eliminates misleading dashed strokes below the horizon, reserving dashed stroke encoding exclusively for waning lunar orbital phase.
* **Bilateral Node Crossings & Gated Sky Dome Pins**:
  - Ascending (☊, `#38bdf8`) and Descending (☋, `#f43f5e`) node pins on the Sky Dome are strictly temporal-gated: visible **only** when `nearestNodeDistDays <= 1.0` (or $|\beta| \le 0.8^\circ$), preventing on-dome node clutter.
  - Sighting telemetry badge displays `"Crossing Today"` when within 24 hours of either node event.
* **Centered $\pm 15$-Day Draconic Progress Micro-Rail**:
  - Displayed within the Moon Dome Nodal Inspector modal: $X \in [12, 228]$ ($216\text{px}$ track width), anchored at $X = 120$ for Today ($T = 0$).
  - Linear temporal mapping: $X(t) = 120 + t \cdot 7.2$ across $t \in [-15, +15]$ days.
  - Continuous color-coded track segments: Sky Blue (`#38bdf8`) for northern ecliptic latitude $\beta(t) \ge 0$ vs. Rose Red (`#f43f5e`) for southern $\beta(t) < 0$.
  - Historical and upcoming node pins: Ascending (Sky Blue circle, `☊`) and Descending (Rose Red circle, `☋`) pins with signed temporal offset tags (`-4.2d`, `+8.9d`).
* **Footer Metric Relocation & 4-Column Panel (`grid-cols-4`)**:
  - Segmented toggle controls (`[Std | Twilights]` / `[Std | ☊ Nodes]`) are housed in the 4th metric slot of the card footer:
    - *Sun Dome*: `[Sunrise/Sunset | Solar Noon | Declination | [Std | Twilights]]`
    - *Moon Dome*: `[Moonrise/Moonset | Lunar Transit | Declination | [Std | ☊ Nodes]]`
  - Preserves clean card headers, uniform card heights, and horizontal alignment across the dashboard grid.

### G. Celestial Meridian Colure Profiles, Solstice Bifurcation & Sub-Horizon Twilight Kinematics
* **Dual Dashed Solstice Milestone Arcs (`SunMeridianDome.tsx`)**:
  - **June Solstice Arc (`solstice-swath-june`)**: Warm Gold (`stroke="#fbbf24"`, `strokeDasharray="3 2"`), spanning from Today's Noon Peak (`todayPeakPoint.thetaDeg`) to the June Solstice Peak (`junePeakPoint.thetaDeg`).
  - **December Solstice Arc (`solstice-swath-december`)**: Rich Bronze (`stroke="#d97706"`, `strokeDasharray="3 2"`), spanning from Today's Noon Peak (`todayPeakPoint.thetaDeg`) to the December Solstice Peak (`decPeakPoint.thetaDeg`).
  - **Milestone Anchoring Principle**: Both arcs anchor strictly to Today's Noon Culmination Peak on the outer circular meridian rim ($R = 92, CX = 130, CY = 104$). This preserves a static, calibrated seasonal scale and eliminates jitter from the moving diurnal Sun bead.
* **Directional Migration Vibrancy ($d\delta/dt$)**:
  - **Approaching Milestone Arc** ($\cos\lambda_\odot > 0$ for June, $\cos\lambda_\odot < 0$ for December): Rendered at full vibrancy (`strokeOpacity="0.85"`, `strokeWidth="1.25"`).
  - **Receding Milestone Arc** (receding from solstice): Rendered in subdued tone (`strokeOpacity="0.40"`, `strokeWidth="0.9"`).
* **Sub-Horizon Solstice Depiction & 3-Tier Kinematics in Twilight Mode**:
  - **Twilight Noon Culmination ($0^\circ > h \ge -18^\circ$)**: When the winter solstice culmination falls below the horizon in polar latitudes, the solstice arc smoothly extends along the circular perimeter into the twilight strata ($Y \in [104, 132.43]$):
    - *Civil Twilight* ($-0.833^\circ \ge h \ge -6.0^\circ$): Warm Golden Amber (`#f59e0b`).
    - *Nautical Twilight* ($-6.0^\circ > h \ge -12.0^\circ$): Slate Navy (`#64748b`).
    - *Astronomical Twilight* ($-12.0^\circ > h \ge -18.0^\circ$): Deep Indigo Slate (`#334155`).
    - Rendered with an authentic radial tick pin and signed altitude label with twilight tier (e.g. `-3.1° S (Civil)`).
  - **Astronomical Night Floor ($h < -18^\circ$)**: When noon culmination drops below the $-18^\circ$ floor (deep polar astronomical night), the solstice tick pin is completely suppressed (disappears), and the arc terminates cleanly at the $-18^\circ$ floor, preventing off-canvas orphan artifacts.
  - **Standard (`Std`) Mode**: Sub-horizon solstice ticks are suppressed to keep the daytime horizon pristine.
* **Mode-Coupled Diurnal Chord & Gate Anchor**:
  - **Standard (`Std`) Mode**: `todayChord` and `gateAnchor` stop cleanly at the horizon ($h = 0^\circ, Y = 104$).
  - **Twilight Mode**: `todayChord` and `gateAnchor` extend down to the $-18^\circ$ Astronomical Twilight floor ($Y = 132.43\text{px}$).
* **Compact Meridian Telemetry & Duplicate Banner Suppression**:
  - `hideElevationBanner?: boolean` prop on `<SkyDomeBase />`, defaulted to `true` on `<MeridianDomeBase />`.
  - Suppresses duplicate middle elevation badges and sighting perspective banners on lower meridian profile cards while leaving upper diurnal elevation domes intact.
* **Polar Directional Singularity Baseline Tokens ($|\phi| \ge 89.9^\circ$)**:
  - **Meridian Profile Baseline (`MeridianDomeBase`)**:
    - *North Pole ($\phi \ge +89.9^\circ$)*: `S (0°)` (Greenwich meridian, $X=38$) $\longleftrightarrow$ `Z (+90°)` (North Celestial Pole, $X=130$) $\longleftrightarrow$ `S (180°)` (Antimeridian, $X=222$).
    - *South Pole ($\phi \le -89.9^\circ$)*: `N (0°)` ($X=38$) $\longleftrightarrow$ `Z (-90°)` ($X=130$) $\longleftrightarrow$ `N (180°)` ($X=222$).
    - Replaces the misleading `"N"` label at the North Pole with explicit longitudinal horizon references, proving both horizons point South.
  - **Upper Diurnal Elevation Dome Baseline (`SkyDomeBase`)**:
    - *At Poles ($|\phi| \ge 89.9^\circ$)*: `90°E` $\longleftrightarrow$ `0° (Grw)` $\longleftrightarrow$ `90°W`.
  - **Sighting Perspective Telemetry**:
    - Displays `"North Pole Singularity · All Horizons South"` (or `"South Pole Singularity · All Horizons North"`).
  - **Invariant Diurnal Metric Token**:
    - Switches `"Noon Peak"` / `"Transit Peak"` badge to `"Constant Altitude"` reflecting the 24-hour horizontal circular path.

---

## 3. Glassmorphic Popover & HUD Hierarchy

All contextual telemetry (hover popovers, status badges, telemetry footers) follows standard glassmorphism tokens:

```css
/* Primary HUD / Popover Container */
background-color: rgba(15, 23, 42, 0.95); /* slate-900 at 95% opacity */
backdrop-filter: blur(12px);              /* backdrop-blur-md */
border: 1px solid rgba(51, 65, 85, 0.8);   /* border-slate-700 / border-slate-800 */
border-radius: 0.75rem;                   /* rounded-xl */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); /* shadow-2xl */
```

### Micro-Typography & Accessibility Standards
* **Mathematical Telemetry & Coordinates**: Always rendered in monospace (`font-mono`, e.g., `text-xs font-mono`, `text-[10px] font-mono`).
* **Widget Titles & Section Headers**: Rendered in clean sans-serif (`font-sans font-semibold tracking-wider text-xs uppercase`).
* **High-Contrast Micro-Label Overlays**: When rendering $0.75\text{px}$ hairline labels (e.g., `text-[8px] font-mono fill-amber-300/80`) over dynamic viewports (illuminated daylight Earth, laser cones, Sun glow), enforce dark drop-shadows or stroke halos for WCAG AAA contrast:
  - *Tailwind SVG Drop-Shadow*: `drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]`
  - *SVG Text Stroke Halo*: `paintOrder="stroke" stroke="#020617" strokeWidth="0.8px" strokeLinejoin="round"`
* **Interactive Hover HUDs**: Use `pointer-events-none` with fast fade/zoom animations (`animate-in fade-in zoom-in-95 duration-150`) to avoid blocking cursor scrub gestures.

---

## 4. 12-Column Responsive Panoramic Grid & 1-Col / 2-Col Controls

The dashboard layout utilizes a flexible 12-column responsive CSS grid with dynamic per-card width toggle controls:

* **2-Column Panoramic Windows (`col-span-12`)**: Full-width panoramic cards for high-detail instruments (Gyro-Morph Armillary, Today Horizon, Eclipse Demonstrator).
* **1-Column Standard Cards (`col-span-12 2xl:col-span-6`)**: Half-width compact instruments (Solar Almanac, Lunar Almanac, Daylight Terminator Map, Macro Orbit) spanning 6 columns on ultra-wide displays ($\ge 1536\text{px}$) and stacking to full width on narrower viewports.
* **Interactive `1-Col / 2-Col` Header Toggle**: Every dashboard window includes a direct header toggle allowing users to dynamically expand any card to 2 columns or collapse to 1 column.
* **HTML5 Drag-and-Drop Architecture & Drop-Target Tokens**:
  * **Header Drag Handle**: `cursor-grab active:cursor-grabbing` on header bar; 6-dot grip icon (`text-slate-500 hover:text-slate-300`) indicates draggable state when unlocked.
  * **Active Dragging State**: The dragging window preserves layout flow with `opacity-40 scale-[0.98]`.
  * **Luminous Drop-Target Indicator**: Active drag-over hover displays an intense luminous ring and glow: `border-indigo-500 ring-2 ring-indigo-500/80 shadow-2xl shadow-indigo-500/20` (overriding default `border-slate-800/80 hover:border-slate-700/80`).
  * **Header-Gated Pointer Down**: To prevent child input elements (sliders, dials, buttons, number inputs) from triggering native drag cancellation, drag capability is strictly gated via `canDragRef` armed only upon direct header bar pointer-down.
  * **DataTransfer Protocol**: Explicitly asserts `e.dataTransfer.effectAllowed = 'move'` and `e.dataTransfer.dropEffect = 'move'` on drag lifecycles to guarantee clean cursor behavior.
* **Bottom Astrolabe Dock**: Fixed to the bottom viewport (`fixed bottom-0 left-0 right-0 z-50`) with an accessible expand/collapse tab.

---

## 5. Interaction Patterns & Cursor Grammar

1. **Interactive Cursor Grammar**:
   * `cursor-grab` / `active:cursor-grabbing`: Rotational dragging elements (Astrolabe Rete, Chronometer time/date rings, 3D Celestial sphere camera rotation).
   * `cursor-crosshair`: Spatial aiming & measurement instruments (Alidade sighting arm rule, Daylight Terminator Map coordinate crosshairs).
   * `cursor-pointer`: Discrete action buttons, snap triggers, milestone nodes, elevation peak targets, and tab pills.
   * `cursor-se-resize`: Window bottom-right resize handles.
   * `cursor-default` + `pointer-events-none`: Floating HUD popovers and readouts.
2. **Click-to-Snap**: Primary temporal milestones (Solar Noon, Lunar Transit) and astrolabe sighting targets (Stars, Sun, Moon) feature instant or spring-animated snapping.
3. **Free Astrolabe Solver Mode**: Dragging the golden Rete bypasses clock lock to calculate apparent solar and sidereal time dynamically.
4. **Cross-Card Hover Synchronization**: Hovering over timestamps or calendar dates in any widget propagates `hoverTime` and `hoverDate` across all mounted visualizers simultaneously.
5. **Fluid Card Resizing**: Bottom-right resize thumbs allow non-destructive card expansion with a minimum height floor ($220\text{px}$).
6. **Morph $\lambda$ Slider & Precision Controls**:
   - Expanded $28\text{px}$ touch target container (`h-7`) with `touch-action: none`.
   - Event propagation isolation (`e.stopPropagation()` on all pointer/drag lifecycles) to prevent canvas rotation bleed-through.
   - High-contrast $18\text{px}$ amber slider thumb (`accent-amber-400`, `cursor-grab`) with active ring states and dynamic track progress gradient fill.

---

## 6. Earth & Tidal Gravity Micro View Nodal Conventions

The **Earth & Tidal Gravity Micro View** (`MicroTideView`) integrates the unified 9-layer `<MiniGlobe />` component and shares the universal 4-quadrant orbital stroke encodings from the Eclipse Demonstrator:

* **Unified Mini-Globe Earth**:
  - Integrated with `viewMode="topdown"` and `radius={12}`, displaying rotating 3D vector continents (`#10b981`), axial obliquity $\varepsilon = 23.44^\circ$, civil/nautical/astronomical twilight bands, and pulsing topocentric observer pin.
  - The oceanic daylight hemisphere rotates smoothly with the live solar direction (`sunAngleDeg`).
* **`[Standard | ☊ Nodal Loop]` Segmented Controls**:
  - **Standard Mode**: Classic minimalist dashed gray circular lunar orbit (`stroke="#334155"`, `strokeDasharray="3 3"`).
  - **☊ Nodal Loop Mode**: Decomposes the $R = 60\text{px}$ top-down lunar orbit into 4 color-coded, stroke-coded quadrants partitioned dynamically at the true node crossing longitudes (`trueAscNodeLon`, `trueDescNodeLon`) based on elongation from the Sun and instantaneous true ecliptic latitude $\beta$:
    1. **Waxing Ascending** ($E \in [0^\circ, 180^\circ], \beta \ge 0$): Solid Sky Blue (`#38bdf8`, `strokeWidth="1.2"`).
    2. **Waxing Descending** ($E \in [0^\circ, 180^\circ], \beta < 0$): Solid Rose Red (`#f43f5e`, `strokeWidth="1.2"`).
    3. **Waning Ascending** ($E \in [180^\circ, 360^\circ], \beta \ge 0$): Dashed Sky Blue (`#38bdf8`, `strokeDasharray="4 3"`).
    4. **Waning Descending** ($E \in [180^\circ, 360^\circ], \beta < 0$): Dashed Rose Red (`#f43f5e`, `strokeDasharray="4 3"`).
* **True Node Crossing Pins & Instantaneous Latitudinal Status**:
  - **Ascending Node (☊) Pin**: Placed at $\theta = -\lambda_{\text{asc}}$ (SVG coordinates) using the true crossing longitude solved via `calculateTrueLunarNodeEvents`, styled with a Sky Blue border and `☊` text label.
  - **Descending Node (☋) Pin**: Placed at $\theta = -\lambda_{\text{desc}}$ using the true descending crossing longitude, styled with a Rose Red border and `☋` text label.
  - **Moon Body Halo**: Directly governed by true ecliptic latitude ($\beta \ge 0^\circ$ for Sky Blue `#38bdf8` vs $\beta < 0^\circ$ for Rose Red `#f43f5e`), in 100% agreement with the UI legend (`☊ Ascending (+β)` vs `☋ Descending (-β)`).
* **Prograde Counter-Clockwise Orbital Orientation**:
  - In SVG viewports, the vertical $Y$-axis points **downward**, meaning standard parametric $(R\cos\theta, R\sin\theta)$ and `rotate(deg)` natively rotate clockwise.
  - To align with Earth's physical counter-clockwise rotation from above (West to East), all top-down orbital angles in `MicroTideView` are coordinated with negated SVG angles ($\theta_{\text{svg}} = -\theta_{\text{math}}$).
  - The Moon revolves counter-clockwise (Right $\to$ Up $\to$ Left $\to$ Down), the tidal bulge ellipse rotates with `rotate(${moonAngleDeg})`, and the "TO SUN" vector and daylight terminator rotate counter-clockwise in lockstep.

---

## 7. Dual-Perspective Eclipse Demonstrator Sizing & Layout Parity

The Eclipse Demonstrator renders two synchronized, mathematically aligned perspectives side-by-side in `activeTab === 'geometry'`:

* **Layout & Viewport Parity**:
  - **Identical Dimensions**: Both the Left pane (**Syzygy Profile & Shadow Rays** — `ShadowRayDiagram.tsx`) and Right pane (**Axial Sightline 5.14° Tilt** — `NodalPlaneVisualizer.tsx`) share identical SVG `viewBox="0 0 520 220"` ($26:11$ aspect ratio) and CSS class `w-full h-full block flex-1 min-h-[220px]`.
  - **Aligned Origin & Ecliptic Plane**: Both viewports align on the exact same horizontal horizon line at $y = 110$.
* **Geometric Proportions & Scaling**:
  - **Earth MiniGlobe**: Radius $R = 24\text{px}$ across both panes (+20% upsize).
  - **Sun & Corona**: Sun radius $R = 46\text{px}$ with soft corona wash to $62\text{px}$.
  - **Target Shadow Cones**: Umbra core radius $R = 18\text{px}$; Penumbra envelope radius $R = 34\text{px}$.
  - **Lunar Orbit**: Semi-major axis $R_x = 150\text{px}$ across the $520\text{px}$ width; vertical inclination scale $10.5\text{px/deg}$ ($y \in [56, 164]$ at maximum inclination $\beta = \pm 5.14^\circ$).
  - **Moon Bead**: Base radius $R = 10.5\text{px}$ with dynamic ephemeris angular scaling ($8.5\text{px} \dots 12.5\text{px}$).
  - **Node Pins**: Radius $R = 4\text{px}$ with high-contrast text labels (`☊ Node` in Sky Blue, `☋ Node` in Rose Red).

---

## 8. Today's Sky Dome Symmetrical Horizon & Nodal Tokens

The Sun and Moon Horizon Domes in `TodayWidget` share identical geometry, layout, and visual conventions, powered by two shared component primitives:
- **[`SkyDomeBase.tsx`](../src/components/widgets/today/SkyDomeBase.tsx)**: Reusable primitive for East-to-West diurnal elevation arcs, horizon baseline, reachability cap, and twilight strata.
- **[`MeridianDomeBase.tsx`](../src/components/widgets/today/MeridianDomeBase.tsx)**: Reusable primitive for South-to-North celestial colure meridian profiles, encapsulating S-Z-N horizon baseline, vertical Zenith axis ($+90^\circ$ at $X=130, Y=12$), Solstice/Standstill corridor swaths (`MeridianSwath`), radial tick pins (`MeridianRadialTick`), inclined colure diurnal chords (`MeridianDiurnalChordPath`), and Approach C parked gate anchors (`MeridianGateAnchor`).

* **Symmetrical Sky Dome Geometry**:
  - Viewport: `viewBox="0 0 260 138"`, baseline horizon at $Y = 104$ (`EL_CY`), center meridian at $X = 130$ (`EL_CX`), dome radius $R = 92\text{px}$ (`EL_R`).
  - Vertical headroom $Y \in [104, 138]$ reserved for sub-horizon twilight paths down to $-18^\circ$ astronomical twilight.
* **Atmospheric Twilight Strata Tokens**:
  - **Daylight** ($h \ge 0^\circ$): Amber/Gold (`#fbbf24`).
  - **Civil Twilight** ($-0.833^\circ \to -6^\circ$): Warm Golden Amber (`#f59e0b`).
  - **Nautical Twilight** ($-6^\circ \to -12^\circ$): Slate Navy (`#64748b`).
  - **Astronomical Twilight** ($-12^\circ \to -18^\circ$): Deep Indigo Slate (`#334155`).
  - **Night** ($h < -18^\circ$): Deep Space Slate (`#020617`).
* **Lunar Diurnal Arc Modes & 4-Quadrant Stroke Encodings**:
  - **Standard Mode (`Std`)**: Serene lunar silver solid arc (`#e2e8f0`, width $1.5\text{px}$).
  - **Nodal Mode (`☊ Nodes`)**: Evaluates true ecliptic latitude $\beta \ge 0$ (North, Sky Blue `#38bdf8`) vs. $\beta < 0$ (South, Rose Red `#f43f5e`), and waxing (solid) vs. waning (dashed `4 3`).
* **Tiered Node Crossing Countdown Tokens**:
  - **Immediate Crossing** ($|t - t_{\text{node}}| \le 0.05\text{d} \approx 1.2\text{h}$): `${symbol} Crossing Now`
  - **Near-Term** ($|t - t_{\text{node}}| \le 0.5\text{d} \le 12\text{h}$): `${symbol} in Xh` / `${symbol} Xh ago`
  - **Standard Range** ($|t - t_{\text{node}}| > 0.5\text{d}$): `${symbol} in X.Xd` / `${symbol} X.Xd ago`
  - **Topocentric Elevation Gate**: Node pin on the Sky Dome renders when $el \ge -18^\circ$ (above astronomical twilight threshold), fading to $50\%$ opacity when below the horizon ($el \in [-18^\circ, 0^\circ]$).
* **Centered $\pm 15$-Day Draconic Progress Micro-Rail**:
  - Horizontal timeline $X \in [12, 228]$, centered at $X = 120$ for Today ($T = 0$).
  - Track segments continuously colored Sky Blue for $\beta \ge 0$ and Rose Red for $\beta < 0$.
  - Pinned node beads $\Omega$ and $\mho$ glide along the rail based on exact true crossing epochs.
* **Observer Sighting Perspective Micro-Banner**:
  - Rendered inside the live elevation bar: `bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1`.
  - Monospace micro-typography: `text-[9px] font-mono text-slate-400`.
  - Line-of-sight states:
    - `[ 👁️ Looking South · S-Sky Arc ]` (Observer facing South; Sun/Moon culminates in Southern sky).
    - `[ 👁️ Looking North · N-Sky Arc ]` (Observer facing North; Sun/Moon culminates in Northern sky).
    - `[ 👁️ Overhead Zenith Transit ]` (Observer experiencing subsolar/sublunar zero-shadow transit, $|\delta - \phi| < 0.25^\circ$).
* **Dynamic Meridian Cardinal Indicators**:
  - Positioned at $X = 130, Y = 101$ with `text-[7.5px] font-mono fill-slate-500 font-medium`.
  - Tri-state values: `S` (South culmination), `N` (North culmination), `Z` (Zenith transit).
  - Encapsulated in `<g>` with native `<title>` for accessible hover tooltips (`Culmination meridian bearing: North/South/Zenith`).
* **Signed Peak Elevation Readout Tokens**:
  - Header peak altitude formatted with signed directional suffix: `<strong className="text-white font-semibold">{peakElevation.toFixed(1)}° {peakDirectionSuffix}</strong>`.
  - Readout values: `87.9° N` vs `45.3° S` vs `90.0° ZENITH`.
* **Canvas Uncluttering & Reference Line Hierarchy**:
  - Floating `<text>` elements along diurnal reference curves inside the 260x138 SVG canvas are strictly prohibited to avoid clustering and collisions at mid-to-high altitudes.
  - Reference curves (summer solstice, winter solstice, equinox, monthly lunar extrema) render as clean, elegant dashed hairlines with native SVG `<title>` tooltips (`Summer Solstice Noon Peak: 87.9° N`, `Max Possible Lunar Altitude: 87.2° N`).
  - Precise signed bounds and physical directions are consolidated cleanly in the dedicated stats strip below the dome (`Summer Sol: 87.9° N · Winter Sol: 45.3° S` and `Max Standstill: 87.2° N · Min Standstill: 35.6° S`).
* **Horizon Compass Octant Badges**:
   - Compact micro-subline beneath sunrise/sunset and moonrise/moonset times: `text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5`.
   - Displays 16-point compass octants (e.g. `ENE · WNW`), with exact decimal azimuths available in hover tooltips (`Sunrise: 068° ENE · Sunset: 292° WNW`).
* **Meridian Profile Diurnal Chord Encodings**:
  - **Solar Daytime Chord**: Solid warm amber line (`#fbbf24`, `strokeWidth="1.5"`, `opacity="0.85"`), tracing the daytime transit from rise to set and touching the meridian arc at Solar Noon.
  - **Solar Sub-Horizon Twilight Chord**: Dashed deep amber line (`#d97706`, `strokeWidth="1.0"`, `strokeDasharray="2 2"`, `opacity="0.40"`), descending into the sub-horizon twilight strata down to $-18^\circ$.
  - **Lunar Daytime Chord**: Solid silver line (`#e2e8f0`, `strokeWidth="1.5"`, `opacity="0.85"`) in Standard mode, or Eclipse-convention colored (`#38bdf8` / `#f43f5e`) in Nodal mode.
* **Approach C Parked Ghost Anchor Tokens**:
  - **Twilight Gate Anchor Ring (`#sun-twilight-gate-anchor`)**: Static guide ring at $-18^\circ$ astronomical twilight threshold with radius $R=3.5\text{px}$, subtle slate stroke (`#64748b`, `strokeDasharray="1.5 1.5"`, `opacity="0.60"`).
  - **Horizon Gate Anchor Ring (`#moon-horizon-gate-anchor`)**: Static guide ring at $0^\circ$ horizon contact threshold with radius $R=3.5\text{px}$, subtle slate stroke (`#64748b`, `strokeDasharray="1.5 1.5"`, `opacity="0.60"`).
  - **Parked Ghost Bead**: Translucent dark fill (`#1e293b`), dashed perimeter stroke, subdued $0.35$ opacity, and radius $R=4.5\text{px}$, indicating a celestial body parked at its observation gate during nocturnal hours.
* **Central Ribbon Architecture & Consolidated Footer Tokens**:
  - **Upper Card Expansion (`isQuadMode={true}`)**: Automatically expands the diurnal card footer into a unified 4-column responsive grid (`grid-cols-4 gap-2`) consolidating:
    - *Column 1*: Solar Solstice Span ($\Delta\delta = 46.9^\circ$) / Lunar Standstill Span ($\Delta\delta = 57.2^\circ$).
    - *Column 2*: Summer Solstice Peak / Maximum Standstill Peak.
    - *Column 3*: Winter Solstice Peak / 30-Day Monthly Range.
    - *Column 4*: Hoisted `[Std | Twilight]` / `[Std | ☊ Nodes]` segmented toggle control.
  - **Lower Meridian Viewport (`hideFooter={true}`)**: Strips all redundant bottom bars, rendering a borderless flush bottom dome that visually anchors directly to the card floor.
