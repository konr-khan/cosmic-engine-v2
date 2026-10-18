# Architectural Decision Records (ADRs)

This directory houses the formal Architectural Decision Records for **Cosmic Engine V2.0**, capturing the rationale, constraints, invariants, and evolutionary history of the observatory platform.

> [!NOTE]
> Historical ADRs represent decisions accepted at specific project milestones. When subsequent architectural phases simplify, supersede, or generalize an earlier decision (e.g., retiring experimental feature flags or consolidating hook layers), an **Evolutionary Amendment Banner** is prepended to the original ADR pointing to its modern successor.

---

## Subsystem Index (ADR 0001 – 0043)

### 1. Core Astronomy Math & Nominal Type Safety
Pure, deterministic mathematical models adhering to Jean Meeus / IAU conventions and TypeScript strict nominal branding.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0002](0002-branded-nominal-unit-typing.md) | Branded Nominal Unit Typing | M2 | Accepted | `Degrees`, `Radians`, `JulianDate`, compile-time angle brand guards |
| [0010](0010-domain-invariant-and-physics-conservation-hardening.md) | Domain Invariant & Physics Conservation Hardening | M10 | Accepted | Energy conservation, distance bounds, eclipse geometry invariants |
| [0015](0015-true-ecliptic-lunar-node-crossing-kinematics.md) | True Ecliptic Lunar Node Crossing Kinematics | M15 | Accepted | Newton-Raphson true latitude solver replacing mean argument $F$ |
| [0019](0019-polar-singularity-rectification-and-syzygy-apparent-ratio.md) | Polar Singularity Rectification & Syzygy Apparent Ratio | M19 | Accepted | Clamped polar azimuths and apparent lunar/solar angular ratio |
| [0022](0022-polar-directional-singularity-rectification.md) | Polar Directional Singularity Rectification | M22 | Accepted | Meridian transit directional tags (`S`, `N`, `Z`) at polar extremes |
| [0027](0027-diurnal-celestial-ground-tracks-and-antimeridian-seam-interpolation.md) | Diurnal Ground Tracks & Antimeridian Interpolation | M27 | Accepted | Cylindrical antimeridian seam unwrapping and continuous tracks |
| [0029](0029-60fps-chronometer-cascade-fix-and-widget-render-decoupling.md) | 60 FPS Cascade Fix & Static Decoupling | M29 | Accepted | `useAnalemma` retirement, EOT unconditional evaluation, frame caching |
| [0037](0037-circular-dependency-elimination-and-astro-core-decomposition.md) | Circular Dependency Elimination & Astro Core Decomposition | M37 | Accepted | `astroConstants.ts`, `core.ts` modularization, zero cyclic imports |
| [0038](0038-codebase-health-domain-purity-and-widget-decoupling.md) | Codebase Health Domain Purity & Widget Decoupling | M38 | Accepted | Separation of pure math solvers from UI presentation concerns |
| [0039](0039-codebase-hardening-temporal-invariance-and-type-safety.md) | Codebase Hardening Temporal Invariance & Type Safety | M39 | Accepted | Elimination of unparameterized `new Date()` defaults in domain functions |
| [0040](0040-nominal-brand-guardrails-and-60fps-ribbon-memoization.md) | Nominal Brand Guardrails & 60 FPS Ribbon Memoization | M40 | Accepted | AST lint guardrails (`scripts/lintUnitSafety.mjs`) & ribbon memoization |

---

