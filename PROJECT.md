# Project: Cosmic Engine V2.0 — Dynamic Armillary & Astrolabe Refinement

## Architecture
The **Gyro-Morph Dynamic Armillary & Astrolabe** connects 5 continuous celestial models (`☉ Orbit`, `⊕ Apparent`, `🧭 Rete`, `📐 Rojas`, `🔭 Horizon`).
The architecture cleanly decouples:
1. **Mathematical Projection Core** (`src/utils/cosmicMath/armillary/`):
   - Evaluates 3D celestial sphere geometry, SO(3) Euler rotations, stereographic conformal projections, Rojas orthographic projections, and topocentric horizon stereonets.
   - Computes analytical closed forms for the Ecliptic ($Y_c = -R_0 \tan\epsilon$, $R_{\text{ecl}} = R_0 / \cos\epsilon$), celestial parallels (Equator, Cancer, Capricorn), Almucantars, and clamps the Sun bead $\vec{P}_\odot$ to the parametric Ecliptic track.
   - Builds depth-sorted SVG paths with front ($z \ge 0$), back ($z < 0$), and unified paths.
2. **UI & Viewport Coordinator** (`src/components/widgets/armillary/`):
   - Coordinates user interaction, 5-mode preset spring snapping, and morph parameter $\lambda \in [0, 1]$.
   - Enforces 2-phase $SO(3)$ camera staging: Phase A ($\lambda \in [0.0, 0.45]$) for camera pitch/yaw pole alignment, Phase B ($\lambda \in [0.45, 1.0]$) for canonical pole lock and projective unwrapping.
   - Preserves and restores custom user 3D camera angles in `saved3DCameraRef`.
   - Renders layered SVG canvas elements: Bezel, Almucantars, Laser Beacon, Observer Cone, Rings, Stars, Beads, and Alidade Sighting Arm.
   - Unifies depth-split stroke dashing and opacity ($0.35 \to 1.0$) across $\lambda \in [0.85, 1.0]$.
3. **Verification & Testing Layer** (`src/utils/cosmicMath.test.ts`, `src/components/widgets/widgets.test.ts`):
   - Vitest unit tests verifying analytical circle invariants ($< 10^{-4}$ tolerance), chord-cutting prevention, 4-season Sun bead clamping, camera staging timing, and opacity transitions.
   - Strict TypeScript nominal typing checks (`Degrees`, `Radians`, `JulianDate`).

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Stereographic Conformal Ecliptic Target | Evaluate Ecliptic target in Rete mode via exact eccentric circle closed form ($Y_c = -R_0 \tan\epsilon$, $R_{\text{ecl}} = R_0 / \cos\epsilon$) preserving true astronomical obliquity $\epsilon = 23.439^\circ$ without artificial $\alpha \to 0$ flattening. | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Continuous Conformal Ring Morphing | Evaluate all major celestial circles (Equator, Tropics, Horizon, Ecliptic) through `computeContinuousProjection2D` across morphing frames ($\lambda > 0$), guaranteeing conformal circle preservation without chord-cutting or vertex pulling. | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Parametric Ecliptic Sun Bead Clamping | Ensure Sun bead position $\vec{P}_\odot$ strictly coincides with the parametric Ecliptic track across all 4 astronomical seasons (Equinoxes, Solstices, Perihelion, Aphelion) and free Rete rotation. | M1 | ORIGINAL_REQUEST §R1 |
| F4 | 2-Phase Staged Camera Choreography | In $3\text{D} \to 2\text{D}$ transitions: Phase A ($\lambda \in [0.0 \to 0.45]$) completes pitch/yaw alignment to canonical pole while geometry remains rigid 3D sphere ($\lambda_{\text{geom}} = 0$); Phase B ($\lambda \in [0.45 \to 1.0]$) locks camera at pole while projective unwrapping and plate decorations materialize. | M2 | ORIGINAL_REQUEST §R2 |
| F5 | Symmetric Reverse Transitions & Camera Memory | Symmetric $2\text{D} \to 3\text{D}$ reverse execution: Phase B folds 2D plate back into 3D sphere under locked camera ($\lambda: 1.0 \to 0.45$), Phase A restores custom user viewing angles from `saved3DCameraRef` ($\lambda: 0.45 \to 0.0$). | M2 | ORIGINAL_REQUEST §R2 |
| F6 | Seamless Depth Stroke Unification | Unify depth-split strokes (solid front $z \ge 0$, dashed back $z < 0$) into 100% solid opacity without flicker or double-drawing as $\lambda \ge 0.85$ (continuous scaling across $\lambda \in [0.85, 1.0]$). | M2 | ORIGINAL_REQUEST §R2 |
| F7 | Analytical Projection & Tolerance Unit Tests | Unit tests verifying Ecliptic center ($Y_c = -R_0 \tan\epsilon$) and radius ($R_{\text{ecl}} = R_0 / \cos\epsilon$) within $< 10^{-4}$ tolerance, and absence of Cartesian chord-cutting artifacts across intermediate morphing frames. | M1, M3 | ORIGINAL_REQUEST §AC |
| F8 | Staged Camera & Depth Unification Component Tests | Component tests verifying camera alignment completion at $\lambda = 0.45$, back stroke opacity unification at $\lambda \ge 0.85$, and user 3D angle restoration. | M2, M3 | ORIGINAL_REQUEST §AC |
| F9 | Full Test Suite & Strict Typecheck Compliance | Execute full Vitest suite (`npm test -- --run`) ensuring all 223 tests across 10 suites pass and `npm run typecheck` passes with zero errors under strict branded nominal typing. | M3 | ORIGINAL_REQUEST §AC |

---

## Refactoring Backlog & Architectural Roadmap

