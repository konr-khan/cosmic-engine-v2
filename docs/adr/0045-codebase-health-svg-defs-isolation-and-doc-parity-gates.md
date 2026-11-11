# ADR 0045: Behavior-Preserving Codebase Health Refactoring, Collision-Safe SVG `<defs>` Isolation & Self-Verifying SSoT Documentation Parity

## Status
Accepted

## Context
A full-repository codebase health and pair-programming documentation audit following Milestone M44 surfaced two classes of subtle runtime/DOM hazards alongside residual blind spots in the documentation verification harness:

1. **React 19 `<StrictMode>` Singleton Worker Termination & Hook Duplication**:
   - `App.tsx` registered `useEffect(() => () => ephemerisWorkerManager.terminate(), [])`, which prematurely killed the application-wide singleton worker during React 19 `<StrictMode>` development double-mounting (`DE-50`), while `ephemerisWorkerManager.ts` only attached `beforeunload`/`pagehide` listeners in its constructor rather than re-arming them upon lazy worker re-creation.
   - `useAnnualSolarWorker` and `useAnnualLunarWorker` duplicated identical cache-seed, subscription, and fallback state plumbing, and test suites maintained duplicate untyped `MockWorker` stubs.
2. **Global SVG `<defs>` Namespace Collisions & Hot-Loop SVG Hygiene**:
   - Multiple observatory components (`ShadowRayDiagram.tsx`, `LiveSyzygyView.tsx`, `NodalPlaneVisualizer.tsx`, `PolarSunlightDial.tsx`, `SolarRibbonBands.tsx`, `TidalWaveOscillator.tsx`, `TerminatorMap.tsx`, `AstrolabeDial.tsx`, `ArmillaryDefs.tsx`) declared static string-literal `id="..."` attributes inside `<defs>`, risking cross-instance `url(#id)` collisions when co-mounted (`DE-51`).
   - `LiveSyzygyView.tsx` computed syzygy geometry inline during 60 FPS renders, `OrbitSvgCanvas.tsx` and `ArmillaryStarsLayer.tsx` used `transition-all` on SVG `<circle>` elements, and `MiniGlobe.tsx` / Meridian hooks mixed pure view-model builders with React hook orchestration.
3. **Documentation SSoT Drift & Linter Blind Spots**:
   - `ADR-0044`, `DEAD_ENDS.md` (`DE-05`), `ARCHITECTURE.md`, and `DESIGN_SYSTEM.md` mischaracterized `ShadowRayDiagram.tsx` as retired, whereas `EclipseDemonstrator.tsx` actively mounts `ShadowRayDiagram.tsx` as the outer `520x220` SVG container around `LiveSyzygyView.tsx`, and `MATH_SPEC.md` still cited the retired `todaySky.ts` filename.
   - `ARCHITECTURE.md` Section 4 omitted 50 of 178 production modules under `src/`.
   - `runDocIntegrityCheck()` in `scripts/lintUnitSafety.mjs` populated `validFeatures` and `validMilestones` sets without validating `F#`/`M#` references, stripped `#anchor` fragments without checking target headings, did not enforce `docs/adr/README.md` 1:1 coverage or living-doc code paths, and `syncDocMetrics.mjs` lacked a non-mutating `--check` gate for `npm run verify`.

---

## Decisions

### 1. Singleton Worker Lifecycle & Generic Annual Matrix Hook (`F90`, `DE-50`)
- Removed unmount `ephemerisWorkerManager.terminate()` from `src/App.tsx` and added idempotent `_ensureLifecycleListeners()` in `src/workers/ephemerisWorkerManager.ts` so `beforeunload`/`pagehide` teardown hooks re-attach whenever a lazy worker spawns.
- Consolidated `useAnnualSolarWorker` and `useAnnualLunarWorker` onto a generic `useAnnualMatrixWorker` helper in `src/hooks/useEphemerisWorker.ts`, and extracted a shared typed `MockWorker` harness in `src/workers/mockWorkerFixture.ts`.

### 2. Instance-Scoped SVG `<defs>` & Lunar Disc Consolidation (`F91`, `DE-51`)
- Created [`src/components/common/useSafeSvgId.ts`](../../src/components/common/useSafeSvgId.ts) wrapping `React.useId()` sanitization and migrated all static `<defs>` gradients, masks, and clipPaths across observatory visualizers to instance-scoped IDs.
- Consolidated duplicate lunar phase SVG markup onto `LunarPhaseDisc` (`PhaseVisual.tsx`) and `<MiniMoon />` (`MicroTideView.tsx`, `OrbitSvgCanvas.tsx`).
- Added `runSvgDefsIdCheck()` to [`scripts/lintUnitSafety.mjs`](../../scripts/lintUnitSafety.mjs) and [`src/types/unitSafety.test.ts`](../../src/types/unitSafety.test.ts), banning static string-literal `id` attributes inside JSX `<defs>` blocks across `src/components/**`.

### 3. 60 FPS Memoization & Pure View-Model Extraction (`F92`, `F93`)
- Extracted `useSyzygyMath.ts` for memoized 60 FPS syzygy shadow geometry in `LiveSyzygyView.tsx` and narrowed SVG `<circle>` CSS transitions in `OrbitSvgCanvas.tsx` and `ArmillaryStarsLayer.tsx` to non-geometric properties.
- Extracted pure `<MiniGlobe />` geometry builders into `src/components/common/miniglobe/globeGeometry.ts` and solar/lunar meridian swath & radial tick builders into `src/components/widgets/today/hooks/meridianConfigHelpers.ts`.

### 4. Self-Verifying SSoT Documentation Parity & Read-Only `--check` Gate (`F94`)
- Reconciled `DESIGN_SYSTEM.md`, `MATH_SPEC.md`, `ARCHITECTURE.md`, `README.md`, `DEAD_ENDS.md`, and `AGENTS.md` in-place, restoring accurate `ShadowRayDiagram.tsx` / `LiveSyzygyView.tsx` attribution, replacing stale `todaySky.ts` references with `src/utils/cosmicMath/today/`, and expanding `ARCHITECTURE.md` Section 4 to a 100% complete inventory of non-test production files in `src/`.
- Upgraded `runDocIntegrityCheck()` in `scripts/lintUnitSafety.mjs` to enforce `F#`/`M#` ledger citations, GitHub-slug `#anchor` resolution, 1:1 `docs/adr/README.md` parity, living-doc backticked path/filename existence, and 1:1 bijective parity between `ARCHITECTURE.md` Section 4 and `src/**` production files.
- Added `--check` mode (`npm run check:docs`) and portable relative dossier links to [`scripts/syncDocMetrics.mjs`](../../scripts/syncDocMetrics.mjs), and wired `npm run check:docs` directly into `npm run verify`.

---

## Consequences
- **Zero `<StrictMode>` Worker Drops & Zero SVG `<defs>` Collisions**: Worker multiplexing survives React 19 development remounts cleanly, and static `<defs>` IDs are mechanically impossible to reintroduce in `src/components/**`.
- **Self-Verifying Pair-Programming Documentation**: Any unindexed ADR, broken `#anchor`, stale living-doc file reference, unrecorded production module in `ARCHITECTURE.md`, or unsynchronized test/ledger/line-range counter fails `npm run lint:units` and `npm run verify` deterministically.
