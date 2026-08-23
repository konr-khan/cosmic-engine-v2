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

---

## 7. Gyro-Morph Armillary Multi-Model Unification & Astrolabe Projections

### A. Unified 6-Mode Framework
The subsystem models an unbroken 4-stage continuum of cosmic abstraction:
```
[1. Heliocentric Orbit]       [2. Geocentric Orbit]       [3. 3D Armillary Sphere]       [4. 2D Astrolabe Plates]
   (Copernican Truth)          (Ptolemaic Inversion)         (Spherical Lattice)             (Planispheric 2D)
  • Sun @ (0,0,0)             • Earth @ (0,0,0)             • Earth @ (0,0,0)               • Stereographic Conformal
  • Earth @ 1 AU orbits       • Sun @ 1 AU orbits           • 6 Celestial Rings             • Universal Rojas
  • 6 Seasonal Milestones     • 6 Seasonal Milestones       • 12 Navigational Stars         • Topocentric Horizon
```

### B. Keplerian Orbital Geometry & Physics
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
   Earth centered at origin $(0, 0, 0)$, and Sun in apparent annual ecliptic motion:
   \[
   \vec{P}_{\odot} = (-\vec{P}_{\oplus, x}, 0, -\vec{P}_{\oplus, z}), \quad \vec{P}_{\oplus} = (0, 0, 0)
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

### C. 3D Celestial Coordinate Space
Given radius $R_0 = 100\text{ px}$, equatorial Right Ascension $\alpha \in [0^\circ, 360^\circ)$ and Declination $\delta \in [-90^\circ, +90^\circ]$:
\[
x = R_0 \cos\delta \sin\alpha, \quad y = R_0 \sin\delta, \quad z = R_0 \cos\delta \cos\alpha
\]

### D. 2D Astrolabe Historical Projections
1. **Stereographic Conformal Projection (Equatorial Plane)**:
   Projected from South Celestial Pole $(0, -R_0, 0)$ onto $y = 0$:
   \[
   x_{\text{stereo}} = R_0 \frac{x}{R_0 + y}, \quad z_{\text{stereo}} = R_0 \frac{z}{R_0 + y}
   \]
   * *Almucantar (Altitude $a$) Circles*: Center $y_c = R_0 \frac{\cos\phi}{\sin\phi + \sin a}$, Radius $r_a = R_0 \frac{\cos a}{\sin\phi + \sin a}$.
   * *Equator Circle*: Radius $R_0$.
   * *Tropic of Cancer*: $R_{\text{Can}} = R_0 \tan\left(\frac{90^\circ - 23.44^\circ}{2}\right)$.
   * *Tropic of Capricorn*: $R_{\text{Cap}} = R_0 \tan\left(\frac{90^\circ + 23.44^\circ}{2}\right)$.

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

### E. Universal Any-to-Any Morphing Engine
Any transition from source model $\mathcal{M}_{\text{from}}$ to target model $\mathcal{M}_{\text{to}}$ with transition progress $T \in [0.0, 1.0]$:
\[
\vec{P}(T) = (1 - T) \vec{P}_{\text{from}} + T \vec{P}_{\text{to}}
\]
where layer opacities for celestial rings, orbital rings, milestones, stars, bezel, and alidade are continuously interpolated via ease-out cubic spring curve $E(t) = 1 - (1 - t)^3$.

### D. Free Rete Spinning & Analog Solar Time Solver
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

### E. Volumetric Laser Projection Beacons & Conic Light Envelope
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

### F. Astrolabe Alidade Sighting Arm Mathematics
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
   \sin a_{\text{sighted}} = \sin\phi \sin\delta + \cos\phi \cos\delta \cos H_{\text{sighted}}
   \]
   \[
   \cos A_{\text{sighted}} = \frac{\sin\delta - \sin\phi \sin a_{\text{sighted}}}{\cos\phi \cos a_{\text{sighted}}}
   \]
3. **Nearest Target Sighting Lock**:
   Target angle $\theta_{\text{target}} = (\operatorname{atan2}(y_{\text{screen}}, x_{\text{screen}}) \times \frac{180^\circ}{\pi} + 90^\circ + 360^\circ) \bmod 360^\circ$. Sighting locks when $|\Delta\theta| \le 10.0^\circ$.
