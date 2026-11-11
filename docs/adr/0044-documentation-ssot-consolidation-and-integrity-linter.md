# ADR 0044: Living Specification In-Place Consolidation & Automated Documentation Integrity Linter

## Status
Accepted *(Amended by [ADR 0045](0045-codebase-health-svg-defs-isolation-and-doc-parity-gates.md))*

> [!NOTE]
> **Evolutionary Amendment ([ADR 0045](0045-codebase-health-svg-defs-isolation-and-doc-parity-gates.md))**: `ShadowRayDiagram.tsx` was not retired—it remains the active `viewBox="0 0 520 220"` outer SVG container and live/static mode controller in `EclipseDemonstrator.tsx`, mounting `LiveSyzygyView.tsx` as its live ephemeris `<g>` sub-layer. In addition, `ADR-0045` wired active `F#`/`M#` validation, `#anchor` heading slug checks, 1:1 ADR index bijection, living-doc path checks, and 100% production file-inventory parity into `runDocIntegrityCheck()`.

## Context
Following Milestones M42 and M43, a repository-wide documentation audit revealed four remaining categories of structural and referential drift across the documentation corpus:
1. **Off-by-Four `DEAD_ENDS.md` Cross-Reference Drift**:
   When explicit `DE-01`–`DE-49` identifiers were added to [`DEAD_ENDS.md`](../../DEAD_ENDS.md), historical prose references across [`docs/MATH_SPEC.md`](../MATH_SPEC.md), [`PROJECT.md`](../../PROJECT.md), and [`ADR-0043`](0043-ai-native-documentation-indexing-and-automated-ledger-sync.md) retained raw file line numbers (`Line = DE# + 4`) rather than row identifiers (`DE-11` cited as `#15`, `DE-13` cited as `#17`, `DE-12` and `DE-29` cited as `#16` and `#33`).
2. **Residual ViewBox & Identifier Drift**:
   `SkyDomeBase` was standardized on `viewBox="0 0 260 138"` in M14, but [`AGENTS.md`](../../AGENTS.md), [`README.md`](../../README.md), [`scripts/syncDocMetrics.mjs`](../../scripts/syncDocMetrics.mjs), and [`docs/adr/README.md`](README.md) still referenced `260x120`. Additionally, [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) contained a non-portable local Windows `file:///c:/Users/...` URI and referenced the retired `ShadowRayDiagram.tsx` component name instead of `LiveSyzygyView.tsx`.
3. **Chronological Layering Inside Living Specifications**:
   Despite the In-Place SSoT Mutation Rule in `AGENTS.md`, `docs/MATH_SPEC.md` split Gyro-Morph Armillary equations across Section 7, Section 10.H, and Section 13.B–F (with competing definitions of $t_{\text{geo}}$) and repeated ground-track longitude, solar apparent diameter, and axial sightline formulas across multiple sections. Similarly, `docs/DESIGN_SYSTEM.md` split Today's Sky & Meridian Dome tokens across Section 2.H and Section 8.
4. **Absence of Automated Documentation Integrity Gatekeepers in `lint:units` & `vitest`**:
   While `syncDocMetrics.mjs` updated metrics on demand, `npm run lint:units` and `npm test` did not verify Markdown link validity, `DE`/`F`/`M`/`ADR` reference resolution, or Quick Section Index `Lxx–Lyy` line-range synchronization.

---

## Decisions

### 1. Factual, Reference & Attribution Rectification
- Rectified all `DE-xx` citations across `MATH_SPEC.md` (`DE-11`), `PROJECT.md` (`DE-12`, `DE-29`), and `ADR-0043` (`DE-13`, `DE-11`).
- Standardized `SkyDomeBase` dimensions to `260x138` across `AGENTS.md`, `README.md`, `scripts/syncDocMetrics.mjs`, and `docs/adr/README.md`.
- Replaced retired `ShadowRayDiagram.tsx` references with `LiveSyzygyView.tsx` in `DESIGN_SYSTEM.md`, converted the hardcoded Windows `file:///` URI to a portable relative repository link, and aligned milestone attributions in `docs/adr/README.md` with `PROJECT.md`.

### 2. In-Place SSoT Consolidation of Living Specifications
- **`docs/DESIGN_SYSTEM.md`**: Relocated Section 2.H (*Celestial Meridian Colure Profiles, Solstice Bifurcation & Sub-Horizon Twilight Kinematics*) directly into Section 8 (*Today's Sky Dome Symmetrical Horizon & Nodal Tokens*), unifying all Today's Sky and Meridian Dome visual tokens into a single section.
- **`docs/MATH_SPEC.md`**:
  - Folded Section 10.H (*Parametric Celestial Ring Blooming*) and Section 13.B–F (*Camera-Space Subsolar Vectors, Multi-Scale Zoom ViewBox, Observer Topocentric Sky Cone, and Copernican-to-Geocentric Morph Continuum*) into Section 7 (*Gyro-Morph Armillary Multi-Model Unification & Astrolabe Projections*).
  - Folded Section 13.A (*Great Meridian Ring 3D Parametric Formulation*) into Section 10.G (`MiniGlobe.tsx` / `globe.ts`), retiring the standalone Section 13 and renumbering Section 14 to Section 13.
  - Deduplicated repeated formulas ($\lambda_{\text{geo}}$, $\theta_\odot$, and axial sightline coordinates) via cross-references and replaced inline presentation styling tokens in `MATH_SPEC.md` with references to `DESIGN_SYSTEM.md`.

### 3. Automated Documentation Integrity Linter (`runDocIntegrityCheck`)
- Extended [`scripts/lintUnitSafety.mjs`](../../scripts/lintUnitSafety.mjs) and [`src/types/unitSafety.test.ts`](../../src/types/unitSafety.test.ts) with `runDocIntegrityCheck()`, enforcing:
  1. Zero machine-local `file:///` URIs across core Markdown specifications.
  2. 100% resolution of relative Markdown file links on disk.
  3. 100% resolution of `DE-\d+`, `F\d+`, `M\d+`, and `ADR[- ]\d{4}` citations, banning ambiguous `Dead End #N` line-offset prose.
  4. Exact `Lxx–Lyy` Quick Section Index line-range synchronization in `docs/MATH_SPEC.md` and `docs/DESIGN_SYSTEM.md`.
- Updated [`scripts/syncDocMetrics.mjs`](../../scripts/syncDocMetrics.mjs) to fix the trailing-newline off-by-one in `syncSpecSectionLineRanges()` and synchronize `DE-01–DE-49` ledger ranges alongside `F#`, `M#`, and `ADR#`.

---

## Consequences
- **Single-Read Completeness**: Agents reading Section 7 of `MATH_SPEC.md` or Section 8 of `DESIGN_SYSTEM.md` obtain the complete mathematical or visual specification for that subsystem without jumping across chronological addenda.
- **Zero Silent Documentation Drift**: Any broken relative link, non-portable `file:///` URI, invalid `DE`/`F`/`M`/`ADR` citation, or unsynchronized `Lxx–Lyy` section index range now fails `npm run lint:units`, `npx vitest run unitSafety.test.ts`, and `npm run verify`.