### 2. 3D Scene Graph, Cameras & Coordinate Systems
Hierarchical 3D astronomical scene graph across Heliocentric, Geocentric, Anti-Solar, and Topocentric camera frames.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0004](0004-hierarchical-3d-scene-graph-and-camera-rigs.md) | Hierarchical 3D Scene Graph & Canonical Camera Rigs | M4 | Accepted (Amended) | Single geometric truth across celestial reference frames |
| [0005](0005-reusable-miniglobe-and-subsolar-projection.md) | Reusable `<MiniGlobe />` & Subsolar Projection | M5 | Accepted | Analytical day/night terminator clipping with subsolar vector |
| [0007](0007-eclipse-axial-upsize-and-prograde-kinematics.md) | Eclipse Viewport Upsizing & Prograde Astronomical Kinematics | M7 | Accepted | $520 \times 220$ layout parity and physical prograde lunar transit |
| [0008](0008-canonical-camera-alignment-and-sky-view-prograde-kinematics.md) | Canonical Camera Alignment & Prograde Transit Kinematics | M8 | Accepted (Amended) | Canonical $520 \times 220$ projections and signed $\Delta\lambda$ transit kinematics |
| [0009](0009-ground-truth-heliocentric-and-geocentric-prograde-kinematics.md) | Ground-Truth Heliocentric & Geocentric Kinematics | M9 | Accepted | Counter-clockwise prograde orbital mechanics from North Ecliptic Pole |
| [0011](0011-axial-sightline-anti-solar-camera-rectification.md) | Axial Sightline Anti-Solar Camera Rectification | M11 | Accepted | Anti-solar night-side camera orientation along Sun-Earth axis |
| [0012](0012-lunar-orbit-dual-depth-sorting-and-node-muting.md) | Lunar Orbit Dual Depth-Sorting & Node Muting | M12 | Accepted | Line-of-sight depth sorting ($Z_{\text{cam}}$) and distant node muting |
| [0032](0032-observer-colocation-and-3d-celestial-continuum.md) | Observer Colocation & 3D Celestial Continuum | M32 | Accepted | Synchronized topocentric observer pin across 3D and 2D views |
| [0033](0033-copernican-geocentric-laser-morph-continuum.md) | Copernican-Geocentric Laser Morph Continuum | M33 | Accepted | Continuous geometric homotopy from Heliocentric to Geocentric frames |
| [0035](0035-visual-polish-lunar-harmonization-and-nodal-sightline.md) | Visual Polish Lunar Harmonization & Nodal Sightline | M35 | Accepted | Sightline alignment and harmonized lunar limb illumination |

---

### 3. Gyro-Morph Dynamic Armillary & Astrolabe
5-model continuous transformation between 3D celestial sphere and 2D historical astrolabe projections.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0003](0003-gyro-morph-armillary-projections.md) | Gyro-Morph Dynamic Armillary & Astrolabe Projections | M3 | Accepted | 5-model continuum (Copernican, Ptolemaic, Rete, Rojas, Horizon) |
| [0006](0006-armillary-hot-loop-optimization-and-latency-budget.md) | Armillary Hot-Loop Optimization & Latency Budget | M6 | Accepted | $< 0.8\text{ ms/frame}$ budget, cached Euler matrices, zero per-frame heap churn |
| [0020](0020-living-marble-meridian-ring-dynamic-orbit-bead-and-zoom.md) | Living Marble Meridian Ring Dynamic Orbit Bead & Zoom | M20 | Accepted | Dynamic orbit bead scaling, interactive zoom, and meridian ring |
| [0028](0028-gyro-morph-mathematical-hardening-and-modular-ring-subsystem.md) | Gyro-Morph Mathematical Hardening & Modular Ring Subsystem | M28 | Accepted | Decomposed ring rendering modules with analytical arc projection |

---

### 4. Today's Sky, Celestial Meridian & Horizon Dome
Topocentric horizon projections, S-Z-N celestial meridian colure kinematics, and draconic nodal events.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0014](0014-sky-dome-symmetrical-viewbox-twilight-strata-and-draconic-nodal-kinematics.md) | Sky Dome Symmetrical ViewBox, Twilight Strata & Nodal Kinematics | M14 | Accepted | $260 \times 120$ viewbox parity, twilight strata, draconic nodal tracks |
| [0016](0016-dynamic-sighting-aware-horizon-dome-and-tropical-culmination.md) | Dynamic Sighting-Aware Horizon Dome & Tropical Culmination | M16 | Accepted | Sighting-direction aware compass views and tropical culmination |
| [0017](0017-quad-view-celestial-meridian-profiles.md) | Quad-View Celestial Meridian Profiles | M17 | Accepted | Shared S-Z-N colure architecture for Sun and Moon meridian transits |
| [0021](0021-meridian-profile-solstice-bifurcation-and-subhorizon-twilight-kinematics.md) | Meridian Profile Solstice Bifurcation & Subhorizon Twilight | M21 | Accepted | Solstice corridor bifurcation and subhorizon twilight arc rendering |
| [0025](0025-sky-and-moon-dome-container-presenter-decomposition.md) | Sky & Moon Dome Container-Presenter Decomposition | M25 | Accepted | Decoupled presentational domes from ephemeris data fetching |
| [0030](0030-meridian-dome-container-presenter-hooks-and-filter-hygiene.md) | Meridian Dome Container-Presenter Hooks & Filter Hygiene | M30 | Accepted | Shared `MeridianDomeBase` contract and SVG filter def deduplication |

