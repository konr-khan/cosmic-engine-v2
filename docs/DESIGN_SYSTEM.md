# DESIGN_SYSTEM.md — Visual Tokens, Color Semantics & Interaction Grammar

This document codifies the design language, color tokens, 2D vector stroke encodings, and glassmorphic UI rules for **Cosmic Engine V2.0**.

---

## 1. Color Semantics & Astronomical Meaning

Cosmic Engine uses a strict semantic color palette to represent physical astronomical states and coordinate geometries consistently across all widgets:

| Color | Hex Token | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Sky Blue** | `#38bdf8` | `text-sky-400`, `fill-sky-400`, `bg-sky-400` | **Observer Location Pin ("YOU")**, **Ascending Lunar Orbital Node** ($\beta \ge 0$, North of ecliptic), **High Tide Water Indicator** |
| **Crimson / Rose** | `#f43f5e` | `text-rose-500`, `fill-rose-500`, `bg-rose-500` | **Descending Lunar Orbital Node** ($\beta < 0$, South of ecliptic), **Negative (Southern) Declination** |
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
* **Keplerian Orbit Ring & Milestones**: Thin gold orbit path (`#fbbf24`, `0.75px`) with 6 glowing milestone halo nodes (Perihelion `#a855f7`, Solstices `#38bdf8`/`#f43f5e`, Equinoxes `#34d399`/`#fbbf24`, Aphelion `#818cf8`) featuring geodesic spherical SLERP trajectories.
* **Earth Bead**: Sky blue core (`#0284c7`, `#38bdf8`) with atmospheric glow and $23.44^\circ$ axial tilt vector.
* **Parametric Sun Bead**: Mathematically clamped directly to $(r_0 \cos\lambda, r_0 \sin\lambda \sin\epsilon, r_0 \sin\lambda \cos\epsilon)$ on the Ecliptic track across all 4 seasons and free Rete rotation (residual $< 1.42 \times 10^{-13}\text{ px}$).
* **Ecliptic Rete**: Divided into 12 alternating $30^\circ$ zodiac arcs with standard unicode glyphs (♈, ♉, ♊, ♋, ♌, ♍, ♎, ♏, ♐, ♑, ♒, ♓) rotating with Local Sidereal Time ($\theta_{\text{LST}}$) or freely in Astrolabe Solver Mode.
* **Navigational Astrolabe Stars**: Rendered as delicate diamond florets (`strokeWidth="0.6"`, `r="1.2-3.2px"`) with hairline dashed flame pointers and glowing magnitude halos.
* **SED Hairline Alidade Sighting Arm**: Slim $1.6\text{px}$ brass ruler body with dark wood inlay (`#78350f`, $0.75\text{px}$), cyan laser sightline (`#38bdf8`, $0.75\text{px}$ dashed), dual pinhole pinnule sighting vanes, and central reticle pin.

### B. Lunar Orbit Segmentation (Dual Eclipse Demonstrator & Macro Orbit)
* **Solid Stroke (`stroke-width="1.5"`)**: **Waxing Moon** ($0^\circ \to 180^\circ$ elongation).
* **Dashed Stroke (`stroke-dasharray="4 3"`)**: **Waning Moon** ($180^\circ \to 360^\circ$ elongation).
* **Sky Blue Stroke (`#38bdf8`)**: Orbital segment is **North of Ecliptic** ($\beta \ge 0$, Ascending hemisphere).
* **Rose Stroke (`#f43f5e`)**: Orbital segment is **South of Ecliptic** ($\beta < 0$, Descending hemisphere).

### C. Map & Horizon Curves
* **Dashed Amber Line (`stroke="#fbbf24" strokeDasharray="3 2"`)**: Exact daylight terminator boundary curve ($h = -0.833^\circ$).
* **Dashed Sky Blue Crosshair (`stroke="#38bdf8" strokeDasharray="4 2"`)**: User geographic latitude and centered prime meridian.

### D. Reusable High-Precision `<MiniGlobe />` Visual Tokens & Layer Hierarchy

The `<MiniGlobe />` component (`src/components/common/MiniGlobe.tsx`) unifies the graphical representation of planet Earth across all 2D and 3D visualizers. It renders a clean, non-tearing 9-layer SVG hierarchy with strict semantic tokens:

