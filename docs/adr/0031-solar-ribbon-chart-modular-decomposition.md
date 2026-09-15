# ADR 0031: Solar Ribbon Chart Modular Decomposition

## Status
Accepted

## Context
Following the modular decomposition of [`LunarRibbonChart.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/LunarRibbonChart.tsx) into focused ribbon subcomponents ([`LunarRibbonAxes.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/ribbon/LunarRibbonAxes.tsx), [`LunarRibbonCurves.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/ribbon/LunarRibbonCurves.tsx), [`LunarRibbonHud.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/lunar/ribbon/LunarRibbonHud.tsx)), the corresponding annual solar visualizer ([`SolarRibbonChart.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/SolarRibbonChart.tsx)) remained a 420-line monolith.

In `SolarRibbonChart.tsx`:
1. **Coupled Rendering Responsibilities**:
   All SVG `<defs>` gradient declarations, 4-tier annual twilight filled polygon bands (`astroDusk/Dawn`, `nauticalDusk/Dawn`, `civilDusk/Dawn`, `sunset/sunrise`), 12-month calendar column dividers, 24-hour time grids, boundary lines, dynamic sunrise/sunset guidelines, mirrored daylight solstice guidelines, and interactive hover hairline/tooltip cards were rendered inline inside a single monolithic JSX return tree.
2. **Maintenance & Testing Friction**:
   Testing individual visual strata (such as verifying month division or gradient IDs) required mounting the entire interactive scrubber component.
3. **Subsystem Asymmetry**:
   The Lunar Almanac had a clean `ribbon/` architecture while the Solar Almanac lacked modular decomposition.

---

## Decisions

### 1. Dedicated Solar Ribbon Subsystem (`src/components/widgets/solar/ribbon/`)
Created a modular subcomponent architecture under `src/components/widgets/solar/ribbon/`:
- **[`SolarRibbonAxes.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/ribbon/SolarRibbonAxes.tsx)**:
  - Renders 12 month dividers and text labels (`Jan` through `Dec`) with vertical dashed dividers (`strokeOpacity="0.25"`).
  - Renders 24-hour horizontal time grid lines and labels (`0` to `24h`, `12 AM`, `12 PM`, `Midnight`, `Noon`) with bold midnight/noon typography.
- **[`SolarRibbonBands.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/ribbon/SolarRibbonBands.tsx)**:
  - Declares `<defs>` with canonical linear gradients: `solarAlmanacDayGrad`, `solarAlmanacCivilGrad`, `solarAlmanacNauticalGrad`, and `solarAlmanacAstroGrad`.
  - Renders base night canvas `<rect fill="#020617" rx="6" />`.
  - Renders the 4 annual twilight filled polygon paths (`astroDusk/Dawn`, `nauticalDusk/Dawn`, `civilDusk/Dawn`, `sunset/sunrise`).
  - Renders boundary curves for sunrise, sunset, solar noon analemma curve (`solarNoon`), civil dawn, and civil dusk.
  - Renders key stats annotations (Earliest Sunrise and Latest Sunset milestone markers).
- **[`SolarRibbonOverlay.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/ribbon/SolarRibbonOverlay.tsx)**:
  - Renders dynamic horizontal guidelines for active day sunrise and sunset with right-axis time tags.
  - Renders synced hover time horizontal guideline, axis time tick, and floating dual-time badge (`${formatTime(chartHoverTime)} LST (${formatTime(hoverTime)}Z)`).
  - Renders solstice mirrored equivalent daylight vertical guideline (`#6366f1`), intersection dots, and top badge.
  - Renders current selected day vertical guideline (`#f43f5e`) and markers (sunrise, sunset, solar noon).
  - Renders interactive hover day guide hairline (`#38bdf8`), curve intersection markers, and floating SVG tooltip card (`Jan 5`, `10.0h Day`, Rise, Set, Solar Noon, Equiv).
- **[`index.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/solar/ribbon/index.ts)**:
  - Clean barrel export for `SolarRibbonAxes`, `SolarRibbonBands`, `SolarRibbonOverlay`, and all related prop types.

### 2. Streamlined Orchestrator (`SolarRibbonChart.tsx`)
- Retained `useRibbonScrubber` coordination, `buildBandPath`, `buildLinePath`, and `currentMirrorDayData` calculation.
- Replaced 260+ lines of inline SVG markup with composed subcomponents:
  ```tsx
  <svg ref={svgRef} ...>
    <SolarRibbonBands ... />
    <SolarRibbonAxes ... />
    <SolarRibbonOverlay ... />
  </svg>
  ```
- Retained top-level `React.memo` wrapper to preserve 0 FPS chronometer playback insulation (ADR-0029).
- Reduced `SolarRibbonChart.tsx` from **420 LOC to ~120 LOC** ($-71\%$).

### 3. Subsystem Re-export (`src/components/widgets/solar/index.ts`)
- Re-exported ribbon subcomponents from `./ribbon` for comprehensive testing and external composability.

### 4. Expanded Unit Tests (`SolarWidget.test.tsx`)
- Added assertions verifying exports of `SolarRibbonAxes`, `SolarRibbonBands`, and `SolarRibbonOverlay`.
- Added isolated unit tests for `SolarRibbonAxes`, `SolarRibbonBands`, and `SolarRibbonOverlay`.
- Preserved existing `SolarRibbonChart` integration test.

---

## Consequences

### Positive
- **Architectural Symmetry**: Solar Almanac and Lunar Almanac now share an identical modular ribbon decomposition paradigm (`*Axes`, `*Bands`/`*Curves`, `*Overlay`/`*Hud`).
- **Separation of Concerns**: Pure 365-day annual SVG geometry calculation is decoupled from interactive cursor and tooltip overlay rendering.
- **Maintainability**: Reduced `SolarRibbonChart.tsx` by over 70% in line count.
- **Zero Regressions**: 100% test pass rate, clean production build, and zero AST unit safety violations.
