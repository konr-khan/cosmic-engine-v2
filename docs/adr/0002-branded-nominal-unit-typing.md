# ADR 0002: Symbol-Branded Nominal Typing for Astronomical Units

## Status
Accepted

## Context
Astronomical calculations involve high-risk unit mismatches:
* Trigonometric functions (`Math.sin`, `Math.cos`) require angles in **Radians**, whereas ephemeris models, UI readouts, and celestial coordinates are specified in **Degrees** ($0^\circ \to 360^\circ$ or $-90^\circ \to +90^\circ$).
* Temporal epochs (Julian Dates, Julian Centuries elapsed since J2000.0, Unix timestamps) share identical primitive `number` types in TypeScript.
* Accidental unit mixing (e.g. passing degrees into a radian trig function) produces subtle, silent errors in orbital trajectories without causing typecheck or runtime crashes.

## Decision

Adopt a **pragmatic hybrid typing model**:

1. **Symbol-Branded Nominal Types for High-Risk Domains**:
   - `Degrees = number & { readonly [DegreesBrand]: true }`
   - `Radians = number & { readonly [RadiansBrand]: true }`
   - `JulianDate = number & { readonly [JulianDateBrand]: true }`
   - `JulianCenturies = number & { readonly [JulianCenturiesBrand]: true }`
2. **Compile-Time Gatekeeper Functions**:
   - Dedicated gatekeepers (`toRadians(deg: Degrees): Radians`, `toDegrees(rad: Radians): Degrees`, `julianDateToCenturies(jd: JulianDate): JulianCenturies`) serve as the verified bridges.
3. **Ergonomic Aliases for UI**:
   - Presentation parameters (`Latitude`, `Longitude`, `HoursDecimal`, `DayOfYear`, `Pixels`) remain standard `number` aliases to eliminate casting friction across React inputs and SVG coordinates.

## Consequences

* **Positive**:
  - Eliminates silent unit mismatch bugs at compile time with zero runtime performance overhead.
  - Trigonometric math in `src/utils/cosmicMath/` is guaranteed to receive correct units.
* **Invariants**:
  - Never bypass nominal types by force-casting unverified numbers (`val as any as Radians`); always route conversions through `toRadians()` or `asRadians()`.