```
┌─────────────────────────────────────────────────────────────┐
│ 9. Enlarged Touch Hit Target (r = 1.6R, cursor-pointer)     │
│ 8. Monospace Label Overlay ("EARTH", drop-shadow-md)        │
│ 7. Observer Pin ("YOU") (Pulsing #38bdf8 day / #64748b night│
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
| **4. Parallels** | Equator / Tropics | Equator `#38bdf8` (`strokeWidth="0.75"`, dashed `2 1.5`); Tropics `#64748b` (`strokeWidth="0.5"`, dashed `2 1.5`) | $0^\circ$ Celestial Equator and $\pm 23.44^\circ$ Solstice Tropics |
| **5. Polar Axis** | 23.44° Rotational Axis | `#93c5fd` (`strokeWidth="0.85"`, dashed `2.5 1.5`, opacity `0.75`) | Rotated rotational axis passing through poles |
| **6. Limb Rim** | Outer Rim | `#60a5fa` (`strokeWidth="1.2"`, opacity `0.8`) + inner `#93c5fd` (`strokeWidth="0.4"`) | Dual-layer specular spherical limb boundary |
| **7. Observer Pin** | Observer Marker ("YOU") | Day: Sky Blue `#38bdf8` ($r=1.6-1.8\text{px}$) + white ring + pulse halo; Night: Muted Slate `#64748b` ($r=1.3-1.5\text{px}$) | True topocentric geographic observer pin |
| **8. Label** | Monospace Tag | Monospace `text-[9px] font-mono font-bold fill-blue-300` | High-contrast label with dark drop shadow |
| **9. Hit Target** | Pointer Target | `fill="transparent"`, $r = \max(16\text{px}, 1.6 R)$ | Generous hit area preventing hover flickering |

#### 2. Canonical View Modes
* **`topdown` (Heliocentric Macro Orbit)**: Renders Sunward daylight semicircle oriented dynamically toward Sun focus F1 (`sunAngleDeg`), with tilted $23.44^\circ$ polar axis and elliptical equator/tropics chords.
* **`transverse` (Eclipse Left Pane — Side Profile)**: Renders side-on transverse profile with Sun on left ($X < cx$), tilted polar axis $\theta_{\text{side}} = \varepsilon \sin\lambda_\odot$, and dashed equator chord.
* **`axial` (Eclipse Right Pane — Sightline View)**: Renders down-the-barrel sightline through Earth with curved 3D front equator arc and night-side viewer perspective.
* **`euler3d` (Armillary 3D Apparent View)**: Renders 3D sphere rotating dynamically with user Euler camera dragging $(\text{Pitch}, \text{Yaw}, \text{Roll})$ in inertial space with analytical limb clipping.
* **`flat` (Astrolabe 2D Plate Modes)**: Renders precision concentric brass pivot pin (`#b45309`/`#78350f`, $0.75\text{px}$) with dark core (`#0f172a`), pulsing Sky Blue center dot (`#38bdf8`), and fine crosshair reticle (`#78350f`, $0.5\text{px}$).


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
  - **☊ Nodal Loop Mode**: Decomposes the $R = 60\text{px}$ top-down lunar orbit into 4 color-coded, stroke-coded quadrants based on the Moon's elongation from the Sun and ecliptic latitude $\beta$:
    1. **Waxing Ascending** ($E \in [0^\circ, 180^\circ], \beta \ge 0$): Solid Sky Blue (`#38bdf8`, `strokeWidth="1.2"`).
    2. **Waxing Descending** ($E \in [0^\circ, 180^\circ], \beta < 0$): Solid Rose Red (`#f43f5e`, `strokeWidth="1.2"`).
    3. **Waning Ascending** ($E \in [180^\circ, 360^\circ], \beta \ge 0$): Dashed Sky Blue (`#38bdf8`, `strokeDasharray="4 3"`).
    4. **Waning Descending** ($E \in [180^\circ, 360^\circ], \beta < 0$): Dashed Rose Red (`#f43f5e`, `strokeDasharray="4 3"`).
* **Dynamic Node Pins**:
  - **Ascending Node ($\Omega / ☊$) Pin**: Placed at $\theta_{\Omega} = \theta_{\text{sun}} + (\Omega - \lambda_{\text{sun}})$, styled with a Sky Blue border and `☊` text label.
  - **Descending Node ($\mho / ☋$) Pin**: Placed at $\theta_{\mho} = \theta_{\Omega} + 180^\circ$, styled with a Rose Red border and `☋` text label.
* **Moon Body Nodal Indicator**:
  - In Nodal Loop mode, the Moon body features an outer pulsing halo rim matching the Moon's active ecliptic hemisphere: Sky Blue for North ($\beta \ge 0$) or Rose Red for South ($\beta < 0$).
* **Glassmorphic Nodal Legend**:
  - Displays a compact floating overlay at `bottom-2.5 left-2.5` indicating node color semantics (`☊ Ascending (+β)`, `☋ Descending (-β)`) and stroke styling (`Solid: Waxing`, `Dashed: Waning`).
