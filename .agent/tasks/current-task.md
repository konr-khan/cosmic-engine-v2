# Current Task: Cosmic Engine V2.0 Architecture & Theme Normalization Protocol

**Role Focus**: Systems Implementation & UI/Engine Normalization  
**Status**: Phase 1 Completed (Ready for Phase 2)  
**Target Platform**: React 19 / Vite / Tailwind CSS v4 / Vitest  

---

## 1. Objective & Goals

Transform Cosmic Engine V2.0 into a unified, high-performance celestial mechanics observatory by:
1. **Scoping Hook & Worker Computations**: Scope `useCosmicEngine` parameters per widget instance in `App.jsx` (`{ [id]: true }`) to eliminate worker queue contention and redundant calculation cycles on animation tick frames.
2. **Eliminating Dead Code Bloat**: Safely remove orphaned legacy files (`GlobalCommandBar.jsx` and `AnnualChart.jsx`).
3. **Establishing Canonical Window Boundaries**: Refactor `DashboardWindow.jsx` to dark glassmorphism (`bg-slate-900/90 border-b border-slate-800 text-slate-200`) and strip duplicate outer card containers/double `<h3>` title bars from all 8 widget components.
4. **Normalizing Observatory Visual Palette**: Convert all remaining light-mode widgets (`TerminatorMap`, `LunarAlmanacCard`, `MicroTideView`, `SunClock`) to the unified slate/indigo/cyan/amber cosmic theme.
5. **Guaranteeing 100% Test Stability**: Maintain zero regression across all 64 Vitest math and engine tests.

---

## 2. Target File Paths

