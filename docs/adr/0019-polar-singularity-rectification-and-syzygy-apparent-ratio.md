# ADR 0019: Polar Latitude Singularity Rectification, Syzygy Apparent Ratio Crossings & Domain Invariant Hardening

## Status
Accepted (Refined by ADR 0022)

> [!NOTE]
> **Evolutionary Scope**: The horizontal polar diurnal colure chords ($Y = cy \mp r\sin\delta$), apparent radius ratio totality criterion ($k \ge 1.0$), and timeline bounds clamping remain authoritative.
> Note that polar directional labeling and horizon baselines were subsequently refined from mid-latitude approximations to explicit longitudinal colures in [ADR 0022](0022-polar-directional-singularity-rectification.md).

## Context
Following the stabilization of the Quad-View Celestial Meridian Matrix (ADR-0017) and performance optimization / ephemeris worker decoupling (ADR-0018), an architectural pass on **Dimension 3: Domain Invariant & Edge-Case Boundary Hardening** uncovered three subtle numerical singularities and physical discrepancies in astronomical calculation solvers:

1. **Polar Meridian Diurnal Chord Singularity (`calculateMeridianDiurnalChord`)**:
   - In `src/utils/cosmicMath/today/meridian.ts`, the tangent of observer latitude was computed via:
     ```typescript
     const tanPhi = Math.abs(cosPhi) > 1e-6 ? sinPhi / cosPhi : 0;
     ```
   - At the geographic poles ($\phi = \pm 90^\circ$), $\cos\phi \approx 0 (< 10^{-6})$, which forced `tanPhi = 0`.
   - Consequently, the horizon crossing angle calculation `cosH0 = -tanPhi * tanDelta` collapsed to `0`.
   - At exact poles, both circumpolar midnight sun (`cosH0 < -1`) and polar night (`cosH0 > 1`) checks failed. The solver generated a spurious horizon crossing at $X = cx = 130$ and drew an erroneous diagonal chord cutting through the dome instead of the true horizontal polar chord $Y = cy \mp r\sin\delta$.

2. **Polar Rise/Set Horizon Azimuth Degeneracy (`calculateRiseSetAzimuth`)**:
   - At the geographic poles, horizontal azimuths are coordinate-degenerate (all directions are South at the North Pole; all directions are North at the South Pole).
   - In `src/utils/cosmicMath/today/elevation.ts`, testing polar conditions using $\tan\phi \tan\delta$ produced numerical instability at $\delta \approx 0^\circ$, incorrectly reporting rising azimuths of $090^\circ\text{ E}$ and setting azimuths of $270^\circ\text{ W}$ at the North Pole.

3. **Empirical Scalar Eclipse Totality Threshold (`calculateEclipseData`)**:
   - In `src/utils/cosmicMath/eclipse.ts`, totality capability was evaluated using a fixed scalar distance:
     ```typescript
     const isTotalityCapable = distanceKm < 378000;
     ```
   - This ignored the variation in Earth-Sun orbital distance ($0.983\text{ AU} \to 1.017\text{ AU}$), where the Sun's apparent radius varies by $3.4\%$.
   - In physical astronomy, whether a solar eclipse is Total or Annular is governed strictly by the apparent angular radius ratio:
     $$k = \frac{s_{\text{moon}}}{s_{\text{sun}}}$$
     where $k \ge 1.0 \iff$ Total Solar Eclipse, and $k < 1.0 \iff$ Annular Solar Eclipse.

---

## Decisions

### 1. Singularity-Free Elevation Sine Formulations for Polar Bounds
Replaced all tangent-ratio polar checks across `meridian.ts` and `elevation.ts` with direct direction cosine elevation extrema:
$$\sin(h_{\min}) = \sin\phi\sin\delta - \cos\phi\cos\delta$$
$$\sin(h_{\max}) = \sin\phi\sin\delta + \cos\phi\cos\delta$$