---

### 5. Reactive State, Concurrency & Web Workers
Decoupled multi-rate architecture: 60 FPS chronometer ticking, 10 Hz worker ephemerides, and atomic hover synchronization.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0001](0001-external-store-and-worker-architecture.md) | External Store & Web Worker Architecture | M1 | Accepted | Off-thread ephemeris computing and `useSyncExternalStore` |
| [0018](0018-performance-optimization-modular-ephemeris-decoupling-and-build-hardening.md) | Performance Optimization, Modular Ephemeris Decoupling | M18 | Accepted (Amended) | Dedicated `hoverStore`, worker request IDs, throttling |
| [0024](0024-concurrency-hardening-math-purity-and-component-test-expansion.md) | Concurrency Hardening, Math Purity & Test Expansion | M24 | Accepted (Amended) | 1-entry frame memoization, LRU caches, component unit testing |
| [0026](0026-ephemeris-worker-synchronous-fallback-hardening.md) | Ephemeris Worker Synchronous Fallback Hardening | M26 | Accepted | `workerFallback.ts` parity for SSR / non-Worker environments |
| [0034](0034-terminator-map-modular-decomposition-and-worker-lifecycle-hardening.md) | Terminator Map Modular Decomposition & Worker Lifecycle | M34 | Accepted | Web Worker lifecycle management during terminator track calculations |
| [0036](0036-codebase-health-ssot-worker-fallback-and-test-partitioning.md) | Codebase Health SSoT Worker Fallback & Test Partitioning | M36 | Accepted | Consolidated fallback dispatcher and isolated test suites |

---

### 6. UI Architecture, Component Design System & Controls
Glassmorphic HUD styling, stroke grammar, accessible controls, and modular calendar ribbons.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0013](0013-codebase-consolidation-code-splitting-and-shared-primitives.md) | Codebase Consolidation, Code Splitting & Shared Primitives | M13 | Accepted | Shared `<MiniGlobe />`, `<MiniMoon />`, and UI code splitting |
| [0023](0023-principles-and-design-system-alignment.md) | Observatory Design System & Aesthetic Principles Alignment | M23 | Accepted | Glassmorphic HUDs, semantic stroke palettes, layout contracts |
| [0031](0031-solar-ribbon-chart-modular-decomposition.md) | Solar Ribbon Chart Modular Decomposition | M31 | Accepted | Decomposed annual ribbon chart subcomponents and memoized paths |
| [0041](0041-accessible-controls-and-ui-consolidation.md) | Accessible Controls & UI Consolidation | M41 | Accepted | Accessible buttons, slider primitives, keyboard navigation |

---

### 7. Documentation Architecture, Quality Gates & Tooling
Automated AST unit safety linting, strict Single Source of Truth enforcement, and documentation metric synchronization.

| ADR | Title | Milestone | Status | Key Focus |
| :--- | :--- | :--- | :--- | :--- |
| [0042](0042-documentation-sweep-and-architecture-ssot-split.md) | Documentation Sweep & Architecture SSoT Split | M42 | Accepted | SSoT separation between `ARCHITECTURE.md`, `MATH_SPEC.md`, and `DESIGN_SYSTEM.md` |
| [0043](0043-ai-native-documentation-indexing-and-automated-ledger-sync.md) | AI-Native Documentation Indexing & Automated Ledger Sync | M43 | Accepted | Section indexes, SSoT reconciliation, automated ledger metric sync |
