# ADR 0029: 60 FPS Chronometer Cascade Fix and Static Widget Render Decoupling

## Status
Accepted

## Context
Cosmic Engine V2.0 features an interactive Orbital Chronometer dock driven by a continuous 60 FPS animation ticker (`requestAnimationFrame` in `src/store/cosmicStore.ts`). When the chronometer is running, `cosmicStore` increments `timeOfDay` and updates Julian dates at 60 Hz.

Under the previous architecture, running the chronometer caused **every mounted widget** across the entire observatory dashboard to re-render 60 times per second, resulting in severe CPU spikes, unnecessary garbage collection churn, and battery drain. Profiling identified several interlocking root causes:
1. **Unconditional Store Selectors in Ephemeris Hooks**:
   In `useCosmicEngine.ts` and `useCosmicScene.ts`, the hook subscribed to `useChronometerStore` with a static selector (`selectStoreState`) returning `state.timeOfDay` unconditionally. Even if a caller supplied an explicit static override (e.g. `paramTimeOfDay = 12`), the hook remained subscribed to reactive ticking updates, causing hook consumers to re-execute 60 times/second.
2. **Monolithic Container Widget Wrapper**:
   In `src/App.tsx`, `StandardWidgetContent` acted as a monolithic wrapper that subscribed to all chronometer state variables (`date`, `timeOfDay`, `latitude`, `longitude`, `useAnalemma`) and invoked `useCosmicEngine` with an aggressive multi-widget flag set (`activeWidgets: { almanac: true, lunarAlmanac: true, ... }`). As a consequence, mounting any standard widget forced all active widget ephemeris math to recompute every 16.6 ms.
3. **Prop-Drilling Live Time to Static Calendar Cards**:
   `SolarAlmanacCard` received live `currentTime` prop-drilled down from the dashboard container solely for the benefit of the nested `PolarSunlightDial`. This forced the entire `SolarAlmanacCard`—including its extensive date calculations and solar metadata headers—to re-render at 60 FPS.
4. **Unmemoized Complex SVG Ribbon Charts**:
   Neither `SolarRibbonChart` nor `LunarRibbonChart` were wrapped in `React.memo`. Any incidental re-render of their parent card components forced 365-day SVG ribbon path geometry, twilight polygons, and moon phase disc arrays to be recalculated and re-reconciled every frame.
5. **Coupled Diurnal Time in Macro Orbit**:
   `MacroOrbitView` subscribed to `timeOfDay` in `selectMacroObserverParams`, despite heliocentric Keplerian orbits having zero physical dependence on diurnal hour angles.
6. **Chronometer Dock Twilight Churn**:
   `MemoizedChronometerDock` passed live `timeOfDay` to `useCosmicEngine(..., { almanac: true })` for twilight status calculations, recomputing daily rise/set twilight intervals on every animation frame.

---

## Decisions

### 1. Parameterized Selective Store Selectors (`useCosmicEngine.ts` & `useCosmicScene.ts`)
In both `useCosmicEngine` and `useCosmicScene`:
- Replaced static `selectStoreState` with a parameterized `useCallback` selector that checks whether caller-supplied overrides exist:
  ```typescript
  const isDateProvided = paramDate != null;
  const isTimeProvided = paramTimeOfDay != null;
  const isLatProvided = paramLatitude != null;
  const isLonProvided = paramLongitude != null;
  const isAnalemmaProvided = paramUseAnalemma != null;

  const selector = useCallback((state: CosmicStoreState) => ({
    date: isDateProvided ? null : state.date,
    timeOfDay: isTimeProvided ? null : state.timeOfDay,
    latitude: isLatProvided ? null : state.latitude,
    longitude: isLonProvided ? null : state.longitude,
    useAnalemma: isAnalemmaProvided ? null : state.useAnalemma,
  }), [isDateProvided, isTimeProvided, isLatProvided, isLonProvided, isAnalemmaProvided]);
  ```
- Because `useChronometerStore` employs shallow equality checks (`shallowEqual`), any slice returning `null` remains reference-identical across ticks. Callers passing explicit static inputs (such as fixed `12 as HoursDecimal`) completely decouple from 60 FPS chronometer ticker notifications.

