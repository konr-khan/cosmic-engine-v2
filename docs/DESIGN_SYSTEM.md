# DESIGN_SYSTEM.md — Visual Tokens, Color Semantics & Interaction Grammar

This document codifies the design language, color tokens, 2D vector stroke encodings, and glassmorphic UI rules for **Cosmic Engine V2.0**.

---

## 1. Color Semantics & Astronomical Meaning

Cosmic Engine uses a strict semantic color palette to represent physical astronomical states and coordinate geometries consistently across all widgets:

| Color | Hex Token | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Sky Blue** | `#38bdf8` | `text-sky-400`, `fill-sky-400`, `bg-sky-400` | **Observer Location Pin ("YOU")**, **Ascending Lunar Orbital Node** ($\beta \ge 0$, North of ecliptic), **High Tide Water Indicator** |
| **Crimson / Rose** | `#f43f5e` | `text-rose-500`, `fill-rose-500`, `bg-rose-500` | **Descending Lunar Orbital Node** ($\beta < 0$, South of ecliptic), **Negative (Southern) Declination** |
| **Amber / Gold** | `#fbbf24` | `text-amber-400`, `fill-amber-400`, `border-amber-400` | **Subsolar Point**, **Sun Ray Vectors**, **Daylight Terminator Rim**, **Solar Noon Action** |
| **Indigo / Cyan** | `#6366f1` / `#06b6d4` | `text-indigo-400`, `text-cyan-400` | **Lunar Transit Action**, **Lunar Ray Vectors**, **Gravitational Syzygy / Spring Tide Potential** |
| **Deep Space Slate** | `#020617` / `#0b0f19` | `bg-slate-950`, `bg-slate-900` | **Deep Astronomical Night**, **Ocean Baseline**, **Card Backgrounds** |
| **Emerald** | `#10b981` | `text-emerald-400`, `bg-emerald-500` | **Celestial Equator Ring**, **Date Ring / Selector**, **Orbital Alignment (100%)**, **Perigee Status** |
| **Antique Brass / Gold** | `#b45309` / `#f59e0b` | `text-amber-500`, `stroke-amber-600` | **Outer Mater Rim**, **Ecliptic Rete**, **12 Zodiac Arcs**, **Astrolabe Sighting Rule (Alidade)** |
| **Cyan / Steel** | `#06b6d4` | `stroke-cyan-500`, `text-cyan-400` | **Local Horizon Ring**, **Almucantar Elevation Plate (Tympan)** |

---

## 2. 2D & 3D Vector Stroke & Path Encodings

To maximize information density without adding text clutter, orbital loops and curves adhere to standard vector stroke encodings:

### A. Gyro-Morph Armillary 3D Z-Depth Sorting & Historical Rete
* **Front Hemisphere ($z_{\text{cam}} \ge 0$)**: **Solid Stroke** with full opacity (`opacity="0.9"`) representing the celestial sphere facing the viewer.
* **Back Hemisphere ($z_{\text{cam}} < 0$)**: **Dashed Stroke** (`stroke-dasharray="3 3"`, `opacity="0.4"`) representing the far side of the celestial sphere.
* **Ecliptic Rete**: Divided into 12 alternating $30^\circ$ zodiac arcs with standard unicode glyphs (♈, ♉, ♊, ♋, ♌, ♍, ♎, ♏, ♐, ♑, ♒, ♓) rotating with Local Sidereal Time ($\theta_{\text{LST}}$).
* **Navigational Astrolabe Stars**: Rendered as 4-point diamond florets with radial flame pointers and glowing magnitude-scaled halos.

### B. Lunar Orbit Segmentation (Dual Eclipse Demonstrator & Macro Orbit)
* **Solid Stroke (`stroke-width="1.5"`)**: **Waxing Moon** ($0^\circ \to 180^\circ$ elongation).
* **Dashed Stroke (`stroke-dasharray="4 3"`)**: **Waning Moon** ($180^\circ \to 360^\circ$ elongation).
* **Sky Blue Stroke (`#38bdf8`)**: Orbital segment is **North of Ecliptic** ($\beta \ge 0$, Ascending hemisphere).
* **Rose Stroke (`#f43f5e`)**: Orbital segment is **South of Ecliptic** ($\beta < 0$, Descending hemisphere).

### C. Map & Horizon Curves
* **Dashed Amber Line (`stroke="#fbbf24" strokeDasharray="3 2"`)**: Exact daylight terminator boundary curve ($h = -0.833^\circ$).
* **Dashed Sky Blue Crosshair (`stroke="#38bdf8" strokeDasharray="4 2"`)**: User geographic latitude and centered prime meridian.

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

### Micro-Typography Standards
* **Mathematical Telemetry & Coordinates**: Always rendered in monospace (`font-mono`, e.g., `text-xs font-mono`, `text-[10px] font-mono`).
* **Widget Titles & Section Headers**: Rendered in clean sans-serif (`font-sans font-semibold tracking-wider text-xs uppercase`).
* **Interactive Hover HUDs**: Use `pointer-events-none` with fast fade/zoom animations (`animate-in fade-in zoom-in-95 duration-150`) to avoid blocking cursor scrub gestures.

---

## 4. 12-Column Responsive Panoramic Grid

The dashboard layout utilizes a flexible 12-column responsive CSS grid:

* **Full-Width Observatory Windows**: `col-span-12 2xl:col-span-6` (e.g. Dual Eclipse Demonstrator, Daylight Terminator Map, Macro Orbit View).
* **Compact Instruments**: `col-span-12 lg:col-span-6 3xl:col-span-3` (e.g. Micro Tide View).
* **Bottom Astrolabe Dock**: Fixed to the bottom viewport (`fixed bottom-0 left-0 right-0 z-50`) with an accessible expand/collapse tab.

---

## 5. Interaction Patterns

1. **Click-to-Snap**: Primary temporal milestones (Solar Noon, Lunar Transit) feature prominent action buttons with a compass icon that immediately set the chronometer time.
2. **Cross-Card Hover Synchronization**: Hovering over timestamps or calendar dates in any widget propagates `hoverTime` and `hoverDate` across all mounted visualizers simultaneously.
3. **Fluid Card Resizing**: Bottom-right resize thumbs allow non-destructive card expansion with a minimum height floor ($220\text{px}$).
