# ADR 0012: Lunar Orbit Line-of-Sight Depth Sorting, Viewer-Side Unmuting & Nodal Occlusion

## Status
Accepted

## Context
Following the stabilization of prograde celestial kinematics and anti-solar camera rectification in the Eclipse Demonstrator (ADR-0007, ADR-0011), user verification identified three visual and physical discrepancies in [`LiveSyzygyView.tsx`](../../src/components/widgets/eclipse/LiveSyzygyView.tsx) and [`NodalPlaneVisualizer.tsx`](../../src/components/widgets/eclipse/NodalPlaneVisualizer.tsx):

1. **Premature Muting of Viewer-Side Orbital Paths**:
   - The initial Dual-Zone masking strategy applied an inverse circular mask (`mask="url(#outsideEarth)"`) to all orbital loops, routing every path intersecting Earth's projected disc into a $0.22$ opacity ghost chord.
   - In physical 3D space, the lunar orbit wraps around Earth:
     - The near-side half ($Z > 0$, near Full Moon in Axial Sightline, or Waxing in Syzygy profile) is situated directly **in front of Earth**, facing the viewer.
     - Muting near-side paths caused foreground lines to appear dim and ghosted even though they are unobstructed by Earth.
2. **Discontinuous Moon Disc Outline During Waxing Transit**:
   - In Axial Sightline view, when the Moon passed behind Earth near New Moon, `isBehindEarthDisc` hardcoded `strokeDasharray="3 2"`, rendering waxing moons as dashed while inside Earth radius ($r \le 24$).
   - As the Moon's center crossed $dist > 24\text{px}$, it flipped to solid stroke, but the portion of the Moon disc occluded by the opaque `<MiniGlobe />` disappeared completely, leaving a broken crescent without an occluded circular outline.
3. **Floating Foreground Node Pins for Far-Side Nodal Crossings**:
   - The Ascending (☊) and Descending (☋) node pins were rendered as foreground markers with 100% opacity, solid fill, and crisp `#ffffff` borders, even when physically positioned on the far side of Earth directly behind the planetary disc.

---

## Decisions

### 1. Line-of-Sight Depth Decomposition in `generateOrbitalSegments`
* Extended [`generateOrbitalSegments`](../../src/utils/cosmicMath/projection.ts) to evaluate the 3D line-of-sight depth ($Z$) along each subdivision step:
  - **Transverse / Syzygy View**: $Z = \sin(t) \cdot R_x$ ($Z > 0$ is near-side/waxing, $Z \le 0$ is far-side/waning).
  - **Axial Sightline View**: $Z = -\cos(t) \cdot R_x$ ($Z > 0$ is near-side facing deep space, $Z \le 0$ is far-side facing background Sun).
* Partitioned the return contracts into:
  - Viewer-side ($Z > 0$): `nearWaxAsc`, `nearWaxDesc`, `nearWanAsc`, `nearWanDesc`.
  - Sun-facing / far-side ($Z \le 0$): `farWaxAsc`, `farWaxDesc`, `farWanAsc`, `farWanDesc`.
* Enforced mathematical conservation of total segment counts via Vitest invariants (`domainInvariants.test.ts`).

### 2. Viewer-Side Orbital Path Unmuting
* In [`NodalPlaneVisualizer.tsx`](../../src/components/widgets/eclipse/NodalPlaneVisualizer.tsx):
  - Near-side paths ($Z > 0$) are rendered **unmasked** in front of Earth with **full vibrancy ($0.9$ opacity, $1.2\text{px}$ width)**.
  - Far-side paths ($Z \le 0$) are masked in open sky ($0.9$) and softened to a subtle $0.22$ ghosted X-ray chord across Earth.
* In [`LiveSyzygyView.tsx`](../../src/components/widgets/eclipse/LiveSyzygyView.tsx):
  - Waxing front paths ($Z > 0$) render **unmasked** at full $0.9$ vibrancy across Earth.
  - Waning far paths ($Z \le 0$) render masked in open sky ($0.9$) and ghosted across Earth ($0.22$).

### 3. Earth-Occluded Moon Outline Preservation & Phase Fidelity
* Removed the hardcoded dashed stroke from far-side Moon discs, respecting true phase everywhere:
  \[
  \text{strokeDasharray} = \text{isWaxing} \ ? \ \text{undefined} : \text{"3 2"}
  \]
* Introduced an **Earth-Occluded Moon Overlay** clipped to `axialEarthClip` and rendered on top of `<MiniGlobe />`:
  - Active whenever $dist < 24 + R_{\text{moon}}$ and $Z \le 0$.
  - Renders the identical circular arc with matching stroke width ($2\text{px}$), phase-dependent stroke (`isWaxing ? undefined : '3 2'`), and dark translucent fill (`#0f172a`, $0.45$ opacity).
  - Guarantees seamless continuity across Earth's limb without dropping the occluded outline.

### 4. Node In-Front / Behind Muted Depth Logic
* Formulated the condition for nodal occlusion:
  \[
  \text{isBehindEarth} = (Z_{\text{node}} \le 0) \land (\|\mathbf{x}_{\text{node}} - \mathbf{x}_{\text{earth}}\| \le R_{\text{earth}})
  \]
* Applied dual-state rendering for Ascending (☊) and Descending (☋) node pins:
  - **Directly Behind Earth** ($\text{isBehindEarth} = \text{true}$): Muted ghosted styling (`opacity="0.35"`, dark translucent fill `#0f172a`, dashed ring `strokeDasharray="2 1.5"`, and muted text `/60 font-medium`).
  - **In Front of Earth or in Open Sky** ($\text{isBehindEarth} = \text{false}$): Full 100% vibrancy with solid fill, white border (`#ffffff`), and bold text.

---

## Consequences
* **Visual Clarity & Physical Depth**: Foreground orbital loops no longer appear muted across Earth, while far-side transits maintain clear X-ray depth distinction.
* **Continuous Geometry**: Waxing moons retain complete, unbroken circular outlines throughout planetary transits without sudden stroke popping or missing arcs.
* **Deterministic Verification**: All 21 Vitest suites and 417 unit tests pass deterministically, with complete AST unit-safety compliance.
