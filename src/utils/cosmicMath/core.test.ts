/**
 * @file core.test.ts
 * Domain test suite for core astronomical utilities, Julian dates, time formatting, and angle conversions.
 */

import { describe, it, expect } from 'vitest';
import {
  toRadians,
  toDegrees,
  clamp,
  slerp3D,
  formatTime,
  formatYMD,
  getSectorPath,
  getJulianDate,
  dateToJulianDate,
  julianDateToDate,
  createUTCDate,
  getDayOfYear,
  isLeapYear,
  getDaysInYear,
  parseTimeString,
  formatTimeHHMM,
  calculateEphemerisFrame,
  generateCosmicScene,
  calculateLunarPosition,
  calculateEclipseData,
  calculateEarthAxialGeometry,
  generateAnalyticalLimbPath,
  calculateShadowCones3D,
  J2000_JD,
  ASTRONOMICAL_UNIT_KM,
  EARTH_RADIUS_WGS84_KM,
  MOON_RADIUS_MEAN_KM,
  MOON_DIAMETER_KM,
  EARTH_ORBITAL_SPEED_MEAN_KMS,
  SOLAR_IRRADIANCE_1AU_WM2,
  SUN_ANGULAR_DIAMETER_1AU_ARCMIN,
  EARTH_AXIAL_OBLIQUITY_J2000_DEG,
  LUNAR_PERIGEE_THRESHOLD_KM,
  LUNAR_APOGEE_THRESHOLD_KM
} from './index';
import { 
  Vector3D, 
  Degrees, 
  Latitude, 
  Longitude, 
  HoursDecimal,
  latToRadians,
  lonToRadians,
  radiansToLat,
  radiansToLon
} from '../../types';

