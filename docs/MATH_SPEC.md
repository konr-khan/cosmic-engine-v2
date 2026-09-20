# MATH_SPEC.md — Astronomical Mathematical Specification & Domain Models

This document serves as the ground-truth mathematical reference for **Cosmic Engine V2.0**, codifying all coordinate transformations, ephemeris approximations, twilight thresholds, eclipse shadow geometry, and tidal vector mechanics. All physical constants and temporal epochs conform strictly to the centralized registry in [`src/utils/cosmicMath/astroConstants.ts`](../src/utils/cosmicMath/astroConstants.ts) (see Section 11).

---

## 1. Astronomical Coordinate Systems

### A. Alt-Azimuth (Horizontal System)
* **Observer Zenith**: $+90^\circ$, **Horizon**: $0^\circ$, **Nadir**: $-90^\circ$.
* **Altitude ($a$)**: $a \in [-90^\circ, +90^\circ]$.
* **Azimuth ($A$)**: $A \in [0^\circ, 360^\circ)$, measured eastward from North ($0^\circ = \text{North}, 90^\circ = \text{East}, 180^\circ = \text{South}, 270^\circ = \text{West}$).

### B. Equatorial System
* **Right Ascension ($\alpha$)**: $\alpha \in [0^\circ, 360^\circ)$ or $[0\text{h}, 24\text{h})$.
* **Declination ($\delta$)**: $\delta \in [-90^\circ, +90^\circ]$, with $\delta > 0$ for Northern hemisphere and $\delta < 0$ for Southern hemisphere.

### C. Ecliptic System
* **Ecliptic Longitude ($\lambda$)**: $\lambda \in [0^\circ, 360^\circ)$, relative to the March Equinox ($\Upsilon$).
* **Ecliptic Latitude ($\beta$)**: $\beta \in [-90^\circ, +90^\circ]$, with $\beta > 0$ North of the ecliptic plane and $\beta < 0$ South.
* **Obliquity of the Ecliptic ($\varepsilon$)**:
  \[
  \varepsilon = 23.439281^\circ - 0.0000004^\circ \times n
  \]
  where $n = \text{JD} - 2451545.0$ is the ephemeris day offset from epoch J2000.0.

> [!NOTE]
> **Obliquity Precision Standard**: The exact IAU J2000.0 obliquity constant is $\varepsilon_0 = 23.439281^\circ$ (codified as `EARTH_AXIAL_OBLIQUITY_J2000_DEG` in [`astroConstants.ts`](../src/utils/cosmicMath/astroConstants.ts)). In SVG diagrams, telemetry readouts, and documentation prose, $23.439^\circ$ and $23.44^\circ$ are used as standard rounded display shorthands.

---

## 2. Temporal Epochs & Julian Date Computations

### Julian Date ($\text{JD}$) from Gregorian Date
Given year $Y$, month $M \in [1, 12]$, day $D$, and UTC decimal hour $t \in [0, 24)$:
1. If $M \le 2$, set $Y' = Y - 1$ and $M' = M + 12$; else $Y' = Y, M' = M$.
2. Compute century term $A = \lfloor Y' / 100 \rfloor$ and Gregorian correction $B = 2 - A + \lfloor A / 4 \rfloor$.
3. Compute Julian Date at midnight ($00:00\text{ UTC}$):
   \[
   \text{JD}_0 = \lfloor 365.25(Y' + 4716) \rfloor + \lfloor 30.6001(M' + 1) \rfloor + D + B - 1524.5
   \]
### Exact Julian Date ($\text{JD}$)
\[
\text{JD} = \text{JD}_0 + \frac{t}{24.0}
\]

### Julian Centuries ($T$)
\[
T = \frac{\text{JD} - 2451545.0}{36525.0}
\]

### Day of the Year ($\text{DOY}$) from Gregorian Date
Given calendar year $Y$, month index $M \in [1, 12]$, and day $D$ evaluated in UTC:
\[
\text{DOY} = \left\lfloor \frac{\text{Date.UTC}(Y, M - 1, D) - \text{Date.UTC}(Y, 0, 1)}{86,400,000} \right\rfloor + 1
\]