### Modified Files:
- [`src/App.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/App.jsx) — Scope `useCosmicEngine` flags per widget instance in `MemoizedWidgetContent`.
- [`src/components/layout/DashboardWindow.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/layout/DashboardWindow.jsx) — Dark theme header bar and clean body container styling.
- [`src/components/widgets/CelestialSphereView.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/CelestialSphereView.jsx) — Remove redundant card container and duplicate title bar; inline view-mode tabs.
- [`src/components/widgets/EclipseDemonstrator.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/EclipseDemonstrator.jsx) — Remove redundant card wrapper and duplicate title bar; inline status badge and mode tabs.
- [`src/components/widgets/MacroOrbitView.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/MacroOrbitView.jsx) — Remove redundant card container and duplicate header; preserve eccentricity toggle and eclipse badge.
- [`src/components/widgets/SolarAlmanac.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/SolarAlmanac.jsx) — Ensure unbordered root container flush with window body.
- [`src/components/widgets/TerminatorMap.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/TerminatorMap.jsx) — Remove `bg-white/border-slate-200`, re-theme continents/meridians to dark slate space palette.
- [`src/components/widgets/LunarAlmanacCard.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/LunarAlmanacCard.jsx) — Remove `bg-white/border-slate-200`, re-theme fast-jump buttons and harmonic wave panel to dark theme tokens.
- [`src/components/widgets/MicroTideView.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/MicroTideView.jsx) — Remove `bg-white/bg-blue-50`, convert to `bg-slate-950` with slate/indigo readouts.
- [`src/components/widgets/SunClock.jsx`](file:///c:/Users/konrk/OneDrive/Documents/ProgrammingProjects/Cosmic%20Engine%20V2.0/src/components/widgets/SunClock.jsx) — Replace `bg-slate-50` pills and white center disc with dark glass styling and slate/amber text.

### Deleted Files:
- `src/components/controls/GlobalCommandBar.jsx` (Orphaned legacy control bar)
- `src/components/common/AnnualChart.jsx` (Orphaned legacy Recharts component)

---

## 3. Interface Signatures & Data Contracts

### A. Scoped Engine Flag Dispatch Contract (`src/App.jsx`)
```jsx
// MemoizedWidgetContent must pass targeted domain flag to useCosmicEngine
const { solarData, orbitalData } = useCosmicEngine(
  date,
  timeOfDay,
  latitude,
  longitude,
  useAnalemma,
  { [id]: true } // Scoped flag prevents worker dispatch for solar-only widgets
);
```

### B. Standardized Widget Container Layout Contract
Every widget root element mounted inside `DashboardWindow` must implement:
```jsx
<div className="flex flex-col h-full w-full justify-between select-none">
  {/* Inline Control / Filter Rail (Optional) */}
  <div className="flex justify-between items-center gap-2 mb-2">
    {/* Status indicators, fast-jump pills, mode switch buttons */}
  </div>

  {/* Responsive SVG Canvas / Viewport */}
  <div className="relative w-full flex-1 min-h-[220px] flex items-center justify-center">
    <svg className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
      {/* Visual content */}
    </svg>
  </div>

  {/* Metric Readout Footer (Optional) */}
  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
    {/* Sub-card stat readouts */}
  </div>
</div>
```

### C. Color Token Dictionary
- **Window Surface**: `bg-slate-900 rounded-2xl shadow-sm border border-slate-800`
- **Window Header**: `bg-slate-900/90 border-b border-slate-800 text-slate-200`
- **Sub-panel / Card Surface**: `bg-slate-950/60 border border-slate-800/80 text-slate-200`
- **Canvas Base**: `bg-slate-950 rounded-xl border border-slate-800/80`
- **Primary Text**: `text-slate-100` / `text-white font-sans`
- **Secondary / Metric Text**: `text-slate-400 font-mono`
- **Solar Highlights**: `text-amber-400 bg-amber-500/10 border-amber-500/30`
- **Lunar Highlights**: `text-indigo-400 bg-indigo-500/10 border-indigo-500/30`
- **Eclipse / Syzygy Highlights**: `text-rose-400 bg-rose-500/10 border-rose-500/30`

---

## 4. Phase-by-Phase Task Checklist

### Phase 1: Engine Scoping & Dead Code Pruning
- [x] Delete `src/components/controls/GlobalCommandBar.jsx`
- [x] Delete `src/components/common/AnnualChart.jsx`
- [x] Update `src/App.jsx`: Scope `useCosmicEngine` in `MemoizedWidgetContent` to pass `{ [id]: true }` instead of full `widgets` object
- [x] Verify zero broken imports across the repository
- [x] Run `npm test` to confirm 64/64 tests pass

### Phase 2: Window Container Normalization & Header De-Duplication
- [ ] Update `src/components/layout/DashboardWindow.jsx`:
  - [ ] Replace `bg-slate-50 border-b border-slate-100` header with `bg-slate-900/90 border-b border-slate-800 text-slate-200`
  - [ ] Update header action buttons to `text-slate-400 hover:text-slate-200 hover:bg-slate-800`
- [ ] Refactor `src/components/widgets/CelestialSphereView.jsx`:
  - [ ] Strip outer `bg-slate-900 rounded-2xl border` wrapper
  - [ ] Remove duplicate `<h3>` title; elevate Geocentric/Heliocentric tabs to top inline control rail
- [ ] Refactor `src/components/widgets/EclipseDemonstrator.jsx`:
  - [ ] Strip outer card wrapper and duplicate `<h3>` title
  - [ ] Retain status badge and navigation sub-tabs in top inline bar
- [ ] Refactor `src/components/widgets/MacroOrbitView.jsx`:
  - [ ] Strip outer container and duplicate header
  - [ ] Place eccentricity mode toggle and eclipse badge in clean inline control bar
- [ ] Refactor `src/components/widgets/SolarAlmanac.jsx`:
  - [ ] Ensure root container is unbordered and flush with window body
- [ ] Run `npm test` and `npm run build` to verify layout structural integrity

### Phase 3: Theme Normalization for Legacy Light-Mode Widgets
- [ ] Refactor `src/components/widgets/TerminatorMap.jsx`:
  - [ ] Replace `bg-white border-slate-200` with unbordered root
  - [ ] Convert meridian/declination sub-bar to `bg-slate-950/60 border border-slate-800/80 text-slate-300`
  - [ ] Re-theme continent landmass fills to `#334155` and strokes to `#64748b`
  - [ ] Re-theme legend bar to `text-slate-400 font-mono`
- [ ] Refactor `src/components/widgets/LunarAlmanacCard.jsx`:
  - [ ] Replace `bg-white border-slate-200` with unbordered root
  - [ ] Re-theme fast-jump buttons to `bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500 hover:text-white`
  - [ ] Re-theme 48-hour ocean harmonic wave container to `bg-slate-950/80 border border-slate-800 text-slate-200`
  - [ ] Convert lunar statistics cards to `bg-slate-950/60 border-slate-800/80 text-slate-200`
- [ ] Refactor `src/components/widgets/MicroTideView.jsx`:
  - [ ] Replace `bg-white border-slate-200` with unbordered root
  - [ ] Replace `bg-blue-50/50` canvas with `bg-slate-950 border border-slate-800/80`
  - [ ] Convert water potential badges and tide vectors to dark theme slate/indigo/amber
- [ ] Refactor `src/components/widgets/SunClock.jsx`:
  - [ ] Replace `bg-slate-50 border-slate-100 text-slate-700` cards with `bg-slate-950/60 border border-slate-800/80 text-slate-200`
  - [ ] Replace white center circle (`fill="white"`) with dark glass disc (`fill="#0f172a" stroke="#334155"`)
  - [ ] Re-theme elevation curve background to `bg-slate-950/60 border-slate-800/80` and elevation badge to `bg-slate-900/90 text-slate-100`
- [ ] Run `npm test` to verify zero regression

### Phase 4: Integration Verification & Regression Audit
- [ ] Execute `npm test` — verify all 64 Vitest suites pass cleanly
- [ ] Execute `npm run build` — verify production build completes with 0 errors
- [ ] Audit all 5 workspace layout presets (`master`, `solar`, `lunar`, `eclipse`, `ultrawide`) for visual cohesion
- [ ] Verify astrolabe chronometer dragging, hover synchronization, and Web Worker offload performance

---

## 5. Verification & Acceptance Criteria

### Automated Test Verification:
```bash
# 1. Run full unit and hook test suite
npm test

# Expected Output:
# Test Files  4 passed (4)
# Tests       64 passed (64)

# 2. Run production build bundle verification
npm run build

# Expected Output:
# ✓ built in ~500ms
# dist/assets/index-*.js (clean chunking, zero build errors)
```

### Visual & Behavioral Acceptance Invariants:
1. **Zero Clashing Cards**: No white boxes (`bg-white`), bright gray borders (`border-slate-200`), or light title bars appear within the dashboard.
2. **Zero Duplicate Headers**: Each window displays exactly one title bar (managed by `DashboardWindow`). Inner widgets display only relevant inline interactive controls.
3. **No Worker Thrashing**: Solar widgets (`sunclock`, `almanac`, `map`) do not trigger background Web Worker Meeus ephemeris computations.
4. **Responsive Integrity**: All SVG charts fluidly scale and maintain alignment across standard (1080p), 2K, 4K, and Ultrawide (21:9 / 32:9) viewports.
