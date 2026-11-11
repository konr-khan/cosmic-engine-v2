# Cosmic Engine V2.0 — Pair-Programming Documentation & Guardrail Hardening

A comprehensive, zero-UI-change sweep that turns Cosmic Engine V2.0's documentation ecosystem into a self-verifying contract for human-AI pair programming. Every cross-reference, section anchor, module inventory entry, metric counter, and engineering guardrail will be reconciled against live code and enforced automatically during verification.

## User Review & Critical Decisions

> [!IMPORTANT]
> All four tracks below reflect your confirmed preferences and preserve 100% of runtime application behavior and visual presentation while tightening documentation accuracy and automated verification gates.

- **Confirmed Scope**: Execute all four tracks in a unified pass—automated doc-linter & sync-check gates, living SSoT specification reconciliation, Milestone M45 + ADR-0045 + Dead Ends institutional memory updates, and `AGENTS.md` pair-programming guardrails.
- **Confirmed Inventory Granularity**: Expand the Canonical Code Layout in the architecture specification to a complete **100% production file inventory**, programmatically verified against the filesystem so added, moved, or deleted modules immediately surface in verification.
- **Confirmed Path Validation Boundary**: Enforce strict on-disk path resolution for backticked code references across **living SSoT documents** while allowing historical ADRs to reference superseded or refactored paths as immutable point-in-time records (with evolutionary amendment notes where helpful).
- **Confirmed Verification Gate**: Add a non-mutating **read-only documentation sync check** into the full verification script so stale test counts, ledger ranges, or Quick Section Index line numbers fail deterministically without silently dirtying the working tree.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates silent documentation drift across all seven Single-Source-of-Truth (SSoT) pillars—operational agent kernel, system architecture topology, mathematical specification, visual design system, historical anti-pattern catalog, milestone/feature ledger, and Architectural Decision Records—and upgrades the automated AST/documentation linter to enforce complete referential and structural parity.
- **Target Audience / Persona**: Human engineers and AI pair-programming agents collaborating on astronomical algorithms, 60 FPS SVG telemetry instruments, and Web Worker ephemeris pipelines across multi-session branches.
- **Key Value**: Guarantees that any human or AI reading a targeted spec section or module map gets ground-truth accuracy, and that any code or test change that invalidates a documented path, metric, or invariant is caught immediately by fast local gatekeepers.

---

## 2. User Experience & Visual Design

- **Key Pair-Programming & Verification Flows**:
  1. **Targeted Context Lookup**: During feature or refactor work, an engineer or AI consults the operational kernel router, jumps via verified Quick Section Index line ranges to exact mathematical or design-token definitions, and inspects a 100%-complete module inventory without encountering stale component names or missing helpers.
  2. **Inner-Loop Authoring & Guardrail Feedback**: When editing components, math modules, or documentation, running the fast AST/doc linter immediately reports actionable `file:line` diagnostics if a Markdown anchor breaks, a living-doc path goes stale, an `F#`/`M#`/`DE-xx`/`ADR-xxxx` citation fails to resolve, an unindexed ADR is added, a production module is omitted from the canonical layout, or an unscoped static SVG `<defs>` ID is introduced.
  3. **Pre-Commit Verification Gate**: Running the synchronization command updates test counts, ledger spans, and Quick Section Index line ranges in place; running the full verification pipeline executes a read-only check mode that fails cleanly if synchronization was skipped.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Zero runtime UI changes**. The living design specification continues to govern the observatory's deep-space slate surfaces (`--background` `#020617` / `slate-950`), glassmorphic telemetry HUDs (`slate-900/95` with `backdrop-blur-md`), solar amber (`#fbbf24`), ascending-node cyan (`#38bdf8`), and descending-node rose (`#f43f5e`) tokens.
  - *Specification Precision*: Token documentation is updated in place to reflect instance-scoped SVG `<defs>` prefixes (`useSafeSvgId`) and the true container/layer relationship between the Eclipse transverse SVG wrapper and its live syzygy sub-layer.
  - *Typography & Scannability*: Documentation preserves high-density tables, crisp mathematical notation, and compact imperative rules keeping the always-loaded operational kernel comfortably inside its strict `5.0 KB – 18.0 KB` prompt budget.
- **Interactive Feedback & Motion**:
  - Application animations, 60 FPS chronometer scrubbing, and spring-staged camera transitions remain completely untouched; CLI verification output gains clear, deterministic diagnostic categories for every new integrity check.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Complete 100% Production Module Inventory Backed by Automated Parity Check**
  - *Chosen Approach*: Represent every non-test production module in the architecture specification's Canonical Code Layout and validate 1:1 bidirectional parity in the integrity linter (every production file appears in the layout, and every referenced path exists on disk).
  - *Why*: Previously, nearly a third of decomposed sub-layers, hooks, and math helpers were omitted, causing engineers and AI sessions to miss reusable primitives or misjudge subsystem boundaries. Automated parity turns a maintenance burden into a zero-drift guarantee.
  - *Alternatives Considered*: Keeping a curated high-level directory summary—rejected because partial file lists look authoritative while hiding helper modules.

- **Decision 2: Living-Doc Strictness vs. Historical ADR Immutability**
  - *Chosen Approach*: Validate Markdown links, heading `#anchor` slugs, and `F#`/`M#`/`DE-xx`/`ADR-xxxx` identifiers across the **entire** documentation corpus, while restricting backticked source-path existence checks to **living SSoT documents** (plus targeted evolutionary amendment banners on historical ADRs where an earlier note mischaracterized an active component).
  - *Why*: Living specifications must describe *current reality* with zero dead paths, whereas historical ADRs intentionally explain retired or renamed modules from earlier milestones.
  - *Alternatives Considered*: Enforcing disk existence on every historical backticked symbol in old ADRs—rejected because it would force rewriting historical records whenever files are refactored.

