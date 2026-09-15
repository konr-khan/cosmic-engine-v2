# ADR 0030: Meridian Dome Container/Presenter Hooks, Redundant Cast Cleanup & Active Filter Logic Consolidation

## Status
Accepted

## Context
Following Milestone M25 (which successfully extracted calculation cascades from the Elevation Domes into `useSunElevationMath` and `useMoonElevationMath`) and Milestone M29 (which decomposed the dashboard widget containers to eliminate 60 FPS cascades), two remaining areas of technical debt and maintenance overhead were identified:

1. **Monolithic Meridian Dome Components**:
   - Both [`SunMeridianDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SunMeridianDome.tsx) (593 lines) and [`MoonMeridianDome.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/MoonMeridianDome.tsx) (629 lines) remained heavyweight monoliths.
   - They intertwined complex mathematical derivations—3D diurnal colure direction cosines, split solstice/standstill swaths, polar antimeridian counterpart chords ($180^\circ$), 5-tier twilight thresholds, nodal crossing ticks ($\beta = 0^\circ$), and parked horizon gate anchors—directly inside component render bodies.
   - This tight coupling prevented isolated unit testing of the meridian math derivations without mounting full React SVG component trees.

2. **Redundant Branded Type Assertions**:
   - In [`src/App.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/App.tsx), redundant `latitude as Latitude`, `longitude as Longitude`, and `timeOfDay as HoursDecimal` type assertions remained across widget container wrappers (`TodayWidgetContent`, `TerminatorWidgetContent`, `ArmillaryWidgetContent`, `MicroTidesWidgetContent`, `EclipseWidgetContent`, `LunarAlmanacWidgetContent`, `SolarAlmanacWidgetContent`, and `MemoizedChronometerDock`), despite `CosmicStoreState` already branding these primitive properties.

3. **Duplicated Filter Active-Category Boolean Reduction**:
   - In [`src/hooks/useCosmicEngine.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/hooks/useCosmicEngine.ts), the boolean resolution logic for `isLunarActive`, `isEclipseActive`, and `isOrbitalActive` duplicated multi-clause positive-filtering and negation-exclusion branches across three separate key collections.

---

## Decisions

### 1. Solar Meridian Math Hook (`useSunMeridianMath.ts`)
Created [`src/components/widgets/today/hooks/useSunMeridianMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/hooks/useSunMeridianMath.ts):
- Accepts `{ solarData, displayTime, latitude, currentDate, isTwilightModeActive }: UseSunMeridianMathParams`.
- Encapsulates:
  - Solar culmination altitude and directional bearing (`todayCulmination`).
  - Solstice and Equinox culmination points on the $R=92$ meridian dome arc (`junePoint`, `decemberPoint`, `equinoxPoint`).
  - Bifurcated milestone swaths (`solstice-swath-june`, `solstice-swath-december`) with dynamic $d\delta/dt$ solar velocity migration styling.
  - Sub-horizon twilight extensions down to $-18^\circ$ astronomical twilight strata.
  - Polar latitude ($|\phi| \ge 89.9^\circ$) antimeridian ($180^\circ$) counterpart arcs, chords, and midnight sun culminations.
  - Instantaneous 3D diurnal colure direction cosines and tangent diurnal chords (`todayChord`).
  - Sub-horizon parked ghost anchors (`sun-twilight-gate-anchor` at $-18^\circ$ or $0^\circ$).
- Memoizes all calculations with strict dependency arrays and exports `useSunMeridianMath`, `OBLIQUITY`, `getTwilightTier`, and types.

### 2. Lunar Meridian Math Hook (`useMoonMeridianMath.ts`)
Created [`src/components/widgets/today/hooks/useMoonMeridianMath.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/hooks/useMoonMeridianMath.ts):
- Accepts `{ orbitalData, solarData, displayTime, latitude, currentDate, isNodalModeActive }: UseMoonMeridianMathParams`.
- Encapsulates:
  - Lunar transit peak altitude and directional bearing (`todayCulmination`).
  - Major Lunar Standstill ($\pm 28.584^\circ$) extrema culminations and rolling 30-day monthly declination bounds (`monthMax`, `monthMin`).
  - Ecliptic node level ($\beta = 0^\circ$) markers with ascending ($\Omega$) and descending ($\mho$) node glyphs.
  - Nodal kinematics color conventions (Sky Blue `#38bdf8` for $\beta \ge 0^\circ$ vs Rose Red `#f43f5e` for $\beta < 0^\circ$; solid prograde vs dashed retrograde).
  - Standstill and monthly migration swaths (`lunar-migration-swath-max`, `lunar-migration-swath-min`).
  - Polar antimeridian counterpart chords and constant diurnal parallels.
  - Instantaneous topocentric lunar elevation and parked horizon gate anchors (`moon-horizon-gate-anchor`).
