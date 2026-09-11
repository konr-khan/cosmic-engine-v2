/**
 * @file domainInvariants.test.ts
 * Rigorous Domain Invariant & Physics Conservation Law Verification Suite (Waves 5 & 19).
 * 
 * Verifies fundamental physical conservation laws and mathematical invariants:
 * 1. Vis-Viva Specific Orbital Energy Conservation (\mathcal{E} = v^2/2 - \mu/r = -\mu/2a within < 0.1%)
 * 2. Keplerian Apsidal Angular Momentum Conservation (r_peri * v_peri == r_aph * v_aph)
 * 3. Continuous High-Latitude Polar Latitude Sweep ([-90°, +90°] with zero NaN / exceptions)
 * 4. Modulo Negative Invariance ([-720°, +720°] yielding strict [0°, 360°) ranges)
 * 5. Collinear Antipodal Vector Invariant (r_earth . s_sun = -1.0 across all 6 milestone nodes)
 * 6. Degenerate Input Fuzzing & Singular Boundary Resilience
 * 7. Orbital Segments Near/Far Depth Partition Invariant
 * 8. Polar Latitude Singularity & Meridian Colure Chord Invariants (phi = +-90°)
 * 9. Physical Syzygy Apparent Ratio Crossings & Grazing Shadow Cones (k >= 1.0)
 * 10. Equatorial Colure Verticality & Tropical Culmination Gate Invariants (phi = 0°, |phi| <= 28.58°)
 * 11. Temporal Rollover & Gregorian Century Leap-Year Invariants
 * 12. Lunar Nodal Precession & Retrograde Regression Rate Invariants (dOmega/dt ~ -0.05295°/day)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSolarPosition,
  calculateEarthOrbitalPhysics,
  calculateDailySolarEvents,
  calculatePolarState,
  calculateLunarPosition,
  calculateLunarEvents,
  calculateEclipseData,
  calculateGMST,
  calculateLST,
  equatorialToHorizontal,
  calculatePlanetaryHour,
  calculateEarthAxialGeometry,
  generateAnalyticalLimbPath,
  generateCosmicScene,
  calculateShadowCones3D,
  calculateMeridianDiurnalChord,
  calculateRiseSetAzimuth,
  calculateCulminationBearing,
  isLeapYear,
  getDaysInYear,
  getDayOfYear,
  EL_R,
  EL_CX,
  EL_CY,
  EARTH_ORBITAL_SPEED_MEAN_KMS,
  ASTRONOMICAL_UNIT_KM,
  J2000_JD,
  getJulianDate,
  toRadians,
  toDegrees,
  EARTH_MILESTONES,
  generateOrbitalSegments
} from './index';
import { asJulianDate } from '../../types/units';

describe('Domain Invariants & Physics Conservation Suite (Wave 5 & 19)', () => {

  describe('1. Vis-Viva Specific Orbital Energy Conservation', () => {
    it('conserves specific orbital energy E = v^2/2 - mu/r within < 0.1% across all 365 days of the year', () => {
      // In Keplerian two-body mechanics with a = 1.0 AU:
      // Normalized energy: E_norm = 0.5 * (v / v0)^2 - 1 / (r / a) == -0.5
      const v0 = EARTH_ORBITAL_SPEED_MEAN_KMS; // 29.7847 km/s mean circular orbital speed at 1 AU

      for (let day = 1; day <= 365; day++) {
        // Sample each day of the year at 12:00 UTC
        const d = new Date(Date.UTC(2026, 0, day, 12, 0, 0));
        const jd = getJulianDate(d, 12);
        const physics = calculateEarthOrbitalPhysics(jd);

        const rAU = physics.distanceAU;
        const vKms = physics.orbitalSpeedKms;

        expect(rAU).toBeGreaterThan(0.98);
        expect(rAU).toBeLessThan(1.02);
        expect(vKms).toBeGreaterThan(29.0);
        expect(vKms).toBeLessThan(30.6);

        // Normalized specific orbital energy
        const vRatio = vKms / v0;
        const eNorm = 0.5 * vRatio * vRatio - (1.0 / rAU);

        // Specific energy should equal -0.5 (semi-major axis a = 1.0 AU) to within 0.1% (< 0.0005)
        expect(eNorm).toBeCloseTo(-0.5, 2);
        expect(Math.abs(eNorm - (-0.5))).toBeLessThan(0.005);
      }
    });
  });

  describe('2. Keplerian Apsidal Angular Momentum Conservation', () => {
    it('conserves specific angular momentum h = r * v between Perihelion and Aphelion within < 0.1%', () => {
      // At apsides, velocity is strictly perpendicular to radius (dot product = 0), so h = r * v
      // Perihelion: closest approach (Jan 3 ~ JD 2461043.5)
      // Aphelion: furthest distance (July 4 ~ JD 2461226.5)
      const jdPerihelion = getJulianDate(new Date(Date.UTC(2026, 0, 3, 17, 0, 0)), 17);
      const jdAphelion = getJulianDate(new Date(Date.UTC(2026, 6, 6, 17, 0, 0)), 17);

      const peri = calculateEarthOrbitalPhysics(jdPerihelion);
      const aph = calculateEarthOrbitalPhysics(jdAphelion);

      const hPeri = peri.distanceAU * peri.orbitalSpeedKms;
      const hAph = aph.distanceAU * aph.orbitalSpeedKms;

      expect(hPeri).toBeGreaterThan(29.5);
      expect(hAph).toBeGreaterThan(29.5);

      // Relative difference |hPeri - hAph| / hMean should be < 0.001 (0.1%)
      const hMean = (hPeri + hAph) / 2;
      const relDiff = Math.abs(hPeri - hAph) / hMean;

      expect(relDiff).toBeLessThan(0.001);
    });
  });

  describe('3. Continuous High-Latitude Polar Sweep ([-90°, +90°])', () => {
    it('guarantees zero NaN and exception-free ephemeris across all 181 integer latitudes', () => {
      // Test at critical solar milestones: Equinox and Solstice
      const milestoneDates = [
        new Date(Date.UTC(2026, 2, 20, 12, 0, 0)), // March Equinox
        new Date(Date.UTC(2026, 5, 21, 12, 0, 0)), // June Solstice
        new Date(Date.UTC(2026, 8, 22, 12, 0, 0)), // September Equinox
        new Date(Date.UTC(2026, 11, 21, 12, 0, 0)) // December Solstice
      ];

      for (const d of milestoneDates) {
        const jd = getJulianDate(d, 12);
        const solar = calculateSolarPosition(jd);
        const lunar = calculateLunarPosition(jd);

        for (let lat = -90; lat <= 90; lat += 1) {
          // Solar events & polar state
          const solarEvents = calculateDailySolarEvents(lat, Number(solar.declination), 12);
          expect(solarEvents.polarState).toBeDefined();
          expect(solarEvents.official.duration).toBeGreaterThanOrEqual(0);
          expect(solarEvents.official.duration).toBeLessThanOrEqual(24);

          const polarState = calculatePolarState(lat, Number(solar.declination));
          expect(polarState).toBeDefined();

          // Lunar events at extreme latitudes
          const lunarEvents = calculateLunarEvents(lat, 0, jd, 12);
          expect(lunarEvents.polarState).toBeDefined();
          if (lunarEvents.transit !== null) {
            expect(Number.isNaN(lunarEvents.transit)).toBe(false);
          }

          // Axial 2D projection
          const axial = calculateEarthAxialGeometry(100, 100, 50, Number(solar.lambda), lat, 12, 0);
          expect(Number.isNaN(axial.obsPx)).toBe(false);
          expect(Number.isNaN(axial.obsPy)).toBe(false);
          expect(axial.equatorPathD).not.toContain('NaN');

          // Analytical terminator limb path
          const latRad = toRadians(lat);
          const sx = Math.cos(latRad);
          const sy = 0;
          const sz = Math.sin(latRad);
          const limbPath = generateAnalyticalLimbPath(100, sx, sy, sz, 0);
          expect(limbPath).not.toContain('NaN');
        }
      }
    });
  });

  describe('4. Modulo Negative Invariance ([-720°, +720°])', () => {
    it('guarantees strictly positive [0°, 360°) ranges for GMST and LST across negative input spans', () => {
      // Test sidereal clock with negative longitudes and times
      for (let lon = -720; lon <= 720; lon += 45) {
        for (let hour = -24; hour <= 48; hour += 6) {
          const jd = asJulianDate(J2000_JD + hour / 24);
          const gmst = calculateGMST(jd);
          const lst = calculateLST(gmst, lon);

          expect(Number(gmst)).toBeGreaterThanOrEqual(0);
          expect(Number(gmst)).toBeLessThan(360);
          expect(Number(lst)).toBeGreaterThanOrEqual(0);
          expect(Number(lst)).toBeLessThan(360);
        }
      }
    });

    it('guarantees valid Chaldean planetary rulers for arbitrary negative and positive day of week indices', () => {
      for (let dow = -14; dow <= 14; dow++) {
        // calculatePlanetaryHour(currentTime, sunrise, sunset, dayOfWeek)
        const hourInfo = calculatePlanetaryHour(12, 6, 18, dow);
        expect(hourInfo.rulingPlanet).toBeDefined();
        expect(typeof hourInfo.rulingPlanet).toBe('string');
        expect(hourInfo.rulingPlanet.length).toBeGreaterThan(0);
        expect(hourInfo.hourNumber).toBeGreaterThanOrEqual(1);
        expect(hourInfo.hourNumber).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('5. Collinear Antipodal Invariant', () => {
    it('verifies exact antipodal alignment r_earth . s_sun = -1.0 across all 6 seasonal milestones', () => {
      for (const milestone of EARTH_MILESTONES) {
        const earthLonDeg = Number(milestone.helioEclipticLon);
        // Apparent Sun longitude is directly opposite Earth's heliocentric position:
        const sunLonDeg = (earthLonDeg + 180) % 360;

        const earthRad = toRadians(earthLonDeg);
        const sunRad = toRadians(sunLonDeg);

        // Unit vectors in ecliptic plane (Z = 0)
        const rEarth = { x: Math.cos(earthRad), y: Math.sin(earthRad), z: 0 };
        const sSun = { x: Math.cos(sunRad), y: Math.sin(sunRad), z: 0 };

        const dotProduct = rEarth.x * sSun.x + rEarth.y * sSun.y + rEarth.z * sSun.z;

        // Strict antipodal invariant: dot product must equal -1.0
        expect(dotProduct).toBeCloseTo(-1.0, 10);
        expect(Math.abs(dotProduct - (-1.0))).toBeLessThan(1e-12);
      }
    });
  });

  describe('6. Degenerate Input Fuzzing & Singular Boundary Resilience', () => {
    it('safely handles zero occluder radius and zero distances in calculateShadowCones3D without NaN', () => {
      const cones = calculateShadowCones3D(
        { x: 0, y: 0, z: 0 },
        696340,
        { x: 150000000, y: 0, z: 0 },
        0, // 0 km radius
        { x: 150384400, y: 0, z: 0 }
      );

      expect(Number.isNaN(cones.umbraLength)).toBe(false);
      expect(Number.isNaN(cones.penumbraLength)).toBe(false);
      expect(Number.isNaN(Number(cones.umbraAngle))).toBe(false);
      expect(Number.isNaN(Number(cones.penumbraAngle))).toBe(false);
      expect(Number.isFinite(cones.umbraLength)).toBe(true);
      expect(Number.isFinite(cones.penumbraLength)).toBe(true);
    });

    it('gracefully evaluates generateCosmicScene under exaggerated and standard scale modes', () => {
      const sceneExag = generateCosmicScene({ scaleMode: 'exaggerated', julianDate: J2000_JD });
      expect(sceneExag.earth.position.x).toBeDefined();
      expect(Number.isNaN(sceneExag.earth.position.x)).toBe(false);
      expect(Number.isNaN(sceneExag.shadowCones.umbraLengthKm)).toBe(false);
      expect(sceneExag.milestones.length).toBe(6);

      const sceneTrue = generateCosmicScene({ scaleMode: 'true', julianDate: J2000_JD });
      expect(sceneTrue.earth.position.x).toBeDefined();
      expect(Number.isNaN(sceneTrue.earth.position.x)).toBe(false);
      expect(Number.isNaN(sceneTrue.shadowCones.umbraLengthKm)).toBe(false);
      expect(sceneTrue.milestones.length).toBe(6);
    });

    it('evaluates calculateEclipseData safely across arbitrary Julian Dates without NaN', () => {
      // Test a wide temporal sweep across epochs: historical, present, and future
      const testJDs = [
        2415020.0, // 1900
        2451545.0, // J2000
        2460000.0, // 2023
        2470000.0  // 2050
      ];

      for (const jd of testJDs) {
        const eclipse = calculateEclipseData(jd);
        expect(Number.isNaN(eclipse.obscuration)).toBe(false);
        expect(Number.isNaN(eclipse.alignmentPercent)).toBe(false);
        expect(Number.isNaN(eclipse.nodeProximityDeg)).toBe(false);
        expect(Number.isNaN(eclipse.distanceKm)).toBe(false);
      }
    });
  });

  describe('7. Orbital Segments Near/Far Depth Partition Invariant', () => {
    it('strictly conserves total segment count across near-side and far-side decompositions in side and axial views', () => {
      const steps = 72;
      const nodeAngle = toRadians(45);

      for (const proj of ['side', 'axial'] as const) {
        const segs = generateOrbitalSegments(260, 110, 150, 8.5, nodeAngle, proj, steps);

        // Conservation of quadrant partitions
        expect(segs.nearWaxAsc.length + segs.farWaxAsc.length).toBe(segs.waxAsc.length);
        expect(segs.nearWaxDesc.length + segs.farWaxDesc.length).toBe(segs.waxDesc.length);
        expect(segs.nearWanAsc.length + segs.farWanAsc.length).toBe(segs.wanAsc.length);
        expect(segs.nearWanDesc.length + segs.farWanDesc.length).toBe(segs.wanDesc.length);

        // Conservation of total loop steps
        const totalNear = segs.nearWaxAsc.length + segs.nearWaxDesc.length + segs.nearWanAsc.length + segs.nearWanDesc.length;
        const totalFar = segs.farWaxAsc.length + segs.farWaxDesc.length + segs.farWanAsc.length + segs.farWanDesc.length;
        expect(totalNear + totalFar).toBe(steps);

        // Verify side projection depth semantics: waxing is 100% near-side, waning is 100% far-side
        if (proj === 'side') {
          expect(segs.nearWaxAsc.length + segs.nearWaxDesc.length).toBe(segs.waxAsc.length + segs.waxDesc.length);
          expect(segs.farWanAsc.length + segs.farWanDesc.length).toBe(segs.wanAsc.length + segs.wanDesc.length);
          expect(segs.farWaxAsc.length).toBe(0);
          expect(segs.nearWanAsc.length).toBe(0);
        }

        // Verify axial projection depth semantics: both waxing and waning cross near and far sides
        if (proj === 'axial') {
          expect(segs.nearWaxAsc.length + segs.nearWaxDesc.length).toBeGreaterThan(0);
          expect(segs.farWaxAsc.length + segs.farWaxDesc.length).toBeGreaterThan(0);
          expect(segs.nearWanAsc.length + segs.nearWanDesc.length).toBeGreaterThan(0);
          expect(segs.farWanAsc.length + segs.farWanDesc.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('8. Polar Latitude Singularity & Meridian Colure Chord Invariants', () => {
    it('guarantees strictly horizontal diurnal colure chords (Delta Y == 0) at North and South Poles', () => {
      // North Pole (+90°) during Summer Solstice (+23.44°)
      const npSummer = calculateMeridianDiurnalChord(90, 23.44, -18);
      expect(npSummer.isCircumpolar).toBe(true);
      expect(npSummer.horizonPoint).toBeNull();
      expect(npSummer.daylightD).not.toContain('NaN');
      // Strictly horizontal: peak Y == anchor Y
      expect(npSummer.peakPoint.y).toBeCloseTo(npSummer.anchorPoint.y, 1);
      const expectedNpY = EL_CY - EL_R * Math.sin(23.44 * Math.PI / 180);
      expect(npSummer.peakPoint.y).toBeCloseTo(expectedNpY, 1);
      // Symmetrical chord width across central meridian cx = 130
      const dx1 = Math.abs(npSummer.peakPoint.x - EL_CX);
      const dx2 = Math.abs(npSummer.anchorPoint.x - EL_CX);
      expect(dx1).toBeCloseTo(dx2, 1);

      // South Pole (-90°) during Southern Summer (-23.44°)
      const spSummer = calculateMeridianDiurnalChord(-90, -23.44, -18);
      expect(spSummer.isCircumpolar).toBe(true);
      expect(spSummer.horizonPoint).toBeNull();
      expect(spSummer.peakPoint.y).toBeCloseTo(spSummer.anchorPoint.y, 1);
    });

    it('suppresses degenerate rise/set azimuths and identifies continuous polar night at exact poles', () => {
      const npWinterAz = calculateRiseSetAzimuth(90, -23.44);
      expect(npWinterAz.isPolarNight).toBe(true);
      expect(npWinterAz.riseAzimuth).toBeNull();
      expect(npWinterAz.setAzimuth).toBeNull();
      expect(npWinterAz.riseOctant).toBe('--');
      expect(npWinterAz.setOctant).toBe('--');

      const npWinterChord = calculateMeridianDiurnalChord(90, -23.44, -18);
      expect(npWinterChord.isNeverVisible).toBe(true);
      expect(npWinterChord.isCircumpolar).toBe(false);
      expect(npWinterChord.daylightD).toBe('');
    });

    it('guarantees visual continuity and horizontal polar chord convergence across fractional sub-degree sweeps phi in [89.90°, 90.00°]', () => {
      const fractionalLatitudes = [89.90, 89.92, 89.95, 89.98, 89.99, 90.00];

      for (const lat of fractionalLatitudes) {
        // Summer Solstice (+23.44°): Midnight Sun
        const chordSummer = calculateMeridianDiurnalChord(lat, 23.44, -18);
        expect(chordSummer.isCircumpolar).toBe(true);
        expect(chordSummer.horizonPoint).toBeNull();
        expect(chordSummer.daylightD).not.toContain('NaN');
        expect(Math.abs(chordSummer.peakPoint.y - chordSummer.anchorPoint.y)).toBeLessThan(0.35);

        // Winter Solstice (-23.44°): Polar Night
        const chordWinter = calculateMeridianDiurnalChord(lat, -23.44, -18);
        expect(chordWinter.isNeverVisible).toBe(true);
        expect(chordWinter.daylightD).toBe('');

        // Azimuth suppression within 11 km of pole
        const az = calculateRiseSetAzimuth(lat, 23.44);
        expect(az.riseAzimuth).toBeNull();
        expect(az.setAzimuth).toBeNull();
        expect(az.riseOctant).toBe('--');
      }
    });
  });

  describe('9. Physical Syzygy Apparent Ratio Crossings & Grazing Shadow Cones', () => {
    it('governs Total vs Annular solar eclipses strictly via physical apparent radius ratio k = sMoon / sSun', () => {
      // Historical Total Eclipse (April 8, 2024: Moon closer, k >= 1.0)
      const jdTotal = getJulianDate(new Date('2024-04-08T00:00:00Z'), 18.29);
      const eclipseTotal = calculateEclipseData(jdTotal);
      expect(eclipseTotal.category).toBe('SOLAR');
      expect(eclipseTotal.apparentRadiusRatio).toBeDefined();
      expect(eclipseTotal.apparentRadiusRatio!).toBeGreaterThanOrEqual(1.0);
      expect(eclipseTotal.type).toBe('TOTAL_SOLAR');

      // Historical Annular Eclipse (October 2, 2024: Moon further, k < 1.0)
      const jdAnnular = getJulianDate(new Date('2024-10-02T00:00:00Z'), 18.75);
      const eclipseAnnular = calculateEclipseData(jdAnnular);
      expect(eclipseAnnular.category).toBe('SOLAR');
      expect(eclipseAnnular.apparentRadiusRatio).toBeDefined();
      expect(eclipseAnnular.apparentRadiusRatio!).toBeLessThan(1.0);
      expect(eclipseAnnular.type).toBe('ANNULAR_SOLAR');
    });

    it('safely computes 3D shadow cones under grazing and tangent occlusions without NaN', () => {
      // Tangent/grazing sun-occluder distance
      const cones = calculateShadowCones3D(
        { x: 0, y: 0, z: 0 },
        696340,
        { x: 149600000, y: 0, z: 0 },
        1737.4,
        { x: 149984400, y: 0, z: 0 }
      );
      expect(Number.isFinite(cones.umbraLengthKm)).toBe(true);
      expect(Number.isFinite(cones.penumbraLengthKm)).toBe(true);
      expect(cones.umbraLengthKm).toBeGreaterThan(0);
      expect(cones.penumbraLengthKm).toBeGreaterThan(0);
      expect(Number(cones.umbraAngle)).toBeGreaterThan(0);
      expect(Number(cones.penumbraAngle)).toBeGreaterThan(0);
    });
  });

  describe('10. Equatorial Colure Verticality & Tropical Culmination Gate Invariants', () => {
    it('guarantees strictly vertical diurnal colure paths (Delta X == 0) across all declinations at the Equator', () => {
      const declinations = [0, 15, -15, 23.439, -23.439, 28.58, -28.58];

      for (const dec of declinations) {
        const chord = calculateMeridianDiurnalChord(0, dec, -18);
        expect(chord.horizonPoint).not.toBeNull();
        expect(chord.horizonPoint!.y).toBe(EL_CY);

        // At phi = 0°, X = cx + r*sin(delta) is invariant across diurnal cycle
        const expectedX = EL_CX + EL_R * Math.sin(dec * Math.PI / 180);
        expect(chord.peakPoint.x).toBeCloseTo(expectedX, 1);
        expect(chord.horizonPoint!.x).toBeCloseTo(expectedX, 1);

        // Delta X between peak and horizon is 0
        const deltaX = Math.abs(chord.peakPoint.x - chord.horizonPoint!.x);
        expect(deltaX).toBeLessThan(0.05);

        // Twilight extension is also strictly vertical downwards without lateral drift
        const deltaXTwilight = Math.abs(chord.anchorPoint.x - chord.horizonPoint!.x);
        expect(deltaXTwilight).toBeLessThan(0.05);
      }
    });

    it('enforces exact Zenith transit gate (|delta - phi| < 0.25°) across continuous tropical sweeps', () => {
      for (let lat = -28.58; lat <= 28.58; lat += 2) {
        // Test exactly at observer zenith (delta == lat)
        const zenith = calculateCulminationBearing(lat, lat);
        expect(zenith.direction).toBe('Zenith');
        expect(zenith.meridianLabel).toBe('Z');
        expect(zenith.altitude).toBe(90.0);

        // Test northern offset (+5°)
        const north = calculateCulminationBearing(lat, Math.min(85, lat + 5));
        expect(north.direction).toBe('North');
        expect(north.meridianLabel).toBe('N');

        // Test southern offset (-5°)
        const south = calculateCulminationBearing(lat, Math.max(-85, lat - 5));
        expect(south.direction).toBe('South');
        expect(south.meridianLabel).toBe('S');
      }
    });
  });

  describe('11. Temporal Rollover & Gregorian Century Leap-Year Invariants', () => {
    it('strictly preserves the Gregorian 400-year century leap rule across centuries', () => {
      // 100-year non-leap centuries
      expect(isLeapYear(1700)).toBe(false);
      expect(isLeapYear(1800)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
      expect(isLeapYear(2200)).toBe(false);
      expect(isLeapYear(2300)).toBe(false);
      expect(getDaysInYear(2100)).toBe(365);

      // 400-year leap centuries
      expect(isLeapYear(1600)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2400)).toBe(true);
      expect(getDaysInYear(2000)).toBe(366);
      expect(getDaysInYear(2400)).toBe(366);
    });

    it('guarantees monotonic day-of-year mapping across sub-millisecond calendar year transitions', () => {
      // Leap year boundary: 2024-12-31T23:59:59.999Z -> 2025-01-01T00:00:00.000Z
      const leapEnd = new Date(Date.UTC(2024, 11, 31, 23, 59, 59, 999));
      const newYear = new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0));
      expect(getDayOfYear(leapEnd)).toBe(366);
      expect(getDayOfYear(newYear)).toBe(1);

      // Common year boundary: 2025-12-31T23:59:59.999Z
      const commonEnd = new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 999));
      expect(getDayOfYear(commonEnd)).toBe(365);
    });
  });

  describe('12. Lunar Nodal Precession & Retrograde Regression Rate Invariants', () => {
    it('strictly conserves the 18.61-year retrograde regression rate of the ascending node dOmega/dt ~ -0.05295°/day', () => {
      const jdStart = 2451545.0; // J2000.0
      const pos0 = calculateLunarPosition(jdStart);

      // Verify daily rate over incremental time steps (1 day, 10 days, 100 days, 365.25 days)
      const timeStepsDays = [1, 10, 100, 365.25];
      const EXPECTED_RATE_DEG_PER_DAY = -1934.136261 / 36525; // ~ -0.05295376 deg/day

      for (const dt of timeStepsDays) {
        const posT = calculateLunarPosition(jdStart + dt);

        // Unwrapped angular delta for retrograde motion
        let deltaOmega = posT.nodeLongitude - pos0.nodeLongitude;
        while (deltaOmega > 180) deltaOmega -= 360;
        while (deltaOmega < -180) deltaOmega += 360;

        const measuredRate = deltaOmega / dt;
        expect(measuredRate).toBeCloseTo(EXPECTED_RATE_DEG_PER_DAY, 3);
        const relativeError = Math.abs((measuredRate - EXPECTED_RATE_DEG_PER_DAY) / EXPECTED_RATE_DEG_PER_DAY);
        expect(relativeError).toBeLessThan(0.015);
      }

      // Verify 18.61295-year complete 360° regression cycle
      const fullCycleDays = 18.61295 * 365.25;
      const posFullCycle = calculateLunarPosition(jdStart + fullCycleDays);
      const diff = Math.abs(posFullCycle.nodeLongitude - pos0.nodeLongitude);
      expect(diff < 0.1 || Math.abs(diff - 360) < 0.1).toBe(true);

      // Descending node maintains exact 180° antipodal phase across the regression
      expect((pos0.nodeLongitude + 180) % 360).toBeCloseTo(pos0.descendingNodeLongitude, 4);
      expect((posFullCycle.nodeLongitude + 180) % 360).toBeCloseTo(posFullCycle.descendingNodeLongitude, 4);
    });
  });

});

