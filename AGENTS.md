# AGENTS.md — Operational Prompt Kernel & Enforced Guardrails

This file is the always-loaded operational kernel for AI agents working in **Cosmic Engine V2.0** (React 19, TypeScript 7 Strict Nominal Units, Vite 8, Tailwind CSS v4, Web Worker Ephemeris Engine). Every rule below is either enforced by automated AST/Vitest checks or governs token-economical execution protocol.

---

## 1. Single Source of Truth (SSoT) & Command Matrix

> [!IMPORTANT]
> - **Strict Zero-Duplication Rule**: Never duplicate architecture diagrams, file trees, math formulas, or feature ledgers across documents. Read and update the exclusive SSoT for your target domain.
> - **In-Place SSoT Mutation Rule**: Living specifications (`ARCHITECTURE.md`, `docs/MATH_SPEC.md`, `docs/DESIGN_SYSTEM.md`) describe *current state only*, never chronological evolution. Edit existing sections in-place rather than appending chronological history at the bottom. Record history exclusively in `PROJECT.md` and `docs/adr/`.
> - **Targeted Spec Reading**: Never ingest full specification files unbounded. Consult the Quick Section Indexes at the top of `docs/MATH_SPEC.md` and `docs/DESIGN_SYSTEM.md` and read only the targeted line ranges (`Lxx–Lyy`). Never read `docs/COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md` during active workspace sessions.

| Domain | Authoritative SSoT | When to Consult / Update |
| :--- | :--- | :--- |
| **Topology, Contracts & File Tree** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Modifying module boundaries, scene-graph dataflow, worker RPC contracts, or adding/moving files |
| **Astronomical Math & Ephemerides** | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | Touching `src/utils/cosmicMath/**`, coordinate frames, Meeus equations, or syzygy shadow geometry |
| **Visual Tokens & Stroke Grammar** | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Touching `src/components/**`, SVG stroke encodings, semantic colors, or glassmorphic HUDs |
| **Historical Anti-Patterns** | [`DEAD_ENDS.md`](DEAD_ENDS.md) | Before refactoring core math, 3D projections, worker throttling, or camera staging (`DE-01–DE-52`) |
| **Feature & Milestone Ledger** | [`PROJECT.md`](PROJECT.md) | Recording completed user-facing features (`F1–F98`) or milestones (`M1–M46`) |
| **Architectural Decision Records** | [`docs/adr/`](docs/adr/) | Reviewing historical invariants (`0001–0046`) or adding evolutionary amendment banners |

### Essential Commands & Automated Gatekeepers

- **Testing**: `vitest` (`npm test` — comprehensive domain test suite across 63 modules, 929 tests)

| Command | Execution Scope & When to Run |
| :--- | :--- |
| `npx vitest run <suite>` | **Agent Inner-Loop Test** — run ONLY the targeted suite from Section 3 immediately after any edit |
| `npm run typecheck` | **Agent Compiler Check** (`tsc --noEmit`) — verifies nominal branded unit types and barrel exports |
| `npm run lint:units` | **Agent AST & Doc Linter** (`scripts/lintUnitSafety.mjs`) — checks UI unit safety, math purity, SVG `<defs>` ID scoping, `= new Date()` ban, `AGENTS.md` size budget (`5–18 KB`) & SSoT link/anchor/inventory parity |
| `npm run check:docs` | **Read-Only Metric & Index Gate** (`scripts/syncDocMetrics.mjs --check`) — verifies Vitest counts, ledger spans & `Lxx–Lyy` ranges without mutating files |
| `npm run verify` | **Human / Pre-Commit Gate** — runs `typecheck`, `lint:units`, `check:docs`, full `vitest`, and `build`. *Do not run inside agent loops unless explicitly requested by the user.* |
| `npm run sync:docs` | **Metric & Index Synchronizer** (`scripts/syncDocMetrics.mjs`) — updates test/UI counts, `Lxx–Lyy` spec index ranges & `F#`/`M#`/`DE#`/`ADR#` ledgers in place |
| `npm run sync:dossier` | **External Export Only** — compiles `docs/COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md` on demand (`--dossier`) |

---

## 2. Blast-Radius Triage & Token-Economical Execution Protocol

Match your workflow to the task's blast radius to minimize context bloat and avoid redundant subagent initialization:

