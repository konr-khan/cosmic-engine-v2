# MATH_SPEC.md — Astronomical Mathematical Specification & Domain Models

This document serves as the ground-truth mathematical reference for **Cosmic Engine V2.0**, codifying all coordinate transformations, ephemeris approximations, twilight thresholds, eclipse shadow geometry, and tidal vector mechanics.

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

### C. Disc Illumination ($k$) & Parallactic Angle ($\eta$)
* **Physical Disc Illumination Fraction**:
  \[
  k = \frac{1 - \cos D}{2} \in [0.0, 1.0]
  \]
* **Parallactic Angle ($\eta$)**:
  \[
  \tan \eta = \frac{\sin H}{\tan \phi \cos \delta_{\text{moon}} - \sin \delta_{\text{moon}} \cos H}
  \]
  where $H = \text{LST} - \alpha_{\text{moon}}$ is the observer local hour angle.

---

## 6. Syzygy Eclipse Shadow Geometry

### A. Angular Radii & Horizontal Parallax
* Sun Angular Radius: $s_\odot \approx 0.267^\circ$
* Moon Angular Radius: $s_{\text{moon}} = \arcsin(1737.4 / \Delta)$
* Moon Horizontal Parallax: $\pi_{\text{moon}} = \arcsin(6378.137 / \Delta)$
* Sun Horizontal Parallax: $\pi_\odot \approx 0.0024^\circ$

### B. Earth Shadow Cones at Lunar Distance (with 1.02 Atmospheric Refraction)
* **Umbra Radius**: $\rho_u = 1.02 \cdot (\pi_{\text{moon}} + \pi_\odot - s_\odot)$
* **Penumbra Radius**: $\rho_p = 1.02 \cdot (\pi_{\text{moon}} + \pi_\odot + s_\odot)$

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
