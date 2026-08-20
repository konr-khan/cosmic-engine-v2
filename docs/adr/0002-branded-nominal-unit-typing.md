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
   - Dedicated gatekeepers (`toRadians(deg: Degrees): Radians`, `toDegrees(rad: Radians): Degrees`, `julianDateToCenturies(jd: JulianDate): JulianCenturies`, `createUTCDate(year, month, day): Date`) serve as the verified bridges between unit spaces and calendar frames.
3. **Ergonomic Aliases for UI**:
   - Presentation parameters (`Latitude`, `Longitude`, `HoursDecimal`, `DayOfYear`, `Pixels`) remain standard `number` aliases to eliminate casting friction across React inputs and SVG coordinates.
4. **Deterministic UTC Calendar Invariance**:
   - Astronomical Julian dates (`getJulianDate`) and day-of-year calculations (`getDayOfYear`) explicitly evaluate calendar fields via UTC accessors (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`), preventing 1-day temporal skew across client machine timezones.
5. **Topocentric vs. Geocentric Ephemeris Contracts**:
   - Geocentric solvers (`calculateLunarPosition`, `calculateSolarPosition`) return celestial spherical coordinates $(\lambda, \beta, \delta, \alpha, \Delta)$ alongside true Meeus Chapter 48 phase angles $i$ and disc illumination $k$.
   - Topocentric solvers (`calculateLunarEvents`, `calculateParallacticAngle`) explicitly take observer coordinates (`Latitude`, `Longitude`) and compute horizon-relative transit, rise/set, and parallactic tilt $\eta$.

## Consequences

* **Positive**:
  - Eliminates silent unit mismatch bugs at compile time with zero runtime performance overhead.
  - Trigonometric math in `src/utils/cosmicMath/` is guaranteed to receive correct units.
  - Julian date and ephemeris calculations remain perfectly invariant regardless of local client timezones or daylight saving offsets.
  - Clear separation between geocentric orbital ephemerides and topocentric observer coordinates across all TypeScript interfaces.
* **Invariants**:
  - Never bypass nominal types by force-casting unverified numbers (`val as any as Radians`); always route conversions through `toRadians()` or `asRadians()`.
  - Always evaluate or construct astronomical calendar dates in UTC (`createUTCDate` or `Date.UTC`).
