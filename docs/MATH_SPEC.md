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
   * *Solar Angular Diameter*: $\theta_\odot = \frac{31.98'}{r_{\text{AU}}}$
4. **Seasonal Milestone Nodes**:
   6 seasonal milestone points ($M_k$) positioned along the orbit:
   * *Perihelion* ($\lambda = 103^\circ$, $0.983\text{ AU}$, $30.29\text{ km/s}$)
   * *March Equinox* ($\lambda = 0^\circ$, $0.996\text{ AU}$, $29.84\text{ km/s}$)
   * *June Solstice* ($\lambda = 90^\circ$, $1.016\text{ AU}$, $29.29\text{ km/s}$)
   * *Aphelion* ($\lambda = 283^\circ$, $1.017\text{ AU}$, $29.29\text{ km/s}$)
   * *September Equinox* ($\lambda = 180^\circ$, $1.004\text{ AU}$, $29.72\text{ km/s}$)
   * *December Solstice* ($\lambda = 270^\circ$, $0.984\text{ AU}$, $30.28\text{ km/s}$)

### D. 3D Celestial Coordinate Space
Standardized coordinate frame where the $+X$ axis points to the Vernal Equinox ($\Upsilon$, $\alpha = 0^\circ, \lambda = 0^\circ$), $+Y$ points to the North Celestial Pole ($\delta = +90^\circ$), and $+Z$ completes the right-handed basis ($\alpha = 90^\circ$ at $\delta = 0^\circ$).

Given radius $R_0 = 100\text{ px}$, equatorial Right Ascension $\alpha \in [0^\circ, 360^\circ)$ and Declination $\delta \in [-90^\circ, +90^\circ]$:
\[
x = R_0 \cos\delta \cos\alpha, \quad y = R_0 \sin\delta, \quad z = R_0 \cos\delta \sin\alpha
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
\theta_\odot = \frac{31.98'}{r_{\text{AU}}} \quad [\text{arcminutes}]
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

3. **Frame Transformation Matrices**:
   Given mean Earth obliquity $\varepsilon = 23.439281^\circ$:
   \[
   \mathbf{M}_{\text{ecl}\to\text{eq}} = \mathbf{R}_x(-\varepsilon) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\varepsilon & -\sin\varepsilon \\ 0 & \sin\varepsilon & \cos\varepsilon \end{pmatrix}
   \]
   \[
   \mathbf{M}_{\text{eq}\to\text{ecl}} = \mathbf{R}_x(+\varepsilon) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\varepsilon & \sin\varepsilon \\ 0 & -\sin\varepsilon & \cos\varepsilon \end{pmatrix}
   \]
   For any 3D vector $\vec{v}_{\text{ecl}} \in \mathcal{F}_{\text{ecl}}$, its equatorial representation is $\vec{v}_{\text{eq}} = \mathbf{M}_{\text{ecl}\to\text{eq}} \vec{v}_{\text{ecl}}$.

4. **Generalized $SO(3)$ Euler Camera Rotation Matrix**:
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

2. **Keplerian Orbital Equation**:
   Given true anomaly $\nu = \lambda_\odot - \varpi$ (where $\varpi = 102.94719^\circ$ is longitude of perihelion):
   \[
   r(\nu) = \frac{a(1 - e^2)}{1 + e \cos\nu}
   \]
   In the orbit plane with Focus F1 at $(0, 0, 0)$:
   \[
   x_{\text{orbit}} = r(\nu) \cos\nu - c, \quad y_{\text{orbit}} = r(\nu) \sin\nu, \quad z_{\text{orbit}} = 0
   \]
   The empty focus F2 is located at $(2c, 0, 0)$ relative to F1.

3. **6 Seasonal Orbital Milestones**:
   Each milestone node is evaluated at its exact astronomical true anomaly $\nu_i$:
   * **Perihelion**: $\nu = 0^\circ$, $\lambda_\odot = 102.9^\circ$, $r = a(1 - e) = 0.9833\text{ AU}$, $v = 30.29\text{ km/s}$.
   * **March Equinox**: $\lambda_\odot = 0^\circ$, $\nu = 257.05^\circ$, $r = 0.9960\text{ AU}$, $v = 29.84\text{ km/s}$.
   * **June Solstice**: $\lambda_\odot = 90^\circ$, $\nu = 347.05^\circ$, $r = 1.0163\text{ AU}$, $v = 29.38\text{ km/s}$.
   * **Aphelion**: $\nu = 180^\circ$, $\lambda_\odot = 282.9^\circ$, $r = a(1 + e) = 1.0167\text{ AU}$, $v = 29.29\text{ km/s}$.
   * **September Equinox**: $\lambda_\odot = 180^\circ$, $\nu = 77.05^\circ$, $r = 1.0040\text{ AU}$, $v = 29.65\text{ km/s}$.
   * **December Solstice**: $\lambda_\odot = 270^\circ$, $\nu = 167.05^\circ$, $r = 0.9837\text{ AU}$, $v = 30.27\text{ km/s}$.

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
   * Apex Distance from Earth center:
     \[
     L_{\text{umbra}} = \frac{R_\oplus \cdot d_\odot}{R_\odot - R_\oplus} \approx 1,384,000\text{ km} \approx 217 R_\oplus
     \]
   * Half-angle of Umbra cone:
     \[
     \alpha_{\text{umbra}} = \arcsin\left(\frac{R_\odot - R_\oplus}{d_\odot}\right) \approx 0.264^\circ
     \]
   * Umbra Radius at Lunar Distance ($d_{\text{moon}} \approx 384,400\text{ km}$):
     \[
     r_{\text{umbra}}(d_{\text{moon}}) = R_\oplus - d_{\text{moon}} \tan\alpha_{\text{umbra}} \approx 4,600\text{ km}
     \]

2. **Penumbra Shadow Cone (Partial Shadow)**:
   * Apex Distance (between Sun and Earth):
     \[
     L_{\text{penumbra}} = \frac{R_\oplus \cdot d_\odot}{R_\odot + R_\oplus} \approx 1,358,000\text{ km}
     \]
   * Half-angle of Penumbra cone:
     \[
     \alpha_{\text{penumbra}} = \arcsin\left(\frac{R_\odot + R_\oplus}{d_\odot}\right) \approx 0.269^\circ
     \]
   * Penumbra Radius at Lunar Distance:
     \[
     r_{\text{penumbra}}(d_{\text{moon}}) = R_\oplus + d_{\text{moon}} \tan\alpha_{\text{penumbra}} \approx 8,180\text{ km}
     \]

### E. Canonical Camera Projection Pipelines

Each camera projection transforms 3D scene objects into 2D SVG screen coordinates $(x_s, y_s)$:

1. **`projectHeliocentricTopDown` (Macro Orbit View)**:
   * View direction: Along $-Z_{\text{ecl}}$ (looking from North Ecliptic Pole down onto $XY$ plane).
   * Projection:
     \[
     x_s = x_{\text{center}} + x_{\text{ecl}} \cdot \text{scale}, \quad y_s = y_{\text{center}} - y_{\text{ecl}} \cdot \text{scale} \cdot b/a
     \]
2. **`projectGeocentricTransverse` (Eclipse Left Pane — Side Profile)**:
   * View direction: Perpendicular to Sun-Earth syzygy axis (along $-Y_{\text{syzygy}}$).
   * Projection:
     \[
     x_s = x_{\text{center}} - \cos(\text{elongation}) \cdot R_x, \quad y_s = y_{\text{center}} - \beta \cdot \text{scale}_y
     \]
3. **`projectGeocentricAxial` (Eclipse Right Pane — Sightline View)**:
   * View direction: Along Sun-Earth axis through Earth (looking toward Moon).
   * Projection:
     \[
     x_s = x_{\text{center}} - \sin(\text{elongation}) \cdot R_x, \quad y_s = y_{\text{center}} - \beta \cdot \text{scale}_y
     \]
4. **`projectEulerCamera` (Armillary 3D Apparent View)**:
   * View transformation: $\vec{P}_{\text{cam}} = \mathbf{R}_{\text{cam}}(\text{Pitch}, \text{Yaw}, \text{Roll}) \vec{P}_{3D}$.
   * Orthographic projection with SVG invert-$Y$:
     \[
     x_s = x_{\text{center}} + P_{\text{cam}, x} \cdot \text{scale}, \quad y_s = y_{\text{center}} - P_{\text{cam}, y} \cdot \text{scale}
     \]
   * Depth sorting criterion: $P_{\text{cam}, z} \ge 0 \implies \text{Front (solid stroke)}$, $P_{\text{cam}, z} < 0 \implies \text{Back (dashed stroke)}$.

### F. Earth Inertial 3D Axial Tilt & Analytical Spherical Limb Clipping

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
3. **Analytical Spherical Limb Clipping**:
   For twilight angle threshold $h_0 \in \{0^\circ, -6^\circ, -12^\circ, -18^\circ\}$ and camera subsolar vector $(s_x, s_y, s_z)$:
   * Tangent parameter $\mu = \frac{-\sin h_0 \cdot s_z}{\cos h_0 \cdot \sqrt{s_x^2 + s_y^2}}$.
   * If $\mu \ge 1$: Full night (or full day if $s_z \ge \sin h_0$).
   * If $\mu \le -1$: Complete closed circular terminator ellipse on front face.
   * If $|\mu| < 1$: Terminator circle intersects the limb at $\phi_0 = \arcsin\mu$, generating smooth, non-tearing arc paths joined continuously along the planetary limb rim.

### G. 3D Rotational Vector Continent Projection & Limb Clipping

Given geographic coordinates $(\lambda_{\text{geo}}, \phi_{\text{geo}})$ and local solar hour angle $h = 15^\circ(t_{\text{tod}} - 12) + \lambda_{\text{geo}}$:
1. **Equatorial Body Frame**:
   \[
   \vec{P}_{\text{eq}} = \begin{pmatrix} \cos\phi_{\text{geo}} \cos h \\ \cos\phi_{\text{geo}} \sin h \\ \sin\phi_{\text{geo}} \end{pmatrix}
   \]
2. **Camera / Ecliptic Transformation**:
   * **`euler3d`**: $\vec{P}_{\text{cam}} = \mathbf{R}_{\text{cam}}(\text{Pitch}, \text{Yaw}, \text{Roll}) \vec{P}_{\text{eq}}$.
   * **`topdown`**: $\vec{P}_{\text{ecl}} = (x_b, y_b \cos\varepsilon - z_b \sin\varepsilon, y_b \sin\varepsilon + z_b \cos\varepsilon)$ where $(x_b, y_b, z_b) = (\cos\phi \sin h, \cos\phi \cos h, \sin\phi)$.
   * **`transverse`** / **`axial`**: Transformed along syzygy frame matching `calculateEarthSideGeometry` and `calculateEarthAxialGeometry`.
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