### 2. Decomposition of Monolithic `StandardWidgetContent` into 8 Dedicated Components (`App.tsx`)
Decomposed `StandardWidgetContent` into 8 discrete, memoized content components wrapped with `React.memo`:
- **Static Ephemeris & Calendar Subsystems**:
  - `SolarAlmanacWidgetContent`: Subscribes exclusively to `selectCalendarParams` (`{ date, latitude, longitude, useAnalemma }`, omitting `timeOfDay`), passing fixed `12 as HoursDecimal` and `{ almanac: true }` to `useCosmicEngine`.
  - `LunarAlmanacWidgetContent`: Subscribes exclusively to `selectCalendarParams`, passing fixed `12 as HoursDecimal` and `{ lunarAlmanac: true }`.
  - `MacroOrbitWidgetContent`: Subscribes strictly to `s => s.date`, bypassing time and observer coordinates entirely.
- **Dynamic Real-Time Subsystems**:
  - `TodayWidgetContent`: Subscribes to `selectRealtimeParams` with `{ today: true }`.
  - `TerminatorWidgetContent`: Subscribes to `selectRealtimeParams` with `{ map: true }`.
  - `ArmillaryWidgetContent`: Subscribes to `selectRealtimeParams` with `{ armillary: true }`.
  - `MicroTidesWidgetContent`: Subscribes to `selectRealtimeParams` with `{ microTides: true }`.
  - `EclipseWidgetContent`: Subscribes to `selectRealtimeParams` with `{ eclipse: true }`.
- Replaced monolithic dispatch with a clean `switch (id)` in `MemoizedWidgetContent`, routing directly to the isolated memoized content wrappers.

### 3. Direct Store Subscription in `PolarSunlightDial` (`PolarSunlightDial.tsx`)
- Subscribed `PolarSunlightDial` directly to `selectTimeOfDay` via `useChronometerStore` as a fallback when `currentTime` is omitted:
  ```typescript
  const storeTime = useChronometerStore(selectTimeOfDay);
  const effectiveCurrentTime = currentTime !== undefined ? currentTime : storeTime;
  ```
- Removed the live `currentTime` prop passed into `SolarAlmanacCard` from `App.tsx`.
- `SolarAlmanacCard` now renders strictly at 0 FPS during chronometer playback, while the nested `PolarSunlightDial` hand animates smoothly at 60 FPS.

### 4. `React.memo` Insulation on Ribbon Charts (`SolarRibbonChart.tsx`, `LunarRibbonChart.tsx`)
- Wrapped both `SolarRibbonChart` and `LunarRibbonChart` with `React.memo`.
- Ensured 365-day SVG paths, twilight polygons, and synodic disc arrays are protected from parent render passes, executing only when underlying matrix or date props mutate.

### 5. Decoupling of Diurnal `timeOfDay` in `MacroOrbitView` (`MacroOrbitView.tsx`)
- Updated `selectMacroObserverParams` to subscribe solely to `latitude` and `longitude`, removing `timeOfDay`.
- Passed fixed `timeOfDay: 12` to `useHeliocentricScene` and child subsolar/sublunar coordinate mappers, completely insulating Keplerian orbit rendering from 60 Hz ticker wakeups.

### 6. Chronometer Dock Twilight State Stabilization (`App.tsx`)
- In `MemoizedChronometerDock`, stabilized `useCosmicEngine` by supplying fixed `12 as HoursDecimal` instead of live `timeOfDay`:
  ```typescript
  const { solarData } = useCosmicEngine(
    date,
    12 as HoursDecimal,
    latitude as Latitude,
    longitude as Longitude,
    useAnalemma,
    { almanac: true }
  );
  ```
- Daily sunrise, sunset, and twilight boundary timestamps are invariant to diurnal time; pinning calculation to solar noon eliminated per-frame recalculations in the dock.

---

## Consequences

### Positive
- **Dramatic CPU & Power Optimization**: Dropped CPU utilization during chronometer playback significantly. Static widgets (Solar Almanac, Lunar Almanac, Macro Orbit) operate at **0 FPS** during playback, rendering only when dates or locations change.
- **Full 60 FPS Fluidity Where Needed**: Dynamic viewports (Today's Sky horizon dome, Terminator Map, Gyro-Morph Armillary, MicroTides, Eclipse Demonstrator) retain buttery 60 FPS real-time updates without frame drops.
- **Fine-Grained Re-Render Isolation**: Scrubber interactions and chronometer playback are completely decoupled from heavy SVG chart regeneration.
- **100% Backward Compatibility**: Public interfaces for `useCosmicEngine` and `useCosmicScene` remain unchanged. Callers passing explicit parameters automatically benefit from selective store decoupling.

### Negative / Trade-Offs
- `App.tsx` contains 8 specialized content wrappers instead of a single catch-all wrapper, slightly expanding file line count while markedly improving structural clarity and maintainability.
- Components supplying custom `timeOfDay` must be aware that `useCosmicEngine` will not react to global chronometer ticks for that parameter, which is the intended behavior.
