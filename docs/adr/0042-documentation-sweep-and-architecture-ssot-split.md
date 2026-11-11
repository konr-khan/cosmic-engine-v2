# ADR-0042: Documentation Sweep & `ARCHITECTURE.md` Token-Preservation SSoT Split

## Status
Accepted

## Context
Following Milestones M40 and M41, a repository-wide documentation audit identified two structural context bottlenecks and six areas of documentation drift:
1. **Always-On Prompt Context Pressure (`AGENTS.md`)**:
   - `AGENTS.md` is injected into every agent turn as an active workspace rule. At `17.69 KB` (`18,111 bytes`), it stood only `321 bytes` below the hard `18.00 KB` (`18,432 bytes`) build-failure cap enforced by `src/types/unitSafety.test.ts` and `scripts/lintUnitSafety.mjs`.
   - It contained a duplicate 25-line ASCII directory tree and verbose subsystem prose that duplicated `PROJECT.md`.
2. **High On-Demand Structural Lookup Cost (`PROJECT.md`)**:
   - `PROJECT.md` (`44.3 KB` / ~11,000 tokens) mixed live structural architecture (the 3D scene-graph dataflow diagram, TypeScript interface contracts, exhaustive file layout, and the Subsystem Task Routing Matrix) with the historical 86-row Feature Inventory (`F1–F86`) and 41-row Milestone Matrix (`M1–M41`).
3. **Documentation Drift Across Specifications & Scripts**:
   - `PROJECT.md`, `README.md`, and `scripts/syncDocMetrics.mjs` referenced retired scene sub-hooks (`useEclipseScene`, `useArmillaryScene`) instead of `useCosmicScene` and `useHeliocentricScene`, and legacy `hoverStore.ts` field names (`hoveredDate`, `hoveredTime`, `hoverPosition`) instead of `hoverTime` and `hoverDate`.
   - `AGENTS.md` and `README.md` listed stale feature/milestone/ADR bounds (`F1–F77`, `M1–M39`, `0001–0039`).
   - `docs/DESIGN_SYSTEM.md` listed pre-M38 orbital milestone hex codes instead of the canonical palette in `macroTokens.ts` and `ArmillaryBeadsLayer.tsx`, and described `<MiniGlobe />` Layer 9 as unconditionally `cursor-pointer` rather than conditionally gated on interactive handlers (per M41).

## Decision
1. **Established 3-Way Documentation Single Source of Truth (SSoT) Split**:
   - **Operational Prompt Kernel (`AGENTS.md`)**: Slimmed from `17.69 KB` to `11.40 KB` (-35.6% byte reduction, saving ~1,500 tokens on every prompt turn) by replacing the duplicate directory tree and verbose subsystem prose with a concise 6-bullet architectural invariant summary pointing to `ARCHITECTURE.md`.
   - **Live Structural Blueprint (`ARCHITECTURE.md`)**: Extracted the 3D scene-graph dataflow diagram, subsystem runtime contracts, compiler-checked TypeScript interface references, canonical file tree (including `AlmanacShortcutsRail.tsx`, `workerFallback.ts`, and `scripts/`), and the Subsystem Task Routing Matrix into a dedicated top-level specification.
   - **Historical Ledger (`PROJECT.md`)**: Scoped exclusively to the chronological Feature Inventory (`F1–F87`) and Milestone & Phase Matrix (`M1–M42`), reducing file size from `43.30 KB` to `29.27 KB`.
2. **Synchronized Design System & Automated Metric Tooling**:
   - Updated `docs/DESIGN_SYSTEM.md` §2.A with canonical orbital milestone hex tokens (`#ef4444` Perihelion, `#c084fc` Equinoxes, `#f59e0b` Solstices, `#38bdf8` Aphelion) and §2.E Layer 9 with conditional `cursor-pointer` / `cursor-default` affordance rules.
   - Updated `scripts/syncDocMetrics.mjs` and `README.md` to reflect `useCosmicScene` / `useHeliocentricScene`, `hoverTime` / `hoverDate`, and registered `ARCHITECTURE.md` in the `--dossier` compiler.

## Consequences
- **Prompt Token Efficiency**: Every agent turn saves ~1,500 tokens of always-on context (`AGENTS.md` at `11.40 KB`, providing >`6.5 KB` of headroom below the `18.0 KB` ceiling), and on-demand architectural lookups read `ARCHITECTURE.md` instead of the full historical feature ledger.
- **Zero Documentation Drift**: All hook contracts, store fields, milestone hex codes, affordance rules, and ledger counts (`F1–F87`, `M1–M42`, `ADRs 0001–0042`) are synchronized across `AGENTS.md`, `ARCHITECTURE.md`, `PROJECT.md`, `README.md`, `docs/DESIGN_SYSTEM.md`, and `scripts/syncDocMetrics.mjs`.
- **Verification**: All 59 test suites (886 tests), AST unit-safety and math-purity checks, TypeScript strict checks, and production builds pass with zero regressions.
