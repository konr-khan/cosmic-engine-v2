# ADR 0043: AI-Native Documentation Indexing, SSoT Reconciliation & Automated Ledger Synchronization

## Status
Accepted

## Context
Cosmic Engine V2.0 operates as an AI pair-programmed astronomical observatory engine. In long-running AI development environments, documentation acts as the cognitive context kernel. As the engine scaled across 42 milestones, 87 features, 49 dead ends, and 59 Vitest suites, several cognitive and tooling friction points emerged:

1. **Tooling Truncation & Multi-Pass Paging Latency**:
   Extensive architectural specifications ([`docs/MATH_SPEC.md`](../MATH_SPEC.md) at ~130 KB and [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) at ~55 KB) exceed AI view tool buffer limits (~46 KB), requiring multi-pass paging to locate relevant mathematical definitions and visual tokens.
2. **SSoT Contradictions & Historical Anti-Pattern Regressions**:
   Subtle contradictions between specifications risked AI regression:
   - `DESIGN_SYSTEM.md` Section 2.G contained duplicate text with a hardcoded hemisphere meridian tag (`S` vs `N`), violating Dead End #17 and conflicting with Section 8's true tri-state culmination bearings (`S`, `N`, `Z`).
   - `MATH_SPEC.md` Section 12.E–F referenced mean argument of latitude $F$ for draconic node crossings, conflicting with Section 5.E and Dead End #15 (which mandates Newton-Raphson solving of true lunar latitude $\beta(t) = 0^\circ$).
3. **Dead End Reference Disconnect**:
   `DEAD_ENDS.md` lacked explicit row identifiers (`DE-xx`) and subsystem taxonomy tags, making references like "Dead Ends #16 and #33" ambiguous across refactoring milestones.
4. **Historical ADR Drift**:
   Early ADRs (ADR 0004, 0008, 0018, 0024) lacked explicit evolutionary amendment banners documenting subsequent simplifications (e.g., retirement of `useEclipseScene`/`useArmillaryScene` into `useCosmicScene`/`useHeliocentricScene`, standardization of `hoverStore` field names, and full retirement of `useAnalemma`).
5. **Partial Dataflow in System Topology**:
   [`ARCHITECTURE.md`](../../ARCHITECTURE.md) Section 1 illustrated only the 3D Scene Graph pipeline, omitting the concurrent 60 FPS Reactive Chronometer & Web Worker Ephemeris pipeline, and Section 5 lacked a task routing entry for Observatory Layout & Astrolabe Controls.
6. **Documentation Ledger Drift & Incomplete Validation**:
   `scripts/syncDocMetrics.mjs` synchronized Vitest counts but contained dead regexes, lacked validation that all discovered test suites were registered in `CANONICAL_SUITES`, and did not automate feature/milestone/ADR ledger range propagation across `README.md`, `AGENTS.md`, and `ARCHITECTURE.md`.

---

## Decisions

### 1. Quick Navigation Indexes
- Added a **Quick Section & Component Index** table to [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) (§1–§9) mapping design tokens and visual standards to target component files in `src/components/**`.
- Added a **Quick Section & Module Index** table to [`docs/MATH_SPEC.md`](../MATH_SPEC.md) (§1–§14) mapping domain algorithms and coordinate specifications to target math modules in `src/utils/cosmicMath/**`.

### 2. SSoT Harmonization & Anti-Pattern Rectification
- Purged duplicate text in `DESIGN_SYSTEM.md` §2.G and aligned with §8 (`S`, `N`, `Z` tri-state bearings).
- Reconciled `MATH_SPEC.md` §12 with §5 and Dead End #15, documenting that mean argument $F$ acts only as the initial seed $t_0$ for Newton-Raphson true crossing solving.

### 3. Institutional Memory Taxonomy (`DEAD_ENDS.md`)
- Formatted all 49 rows in [`DEAD_ENDS.md`](../../DEAD_ENDS.md) with explicit IDs (`DE-01` through `DE-49`) and subsystem categories (`Layout/Controls`, `Globe/Projection`, `Armillary`, `Eclipse`, `Today/Meridian`, `Math/Units`, `Store/Worker`, `Ribbon/Almanac`).

### 4. Evolutionary ADR Amendments & Master Index
- Added standard `[!NOTE]` Evolutionary Amendment Banners to ADRs `0004`, `0008`, `0018`, and `0024`.
- Created [`docs/adr/README.md`](README.md) indexing all 43 ADRs across 7 functional subsystems with milestone attribution and focus summaries.

### 5. Dual-Pipeline Topology & Layout Routing Matrix (`ARCHITECTURE.md`)
- Upgraded [`ARCHITECTURE.md`](../../ARCHITECTURE.md) Section 1 ASCII diagram to illustrate both Pipeline A (60 FPS Store & Web Worker) and Pipeline B (3D Scene Graph).
- Added an **Observatory Layout & Controls** row to Section 5 Task Routing Matrix mapping to `controls.test.tsx`, `DashboardWindow.test.tsx`, and `layout.test.tsx`.

### 6. Automated Tooling Hardening (`scripts/syncDocMetrics.mjs`)
- Added strict validation verifying that 100% of discovered test suites in Vitest execution results are registered in `CANONICAL_SUITES`.
- Automated extraction and propagation of Feature (`F1–F88`), Milestone (`M1–M43`), and ADR (`0001–0043`) ranges across `AGENTS.md`, `ARCHITECTURE.md`, and `README.md`.
- Purged obsolete `AGENTS.md` test counter regexes.
- Filtered `docs/adr/` dossier compilation to `^\d{4}-.*\.md$` to preserve `docs/adr/README.md`.

---

## Consequences

### Positive
- Sub-second AI navigation to targeted math and visual tokens without buffer truncation.
- Elimination of historical anti-pattern regressions.
- Automated single-command synchronization of all test counts and ledger ranges across the documentation corpus via `npm run sync:docs`.
- Clean documentation dossier compilation with full ADR coverage.

### Invariants
- `AGENTS.md` remains strictly within its `5.0–18.0 KB` kernel size budget.
- All 59 Vitest test suites (886 tests) pass with zero errors.
