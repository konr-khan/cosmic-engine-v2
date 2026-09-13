# ADR 0025: Sky & Moon Dome Container/Presenter Decomposition & Shared Visual Primitives

## Status
Accepted

## Context
Following Milestone M24, the Today's Horizon Observatory visualizers provided high-precision topocentric diurnal elevation and meridian colure tracking. However, an architectural review of [`MoonElevationDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/MoonElevationDome.tsx) (~693 lines) and [`SunElevationDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SunElevationDome.tsx) (~408 lines) highlighted architectural friction and maintenance overhead:

1. **Monolithic Component State & Computation Coupling**:
   Both elevation dome components combined pure astronomical coordinate derivations, multi-step culmination bearing solvers, standstill extrema calculations, 5-tier twilight classifications, and complex SVG sub-structures directly within massive component render bodies.
2. **Duplicated Miniature Phase Disc Rendering**:
   The mathematical SVG path calculations for rendering the illuminated lunar crescent disc (terminator arc curvature, dark back-disc, specular highlights, and parallactic rotation) were duplicated between `MoonElevationDome.tsx` and `MoonMeridianDome.tsx`.
3. **Duplicated 4-Column Metric Panel Footers**:
   Both solar and lunar visualizers independently maintained identical 4-column summary grid layouts (Rise/Set octants, interactive transit time-snap buttons, declination spans, and mode view toggle buttons), duplicating layout styling and badge interaction handlers.
4. **Cognitive Load & Test Isolation**:
   Testing UI rendering required executing all mathematical cascades simultaneously, while verifying math derivations required mounting large React SVG trees.

---

## Decisions

### 1. Mathematical Computation Extraction via Dedicated Custom Hooks
Extracted pure domain calculation cascades out of component JSX and into dedicated custom hooks in `src/components/widgets/today/hooks/`:
- **[`useMoonElevationMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/hooks/useMoonElevationMath.ts)**:
  - Encapsulates lunar position, hour angle, topocentric elevation, and transit peak altitude.
  - Derives culmination bearings, rise/set octant azimuths, and monthly declination extrema.
  - Solves 18.6-year Major Lunar Standstill bounds and unreachable Zenith Cap geometry.
  - Computes $\pm 15$-day draconic node crossing markers and multi-day diurnal reference curves.
  - Evaluates instantaneous 60 FPS parallactic angles for fluid disk orientation.
- **[`useSunElevationMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/hooks/useSunElevationMath.ts)**:
  - Encapsulates instantaneous Earth-Sun distance (AU / km) and solar hour angle.
  - Derives solar culmination bearings, rise/set octant azimuths, and summer/winter solstice peaks.
  - Computes tropical boundary checks, unreachable Zenith Cap SVG paths, and 5-tier diurnal curves (solstices, today, twilight extensions).

Both hooks strictly adhere to nominal branded unit contracts without calling forbidden presentation conversion helpers.

### 2. Unified Visual Primitives (`src/components/widgets/today/common/`)
Created focused, reusable presentation components:
- **[`SkyDomeFooter.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/common/SkyDomeFooter.tsx)**:
  Standardized 4-column summary grid:
  - Column 1: Rise / Set times with 16-point octant azimuth.
  - Column 2: Transit snap button with theme-specific highlight (Amber for Sun, Indigo for Moon) and interactive chronometer jump.
  - Column 3: Instantaneous declination ($\delta$) and monthly/solstice span readouts.
  - Column 4: Primary Mode View toggle button (`Std` vs `Twilight` / `☊ Nodes`).
- **[`DraconicTimelineRail.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/common/DraconicTimelineRail.tsx)**:
  Extracted the interactive $\pm 15$-day draconic timeline rail with continuous color-coded orbital segments (Sky Blue North / Rose Red South), day tick marks, pinned node indicators ($\Omega$ / $\mho$), and pulsing active moon bead.
- **[`LunarPhaseDisc.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/common/LunarPhaseDisc.tsx)**:
  Extracted the reusable miniature phase crescent SVG renderer with accurate terminator path geometry, specular rim highlighting, and parallactic rotation. Reused across both `MoonElevationDome.tsx` and `MoonMeridianDome.tsx`.

### 3. Thin Presenter Components
Refactored `MoonElevationDome.tsx` and `SunElevationDome.tsx` into concise presenter components:
- `MoonElevationDome.tsx` dropped from 693 lines to 264 lines ($-62\%$).
- `SunElevationDome.tsx` dropped from 408 lines to 253 lines ($-38\%$).
- Maintained exact prop interfaces (`SunElevationDomeProps`, `MoonElevationDomeProps`) and identical DOM structures.

---

## Consequences

### Positive
- **Container/Presenter Separation**: Visualizers focus solely on SVG layout and user interaction, while mathematical derivations are cleanly encapsulated in custom hooks.
- **Cross-Component Reuse**: `LunarPhaseDisc` eliminated duplicated SVG terminator math across elevation and meridian visualizers.
- **Zero Visual or Behavioral Divergence**: Verified 100% backward compatibility with running dev server and existing widget integration suites.
- **Focused Unit Testing**: Added dedicated test suite [`SkyDomeHooksAndPrimitives.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SkyDomeHooksAndPrimitives.test.tsx) verifying hook outputs and primitive rendering in isolation.

### Invariants Maintained
- 100% test pass rate (657/657 tests at milestone completion).
- Zero AST branded unit violations (`npm run lint:units`).
- Zero TypeScript diagnostics (`tsc --noEmit`).
