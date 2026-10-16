# ADR-0041: Accessible Controls, UI Component Consolidation & AST Linter Hardening

## Status
Accepted

## Context
Following the completion of Milestone M40 (Priorities 1–3), Milestone M41 addresses Priorities 4 and 5 from the architectural evaluation report:
1. **Component Duplication & Interaction Friction**:
   - `SolarShortcutsRail.tsx` and `LunarShortcutsRail.tsx` were 100% duplicate implementations.
   - `MacroOrbitView.tsx` attached synthetic JSX `onWheel`, which modern browsers treat as passive, logging console warnings and latching page scrolls when zooming.
   - `MiniGlobe.tsx` and `MicroTideView.tsx` displayed misleading `cursor-pointer` hands on non-interactive elements, violating `docs/DESIGN_SYSTEM.md` §5.1.
   - Dead props and unused destructured variables were identified in `ControlRing.tsx`, `MiniGlobe.tsx`, `SkyDomeBase.tsx`, and `GyroArmillaryView.tsx`.
2. **Accessibility (a11y) Deficits**:
   - Interactive SVG custom controls (`LatitudeSlider.tsx`, `PolarLongitudeSelector.tsx`, `AstrolabeDial.tsx`) lacked ARIA slider semantics (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`) and keyboard navigation support (`Arrow`, `PageUp/Down`, `Home/End`).
   - `SkyDomeFooter.tsx` rendered the transit jump action inside an unsemantic `<div>` instead of a focusable `<button>`.
   - `ChronometerModalPopovers.tsx` and `ObsNavbar.tsx` menus lacked dialog semantics, outside-click dismissal, and keyboard `Escape` closing.
3. **AST Linter Hardening**:
   - `scripts/lintUnitSafety.mjs` silently swallowed parse exceptions with `catch (_) { continue; }`, and lacked checks for unparameterized `new Date()` calls inside `src/utils/cosmicMath/**`.

## Decision
1. **Extracted Shared `<AlmanacShortcutsRail />`**:
   - Extracted `<AlmanacShortcutsRail />` into `src/components/widgets/common/` and re-exported it from `SolarShortcutsRail.tsx` and `LunarShortcutsRail.tsx`, preserving complete backward-compatible TypeScript prop interfaces.
2. **Native Non-Passive Wheel Zoom in `MacroOrbitView.tsx`**:
   - Replaced synthetic JSX `onWheel` with a native `{ passive: false }` DOM listener attached inside `useEffect`, preventing page scroll hijacking and browser console warnings.
3. **Corrected Affordances & Cleaned Dead Props**:
   - Gated `cursor-pointer` in `MiniGlobe.tsx` to when click or hover handlers are provided; stripped `cursor-pointer` from static node pins in `MicroTideView.tsx`.
   - Removed dead props across `ControlRing.tsx`, `SkyDomeBase.tsx`, and `GyroArmillaryView.tsx`.
4. **Keyboard Accessibility & ARIA Semantics**:
   - Added `role="slider"`, `tabIndex={0}`, ARIA boundary attributes, and arrow/page/home/end key navigation to `LatitudeSlider`, `PolarLongitudeSelector`, and `AstrolabeDial`.
   - Replaced `<div onClick={onSnapTransit}>` in `SkyDomeFooter.tsx` with a semantic `<button type="button">`.
   - Added `role="dialog"`, `aria-modal="true"`, and `Escape` key dismissal to `ChronometerModalPopovers.tsx`, as well as outside-click and `Escape` dismissal with `aria-expanded` to `ObsNavbar.tsx`.
5. **AST Linter Temporal Purity Enforcement**:
   - Hardened `scripts/lintUnitSafety.mjs` to record AST parse failures and traverse `NewExpression` nodes to ban unparameterized `new Date()` inside pure math modules.

## Consequences
- **Accessibility**: All primary observatory dials, sliders, and popovers are fully operable via keyboard navigation and screen-reader compliant.
- **Interaction Fidelity**: Mouse wheel zooming in Macro Orbit works smoothly without page scroll latching.
- **Codebase Cleanliness**: Zero duplicate shortcut rail markup, zero dead props in touched components, and automated AST protection against unparameterized date creation in domain math.
- **Verification**: All 59 test suites (886 tests) pass with zero TypeScript errors, zero unit-safety linter violations, and clean production build output.