> [!NOTE]
> All Gregorian calendar inputs ($Y, M, D$) are strictly evaluated via UTC accessors (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`, `Date.UTC`) to guarantee timezone invariance across client runtimes.

### D. Greenwich Mean Sidereal Time ($\text{GMST}$) & Local Sidereal Time ($\text{LST}$)

Given ephemeris day offset $d = \text{JD} - 2451545.0$ from epoch J2000.0:

1. **Greenwich Mean Sidereal Time ($\text{GMST}$)**:
   \[
   \text{GMST} = (280.46061837^\circ + 360.98564736629^\circ \cdot d) \bmod 360^\circ
   \]
   Normalizing into the positive canonical angular domain $[0^\circ, 360^\circ)$:
   \[
   \text{GMST} = ((\text{GMST} \bmod 360^\circ) + 360^\circ) \bmod 360^\circ
   \]

2. **Local Sidereal Time ($\text{LST}$)**:
   Given observer topocentric longitude $\lambda_{\text{obs}} \in [-180^\circ, +180^\circ]$:
   \[
   \text{LST} = ((\text{GMST} + \lambda_{\text{obs}}) \bmod 360^\circ + 360^\circ) \bmod 360^\circ
   \]

3. **Subsolar and Sublunar Geographic Ground Track Longitude ($\lambda_{\text{geo}}$)**:
   Given equatorial right ascension $\alpha$ of a celestial body (Sun $\alpha_\odot$ or Moon $\alpha_☾$) and Greenwich Mean Sidereal Time $\text{GMST}$:
   \[
   \lambda_{\text{geo}} = \operatorname{wrap180}(\alpha - \text{GMST}) = ((((\alpha - \text{GMST} + 540^\circ) \bmod 360^\circ) + 360^\circ) \bmod 360^\circ) - 180^\circ
   \]
   mapping directly into the standard terrestrial geographic longitude interval $[-180^\circ, +180^\circ]$ (positive East, negative West). When $\alpha = \text{GMST}$, the body culminates precisely overhead the Prime Meridian ($\lambda_{\text{geo}} = 0^\circ$).

---

## 3. Solar Ephemeris & Keplerian Orbital Dynamics

### A. Mean Solar Elements
* **Days since epoch J2000.0 ($n$)**: $n = \text{JD} - 2451545.0$
* **Mean Longitude ($L$)**: $L = (280.460^\circ + 0.9856474^\circ \cdot n) \bmod 360^\circ$
* **Mean Anomaly ($g$)**: $g = (357.528^\circ + 0.9856003^\circ \cdot n) \bmod 360^\circ$

### B. True Ecliptic Longitude ($\lambda_\odot$) & Equatorial Position
\[
\lambda_\odot = L + 1.915^\circ \sin g + 0.020^\circ \sin 2g
\]
* **Secular Obliquity Drift Correction ($\varepsilon(n)$)**:
  \[
  \varepsilon(n) = \varepsilon_0 - 0.0000004 \cdot n
  \]
  where $\varepsilon_0 = 23.439^\circ$ (mean obliquity at J2000.0) and $n = \text{JD} - 2451545.0$ is days elapsed from J2000.0.
* **Solar Declination ($\delta_\odot$)**:
  \[
  \sin \delta_\odot = \sin \varepsilon \sin \lambda_\odot \implies \delta_\odot = \arcsin(\sin \varepsilon \sin \lambda_\odot)
  \]
* **Solar Right Ascension ($\alpha_\odot$)**:
  \[
  \alpha_\odot = \operatorname{atan2}(\cos \varepsilon \sin \lambda_\odot, \cos \lambda_\odot)
  \]
* **Equation of Time ($\text{EoT}$)**:
  \[
  \text{EoT} = 4 \cdot (L - \alpha_\odot) \quad \text{[minutes]}
  \]

### C. Keplerian Earth Orbital Distance & Dynamics ($e = 0.01671$)
* **Earth-Sun Distance ($r$)**:
  \[
  r = 1.00014 - 0.01671 \cos g - 0.00014 \cos 2g \quad [\text{AU}]
  \]
* **Orbital Speed ($v$)**:
  \[
  v = 29.7847 \sqrt{\max\left(0.1, \frac{2}{r} - 1\right)} \quad [\text{km/s}]
  \]
* **Solar Irradiance ($S$)**:
  \[
  S = \frac{1361.0}{r^2} \quad [\text{W/m}^2], \quad S_\% = \frac{100}{r^2} \quad [\%]
  \]
* **Apparent Sun Angular Diameter ($\theta_\odot$)**:
  \[
  \theta_\odot = \frac{31.986'}{r} \quad [\text{arcminutes}]
  \]

---

## 4. Twilight Thresholds & Exact Polar Bound Handling

### A. Solar Altitude Thresholds ($h_0$)
| Twilight Band | Threshold $h_0$ | Description |
| :--- | :--- | :--- |
| **Official Daylight** | $-0.833^\circ$ | Top limb touches geometric horizon (including $34'$ atmospheric refraction + $16'$ solar semi-diameter) |
| **Civil Twilight** | $-6.0^\circ$ | Horizon clearly visible, brightest stars emerge |
| **Nautical Twilight** | $-12.0^\circ$ | General sea horizon disappears, navigation stars visible |
| **Astronomical Twilight** | $-18.0^\circ$ | Complete absence of solar illumination (deep night sky) |

### B. Hour Angle Equation & Piecewise Polar Clamping
Given observer latitude $\phi$, solar declination $\delta$, and altitude threshold $h_0$:
\[
\cos \omega = \frac{\sin h_0 - \sin \phi \sin \delta}{\cos \phi \cos \delta}
\]

#### Piecewise Analytical Polar Bounds:
1. **Polar Singularity ($|\phi| \to 90^\circ$)**: If $\cos \phi \cos \delta < 10^{-9}$, solar altitude is independent of hour angle ($\sin h \approx \sin \phi \sin \delta$). Duration is $24.0\text{h}$ if $\phi \cdot \delta \ge h_0$, else $0.0\text{h}$.
2. **Perpetual Day (Midnight Sun)**: If $\sin(h_{\text{min}}) = \sin \phi \sin \delta - \cos \phi \cos \delta \ge \sin h_0$ ($\cos \omega \le -1.0$), daylight duration $= 24.0\text{h}$.
3. **Perpetual Night**: If $\sin(h_{\text{max}}) = \sin \phi \sin \delta + \cos \phi \cos \delta \le \sin h_0$ ($\cos \omega \ge 1.0$), daylight duration $= 0.0\text{h}$.
4. **Standard Diurnal Day**:
   \[
   \omega = \arccos(\operatorname{clamp}(\cos \omega, -1, 1)), \quad \text{Duration} = \frac{2\omega^\circ}{15^\circ/\text{h}}
   \]

### C. Discrete Polar State Classification (`calculatePolarState`)
The global solar illumination regime is mapped to a discrete enum `PolarState` based on daily durations evaluated at the Official Daylight threshold ($h_{\text{official}} = -0.833^\circ$) and Astronomical Twilight floor ($h_{\text{astro}} = -18.0^\circ$):
\[
D_{\text{day}} = \text{calculateDaylightDurationPrecise}(\phi, \delta, h_{\text{official}}), \quad D_{\text{astro}} = \text{calculateDaylightDurationPrecise}(\phi, \delta, h_{\text{astro}})
\]
The analytical state boundaries in [`src/utils/cosmicMath/solar.ts`](../src/utils/cosmicMath/solar.ts) are strictly partitioned:
1. **Perpetual Day (`PERPETUAL_DAY`)**:
   \[
   D_{\text{day}} \ge 24.0\text{h}
   \]
   The upper solar limb remains continuously above the visible horizon ($h \ge -0.833^\circ$) throughout all 24 hours (Midnight Sun).
2. **Perpetual Night (`PERPETUAL_NIGHT`)**:
   \[
   D_{\text{astro}} \le 0.0\text{h}
   \]
   The Sun never rises above $-18.0^\circ$ throughout the 24-hour cycle, resulting in unyielding astronomical darkness (Polar Night).
3. **Perpetual Twilight (`PERPETUAL_TWILIGHT`)**:
   Evaluated under two physical scenarios:
   - *Polar Noon Twilight*: $D_{\text{day}} \le 0.0\text{h} \land D_{\text{astro}} > 0.0\text{h}$. The Sun remains sub-horizon all day, but peaks above $-18.0^\circ$ around solar noon to produce temporary civil, nautical, or astronomical twilight without true daylight.
   - *White Nights / Circumpolar Twilight*: $D_{\text{day}} > 0.0\text{h} \land D_{\text{day}} < 24.0\text{h} \land D_{\text{astro}} \ge 24.0\text{h}$. The Sun sets below the horizon at night, but never descends below $-18.0^\circ$, so true astronomical darkness is never reached.
4. **Normal Diurnal Cycle (`NORMAL`)**:
   Standard mid-latitude diurnal cycle with distinct sunrise, daylight, twilight transitions, and true astronomical night.

### D. Daylight Terminator Shadow Polygon Paths (`getTerminatorShadowPaths`)
For equirectangular 2D world projection maps ($X \in [0, 360]$ corresponding to observer-centered geographic longitudes $\lambda_{\text{geo}} \in [\lambda_{\text{center}} - 180^\circ, \lambda_{\text{center}} + 180^\circ]$), the shadow boundary where solar altitude matches threshold $h_0$ (default $-0.833^\circ$) is solved analytically without numerical iteration:
\[
\sin h_0 = \sin\delta \sin\phi + \cos\delta \cos\phi \cos H
\]
where $H = \lambda_{\text{geo}} - \lambda_\odot$ is the local solar hour angle, and $(\lambda_\odot, \delta)$ is the subsolar coordinates.
Rewriting via the harmonic trigonometric identity:
\[
A \sin\phi + B \cos\phi = \sin h_0
\]
where $A = \sin\delta$ and $B = \cos\delta \cos H$. Defining amplitude $R = \sqrt{A^2 + B^2}$ and phase angle $\gamma = \operatorname{atan2}(A, B)$:
\[
R \sin(\phi + \gamma) = \sin h_0 \implies \phi + \gamma = \pm \alpha_0, \quad \alpha_0 = \arccos\left(\operatorname{clamp}\left(\frac{\sin h_0}{R}, -1, 1\right)\right)
\]
yielding southern and northern boundary latitudes:
\[
\phi_{\text{south}} = \operatorname{clamp}(\gamma - \alpha_0, -90^\circ, 90^\circ), \quad \phi_{\text{north}} = \operatorname{clamp}(\gamma + \alpha_0, -90^\circ, 90^\circ)
\]
* **Singularity & Horizon Bounds**:
  - If $R < 10^{-7}$: if $\sin h_0 > 0 \implies (\phi_{\text{south}}, \phi_{\text{north}}) = (90^\circ, -90^\circ)$; else $(-90^\circ, 90^\circ)$.
  - If $\sin h_0 / R > 1$: entire column is in darkness $\implies (\phi_{\text{south}}, \phi_{\text{north}}) = (90^\circ, -90^\circ)$.
  - If $\sin h_0 / R < -1$: entire column is in daylight $\implies (\phi_{\text{south}}, \phi_{\text{north}}) = (-90^\circ, 90^\circ)$.
Screen SVG coordinates $y = 90 - \phi$ are chained into closed polygon path strings (`southPath`, `northPath`, `combinedPath`) that render the dynamic nightside overlays in `TerminatorMap.tsx` and `MiniGlobeSphere.tsx`.

---

## 5. High-Precision Lunar Ephemeris (Meeus Truncated Series)

### A. Fundamental Arguments (in Julian Centuries $T$)
* **Moon's Mean Longitude ($L'$)**: $L' = (218.3164477 + 481267.88123421 T) \bmod 360^\circ$
* **Mean Elongation ($D$)**: $D = (297.8501921 + 445267.1114034 T) \bmod 360^\circ$
* **Sun's Mean Anomaly ($M$)**: $M = (357.5291092 + 35999.0502909 T) \bmod 360^\circ$
* **Moon's Mean Anomaly ($M'$)**: $M' = (134.9633964 + 477198.8675055 T) \bmod 360^\circ$
* **Argument of Latitude ($F$)**: $F = (93.2720950 + 483202.0175233 T) \bmod 360^\circ$

### B. Periodic Perturbation Series
* **Ecliptic Longitude ($\lambda_{\text{moon}}$)**:
  \[
  \lambda_{\text{moon}} = L' + 6.2886^\circ \sin M' + 1.2740^\circ \sin(2D - M') + 0.6583^\circ \sin 2D + 0.2136^\circ \sin 2M' - 0.1856^\circ \sin M - 0.1143^\circ \sin 2F
  \]
* **Ecliptic Latitude ($\beta_{\text{moon}}$)**:
  \[
  \beta_{\text{moon}} = 5.1282^\circ \sin F + 0.2806^\circ \sin(M' + F) + 0.2777^\circ \sin(M' - F) + 0.1732^\circ \sin(2D - F)
  \]
* **Geocentric Distance ($\Delta_{\text{moon}}$)**:
  \[
  \Delta = 385001 - 20905 \cos M' - 3699 \cos(2D - M') - 2956 \cos 2D - 569 \cos 2M' \quad [\text{km}]
  \]

### C. Geocentric Phase Angle ($i$) & True Disc Illumination ($k$) (Meeus Ch. 48)
Given lunar ecliptic coordinates $(\lambda, \beta, \Delta)$ and solar coordinates $(\lambda_\odot, R)$:
* **Geocentric Elongation ($\psi$)**:
  \[
  \cos \psi = \cos \beta \cos(\lambda - \lambda_\odot)
  \]
* **Geocentric Phase Angle ($i$)**:
  \[
  \tan i = \frac{R \sin \psi}{\Delta - R \cos \psi} \implies i = \operatorname{atan2}(R \sin \psi, \Delta - R \cos \psi) \quad [0^\circ..180^\circ]
  \]
* **True Physical Disc Illumination Fraction ($k$)**:
  \[
  k = \frac{1 + \cos i}{2} \in [0.0, 1.0]
  \]

### D. Topocentric Parallactic Angle ($\eta$) & 2-Step Rise/Set Solver
* **Topocentric Parallactic Angle ($\eta$)**:
  \[
  \tan \eta = \frac{\sin H}{\tan \phi \cos \delta_{\text{moon}} - \sin \delta_{\text{moon}} \cos H}
  \]
  where $H = \text{LST} - \alpha_{\text{moon}}$ is the observer local hour angle.
* **2-Step Lunar Rise/Set Iterative Solver**:
  1. *Initial transit & half-day arc*: $\cos H_0 = \frac{\sin(0.125^\circ) - \sin\phi \sin\delta_{\text{transit}}}{\cos\phi \cos\delta_{\text{transit}}}$, $t^{(0)}_{\text{rise/set}} = t_{\text{transit}} \mp \frac{H_0}{15^\circ/\text{h}} \times 1.035$.
  2. *Drift correction step*: Re-evaluate Moon declination $\delta_{\text{rise/set}}$ at candidate epoch $\text{JD}_0 + t^{(0)}/24$, recomputing $\cos H_{\text{refined}} = \frac{\sin(0.125^\circ) - \sin\phi \sin\delta_{\text{refined}}}{\cos\phi \cos\delta_{\text{refined}}}$ to account for the Moon's $\approx 0.55^\circ/\text{h}$ orbital motion. Circumpolar conditions ($\cos H < -1$ or $\cos H > 1$) return `null` rise/set events cleanly.

### E. True Ecliptic Latitude Crossing Solver ($\beta = 0^\circ$) & Nodal Ephemeris
While the mean argument of latitude $F = L' - \Omega$ represents unperturbed nodal motion, the Moon's true ecliptic latitude $\beta$ undergoes substantial solar gravitational perturbations (evection, variation, and annual terms) of amplitude over $\pm 0.7^\circ$:
\[
\beta = 5.1282^\circ \sin F + 0.2806^\circ \sin(M' + F) + 0.2777^\circ \sin(M' - F) + 0.1732^\circ \sin(2D - F)
\]
Because of the non-zero perturbation sum at $F = 0^\circ$ and $F = 180^\circ$, mean nodal passage ($F = 0^\circ$) and physical ecliptic plane crossing ($\beta = 0^\circ$) diverge by up to $\sim 14$ hours.

To enforce 100% mathematical consistency across all observatory telemetry, visual beads, and countdowns, nodal passages are defined strictly by **True Ecliptic Latitude Crossing ($\beta = 0^\circ$)**:
1. **Newton-Raphson Central-Difference Solver (`findTrueLunarNodeCrossing`)**:
   Given an initial approximation $t_0$ from the mean argument of latitude, the true crossing Julian Date is solved iteratively:
   \[
   t_{k+1} = t_k - \frac{\beta(t_k)}{\dot{\beta}(t_k)}, \quad \dot{\beta}(t_k) \approx \frac{\beta(t_k + h) - \beta(t_k - h)}{2h}
   \]
   with step $h = 0.005\text{ days}$ ($7.2\text{ minutes}$). Convergence to sub-second precision ($|\Delta t| < 10^{-5}\text{ days} \approx 0.86\text{ s}$, $|\beta| < 10^{-4\circ}$) is achieved in $2 \dots 3$ iterations ($< 0.005\text{ ms}$).
2. **Node Type Determination**:
   \[
   \text{type} = \begin{cases} \text{Ascending Node (☊)} & \text{if } \dot{\beta} > 0 \ (\text{crossing South to North}) \\ \text{Descending Node (☋)} & \text{if } \dot{\beta} < 0 \ (\text{crossing North to South}) \end{cases}
   \]
3. **Ascending Hemisphere Invariant**:
   The active orbital hemisphere is strictly defined by instantaneous physical latitude:
   \[
   \text{isAscendingHemisphere} = (\beta \ge 0^\circ)
   \]
   guaranteeing that the Moon bead switches between Rose Red (Descending, South) and Sky Blue (Ascending, North) at the exact second it crosses the true node across all observatory instruments:
   - **Eclipse Mechanics (`LiveSyzygyView`, `NodalPlaneVisualizer`)**: Crosses the horizontal $Y = 110$ ecliptic plane baseline.
   - **Today's Sky (`MoonElevationDome`)**: Transitions the diurnal track stroke color and reaches `0.0d` on the Draconic micro-rail.
   - **Earth & Tidal Gravity Micro View (`MicroTideView`)**: Transitions the Moon body halo stroke and hits the ☊/☋ node pins positioned at the true crossing longitudes ($\lambda_{\text{asc}}, \lambda_{\text{desc}}$).

---

## 6. Syzygy Eclipse Shadow Geometry

### A. Angular Radii & Horizontal Parallax
* Sun Angular Radius: $s_\odot \approx 0.267^\circ$
* Moon Angular Radius: $s_{\text{moon}} = \arcsin(1737.4 / \Delta)$
* Moon Horizontal Parallax: $\pi_{\text{moon}} = \arcsin(6378.137 / \Delta)$
* Sun Horizontal Parallax: $\pi_\odot \approx 0.0024^\circ$

### B. Earth Shadow Cones at Lunar Distance (with 1.02 Atmospheric Refraction)
* **Umbra Radius**: $\rho_u = 1.02 \cdot (\pi_{\text{moon}} + \pi_\odot - s_\odot) \quad [\text{degrees}]$
* **Penumbra Radius**: $\rho_p = 1.02 \cdot (\pi_{\text{moon}} + \pi_\odot + s_\odot) \quad [\text{degrees}]$

> [!NOTE]
> Shadow radii ($\rho_u, \rho_p$), parallaxes ($\pi_{\text{moon}}, \pi_\odot$), and solar/lunar semi-diameters ($s_\odot, s_{\text{moon}}$) are evaluated strictly in angular degrees (scaled by the Chauvenet-Danjon $1.02$ atmospheric enlargement factor) and are distinct from physical linear kilometers ($\Delta$).

### C. Syzygy Angular Separation ($\gamma$)
* **Lunar Eclipse**:
  \[
  \Delta\lambda_{\text{opp}} = ((\text{Elongation} - 180^\circ + 540^\circ) \bmod 360^\circ) - 180^\circ
  \]
  \[
  \gamma_{\text{lunar}} = \sqrt{(\Delta\lambda_{\text{opp}} \cos \beta)^2 + \beta^2}
  \]
* **Solar Eclipse**:
  \[
  \Delta\lambda_{\text{conj}} = ((\text{Elongation} + 180^\circ) \bmod 360^\circ) - 180^\circ
  \]
  \[
  \gamma_{\text{solar}} = \sqrt{(\Delta\lambda_{\text{conj}} \cos \beta)^2 + \beta^2}
  \]

### D. Apparent Angular Radius Ratio ($k$) & Solar Eclipse Totality Criterion

The classification of central solar eclipses into **Total** vs. **Annular** regimes is governed dynamically by the ratio of the Moon's apparent angular semi-diameter to the Sun's apparent angular semi-diameter:
\[
k = \frac{s_{\text{moon}}}{s_\odot} = \frac{\arcsin(R_{\text{moon}} / \Delta_{\text{moon}})}{\arcsin(R_\odot / \Delta_\odot)}
\]
where $\Delta_{\text{moon}}$ is the instantaneous geocentric lunar distance ($356,400\text{ km} \dots 406,700\text{ km}$) and $\Delta_\odot$ is the instantaneous Earth-Sun orbital distance ($0.983\text{ AU} \dots 1.017\text{ AU}$):

1. **Total Solar Eclipse ($k \ge 1.0$)**:
   When the Moon's apparent disc is equal to or larger than the solar photosphere ($s_{\text{moon}} \ge s_\odot$), the lunar umbral shadow cone reaches Earth's surface. If the syzygy separation satisfies $\gamma_{\text{solar}} < 1.0^\circ$:
   - **Type**: `TOTAL_SOLAR`
   - **Obscuration**: Scaled quadratically from $100\%$ at the central shadow axis ($\gamma_{\text{solar}} = 0$) to $95\%$ at the umbral boundary:
     \[
     \text{Obscuration} = \max(95, \min(100, \operatorname{round}(100 - 5 \gamma_{\text{solar}}^2)))
     \]

2. **Annular Solar Eclipse ($k < 1.0$)**:
   When the Moon's apparent disc is smaller than the solar photosphere ($s_{\text{moon}} < s_\odot$), the lunar umbral cone terminates in space before reaching Earth, and the antumbra sweeps across the surface. An unbroken ring of brilliant photosphere (annulus) remains visible:
   - **Type**: `ANNULAR_SOLAR`
   - **Obscuration**: Bounded by the fractional area ratio $k^2$ with quadratic falloff:
     \[
     \text{MaxAnnular} = \min(98, \operatorname{round}(k^2 \times 100) \lor 94)
     \]
     \[
     \text{Obscuration} = \max(90, \min(\text{MaxAnnular}, \operatorname{round}(\text{MaxAnnular} - 4 \gamma_{\text{solar}}^2)))
     \]

3. **Partial Solar Eclipse ($\gamma_{\text{solar}} \ge 1.0^\circ$)**:
   When the Moon's penumbra touches Earth but the central umbra/antumbra misses the observer ($1.0^\circ \le \gamma_{\text{solar}} < \pi_{\text{moon}} + s_\odot + s_{\text{moon}}$):
   - **Type**: `PARTIAL_SOLAR`
   - **Obscuration**: Continuous power-law decay ($p = 1.15$) from the central boundary baseline ($\text{baseEdge} = 95\%$ for totality-capable geometries, $90\%$ for annular) down to $1\%$ at the outer penumbral contact limit $\gamma_{\max} = \pi_{\text{moon}} + s_\odot + s_{\text{moon}} \approx 1.55^\circ$:
     \[
     f = \frac{\gamma_{\max} - \gamma_{\text{solar}}}{\gamma_{\max} - 1.0^\circ}
     \]
     \[
     \text{Obscuration} = \max(1, \min(\text{baseEdge}, \operatorname{round}(\text{baseEdge} \cdot f^{1.15})))
     \]

> [!NOTE]
> By computing $k$ from exact instantaneous celestial positions rather than an empirical static distance threshold (e.g. $378,000\text{ km}$), the engine accurately accounts for Earth's orbital eccentricity ($e = 0.01671$), where the Sun's apparent angular diameter varies annually by $\pm 1.7\%$ between perihelion ($s_\odot = 0.272^\circ$) and aphelion ($s_\odot = 0.263^\circ$).

### E. Axial Sightline Down-the-Barrel Kinematics & Prograde Projections

The **Axial Sightline** demonstrator (`NodalPlaneVisualizer.tsx` and `projectGeocentricAxial`) positions the observer along the Sun-Earth axis on Earth's night side ($+X$ in geocentric ecliptic coordinates), looking directly through Earth toward the Sun in the background along $-\mathbf{e}_X$.

1. **Camera Reference Basis & Right-Handed Astronomical Coordinates**:
   Let the camera be oriented with Ecliptic North as the vertical UP direction:
   \[
   \hat{\mathbf{u}}_{\text{up}} = +\mathbf{e}_Y, \quad \hat{\mathbf{u}}_{\text{view}} = -\mathbf{e}_X
   \]
   By the standard right-handed camera coordinate definition ($\hat{\mathbf{u}}_{\text{right}} = \hat{\mathbf{u}}_{\text{view}} \times \hat{\mathbf{u}}_{\text{up}}$):
   \[
   \hat{\mathbf{u}}_{\text{right}} = (-\mathbf{e}_X) \times (+\mathbf{e}_Y) = -\mathbf{e}_Z
   \]
   Therefore:
   * **Screen Right ($+X_{\text{cam}}$)** points along $-\mathbf{e}_Z$ (Celestial/Ecliptic **West**).
   * **Screen Left ($-X_{\text{cam}}$)** points along $+\mathbf{e}_Z$ (Celestial/Ecliptic **East**).
   * **Screen Up ($-Y_{\text{screen}}$ in SVG)** points along $+\mathbf{e}_Y$ (Ecliptic **North**).

2. **Prograde West-to-East Lunar Kinematics**:
   The Moon's orbital motion around Earth is prograde (counter-clockwise when viewed from the North Ecliptic Pole, $+\mathbf{e}_Y$). In the fundamental plane:
   \[
   \mathbf{r}(\theta) = -\cos\theta \, \mathbf{e}_X + \sin\theta \, \mathbf{e}_Z
   \]
   Projecting onto the camera's transverse right vector $\hat{\mathbf{u}}_{\text{right}} = -\mathbf{e}_Z$:
   \[
   s_{\text{trans}} = \mathbf{r}(\theta) \cdot \hat{\mathbf{u}}_{\text{right}} = (\sin\theta \, \mathbf{e}_Z) \cdot (-\mathbf{e}_Z) = -\sin\theta
   \]
   Given phase angle $\text{phaseRad} = \text{phaseValue} \cdot 2\pi$ (where $\text{phaseValue} = 0.0$ is New Moon, $0.25$ is First Quarter, $0.5$ is Full Moon, and $0.75$ is Third Quarter), the screen coordinates on a $520 \times 220$ canvas centered at $(X_c, Y_c) = (260, 110)$ are:
   \[
   X_{\text{screen}} = X_c - \sin(\text{phaseRad}) \cdot R_x
   \]
   \[
   Y_{\text{screen}} = Y_c - \beta \cdot \text{scalePxPerDeg}
   \]
   where $R_x = 150\text{px}$ and $\text{scalePxPerDeg} = 10.5\text{px/deg}$.

3. **Astronomical Eclipse Transit Trajectory**:
   * **Pre-Eclipse / Waning Crescent ($\text{phase} \approx 0.98, \sin(\text{phaseRad}) < 0$)**: The Moon is positioned to the **Right** ($X_{\text{screen}} > X_c$, West of the Sun).
   * **Central Eclipse / Syzygy ($\text{phase} = 0.0, \sin(\text{phaseRad}) = 0$)**: The Moon is centered at $X_{\text{screen}} = X_c = 260$.
   * **Post-Eclipse / Waxing Crescent ($\text{phase} \approx 0.02, \sin(\text{phaseRad}) > 0$)**: The Moon moves to the **Left** ($X_{\text{screen}} < X_c$, East of the Sun).
   * **Monotonic Transit**: Over the course of a solar eclipse, $\frac{dX_{\text{screen}}}{dt} < 0$, moving the lunar disc continuously from **Right to Left (West to East)** across the face of the Sun, matching physical solar eclipses.

4. **Nodal Crossing Points**:
   With Sun-Node angle $\Delta\Omega = \lambda_{\odot} - \Omega_{\text{node}}$:
   \[
   t_{\text{asc}} = ((-\Delta\Omega \bmod 2\pi) + 2\pi) \bmod 2\pi, \quad X_{\text{asc}} = X_c - \sin(t_{\text{asc}}) \cdot R_x, \quad Y_{\text{asc}} = Y_c
   \]
   \[
   t_{\text{desc}} = (((\pi - \Delta\Omega) \bmod 2\pi) + 2\pi) \bmod 2\pi, \quad X_{\text{desc}} = X_c - \sin(t_{\text{desc}}) \cdot R_x, \quad Y_{\text{desc}} = Y_c
   \]
   During eclipse seasons ($\Delta\Omega \approx 0^\circ$ or $180^\circ$), the node pins converge toward $X_c = 260$ directly within the central shadow target area.

5. **Line-of-Sight Depth Decomposition & Nodal Occlusion**:
   * **Depth Function Along Viewing Axis**:
     - *Axial Sightline*: $Z(t) = -\cos(t) \cdot R_x$ ($Z > 0$ is near-side facing deep space; $Z \le 0$ is far-side facing background Sun).
     - *Transverse Profile*: $Z(t) = \sin(t) \cdot R_x$ ($Z > 0$ is near-side/waxing; $Z \le 0$ is far-side/waning).
   * **Dual-Zone Orbital Path Masking**:
     - *Near-Side ($Z > 0$)*: Rendered unmasked at full $0.9$ opacity across the entire loop including Earth crossing.
     - *Far-Side ($Z \le 0$)*: Rendered masked in open sky ($0.9$ opacity) and softened to a subtle $0.22$ ghosted X-ray chord across Earth ($r \le R_{\text{earth}}$).
   * **Earth-Occluded Moon Disc Overlay**:
     When the far-side Moon ($Z \le 0$) overlaps the Earth disc ($\|\mathbf{x}_{\text{moon}} - \mathbf{x}_{\text{earth}}\| < R_{\text{earth}} + R_{\text{moon}}$), an overlay clipped to `axialEarthClip` renders on top of `<MiniGlobe />`:
     \[
     \text{strokeDasharray} = \text{isWaxing} \ ? \ \text{undefined} : \text{"3 2"}, \quad \text{strokeWidth} = 2.0\text{px}, \quad \text{fill} = \text{#0f172a (0.45 opacity)}
     \]
   * **Nodal Pin Occlusion Invariant**:
     A node marker is considered occluded by Earth if and only if it lies on the far side within Earth's projected radius:
     \[
     \text{isBehindEarth} = (Z_{\text{node}} \le 0) \land (\|\mathbf{x}_{\text{node}} - \mathbf{x}_{\text{earth}}\| \le R_{\text{earth}})
     \]
     When $\text{isBehindEarth}$ is true, the node renders with ghosted X-ray styling (`opacity = 0.35`, dark translucent fill `#0f172a`, dashed ring `strokeDasharray = "2 1.5"`, muted text `/60 font-medium`); otherwise it retains 100% full vibrancy.

### F. Sky View Simulator Prograde Invariants & Perspectival Kinematics

The **Sky View Simulator** (`SkyViewSimulator.tsx`) simulates the sky perspective of an observer positioned along the central path of the lunar umbra (greatest eclipse track), looking South toward the Sun ($R_{\odot} = 42\text{px}$, $R_{\text{moon}} = 42\text{px}$):

* **Signed Longitudinal Elongation**:
  \[
  \Delta \lambda = ((\text{elongation} + 180^\circ) \bmod 360^\circ) - 180^\circ
  \]
* **Prograde West-to-East Screen Transit**:
  In the sky with North pointing UP, **West is to the Right** ($\Delta \lambda < 0 \implies +X$) and **East is to the Left** ($\Delta \lambda > 0 \implies -X$):
  \[
  X_{\text{moon}} = X_c - (\Delta \lambda \cdot \text{scale}_x)
  \]
  \[
  Y_{\text{moon}} = Y_c - (\beta \cdot \text{scale}_y)
  \]
  where $X_c = 120\text{px}, Y_c = 120\text{px}$, $\text{scale}_x = 75\text{px/deg}$, and $\text{scale}_y = 8\text{px/deg}$.
* **Monotonic Transit Guarantee**: Because $\Delta \lambda$ increases monotonically as the Moon orbits Earth prograde, $\frac{dX_{\text{moon}}}{dt} < 0$, moving the Moon continuously from **Right to Left (West to East)** across the Sun and exiting smoothly without bounce or reversal.

---

## 7. Gyro-Morph Armillary Multi-Model Unification & Astrolabe Projections

### A. Unified 5-Mode Continuum
The subsystem models an unbroken continuum across 5 modes:
```
[1. Heliocentric Orbit]       [2. Geocentric Apparent & 3D Sphere]       [3. 2D Astrolabe Plates]
   (Copernican Truth)              (Apparent & Spherical Lattice)               (Planispheric 2D)
  • Sun @ (0,0,0) / Focus        • Earth @ (0,0,0)                            • Stereographic Conformal
  • Earth @ 1 AU orbits          • Sun revolving on Ecliptic track            • Universal Rojas
  • 6 Seasonal Milestones        • 6 Celestial Rings & 12 Stars               • Topocentric Horizon
```

### B. Clamped Ecliptic Track Sun Bead
In Astrolabe plates and Geocentric apparent modes, the Sun bead $\vec{P}_\odot$ is mathematically clamped directly to the parametric Ecliptic track of radius $R_0$, obliquity $\epsilon = 23.439^\circ$, and apparent solar ecliptic longitude $\lambda_\odot$:
\[
\vec{P}_{\odot,\text{base}} = \begin{pmatrix} R_0 \cos\lambda_\odot \\ R_0 \sin\lambda_\odot \sin\epsilon \\ R_0 \sin\lambda_\odot \cos\epsilon \end{pmatrix}
\]
Rotated by Rete offset $\Delta\theta_{\text{rete}}$ around the $Y$-axis:
\[
\vec{P}_\odot = \mathbf{R}_y(\Delta\theta_{\text{rete}}) \vec{P}_{\odot,\text{base}}
\]

### C. Keplerian Orbital Geometry & Physics
1. **Heliocentric Earth Position**:
   With semi-major axis $a = 1.00000011\text{ AU}$, eccentricity $e = 0.01671022$ (or $e_{\text{exag}} = 0.25$), mean anomaly $M$, and true anomaly $\nu$:
   \[
   r = \frac{a(1 - e^2)}{1 + e \cos\nu}, \quad x_{\text{orbit}} = r \cos\lambda_{\text{earth}}, \quad z_{\text{orbit}} = r \sin\lambda_{\text{earth}}
   \]
   Scaled to canvas radius $R_0 = 100\text{ px}$:
   \[
   \vec{P}_{\oplus} = (x_{\text{orbit}} \cdot R_0, 0, z_{\text{orbit}} \cdot R_0), \quad \vec{P}_{\odot} = (0, 0, 0)
   \]
2. **Geocentric Inversion**:
   Earth centered at origin $(0, 0, 0)$, and Sun revolving along the apparent annual ecliptic loop:
   \[
   \vec{P}_{\odot} = (a \cos\lambda_\odot, a \sin\lambda_\odot \sin\epsilon, a \sin\lambda_\odot \cos\epsilon), \quad \vec{P}_{\oplus} = (0, 0, 0)
   \]
3. **Keplerian Orbital Physics Metrics**:
   * *Orbital Velocity (Vis-Viva Equation)*: $v = \sqrt{G M_\odot \left(\frac{2}{r} - \frac{1}{a}\right)} \approx 29.78 \sqrt{\frac{2}{r_{\text{AU}}} - 1}\text{ km/s}$
   * *Relative Solar Irradiance*: $I = \left(\frac{1\text{ AU}}{r}\right)^2 \times 100\%$
   * *Solar Angular Diameter*: $\theta_\odot = \frac{31.986'}{r_{\text{AU}}}$
4. **Seasonal Milestone Nodes**:
   6 seasonal milestone points ($M_k$) positioned along the orbit:
   * *Perihelion* ($\lambda = 102.94^\circ$, $0.983\text{ AU}$, $30.29\text{ km/s}$)
   * *March Equinox* ($\lambda = 0^\circ$, $0.996\text{ AU}$, $29.84\text{ km/s}$)
   * *June Solstice* ($\lambda = 90^\circ$, $1.016\text{ AU}$, $29.29\text{ km/s}$)
   * *Aphelion* ($\lambda = 282.94^\circ$, $1.017\text{ AU}$, $29.29\text{ km/s}$)
   * *September Equinox* ($\lambda = 180^\circ$, $1.004\text{ AU}$, $29.72\text{ km/s}$)
   * *December Solstice* ($\lambda = 270^\circ$, $0.984\text{ AU}$, $30.28\text{ km/s}$)

### D. Armillary 3D Celestial Graphics Frame ($\mathcal{F}_{\text{arm}}$, Y-up)
The Gyro-Morph Armillary and Astrolabe subsystem ([`src/utils/cosmicMath/armillary/coordinates.ts`](../src/utils/cosmicMath/armillary/coordinates.ts)) adopts a specialized **Y-up spherical graphics coordinate frame** ($\mathcal{F}_{\text{arm}}$). In this convention, the North Celestial Pole aligns with $+Y$, enabling intuitive top-down stereographic and orthographic projections directly onto the $XZ$ screen plane (with the Center of Projection beacon at the South Celestial Pole $(0, -R_0, 0)$):
* $+X$: Points toward the March Equinox ($\Upsilon$, $\alpha = 0^\circ, \delta = 0^\circ$).
* $+Y$: Points toward the North Celestial Pole ($\delta = +90^\circ$).
* $+Z$: Completes the right-handed basis ($\alpha = 90^\circ, \delta = 0^\circ$).

Given radius $R_0 = 100\text{px}$, equatorial Right Ascension $\alpha \in [0^\circ, 360^\circ)$ and Declination $\delta \in [-90^\circ, +90^\circ]$:
\[
x_{\text{arm}} = R_0 \cos\delta \cos\alpha, \quad y_{\text{arm}} = R_0 \sin\delta, \quad z_{\text{arm}} = R_0 \cos\delta \sin\alpha
\]

#### Basis Transformation to Scene Graph Inertial Frame ($\mathcal{F}_{\text{eq}}$):
While $\mathcal{F}_{\text{arm}}$ utilizes $+Y$ for the polar axis for SVG projection convenience, the Unified 3D Astronomical Scene Graph (Section 10.A) follows standard astronomical convention where the North Celestial Pole is $+Z$ (Z-up). The exact bijective coordinate permutation between the two frames is:
\[
\begin{pmatrix} x_{\text{arm}} \\ y_{\text{arm}} \\ z_{\text{arm}} \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & 1 & 0 \end{pmatrix} \begin{pmatrix} x_{\text{scene}} \\ y_{\text{scene}} \\ z_{\text{scene}} \end{pmatrix}, \quad \mathbf{x}_{\text{arm}} = \mathbf{x}_{\text{scene}}, \ \mathbf{y}_{\text{arm}} = \mathbf{z}_{\text{scene}}, \ \mathbf{z}_{\text{arm}} = \mathbf{y}_{\text{scene}}
\]

### E. 2D Astrolabe Historical Projections
1. **Stereographic Conformal Projection (Equatorial Plane)**:
   Projected from South Celestial Pole $(0, -R_0, 0)$ onto $y = 0$:
   \[
   x_{\text{stereo}} = R_0 \frac{x}{R_0 + y}, \quad z_{\text{stereo}} = R_0 \frac{z}{R_0 + y}
   \]
   * *Singularity Guard*: For points near the South Celestial Pole ($y \to -R_0$), the denominator diverges ($R_0 + y \to 0$). Implementations apply a singularity check $|R_0 + y| < 10^{-6}$ and finite canvas bounding clamp to prevent unbounded division by zero.
   * *Conformal Circle Invariants*: Under stereographic projection, every circle on $S^2$ maps to an exact circle in the plane:
     - **Celestial Equator ($\delta = 0^\circ$)**: Concentric circle with radius $R = R_0$.
     - **Tropic of Cancer ($\delta = +\epsilon$)**: Concentric circle with radius $R_{\text{Can}} = R_0 \tan\left(\frac{90^\circ - \epsilon}{2}\right)$.
     - **Tropic of Capricorn ($\delta = -\epsilon$)**: Concentric circle with radius $R_{\text{Cap}} = R_0 \tan\left(\frac{90^\circ + \epsilon}{2}\right)$.
     - **Ecliptic Great Circle (inclined by $\epsilon = 23.439^\circ$)**: Eccentric circle with Center $(X_c, Y_c) = (0, -R_0 \tan\epsilon)$ and Radius $R_{\text{ecl}} = \frac{R_0}{\cos\epsilon} = R_0 \sec\epsilon$. In screen coordinates where $Y$ is inverted, the center is $(0, +R_0 \tan\epsilon)$.
     - **Almucantar (Altitude $a$) Circles**: Center $y_c = R_0 \frac{\cos\phi}{\sin\phi + \sin a}$, Radius $r_a = R_0 \frac{\cos a}{\sin\phi + \sin a}$.
        * *Southern Hemisphere Singularity Guard ($\phi < 0$, $a \approx |\phi|$)*: When the altitude parallel passes through the South Celestial Pole (the projection pole), $\sin\phi + \sin a \to 0$, causing $r_a, y_c \to \infty$. The engine applies a guard $|\sin\phi + \sin a| < 10^{-4}$ and clamps radius $r_a \le 25 R_0$ and center $|y_c| \le 25 R_0$ ($2500\text{px}$ at $R_0 = 100$) to eliminate SVG clipping failures and infinite rendering artifacts.

2. **Universal Rojas Orthographic Projection (Solstitial Colure Plane)**:
   Projected orthographically onto $z = 0$:
   \[
   x_{\text{rojas}} = x = R_0 \sin\alpha \cos\delta, \quad y_{\text{rojas}} = y = R_0 \sin\delta
   \]
   * Declinations map to parallel horizontal chords $y = R_0 \sin\delta$.
   * Hour circles map to nested semi-ellipses with vertical semi-major axis $R_0$ and horizontal semi-minor axis $R_0 \sin\alpha$.

3. **Topocentric Horizon Stereonet**:
   Projected from Nadir ($a = -90^\circ$) onto horizontal plane ($a = 0^\circ$):
   \[
   r_{\text{horiz}} = R_0 \tan\left(\frac{90^\circ - a}{2}\right), \quad x_{\text{horiz}} = r_{\text{horiz}} \sin A, \quad y_{\text{horiz}} = -r_{\text{horiz}} \cos A
   \]
   * *Nadir Sinking Radial Clamping*: When celestial bodies sink below the local horizon toward the Nadir ($a \to -90^\circ$), $\tan((90^\circ - a)/2) \to \infty$. The engine strictly clamps radial distance $r_{\text{horiz}} \le 10 R_0$ and bounds Cartesian output coordinates $(x_{\text{horiz}}, y_{\text{horiz}}) \in [-10 R_0, 10 R_0]$ ($[-1000\text{px}, 1000\text{px}]$ at $R_0 = 100$) to prevent SVG coordinate explosion.

### F. Universal Any-to-Any Morphing Engine & Staged Choreography

#### 1. Spherical SLERP & Geodesic Trajectories (`slerp3D`)
For any two celestial 3D vectors $\vec{v}_1, \vec{v}_2 \in \mathbb{R}^3$ (Sun, Moon, Earth, and 6 seasonal milestone halo nodes):
\[
r_1 = \|\vec{v}_1\|, \quad r_2 = \|\vec{v}_2\|, \quad r(t) = (1 - t) r_1 + t r_2
\]
Let $\hat{u}_1 = \vec{v}_1 / r_1$, $\hat{u}_2 = \vec{v}_2 / r_2$, and angle $\Omega = \arccos(\operatorname{clamp}(\hat{u}_1 \cdot \hat{u}_2, -1, 1))$:
\[
\vec{v}(t) = r(t) \cdot \left[ \frac{\sin((1 - t)\Omega)}{\sin \Omega} \hat{u}_1 + \frac{\sin(t\Omega)}{\sin \Omega} \hat{u}_2 \right]
\]
* *Antipodal Singularity Guard ($\Omega \approx \pi$)*: When $\hat{u}_1 \cdot \hat{u}_2 < -0.9999$, construct an orthogonal unit vector $\hat{n} \perp \hat{u}_1$ and rotate via Rodrigues' formula:
  \[
  \vec{v}(t) = r(t) \cdot [\cos(\pi t)\hat{u}_1 + \sin(\pi t)\hat{n}]
  \]
* *Collinear / Zero Guard ($\Omega \approx 0$ or $r_i \approx 0$)*: Falls back gracefully to normalized linear lerp.

#### 2. Continuous Conformal & Circle-Preserving Cross-Projections (`computeContinuousProjection2D`)
Transitions between 2D historical plates avoid point-wise Cartesian chord pulling by operating in continuous projection parameter space:
1. **Stereographic $\longleftrightarrow$ Horizon Stereonet**:
   Conformal circle preservation is maintained by continuous $SO(3)$ rotation of the observer reference frame on $S^2$:
   \[
   \phi(t) = 90^\circ - (90^\circ - \phi_{\text{user}}) \cdot t, \quad \theta_{\text{LST}}(t) = \theta_{\text{LST}} \cdot t
   \]
   Transforming $\vec{P}_{\text{eq}} \to \vec{P}_{\text{horiz}}(t)$ and projecting conformally onto the stereographic plane:
   \[
   x(t) = R_0 \frac{x_{\text{rot}}(t)}{R_0 + z_{\text{rot}}(t)}, \quad y(t) = R_0 \frac{y_{\text{rot}}(t)}{R_0 + z_{\text{rot}}(t)}
   \]
   Because stereographic projection is conformal at every $\phi(t)$, **every circle on $S^2$ remains an exact circle or line throughout the transition**.

2. **Stereographic $\longleftrightarrow$ Rojas Orthographic**:
   Continuous transformation from the equatorial plane ($y=0$) to the solstitial colure plane ($z=0$) via $X$-axis rotation $\alpha(t) = t \cdot 90^\circ$ combined with dynamic optical perspective focal pull $d(t) \in [R_0, \infty)$:
   \[
   \begin{pmatrix} x_t \\ y_{\text{depth}}(t) \\ y_{\text{target}}(t) \end{pmatrix} = \begin{pmatrix} x \\ y \cos\alpha(t) - z \sin\alpha(t) \\ z \cos\alpha(t) + y \sin\alpha(t) \end{pmatrix}, \quad \text{focalScale}(t) = \frac{R_0(1 - t) + \text{denom}(t) \cdot t}{\text{denom}(t)}
   \]
   where $\text{denom}(t) = \max(0.1, R_0 + y_{\text{depth}}(t)(1 - t))$, yielding:
   \[
   x(t) = x_t \cdot \text{focalScale}(t), \quad y(t) = y_{\text{target}}(t) \cdot \text{focalScale}(t)
   \]

3. **Continuous Almucantars (`generateContinuousAlmucantars`)**:
   Altitude circles transition continuously between eccentric stereographic circles and concentric horizon stereonet rings:
   \[
   y_c(t) = (1 - t) y_{c,\text{stereo}} + t \cdot 0, \quad r_a(t) = (1 - t) r_{a,\text{stereo}} + t \left[ R_0 \tan\left(\frac{90^\circ - a}{2}\right) \right]
   \]

#### 3. Decoupled 2-Stage Staged $SO(3)$ Camera Alignment Choreography
When transitioning between 3D spherical modes ($\lambda = 0$) and 2D astrolabe plates ($\lambda = 1$), camera Euler angles $(\psi, \theta)$ and geometric flattening $\lambda_{\text{geom}}$ decouple into 2 sequential intervals:
* **Phase A ($\lambda \in [0.0 \to 0.45]$ — Camera Alignment)**:
  \[
  \lambda_{\text{cam}} = \operatorname{clamp}\left(\frac{\lambda}{0.45}, 0, 1\right), \quad \lambda_{\text{geom}} = 0
  \]
  Camera Euler angles swing smoothly to canonical projection poles via shortest geodesic angular delta:
  \[
  \Delta\theta_{\text{shortest}} = (\theta_{\text{canon}} - \theta_0 + 540^\circ) \bmod 360^\circ - 180^\circ
  \]
  \[
  \psi(\lambda) = \psi_0 + (\psi_{\text{canon}} - \psi_0) \cdot \lambda_{\text{cam}}, \quad \theta(\lambda) = (\theta_0 + \Delta\theta_{\text{shortest}} \cdot \lambda_{\text{cam}} + 360^\circ) \bmod 360^\circ
  \]
  Where $(\psi_{\text{canon}}, \theta_{\text{canon}}) = (90^\circ, 0^\circ)$ for stereographic and horizon, and $(0^\circ, 0^\circ)$ for rojas. Because $\lambda_{\text{geom}} = 0$, 3D spherical geometry remains completely rigid, eliminating diagonal axis shear.

* **Phase B ($\lambda \in [0.45 \to 1.0]$ — Geometric Flattening & Plate Materialization)**:
  \[
  \lambda_{\text{geom}} = \operatorname{clamp}\left(\frac{\lambda - 0.45}{0.55}, 0, 1\right), \quad \text{Camera locked at } (\psi_{\text{canon}}, \theta_{\text{canon}})
  \]
  Screen vertex positions blend continuously from 3D camera projection to 2D target projection:
  \[
  \begin{pmatrix} x_{\text{screen}} \\ y_{\text{screen}} \end{pmatrix} = (1 - \lambda_{\text{geom}}) \begin{pmatrix} x_{\text{cam}} \\ -y_{\text{cam}} \end{pmatrix} + \lambda_{\text{geom}} \begin{pmatrix} x_{\text{proj}} \\ -y_{\text{proj}} \end{pmatrix}
  \]
  Progressive plate decorations (bezel, almucantars, alidade) fade in smoothly across $\lambda_{\text{geom}} \in [0, 1]$.

* **Symmetric Reverse Transitions ($2\text{D} \to 3\text{D}$)**:
  Plate decorations fade and 2D geometry re-folds into 3D sphere ($\lambda: 1.0 \to 0.45$) under locked pole before camera restores saved user angles $(\psi_{\text{user}}, \theta_{\text{user}})$ ($\lambda: 0.45 \to 0.0$) with zero angular drift.

#### 4. Continuous Depth-Split Stroke Unification
To avoid visual popping between depth-split 3D spherical rendering (solid front $z_{\text{cam}} \ge 0$, dashed back $z_{\text{cam}} < 0$) and unified 2D astrolabe plates, back segment paths continuously scale over $\lambda \in [0.85, 1.0]$:
\[
u = \operatorname{clamp}\left(\frac{\lambda - 0.85}{0.15}, 0, 1\right)
\]
\[
\text{opacity}_{\text{back}}(\lambda) = \text{opacity}_{\text{ring}} \cdot (0.35 + 0.65 \cdot u)
\]
\[
w_{\text{back}}(\lambda) = w_{\text{back}, 0} + (w_{\text{front}} - w_{\text{back}, 0}) \cdot u
\]
\[
\text{dashGap}(u) = 2 \cdot (1 - u) \implies \text{strokeDasharray} = \begin{cases} \text{'none'} & \text{if } u \ge 0.99 \\ \text{'3,2'} & \text{if } u \le 0.01 \\ \text{'3,'} + \text{dashGap} & \text{otherwise} \end{cases}
\]
At $\lambda \ge 0.85$, $z_{\text{cam}} < 0$ segments seamlessly blend to $100\%$ solid opacity and match front stroke width without duplicating path elements.

### G. Free Rete Spinning & Analog Solar Time Solver
When the Rete is rotated by an interactive angular offset $\Delta\theta_{\text{free}}$:
1. **Apparent Local Sidereal Time**:
   \[
   \theta_{\text{apparent}} = (\theta_{\text{LST}} + \Delta\theta_{\text{free}} + 360^\circ) \bmod 360^\circ
   \]
2. **Apparent Solar Hour Angle & Local Solar Time**:
   \[
   H_\odot = (\theta_{\text{apparent}} - \alpha_\odot + 360^\circ) \bmod 360^\circ
   \]
   \[
   T_{\text{solar}} = \left(\frac{H_\odot}{15^\circ} + 12\right) \bmod 24
   \]

### H. Volumetric Laser Projection Beacons & Conic Light Envelope
1. **Center of Projection (Focal Pole)**:
   * Stereographic: $\vec{F}_{3D} = (0, -R_0, 0)$ (South Celestial Pole).
   * Rojas: $\vec{F}_{3D} = (0, 0, +1.5 R_0)$ (Orthogonal sightline).
   * Horizon Net: $\vec{F}_{3D} = (0, -R_0, 0)$ (Nadir).
2. **Camera Rotation Transformation**:
   \[
   \vec{F}_{\text{cam}} = \mathbf{R}_{\text{pitch}}(\psi) \mathbf{R}_{\text{yaw}}(\theta) \vec{F}_{3D}
   \]
3. **Screen Projection**:
   \[
   \vec{F}_{\text{screen}} = (1 - \lambda) \begin{pmatrix} F_{\text{cam}, x} \\ -F_{\text{cam}, y} \end{pmatrix} + \lambda \begin{pmatrix} F_{\text{proj}, x} \\ -F_{\text{proj}, y} \end{pmatrix}
   \]
4. **Laser Conic Rays**:
   8 radial rays connecting $\vec{F}_{\text{screen}}$ through circle vertices $\vec{P}_i(\lambda)$ down to the planar projective rim at radius $1.4 R_0$.

### I. Astrolabe Alidade Sighting Arm Mathematics
Given sighting rule angle $\theta_{\text{rule}} \in [0^\circ, 360^\circ)$:
1. **Sighted Right Ascension**:
   \[
   \alpha_{\text{sighted}} = (\theta_{\text{rule}} + 360^\circ) \bmod 360^\circ, \quad \alpha_{\text{hours}} = \frac{\alpha_{\text{sighted}}}{15^\circ}
   \]
2. **Sighted Hour Angle & Horizontal Coordinates**:
   \[
   H_{\text{sighted}} = (\theta_{\text{LST}} - \alpha_{\text{sighted}}) \times \frac{\pi}{180^\circ}
   \]
   \[
   \sin a_{\text{sighted}} = \sin\phi \sin\delta + \cos\phi \cos\delta \cos H_{\text{sighted}} \implies a_{\text{sighted}} = \arcsin(\operatorname{clamp}(\sin a_{\text{sighted}}, -1, 1))
   \]
   \[
   A_{\text{sighted}} = \operatorname{atan2}(-\cos\delta \sin H_{\text{sighted}}, \; \sin\delta \cos\phi - \cos\delta \sin\phi \cos H_{\text{sighted}}) \bmod 360^\circ
   \]
3. **Nearest Target Sighting Lock**:
   Target angle $\theta_{\text{target}} = (\operatorname{atan2}(y_{\text{screen}}, x_{\text{screen}}) \times \frac{180^\circ}{\pi} + 90^\circ + 360^\circ) \bmod 360^\circ$. Sighting locks when $|\Delta\theta| \le 10.0^\circ$.

### J. Unequal Planetary Hours & High-Latitude Piecewise Kinematics (`calculatePlanetaryHour`)
Historical astrolabes partition local daylight and nighttime into 12 unequal (temporal) planetary hours:
1. **Input Sanitization & Euclidean Positive Modulo**:
   Given raw solar or decimal time $t_{\text{raw}} \in \mathbb{R}$:
   \[
   t_{\text{local}} = ((t_{\text{raw}} \bmod 24) + 24) \bmod 24
   \]
2. **Canonical Diurnal & Nocturnal Hours**:
   Given sunrise time $t_{\text{rise}}$ and sunset time $t_{\text{set}}$:
   \[
   \Delta t_{\text{day}} = (t_{\text{set}} \ge t_{\text{rise}}) ? (t_{\text{set}} - t_{\text{rise}}) : (24 - t_{\text{rise}} + t_{\text{set}})
   \]
   * *Daytime ($t_{\text{local}} \in [t_{\text{rise}}, t_{\text{set}}]$)*:
     Hour duration $L_{\text{day}} = \frac{\Delta t_{\text{day}}}{12}$.
     Hour index $H = \lfloor \frac{t_{\text{local}} - t_{\text{rise}}}{L_{\text{day}}} \rfloor + 1 \in [1, 12]$.
     Progression percentage $P = \operatorname{clamp}\left(\frac{(t_{\text{local}} - t_{\text{rise}}) \bmod L_{\text{day}}}{L_{\text{day}}} \times 100\%, 0\%, 100\%\right)$.
   * *Nighttime ($t_{\text{local}} \notin [t_{\text{rise}}, t_{\text{set}}]$)*:
     Night duration $\Delta t_{\text{night}} = 24 - \Delta t_{\text{day}}$, hour duration $L_{\text{night}} = \frac{\Delta t_{\text{night}}}{12}$.
     Hour index $H = \lfloor \frac{t_{\text{elapsed, night}}}{L_{\text{night}}} \rfloor + 1 \in [1, 12]$.

3. **High-Latitude Piecewise Circumpolar Handling**:
   At polar latitudes where $\Delta t_{\text{day}} \ge 23.99\text{h}$ (Midnight Sun / Polar Day) or $\Delta t_{\text{day}} \le 0.01\text{h}$ (Polar Night):
   * *Polar Day*: $L_{\text{day}} = 2.0\text{h}$, $H = \lfloor \frac{t_{\text{local}}}{2.0} \rfloor + 1 \in [1, 12]$, $\text{isDay} = \text{true}$.
   * *Polar Night*: $L_{\text{night}} = 2.0\text{h}$, $H = \lfloor \frac{t_{\text{local}}}{2.0} \rfloor + 1 \in [1, 12]$, $\text{isDay} = \text{false}$.
   This prevents division by zero ($\Delta t \to 0$) and guarantees non-NaN progression metrics throughout circumpolar seasons.

4. **Chaldean Order of Ruling Planets**:
   Planetary hours cycle continuously according to geocentric orbital distance:
   \[
   \text{Chaldean Sequence: } \text{Saturn (0)} \to \text{Jupiter (1)} \to \text{Mars (2)} \to \text{Sun (3)} \to \text{Venus (4)} \to \text{Mercury (5)} \to \text{Moon (6)}
   \]
   Given day of week $D \in [0, 6]$ ($0 = \text{Sunday}$ ruled by Sun index 3) and elapsed hour index $h_{\text{elapsed}} \in [0, 23]$:
   \[
   \text{planetIndex} = (\text{dayRulerIndex}(D) + h_{\text{elapsed}}) \bmod 7
   \]

### K. Singularity Normalization & Coordinate Hygiene (`coordinates.ts`, `projections.ts`)
1. **Zenith & Nadir Azimuth Indeterminacy**:
   When altitude $a \to \pm 90^\circ$ (within $|a \mp 90^\circ| < 10^{-6}$), the horizontal sightline aligns with the local vertical axis where azimuth $A$ is geometrically undefined. The coordinate engine sets $A \equiv 0.0^\circ$ exactly, preventing $\operatorname{atan2}(0, 0)$ indeterminate results.
2. **Euclidean Right Ascension Wrapping**:
   Right ascension derived from 3D coordinates is wrapped strictly into $[0^\circ, 360^\circ)$:
   \[
   \alpha_{\text{norm}} = ((\alpha \bmod 360^\circ) + 360^\circ) \bmod 360^\circ
   \]
3. **Negative Zero Normalization**:
   All coordinate transformations and projection kernels normalize IEEE 754 floating-point negative zero (`-0`) to positive zero (`0`):
   \[
   \operatorname{normalizeZero}(x) = \operatorname{Object.is}(x, -0) \;?\; 0 : x
   \]

---

## 8. Gravitational Tidal Vectors & Syzygy Deformation

### A. Gravitational Syzygy Alignment Factor
Given geocentric angle to Sun $\theta_\odot$ and geocentric angle to Moon $\theta_{\text{moon}}$:
\[
\text{alignmentFactor} = \cos(2(\theta_{\text{moon}} - \theta_\odot)) \in [-1.0, 1.0]
\]
* **Spring Tides (Syzygy)**: When Sun and Moon align ($\theta_{\text{moon}} - \theta_\odot \in \{0, \pi\}$, New / Full Moon), $\text{alignmentFactor} \to +1.0$.
* **Neap Tides (Quadrature)**: When Sun and Moon are orthogonal ($\theta_{\text{moon}} - \theta_\odot \in \{\pi/2, 3\pi/2\}$, First / Third Quarter), $\text{alignmentFactor} \to -1.0$.
* **Classification Threshold**:
  \[
  \text{TideType} = \begin{cases}
  \text{Spring Tide} & \text{if } \text{alignmentFactor} > 0.8 \\
  \text{Neap Tide} & \text{if } \text{alignmentFactor} < -0.8 \\
  \text{Transitional} & \text{otherwise}
  \end{cases}
  \]

### B. Ocean Tidal Bulge Deformation
Given baseline Earth ocean radius $R_{\text{base}}$:
\[
r_x = R_{\text{base}} + 6 + 3 \cdot \text{alignmentFactor}, \quad r_y = R_{\text{base}}
\]
* *Spring Syzygy Bulge*: $r_x = R_{\text{base}} + 9\text{ px}$ (Tidal deformation ratio $\approx 2.0\times$).
* *Neap Quadrature Bulge*: $r_x = R_{\text{base}} + 3\text{ px}$ (Tidal deformation ratio $\approx 1.0\times$).

### C. Local Observer Tide Status
Given local observer diurnal rotation angle $\theta_{\text{user}} = ((t_{\text{UTC}} - 12) \cdot 15^\circ + \lambda_{\text{geo}}) \bmod 360^\circ$ and lunar phase angle $\theta_{\text{phase}} = \text{phase} \cdot 360^\circ$:
\[
\Delta\theta = (\theta_{\text{user}} - \theta_{\text{phase}} + 360^\circ) \bmod 360^\circ
\]
* **High Tide**: $\Delta\theta \in [0^\circ, 45^\circ] \cup [135^\circ, 225^\circ] \cup [315^\circ, 360^\circ]$ (Observer aligns with the sub-lunar or anti-lunar ocean tidal bulge).
* **Low Tide**: $\Delta\theta \in (45^\circ, 135^\circ) \cup (225^\circ, 315^\circ)$ (Observer is positioned in the quadrature tidal trough).

### D. Top-Down 4-Quadrant Nodal Orbit Decomposition
In the toggleable `☊ Nodal Loop` mode of the Tidal Gravity Micro View, the circular top-down Moon orbit ($R_{\text{orbit}} = 60\text{ px}$) is mapped to the dynamic lunar nodal plane:
1. **Ascending Node Angular Position ($\theta_\Omega$)**:
   Given Sun direction angle $\theta_\odot$, solar ecliptic longitude $\lambda_\odot$, and true Ascending Node longitude $\Omega$:
   \[
   \theta_\Omega = (\theta_\odot + (\Omega - \lambda_\odot) + 360^\circ) \bmod 360^\circ, \quad \theta_\mho = (\theta_\Omega + 180^\circ) \bmod 360^\circ
   \]
2. **Ecliptic Latitude & Elongation Functions**:
   For any orbit vertex at angle $\theta \in [0, 2\pi]$:
   \[
   E(\theta) = (\theta - \theta_\odot + 360^\circ) \bmod 360^\circ, \quad \beta(\theta) = 5.145^\circ \sin(\theta - \theta_\Omega)
   \]
3. **4-Quadrant Stroke Encodings**:
   * *Waxing Ascending* ($E \le 180^\circ, \beta \ge 0$): Solid Sky Blue (`#38bdf8`, width $1.2\text{px}$).
   * *Waxing Descending* ($E \le 180^\circ, \beta < 0$): Solid Rose Red (`#f43f5e`, width $1.2\text{px}$).
   * *Waning Ascending* ($E > 180^\circ, \beta \ge 0$): Dashed Sky Blue (`#38bdf8`, dash `4 3`, width $1.2\text{px}$).
   * *Waning Descending* ($E > 180^\circ, \beta < 0$): Dashed Rose Red (`#f43f5e`, dash `4 3`, width $1.2\text{px}$).

---

## 9. Dynamic Ephemeris Distance & Apparent Diameter Scaling

### A. Subsolar Apparent Angular Diameter ($\theta_\odot$)
Given instantaneous Earth-Sun heliocentric distance $r_{\text{AU}} \in [0.983, 1.017]\text{ AU}$:
\[
\theta_\odot = \frac{31.986'}{r_{\text{AU}}} \quad [\text{arcminutes}]
\]
* *Perihelion ($0.983\text{ AU}$)*: $\theta_\odot \approx 32.53'$.
* *Aphelion ($1.017\text{ AU}$)*: $\theta_\odot \approx 31.45'$.

### B. Sublunar Apparent Angular Diameter ($\theta_{\text{moon}}$)
Given instantaneous geocentric lunar distance $d_{\text{km}} \in [356,400, 406,700]\text{ km}$ relative to mean distance $d_0 = 384,400\text{ km}$:
\[
\theta_{\text{moon}} = 31.13' \cdot \left(\frac{384,400\text{ km}}{d_{\text{km}}}\right) \quad [\text{arcminutes}]
\]
* *Perigee ($356,400\text{ km}$)*: $\theta_{\text{moon}} \approx 33.57'$.
* *Apogee ($406,700\text{ km}$)*: $\theta_{\text{moon}} \approx 29.42'$.

---

## 10. Unified 3D Astronomical Scene Graph & Canonical Camera Rigs

Section 10 codifies the ground-truth mathematical models, matrix transformations, Keplerian scale modes, shadow cone geometry, and projection camera rigs implemented in `src/utils/cosmicMath/scene/`.

### A. Coordinate Frames & Transformations

1. **Heliocentric Ecliptic J2000 Frame ($\mathcal{F}_{\text{ecl}}$)**:
   * Origin: Sun barycenter / Center of Focus F1 $(0, 0, 0)$.
   * Fundamental Plane: Mean Ecliptic plane of epoch J2000.0 ($Z = 0$).
   * $+X$-axis: Points toward the March Equinox ($\Upsilon$, ecliptic longitude $\lambda = 0^\circ$).
   * $+Y$-axis: Points in the ecliptic plane toward $\lambda = 90^\circ$ (June Solstice direction).
   * $+Z$-axis: Points toward the North Ecliptic Pole ($\beta = +90^\circ$).

2. **Geocentric Equatorial J2000 Frame ($\mathcal{F}_{\text{eq}}$)**:
   * Origin: Earth center $(0, 0, 0)$.
   * Fundamental Plane: Earth celestial equator ($\delta = 0^\circ$).
   * $+X$-axis: Points toward the March Equinox ($\alpha = 0^\circ, \delta = 0^\circ$).
   * $+Y$-axis: Points in equatorial plane toward $\alpha = 90^\circ, \delta = 0^\circ$.
   * $+Z$-axis: Points toward the North Celestial Pole ($\delta = +90^\circ$).

> [!NOTE]
> **Subsystem Frame Conventions**: The 3D Scene Graph operates in canonical astronomical Z-up space ($\mathcal{F}_{\text{ecl}}$ and $\mathcal{F}_{\text{eq}}$, where $+Z$ is the orbital/equatorial pole). For 2D/3D astrolabe planispheric flattening in the Gyro-Morph Armillary ([`src/utils/cosmicMath/armillary/`](../src/utils/cosmicMath/armillary/)), coordinates map to the Y-up Armillary Graphics Frame $\mathcal{F}_{\text{arm}}$ via the basis permutation codified in Section 7.D.

3. **Frame Transformation Matrices**:
   Given mean Earth obliquity $\varepsilon = 23.439281^\circ$:
   \[
   \mathbf{M}_{\text{ecl}\to\text{eq}} = \mathbf{R}_x(-\varepsilon) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\varepsilon & -\sin\varepsilon \\ 0 & \sin\varepsilon & \cos\varepsilon \end{pmatrix}
   \]
   \[
   \mathbf{M}_{\text{eq}\to\text{ecl}} = \mathbf{R}_x(+\varepsilon) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\varepsilon & \sin\varepsilon \\ 0 & -\sin\varepsilon & \cos\varepsilon \end{pmatrix}
   \]
   For any 3D vector $\vec{v}_{\text{ecl}} \in \mathcal{F}_{\text{ecl}}$, its equatorial representation is $\vec{v}_{\text{eq}} = \mathbf{M}_{\text{ecl}\to\text{eq}} \vec{v}_{\text{ecl}}$.

4. **Bijective Scene Graph $\longleftrightarrow$ Armillary Frame Transformations (`scene/transforms.ts`)**:
   Pure conversion utilities `transformSceneToArmillary` and `transformArmillaryToScene` implement the exact involution matrix $\mathbf{M}_{\text{scene}\leftrightarrow\text{arm}} = \mathbf{M}_{\text{scene}\leftrightarrow\text{arm}}^{-1}$:
   \[
   \mathbf{M}_{\text{scene}\to\text{arm}} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & 1 & 0 \end{pmatrix} \implies \begin{pmatrix} x_{\text{arm}} \\ y_{\text{arm}} \\ z_{\text{arm}} \end{pmatrix} = \begin{pmatrix} x_{\text{scene}} \\ z_{\text{scene}} \\ y_{\text{scene}} \end{pmatrix}
   \]
   \[
   \mathbf{M}_{\text{arm}\to\text{scene}} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 0 & 1 \\ 0 & 1 & 0 \end{pmatrix} \implies \begin{pmatrix} x_{\text{scene}} \\ y_{\text{scene}} \\ z_{\text{scene}} \end{pmatrix} = \begin{pmatrix} x_{\text{arm}} \\ z_{\text{arm}} \\ y_{\text{arm}} \end{pmatrix}
   \]
   satisfying $\mathbf{M}_{\text{scene}\to\text{arm}} \mathbf{M}_{\text{arm}\to\text{scene}} = \mathbf{I}_3$, guaranteeing lossless, zero-drift coordinate conversion across the 3D scene graph and armillary continuum.

5. **Generalized $SO(3)$ Euler Camera Rotation Matrix**:
   Given Pitch $\psi$, Yaw $\theta$, and Roll $\phi$:
   \[
   \mathbf{R}_{\text{cam}}(\psi, \theta, \phi) = \mathbf{R}_x(\psi) \mathbf{R}_y(\theta) \mathbf{R}_z(\phi)
   \]
   where:
   \[
   \mathbf{R}_x(\psi) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\psi & -\sin\psi \\ 0 & \sin\psi & \cos\psi \end{pmatrix}, \quad
   \mathbf{R}_y(\theta) = \begin{pmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{pmatrix}, \quad
   \mathbf{R}_z(\phi) = \begin{pmatrix} \cos\phi & -\sin\phi & 0 \\ \sin\phi & \cos\phi & 0 \\ 0 & 0 & 1 \end{pmatrix}
   \]

### B. Keplerian Scale Modes & Orbital Geometry

Earth's heliocentric orbit is parameterized as a 3D conic section with semi-major axis $a$, eccentricity $e$, and true anomaly $\nu(t)$:

1. **Scale Modes**:
   * **True Scale ($e = 0.01671022$)**:
     Semi-major axis $a = 1.0\text{ AU}$, linear eccentricity $c = a \cdot e = 0.01671\text{ AU}$.
     Semi-minor axis $b = a\sqrt{1 - e^2} \approx 0.99986\text{ AU}$.
   * **Exaggerated Scale ($e = 0.25$)**:
     Semi-major axis $a = 1.0\text{ AU}$, linear eccentricity $c = 0.25\text{ AU}$.
     Semi-minor axis $b = a\sqrt{1 - e^2} \approx 0.96825\text{ AU}$.

2. **Keplerian Orbital Equation & Ground-Truth Prograde Kinematics**:
   Given true anomaly $\nu = \lambda_\odot - \varpi$ (where $\varpi = 102.937^\circ$ is longitude of perihelion):
   \[
   r(\nu) = \frac{a(1 - e^2)}{1 + e \cos\nu}
   \]
   In the heliocentric ecliptic frame with Sun at Focus F1 $(-c, 0, 0)$ and Empty Focus F2 at $(+c, 0, 0)$ in exaggerated mode (or Sun at origin in true scale mode):
   \[
   \vec{r}_{\oplus}(t) = \left( -r \cos\lambda_\odot, \, r \sin\lambda_\odot, \, 0 \right)
   \]
   guaranteeing strictly prograde (counter-clockwise) orbital kinematics when viewed from $+Z$ (North Ecliptic Pole).

3. **6 Seasonal Orbital Milestones (Single Source of Truth: `src/utils/cosmicMath/milestones.ts`)**:
   Each milestone node is evaluated at its exact Earth heliocentric longitude $\lambda_\oplus = (\lambda_\odot + 180^\circ) \bmod 360^\circ$:
   * **March Equinox**: $\lambda_\odot = 0^\circ \implies \lambda_\oplus = 180^\circ$, placed at $(-200, 0)$ ($9\text{ o'clock}$, Left).
   * **June Solstice**: $\lambda_\odot = 90^\circ \implies \lambda_\oplus = 270^\circ$, placed at $(0, 200)$ ($6\text{ o'clock}$, Bottom).
   * **Aphelion**: $\lambda_\odot = 102.94^\circ \implies \lambda_\oplus = 282.94^\circ$, placed at $(44.79, 194.92)$ ($\sim 5\text{:}30$).
   * **September Equinox**: $\lambda_\odot = 180^\circ \implies \lambda_\oplus = 0^\circ$, placed at $(200, 0)$ ($3\text{ o'clock}$, Right).
   * **December Solstice**: $\lambda_\odot = 270^\circ \implies \lambda_\oplus = 90^\circ$, placed at $(0, -200)$ ($12\text{ o'clock}$, Top).
   * **Perihelion**: $\lambda_\odot = 282.94^\circ \implies \lambda_\oplus = 102.94^\circ$, placed at $(-44.79, -194.92)$ ($\sim 11\text{:}30$).

### C. Dynamic 3D Inclined Lunar Orbit & Nodal Regression

The lunar orbit is modeled as an inclined ellipse ($i = 5.145^\circ$) with continuous nodal regression $\Omega(t) = 125.044555^\circ - 1934.136261^\circ T$:

1. **Orbital Plane Rotation**:
   For argument of latitude $u = \theta_{\text{moon}} - \Omega$:
   \[
   \vec{r}_{\text{moon, orbital}} = \begin{pmatrix} r_{\text{moon}} \cos u \\ r_{\text{moon}} \sin u \cos i \\ r_{\text{moon}} \sin u \sin i \end{pmatrix}
   \]
   Transforming by nodal longitude $\Omega$:
   \[
   \vec{r}_{\text{moon, ecl}} = \mathbf{R}_z(\Omega) \vec{r}_{\text{moon, orbital}}
   \]
2. **Ecliptic Latitude ($\beta$)**:
   \[
   \sin\beta = \sin i \sin(\lambda_{\text{moon}} - \Omega) \implies \beta = \arcsin(\sin i \sin(\lambda_{\text{moon}} - \Omega))
   \]
3. **4-Quadrant Depth & Node Stroke Encoding**:
   * Quadrant 1 ($0^\circ \to 90^\circ$, Waxing Ascending): Solid Sky Blue (`#38bdf8`, $\beta \ge 0$).
   * Quadrant 2 ($90^\circ \to 180^\circ$, Waxing Descending): Solid Rose (`#f43f5e`, $\beta < 0$).
   * Quadrant 3 ($180^\circ \to 270^\circ$, Waning Descending): Dashed Rose (`#f43f5e`, $\beta < 0$).
   * Quadrant 4 ($270^\circ \to 360^\circ$, Waning Ascending): Dashed Sky Blue (`#38bdf8`, $\beta \ge 0$).

### D. Analytical 3D Syzygy Shadow Cones

Given physical radii $R_\odot = 696,340\text{ km}$, $R_\oplus = 6,378.137\text{ km}$, $R_{\text{moon}} = 1,737.4\text{ km}$ and Earth-Sun distance $d_{\odot}$:

1. **Umbra Shadow Cone (Total/Annular Shadow)**:
   * Apex Distance from Earth center (with $\epsilon = 10^{-6}$ non-zero denominator floor):
     \[
     L_{\text{umbra}} = \frac{R_\oplus \cdot d_\odot}{\max(10^{-6}, R_\odot - R_\oplus)} \approx 1,384,000\text{ km} \approx 217 R_\oplus
     \]
   * Half-angle of Umbra cone (clamped to $[0, 1]$):
     \[
     \alpha_{\text{umbra}} = \arcsin\left(\text{clamp}\left(\frac{R_\odot - R_\oplus}{\max(10^{-6}, d_\odot)}, 0, 1\right)\right) \approx 0.264^\circ
     \]
   * Umbra Radius at Lunar Distance ($d_{\text{moon}} \approx 384,400\text{ km}$):
     \[
     r_{\text{umbra}}(d_{\text{moon}}) = \max\left(0, 1.02 R_\oplus \left(1 - \frac{d_{\text{moon}}}{\max(10^{-6}, L_{\text{umbra}})}\right)\right) \approx 4,600\text{ km}
     \]

2. **Penumbra Shadow Cone (Partial Shadow)**:
   * Apex Distance (between Sun and Earth, with $\epsilon = 10^{-6}$ denominator floor):
     \[
     L_{\text{penumbra}} = \frac{R_\oplus \cdot d_\odot}{\max(10^{-6}, R_\odot + R_\oplus)} \approx 1,358,000\text{ km}
     \]
   * Half-angle of Penumbra cone (clamped to $[0, 1]$):
     \[
     \alpha_{\text{penumbra}} = \arcsin\left(\text{clamp}\left(\frac{R_\odot + R_\oplus}{\max(10^{-6}, d_\odot)}, 0, 1\right)\right) \approx 0.269^\circ
     \]
   * Penumbra Radius at Lunar Distance:
     \[
     r_{\text{penumbra}}(d_{\text{moon}}) = 1.02 R_\oplus \left(1 + \frac{d_{\text{moon}}}{\max(10^{-6}, L_{\text{penumbra}})}\right) \approx 8,180\text{ km}
     \]

### E. Canonical Camera Projection Pipelines

Each camera projection transforms 3D scene objects into 2D SVG screen coordinates $(x_s, y_s)$:

1. **`projectHeliocentricTopDown` (Macro Orbit View)**:
   * View direction: Along $-Z_{\text{ecl}}$ (looking from North Ecliptic Pole down onto $XY$ plane).
   * Projection (where $+Y_{\text{screen}}$ downward mapping ensures prograde counter-clockwise orbital motion; Keplerian $b/a$ eccentricity scaling is handled directly in scene generation):
     \[
     x_s = x_{\text{center}} + x_{\text{ecl}} \cdot \text{scale}, \quad y_s = y_{\text{center}} + y_{\text{ecl}} \cdot \text{scale}
     \]
2. **`projectGeocentricTransverse` (Eclipse Left Pane — Side Profile)**:
   * View direction: Perpendicular to Sun-Earth syzygy axis (along $-Y_{\text{syzygy}}$).
   * Canonical Canvas & Radii: Canvas viewport $520 \times 220$ (`viewBox="0 0 520 220"`), Earth center $(X_\oplus, Y_\oplus) = (310, 110)$, Earth radius $R_\oplus = 18\text{px}$, Sun light source at $(X_\odot, Y_\odot) = (50, 110)$ with radius $R_\odot = 28\text{px}$ (corona wash to $44\text{px}$), Moon radius $R_{\text{moon}} = 7.5\text{px}$, transverse orbital semi-major axis $R_x = 85\text{px}$, latitudinal elevation scale $\text{scale}_y = 8.5\text{px/deg}$.
   * Normalized Synodic Phase Cycle: Let $\text{phaseRad} = \text{phaseValue} \cdot 2\pi \in [0, 2\pi)$, where $\text{phaseValue} \in [0, 1)$ ($0 = \text{New Moon}$, $0.25 = \text{First Quarter}$, $0.5 = \text{Full Moon}$, $0.75 = \text{Third Quarter}$).
   * Projection:
     \[
     x_s = X_\oplus - \cos(\text{phaseRad}) \cdot R_x, \quad y_s = Y_\oplus - \beta \cdot \text{scale}_y, \quad \text{depth} = \sin(\text{phaseRad}) \cdot R_x
     \]
3. **`projectGeocentricAxial` (Eclipse Right Pane — Sightline View)**:
   * View direction: Along Sun-Earth axis through Earth (looking toward Moon along $-\mathbf{e}_X$).
   * Canonical Canvas & Radii: Default viewport $520 \times 220$ (`viewBox="0 0 520 220"`), center $(X_c, Y_c) = (260, 110)$, background Sun radius $R_\odot = 46\text{px}$ ($\text{depth} = -1000$), foreground Earth radius $R_\oplus = 24\text{px}$ ($\text{depth} = 0$), Moon radius $R_{\text{moon}} = 10.5\text{px}$ (dynamic ephemeris scaling $8.5 \dots 12.5\text{px}$), transverse orbital semi-major axis $R_x = 150\text{px}$, latitudinal elevation scale $\text{scale}_y = 10.5\text{px/deg}$.
   * Normalized Synodic Phase Cycle: Let $\text{phaseRad} = \text{phaseValue} \cdot 2\pi \in [0, 2\pi)$, where $\text{phaseValue} \in [0, 1)$ ($0 = \text{New Moon}$, $0.25 = \text{First Quarter}$, $0.5 = \text{Full Moon}$, $0.75 = \text{Third Quarter}$).
   * Projection (Prograde West-to-East screen transit):
     \[
     x_s = X_c - \sin(\text{phaseRad}) \cdot R_x, \quad y_s = Y_c - \beta \cdot \text{scale}_y, \quad \text{depth} = -\cos(\text{phaseRad}) \cdot R_x
     \]
     where $\text{depth} > 0$ denotes viewer-side near hemisphere (Full Moon at $\text{depth} = +R_x$, in front of Earth towards camera/shadows) and $\text{depth} \le 0$ denotes far side (New Moon at $\text{depth} = -R_x$, behind Earth towards background Sun).
4. **`projectEulerCamera` (Armillary 3D Apparent View)**:
   * View transformation: $\vec{P}_{\text{cam}} = \mathbf{R}_{\text{cam}}(\text{Pitch}, \text{Yaw}, \text{Roll}) \vec{P}_{3D}$.
   * Orthographic projection with SVG invert-$Y$:
     \[
     x_s = x_{\text{center}} + P_{\text{cam}, x} \cdot \text{scale}, \quad y_s = y_{\text{center}} - P_{\text{cam}, y} \cdot \text{scale}
     \]
   * Depth sorting criterion: $P_{\text{cam}, z} \ge 0 \implies \text{Front (solid stroke)}$, $P_{\text{cam}, z} < 0 \implies \text{Back (dashed stroke)}$.

### F. Earth Inertial 3D Axial Tilt & Analytical Spherical Limb Clipping (`globe.ts`)

Pure spherical limb intersection and continent landmass projection math is codified in [`src/utils/cosmicMath/globe.ts`](../src/utils/cosmicMath/globe.ts).

1. **Inertial Axial Tilt Vector**:
   In J2000 ecliptic coordinates, Earth's North Pole unit vector $\vec{N}_{\text{ecl}}$ is tilted by obliquity $\varepsilon = 23.439281^\circ$ toward $\lambda = 90^\circ$ (June Solstice):
   \[
   \vec{N}_{\text{ecl}} = (0, \sin\varepsilon, \cos\varepsilon) \approx (0, 0.397777, 0.917482)
   \]
   Under Euler camera rotation $\mathbf{R}_{\text{cam}}$:
   \[
   \vec{N}_{\text{cam}} = \mathbf{R}_{\text{cam}} \vec{N}_{\text{ecl}}
   \]
2. **Subsolar Illumination Vector**:
   Given solar declination $\delta_\odot$ and right ascension $\alpha_\odot$:
   \[
   \vec{S}_{\text{eq}} = \begin{pmatrix} \cos\delta_\odot \cos\alpha_\odot \\ \cos\delta_\odot \sin\alpha_\odot \\ \sin\delta_\odot \end{pmatrix}, \quad
   \vec{S}_{\text{cam}} = \mathbf{R}_{\text{cam}} \vec{S}_{\text{eq}}
   \]
3. **Analytical Spherical Limb Clipping Algorithm (`generateAnalyticalLimbPath`)**:
   For twilight angle threshold $h_0 \in \{0^\circ, -6^\circ, -12^\circ, -18^\circ\}$ and camera subsolar vector $(s_x, s_y, s_z)$ with transverse magnitude $s_\perp = \sqrt{s_x^2 + s_y^2}$:
   * **Camera Plane Orthonormal Basis**:
     \[
     \hat{u} = \left(-\frac{s_y}{s_\perp}, \; \frac{s_x}{s_\perp}\right), \quad \hat{v} = \left(-\frac{s_x s_z}{s_\perp}, \; -\frac{s_y s_z}{s_\perp}\right)
     \]
   * **Terminator Tangent Parameter**:
     \[
     \mu = \frac{-\sin h_0 \cdot s_z}{\cos h_0 \cdot s_\perp}
     \]
   * **Piecewise Boundary Regimes**:
     * If $\mu \ge 1$: Full night (or full day if $s_z \ge \sin h_0$). Path evaluates to empty or full circle.
     * If $\mu \le -1$: Complete closed circular terminator ellipse entirely on front face ($z > 0$).
     * If $|\mu| < 1$: Terminator circle intersects the planetary limb ($x^2 + y^2 = R^2$) at two real roots:
       \[
       \phi_0 = \arcsin\mu \in [-\pi/2, \pi/2], \quad \phi_1 = \phi_0, \quad \phi_2 = \pi - \phi_0
       \]
       Generating smooth, continuous arc paths joined without triangular backside tearing or boundary gaps along the planetary limb rim.

### G. 3D Rotational Vector Continent Projection & Limb Clipping (`projectContinentLandmasses`)

Given geographic coordinates $(\lambda_{\text{geo}}, \phi_{\text{geo}})$ and local solar hour angle $h = 15^\circ(t_{\text{tod}} - 12) + \lambda_{\text{geo}}$:
1. **Equatorial Body Frame**:
   \[
   \vec{P}_{\text{eq}} = \begin{pmatrix} \cos\phi_{\text{geo}} \cos h \\ \cos\phi_{\text{geo}} \sin h \\ \sin\phi_{\text{geo}} \end{pmatrix}
   \]
2. **Camera / Ecliptic Transformation**:
   * **`euler3d`**: $\vec{P}_{\text{cam}} = \mathbf{R}_{\text{cam}}(\text{Pitch}, \text{Yaw}, \text{Roll}) \vec{P}_{\text{eq}}$.
   * **`topdown`**: $\vec{P}_{\text{ecl}} = (x_b, y_b \cos\varepsilon - z_b \sin\varepsilon, y_b \sin\varepsilon + z_b \cos\varepsilon)$ where $(x_b, y_b, z_b) = (\cos\phi \sin h, \cos\phi \cos h, \sin\phi)$.
   * **`transverse`**: Transformed along syzygy frame matching `calculateEarthSideGeometry`, with solar hemisphere on screen left and night hemisphere on screen right.
   * **`axial`**: Anti-solar perspective looking at the background Sun through Earth matching `calculateEarthAxialGeometry`:
     \[
     x_{\text{body}} = -\cos\phi_{\text{geo}} \sin h, \quad y_{\text{body}} = \sin\phi_{\text{geo}}, \quad z_{\text{body}} = -\cos\phi_{\text{geo}} \cos h
     \]
     Projected via Earth's projected rotation axis $\vec{N} = (-\sin\varepsilon\cos\lambda_\odot, \cos\varepsilon, -\sin\varepsilon\sin\lambda_\odot)$ onto screen orthonormal basis $(\vec{U}, \vec{N}, \vec{W})$:
     \[
     x_{\text{proj}} = x_{\text{body}} u_x + y_{\text{body}} n_x - z_{\text{body}} v_x
     \]
     \[
     y_{\text{proj}} = x_{\text{body}} u_y + y_{\text{body}} n_y - z_{\text{body}} v_y
     \]
     \[
     z_{\text{proj}} = y_{\text{body}} n_z + z_{\text{body}} \|\vec{n}_{\text{screen}}\|
     \]
     Where $z_{\text{proj}} \ge 0$ defines the visible perpetual night hemisphere, and un-mirrored continents rotate prograde from West to East (screen left to right). Observer daylight status conforms to the exact solar elevation equation:
     \[
     \sin\phi_{\text{geo}} \sin\delta_\odot + \cos\phi_{\text{geo}} \cos\delta_\odot \cos h \ge 0
     \]
3. **Front-Hemisphere Edge Clipping ($z \ge 0$)**:
   For each polygon edge $\vec{v}_1 \to \vec{v}_2$ crossing $z = 0$, the zero-crossing parameter $t_0 = \frac{-v_{1, z}}{v_{2, z} - v_{1, z}} \in [0, 1]$ yields horizon intersection point $\vec{v}_{\text{cross}} = (1 - t_0)\vec{v}_1 + t_0 \vec{v}_2$. Normalizing $\hat{v} = \vec{v}_{\text{cross}} / \|\vec{v}_{\text{cross}}\|$ guarantees exact limb boundary alignment $(R \hat{v}_x, -R \hat{v}_y)$ with zero polygon chord-cutting.

### H. Parametric Celestial Ring Blooming Across Continuum

During transition from Copernican heliocentric orbit to geocentric/plate frames ($t_{\text{geo}} = 1 - t_{\text{helio}} \in [0, 1]$):
1. **Ring Center Trajectory**:
   \[
   \vec{C}_{\text{bloom}}(t_{\text{geo}}) = (1 - t_{\text{geo}}) \cdot \vec{P}_{\text{earth}}(t) + t_{\text{geo}} \cdot (0, 0, 0)
   \]
2. **Ring Radius Expansion**:
   \[
   R_{\text{bloom}}(t_{\text{geo}}) = (1 - t_{\text{geo}}) \cdot r_{\text{globe}} + t_{\text{geo}} \cdot R_0 \quad (r_{\text{globe}} \approx 14\text{px}, R_0 = 100\text{px})
   \]
3. **Ring Opacity Blending**:
   \[
   \text{Opacity}(t_{\text{geo}}) = (1 - t_{\text{geo}}) \cdot 0.0 + t_{\text{geo}} \cdot \text{baseOpacity}
   \]
   expanding celestial parallels (Equator, Tropics, Horizon, Colure) and Rete stars smoothly from the Earth MiniGlobe into full celestial scale.

---

## 11. Centralized Physical Astronomical Constants & Temporal Purity (`astroConstants.ts`)

All computational pipelines throughout Cosmic Engine V2.0 derive their physical constants and standard epochs directly from [`src/utils/cosmicMath/astroConstants.ts`](../src/utils/cosmicMath/astroConstants.ts).

### A. Canonical Constants Table (IAU / WGS-84 / Meeus)

| Symbol | Identifier | Canonical Value | Units | Provenance / Standard |
| :--- | :--- | :--- | :--- | :--- |
| $\text{JD}_{\text{J2000}}$ | `J2000_JD` | $2451545.0$ | $\text{days}$ | Standard J2000.0 Epoch (2000 Jan 1.5 TT) |
| $T_{\text{century}}$ | `JULIAN_CENTURY_DAYS` | $36525.0$ | $\text{days}$ | Ephemeris days per Julian Century |
| $Y_{\text{mean}}$ | `DAYS_IN_YEAR_MEAN` | $365.25$ | $\text{days}$ | Mean calendar days per Julian Year |
| $M_{\text{synodic}}$ | `DAYS_IN_SYNODIC_MONTH` | $29.530589$ | $\text{days}$ | Mean synodic month period |
| $1\text{ AU}$ | `ASTRONOMICAL_UNIT_KM` | $149,597,870.7$ | $\text{km}$ | IAU 2012 Definition |
| $R_{\oplus, \text{mean}}$ | `EARTH_RADIUS_MEAN_KM` | $6371.0$ | $\text{km}$ | IUGG Volumetric Mean Earth Radius |
| $R_\oplus$ | `EARTH_RADIUS_WGS84_KM` | $6378.137$ | $\text{km}$ | WGS-84 Reference Ellipsoid Equatorial Radius |
| $d_{\text{moon, mean}}$ | `MOON_MEAN_DISTANCE_KM` | $384400.0$ | $\text{km}$ | Mean Geocentric Lunar Distance |
| $R_{\text{moon}}$ | `MOON_RADIUS_MEAN_KM` | $1737.4$ | $\text{km}$ | IAU Volumetric Mean Lunar Radius |
| $D_{\text{moon}}$ | `MOON_DIAMETER_KM` | $3474.0$ | $\text{km}$ | Mean Lunar Diameter ($2 \cdot R_{\text{moon}}$) |
| $v_{\oplus, \text{mean}}$ | `EARTH_ORBITAL_SPEED_MEAN_KMS` | $29.7847$ | $\text{km/s}$ | Mean Earth Orbital Speed at 1 AU |
| $S_0$ | `SOLAR_IRRADIANCE_1AU_WM2` | $1361.0$ | $\text{W/m}^2$ | Solar Constant (Total Solar Irradiance at 1 AU) |
| $\theta_\odot$ | `SUN_ANGULAR_DIAMETER_1AU_ARCMIN` | $31.986$ | $\text{arcmin}$ | Sun Apparent Angular Diameter at 1 AU |
| $\varepsilon_0$ | `EARTH_AXIAL_OBLIQUITY_J2000_DEG` | $23.439281^\circ$ | $\text{Degrees}$ | IAU Mean Obliquity of Ecliptic at J2000.0 |
| $i_{\text{moon}}$ | `MOON_ORBIT_INCLINATION_DEG` | $5.145^\circ$ | $\text{Degrees}$ | Mean Lunar Orbit Inclination to Ecliptic |
| $d_{\text{perigee}}$ | `LUNAR_PERIGEE_THRESHOLD_KM` | $365,000$ | $\text{km}$ | Lunar Perigee Distance Threshold |
| $d_{\text{apogee}}$ | `LUNAR_APOGEE_THRESHOLD_KM` | $400,000$ | $\text{km}$ | Lunar Apogee Distance Threshold |
| $e_{\text{true}}$ | `EARTH_ECCENTRICITY_TRUE` | $0.01671022$ | dimensionless | Physical Earth Orbital Eccentricity |
| $e_{\text{exagg}}$ | `EARTH_ECCENTRICITY_EXAGGERATED` | $0.25$ | dimensionless | Exaggerated Eccentricity for Visual Analysis |
| $\varpi_0$ | `EARTH_PERIHELION_LONGITUDE_DEG` | $102.937^\circ$ | $\text{Degrees}$ | Earth Longitude of Perihelion at Epoch J2000.0 |
| $T_{\text{draconic}}$ | `MOON_DRACONIC_PERIOD_DAYS` | $27.212220817$ | $\text{days}$ | Mean Nodal / Draconic Month Period |
| $h_{\text{twilight}}$ | `SOLAR_TWILIGHT_THRESHOLDS` | `{-6.0°, -12.0°, -18.0°}` | $\text{Degrees}$ | Civil, Nautical, and Astronomical Twilight Depression Thresholds |

### B. Temporal Epoch Purity & Determinism Invariant

To guarantee absolute mathematical reproducibility, eliminate runtime timezone leakage, and ensure test determinism across environments:
1. **No Implicit `new Date()` Invocations**: Pure mathematical algorithms in `src/utils/cosmicMath/` and scene generators in `src/utils/cosmicMath/scene/` must never call unparameterized `new Date()` internally.
2. **Explicit Temporal Injection**: Temporal epochs must be passed as branded `JulianDate` (or explicit `Date` objects) defaulting canonically to `J2000_JD` (`2451545.0`).
3. **Pure Bridge Utilities**: Date conversions must flow through the verified pure functional helpers in `src/utils/cosmicMath/core.ts`:
   * `dateToJulianDate(d: Date): JulianDate`
   * `julianDateToDate(jd: JulianDate): Date`
   * `createUTCDate(year, month, day, hours?, minutes?, seconds?, ms?): Date`

---

## 12. Sky Dome Projection & Diurnal Transit Kinematics (`todaySky.ts`)

The **Today's Sky Horizon Dome** subsystem projects topocentric celestial coordinates (hour angle $H$, declination $\delta$, and observer latitude $\phi$) into symmetrical 2D SVG canvas viewports (`viewBox="0 0 260 138"`), modeling diurnal paths, atmospheric twilight boundaries, and draconic nodal crossings.

> [!NOTE]
> Following the modular decoupling in ADR 0018, the computational engines of this subsystem are factored into three focused domain modules under [`src/utils/cosmicMath/today/`](../src/utils/cosmicMath/today/):
> - **[`elevation.ts`](../src/utils/cosmicMath/today/elevation.ts)**: Subsections A, B, C, D, I (Orthographic dome projections, diurnal arcs, twilight classification, horizon rise/set azimuths).
> - **[`meridian.ts`](../src/utils/cosmicMath/today/meridian.ts)**: Subsections H, J (S-Z-N celestial meridian colure kinematics, Solstice/Standstill corridor swaths, radial ticks, diurnal chords, Approach C parked gate anchors).
> - **[`draconic.ts`](../src/utils/cosmicMath/today/draconic.ts)**: Subsections E, F, G (True ecliptic nodal crossings, 18.6-year standstill bounds, monthly 30-day declination envelopes, draconic micro-rail).
> The root [`src/utils/cosmicMath/todaySky.ts`](../src/utils/cosmicMath/todaySky.ts) functions as a pure, lightweight facade re-exporting all submodules without breaking changes.

### A. Orthographic Prime Vertical Projection (`projectSkyDomePoint`)

Given observer latitude $\phi$, celestial body declination $\delta$, and local hour angle $H$:

1. **Elevation Angle ($h$)**:
   \[
   \sin h = \sin\phi \sin\delta + \cos\phi \cos\delta \cos H
   \]
   \[
   h = \arcsin(\operatorname{clamp}(\sin h, -1.0, 1.0)) \quad [^\circ]
   \]

2. **2D Canvas Mapping**:
   With canonical dome geometry $CX = 130$, $CY = 104$, and radius $R = 92$:
   \[
   X = CX + R \cos\delta \sin H
   \]
   \[
   Y = CY - R \sin h
   \]
   This orthographic formulation guarantees exact mathematical coincidence between instantaneous celestial body beads and continuous diurnal transit arcs.

### B. Diurnal Transit Path Generation (`generateDiurnalPath`)

1. **Meridian Culmination Peak ($H = 0$)**:
   \[
   \sin h_{\text{peak}} = \sin\phi \sin\delta + \cos\phi \cos\delta = \cos(\phi - \delta)
   \]
   \[
   X_{\text{peak}} = CX, \quad Y_{\text{peak}} = CY - R \sin h_{\text{peak}}
   \]

2. **Semi-Diurnal Hour Angle & Horizon Contact ($h = 0^\circ$)**:
   \[
   \cos H_0 = -\tan\phi \tan\delta
   \]

3. **Boundary & Polar Regime Classification**:
   * **Polar Night** ($\tan\phi \tan\delta \le -1$):
     The celestial body never rises above the horizon ($h_{\text{peak}} < 0^\circ$).
     `isPolarNight = true`, `isCircumpolar = false`, `pathD = ""`, `risePoint = null`, `setPoint = null`.
   * **Midnight Sun / Circumpolar Motion** ($\tan\phi \tan\delta \ge 1$):
     The celestial body never sets below the horizon.
     `isCircumpolar = true`, `isPolarNight = false`, generating an uninterrupted visible arc across $H \in [-90^\circ, +90^\circ]$.
   * **Standard Rise / Set** ($-1 < \tan\phi \tan\delta < 1$):
     Body rises at $-H_0$ and sets at $+H_0$:
     \[
     H_0 = \arccos(-\tan\phi \tan\delta) \quad [^\circ]
     \]
     Path is parameterized over $N$ discrete steps ($N = 48$). Endpoints are strictly clamped to the horizon line ($Y = CY$) to eliminate floating-point rounding artifacts.

### C. Astronomical Twilight Band Geometry

For a solar depression threshold angle $\theta \in \{-6^\circ, -12^\circ, -18^\circ\}$:
\[
\sin\theta = \sin\phi \sin\delta + \cos\phi \cos\delta \cos H_\theta
\]
\[
\cos H_\theta = \frac{\sin\theta - \sin\phi \sin\delta}{\cos\phi \cos\delta}
\]
* If $\cos H_\theta \le -1$: The Sun never dips below depression $\theta$ (continuous twilight / white nights).
* If $\cos H_\theta \ge 1$: The Sun never reaches depression $\theta$ (polar winter darkness).
* Otherwise: $H_\theta = \arccos(\operatorname{clamp}(\cos H_\theta, -1, 1))$, generating twilight path arcs spanning $[-H_{18}, -H_0]$ (morning) and $[+H_0, +H_{18}]$ (evening).

### D. Instantaneous Sky Dome Lunar Nodes (`calculateSkyDomeLunarNodes`)

The Moon's orbital nodes lie on the ecliptic plane ($\beta = 0^\circ$). Given Ascending Node longitude $\Omega$ and Descending Node longitude $\mho = (\Omega + 180^\circ) \bmod 360^\circ$:

1. **Equatorial Coordinates of Node**:
   \[
   \sin\delta_{\text{node}} = \sin\varepsilon \sin\lambda_{\text{node}} \implies \delta_{\text{node}} = \arcsin(\sin\varepsilon \sin\lambda_{\text{node}})
   \]
   \[
   \alpha_{\text{node}} = \operatorname{atan2}(\cos\varepsilon \sin\lambda_{\text{node}}, \cos\lambda_{\text{node}})
   \]

2. **Local Sidereal Time ($\theta_{\text{LST}}$) & Nodal Hour Angle**:
   Derived from active display time $t_{\text{disp}}$, solar noon $t_{\text{noon}}$, and solar right ascension $\alpha_\odot$:
   \[
   \theta_{\text{LST}} = (t_{\text{disp}} - t_{\text{noon}}) \cdot 15^\circ + \alpha_\odot
   \]
   \[
   H_{\text{node}} = ((\theta_{\text{LST}} - \alpha_{\text{node}}) \bmod 360^\circ + 360^\circ) \bmod 360^\circ
   \]
   Node coordinates are then projected into 2D dome canvas space via `projectSkyDomePoint(H_node, delta_node, phi)`.

### E. Draconic Nodal Cycle & Bilateral Proximity Solver

1. **Draconic Constants & Argument of Latitude**:
   * Draconic Month: $T_{\text{draconic}} = 27.21222\text{ days}$.
   * Argument of Latitude: $F = (\lambda_{\text{moon}} - \Omega) \bmod 360^\circ \in [0^\circ, 360^\circ)$.

2. **Prograde Upcoming & Previous Node Distances**:
   \[
   \Delta F_{\text{next}} = \begin{cases} 180^\circ - F & \text{if } F < 180^\circ \ (\text{upcoming is Descending } \mho) \\ 360^\circ - F & \text{if } F \ge 180^\circ \ (\text{upcoming is Ascending } \Omega) \end{cases}
   \]
   \[
   \Delta F_{\text{prev}} = \begin{cases} F & \text{if } F < 180^\circ \ (\text{previous was Ascending } \Omega) \\ F - 180^\circ & \text{if } F \ge 180^\circ \ (\text{previous was Descending } \mho) \end{cases}
   \]
   \[
   t_{\text{next}} = \frac{\Delta F_{\text{next}}}{360^\circ} \cdot T_{\text{draconic}}, \quad t_{\text{prev}} = \frac{\Delta F_{\text{prev}}}{360^\circ} \cdot T_{\text{draconic}} \quad [\text{days}]
   \]

3. **Bilateral Nearest Node Distance & 24-Hour Crossing Gate**:
   \[
   d_{\text{nearest}} = \min(t_{\text{next}}, t_{\text{prev}})
   \]
   \[
   \text{nearestNodeType} = \begin{cases} \text{upcomingNodeType} & \text{if } t_{\text{next}} \le t_{\text{prev}} \\ \text{prevNodeType} & \text{if } t_{\text{prev}} < t_{\text{next}} \end{cases}
   \]
   \[
   \text{isNearNode} = (d_{\text{nearest}} \le 1.0\text{ days}) \lor (|\beta_{\text{moon}}| \le 0.8^\circ)
   \]
   **Physical Invariant**: Sky dome node pins are rendered if and only if $\text{nearestNodeDistDays} \le 1.0$. This prevents distant upcoming nodes ($t_{\text{next}} \approx 13\text{d}$) from rendering immediately following a completed crossing.

### F. Centered $\pm 15$-Day Draconic Progress Micro-Rail

1. **Linear Coordinate Transform**:
   For temporal offset $t \in [-15, +15]\text{ days}$ mapped onto track domain $X \in [12, 228]$ ($W = 216\text{px}$), centered at $X = 120$ for Today ($t = 0$):
   \[
   X(t) = 120 + t \cdot \frac{108}{15} = 120 + t \cdot 7.2
   \]

2. **Continuous Color-Coded Segments**:
   The $[-15, +15]$ timeline is subdivided at all node events $\{t_k\}$. For each sub-interval with midpoint $t_{\text{mid}}$:
   \[
   F(t_{\text{mid}}) = \left( \left( F_0 + \frac{t_{\text{mid}}}{T_{\text{draconic}}} \cdot 360^\circ \right) \bmod 360^\circ + 360^\circ \right) \bmod 360^\circ
   \]
   The segment is styled **Sky Blue (`#38bdf8`)** if $F(t_{\text{mid}}) < 180^\circ$ (Moon North of Ecliptic, $\beta \ge 0$), and **Rose Red (`#f43f5e`)** if $F(t_{\text{mid}}) \ge 180^\circ$ (Moon South of Ecliptic, $\beta < 0$).

### G. Monthly Lunar Declination Bounds (`calculateMonthlyLunarDeclinationBounds`)

To provide empirical monthly transit bounds for the Moon dome:
\[
\delta_{\text{min}} = \min_{t \in [-15, +15]} \delta_{\text{moon}}(t_0 + t), \quad \delta_{\text{max}} = \max_{t \in [-15, +15]} \delta_{\text{moon}}(t_0 + t)
\]
Because the Moon's tropical month cycle is $27.32158\text{ days} < 30\text{ days}$, a symmetric 30-day window centered on $t_0$ is mathematically guaranteed to capture both the northernmost peak and southernmost trough of the active lunar declination cycle.

### H. Dynamic Culmination Bearing & Observer Sighting Perspective (`calculateCulminationBearing`)

At meridian culmination ($H = 0$), a celestial body crosses the observer's celestial meridian. The bearing of this transit relative to the observer's zenith is governed strictly by the signed difference angle:
\[
\Delta = \delta - \phi
\]
where $\delta$ is the celestial body's declination and $\phi$ is the topocentric observer's latitude.

1. **Peak Altitude Formulation**:
   \[
   h_{\text{peak}} = \operatorname{clamp}(90^\circ - |\delta - \phi|, -90^\circ, +90^\circ)
   \]

2. **Tri-State Meridian Bearing & Sighting Perspective**:
   * **Zenith Overhead Transit ($|\Delta| < 0.25^\circ$)**:
     - The celestial body transits through the observer's local zenith ($h_{\text{peak}} = 90.0^\circ$).
     - Meridian tag: `Z`, Peak Suffix: `ZENITH`.
     - Observer perspective cue: `"Overhead Zenith Transit"`.
     - Represents subsolar ("Lahaina Noon") and sublunar zenith alignments.
   * **South Culmination ($\Delta < 0$, i.e. $\delta < \phi$)**:
     - The celestial body peaks in the **Southern sky** ($\text{Az} = 180^\circ$).
     - Meridian tag: `S`, Peak Suffix: `S`.
     - Observer perspective cue: `"Looking South · S-Sky Arc"`.
     - Vertical gnomon shadows point due North.
   * **North Culmination ($\Delta > 0$, i.e. $\delta > \phi$)**:
     - The celestial body peaks in the **Northern sky** ($\text{Az} = 0^\circ$).
     - Meridian tag: `N`, Peak Suffix: `N`.
     - Observer perspective cue: `"Looking North · N-Sky Arc"`.
     - Vertical gnomon shadows point due South.
   * **Polar Directional Singularity ($|\phi| \ge 89.9^\circ$)**:
     At the terrestrial poles, standard compass bearings collapse because all meridians converge at the rotational axis:
     - **North Pole ($\phi \ge +89.9^\circ$)**: All horizontal directions point due South. Direction: `'South'`, Meridian tag: `'S'`, Peak altitude: $h_{\text{peak}} = \delta$, Sighting summary: `'North Pole Singularity · All Horizons South'` (`'Polar Horizon · All Directions South'`).
     - **South Pole ($\phi \le -89.9^\circ$)**: All horizontal directions point due North. Direction: `'North'`, Meridian tag: `'N'`, Peak altitude: $h_{\text{peak}} = -\delta$, Sighting summary: `'South Pole Singularity · All Horizons North'` (`'Polar Horizon · All Directions North'`).

3. **Tropical & Standstill Culmination Inversion Boundaries**:
   * **Solar Tropics ($-23.44^\circ \le \phi \le +23.44^\circ$)**:
     As the Sun oscillates across $\delta_\odot \in [-\varepsilon, +\varepsilon]$, $\Delta$ changes sign twice annually, causing the Sun's midday culmination to actively alternate between the Northern and Southern sky.
   * **Lunar Super-Tropics ($-28.58^\circ \le \phi \le +28.58^\circ$)**:
     During major lunar standstills, the Moon's declination spans $\delta_{\text{moon}} \in [-(\varepsilon + i), +(\varepsilon + i)] \approx [-28.58^\circ, +28.58^\circ]$. Observers up to $\pm 28.58^\circ$ latitude experience the Moon alternating between Northern and Southern culminations within every 27.3-day tropical month cycle.

### I. Horizon Rise & Set Azimuths & 16-Point Compass Octants (`calculateRiseSetAzimuth`)

For a body with declination $\delta$ and observer latitude $\phi$, the true horizon contact azimuths ($\text{Az}$ measured clockwise from North $= 0^\circ$) are given by spherical trigonometry:

1. **Polar Regime Filtering**:
   * If $\tan\phi \tan\delta \le -1$: **Polar Night** (body never rises above horizon). Returns `null` azimuths and `"--"` octants.
   * If $\tan\phi \tan\delta \ge 1$: **Midnight Sun / Circumpolar** (body never sets below horizon). Returns `null` azimuths and `"--"` octants.

2. **Analytical Horizon Azimuths**:
   \[
   \cos(\text{Az}_{\text{rise}}) = \frac{\sin\delta}{\cos\phi} \implies \text{Az}_{\text{rise}} = \arccos\left(\operatorname{clamp}\left(\frac{\sin\delta}{\cos\phi}, -1, 1\right)\right) \in [0^\circ, 180^\circ]
   \]
   \[
   \text{Az}_{\text{set}} = (360^\circ - \text{Az}_{\text{rise}}) \bmod 360^\circ \in [180^\circ, 360^\circ]
   \]
   - For $\delta > 0^\circ$: $\text{Az}_{\text{rise}} \in (0^\circ, 90^\circ)$ (Northeastern quadrant), $\text{Az}_{\text{set}} \in (270^\circ, 360^\circ)$ (Northwestern quadrant).
   - For $\delta < 0^\circ$: $\text{Az}_{\text{rise}} \in (90^\circ, 180^\circ)$ (Southeastern quadrant), $\text{Az}_{\text{set}} \in (180^\circ, 270^\circ)$ (Southwestern quadrant).
   - For $\delta = 0^\circ$: $\text{Az}_{\text{rise}} = 90.0^\circ$ (Due East), $\text{Az}_{\text{set}} = 270.0^\circ$ (Due West).

3. **16-Point Compass Octant Mapping**:
   For normalized azimuth angle $\theta = ((\text{Az} \bmod 360^\circ) + 360^\circ) \bmod 360^\circ$:
   \[
   \text{index} = \left\lfloor \frac{\theta + 11.25^\circ}{22.5^\circ} \right\rfloor \bmod 16
   \]
   mapped to the standard nautical array:
   \[
   [\text{N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW}]
   \]

### J. Celestial Meridian Colure Profile & 3D Diurnal Chord Kinematics (`todaySky.ts`)

The **Celestial Meridian Profile** subsystem (`SunMeridianDome.tsx`, `MoonMeridianDome.tsx`) projects the observer's sky onto the North–South celestial colure ($S \longleftrightarrow Z \longleftrightarrow N$) side-on plane, visualizing annual solstice corridors, lunar standstill swaths, and instantaneous diurnal transits.

#### 1. 3D Topocentric Direction Cosines & Side-On Colure Projection (`calculateMeridianDiurnalPoint`)

Let observer topocentric latitude be $\phi$, body declination be $\delta$, and local hour angle be $H$. In the topocentric horizon frame $(\mathbf{e}_{\text{East}}, \mathbf{e}_{\text{North}}, \mathbf{e}_{\text{Zenith}})$:
\[
\vec{u}_{\text{topo}}(H) = \begin{pmatrix} x_{\text{east}} \\ y_{\text{north}} \\ z_{\text{zenith}} \end{pmatrix} = \begin{pmatrix} \cos\delta \sin H \\ \cos\phi \sin\delta - \sin\phi \cos\delta \cos H \\ \sin\phi \sin\delta + \cos\phi \cos\delta \cos H \end{pmatrix}
\]
The side-on view looking along the East-West axis projects $(y_{\text{north}}, z_{\text{zenith}})$ onto the 2D canvas with canonical dome geometry $CX = 130$, $CY = 104$, and radius $R = 92$:
\[
X = CX + R \cdot y_{\text{north}} = CX + R (\cos\phi \sin\delta - \sin\phi \cos\delta \cos H)
\]
\[
Y = CY - R \cdot z_{\text{zenith}} = CY - R (\sin\phi \sin\delta + \cos\phi \cos\delta \cos H)
\]
where South is oriented screen-left ($X < CX$), Zenith is screen-top ($Y < CY$), and North is screen-right ($X > CX$).

#### 2. Proof of Diurnal Collinearity & Invariant Slope

Differentiating $X(H)$ and $Y(H)$ with respect to hour angle $H$:
\[
\frac{dX}{dH} = R \sin\phi \cos\delta \sin H
\]
\[
\frac{dY}{dH} = -R \cos\phi \cos\delta \sin H
\]
The instantaneous slope in the 2D canvas plane is:
\[
\frac{dY}{dX} = \frac{dY/dH}{dX/dH} = \frac{-R \cos\phi \cos\delta \sin H}{R \sin\phi \cos\delta \sin H} = -\cot\phi
\]
Taking the geometric slope on Cartesian axes (where upward is $+Y$):
\[
\text{Slope} = \cot\phi
\]
**Theorem**: The projection of any celestial body's diurnal trajectory onto the celestial meridian colure is strictly collinear, tracing a straight-line chord whose slope depends exclusively on the observer's latitude $\phi$ and is completely invariant with respect to body declination $\delta$ and hour angle $H$.

#### 3. Proof of Tangential Meridian Arc Contact at Culmination ($H = 0$)

At meridian culmination ($H = 0$), $\cos H = 1$:
\[
y_{\text{north}}(0) = \cos\phi \sin\delta - \sin\phi \cos\delta = \sin(\delta - \phi)
\]
\[
z_{\text{zenith}}(0) = \sin\phi \sin\delta + \cos\phi \cos\delta = \cos(\delta - \phi)
\]
The radial distance squared from the canvas center $(CX, CY)$ is:
\[
d^2(0) = R^2 \left( y_{\text{north}}^2(0) + z_{\text{zenith}}^2(0) \right) = R^2 \left( \sin^2(\delta - \phi) + \cos^2(\delta - \phi) \right) = R^2
\]
\[
d(0) = R = 92\text{px}
\]
**Theorem**: At the culmination moment (Solar Noon or Lunar Transit), the body's diurnal chord touches the circular meridian dome perimeter $R = 92$ with exact tangential contact.

#### 4. Analytical Horizon Contact, Twilight Gate Coordinates & Latitude Boundary Singularities (`calculateMeridianDiurnalChord`)

1. **Horizon Contact ($h = 0^\circ \iff z_{\text{zenith}} = 0$)**:
   \[
   \sin\phi \sin\delta + \cos\phi \cos\delta \cos H_0 = 0 \implies \cos H_0 = -\tan\phi \tan\delta
   \]
   Substituting $\cos H_0$ into $X$:
   \[
   X_{\text{horizon}} = CX + R \left( \cos\phi \sin\delta - \sin\phi \cos\delta (-\tan\phi \tan\delta) \right) = CX + R \frac{\sin\delta}{\cos\phi} = CX + R \sin\delta \sec\phi
   \]
   \[
   Y_{\text{horizon}} = CY = 104
   \]
2. **Sun Astronomical Twilight Gate ($h = -18^\circ \iff z_{\text{zenith}} = \sin(-18^\circ)$)**:
   \[
   \cos H_{18} = \frac{\sin(-18^\circ) - \sin\phi \sin\delta}{\cos\phi \cos\delta}
   \]
   Yielding twilight gate coordinates $(X_{\text{gate}}, Y_{\text{gate}})$ when $\cos H_{18} \in [-1, 1]$.

3. **Latitude Boundary Limits & Non-Singular Elevation Bounds**:
   Instead of testing $\cos\phi$ or computing $\tan\phi$, the diurnal altitude bounds for any observer latitude $\phi$ are evaluated non-singularly via direction cosines:
   \[
   \sin(h_{\min}) = \sin\phi \sin\delta - \cos\phi \cos\delta = -\cos(\phi + \delta)
   \]
   \[
   \sin(h_{\max}) = \sin\phi \sin\delta + \cos\phi \cos\delta = \cos(\phi - \delta)
   \]
   - **Circumpolar Perpetual Sky**: When $\sin(h_{\min}) \ge \sin(h_{\text{gate}})$, the body remains above the observation gate all day ($\cos H_{\text{gate}} \le -1.0$).
   - **Perpetual Sub-Gate Darkness (Polar Night)**: When $\sin(h_{\max}) \le \sin(h_{\text{gate}})$, the body never reaches the observation gate ($\cos H_{\text{gate}} \ge 1.0$).
   
   - **Polar Latitudes ($\phi \to \pm 90^\circ, \cos\phi \to 0$)**:
     At the exact geographic North or South pole, diurnal elevation is invariant with hour angle: $\sin h = \sin\phi \sin\delta = \pm \sin\delta$. The diurnal chord collapses onto a perfectly horizontal line parallel to the horizon baseline:
     \[
     Y_{\text{chord}} = CY \mp R \sin\delta, \quad \text{Slope} = \cot(\pm 90^\circ) = 0
     \]
     For circumpolar bodies, the chord spans across the full dome width $X \in [CX - R, CX + R]$ ($X \in [38, 222]$), eliminating division-by-zero traps and tangent singularities.
   
   - **Equatorial Latitude ($\phi \to 0^\circ, \sin\phi = 0, \cos\phi = 1$)**:
     At the terrestrial equator, $\cot(0^\circ) \to \infty$. The diurnal chord is strictly vertical ($\Delta X = 0$):
     \[
     X_{\text{chord}} = CX + R \sin\delta = 130 + 92 \sin\delta
     \]
     \[
     Y(H) = CY - R \cos\delta \cos H = 104 - 92 \cos\delta \cos H
     \]
     The chord touches the circular meridian arc tangentially at peak culmination ($H = 0$, $Y = 104 - 92\cos\delta$) and descends perpendicularly into the horizon at $(130 + 92\sin\delta, 104)$ at $H = \pm 90^\circ$.

#### 5. Projection Degeneracy & Approach C Parked Ghost Anchors

Because the projection functions $X(H)$ and $Y(H)$ depend on $H$ strictly via $\cos H$, the transformation exhibits mirror symmetry between morning and evening:
\[
X(-H) = X(+H), \quad Y(-H) = Y(+H)
\]
In reality, the body transits through the 3D half-space behind the meridian plane ($x_{\text{east}} < 0$). In the 2D side-on projection, advancing $H$ past sunset ($H > H_0$) or twilight ($H > H_{18}$) causes $\cos H$ to reverse direction as $H \to 180^\circ$ (Nadir), creating an artificial visual rebound back toward the canvas center.

**Approach C Formulation**:
To prevent deep-night reverse sliding while preserving physical continuity:
- **Solar Twilight Gate**: For the Sun, observation terminates at astronomical twilight ($h = -18^\circ$). When $z_{\text{zenith}} \le \sin(-18^\circ)$ (or $|H| \ge H_{18}$), the active Sun bead is parked at the static twilight gate anchor $(X_{\text{gate}}, Y_{\text{gate}})$, rendered with ghosted styling (`#1e293b` fill, dashed stroke, $0.35$ opacity).
- **Lunar Horizon Gate**: Because atmospheric twilight is exclusively a solar phenomenon, the Moon's observational threshold is the physical horizon ($h = 0^\circ$). When $z_{\text{zenith}} \le 0$ (or $|H| \ge H_0$), the active Moon bead is parked at the static horizon gate anchor $(X_{\text{horizon}}, 104)$.
- **Wakeup Continuity**: As the body approaches morning twilight/rise ($-H_{18}$ or $-H_0$), the bead smoothly un-parks and ascends the diurnal chord toward Solar Noon / Lunar Transit.

#### 6. Meridian Arc Angular Parameterization & Sub-Horizon Twilight Extension (`calculateMeridianPoint`)

For any celestial culmination with peak altitude $h \in [-90^\circ, +90^\circ]$ and culmination bearing $B \in \{\text{'S'}, \text{'N'}, \text{'Z'}\}$:
1. **Clamping to Configurable Altitude Floor $h_{\min}$**:
   \[
   h_{\text{clamped}} = \max(h_{\min}, \min(90^\circ, h))
   \]
   where $h_{\min} = 0^\circ$ in Standard mode and $h_{\min} = -18^\circ$ in Twilight mode.

2. **Meridian Circle Angular Parameterization**:
   \[
   \theta_{\text{deg}} = \begin{cases}
   180^\circ - h_{\text{clamped}} & \text{if } B = \text{'S'} \\
   h_{\text{clamped}} & \text{if } B = \text{'N'} \\
   90^\circ & \text{if } B = \text{'Z'}
   \end{cases}
   \]

3. **2D Canvas Coordinates ($CX = 130, CY = 104, R = 92$)**:
   \[
   X = CX + R \cos\theta_{\text{rad}}, \quad Y = CY - R \sin\theta_{\text{rad}}
   \]

4. **Sub-Horizon Twilight Depths ($h < 0^\circ$)**:
   For a Southern sky culmination at negative altitude $h = -|h|$ down to $-18^\circ$:
   \[
   \theta_{\text{deg}} = 180^\circ - (-|h|) = 180^\circ + |h|
   \]
   \[
   X = CX + R \cos(180^\circ + |h|) = CX - R \cos|h|
   \]
   \[
   Y = CY - R \sin(180^\circ + |h|) = CY + R \sin|h|
   \]
   Evaluating $Y(|h|)$ across astronomical twilight boundaries:
   - Horizon ($h = 0^\circ$): $Y = 104.00\text{px}$
   - Civil Twilight boundary ($h = -6.0^\circ$): $Y = 104 + 92 \sin(6^\circ) \approx 113.62\text{px}$
   - Nautical Twilight boundary ($h = -12.0^\circ$): $Y = 104 + 92 \sin(12^\circ) \approx 123.11\text{px}$
   - Astronomical Twilight floor ($h = -18.0^\circ$): $Y = 104 + 92 \sin(18^\circ) \approx 132.43\text{px}$

   Every sub-horizon point maps cleanly within the $Y \le 138\text{px}$ canvas boundary. When $h < -18^\circ$ (deep polar astronomical night), the solstice tick pin is suppressed completely (disappears), and the arc terminates at the $-18^\circ$ floor, preventing off-canvas orphan elements.

#### 7. Annual Solstice Milestone Bifurcation & Directional Solar Migration Vector

Solar declination $\delta$ is governed by axial obliquity $\varepsilon$ and ecliptic longitude $\lambda_\odot$:
\[
\sin\delta = \sin\varepsilon \sin\lambda_\odot
\]
Differentiating with respect to $\lambda_\odot$:
\[
\cos\delta \frac{d\delta}{d\lambda_\odot} = \sin\varepsilon \cos\lambda_\odot \implies \frac{d\delta}{d\lambda_\odot} = \frac{\sin\varepsilon \cos\lambda_\odot}{\cos\delta}
\]
Because $\varepsilon \approx 23.44^\circ > 0$ and $|\delta| \le \varepsilon < 90^\circ$, both $\sin\varepsilon > 0$ and $\cos\delta > 0$. The sign of the solar migration rate is governed solely by the cosine of ecliptic longitude:
\[
\operatorname{sgn}\left(\frac{d\delta}{dt}\right) = \operatorname{sgn}(\cos\lambda_\odot)
\]
1. **Northward Solar Migration ($\cos\lambda_\odot > 0$)**:
   When $\lambda_\odot \in [0^\circ, 90^\circ) \cup (270^\circ, 360^\circ)$, $\frac{d\delta}{dt} > 0$: the Sun is migrating toward the June Solstice ($\delta = +\varepsilon, \lambda_\odot = 90^\circ$).
   - `isApproachingJune = true`
   - June Solstice Arc (`solstice-swath-june`, `#fbbf24`): Full vibrancy (`opacity = 0.85`, `strokeWidth = 1.25px`).
   - December Solstice Arc (`solstice-swath-december`, `#d97706`): Subdued tone (`opacity = 0.40`, `strokeWidth = 0.9px`).
2. **Southward Solar Migration ($\cos\lambda_\odot < 0$)**:
   When $\lambda_\odot \in (90^\circ, 270^\circ)$, $\frac{d\delta}{dt} < 0$: the Sun is migrating toward the December Solstice ($\delta = -\varepsilon, \lambda_\odot = 270^\circ$).
   - `isApproachingJune = false`
   - December Solstice Arc (`solstice-swath-december`, `#d97706`): Full vibrancy (`opacity = 0.85`, `strokeWidth = 1.25px`).
   - June Solstice Arc (`solstice-swath-june`, `#fbbf24`): Subdued tone (`opacity = 0.40`, `strokeWidth = 0.9px`).
3. **Milestone Anchoring**:
   Both arcs are anchored to **Today's Noon Culmination Peak** on the outer circular meridian perimeter ($R = 92$), ensuring a calibrated and static seasonal scale that does not distort with diurnal Sun bead transit.

#### 8. Polar Directional Singularity & Longitudinal Colure Decoupling

At the geographic poles ($|\phi| \to 90^\circ$), the topocentric horizontal frame $(\mathbf{e}_{\text{East}}, \mathbf{e}_{\text{North}}, \mathbf{e}_{\text{Zenith}})$ experiences an azimuthal coordinate singularity (gimbal lock):
\[
\vec{u}_{\text{topo}}(H) = \begin{pmatrix} x_{\text{east}} \\ y_{\text{north}} \\ z_{\text{zenith}} \end{pmatrix} = \begin{pmatrix} \cos\delta \sin H \\ \cos\phi \sin\delta - \sin\phi \cos\delta \cos H \\ \sin\phi \sin\delta + \cos\phi \cos\delta \cos H \end{pmatrix}
\]

1. **Exact Polar Invariance of Diurnal Elevation**:
   Evaluating at the geographic North Pole ($\phi = +90^\circ, \cos\phi = 0, \sin\phi = 1$):
   \[
   x_{\text{east}} = \cos\delta \sin H, \quad y_{\text{north}} = -\cos\delta \cos H, \quad z_{\text{zenith}} = \sin\delta
   \]
   Because $z_{\text{zenith}} = \sin\delta$ is strictly independent of local hour angle $H$, topocentric elevation is constant across the entire 24-hour diurnal cycle:
   \[
   h(H) = \arcsin(z_{\text{zenith}}) = \delta \quad (\forall H \in [0^\circ, 360^\circ))
   \]
   The body neither rises nor falls; its diurnal chord is a perfectly horizontal line at $Y = CY - R\sin\delta$.

2. **Resolution of the Horizontal Directional Singularity**:
   Because lines of terrestrial longitude converge at the pole, every horizontal direction along the surface points toward the Equator:
   - At the **North Pole**, all $360^\circ$ of the horizon is **South**.
   - At the **South Pole**, all $360^\circ$ of the horizon is **North**.
   
   The horizontal coordinate $y_{\text{north}} = -\cos\delta \cos H$ does not represent a Northern sky excursion:
   - At Solar Noon ($H = 0$), $y_{\text{north}} = -\cos\delta < 0$: the body lies along the local noon meridian, facing **South along Longitude $0^\circ$ (Greenwich)**.
   - At Midnight ($H = 180^\circ$), $y_{\text{north}} = +\cos\delta > 0$: the body lies along the antimeridian, facing **South along Longitude $180^\circ$ (International Date Line)**.

   Labeling the right side of the canvas as `"N"` is a Cartesian sign convention artifact. To maintain astronomical ground truth, the polar baseline dynamically reconfigures to explicit longitudinal horizon references:
   - **North Pole ($\phi \ge +89.9^\circ$)**:
     \[
     \mathbf{S \ (0^\circ)} \longleftrightarrow \mathbf{Z \ (+90^\circ)} \longleftrightarrow \mathbf{S \ (180^\circ)}
     \]
   - **South Pole ($\phi \le -89.9^\circ$)**:
     \[
     \mathbf{N \ (0^\circ)} \longleftrightarrow \mathbf{Z \ (-90^\circ)} \longleftrightarrow \mathbf{N \ (180^\circ)}
     \]
   - **Upper Elevation Dome (`SkyDomeBase`)**:
     \[
     \mathbf{90^\circ\text{E}} \longleftrightarrow \mathbf{0^\circ\text{ (Grw)}} \longleftrightarrow \mathbf{90^\circ\text{W}}
     \]

---

## 13. Great Meridian Ring & Heliocentric Camera-Space Illumination Geometry

### A. Great Meridian Ring 3D Parametric Formulation (`MiniGlobe.tsx`)

In the terrestrial body frame, the Prime Meridian ($0^\circ$) and Antimeridian ($180^\circ$) define the canonical longitudinal reference circle lying in the $Y-Z$ plane.

Given UTC decimal time of day $t \in [0, 24)$, the Greenwich hour angle relative to the solar midnight meridian is:
\[
H_0 = (t - 12.0) \times 15.0^\circ
\]

1. **$0^\circ$ Prime Meridian (Greenwich Semicircle)**:
   Sampled continuously across latitude $\phi \in [-90^\circ, +90^\circ]$ from South Pole to North Pole:
   \[
   \vec{P}_{\text{eq}, 0}(\phi) = \begin{pmatrix} x_{\text{eq}} \\ y_{\text{eq}} \\ z_{\text{eq}} \end{pmatrix} = \begin{pmatrix} \cos\phi \sin H_0 \\ \sin\phi \\ \cos\phi \cos H_0 \end{pmatrix}
   \]

2. **$180^\circ$ Antimeridian (International Date Line Semicircle)**:
   Sampled continuously across latitude $\phi \in [+90^\circ, -90^\circ]$ from North Pole to South Pole ($H_{180} = H_0 + 180^\circ$):
   \[
   \vec{P}_{\text{eq}, 180}(\phi) = \begin{pmatrix} x_{\text{eq}} \\ y_{\text{eq}} \\ z_{\text{eq}} \end{pmatrix} = \begin{pmatrix} -\cos\phi \sin H_0 \\ \sin\phi \\ -\cos\phi \cos H_0 \end{pmatrix}
   \]

3. **Camera-Space Projection & Through-Marble Visibility**:
   Transforming via 3D Euler camera rotation matrix $\mathbf{R}_{\text{cam}}(\text{Pitch}, \text{Yaw}, \text{Roll})$:
   \[
   \vec{P}_{\text{cam}}(\phi) = \mathbf{R}_{\text{cam}} \vec{P}_{\text{eq}}(\phi)
   \]
   Projected to 2D SVG canvas user space with radius $R_{\text{globe}}$:
   \[
   X = R_{\text{globe}} \cdot P_{\text{cam}, x}, \quad Y = -R_{\text{globe}} \cdot P_{\text{cam}, y}
   \]
   **Theorem**: Because $\|\vec{P}_{\text{eq}}(\phi)\| = 1$ and $\mathbf{R}_{\text{cam}} \in SO(3)$ is an isometry, $\|\vec{P}_{\text{cam}}(\phi)\| = 1$, which implies:
   \[
   X^2 + Y^2 = R_{\text{globe}}^2 \left( P_{\text{cam}, x}^2 + P_{\text{cam}, y}^2 \right) = R_{\text{globe}}^2 \left( 1 - P_{\text{cam}, z}^2 \right) \le R_{\text{globe}}^2
   \]
   Every point along both semicircles projects strictly inside the planetary disc radius. Omitting horizon-crossing depth clipping ($z_{\text{cam}} \ge 0$) allows both front and back segments to render continuously through the translucent marble sphere, maintaining exact visual parity with the Equator parallel ellipse.

### B. Camera-Space Subsolar Illumination Vectors (`generatorBeads.ts`)

In both 3D Heliocentric Orbit (`'heliocentric'`) and 3D Geocentric Apparent (`'geocentric'`) modes, celestial body positions are transformed to camera space: $\vec{P}_{\odot, \text{cam}}$, $\vec{P}_{\oplus, \text{cam}}$, and $\vec{P}_{\text{moon}, \text{cam}}$.

1. **Earth Subsolar Unit Vector**:
   \[
   \Delta\vec{P}_{\oplus} = \vec{P}_{\odot, \text{cam}} - \vec{P}_{\oplus, \text{cam}}, \quad L_\oplus = \|\Delta\vec{P}_{\oplus}\|
   \]
   \[
   \vec{S}_{\oplus, \text{cam}} = \begin{cases}
   \frac{\Delta\vec{P}_{\oplus}}{L_\oplus} & \text{if } L_\oplus \ge 10^{-6} \\
   \begin{bmatrix} 0 & 0 & 1 \end{bmatrix}^T & \text{if } L_\oplus < 10^{-6} \text{ (axial alignment fallback)}
   \end{cases}
   \]
   Passing $\vec{S}_{\oplus, \text{cam}}$ directly into the `<MiniGlobe />` shader (`subsolarCameraVector`) eliminates coordinate-system mismatch and ensures the day/night terminator hemisphere continuously faces the Sun across all camera orientations without artificial solstice drift or angle-flipping.

2. **Lunar Subsolar Unit Vector & 3D Analytical Terminator**:
   \[
   \Delta\vec{P}_{\text{moon}} = \vec{P}_{\odot, \text{cam}} - \vec{P}_{\text{moon}, \text{cam}}, \quad L_{\text{moon}} = \|\Delta\vec{P}_{\text{moon}}\|
   \]
   \[
   \vec{S}_{\text{moon}, \text{cam}} = \begin{cases}
   \frac{\Delta\vec{P}_{\text{moon}}}{L_{\text{moon}}} & \text{if } L_{\text{moon}} \ge 10^{-6} \\
   \begin{bmatrix} 0 & 0 & 1 \end{bmatrix}^T & \text{if } L_{\text{moon}} < 10^{-6}
   \end{cases}
   \]
   The Moon bead renders an analytical spherical terminator via `generateAnalyticalLimbPath(R_{\text{moon}}, S_{x}, S_{y}, S_{z}, 0)`:
   - When $S_{\text{moon}, z} < 0$, the Sun illuminates the far side of the Moon relative to the observer camera, rendering a dark backlit silhouette.
   - When $S_{\text{moon}, z} \ge 0$, the visible front face exhibits the illuminated dayside phase boundary facing the Sun in full 3D perspective.

### C. Dynamic ViewBox Scaling for Multi-Scale Orbit and Apparent Zoom

For canonical canvas dimensions $W_0, H_0$ and zoom factor $z \in [0.75, 3.5]$ (available in both 3D Orbit and 3D Apparent modes when $\lambda_{\text{morph}} \le 0.05$):
\[
W(z) = \frac{W_0}{z}, \quad H(z) = \frac{H_0}{z}
\]
\[
\text{viewBox} = \left[ -\frac{W(z)}{2}, -\frac{H(z)}{2}, W(z), H(z) \right]
\]
This preserves origin $(0, 0)$ at the canvas center while providing continuous zooming across 3D heliocentric orbits and geocentric apparent spheres without altering SVG vertex coordinates or hit-target geometries.

### D. Observer Topocentric Sky Cone & Zenith Silhouette Non-Degeneracy

In 3D modes, the observer's topocentric coordinate pin and the 3D Sky Cone canopy are co-located on the spinning Earth globe at latitude $\phi_{\text{obs}}$ and diurnal longitude $\theta = \text{GMST}(\text{JD}) + \lambda_{\text{obs}}$.

The observer's zenith sightline vector in SVG screen coordinates is $\Delta\vec{Z} = \vec{P}_{\text{zenith}, \text{screen}} - \vec{P}_{\text{obs}, \text{screen}}$ with length $L_Z = \|\Delta\vec{Z}\|$.
- When $L_Z \ge 10^{-4}\text{px}$, extreme silhouette tangent points on the celestial canopy are found via extremal 2D cross products $\Delta\vec{Z} \times (\vec{P}_{\text{canopy}, k} - \vec{P}_{\text{obs}})$.
- When $L_Z < 10^{-4}\text{px}$ (camera sightline looks directly down the observer's zenith axis), cross products degenerate. The solver falls back to antipodal diameter vertices $[0, N/2]$ on the circular canopy rim, preventing ray collapse to a zero-area triangle.

### E. Smooth 3D-to-2D Morph Continuity Threshold

The transition continuum from 3D spheres to 2D astrolabe plates is partitioned at $\lambda_{\text{threshold}} = 0.45$:
- **Phase A ($\lambda \in [0, 0.45]$)**: Camera rotates into pole alignment; Earth and Moon retain 3D Euler orientation (`viewMode="euler3d"`).
- **Phase B ($\lambda \in (0.45, 1.0]$)**: Geometry flattens onto the planar stereographic / astrolabe plate; bodies lock to flat representations (`viewMode="flat"`).

---

## 14. Diurnal Celestial Ground Tracks, Antimeridian Seam Interpolation & Gated Lunar Nodes

### A. Instantaneous Subsolar & Sublunar Geographic Coordinates (`terminatorTracks.ts`)

For any astronomical Julian Date epoch $\text{JD}$, the instantaneous position on Earth's surface where a celestial body (Sun or Moon) is at local zenith ($+90^\circ$ topocentric altitude) is defined by its geographic coordinates $(\lambda_{\text{geo}}, \phi_{\text{geo}})$:

1. **Subsolar Coordinates**:
   Given solar right ascension $\alpha_\odot$, declination $\delta_\odot$, and Greenwich Mean Sidereal Time $\text{GMST}(\text{JD})$:
   \[
   \lambda_{\odot, \text{geo}} = \operatorname{wrap180}(\alpha_\odot - \text{GMST}) = \left( ((\alpha_\odot - \text{GMST} + 540^\circ) \pmod{360^\circ}) + 360^\circ \right) \pmod{360^\circ} - 180^\circ
   \]
   \[
   \phi_{\odot, \text{geo}} = \delta_\odot
   \]

2. **Sublunar Coordinates**:
   Given lunar right ascension $\alpha_{\text{moon}}$, declination $\delta_{\text{moon}}$, and $\text{GMST}(\text{JD})$:
   \[
   \lambda_{\text{moon}, \text{geo}} = \operatorname{wrap180}(\alpha_{\text{moon}} - \text{GMST}) = \left( ((\alpha_{\text{moon}} - \text{GMST} + 540^\circ) \pmod{360^\circ}) + 360^\circ \right) \pmod{360^\circ} - 180^\circ
   \]
   \[
   \phi_{\text{moon}, \text{geo}} = \delta_{\text{moon}}
   \]

### B. Observer-Centered Equirectangular Projection

The Terminator Map renders Earth on an equirectangular canvas ($360 \times 180$ user units) dynamically centered on observer longitude $\lambda_{\text{observer}}$:
\[
X = ((\lambda_{\text{geo}} - \lambda_{\text{observer}} + 180^\circ + 360^\circ) \pmod{360^\circ})
\]
\[
Y = 90^\circ - \phi_{\text{geo}}
\]
- When $\lambda_{\text{geo}} = \lambda_{\text{observer}}$, $X = 180$ (Prime Center).
- North Pole ($\phi = +90^\circ$) maps to $Y = 0$; Equator ($\phi = 0^\circ$) maps to $Y = 90$; South Pole ($\phi = -90^\circ$) maps to $Y = 180$.

### C. 24-Hour Diurnal Trajectory Sampling & Westward Apparent Drift

For central active epoch $\text{JD}_0$, the 24-hour diurnal ground track samples $N = 49$ equidistant epochs across the centered temporal interval $\Delta t \in [-12\text{h}, +12\text{h}]$ with step size $h = 0.5\text{h}$ (30 minutes):
\[
\text{JD}_i = \text{JD}_0 + \frac{-12.0 + i \times 0.5}{24.0}, \quad i \in \{0, 1, \dots, 48\}
\]
- **Solar Sweep**: Because Earth rotates at $15^\circ/\text{hour}$ and the Sun's orbital drift is $\sim 0.9856^\circ/\text{day}$, the Sun's ground track sweeps westward at:
  \[
  \dot{\lambda}_\odot \approx -15.0^\circ/\text{hour}
  \]
  forming a nearly horizontal declination band at $\phi = \delta_\odot$.
- **Lunar Sweep**: Accounting for Earth's rotation ($15^\circ/\text{h}$) and the Moon's prograde orbital motion ($\approx 13.176^\circ/\text{day} \approx 0.549^\circ/\text{h}$), the sublunar point sweeps westward at:
  \[
  \dot{\lambda}_{\text{moon}} \approx -(15.0 - 0.549)^\circ/\text{h} \approx -14.451^\circ/\text{hour}
  \]
  completing one full Earth circuit in $T_{\text{lunar day}} \approx 24.84\text{ hours}$. Because lunar declination changes rapidly (up to $\sim 5^\circ/\text{day}$), its 24-hour ground track forms an inclined sinusoidal wave.

### D. Antimeridian Seam Boundary Interpolation (`buildSeamSafeSvgPath`)

When sequential points $P_{i-1}(X_{i-1}, Y_{i-1})$ and $P_i(X_i, Y_i)$ cross the map border ($X = 0 \leftrightarrow 360$), $|\Delta X| = |X_i - X_{i-1}| > 180^\circ$. To eliminate horizontal wrapping streak lines, the boundary intersection $Y_{\text{edge}}$ is analytically interpolated:

1. **Westward Boundary Wrap ($X_{i-1} \to 0, X_i \to 360$)**:
   The track crosses the left edge ($X = 0$) and re-enters on the right edge ($X = 360$):
   \[
   f = \frac{X_{i-1}}{X_{i-1} + (360 - X_i)}
   \]
   \[
   Y_{\text{edge}} = Y_{i-1} + f \cdot (Y_i - Y_{i-1})
   \]
   SVG command sequence: `L 0 Y_edge M 360 Y_edge L X_i Y_i`.

2. **Eastward Boundary Wrap ($X_{i-1} \to 360, X_i \to 0$)**:
   The track crosses the right edge ($X = 360$) and re-enters on the left edge ($X = 0$):
   \[
   f = \frac{360 - X_{i-1}}{(360 - X_{i-1}) + X_i}
   \]
   \[
   Y_{\text{edge}} = Y_{i-1} + f \cdot (Y_i - Y_{i-1})
   \]
   SVG command sequence: `L 360 Y_edge M 0 Y_edge L X_i Y_i`.

### E. Gated True Ecliptic Nodal Crossing Detection (`findActiveNodalCrossing`)

Using the Meeus Chapter 47 Newton-Raphson crossing solver `calculateTrueLunarNodeEvents`:
1. Crossings within $[-12\text{h}, +12\text{h}]$ ($|\Delta \text{JD}| \le 0.5\text{ days}$) are identified.
2. If an active crossing occurs, its exact coordinates $(X_{\text{node}}, Y_{\text{node}})$ are evaluated at $\text{JD}_{\text{crossing}}$ and rendered on the lunar track with symbol $\Omega$ (Ascending, $\beta = 0^\circ, \dot{\beta} > 0$) or $\mho$ (Descending, $\beta = 0^\circ, \dot{\beta} < 0$).
3. **Hover HUD Proximity Gate**: Telemetry is strictly suppressed when the Moon is $> 1.0\text{ day}$ away from the nearest node, preventing visual clutter during off-node periods.