describe('Cosmic Math: Core Utilities & Julian Dates', () => {
  describe('Angle & Unit Conversions', () => {
    it('converts degrees to radians accurately', () => {
      expect(toRadians(0)).toBe(0);
      expect(toRadians(180)).toBeCloseTo(Math.PI, 6);
      expect(toRadians(360)).toBeCloseTo(Math.PI * 2, 6);
    });

    it('converts radians to degrees accurately', () => {
      expect(toDegrees(0)).toBe(0);
      expect(toDegrees(Math.PI)).toBeCloseTo(180, 6);
      expect(toDegrees(Math.PI * 2)).toBeCloseTo(360, 6);
    });

    it('performs bidirectional reciprocal conversion between presentation coordinates and nominal radians', () => {
      const testLat: Latitude = 47.06;
      const testLon: Longitude = -122.81;

      const radLat = latToRadians(testLat);
      const radLon = lonToRadians(testLon);

      expect(radLat).toBeCloseTo(47.06 * (Math.PI / 180), 6);
      expect(radLon).toBeCloseTo(-122.81 * (Math.PI / 180), 6);

      const recoveredLat = radiansToLat(radLat);
      const recoveredLon = radiansToLon(radLon);

      expect(recoveredLat).toBeCloseTo(testLat, 6);
      expect(recoveredLon).toBeCloseTo(testLon, 6);
    });

    it('clamps numeric values within boundaries using clamp', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('formats decimal hours to HH:MM:SS format', () => {
      expect(formatTime(12.5)).toBe('12:30:00');
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(23.5)).toBe('23:30:00');
      expect(formatTime(-1)).toBe('23:00:00');
      expect(formatTime(25)).toBe('01:00:00');
      expect(formatTime(NaN)).toBe('--:--:--');
      expect(formatTime(null)).toBe('--:--:--');
      expect(formatTime(undefined)).toBe('--:--:--');
      expect(formatTime(12.99999)).toBe('13:00:00');
      expect(formatTime(23.99999)).toBe('00:00:00');
    });

    it('formats Date objects to YYYY-MM-DD format with formatYMD', () => {
      expect(formatYMD(createUTCDate(2026, 1, 15))).toBe('2026-01-15');
      expect(formatYMD(createUTCDate(2024, 12, 31))).toBe('2024-12-31');
      expect(formatYMD(new Date('invalid'))).toBe('');
      expect(formatYMD(null)).toBe('');
      expect(formatYMD(undefined)).toBe('');
    });

    it('generates SVG sector path wedges with getSectorPath', () => {
      expect(getSectorPath(0, 100, 50)).toBe('');
      const fullPath = getSectorPath(24, 100, 50);
      expect(fullPath).toContain('M 100,50');
      expect(fullPath).toContain('A 50,50');

      const standardPath = getSectorPath(12, 100, 50);
      expect(standardPath).toContain('M 100 100 L');
      expect(standardPath).toContain('Z');

      const longPath = getSectorPath(16, 100, 50);
      expect(longPath).toContain('A 50 50 0 1 1'); // largeArcFlag = 1

      // Symmetrical 12h daylight sector spans 180° centered around 12 o'clock (-90° in SVG)
      expect(standardPath).toContain('A 50 50 0 0 1');
    });
  });

  describe('Spherical Linear Interpolation (slerp3D)', () => {
    it('returns exact endpoints at t=0 and t=1', () => {
      const v1 = { x: 100, y: 0, z: 0 };
      const v2 = { x: 0, y: 100, z: 0 };
      expect(slerp3D(v1, v2, 0)).toEqual(v1);
      expect(slerp3D(v2, v1, 1)).toEqual(v1);
    });

    it('strictly preserves constant radius along great-circle trajectory on S^2', () => {
      const r = 100;
      const v1 = { x: r, y: 0, z: 0 };
      const v2 = { x: 0, y: r, z: 0 };
      
      for (let step = 0; step <= 10; step++) {
        const t = step / 10;
        const vt = slerp3D(v1, v2, t);
        const radius = Math.sqrt(vt.x * vt.x + vt.y * vt.y + vt.z * vt.z);
        expect(radius).toBeCloseTo(r, 4);
      }

      // Midpoint at t=0.5 between (100, 0, 0) and (0, 100, 0) should be (100*cos(45°), 100*sin(45°), 0)
      const mid = slerp3D(v1, v2, 0.5);
      expect(mid.x).toBeCloseTo(100 * Math.SQRT1_2, 4);
      expect(mid.y).toBeCloseTo(100 * Math.SQRT1_2, 4);
      expect(mid.z).toBeCloseTo(0, 4);
    });

    it('smoothly scales magnitude when transitioning from/to origin', () => {
      const origin = { x: 0, y: 0, z: 0 };
      const target = { x: 0, y: 50, z: 50 };
      
      const mid = slerp3D(origin, target, 0.5);
      expect(mid.x).toBeCloseTo(0, 4);
      expect(mid.y).toBeCloseTo(25, 4);
      expect(mid.z).toBeCloseTo(25, 4);

      const midRev = slerp3D(target, origin, 0.5);
      expect(midRev.x).toBeCloseTo(0, 4);
      expect(midRev.y).toBeCloseTo(25, 4);
      expect(midRev.z).toBeCloseTo(25, 4);
    });

    it('handles nearly opposite 180° vectors without NaN singularities', () => {
      const v1 = { x: 100, y: 0, z: 0 };
      const v2 = { x: -100, y: 0, z: 0 };
      const mid = slerp3D(v1, v2, 0.5);
      const rad = Math.sqrt(mid.x * mid.x + mid.y * mid.y + mid.z * mid.z);
      expect(rad).toBeCloseTo(100, 3);
      expect(isNaN(mid.x)).toBe(false);
      expect(isNaN(mid.y)).toBe(false);
      expect(isNaN(mid.z)).toBe(false);
    });

    it('interpolates magnitude linearly when vectors have different radii', () => {
      const v1 = { x: 100, y: 0, z: 0 };
      const v2 = { x: 0, y: 200, z: 0 };
      const mid = slerp3D(v1, v2, 0.5);
      const rad = Math.sqrt(mid.x * mid.x + mid.y * mid.y + mid.z * mid.z);
      expect(rad).toBeCloseTo(150, 4);
    });
  });

  describe('Calendar & Julian Date Engine', () => {
    it('creates deterministic UTC dates using createUTCDate', () => {
      const utcDate = createUTCDate(2026, 3, 20);
      expect(utcDate.getUTCFullYear()).toBe(2026);
      expect(utcDate.getUTCMonth()).toBe(2); // March = 2 (0-indexed)
      expect(utcDate.getUTCDate()).toBe(20);
      expect(utcDate.getUTCHours()).toBe(0);
    });

    it('calculates correct Julian Date for J2000 epoch (2000-01-01 at 12:00)', () => {
      const j2000Date = createUTCDate(2000, 1, 1);
      const jd = getJulianDate(j2000Date, 12);
      expect(jd).toBe(2451545.0);
    });

    it('calculates correct Julian Date at midnight (2000-01-01 at 00:00)', () => {
      const j2000Date = createUTCDate(2000, 1, 1);
      const jd = getJulianDate(j2000Date, 0);
      expect(jd).toBe(2451544.5);
    });

    it('performs bijective conversion between JavaScript Date and Julian Date via dateToJulianDate and julianDateToDate', () => {
      const j2000Utc = new Date(Date.UTC(2000, 0, 1, 12, 0, 0, 0));
      const jd = dateToJulianDate(j2000Utc);
      expect(jd).toBe(2451545.0);

      const recoveredDate = julianDateToDate(jd);
      expect(recoveredDate.getUTCFullYear()).toBe(2000);
      expect(recoveredDate.getUTCMonth()).toBe(0);
      expect(recoveredDate.getUTCDate()).toBe(1);
      expect(recoveredDate.getUTCHours()).toBe(12);
      expect(recoveredDate.getUTCMinutes()).toBe(0);
      expect(recoveredDate.getUTCSeconds()).toBe(0);

      // Fractional day round-trip check
      const d1 = new Date(Date.UTC(2026, 6, 21, 15, 30, 0));
      const jd1 = dateToJulianDate(d1);
      const rec1 = julianDateToDate(jd1);
      expect(rec1.getTime()).toBe(d1.getTime());
    });

    it('identifies leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2028)).toBe(true);
    });

    it('returns 366 days for leap years and 365 for non-leap years', () => {
      expect(getDaysInYear(2024)).toBe(366);
      expect(getDaysInYear(2025)).toBe(365);
      expect(getDaysInYear(2028)).toBe(366);
    });

    it('calculates deterministic UTC-based day of year with getDayOfYear', () => {
      expect(getDayOfYear(createUTCDate(2025, 1, 1))).toBe(1); // Jan 1 = 1
      expect(getDayOfYear(createUTCDate(2025, 12, 31))).toBe(365); // Dec 31 standard = 365
      expect(getDayOfYear(createUTCDate(2024, 12, 31))).toBe(366); // Dec 31 leap = 366
      expect(getDayOfYear(createUTCDate(2024, 2, 29))).toBe(60); // Feb 29 leap = 60
      expect(getDayOfYear(createUTCDate(2025, 2, 28))).toBe(59); // Feb 28 standard = 59
      expect(getDayOfYear(null)).toBe(1);
      expect(getDayOfYear(undefined)).toBe(1);
      expect(getDayOfYear(new Date('invalid'))).toBe(1);
    });

    it('ensures getJulianDate and getDayOfYear are invariant to machine timezone', () => {
      const d1 = new Date(Date.UTC(2026, 0, 15, 0, 0, 0));
      expect(getJulianDate(d1, 12)).toBe(2461056.0);
      expect(getDayOfYear(d1)).toBe(15);
      expect(formatYMD(d1)).toBe('2026-01-15');

      const d2 = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
      expect(getDayOfYear(d2)).toBe(365);
      expect(formatYMD(d2)).toBe('2026-12-31');
    });
  });

  describe('Chronometer Direct Input Time Parsing & Formatting Engine', () => {
    it('parses colon-separated time strings (HH:MM and H:MM)', () => {
      expect(parseTimeString('14:30')).toBeCloseTo(14.5);
      expect(parseTimeString('9:30')).toBeCloseTo(9.5);
      expect(parseTimeString('0:00')).toBe(0);
      expect(parseTimeString('00:15')).toBeCloseTo(0.25);
      expect(parseTimeString('23:59')).toBeCloseTo(23 + 59/60);
    });

    it('parses timestamps with seconds (HH:MM:SS and H:MM:SS)', () => {
      expect(parseTimeString('14:30:15')).toBeCloseTo(14.504167, 4);
      expect(parseTimeString('14:30:30')).toBeCloseTo(14.508333, 4);
      expect(parseTimeString('0:00:30')).toBeCloseTo(30 / 3600, 4);
    });

    it('parses 12-hour AM/PM time strings', () => {
      expect(parseTimeString('2:30 PM')).toBeCloseTo(14.5);
      expect(parseTimeString('11:45 am')).toBeCloseTo(11.75);
      expect(parseTimeString('02:30:15 pm')).toBeCloseTo(14.504167, 4);
      expect(parseTimeString('12:00 AM')).toBe(0);
      expect(parseTimeString('12:30 AM')).toBeCloseTo(0.5);
      expect(parseTimeString('12:00 PM')).toBe(12);
      expect(parseTimeString('12:30 PM')).toBeCloseTo(12.5);
      expect(parseTimeString('2 PM')).toBe(14);
      expect(parseTimeString('12 AM')).toBe(0);
      expect(parseTimeString('2:30pm')).toBeCloseTo(14.5);
    });

    it('parses 4-digit military time strings (HHMM)', () => {
      expect(parseTimeString('1430')).toBeCloseTo(14.5);
      expect(parseTimeString('0930')).toBeCloseTo(9.5);
      expect(parseTimeString('0000')).toBe(0);
      expect(parseTimeString('2359')).toBeCloseTo(23 + 59/60);
    });

    it('parses 3-digit military time strings (HMM)', () => {
      expect(parseTimeString('930')).toBeCloseTo(9.5);
      expect(parseTimeString('100')).toBeCloseTo(1.0);
      expect(parseTimeString('645')).toBeCloseTo(6.75);
    });

    it('parses decimal float strings', () => {
      expect(parseTimeString('14.5')).toBeCloseTo(14.5);
      expect(parseTimeString('14.25')).toBeCloseTo(14.25);
      expect(parseTimeString('9.75')).toBeCloseTo(9.75);
      expect(parseTimeString('0.5')).toBeCloseTo(0.5);
    });

    it('clamps values and handles invalid or empty inputs gracefully', () => {
      expect(parseTimeString('')).toBeUndefined();
      expect(parseTimeString('   ')).toBeUndefined();
      expect(parseTimeString(null)).toBeUndefined();
      expect(parseTimeString(undefined)).toBeUndefined();
      expect(parseTimeString('invalid')).toBeUndefined();
      expect(parseTimeString('25:00')).toBeCloseTo(23.0); // clamped hours
      expect(parseTimeString('12:99')).toBeCloseTo(12 + 59/60); // clamped minutes
      expect(parseTimeString('24.5')).toBe(23.999); // clamped float
      expect(parseTimeString('  14:30  ')).toBeCloseTo(14.5); // whitespace trimming
      expect(parseTimeString(14.5)).toBeCloseTo(14.5); // direct number
    });

    it('formats decimal hours to HH:MM format with formatTimeHHMM', () => {
      expect(formatTimeHHMM(14.5)).toBe('14:30');
      expect(formatTimeHHMM(9.5)).toBe('09:30');
      expect(formatTimeHHMM(0)).toBe('00:00');
      expect(formatTimeHHMM(23.99)).toBe('23:59');
      expect(formatTimeHHMM(-1)).toBe('23:00'); // wrap-around
      expect(formatTimeHHMM(25)).toBe('01:00'); // wrap-around
      expect(formatTimeHHMM(NaN)).toBe('00:00');
      expect(formatTimeHHMM(null)).toBe('00:00');
      expect(formatTimeHHMM(undefined)).toBe('00:00');
    });
  });


      describe('calculateEphemerisFrame Snapshot Invariants', () => {
        it('computes complete, finite, and consistent solar/lunar ephemeris snapshot in a single pass', () => {
          const jd = 2451545.0; // J2000.0 (Jan 1, 2000 12:00 UTC)
          const lat: Latitude = 47.06;
          const lon: Longitude = -122.81;

          const frame = calculateEphemerisFrame(jd, lat, lon, true);

          // Structural presence
          expect(frame.julianDate).toBe(jd);
          expect(Number.isFinite(frame.gmst)).toBe(true);
          expect(Number.isFinite(frame.lst)).toBe(true);
          expect(Number.isFinite(frame.solarNoon)).toBe(true);
          expect(Number.isFinite(frame.dayLength)).toBe(true);
          expect(Number.isFinite(frame.sunrise)).toBe(true);
          expect(Number.isFinite(frame.sunset)).toBe(true);
          expect(Number.isFinite(frame.noonElevation)).toBe(true);

          // Solar metrics
          expect(frame.solarPos).toBeDefined();
          expect(frame.solarPos.distanceAU).toBeGreaterThan(0.98);
          expect(frame.solarPos.distanceAU).toBeLessThan(1.02);

          // Lunar metrics
          expect(frame.lunarPos).toBeDefined();
          expect(frame.lunarPos.distanceKm).toBeGreaterThan(350000);
          expect(frame.lunarPos.distanceKm).toBeLessThan(410000);

          // Subsolar & sublunar geographic coordinates
          expect(frame.subsolarPoint.lat).toBeGreaterThanOrEqual(-90);
          expect(frame.subsolarPoint.lat).toBeLessThanOrEqual(90);
          expect(frame.subsolarPoint.lon).toBeGreaterThanOrEqual(-180);
          expect(frame.subsolarPoint.lon).toBeLessThanOrEqual(180);

          expect(frame.sublunarPoint.lat).toBeGreaterThanOrEqual(-90);
          expect(frame.sublunarPoint.lat).toBeLessThanOrEqual(90);
          expect(frame.sublunarPoint.lon).toBeGreaterThanOrEqual(-180);
          expect(frame.sublunarPoint.lon).toBeLessThanOrEqual(180);
        });
      });

  describe('Astronomical Physical Constants (astroConstants)', () => {
    it('defines standard J2000 epoch and IAU units with correct numerical values', () => {
      expect(J2000_JD).toBe(2451545.0);
      expect(ASTRONOMICAL_UNIT_KM).toBeCloseTo(149597870.7, 1);
      expect(EARTH_RADIUS_WGS84_KM).toBeCloseTo(6378.137, 3);
      expect(MOON_RADIUS_MEAN_KM).toBeCloseTo(1737.4, 1);
      expect(MOON_DIAMETER_KM).toBe(3474.0);
      expect(EARTH_ORBITAL_SPEED_MEAN_KMS).toBeCloseTo(29.7847, 4);
      expect(SOLAR_IRRADIANCE_1AU_WM2).toBe(1361.0);
      expect(SUN_ANGULAR_DIAMETER_1AU_ARCMIN).toBeCloseTo(31.986, 3);
      expect(EARTH_AXIAL_OBLIQUITY_J2000_DEG).toBeCloseTo(23.439281, 6);
      expect(LUNAR_PERIGEE_THRESHOLD_KM).toBe(365000);
      expect(LUNAR_APOGEE_THRESHOLD_KM).toBe(400000);
    });

    it('consistently relates Moon radius and diameter', () => {
      expect(MOON_DIAMETER_KM).toBe(MOON_RADIUS_MEAN_KM * 2 - 0.8); // 3474 vs 2*1737.4 = 3474.8 (standard truncated diameter)
    });
  });


  describe('Degeneracy Clamping & Floating-Point Protection (Wave 4)', () => {
    it('prevents NaN in lunar angular radius and parallax under near-zero distances', () => {
      const jd = J2000_JD;
      const normalPos = calculateLunarPosition(jd);
      expect(Number.isNaN(normalPos.angularRadiusDeg)).toBe(false);
      expect(Number.isNaN(normalPos.parallaxDeg)).toBe(false);
      expect(normalPos.angularRadiusDeg).toBeGreaterThan(0.2);
      expect(normalPos.angularRadiusDeg).toBeLessThan(0.4);
      expect(normalPos.parallaxDeg).toBeGreaterThan(0.8);
      expect(normalPos.parallaxDeg).toBeLessThan(1.2);
    });

    it('prevents NaN in eclipse geometry calculations under synthetic zero or negative distances', () => {
      // Test standard eclipse calculation across a set of diverse dates
      const dates = [
        new Date(2024, 3, 8, 18, 17), // Total solar
        new Date(2026, 7, 12, 17, 47), // Total solar
        new Date(2025, 2, 14, 6, 59), // Total lunar
        new Date(2026, 0, 1, 12, 0)   // Non-eclipse
      ];

      for (const d of dates) {
        const jd = getJulianDate(d, d.getUTCHours() + d.getUTCMinutes() / 60);
        const eclipse = calculateEclipseData(jd);
        expect(Number.isNaN(eclipse.obscuration)).toBe(false);
        expect(Number.isNaN(eclipse.beta)).toBe(false);
        expect(Number.isNaN(eclipse.alignmentPercent)).toBe(false);
        expect(Number.isNaN(eclipse.nodeProximityDeg)).toBe(false);
        expect(Number.isNaN(eclipse.umbraRadiusKm)).toBe(false);
        expect(Number.isNaN(eclipse.penumbraRadiusKm)).toBe(false);
      }
    });

    it('prevents division-by-zero or NaN in projectEarthAxial and calculateEarthAxialGeometry', () => {
      // Test cardinal and extreme cases: equinoxes, solstices, polar observers
      const solarLongitudes = [0, 90, 180, 270, 45, 135, 225, 315];
      const latitudes = [-90, -45, 0, 45, 90];
      const hours = [0, 6, 12, 18, 24];

      for (const sl of solarLongitudes) {
        for (const lat of latitudes) {
          for (const h of hours) {
            const geom = calculateEarthAxialGeometry(100, 100, 50, sl, lat, h, 0);
            expect(Number.isNaN(geom.poleLineX)).toBe(false);
            expect(Number.isNaN(geom.poleLineY)).toBe(false);
            expect(Number.isNaN(geom.obsPx)).toBe(false);
            expect(Number.isNaN(geom.obsPy)).toBe(false);
            expect(geom.equatorPathD).not.toContain('NaN');
          }
        }
      }
    });

    it('prevents zero-division and NaN in generateAnalyticalLimbPath for singular angles and poles', () => {
      // 1. Pure pole sightline (sPerp = 0)
      const pathPoleZ1 = generateAnalyticalLimbPath(100, 0, 0, 1, 0);
      expect(pathPoleZ1).not.toContain('NaN');
      expect(pathPoleZ1).toContain('M 0 -100');

      const pathPoleZ0 = generateAnalyticalLimbPath(100, 0, 0, -1, 0);
      expect(pathPoleZ0).toBe('');

      // 2. Singular 90 deg threshold where cosH0 = 0
      const pathCosH0Zero = generateAnalyticalLimbPath(100, 0.5, 0.5, 0.7071, 90);
      expect(pathCosH0Zero).not.toContain('NaN');

      // 3. Tangent / grazing terminator where mu approaches +/- 1
      const pathGrazing = generateAnalyticalLimbPath(100, 0.99999, 0, 0.0001, 0);
      expect(pathGrazing).not.toContain('NaN');
      expect(pathGrazing.length).toBeGreaterThan(0);
    });

    it('prevents NaN and zero-division in calculateShadowCones3D and generateCosmicScene', () => {
      // 1. Shadow cones with zero / tiny radius
      const conesZero = calculateShadowCones3D(
        { x: 0, y: 0, z: 0 },
        696340,
        { x: 150000000, y: 0, z: 0 },
        0, // zero occluder radius
        { x: 150384400, y: 0, z: 0 }
      );
      expect(Number.isNaN(conesZero.umbraLength)).toBe(false);
      expect(Number.isNaN(conesZero.penumbraLength)).toBe(false);
      expect(Number.isNaN(conesZero.umbraAngle)).toBe(false);
      expect(Number.isNaN(conesZero.penumbraAngle)).toBe(false);

      // 2. generateCosmicScene under both scale modes
      const sceneTrue = generateCosmicScene({ scaleMode: 'true', julianDate: J2000_JD });
      expect(Number.isNaN(sceneTrue.shadowCones.umbraAngle)).toBe(false);
      expect(Number.isNaN(sceneTrue.shadowCones.penumbraAngle)).toBe(false);
      expect(sceneTrue.shadowCones.umbraLengthKm).toBeGreaterThan(0);
      expect(sceneTrue.shadowCones.penumbraLengthKm).toBeGreaterThan(0);

      const sceneExag = generateCosmicScene({ scaleMode: 'exaggerated', julianDate: J2000_JD });
      expect(Number.isNaN(sceneExag.shadowCones.umbraAngle)).toBe(false);
      expect(Number.isNaN(sceneExag.shadowCones.penumbraAngle)).toBe(false);
      expect(sceneExag.shadowCones.umbraLengthKm).toBeGreaterThan(0);
      expect(sceneExag.shadowCones.penumbraLengthKm).toBeGreaterThan(0);
    });
  });
});