| Tier | Scope / Blast Radius | Execution Protocol | Agent Verification Requirement |
| :--- | :--- | :--- | :--- |
| **Tier 1: Micro / Read-Only** | Q&A, diagnostics, docs, or localized fix in $\le 2$ files within one subsystem | Execute directly in parent context. No Plan Artifact or Walkthrough Artifact. | Targeted `npx vitest run <suite>` + `npm run typecheck` + `npm run lint:units` if code changed |
| **Tier 2: Scoped Feature / Fix** | Single-subsystem feature or bugfix spanning $2\text{–}5$ files without contract breaks | State a concise 3-line inline plan and execute linearly in the current session. **Do not spawn worker subagents.** | Targeted `npx vitest run <suite>` + `npm run typecheck` + `npm run lint:units` |
| **Tier 3: Architectural / Core Math** | Cross-subsystem refactor, new widget, worker RPC change, or `cosmicMath` algorithm change | **2-Phase Human Gate**:<br>1. **Plan**: Output concise checklist inline (listing exact `@` file paths and target test suites) & pause at **HUMAN GATE**.<br>2. **Execute**: Implement step-by-step linearly upon approval. Omit end-of-session Walkthrough Artifacts. | Targeted suites + `npm run typecheck` + `npm run lint:units` |

- **No Automatic Commits**: Never run `git commit` unless the user explicitly instructs `'commit'`.
- **Concise Output**: Skip conversational summaries and walkthrough artifacts after passing targeted checks; state the passing test command and stop.

---

## 3. File-Glob Action & Test Router

When modifying files matching a glob below, enforce its invariant and run ONLY its targeted Vitest command:

| File Glob | SSoT Reference | Fast Targeted Vitest Command | Subsystem Invariant |
| :--- | :--- | :--- | :--- |
| `src/types/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run unitSafety.test.ts` | Preserve Symbol brands (`Degrees`, `Radians`, `JulianDate`, `JulianCenturies`) & `NotRadians`/`NotDegrees` guards |
| `src/utils/cosmicMath/{core,solar,lunar,eclipse,globe,projection,terminatorTracks}.ts` | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | `npx vitest run {core,solar,lunar,eclipse,globe,projection,terminatorTracks}.test.ts domainInvariants.test.ts` | 100% pure functions; preserve Jean Meeus / IAU citations; import constants from `astroConstants.ts` |
| `src/utils/cosmicMath/scene/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run scene.test.ts cameras.stress.test.ts m1_adversarial.test.ts` | Single 3D geometric truth across Heliocentric, Geocentric & Topocentric frames |
| `src/utils/cosmicMath/armillary/**` | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | `npx vitest run armillary.test.ts armillaryBenchmark.test.ts m3_adversarial.test.ts armillaryMorph.test.ts armillaryStereographic.test.ts` | **$< 0.8\text{ ms/frame}$ hot-loop budget** across 1,000 frames; reuse cached 3x3 Euler matrices; zero per-frame heap churn |
| `src/utils/cosmicMath/today/**` | [`docs/MATH_SPEC.md`](docs/MATH_SPEC.md) | `npx vitest run todaySky.test.ts` | Polar clamping & iterative rise/set / meridian swath continuity |
| `src/store/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run cosmicStore.test.ts hoverStore.test.ts` | Route 60 FPS ticking through `cosmicStore` and ribbon scrubbing through `hoverStore` (`useSyncExternalStore`) |
| `src/workers/**`, `src/hooks/**` | [`ARCHITECTURE.md`](ARCHITECTURE.md) | `npx vitest run useCosmicEngine.test.ts useCosmicScene.test.ts useEphemerisWorker.test.ts workerLifecycle.dom.test.tsx workerSanitizers.test.ts workerFallback.test.ts` | Maintain 100ms trailing-edge flag-merging throttling, persistent 60 FPS subscriptions, monotonic `requestId` stamps, and `workerFallback.ts` parity |
| `src/components/widgets/today/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run TodayWidget.test.tsx SkyDomeBase.test.tsx SkyDomeHooksAndPrimitives.test.tsx meridianConfigHelpers.test.ts` | Shared `SkyDomeBase` (`260x138`) and `MeridianDomeBase` view-model contracts |
| `src/components/widgets/armillary/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run ArmillaryWidget.test.tsx useStagedCamera.test.ts m2_adversarial.test.ts useArmillaryInteractions.test.ts ArmillaryBeadsLayer.test.tsx ArmillaryControls.test.tsx` | 2-phase camera staging ($\lambda = 0.45$ pole lock) & depth stroke unification ($\lambda \in [0.85, 1.0]$) |
| `src/components/widgets/{solar,lunar,eclipse,terminator,macro,tides}/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run {SolarWidget,LunarWidget,EclipseWidget,TerminatorMap,MacroOrbitWidget,TidesWidget}.test.tsx` | Use `<MiniGlobe />` and `<MiniMoon />` primitives; wrap widgets in `WindowErrorBoundary` |
| `src/components/{common,controls,layout}/**` | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | `npx vitest run MiniGlobe.test.tsx MiniMoon.test.tsx controls.test.tsx DashboardWindow.test.tsx layout.test.tsx App.test.tsx App.dom.test.tsx` | Scope all SVG `<defs>` IDs via `useSafeSvgId()` / `useId()`; opt real-DOM `<StrictMode>` tests into `// @vitest-environment jsdom` |