- Exports `useMoonMeridianMath`, `LUNAR_MAX_DEC`, and types.

### 3. Thin Presenter Decomposition for Meridian Domes
Refactored both dome components to consume their respective math hooks:
- **`SunMeridianDome.tsx`**: Reduced from **593 LOC to 271 LOC** ($-54.3\%$).
- **`MoonMeridianDome.tsx`**: Reduced from **629 LOC to 306 LOC** ($-51.3\%$).
- Preserved 100% of public prop interfaces, DOM element IDs (`active-solar-noon-bead`, `active-lunar-transit-bead`, `noon-peak-card`, `lunar-peak-card`), SVG elements, CSS classes, tooltips, and interactive view toggle buttons.

### 4. Type Assertion Hygiene in Container Wrappers
In `src/App.tsx`:
- Removed redundant `as Latitude`, `as Longitude`, and `as HoursDecimal` assertions across all container widgets.
- Removed unused imports of `Latitude` and `Longitude`.

### 5. Consolidated Category Filtering in `useCosmicEngine.ts`
Extracted and exported:
```typescript
export const resolveActiveCategory = (
  categoryKeys: readonly string[],
  activeWidgets: ActiveWidgetsFilter
): boolean => {
  const hasExplicitPositiveOnly = 
    Object.values(activeWidgets).some(v => v === true) && 
    !Object.values(activeWidgets).some(v => v === false);

  return hasExplicitPositiveOnly
    ? categoryKeys.some(k => Boolean(activeWidgets[k as keyof ActiveWidgetsFilter]))
    : categoryKeys.some(k => activeWidgets[k as keyof ActiveWidgetsFilter] === true) ||
      (!categoryKeys.some(k => activeWidgets[k as keyof ActiveWidgetsFilter] === false));
};
```
Eliminated redundant logic across `isLunarActive`, `isEclipseActive`, and `isOrbitalActive`.

### 6. Isolated Unit Testing
- Expanded [`SkyDomeHooksAndPrimitives.test.tsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/today/SkyDomeHooksAndPrimitives.test.tsx) with tests for `useSunMeridianMath` and `useMoonMeridianMath` across temperate, polar singularity (90°N), sub-horizon, and nodal modes.
- Expanded [`useCosmicEngine.test.ts`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/hooks/useCosmicEngine.test.ts) with tests for `resolveActiveCategory`.

---

## Consequences

### Positive
- **Dramatic LOC Reduction**: Over 640 lines of boilerplate and derivation cascades removed from UI component layers.
- **Architectural Symmetry**: All four Today's Sky observatory domes (`SunElevationDome`, `MoonElevationDome`, `SunMeridianDome`, `MoonMeridianDome`) now consistently follow the Container/Presenter separation pattern via dedicated `use*Math` hooks.
- **Pure Testability**: Meridian coordinate mathematics, swath generation, and gate anchoring can now be tested in headless environments without DOM or SVG overhead.
- **Zero Type & Unit Safety Regressions**: 100% compliant with AST unit safety rules (`npm run lint:units`), zero TypeScript compilation errors (`tsc --noEmit`), and 717/717 unit tests passing.