- **Decision 3: Non-Mutating `--check` Mode in Verification Pipeline**
  - *Chosen Approach*: Add a `--check` flag to the documentation metric synchronizer that computes expected test counts, ledger bounds, and Quick Section Index line ranges in memory and exits non-zero on mismatch, then wire that check into the top-level verification command while keeping the mutating sync command explicit.
  - *Why*: Verification commands should never silently rewrite tracked files during CI or pre-commit checks, yet must never allow stale metrics or drifted line ranges to pass unnoticed.
  - *Alternatives Considered*: Auto-mutating docs inside `verify`—rejected because hidden mutations mask drift and create unexpected working-tree diffs.

- **Decision 4: Codifying Milestone M45 Institutional Memory & SVG `<defs>` AST Hygiene**
  - *Chosen Approach*: Record Milestone M45, new feature/hardening ledger entries, ADR-0045, and new Dead Ends entries covering React 19 `<StrictMode>` singleton worker lifecycle hazards and multi-widget static SVG `<defs>` ID collisions—backed by an AST check preventing unscoped static literal IDs inside SVG `<defs>` blocks and concise kernel rules in `AGENTS.md`.
  - *Why*: Captures both *why* those subtle bugs occurred (`DEAD_ENDS.md` / `ADR-0045`) and *how* they are prevented mechanically going forward (`AGENTS.md` + AST linter).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Verification Pipeline Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   7-PILLAR DOCUMENTATION SSoT CORPUS                       │
│                                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Operational Kernel   │  │ System Architecture  │  │ Living Domain    │  │
│  │ (5–18 KB Guardrails, │  │ (Dataflow, Contracts │  │ Specs (Math &    │  │
│  │  Glob-to-Test Router)│  │  & 100% File Layout) │  │  Design Indexes) │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│             │                         │                       │            │
│  ┌──────────┴───────────┐  ┌──────────┴───────────┐  ┌────────┴─────────┐  │
│  │ Institutional Memory │  │ Milestone & Feature  │  │ Historical ADRs  │  │
│  │ (Dead Ends DE-01+)   │  │ Ledger (F1+, M1+)    │  │ + 1:1 ADR Index  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │                         │                       │
              ▼                         ▼                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 AUTOMATED INTEGRITY & METRIC ENGINE                        │
│                                                                            │
│  ┌───────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ AST & Doc Integrity Linter        │  │ Metric & Index Synchronizer    │ │
│  │ • UI Unit Brand & Math Purity     │  │ • Canonical Suite & Test Count │ │
│  │ • SVG <defs> Scoped ID Guardrail  │  │ • Quick Index Lxx–Lyy Ranges   │ │
│  │ • Relative Link + #Anchor Slugs   │  │ • F# / M# / DE# / ADR# Spans   │ │
│  │ • F# / M# / DE# / ADR# Resolution │  │ • Portable Dossier Relative    │ │
│  │ • 1:1 ADR Index & 100% Tree Sync  │  │   Source Links (no file:///)   │ │
│  │ • Living-Doc Backticked Path Gate │  │ • Write Mode vs --check Mode   │ │
│  └─────────────────┬─────────────────┘  └───────────────┬────────────────┘ │
└────────────────────┼────────────────────────────────────┼──────────────────┘
                     │                                    │
                     ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│            INNER-LOOP (`lint:units` / Vitest) & FULL `verify` GATE         │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Validation Rules

- **Referential Integrity Model**:
  - **Ledger Sets**: Dynamic sets parsed from the authoritative ledgers (`F1..FN`, `M1..MN`, `DE-01..DE-NN`, `ADR 0001..00NN`) validated across every prose and table citation in the corpus.
  - **Heading Slug Index**: GitHub-flavored Markdown heading slug table built per document so intra-document (`#slug`) and cross-document (`doc.md#slug`) links are verified alongside file existence.
  - **ADR Index Bijection**: Exact set equality between numbered ADR files and rows in the ADR directory index.
  - **Living Path & Inventory Parity**: Every backticked workspace path in living SSoT documents must resolve on disk, and the set of production modules under `src/` must match the Canonical Code Layout inventory 1:1.
- **AST Hygiene Extension**:
  - Alongside existing nominal-unit, math-purity, and default-date AST checks, JSX `<defs>` subtrees in UI components are scanned to reject static string-literal `id="..."` attributes on gradient, clipPath, pattern, filter, or mask definitions, ensuring universal `useSafeSvgId` / `useId` scoping.

### Interactive Workflow & Command Mapping

- **Authoring & Sync Sequence**:
  1. Reconcile factual drift in living specifications (Eclipse container/layer attribution, instance-scoped SVG `<defs>` token notes, accurate UI component counts, updated guardrail prose, corrected anti-pattern file attributions, and complete 100% production module inventory).
  2. Append Milestone M45, corresponding feature/hardening entries, new anti-patterns (`DE-50`, `DE-51`), and `ADR-0045` (plus an amendment note on `ADR-0044` clarifying `ShadowRayDiagram` container retention), and add the concise SVG `<defs>` scoping + canonical test-suite sync rules to `AGENTS.md`.
  3. Upgrade the integrity linter, metric synchronizer (`--check` support and portable dossier links), and unit-safety test suite, then run `sync:docs` once to lock all line ranges and counters into exact equilibrium before running `typecheck`, `lint:units`, targeted Vitest, and `sync:docs --check`.
