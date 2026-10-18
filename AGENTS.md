# AGENTS.md — Operational Prompt Kernel & Enforced Guardrails

This file is the always-loaded operational kernel for AI agents working in **Cosmic Engine V2.0** (React 19, TypeScript 7 Strict Nominal Units, Vite 8, Tailwind CSS v4, Web Worker Ephemeris Engine). Every rule below is either enforced by automated AST/Vitest checks or governs execution protocol.

---

## 1. Single Source of Truth (SSoT) & Command Matrix

> [!IMPORTANT]
> **Strict Zero-Duplication Rule**: Never duplicate architecture diagrams, file trees, math formulas, or feature ledgers across documents. Read and update the exclusive SSoT for your target domain:

| Domain | Authoritative SSoT | When to Consult / Update |
| :--- | :--- | :--- |
| **Topology, Contracts & File Tree** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Modifying module boundaries, scene-graph dataflow, worker RPC contracts, or adding/moving files |
| **Astronomical Math & Ephemerides** | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | Touching `src/utils/cosmicMath/**`, coordinate frames, Meeus equations, or syzygy shadow geometry |
| **Visual Tokens & Stroke Grammar** | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Touching `src/components/**`, SVG stroke encodings, semantic colors, or glassmorphic HUDs |
| **Historical Anti-Patterns** | [`DEAD_ENDS.md`](DEAD_ENDS.md) | Before refactoring core math, 3D projections, worker throttling, or camera staging |
| **Feature & Milestone Ledger** | [`PROJECT.md`](PROJECT.md) | Recording completed user-facing features (`F1–F88`) or milestones (`M1–M43`) |
| **Architectural Decision Records** | [`docs/adr/`](docs/adr/) | Reviewing historical invariants (`0001–0043`) or adding evolutionary amendment banners |

### Essential Commands & Automated Gatekeepers

- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 59 modules, 886 tests)

| Command | Purpose & When to Run |
| :--- | :--- |
| `npx vitest run <suite>` | **Fast inner-loop test** — run the targeted suite from Section 3 immediately after any edit |
| `npm run lint:units` | **AST guardrail linter** (`scripts/lintUnitSafety.mjs`) — checks UI unit safety, math purity, `= new Date()` ban & `AGENTS.md` size budget (`5–18 KB`) |
| `npm run typecheck` | **Strict compiler check** (`tsc --noEmit`) — verifies nominal branded unit types and barrel exports |
| `npm run verify` | **Mandatory pre-completion gate** — runs `typecheck`, `lint:units`, `vitest`, and `build` in serial |
| `npm run sync:docs` | **Test metric synchronizer** (`scripts/syncDocMetrics.mjs`) — run whenever adding, removing, or renaming Vitest tests |
| `npm run sync:dossier` | Compiles `docs/COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md` on demand (`--dossier`) |

---

## 2. Blast-Radius Triage & Execution Protocol

Match your workflow to the task's blast radius instead of applying heavyweight ceremony to trivial tasks or cowboy-coding complex ones:

| Tier | Scope / Blast Radius | Execution & Delegation Protocol | Verification Requirement |
| :--- | :--- | :--- | :--- |
| **Tier 1: Micro / Read-Only** | Q&A, diagnostics, docs, or localized fix in $\le 2$ files within one subsystem | Execute directly in the parent context. No Plan Artifact or Human Gate required prior to edit. | Targeted `npx vitest run <suite>` + `npm run verify` if code changed |
| **Tier 2: Scoped Feature / Fix** | Single-subsystem feature or bugfix spanning $2\text{–}5$ files without contract breaks | State a concise inline plan. Delegate noisy test/build loops or multi-file edits to a worker subagent to keep parent context clean. | Targeted suite + `npm run verify` (+ `npm run sync:docs` if test counts changed) |
| **Tier 3: Architectural / Core Math** | Cross-subsystem refactor, new widget, worker RPC change, or `cosmicMath` algorithm change | **3-Phase Human Gate Lifecycle**:<br>1. **Plan**: Create Implementation Plan Artifact & pause at **HUMAN GATE**.<br>2. **Execute**: Isolate phase execution in subagent sandboxes.<br>3. **Review**: Run `npm run verify` & present Walkthrough Artifact. | Full `npm run verify` + benchmark/adversarial suites + `npm run sync:docs` |