---

## 4. Enforced AST & Runtime Guardrails

The following rules are **programmatically enforced by `npm run lint:units` and `src/types/unitSafety.test.ts`**. Any violation fails the build:

1. **UI Nominal Unit Boundary (`src/components/**`)**: Never import or invoke raw assertion wrappers (`asDegrees`, `asRadians`) or use double casts (`as unknown as Radians`) in UI files. Route all angular conversions through verified gatekeepers (`toRadians`, `toDegrees`, `latToRadians`, `lonToRadians`) or consume pre-branded fields from math hooks.
2. **Pure Mathematical Engine (`src/utils/cosmicMath/**`)**: Math modules must remain 100% deterministic and stateless. Never import React hooks, UI components, or Tailwind tokens; never call unparameterized `new Date()`; never use lossy magic constants (import exact constants from `astroConstants.ts`); always clamp `Math.asin`/`Math.acos` inputs to `[-1, 1]` and wrap circular angles via positive Euclidean modulo `(((a % 360) + 360) % 360)`.
3. **Prop Identity Stability (`src/components/**`, `src/hooks/**`)**: Never use dynamic `= new Date()` in default parameter signatures. Always default date parameters to the immutable `J2000_DATE` constant from `astroConstants.ts` to preserve `useMemo`/`React.memo` referential stability.
4. **React 19 & 60 FPS Render Hygiene**: Isolate 60 FPS playback and ribbon scrubbing via granular selectors (`useChronometerStore(s => s.timeOfDay)`, `useHoverStore(s => s.hoverTime)`). Pass `ref` as a standard prop (never use `React.forwardRef()`). Never terminate application-singleton workers inside component `useEffect` unmount cleanups (`DE-50`). In Vitest, invoke deterministic `cosmicMath` functions directly (never mock pure math) and assert floating-point values with `toBeCloseTo(expected, 4)`.
5. **Collision-Safe SVG `<defs>` Scoping (`src/components/**`)**: Never assign static string-literal `id="..."` attributes inside JSX `<defs>` blocks (`<linearGradient>`, `<radialGradient>`, `<clipPath>`, `<mask>`, `<filter>`, `<pattern>`). Always scope `<defs>` IDs per component instance via `useSafeSvgId()` (`DE-51`).
6. **Pair-Programming SSoT & Registry Parity**: Keep `ARCHITECTURE.md` Section 4 (`Canonical Code Layout`) in 1:1 sync when adding, moving, or deleting production files under `src/**`; keep `CANONICAL_SUITES` in `scripts/syncDocMetrics.mjs` in 1:1 sync with `.test.ts(x)` files; keep `docs/adr/README.md` in 1:1 sync with `docs/adr/00*.md`; and run `npm run sync:docs` whenever test counts, ledger IDs, or `MATH_SPEC.md` / `DESIGN_SYSTEM.md` section line ranges change.

---

## 5. Pre-Completion Verification Checklist

Before declaring any task complete:
1. Run the targeted Vitest suite(s) from Section 3 (`npx vitest run <suite>`), `npm run typecheck`, and `npm run lint:units`, confirming **0 errors**.
2. Ensure `AGENTS.md` remains strictly within `5.0 KB – 18.0 KB` (`unitSafety.test.ts`).
3. Run `npm run sync:docs` only when test counts, UI file counts, ledger spans, or spec section line ranges changed; do **not** run the full 63-suite `npm run verify` inside the agent loop unless explicitly requested by the user.
