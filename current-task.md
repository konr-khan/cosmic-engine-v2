# Current Task: Cosmic Engine V2.0 Architectural Refactoring & Hardening

**Status**: 📋 Planning Phase Complete — Awaiting Approval  
**Target Milestone**: Fault Tolerance, Defensive Pipeline, Utility Isolation, SEO & Test Expansion

---

## Phased Execution Program

### Phase 1: Fault-Tolerant Window Error Boundaries & Isolation Architecture
- [x] Create `src/components/common/WindowErrorBoundary.jsx` (observatory-themed React Error Boundary)
- [x] Create `src/components/common/WindowErrorBoundary.test.jsx` (unit test suite for error isolation and reset recovery)
- [x] Integrate `WindowErrorBoundary` into `src/components/layout/DashboardWindow.jsx` around window body
- [x] Verify error boundary isolates failures to individual widget windows without unmounting dashboard

### Phase 2: Defensive Prop Null-Safety & Pipeline Hardening
- [ ] Add defensive fallback defaults in `src/components/widgets/MicroTideView.jsx` (`tides`, `angles`, `userRotation`)
- [ ] Add safe destructuring with fallbacks in `src/components/widgets/LunarAlmanacCard.jsx` (`orbitalData || {}`, `phase?.value`)
- [ ] Add defensive property access in `src/components/widgets/CelestialSphereView.jsx`
- [ ] Run test suite to verify no null pointer regressions during async worker delays

### Phase 3: Pure Formatting Utilities Migration & Test Expansion
- [ ] Migrate `parseTimeString` and `formatTimeHHMM` into `src/utils/cosmicMath/core.js`
- [ ] Export parsing utilities from `src/utils/cosmicMath/index.js`
- [ ] Update `src/components/layout/chronometer/ChronometerReadoutCards.jsx` to consume pure math exports
- [ ] Add comprehensive unit test suite in `src/utils/cosmicMath.test.js` for time string parser edge cases

### Phase 4: SEO, HTML Head Metadata, Typography & Accessibility Polish
- [ ] Update `index.html` with meta description, keywords, Open Graph, Twitter Cards, theme-color (`#020617`), and SVG favicon
- [ ] Add Google Fonts preconnect (`JetBrains Mono`, `Inter`) for observatory typography
- [ ] Update `src/index.css` with font fallbacks and custom dark scrollbars

### Phase 5: Verification & Walkthrough
- [ ] Run full unit test suite: `npm test -- --run` (ensure 100% pass rate across all suites)
- [ ] Run production bundle build: `npm run build` (ensure zero build warnings or chunk errors)
- [ ] Generate `walkthrough.md` artifact summarizing completed refactoring and test verification