- **No Automatic Commits**: Never run `git commit` unless the user explicitly instructs `'commit'`.

---

## 3. File-Glob Action & Test Router

When modifying files matching a glob below, enforce its invariant and run its targeted test suite before running `npm run verify`:

| File Glob | SSoT Reference | Fast Targeted Vitest Command | Subsystem Invariant |
| :--- | :--- | :--- | :--- |
| `src/types/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run unitSafety.test.ts` | Preserve Symbol brands (`Degrees`, `Radians`, `JulianDate`, `JulianCenturies`) & `NotRadians`/`NotDegrees` guards |
| `src/utils/cosmicMath/{core,solar,lunar,eclipse,globe,projection,terminatorTracks}.ts` | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | `npx vitest run {core,solar,lunar,eclipse,globe,projection,terminatorTracks}.test.ts domainInvariants.test.ts` | 100% pure functions; preserve Jean Meeus / IAU citations; import constants from `astroConstants.ts` |
| `src/utils/cosmicMath/scene/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run scene.test.ts cameras.stress.test.ts m1_adversarial.test.ts` | Single 3D geometric truth across Heliocentric, Geocentric & Topocentric frames |
| `src/utils/cosmicMath/armillary/**` | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | `npx vitest run armillary.test.ts armillaryBenchmark.test.ts m3_adversarial.test.ts armillaryMorph.test.ts armillaryStereographic.test.ts` | **$< 0.8\text{ ms/frame}$ hot-loop budget** across 1,000 frames; reuse cached 3x3 Euler matrices; zero per-frame heap churn |
| `src/utils/cosmicMath/today/**` | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | `npx vitest run todaySky.test.ts` | Polar clamping & iterative rise/set / meridian swath continuity |
| `src/store/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run cosmicStore.test.ts hoverStore.test.ts` | Route 60 FPS ticking through `cosmicStore` and ribbon scrubbing through `hoverStore` (`useSyncExternalStore`) |
| `src/workers/**`, `src/hooks/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run useCosmicEngine.test.ts useCosmicScene.test.ts useEphemerisWorker.test.ts workerSanitizers.test.ts workerFallback.test.ts` | Maintain 100ms trailing-edge flag-merging throttling, monotonic `requestId` stamps, and `workerFallback.ts` parity |
| `src/components/widgets/today/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run TodayWidget.test.tsx SkyDomeBase.test.tsx SkyDomeHooksAndPrimitives.test.tsx meridianConfigHelpers.test.ts` | Shared `SkyDomeBase` (`260x120`) and `MeridianDomeBase` view-model contracts |
| `src/components/widgets/armillary/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run ArmillaryWidget.test.tsx useStagedCamera.test.ts m2_adversarial.test.ts useArmillaryInteractions.test.ts ArmillaryBeadsLayer.test.tsx ArmillaryControls.test.tsx` | 2-phase camera staging ($\lambda = 0.45$ pole lock) & depth stroke unification ($\lambda \in [0.85, 1.0]$) |
| `src/components/widgets/{solar,lunar,eclipse,terminator,macro,tides}/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run {SolarWidget,LunarWidget,EclipseWidget,TerminatorMap,MacroOrbitWidget,TidesWidget}.test.tsx` | Use `<MiniGlobe />` and `<MiniMoon />` primitives; wrap widgets in `WindowErrorBoundary` |
| `src/components/{common,controls,layout}/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run MiniGlobe.test.tsx MiniMoon.test.tsx controls.test.tsx DashboardWindow.test.tsx layout.test.tsx App.test.tsx` | Use `useId()` for SVG `<clipPath>`/`<mask>` IDs to prevent DOM collisions across multi-instance globes/moons |

---

## 4. Enforced AST & Runtime Guardrails (`DO` vs. `NEVER`)

The following four guardrails are **programmatically enforced by `npm run lint:units` and `src/types/unitSafety.test.ts`**. Violating any of them will fail the build:

### Guardrail 1: UI Nominal Unit Boundary (`src/components/**`)
Presentation components must never import or call raw nominal assertion wrappers (`asDegrees`, `asRadians`). Route all angular conversions through verified gatekeepers (`toRadians`, `toDegrees`, `latToRadians`, `lonToRadians`) or consume pre-branded fields from math hooks.
- ❌ **NEVER** in `src/components/**`:
  ```ts
  import { asDegrees, asRadians } from '../../types/units'; // AST Violation!
  const angle = asDegrees(rawInput);                        // AST Violation!
  const dirty = rawLat as unknown as Radians;               // Forbidden type cast!
  ```
- ✅ **DO** in `src/components/**`:
  ```ts
  import { latToRadians, toRadians } from '../../types/units';
  const phiRad = latToRadians(latitude); // Safely bridges Latitude -> Radians
  const thetaRad = toRadians(45);        // Safely converts unbranded number -> Radians
  ```

### Guardrail 2: Pure Mathematical Engine (`src/utils/cosmicMath/**`)
Domain math modules must remain 100% deterministic, stateless, and decoupled from React, UI components, Tailwind tokens, and wall-clock time.
- ❌ **NEVER** in `src/utils/cosmicMath/**`:
  ```ts
  import { useMemo } from 'react';             // AST Violation: React import in math module!
  const color = 'stroke-amber-400';            // AST Violation: Tailwind token in math module!
  const now = new Date();                      // AST Violation: Unparameterized new Date()!
  const tilt = 23.44;                          // Cognitive Violation: Lossy magic constant!
  ```
- ✅ **DO** in `src/utils/cosmicMath/**`:
  ```ts
  import { EARTH_AXIAL_OBLIQUITY_J2000_DEG, J2000_DATE } from './astroConstants';
  export function computeDeclination(jd: JulianDate): Degrees { /* pure Meeus math */ }
  ```

### Guardrail 3: Prop Identity Stability (`src/components/**`, `src/hooks/**`)
Default parameter allocations like `= new Date()` create a fresh object reference on every render, breaking `useMemo`/`React.memo` and triggering 60 FPS worker/render cascades.
- ❌ **NEVER** in `src/components/**` or `src/hooks/**`:
  ```ts
  export function useSolarData(date: Date = new Date()) { ... } // AST Violation!
  ```
- ✅ **DO** in `src/components/**` or `src/hooks/**`:
  ```ts
  import { J2000_DATE } from '../utils/cosmicMath/astroConstants';
  export function useSolarData(date: Date = J2000_DATE) { ... }
  ```

### Guardrail 4: React 19 & 60 FPS Render Hygiene
- **High-Frequency State Isolation**: Never drive 60 FPS animation frames or ribbon hover scrubbing via React `useState` in top-level containers. Subscribe granularly via `useChronometerStore(s => s.timeOfDay)` (`src/store/cosmicStore.ts`) or `useHoverStore(s => s.hoverTime)` (`src/store/hoverStore.ts`).
- **React 19 Direct `ref` Prop**: Pass `ref` as a standard prop on function components; never use deprecated `React.forwardRef()`.
- **Vitest Precision & Mocking**: Invoke deterministic `cosmicMath` functions directly in tests (never mock pure math). Assert floating-point astronomy results with `expect(val).toBeCloseTo(expected, 4)` (or `2` for empirical angles/distances). Mock `ephemerisWorkerManager`, `requestAnimationFrame`, and `localStorage` in hook/layout tests.

---

## 5. Pre-Completion Verification Checklist

Before declaring any code or documentation task complete:
1. Run `npm run verify` (`typecheck` $\rightarrow$ `lint:units` $\rightarrow$ `vitest` $\rightarrow$ `build`) and confirm **0 errors**.
2. If you added, removed, or renamed any unit tests, run `npm run sync:docs` so `README.md` and `AGENTS.md` test counters stay synchronized.
3. Ensure `AGENTS.md` remains strictly within `5.0 KB – 18.0 KB` (`unitSafety.test.ts`).
4. Present verification results clearly and wait for explicit user instruction before committing.