- **Circumpolar (Midnight Sun)**: Triggered whenever $\sin(h_{\min}) \ge 0$ (or at exact poles with seasonal midnight sun).
  - Renders the full great-circle diurnal chord from lower culmination $(X_{\min}, Y_{\min})$ to upper culmination $(X_{\text{peak}}, Y_{\text{peak}})$.
  - At $\phi = \pm 90^\circ$, this naturally produces an exact horizontal chord $Y = cy \mp r\sin\delta$ spanning symmetrically across the dome width ($|X_{\text{peak}} - cx| = |X_{\min} - cx| = r\cos\delta$).
- **Polar Night**: Triggered whenever $\sin(h_{\max}) \le 0$.
  - Suppresses daylight paths (`daylightD = ''`).
  - Gracefully anchors twilight extensions when midday transit enters the sub-horizon twilight band.
- **Normal Rise & Set**: Crosses horizon baseline at:
  $$X_{\text{horizon}} = cx + r \frac{\sin\delta}{\cos\phi}, \quad Y_{\text{horizon}} = cy$$
  terminating into twilight at:
  $$X_{\text{anchor}} = cx + r \frac{\sin\delta - \sin\phi \cdot z_{\text{eff}}}{\cos\phi}$$
  following the colure plane equation $\cos\phi(X - cx) + \sin\phi(cy - Y) = r\sin\delta$.

### 2. Polar Azimuth Suppression
In `calculateRiseSetAzimuth`, added an explicit polar guard for $|\phi| \ge 89.99^\circ$:
- Suppresses degenerate azimuth values and returns `riseAzimuth: null, setAzimuth: null, riseOctant: '--', setOctant: '--'`.

### 3. Astronomical Apparent Radius Ratio ($k = s_{\text{moon}} / s_{\text{sun}} \ge 1.0$)
In `calculateEclipseData`:
- Replaced the scalar distance threshold with the apparent angular radius ratio:
  ```typescript
  const apparentRadiusRatio = sSun > 0 ? parseFloat((sMoon / sSun).toFixed(4)) : 1.0;
  const isTotalityCapable = apparentRadiusRatio >= 1.0;
  ```
- Scaled maximum annular obscuration directly with $k^2 = (s_{\text{moon}} / s_{\text{sun}})^2$.
- Exposed `apparentRadiusRatio` in the calculation result payload.

### 4. Equatorial Diurnal Colure Invariant ($\phi = 0^\circ$)
At the geographic equator ($\phi = 0^\circ$), the colure slope $\cot\phi \to \infty$. Diurnal parallels project as strictly vertical lines:
$$X(H) = cx + r\sin\delta = \text{const}$$
$$\Delta X = |X_{\text{peak}} - X_{\text{horizon}}| = 0\text{ px}$$
Twilight extensions extend strictly vertically downwards without lateral drift ($\Delta X_{\text{twilight}} = 0\text{ px}$).

### 5. Calendar Rollover & 400-Year Gregorian Century Rules
- Formalized assertions for Gregorian century non-leap rules: 1900 and 2100 are common years (365 days); 2000 and 2400 are leap years (366 days).
- Verified sub-millisecond day-of-year rollover across calendar year boundaries (`Dec 31 23:59:59.999Z` $\to$ `Jan 1 00:00:00.000Z`).

---

## Consequences

- **Singularity Immunity**: Zero `NaN`, `Infinity`, or division-by-zero crashes when rendering sky domes and meridian profiles at extreme latitudes ($\pm 90^\circ$) or at the Equator ($0^\circ$).
- **Visual Accuracy**: North and South Pole observers now see flat horizontal diurnal chords at constant elevation $Y = cy \mp r\sin\delta$ rather than broken diagonal cuts.
- **Physical Fidelity**: Eclipse classification conforms to true astronomical standards across perihelion and aphelion orbital distances.
- **Test Harness Expansion**: Expanded test coverage to 40 suites / 580 tests with 4 dedicated invariant suites in `domainInvariants.test.ts`.