| # | Target | Description | Status |
|---|--------|-------------|--------|
| R1 | Unified 3D $\to$ 2D Space-Curve Pipeline | Consolidate ring transformation, $SO(3)$ Euler projection, depth-splitting ($z_{\text{cam}} \gtrless 0$), and continuous dash blending across Equator, Tropics, Ecliptic, and Almucantars into `generateParametricRing3D`. | DONE |
| R2 | Centralized `EphemerisFrame` Snapshot | Calculate solar/lunar ephemeris elements in one pass via `calculateEphemerisFrame` and distribute immutable frame slices across widgets to eliminate redundant per-frame calculations. | DONE |
| R3 | Decoupled Camera Staging Hook (`useStagedCamera`) | Extract camera Euler angle interpolation and canonical pole snapping ($\lambda \in [0.0, 0.45]$) from `GyroArmillaryView.tsx` into a reusable custom hook `useStagedCamera`. | DONE |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Closed-Form Stereographic Conformal Ecliptic & Ring Morphing | Mathematical domain changes in `src/utils/cosmicMath/armillary/` (`generator.ts`, `projections.ts`, `paths.ts`) implementing F1, F2, F3, and analytical unit tests F7 in `src/utils/cosmicMath.test.ts`. | None | DONE |
| M2 | Staged $SO(3)$ Camera Choreography & Seamless Depth Unification | UI component & layer updates in `src/components/widgets/armillary/` (`GyroArmillaryView.tsx`, `ArmillarySvgCanvas.tsx`, `canvas/ArmillaryRingsLayer.tsx`) implementing F4, F5, F6, and component tests F8 in `src/components/widgets/widgets.test.ts`. | M1 | DONE |
| M3 | Comprehensive Acceptance Verification & Hardening | Full end-to-end test execution (`npm test -- --run`), strict typechecking (`npm run typecheck`), build verification (`npm run build`), and final audit handoff for F9. | M1, M2 | DONE |

---

## Interface Contracts

### 1. `generateArmillaryModel` (`src/utils/cosmicMath/armillary/generator.ts`)
```typescript
export interface ArmillaryModelInput {
  julianDate: number;
  latitude: number;
  longitude: number;
  timeOfDay: number;
  sunRaDeg: number;
  sunDecDeg: number;
  sunLambdaDeg: number;
  moonRaDeg: number;
  moonDecDeg: number;
  moonLambdaDeg: number;
  moonPhase: number;
  morphLambda: number; // [0, 1] - 0: 3D, 1: 2D
  projectionMode: ArmillaryProjectionMode;
  fromProjectionMode?: ArmillaryProjectionMode;
  projectionTransitionT?: number;
  cameraPitch: number;
  cameraYaw: number;
  cameraRoll?: number;
  r0?: number;
  eccentricityMode?: 'true' | 'exaggerated';
  isFreeReteMode?: boolean;
  freeReteOffsetDeg?: number;
}
```
- Geometry flattening progress $\lambda_{\text{geom}} = \text{clamp}((\lambda - 0.45) / 0.55, 0, 1)$ for 2D target modes (`stereographic`, `rojas`, `horizon`).
- Depth boundary threshold `isFront = geomLambda >= 0.85 ? true : pCam.z >= 0`.
- All vertices must have finite coordinates, smooth consecutive segment lengths ($0.01 < \Delta s < 35$), and exact closed-form stereographic conformal target coordinates.

### 2. `ArmillaryRingsLayer` (`src/components/widgets/armillary/canvas/ArmillaryRingsLayer.tsx`)
```typescript
export interface ArmillaryRingsLayerProps {
  rings: ArmillaryRingPath[];
  morphLambda: number;
  orbitRingOpacity: number;
  celestialRingsOpacity: number;
}
```
- Back segments scale opacity via $0.35 + 0.65 \cdot u$ where $u = \text{clamp}((\lambda - 0.85) / 0.15, 0, 1)$.
- Back segments scale strokeWidth to match front width as $u \to 1$.
- `strokeDasharray` transitions from `'3,2'` to `'none'` as $u \to 1$.
- Front segments render `frontPathD` and back segments render `backPathD`, preventing duplicate path drawing.

### 3. Camera Staging & Memory (`src/components/widgets/armillary/GyroArmillaryView.tsx`)
- Phase A: $\lambda_{\text{cam}} = \text{clamp}(\lambda / 0.45, 0, 1)$.
- Pitch/yaw interpolated along shortest angular geodesic.
- `saved3DCameraRef.current` saved during 3D modes / $\lambda \le 0.05$ and restored when returning to 3D.

---

## Code Layout

```
Cosmic Engine V2.0/
├── src/
│   ├── utils/
│   │   ├── cosmicMath/
│   │   │   ├── armillary/
│   │   │   │   ├── generator.ts      # [M1] Armillary model generation & geom staging
│   │   │   │   ├── projections.ts    # [M1] Stereographic conformal closed form
│   │   │   │   ├── paths.ts          # [M1] SVG path generation & depth splitting
│   │   │   │   ├── coordinates.ts    # [M1] Euler rotations & coordinate transforms
│   │   │   │   └── types.ts          # [M1] Domain types & interfaces
│   │   │   └── index.ts
│   │   └── cosmicMath.test.ts        # [M1, M3] Analytical projection & invariant tests
│   └── components/
│       └── widgets/
│           ├── armillary/
│           │   ├── GyroArmillaryView.tsx      # [M2] Master armillary coordinator & camera staging
│           │   ├── ArmillarySvgCanvas.tsx      # [M2] Interactive SVG canvas & pointer coordination
│           │   └── canvas/
│           │       └── ArmillaryRingsLayer.tsx # [M2] Depth-split stroke unification & glow layer
│           └── widgets.test.ts                 # [M2, M3] Component & camera staging tests
```
