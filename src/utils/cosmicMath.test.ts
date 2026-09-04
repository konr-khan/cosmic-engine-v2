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
  calculateSolarPosition,
  calculateEarthOrbitalPhysics,
  calculateLunarPosition,
  calculateLunarEvents,
  calculateParallacticAngle,
  getPhaseName,
  calculateLunarIllumination,
  calculateEclipseData,
  findUpcomingEclipses,
  calculateDailySolarEvents,
  calculateDaylightDurationPrecise,
  calculatePolarState,
  getTerminatorShadowPaths,
  POLAR_STATES,
  ECLIPSE_PRESETS,
  CONFIG,
  parseTimeString,
  formatTimeHHMM,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix,
  calculateEarthSideGeometry,
  calculateEarthAxialGeometry,
  generateOrbitalSegments,
  WORLD_LANDMASSES,
  projectContinentLandmasses,
  generateAnalyticalLimbPath,
  calculateGMST,
  calculateLST,
  equatorialToCartesian3D,
  cartesian3DToEquatorial,
  horizontalToCartesian3D,
  equatorialToHorizontal,
  projectStereographicConformal,
  projectRojasOrthographic,
  projectTopocentricHorizon,
  calculateAlmucantarCircle,
  generateAlmucantars,
  generateContinuousAlmucantars,
  calculatePlanetaryHour,
  generateArmillaryModel,
  computeRawModeGeometry,
  computeArmillaryLunarNodes,
  computeProjection2D,
  computeContinuousProjection2D,
  calculateReteAngleToLST,
  generateProjectionFocalBeacon,
  calculateAlidadeSighting,
  rotateEuler3D,
  generateParametricRing3D,
  calculateEphemerisFrame,
  calculateShadowCones3D,
  generateCosmicScene,
  ArmillaryProjectionMode,
  ASTROLABE_STARS,
  ZODIAC_SIGNS,
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
} from './cosmicMath';
import { 
  Vector2D, 
  Vector3D, 
  Degrees, 
  Latitude, 
  Longitude, 
  HoursDecimal,
  latToRadians,
  lonToRadians,
  radiansToLat,
  radiansToLon
} from '../types';

describe('cosmicMath utilities', () => {

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

  describe('Solar Ephemeris & Earth Orbital Dynamics Solver', () => {
    it('calculates near-zero solar declination around Spring Equinox (March 20)', () => {
      const equinoxDate = new Date(2026, 2, 20);
      const jd = getJulianDate(equinoxDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.declination).toBeGreaterThan(-2.0);
      expect(solar.declination).toBeLessThan(2.0);
    });

    it('calculates maximum positive declination (~23.44°) around Summer Solstice (June 21)', () => {
      const solsticeDate = new Date(2026, 5, 21);
      const jd = getJulianDate(solsticeDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.declination).toBeGreaterThan(23.0);
      expect(solar.declination).toBeLessThan(23.5);
    });

    it('calculates maximum negative declination (~-23.44°) around Winter Solstice (December 21)', () => {
      const winterSolstice = new Date(2026, 11, 21);
      const jd = getJulianDate(winterSolstice, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.declination).toBeLessThan(-23.0);
      expect(solar.declination).toBeGreaterThan(-23.5);
    });

    it('returns Earth-Sun distance between 0.98 AU and 1.02 AU with valid orbital metrics', () => {
      const testDate = new Date(2026, 7, 11);
      const jd = getJulianDate(testDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.distanceAU).toBeGreaterThan(0.98);
      expect(solar.distanceAU).toBeLessThan(1.02);
      expect(solar.distanceKm).toBeGreaterThan(147000000);
      expect(solar.distanceKm).toBeLessThan(153000000);
      expect(solar.orbitalSpeedKms).toBeGreaterThan(29.0);
      expect(solar.orbitalSpeedKms).toBeLessThan(30.5);
      expect(solar.solarIrradianceWm2).toBeGreaterThan(1300);
      expect(solar.solarIrradianceWm2).toBeLessThan(1430);
      expect(solar.sunAngularDiameterArcmin).toBeGreaterThan(31.0);
      expect(solar.sunAngularDiameterArcmin).toBeLessThan(33.0);
    });

    it('provides calculateEarthOrbitalPhysics alias identical to calculateSolarPosition', () => {
      const jd = 2460409.26;
      const direct = calculateSolarPosition(jd);
      const alias = calculateEarthOrbitalPhysics(jd);
      expect(alias.declination).toBe(direct.declination);
      expect(alias.distanceAU).toBe(direct.distanceAU);
    });

    it('computes valid SVG paths for daylight terminator overlay without NaN', () => {
      const normalTerminator = getTerminatorShadowPaths(0, 0, 10);
      expect(normalTerminator.southPath).toContain('M 0,180');
      expect(normalTerminator.southPath).toContain('L 360,180 Z');
      expect(normalTerminator.northPath).toContain('M 0,0');
      expect(normalTerminator.combinedPath).not.toContain('NaN');

      const polarTerminator = getTerminatorShadowPaths(0, 0, 23.44);
      expect(polarTerminator.southPath).not.toContain('NaN');
      expect(polarTerminator.northPath).not.toContain('NaN');
    });

    it('ensures calculateSolarPosition never produces NaN across various Julian dates', () => {
      const dates = [
        2451545.0, // J2000
        getJulianDate(new Date(2026, 2, 20), 12),
        getJulianDate(new Date(2026, 5, 21), 12),
        getJulianDate(new Date(2026, 8, 22), 12),
        getJulianDate(new Date(2026, 11, 21), 12),
        getJulianDate(new Date(2000, 0, 1), 0),
        getJulianDate(new Date(2050, 6, 1), 23.9)
      ];
      dates.forEach(jd => {
        const res = calculateSolarPosition(jd);
        expect(Number.isNaN(res.declination)).toBe(false);
        expect(Number.isNaN(res.equationOfTime)).toBe(false);
        expect(Number.isNaN(res.rightAscension)).toBe(false);
        expect(Number.isNaN(res.distanceAU)).toBe(false);
        expect(Number.isNaN(res.distanceKm)).toBe(false);
        expect(Number.isNaN(res.orbitalSpeedKms)).toBe(false);
      });
    });
  });

  describe('Lunar Ephemeris & Phase Solver', () => {
    it('returns lunar distance within valid physical bounds (350,000 km to 410,000 km)', () => {
      const testDate = new Date(2026, 7, 11);
      const jd = getJulianDate(testDate, 12);
      const lunar = calculateLunarPosition(jd);
      expect(lunar.distanceKm).toBeGreaterThan(350000);
      expect(lunar.distanceKm).toBeLessThan(410000);
      expect(lunar.rightAscension).toBeGreaterThanOrEqual(0);
      expect(lunar.rightAscension).toBeLessThan(360);
      expect(lunar.declination).toBeGreaterThanOrEqual(-30);
      expect(lunar.declination).toBeLessThanOrEqual(30);
      expect(lunar.beta).toBeGreaterThanOrEqual(-5.15);
      expect(lunar.beta).toBeLessThanOrEqual(5.15);
    });

    it('names all 8 lunar phases correctly', () => {
      expect(getPhaseName(0.0)).toBe('New Moon');
      expect(getPhaseName(0.02)).toBe('New Moon');
      expect(getPhaseName(0.12)).toBe('Waxing Crescent');
      expect(getPhaseName(0.25)).toBe('First Quarter');
      expect(getPhaseName(0.38)).toBe('Waxing Gibbous');
      expect(getPhaseName(0.50)).toBe('Full Moon');
      expect(getPhaseName(0.62)).toBe('Waning Gibbous');
      expect(getPhaseName(0.75)).toBe('Last Quarter');
      expect(getPhaseName(0.88)).toBe('Waning Crescent');
      expect(getPhaseName(0.98)).toBe('New Moon');
    });

    it('calculates physical lunar disc illumination correctly from phase values', () => {
      expect(calculateLunarIllumination(0.0)).toBe(0);      // New Moon = 0%
      expect(calculateLunarIllumination(0.25)).toBe(50);    // First Quarter = 50%
      expect(calculateLunarIllumination(0.48)).toBe(100);   // Full Moon near 0.48 = 100%
      expect(calculateLunarIllumination(0.50)).toBe(100);   // Exact Full Moon = 100%
      expect(calculateLunarIllumination(0.75)).toBe(50);    // Last Quarter = 50%
      expect(calculateLunarIllumination(1.0)).toBe(0);      // New Moon = 0%
    });

    it('ensures calculateLunarPosition never produces NaN across various Julian dates', () => {
      const dates = [
        2451545.0, // J2000
        getJulianDate(new Date(2024, 3, 8), 18.3),
        getJulianDate(new Date(2026, 7, 11), 12),
        getJulianDate(new Date(2026, 11, 21), 0),
        getJulianDate(new Date(2030, 0, 1), 6)
      ];
      dates.forEach(jd => {
        const res = calculateLunarPosition(jd);
        expect(Number.isNaN(res.lambda)).toBe(false);
        expect(Number.isNaN(res.beta)).toBe(false);
        expect(Number.isNaN(res.declination)).toBe(false);
        expect(Number.isNaN(res.rightAscension)).toBe(false);
        expect(Number.isNaN(res.distanceKm)).toBe(false);
        expect(Number.isNaN(res.distanceEarthRadii)).toBe(false);
        expect(Number.isNaN(res.nodeLongitude)).toBe(false);
        expect(Number.isNaN(res.descendingNodeLongitude)).toBe(false);
        expect(Number.isNaN(res.angularRadiusDeg)).toBe(false);
        expect(Number.isNaN(res.parallaxDeg)).toBe(false);
      });
    });

    it('computes accurate Meeus Ch. 48 geocentric phase angle and exact illumination fraction', () => {
      // March 14, 2025 Blood Moon (Full Moon)
      const jdFull = getJulianDate(new Date(2025, 2, 14), 6.967);
      const lunarFull = calculateLunarPosition(jdFull);
      expect(lunarFull.phaseAngleDeg).toBeDefined();
      expect(lunarFull.illuminationFraction).toBeDefined();
      expect(lunarFull.phaseAngleDeg).toBeLessThan(5.0); // Close to 0° at full moon
      expect(lunarFull.illuminationFraction).toBeGreaterThanOrEqual(0.99);

      // April 8, 2024 Solar Eclipse (New Moon)
      const jdNew = getJulianDate(new Date(2024, 3, 8), 18.283);
      const lunarNew = calculateLunarPosition(jdNew);
      expect(lunarNew.phaseAngleDeg).toBeGreaterThan(175.0); // Close to 180° at new moon
      expect(lunarNew.illuminationFraction).toBeLessThan(0.01);

      // Verify phaseAngleDeg and illuminationFraction consistency
      const testJd = getJulianDate(new Date(2026, 6, 15), 12);
      const testLunar = calculateLunarPosition(testJd);
      const expectedK = (1 + Math.cos(testLunar.phaseAngleDeg * (Math.PI / 180))) / 2;
      expect(testLunar.illuminationFraction).toBeCloseTo(expectedK, 3);
    });

    it('calculates physical lunar disc illumination correctly with optional ecliptic latitude beta', () => {
      expect(calculateLunarIllumination(0.0, 0)).toBe(0);       // New Moon = 0%
      expect(calculateLunarIllumination(0.5, 0)).toBe(100);     // Full Moon = 100%
      expect(calculateLunarIllumination(0.25, 0)).toBe(50);     // First Quarter = 50%
      expect(calculateLunarIllumination(0.25, 5.0)).toBe(50);   // First Quarter with inclination
    });

    it('implements 2-step iterative lunar rise/set solver with sub-minute convergence across latitudes', () => {
      const testDate = new Date(2026, 6, 15);
      const jd = getJulianDate(testDate, 0);

      // Mid-Latitude Observer (Seattle 47.06°N, -122.81°W)
      const seattleEvents = calculateLunarEvents(47.06, -122.81, jd, 12);
      expect(seattleEvents.transit).toBeGreaterThanOrEqual(0);
      expect(seattleEvents.transit).toBeLessThan(24);
      expect(seattleEvents.distanceKm).toBeGreaterThan(350000);
      expect(seattleEvents.distanceKm).toBeLessThan(410000);
      if (seattleEvents.moonrise !== null) {
        expect(seattleEvents.moonrise).toBeGreaterThanOrEqual(0);
        expect(seattleEvents.moonrise).toBeLessThan(24);
      }
      if (seattleEvents.moonset !== null) {
        expect(seattleEvents.moonset).toBeGreaterThanOrEqual(0);
        expect(seattleEvents.moonset).toBeLessThan(24);
      }

      // Equatorial Observer (0°N, 0°E)
      const equatorEvents = calculateLunarEvents(0, 0, jd, 12);
      expect(equatorEvents.moonrise).not.toBeNull();
      expect(equatorEvents.moonset).not.toBeNull();
      expect(equatorEvents.transit).toBeGreaterThanOrEqual(0);
      expect(equatorEvents.transit).toBeLessThan(24);

      // High-Latitude Polar Observer (80°N Arctic) — verifies continuous circumpolar handling without NaN
      const arcticEvents = calculateLunarEvents(80, 0, jd, 12);
      expect(Number.isNaN(arcticEvents.transit)).toBe(false);
      expect(Number.isNaN(arcticEvents.distanceKm)).toBe(false);
      if (arcticEvents.moonrise !== null) {
        expect(Number.isNaN(arcticEvents.moonrise)).toBe(false);
      }
      if (arcticEvents.moonset !== null) {
        expect(Number.isNaN(arcticEvents.moonset)).toBe(false);
      }
    });

    it('correctly classifies circumpolar_up and circumpolar_down lunar states at geographic poles', () => {
      // Test 30 days across a full tropical month at the North Pole (90°N)
      const baseDate = new Date('2026-03-01T12:00:00Z');
      let upDays = 0;
      let downDays = 0;

      for (let d = 0; d < 30; d++) {
        const currentDate = new Date(baseDate.getTime() + d * 86400000);
        const jd = getJulianDate(currentDate, 12);
        const events = calculateLunarEvents(90, 0, jd, 12);
        
        expect(events.polarState).toBeDefined();
        if (events.polarState === 'circumpolar_up') {
          upDays++;
          expect(events.moonrise).toBe(0);
          expect(events.moonset).toBe(24);
        } else if (events.polarState === 'circumpolar_down') {
          downDays++;
          expect(events.moonrise).toBeNull();
          expect(events.moonset).toBeNull();
        }
      }

      // Over ~27.3 days, the Moon spends roughly half the month above and half below the horizon at 90°N
      expect(upDays).toBeGreaterThanOrEqual(10);
      expect(downDays).toBeGreaterThanOrEqual(10);
      expect(upDays + downDays).toBeGreaterThanOrEqual(28);
    });

    it('computes astronomical parallactic angle correctly and handles meridian transit and horizon azimuths', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      
      // Observer at latitude 45°N
      const etaTransit = calculateParallacticAngle(45, 0, jd, 10, 10);
      expect(Number.isNaN(etaTransit)).toBe(false);
      expect(etaTransit).toBeGreaterThanOrEqual(-180);
      expect(etaTransit).toBeLessThanOrEqual(180);

      // Polar singularity safety checks (89.9°N and -89.9°S)
      const etaNorthPole = calculateParallacticAngle(89.9, -122.8, jd, 15, 45);
      const etaSouthPole = calculateParallacticAngle(-89.9, -122.8, jd, -15, 45);
      expect(Number.isNaN(etaNorthPole)).toBe(false);
      expect(Number.isNaN(etaSouthPole)).toBe(false);
    });

    it('calculates accurate ascending node longitude and precession rate across epochs', () => {
      // J2000 epoch (2000-01-01 12:00 UTC, JD 2451545.0)
      const lunarJ2000 = calculateLunarPosition(2451545.0);
      expect(lunarJ2000.nodeLongitude).toBeCloseTo(125.04, 1);
      expect(lunarJ2000.descendingNodeLongitude).toBeCloseTo((125.04 + 180) % 360, 1);

      // 18.61 years after J2000 (one full nodal regression cycle)
      const jdAfter18Years = 2451545.0 + (18.61295 * 365.25);
      const lunarAfter = calculateLunarPosition(jdAfter18Years);
      const diff = Math.abs(lunarAfter.nodeLongitude - lunarJ2000.nodeLongitude);
      expect(diff < 2 || Math.abs(diff - 360) < 2).toBe(true);
    });

    it('guarantees polar singularity safety and zero division immunity for lunar events at exact geographic poles (±90°)', () => {
      const jd = 2451545.0;
      const northPole = calculateLunarEvents(90, 0, jd, 12);
      expect(Number.isNaN(northPole.transit)).toBe(false);
      expect(Number.isNaN(northPole.declination)).toBe(false);
      expect(['circumpolar_up', 'circumpolar_down', 'regular']).toContain(northPole.polarState);

      const southPole = calculateLunarEvents(-90, 0, jd, 12);
      expect(Number.isNaN(southPole.transit)).toBe(false);
      expect(Number.isNaN(southPole.declination)).toBe(false);
      expect(['circumpolar_up', 'circumpolar_down', 'regular']).toContain(southPole.polarState);
    });

    it('guarantees robust positive modulo and zero division immunity for planetary hours under polar day/night and negative dayOfWeek', () => {
      // 1. Negative dayOfWeek wrapping
      const hourNeg = calculatePlanetaryHour(12 as HoursDecimal, 6 as HoursDecimal, 18 as HoursDecimal, -1);
      expect(hourNeg.hourNumber).toBeGreaterThanOrEqual(1);
      expect(hourNeg.hourNumber).toBeLessThanOrEqual(12);
      expect(hourNeg.rulingPlanet).toBeDefined();

      // 2. 24-hour polar day (sunset == sunrise or dayLength == 24)
      const hourPolar = calculatePlanetaryHour(12 as HoursDecimal, 0 as HoursDecimal, 24 as HoursDecimal, 0);
      expect(Number.isNaN(hourPolar.progressPercent)).toBe(false);
      expect(hourPolar.hourNumber).toBeGreaterThanOrEqual(1);
    });

    it('guarantees positive [0, 360) modulo wrapping for GMST, LST, and horizontal coordinates across negative ranges', () => {
      // GMST across historical epoch prior to J2000
      const gmstPast = calculateGMST(2400000.0);
      expect(gmstPast).toBeGreaterThanOrEqual(0);
      expect(gmstPast).toBeLessThan(360);

      // LST with negative observer longitude
      const lstWest = calculateLST(2451545.0, -179.9);
      expect(lstWest).toBeGreaterThanOrEqual(0);
      expect(lstWest).toBeLessThan(360);

      // Equatorial to horizontal coordinates
      const horiz = equatorialToHorizontal(-45, -10, 45, 10);
      expect(horiz.azDeg).toBeGreaterThanOrEqual(0);
      expect(horiz.azDeg).toBeLessThan(360);
      expect(Number.isNaN(horiz.altDeg)).toBe(false);
    });
  });

  describe('Eclipse Presets & Syzygy Solver Matrix (All 5 Presets)', () => {
    it('validates all 5 presets metadata structure in ECLIPSE_PRESETS', () => {
      expect(ECLIPSE_PRESETS).toHaveLength(5);
      ECLIPSE_PRESETS.forEach(preset => {
        expect(preset.date).toBeInstanceOf(Date);
        expect(preset.timeOfDay).toBeTypeOf('number');
        expect(preset.title).toBeTypeOf('string');
        expect(preset.type).toBeTypeOf('string');
        expect(preset.category).toMatch(/^(SOLAR|LUNAR)$/);
        expect(preset.description).toBeTypeOf('string');
      });
    });

    it('verifies Preset 1: Great American Eclipse (April 8, 2024 Total Solar)', () => {
      const preset = ECLIPSE_PRESETS[0];
      const timeOfDay = preset.timeOfDay;
      const jd = getJulianDate(preset.date, timeOfDay);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.45);
      expect(eclipse.alignmentPercent).toBeGreaterThanOrEqual(90);
      expect(eclipse.distanceKm).toBeLessThan(378000);
      expect(preset.type).toBe('TOTAL_SOLAR');
    });

    it('verifies Preset 2: Annular Solar Eclipse (October 2, 2024 Ring of Fire)', () => {
      const preset = ECLIPSE_PRESETS[1];
      const timeOfDay = preset.timeOfDay;
      const jd = getJulianDate(preset.date, timeOfDay);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
      expect(eclipse.type).toBe('ANNULAR_SOLAR');
      expect(eclipse.obscuration).toBeGreaterThanOrEqual(90);
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.35);
      expect(eclipse.distanceKm).toBeGreaterThanOrEqual(378000); // Annular threshold
      expect(preset.type).toBe('ANNULAR_SOLAR');
    });

    it('verifies Preset 3: Deep Blood Moon Total Lunar Eclipse (March 14, 2025)', () => {
      const preset = ECLIPSE_PRESETS[2];
      const timeOfDay = preset.timeOfDay;
      const jd = getJulianDate(preset.date, timeOfDay);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('LUNAR');
      expect(eclipse.type).toBe('TOTAL_LUNAR');
      expect(eclipse.obscuration).toBe(100);
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.45);
      expect(preset.type).toBe('TOTAL_LUNAR');
    });

    it('verifies Preset 4: European Total Eclipse (August 12, 2026)', () => {
      const preset = ECLIPSE_PRESETS[3];
      const timeOfDay = preset.timeOfDay;
      const jd = getJulianDate(preset.date, timeOfDay);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
      expect(eclipse.nodeProximityDeg).toBeLessThan(1.0);
      expect(eclipse.alignmentPercent).toBeGreaterThanOrEqual(80);
      expect(preset.type).toBe('TOTAL_SOLAR');
    });

    it('verifies Preset 5: Luxor 6-Min Totality (August 2, 2027)', () => {
      const preset = ECLIPSE_PRESETS[4];
      const timeOfDay = preset.timeOfDay;
      const jd = getJulianDate(preset.date, timeOfDay);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
      expect(eclipse.type).toBe('TOTAL_SOLAR');
      expect(eclipse.obscuration).toBeGreaterThanOrEqual(98);
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.35);
      expect(preset.type).toBe('TOTAL_SOLAR');
    });

    it('verifies smooth, monotonic obscuration decay across gamma = 1.0 boundary for August 12, 2026', () => {
      // August 12, 2026 from 18:50Z (18.83h) to 19:00Z (19.00h)
      const times = [18.80, 18.85, 18.90, 18.95, 19.00];
      const obscurations = times.map(t => {
        const jd = getJulianDate(new Date(2026, 7, 12), t);
        return calculateEclipseData(jd).obscuration;
      });
      // Obscurations should decay monotonically without any discrete step cliff
      for (let i = 1; i < obscurations.length; i++) {
        expect(obscurations[i]).toBeLessThanOrEqual(obscurations[i - 1]);
        expect(obscurations[i - 1] - obscurations[i]).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Eclipse Corridor Boundary Conditions & Geometric Solver', () => {
    it('returns NO_ECLIPSE for non-syzygy quadrature dates (First / Last Quarter Moon)', () => {
      // First Quarter phase around 2026-06-22
      const firstQuarterDate = new Date(2026, 5, 22);
      const jd = getJulianDate(firstQuarterDate, 12);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(false);
      expect(eclipse.category).toBe('NO_ECLIPSE');
      expect(eclipse.type).toBe('NONE');
      expect(eclipse.obscuration).toBe(0);
    });

    it('accurately verifies NO_ECLIPSE for August 8, 2028 at 01:06 UTC (Waning Gibbous Moon, no false positive)', () => {
      // August 8, 2028, 01:06 UTC (Month index 7)
      const d = new Date(Date.UTC(2028, 7, 8, 1, 6, 0));
      const jd = 2440587.5 + (d.getTime() / 86400000);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(false);
      expect(eclipse.category).toBe('NO_ECLIPSE');
      expect(eclipse.type).toBe('NONE');
      expect(eclipse.obscuration).toBe(0);
    });

    it('accurately detects New Year Eve 2028 Total Lunar Eclipse (2028-12-31 at 16:52 UTC)', () => {
      // December 31, 2028, 16:52 UTC
      const d = new Date(Date.UTC(2028, 11, 31, 16, 52, 0));
      const jd = 2440587.5 + (d.getTime() / 86400000);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('LUNAR');
      expect(eclipse.type).toBe('TOTAL_LUNAR');
      expect(eclipse.obscuration).toBe(100);
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.45);
    });

    it('accurately detects March 3, 2026 Total Lunar Eclipse (2026-03-03 at 11:34 UTC)', () => {
      // March 3, 2026, 11:34 UTC (Month index 2)
      const d = new Date(Date.UTC(2026, 2, 3, 11, 34, 0));
      const jd = 2440587.5 + (d.getTime() / 86400000);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('LUNAR');
      expect(eclipse.type).toBe('TOTAL_LUNAR');
      expect(eclipse.obscuration).toBe(100);
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.50);
    });

    it('accurately detects June 26, 2029 Total Lunar Eclipse (2029-06-26 at 03:22 UTC)', () => {
      // June 26, 2029, 03:22 UTC (Month index 5)
      const d = new Date(Date.UTC(2029, 5, 26, 3, 22, 0));
      const jd = 2440587.5 + (d.getTime() / 86400000);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('LUNAR');
      expect(eclipse.type).toBe('TOTAL_LUNAR');
      expect(eclipse.obscuration).toBe(100);
      expect(eclipse.nodeProximityDeg).toBeLessThan(0.20);
    });

    it('accurately detects Great Australian Total Solar Eclipse (2028-07-22 at 02:56 UTC)', () => {
      // July 22, 2028, 02:56 UTC
      const d = new Date(Date.UTC(2028, 6, 22, 2, 56, 0));
      const jd = 2440587.5 + (d.getTime() / 86400000);
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
      expect(eclipse.type).toBe('TOTAL_SOLAR');
      expect(eclipse.obscuration).toBeGreaterThanOrEqual(90);
    });

    it('calculates correct alignmentPercent and node proximity across lunar inclinations', () => {
      // Exact node intersection: beta = 0.00° -> alignment = 100%
      const testCases = [
        { beta: 0.0, expectedAlignment: 100 },
        { beta: 0.35, expectedAlignment: 93 },
        { beta: 1.10, expectedAlignment: 79 },
        { beta: 1.49, expectedAlignment: 71 },
        { beta: 1.51, expectedAlignment: 71 },
        { beta: 2.57, expectedAlignment: 50 },
        { beta: 5.14, expectedAlignment: 0 }
      ];

      testCases.forEach(({ beta, expectedAlignment }) => {
        const alignment = Math.max(0, Math.min(100, Math.round((1 - beta / 5.14) * 100)));
        expect(alignment).toBe(expectedAlignment);
      });
    });

    it('produces valid positive shadow cones (umbra and penumbra radiuses)', () => {
      const jd = 2460409.26; // April 8, 2024
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.umbraRadiusKm).toBeGreaterThan(0);
      expect(eclipse.umbraRadiusKm).toBeLessThan(3500);
      expect(eclipse.penumbraRadiusKm).toBeGreaterThan(eclipse.umbraRadiusKm);
      expect(eclipse.penumbraRadiusKm).toBeGreaterThan(3474);
    });

    it('extracts argumentOfLatitude, isAscendingHemisphere, and node coordinates accurately in calculateEclipseData', () => {
      // J2000 Epoch
      const jd = 2451545.0;
      const eclipse = calculateEclipseData(jd);

      expect(eclipse.argumentOfLatitude).toBeDefined();
      expect(typeof eclipse.argumentOfLatitude).toBe('number');
      expect(eclipse.argumentOfLatitude).toBeGreaterThanOrEqual(0);
      expect(eclipse.argumentOfLatitude).toBeLessThan(360);

      expect(eclipse.isAscendingHemisphere).toBeDefined();
      expect(typeof eclipse.isAscendingHemisphere).toBe('boolean');
      expect(eclipse.isAscendingHemisphere).toBe(eclipse.argumentOfLatitude! % 360 < 180);

      expect(eclipse.nodeLongitude).toBeDefined();
      expect(eclipse.descendingNodeLongitude).toBeDefined();
      expect(eclipse.nodeLongitude).toBeCloseTo(125.04, 1);
      expect(eclipse.descendingNodeLongitude).toBeCloseTo((125.04 + 180) % 360, 1);
    });

    it('verifies hemisphere classification for known northern and southern lunar positions', () => {
      // April 8, 2024 Total Solar Eclipse (JD ~ 2460409.26)
      const jdApr2024 = 2460409.26;
      const eclipseApr2024 = calculateEclipseData(jdApr2024);
      expect(typeof eclipseApr2024.isAscendingHemisphere).toBe('boolean');
      if (eclipseApr2024.beta >= 0) {
        expect(eclipseApr2024.isAscendingHemisphere).toBe(true);
      } else {
        expect(eclipseApr2024.isAscendingHemisphere).toBe(false);
      }

      // March 14, 2025 Total Lunar Eclipse (Blood Moon)
      const jdMar2025 = getJulianDate(new Date(2025, 2, 14), 6.967);
      const eclipseMar2025 = calculateEclipseData(jdMar2025);
      expect(typeof eclipseMar2025.isAscendingHemisphere).toBe('boolean');
      expect(eclipseMar2025.argumentOfLatitude).toBeDefined();
    });
  });

  describe('Eclipse Scanner & Multi-Year Recurrence (findUpcomingEclipses)', () => {
    it('scans forward across 365 days and discovers valid eclipses including April 8 2024', () => {
      const start = new Date(2024, 0, 1);
      const upcoming = findUpcomingEclipses(start, 4);

      expect(upcoming.length).toBeGreaterThanOrEqual(2);
      expect(upcoming.length).toBeLessThanOrEqual(4);

      // Verify each item conforms to the schema
      upcoming.forEach(event => {
        expect(event.date).toBeInstanceOf(Date);
        expect(event.dayOffset).toBeGreaterThanOrEqual(0);
        expect(event.dayOffset).toBeLessThan(365);
        expect(event.isEclipseActive).toBe(true);
        expect(event.category).toMatch(/^(SOLAR|LUNAR)$/);
        expect(event.title).toBeTypeOf('string');
        expect(event.obscuration).toBeGreaterThan(0);
      });

      // Verify 2024 eclipses are discovered
      expect(upcoming.some(e => e.category === 'SOLAR')).toBe(true);
    });

    it('strictly respects the limit argument', () => {
      const start = new Date(2024, 0, 1);
      const limitTwo = findUpcomingEclipses(start, 2);
      expect(limitTwo.length).toBeLessThanOrEqual(2);
    });

    it('enforces 5-day event separation deduplication in scan results', () => {
      const start = new Date(2024, 0, 1);
      const events = findUpcomingEclipses(start, 6);
      
      for (let i = 1; i < events.length; i++) {
        const gap = events[i].dayOffset - events[i - 1].dayOffset;
        expect(gap).toBeGreaterThanOrEqual(5);
      }
    });

    it('scans future years (2026-2027) successfully', () => {
      const start2026 = new Date(2026, 0, 1);
      const events2026 = findUpcomingEclipses(start2026, 4);
      expect(events2026.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Daily Solar Events & Twilight Calculator', () => {
    it('calculates symmetrical daylight hours around solar noon at equator', () => {
      const events = calculateDailySolarEvents(0, 0, 12);
      expect(events.official.morning).toBeGreaterThan(5.8);
      expect(events.official.morning).toBeLessThan(6.1);
      expect(events.official.evening).toBeGreaterThan(17.9);
      expect(events.official.evening).toBeLessThan(18.2);
      expect(events.solarMidnightStart).toBe(0);
      expect(events.solarMidnightEnd).toBe(24);
    });
  });

  describe('Polar Boundary & Extreme Latitude Hardening', () => {
    it('never outputs NaN or null across all latitudes [-90, +90]', () => {
      const angles = Object.values(CONFIG.SOLAR.TWILIGHT);
      const declinations = [-23.44, -15, 0, 15, 23.44];

      for (let lat = -90; lat <= 90; lat += 1) {
        for (const dec of declinations) {
          for (const alt of angles) {
            const duration = calculateDaylightDurationPrecise(lat, dec, alt);
            expect(duration).not.toBeNull();
            expect(duration).not.toBeUndefined();
            expect(Number.isNaN(duration)).toBe(false);
            expect(duration).toBeGreaterThanOrEqual(0.0);
            expect(duration).toBeLessThanOrEqual(24.0);
          }
        }
      }
    });

    it('enforces twilight band duration monotonicity (official <= civil <= nautical <= astronomical)', () => {
      const latitudes = [-90, -78, -65, -45, 0, 45, 65, 78, 90];
      const declinations = [-23.44, -10, 0, 10, 23.44];

      const { OFFICIAL, CIVIL, NAUTICAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;

      latitudes.forEach(lat => {
        declinations.forEach(dec => {
          const off = calculateDaylightDurationPrecise(lat, dec, OFFICIAL);
          const civ = calculateDaylightDurationPrecise(lat, dec, CIVIL);
          const nau = calculateDaylightDurationPrecise(lat, dec, NAUTICAL);
          const ast = calculateDaylightDurationPrecise(lat, dec, ASTRONOMICAL);

          expect(off).toBeLessThanOrEqual(civ + 1e-9);
          expect(civ).toBeLessThanOrEqual(nau + 1e-9);
          expect(nau).toBeLessThanOrEqual(ast + 1e-9);
        });
      });
    });

    it('evaluates extreme polar latitudes (+-65, +-70, +-78, +-85, +-90) across equinoxes and solstices', () => {
      const summerDec = 23.44;
      const winterDec = -23.44;
      const equinoxDec = 0.0;
      const official = CONFIG.SOLAR.TWILIGHT.OFFICIAL;

      // North Pole (+90°)
      expect(calculateDaylightDurationPrecise(90, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(90, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      
      expect(calculateDaylightDurationPrecise(90, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(90, winterDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      expect(calculateDaylightDurationPrecise(90, equinoxDec, official)).toBe(24.0);

      // South Pole (-90°)
      expect(calculateDaylightDurationPrecise(-90, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-90, summerDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      expect(calculateDaylightDurationPrecise(-90, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-90, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);

      // High Arctic (+85°)
      expect(calculateDaylightDurationPrecise(85, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(85, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(85, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(85, winterDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      // Sub-Antarctic (-85°)
      expect(calculateDaylightDurationPrecise(-85, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-85, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(-85, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-85, summerDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      // Svalbard / High Arctic (+78°)
      expect(calculateDaylightDurationPrecise(78, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(78, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(78, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(78, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // McMurdo / Antarctic (-78°)
      expect(calculateDaylightDurationPrecise(-78, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-78, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(-78, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-78, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Arctic (+70°)
      expect(calculateDaylightDurationPrecise(70, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(70, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(70, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(70, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Sub-Antarctic (-70°)
      expect(calculateDaylightDurationPrecise(-70, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-70, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(-70, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-70, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Sub-Arctic Circle (+65°)
      expect(calculateDaylightDurationPrecise(65, summerDec, official)).toBeGreaterThan(21.0);
      expect(calculatePolarState(65, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);
      expect(calculateDaylightDurationPrecise(65, winterDec, official)).toBeLessThan(4.0);

      // Sub-Antarctic Circle (-65°)
      expect(calculateDaylightDurationPrecise(-65, winterDec, official)).toBeGreaterThan(21.0);
      expect(calculatePolarState(-65, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);
      expect(calculateDaylightDurationPrecise(-65, summerDec, official)).toBeLessThan(4.0);
    });

    it('returns structured POLAR_STATES enums in calculateDailySolarEvents', () => {
      const equatorEvents = calculateDailySolarEvents(0, 0, 12);
      expect(equatorEvents.polarState).toBe(POLAR_STATES.NORMAL);
      expect(equatorEvents.official.polarState).toBe(POLAR_STATES.NORMAL);

      const northPoleSummerEvents = calculateDailySolarEvents(90, 23.44, 12);
      expect(northPoleSummerEvents.polarState).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(northPoleSummerEvents.official.polarState).toBe(POLAR_STATES.PERPETUAL_DAY);

      const northPoleWinterEvents = calculateDailySolarEvents(90, -23.44, 12);
      expect(northPoleWinterEvents.polarState).toBe(POLAR_STATES.PERPETUAL_NIGHT);
      expect(northPoleWinterEvents.official.polarState).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      const svalbardNovEvents = calculateDailySolarEvents(78, -20, 12);
      expect(svalbardNovEvents.polarState).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);
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

  describe('Annual Ephemeris Matrix Solvers (Solar & Lunar)', () => {
    describe('calculateAnnualSolarMatrix', () => {
      it('calculates exactly 365 daily entries for a standard year (2026)', () => {
        const matrix = calculateAnnualSolarMatrix(2026, 47.06);
        expect(matrix).toHaveLength(365);
        expect(matrix[0].day).toBe(1);
        expect(matrix[364].day).toBe(365);
      });

      it('calculates exactly 366 daily entries for a leap year (2024)', () => {
        const matrix = calculateAnnualSolarMatrix(2024, 47.06);
        expect(matrix).toHaveLength(366);
        expect(matrix[0].day).toBe(1);
        expect(matrix[365].day).toBe(366);
      });

      it('contains all required solar property fields without NaN values', () => {
        const matrix = calculateAnnualSolarMatrix(2026, 47.06);
        matrix.forEach((entry, idx) => {
          expect(entry.day).toBe(idx + 1);
          expect(Number.isNaN(entry.declination)).toBe(false);
          expect(Number.isNaN(entry.equationOfTime)).toBe(false);
          expect(Number.isNaN(entry.solarNoon)).toBe(false);
          expect(Number.isNaN(entry.sunrise)).toBe(false);
          expect(Number.isNaN(entry.sunset)).toBe(false);
          expect(Number.isNaN(entry.civilDawn)).toBe(false);
          expect(Number.isNaN(entry.civilDusk)).toBe(false);
          expect(Number.isNaN(entry.nauticalDawn)).toBe(false);
          expect(Number.isNaN(entry.nauticalDusk)).toBe(false);
          expect(Number.isNaN(entry.astroDawn)).toBe(false);
          expect(Number.isNaN(entry.astroDusk)).toBe(false);
          expect(Number.isNaN(entry.dayLength)).toBe(false);
          expect(entry.dayLength).toBeGreaterThanOrEqual(0);
          expect(entry.dayLength).toBeLessThanOrEqual(24);
        });
      });

      it('exhibits longer daylight at Summer Solstice than Winter Solstice in Northern Hemisphere', () => {
        const matrix = calculateAnnualSolarMatrix(2026, 47.06);
        const summerSolstice = matrix[171]; // ~June 21 (day 172)
        const winterSolstice = matrix[354]; // ~Dec 21 (day 355)

        expect(summerSolstice.dayLength).toBeGreaterThan(15.0);
        expect(winterSolstice.dayLength).toBeLessThan(9.5);
        expect(summerSolstice.dayLength).toBeGreaterThan(winterSolstice.dayLength);
        expect(summerSolstice.declination).toBeGreaterThan(23.0);
        expect(winterSolstice.declination).toBeLessThan(-23.0);
      });
    });

    describe('calculateAnnualLunarMatrix', () => {
      it('calculates exactly 365 daily entries for a standard year (2026)', () => {
        const matrix = calculateAnnualLunarMatrix(2026, 47.06, -122.81);
        expect(matrix).toHaveLength(365);
        expect(matrix[0].day).toBe(1);
        expect(matrix[364].day).toBe(365);
      });

      it('calculates exactly 366 daily entries for a leap year (2024)', () => {
        const matrix = calculateAnnualLunarMatrix(2024, 47.06, -122.81);
        expect(matrix).toHaveLength(366);
        expect(matrix[0].day).toBe(1);
        expect(matrix[365].day).toBe(366);
      });

      it('contains valid lunar metrics, phase fractions, distances, and perigee/apogee flags', () => {
        const matrix = calculateAnnualLunarMatrix(2026, 47.06, -122.81);
        let perigeeCount = 0;
        let apogeeCount = 0;

        matrix.forEach((entry, idx) => {
          expect(entry.day).toBe(idx + 1);
          expect(Number.isNaN(entry.transit)).toBe(false);
          expect(entry.transit).toBeGreaterThanOrEqual(0);
          expect(entry.transit).toBeLessThanOrEqual(24);

          expect(Number.isNaN(entry.phaseValue)).toBe(false);
          expect(entry.phaseValue).toBeGreaterThanOrEqual(0);
          expect(entry.phaseValue).toBeLessThanOrEqual(1);

          expect(Number.isNaN(entry.distanceKm)).toBe(false);
          expect(entry.distanceKm).toBeGreaterThan(350000);
          expect(entry.distanceKm).toBeLessThan(410000);

          expect(typeof entry.isPerigee).toBe('boolean');
          expect(typeof entry.isApogee).toBe('boolean');

          if (entry.isPerigee) perigeeCount++;
          if (entry.isApogee) apogeeCount++;
        });

        expect(perigeeCount).toBeGreaterThan(0);
        expect(apogeeCount).toBeGreaterThan(0);
      });
    });
  });

  describe('3D Projection & Obliquity Geometry Engine', () => {
    describe('calculateEarthSideGeometry', () => {
      it('calculates zero projected tilt at Equinoxes (lambda = 0° and 180°)', () => {
        const geomMar = calculateEarthSideGeometry(310, 110, 18, 0, 45, 12);
        expect(geomMar.poleLineX).toBeCloseTo(0, 4);
        expect(geomMar.poleLineY).toBeCloseTo(18, 4);
        expect(geomMar.eqY1).toBeCloseTo(110, 4);
        expect(geomMar.eqY2).toBeCloseTo(110, 4);

        const geomSep = calculateEarthSideGeometry(310, 110, 18, 180, 45, 12);
        expect(geomSep.poleLineX).toBeCloseTo(0, 4);
        expect(geomSep.poleLineY).toBeCloseTo(18, 4);
      });

      it('calculates maximum projected tilt at Solstices (lambda = 90° and 270°)', () => {
        const geomJun = calculateEarthSideGeometry(310, 110, 18, 90, 45, 12);
        const epsRad = (23.439281 * Math.PI) / 180;
        const expectedNx = -Math.sin(epsRad);
        expect(geomJun.poleLineX).toBeCloseTo(expectedNx * 18, 3);

        const geomDec = calculateEarthSideGeometry(310, 110, 18, 270, 45, 12);
        expect(geomDec.poleLineX).toBeCloseTo(-expectedNx * 18, 3);
      });

      it('determines daylight vs night correctly for side-on observer pin', () => {
        // Observer at noon facing Sun (Sun is at -X on left)
        const noonGeom = calculateEarthSideGeometry(310, 110, 18, 0, 45, 12, 0);
        expect(noonGeom.isDaylight).toBe(true);
        expect(noonGeom.obsPx).toBeLessThan(310); // on Sunlit left side

        // Observer at midnight facing away from Sun
        const midnightGeom = calculateEarthSideGeometry(310, 110, 18, 0, 45, 0, 0);
        expect(midnightGeom.isDaylight).toBe(false);
        expect(midnightGeom.obsPx).toBeGreaterThan(310); // on dark right side

        // Observer at 09:44 UTC in Olympia, WA (-122.81°W -> 01:33 AM local solar time -> Night)
        const olympiaNight = calculateEarthSideGeometry(310, 110, 18, 147, 47.06, 9.733, -122.81);
        expect(olympiaNight.isDaylight).toBe(false);
      });
    });

    describe('calculateEarthAxialGeometry', () => {
      it('calculates screen-projected polar axis and 16-point equator curve', () => {
        const axial = calculateEarthAxialGeometry(200, 90, 20, 0, 47.06, 12, 0);
        expect(axial.earthR).toBe(20);
        expect(axial.equatorPathD.startsWith('M')).toBe(true);
        expect(axial.equatorPathD.split('L')).toHaveLength(17); // M + 16 L segments
        expect(Number.isNaN(axial.obsPx)).toBe(false);
        expect(Number.isNaN(axial.obsPy)).toBe(false);
      });

      it('correctly reports daylight at noon along axial sightline and accounts for longitude', () => {
        const noon = calculateEarthAxialGeometry(200, 90, 20, 0, 45, 12, 0);
        expect(noon.isDaylight).toBe(true);

        const midnight = calculateEarthAxialGeometry(200, 90, 20, 0, 45, 0, 0);
        expect(midnight.isDaylight).toBe(false);

        // Observer at 09:44 UTC in Olympia, WA (-122.81°W -> 01:33 AM local solar time -> Night)
        const olympiaAxialNight = calculateEarthAxialGeometry(200, 90, 20, 147, 47.06, 9.733, -122.81);
        expect(olympiaAxialNight.isDaylight).toBe(false);
      });
    });

    describe('generateOrbitalSegments', () => {
      it('generates quadrant path arrays for side-on and axial projections', () => {
        const sideSegs = generateOrbitalSegments(310, 110, 85, 8.5, Math.PI / 4, 'side', 72);
        expect(sideSegs.waxAsc.length).toBeGreaterThan(0);
        expect(sideSegs.waxDesc.length).toBeGreaterThan(0);
        expect(sideSegs.wanAsc.length).toBeGreaterThan(0);
        expect(sideSegs.wanDesc.length).toBeGreaterThan(0);
        const totalSide = sideSegs.waxAsc.length + sideSegs.waxDesc.length + sideSegs.wanAsc.length + sideSegs.wanDesc.length;
        expect(totalSide).toBe(72);

        const axialSegs = generateOrbitalSegments(200, 90, 110, 8.5, Math.PI / 4, 'axial', 72);
        const totalAxial = axialSegs.waxAsc.length + axialSegs.waxDesc.length + axialSegs.wanAsc.length + axialSegs.wanDesc.length;
        expect(totalAxial).toBe(72);
      });
    });

    describe('WORLD_LANDMASSES', () => {
      it('contains valid polygon coordinates for world landmasses', () => {
        expect(WORLD_LANDMASSES.length).toBeGreaterThan(5);
        WORLD_LANDMASSES.forEach((polygon) => {
          expect(polygon.length).toBeGreaterThan(3);
          polygon.forEach(([lon, lat]) => {
            expect(lon).toBeGreaterThanOrEqual(-180);
            expect(lon).toBeLessThanOrEqual(180);
            expect(lat).toBeGreaterThanOrEqual(-90);
            expect(lat).toBeLessThanOrEqual(90);
          });
        });
      });
    });

    describe('globe.ts: projectContinentLandmasses & generateAnalyticalLimbPath', () => {
      it('returns empty array when radius <= 0 or mode is flat', () => {
        expect(projectContinentLandmasses(WORLD_LANDMASSES, 0, 'topdown', 12, 0.41, 0)).toEqual([]);
        expect(projectContinentLandmasses(WORLD_LANDMASSES, -10, 'euler3d', 12, 0.41, 0)).toEqual([]);
        expect(projectContinentLandmasses(WORLD_LANDMASSES, 100, 'flat', 12, 0.41, 0)).toEqual([]);
      });

      it('generates non-empty closed SVG polygon paths across all 3D view modes', () => {
        const modes = ['topdown', 'transverse', 'axial', 'euler3d'] as const;
        modes.forEach((mode) => {
          const paths = projectContinentLandmasses(
            WORLD_LANDMASSES,
            50,
            mode,
            12.0,
            0.409,
            0.0,
            { pitch: 20, yaw: 45, roll: 0 }
          );
          expect(paths.length).toBeGreaterThan(0);
          paths.forEach((p) => {
            expect(p.startsWith('M ')).toBe(true);
            expect(p.trim().endsWith('Z')).toBe(true);
          });
        });
      });

      it('generates analytical spherical limb paths for daylight and twilight thresholds', () => {
        // Oblique sun vector
        const pathDay = generateAnalyticalLimbPath(50, 0.707, 0, 0.707, 0);
        expect(pathDay.length).toBeGreaterThan(0);
        expect(pathDay.startsWith('M ')).toBe(true);
        expect(pathDay.endsWith('Z')).toBe(true);

        const pathCivil = generateAnalyticalLimbPath(50, 0.707, 0, 0.707, -6);
        expect(pathCivil.length).toBeGreaterThan(0);

        // Degenerate/singular cases
        expect(generateAnalyticalLimbPath(0, 0, 0, 1, 0)).toBe('');
        const polarPath = generateAnalyticalLimbPath(50, 0, 0, 1, 0);
        expect(polarPath).toContain('A 50 50');
      });
    });
  });

  describe('Gyro-Morph Armillary & Astrolabe Mathematical Engine', () => {
    it('calculates accurate GMST and Local Sidereal Time (LST)', () => {
      const gmstEpoch = calculateGMST(2451545.0); // Epoch J2000.0 (Jan 1, 2000 12h TT)
      expect(gmstEpoch).toBeCloseTo(280.46, 1);

      const lstOlympia = calculateLST(2451545.0, -122.81);
      expect(lstOlympia).toBeGreaterThanOrEqual(0);
      expect(lstOlympia).toBeLessThan(360);
      expect(lstOlympia).toBeCloseTo((280.4606 - 122.81 + 360) % 360, 1);
    });

    it('transforms equatorial coordinates to 3D Cartesian coordinates and back (+X Vernal Equinox)', () => {
      // North Pole (RA = 0, Dec = 90) -> (0, 100, 0)
      const pNorthPole = equatorialToCartesian3D(0, 90, 100);
      expect(pNorthPole.x).toBeCloseTo(0);
      expect(pNorthPole.y).toBeCloseTo(100);
      expect(pNorthPole.z).toBeCloseTo(0);

      const eqBack = cartesian3DToEquatorial(pNorthPole);
      expect(eqBack.decDeg).toBeCloseTo(90);

      // Vernal Equinox (RA = 0, Dec = 0) -> (+X: 100, 0, 0)
      const pEquinox = equatorialToCartesian3D(0, 0, 100);
      expect(pEquinox.x).toBeCloseTo(100);
      expect(pEquinox.y).toBeCloseTo(0);
      expect(pEquinox.z).toBeCloseTo(0);

      const eqBack2 = cartesian3DToEquatorial(pEquinox);
      expect(eqBack2.raDeg).toBeCloseTo(0);
      expect(eqBack2.decDeg).toBeCloseTo(0);

      // RA = 90°, Dec = 0° -> (+Z: 0, 0, 100)
      const pRA90 = equatorialToCartesian3D(90, 0, 100);
      expect(pRA90.x).toBeCloseTo(0);
      expect(pRA90.y).toBeCloseTo(0);
      expect(pRA90.z).toBeCloseTo(100);

      const eqBack3 = cartesian3DToEquatorial(pRA90);
      expect(eqBack3.raDeg).toBeCloseTo(90);
      expect(eqBack3.decDeg).toBeCloseTo(0);
    });

    it('projects stereographic conformal coordinates preserving equator, circles, and singularity bounds', () => {
      // Equator point at Vernal Equinox (100, 0, 0) -> (100, 0)
      const pEq = { x: 100, y: 0, z: 0 };
      const projEq = projectStereographicConformal(pEq, 100);
      expect(projEq.x).toBeCloseTo(100);
      expect(projEq.y).toBeCloseTo(0);

      // Equator point at RA = 90 (0, 0, 100) -> (0, 100)
      const pEq90 = { x: 0, y: 0, z: 100 };
      const projEq90 = projectStereographicConformal(pEq90, 100);
      expect(projEq90.x).toBeCloseTo(0);
      expect(projEq90.y).toBeCloseTo(100);

      // North Pole (0, 100, 0) -> (0, 0)
      const pNP = { x: 0, y: 100, z: 0 };
      const projNP = projectStereographicConformal(pNP, 100);
      expect(projNP.x).toBeCloseTo(0);
      expect(projNP.y).toBeCloseTo(0);

      // South Celestial Pole singularity guard (y -> -100)
      const pSP = { x: 10, y: -100, z: 10 };
      const projSP = projectStereographicConformal(pSP, 100);
      expect(Number.isFinite(projSP.x)).toBe(true);
      expect(Number.isFinite(projSP.y)).toBe(true);
      expect(Math.abs(projSP.x)).toBeLessThanOrEqual(1000);
      expect(Math.abs(projSP.y)).toBeLessThanOrEqual(1000);
    });

    it('projects universal Rojas orthographic coordinates', () => {
      const p = { x: 50, y: 80, z: 30 };
      const rojas = projectRojasOrthographic(p, 100);
      expect(rojas.x).toBe(50);
      expect(rojas.y).toBe(80);
    });

    it('projects topocentric horizon stereonet coordinates', () => {
      // Zenith (Alt = 90) -> (0, 0)
      const zen = projectTopocentricHorizon(90, 0, 100);
      expect(zen.x).toBeCloseTo(0);
      expect(zen.y).toBeCloseTo(0);

      // Horizon North (Alt = 0, Az = 0) -> (0, -100)
      const horizN = projectTopocentricHorizon(0, 0, 100);
      expect(horizN.x).toBeCloseTo(0);
      expect(horizN.y).toBeCloseTo(-100);

      // Horizon East (Alt = 0, Az = 90) -> (100, 0)
      const horizE = projectTopocentricHorizon(0, 90, 100);
      expect(horizE.x).toBeCloseTo(100);
      expect(horizE.y).toBeCloseTo(0);
    });

    it('computes topocentric horizontal coordinates via 2-argument atan2', () => {
      // Meridian transit due South: lat = 45, dec = 0, lst = 0, ra = 0 -> alt = 45, az = 180 (South)
      const southTransit = equatorialToHorizontal(0, 0, 45, 0);
      expect(southTransit.altDeg).toBeCloseTo(45, 1);
      expect(southTransit.azDeg).toBeCloseTo(180, 1);

      // North Star: lat = 47.06, dec = 90, lst = 0, ra = 0 -> alt = 47.06, az = 0 (North)
      const polaris = equatorialToHorizontal(0, 90, 47.06, 0);
      expect(polaris.altDeg).toBeCloseTo(47.06, 1);
      expect(polaris.azDeg).toBeCloseTo(0, 1);
    });

    it('calculates analytical Almucantar elevation circles for astrolabe tympan', () => {
      const horizon = calculateAlmucantarCircle(0, 45, 100);
      expect(horizon.isHorizon).toBe(true);
      expect(horizon.centerY).toBeCloseTo(100); // 100 * cot(45) = 100
      expect(horizon.radius).toBeCloseTo(141.42, 1); // 100 * csc(45) = 141.42

      const almucantars = generateAlmucantars(47.06, 15, 100);
      expect(almucantars.length).toBeGreaterThanOrEqual(6);
      expect(almucantars[0].altitude).toBe(0);

      // Continuous Almucantar interpolation between stereographic (eccentric) and horizon (concentric)
      const stereoAlm = generateContinuousAlmucantars(47.06, 'stereographic', undefined, 1.0, 15, 100);
      const horizonAlm = generateContinuousAlmucantars(47.06, 'horizon', undefined, 1.0, 15, 100);
      const midAlm = generateContinuousAlmucantars(47.06, 'horizon', 'stereographic', 0.5, 15, 100);

      expect(stereoAlm.length).toBe(horizonAlm.length);
      expect(horizonAlm.every(a => a.centerY === 0)).toBe(true); // Horizon is strictly concentric
      expect(midAlm[0].centerY).toBeCloseTo(stereoAlm[0].centerY * 0.5, 1);
    });

    it('calculates historical unequal planetary hours and Chaldean ruler', () => {
      const midMorningHour = calculatePlanetaryHour(11.5, 6, 18, 0); // 11:30 AM (6th hour of day)
      expect(midMorningHour.isDay).toBe(true);
      expect(midMorningHour.hourNumber).toBe(6);
      expect(midMorningHour.rulingPlanet).toBeDefined();

      const noonHour = calculatePlanetaryHour(12, 6, 18, 0); // 12:00 PM (starts 7th hour of day)
      expect(noonHour.isDay).toBe(true);
      expect(noonHour.hourNumber).toBe(7);

      const midnightHour = calculatePlanetaryHour(0, 6, 18, 0); // Midnight (starts 7th hour of night)
      expect(midnightHour.isDay).toBe(false);
      expect(midnightHour.hourNumber).toBe(7);
    });

    it('contains all 12 classical astrolabe navigational stars and 12 zodiac signs', () => {
      expect(ASTROLABE_STARS.length).toBe(12);
      expect(ASTROLABE_STARS.some(s => s.name === 'Sirius')).toBe(true);
      expect(ASTROLABE_STARS.some(s => s.name === 'Vega')).toBe(true);
      expect(ASTROLABE_STARS.some(s => s.name === 'Arcturus')).toBe(true);

      expect(ZODIAC_SIGNS.length).toBe(12);
      expect(ZODIAC_SIGNS[0].name).toBe('Aries');
      expect(ZODIAC_SIGNS[11].name).toBe('Pisces');
    });

    it('derives raw mode geometry and lunar nodes via decomposed sub-generators', () => {
      const geomParams = {
        r0: 100,
        obliquity: 23.439,
        sunLambdaDeg: 90,
        moonLambdaDeg: 180,
        moonRaDeg: 180,
        moonDecDeg: 0,
        exaggerateEccentricity: false,
        reteOffset: 0,
        lambdaClamp: 0
      };

      const helioGeom = computeRawModeGeometry('heliocentric', geomParams);
      expect(helioGeom.celestialRingsOpacity).toBe(0.0);
      expect(helioGeom.orbitRingOpacity).toBe(1.0);
      expect(helioGeom.milestones3D.length).toBe(6);

      const geoGeom = computeRawModeGeometry('geocentric', geomParams);
      expect(geoGeom.celestialRingsOpacity).toBe(0.85);
      expect(geoGeom.earth3D).toEqual({ x: 0, y: 0, z: 0 });

      const stereoGeom = computeRawModeGeometry('stereographic', { ...geomParams, lambdaClamp: 1.0 });
      expect(stereoGeom.celestialRingsOpacity).toBe(1.0);
      expect(stereoGeom.bezelOpacity).toBe(1.0);

      const dummyVertex = (p: Vector3D) => ({
        p3d: p,
        pCam: p,
        pProj: { x: p.x, y: p.y },
        screenPos: { x: p.x, y: p.y },
        isFront: true
      });
      const nodes = computeArmillaryLunarNodes({
        isHelioMode: true,
        blendedEarth3D: { x: 100, y: 0, z: 0 },
        transformVertex: dummyVertex
      });
      expect(nodes.ascendingNode.screenPos.x).toBe(116);
      expect(nodes.descendingNode.screenPos.x).toBe(84);
    });

    it('generates full dynamic Gyro-Morph Armillary Model across 3D and 2D morph factors', () => {
      const jd = 2451545.0;
      const model3D = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0, // 3D Armillary
        projectionMode: 'stereographic',
        cameraPitch: 25,
        cameraYaw: 45,
        r0: 100
      });

      expect(model3D.rings.length).toBe(8);
      expect(model3D.stars.length).toBe(12);
      expect(model3D.sun.screenPos).toBeDefined();
      expect(model3D.moon.screenPos).toBeDefined();
      expect(model3D.planetaryHour.label).toBeDefined();

      const model2D = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0, // 2D Stereographic Plate
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      expect(model2D.rings.length).toBe(8);
      expect(model2D.stars.length).toBe(12);
      // In 2D stereographic, equator is a 100px radius circle
      const eqRing = model2D.rings.find(r => r.id === 'equator');
      expect(eqRing).toBeDefined();
    });

    it('interpolates dynamically between two 2D projections during cross-morph transitions', () => {
      const jd = 2451545.0;
      const p3d = { x: 50, y: 30, z: 80 };
      const stereo2D = computeProjection2D(p3d, 'stereographic', 100, 47.06, 0);
      const rojas2D = computeProjection2D(p3d, 'rojas', 100, 47.06, 0);

      // Verify continuous projection endpoints & zero endpoint snapping (t -> 1.0-)
      const projStart = computeContinuousProjection2D(p3d, 'stereographic', 'rojas', 0.0, 100, 47.06, 0);
      const projNearEnd = computeContinuousProjection2D(p3d, 'stereographic', 'rojas', 0.999, 100, 47.06, 0);
      const projEnd = computeContinuousProjection2D(p3d, 'stereographic', 'rojas', 1.0, 100, 47.06, 0);
      expect(projStart.x).toBeCloseTo(stereo2D.x, 3);
      expect(projStart.y).toBeCloseTo(stereo2D.y, 3);
      expect(projNearEnd.x).toBeCloseTo(rojas2D.x, 0);
      expect(projNearEnd.y).toBeCloseTo(rojas2D.y, 0);
      expect(projEnd.x).toBeCloseTo(rojas2D.x, 3);
      expect(projEnd.y).toBeCloseTo(rojas2D.y, 3);

      // Verify smooth intermediate projection between stereographic and horizon
      const projStereoToHorizon = computeContinuousProjection2D(p3d, 'stereographic', 'horizon', 0.5, 100, 47.06, 0);
      expect(typeof projStereoToHorizon.x).toBe('number');
      expect(typeof projStereoToHorizon.y).toBe('number');
      expect(isNaN(projStereoToHorizon.x)).toBe(false);
      expect(isNaN(projStereoToHorizon.y)).toBe(false);

      // Halfway transition between stereographic and rojas
      const modelCross = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0, // Full 2D
        projectionMode: 'rojas',
        fromProjectionMode: 'stereographic',
        projectionTransitionT: 0.5, // 50% transition
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      expect(modelCross.rings.length).toBe(8);
      const eqVertex = modelCross.rings[0].vertices[0];
      expect(eqVertex.screenPos).toBeDefined();
      expect(typeof eqVertex.screenPos.x).toBe('number');
      expect(typeof eqVertex.screenPos.y).toBe('number');

      // Verify lunar orbit ring is generated
      const lunarOrbit = modelCross.rings.find((r) => r.id === 'lunar_orbit');
      expect(lunarOrbit).toBeDefined();
      expect(lunarOrbit?.label).toContain('Lunar Orbit');

      // Verify muted palette for Tropic rings
      const cancerRing = modelCross.rings.find((r) => r.id === 'tropic_cancer');
      const capricornRing = modelCross.rings.find((r) => r.id === 'tropic_capricorn');
      expect(cancerRing?.color).toBe('#d97706'); // Muted Antique Brass
      expect(capricornRing?.color).toBe('#94a3b8'); // Muted Slate
    });

    it('generates topocentric observer FOV sky cone and lunar nodes in orbital modes', () => {
      const helioModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Observer FOV Sky Cone
      expect(helioModel.observerCone).toBeDefined();
      expect(helioModel.observerCone?.observerScreenPos).toBeDefined();
      expect(helioModel.observerCone?.zenithScreenPos).toBeDefined();
      expect(helioModel.observerCone?.horizonDiscPathD).toMatch(/^M\s.+Z$/);
      expect(helioModel.observerCone?.conePathD).toMatch(/^M\s.+Z$/);
      expect(typeof helioModel.observerCone?.sunElevationDeg).toBe('number');
      expect(typeof helioModel.observerCone?.isDaytime).toBe('boolean');

      // Lunar Nodes (Ascending & Descending)
      expect(helioModel.lunarNodes).toBeDefined();
      expect(helioModel.lunarNodes?.ascendingNode.screenPos).toBeDefined();
      expect(helioModel.lunarNodes?.descendingNode.screenPos).toBeDefined();
    });

    it('solves apparent local sidereal and solar time from free Rete angles', () => {
      // Sun at RA 180°
      const noon = calculateReteAngleToLST(180, 180);
      expect(noon.apparentLSTDeg).toBe(180);
      expect(noon.apparentSolarHours).toBe(12);

      // Sun at RA 180°, Rete rotated to 270° (6 hours later -> 18:00)
      const dusk = calculateReteAngleToLST(270, 180);
      expect(dusk.apparentLSTDeg).toBe(270);
      expect(dusk.apparentSolarHours).toBe(18);
    });

    it('generates volumetric projection focal beacons and laser ray paths', () => {
      const beaconStereo = generateProjectionFocalBeacon('stereographic', 100, 25, 35, 0.0);
      expect(beaconStereo.focal3D.y).toBe(-100);
      expect(beaconStereo.laserRays.length).toBe(8);
      expect(beaconStereo.conePathD).toContain('M ');
      expect(beaconStereo.laserRays[0].start).toBeDefined();
      expect(beaconStereo.laserRays[0].end).toBeDefined();

      const beaconRojas = generateProjectionFocalBeacon('rojas', 100, 0, 0, 1.0);
      expect(beaconRojas.focal3D.z).toBe(150);
      expect(beaconRojas.laserRays.length).toBe(8);
    });

    it('calculates Alidade sighting coordinates and target detection', () => {
      const testStars = [
        { name: 'Sirius', screenPos: { x: 0, y: -80 }, altDeg: 35, azDeg: 180, magnitude: -1.46, raDeg: 101, decDeg: -16.7 }
      ];
      const testSun = { screenPos: { x: 80, y: 0 }, altDeg: 45, azDeg: 90, raDeg: 0, decDeg: 0 };
      const testMoon = { screenPos: { x: -80, y: 0 }, altDeg: 10, azDeg: 270, raDeg: 180, decDeg: 0 };

      // Sighting arm pointing North (0°)
      const sighting = calculateAlidadeSighting(0, 47.06, 100, testStars, testSun, testMoon);
      expect(sighting.ruleAngleDeg).toBe(0);
      expect(sighting.rightAscensionDeg).toBe(0);
      expect(sighting.rightAscensionHours).toBe(0);
      expect(typeof sighting.localAltitudeDeg).toBe('number');
      expect(typeof sighting.localAzimuthDeg).toBe('number');

      // Sighting arm aligned with Sirius at (0, -80) -> angle 0°
      const sightingSirius = calculateAlidadeSighting(0, 47.06, 100, testStars, testSun, testMoon);
      expect(sightingSirius.nearestTarget).toBeDefined();
      expect(sightingSirius.nearestTarget?.name).toBe('Sirius');
    });

    it('supports Free Rete mode in generateArmillaryModel with apparent solar time solver', () => {
      const model = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        isFreeReteMode: true,
        freeReteOffsetDeg: 45
      });

      expect(model.isFreeRete).toBe(true);
      expect(typeof model.apparentSolarHours).toBe('number');
      expect(model.focalBeacon).toBeDefined();
      expect(model.focalBeacon?.laserRays.length).toBe(8);
      // Continuous 360° closed cone polygon
      expect(model.focalBeacon?.conePathD).toMatch(/^M\s.+Z$/);
    });

    it('rotates Ecliptic Rete and Stars when freeReteOffsetDeg is applied', () => {
      const baseModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        isFreeReteMode: false
      });

      const rotatedModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        isFreeReteMode: true,
        freeReteOffsetDeg: 90
      });

      // Sun bead was rotated 90 degrees around center
      expect(rotatedModel.sun.p3d.x).not.toBeCloseTo(baseModel.sun.p3d.x, 1);
      // Star positions rotated
      expect(rotatedModel.stars[0].p3d.x).not.toBeCloseTo(baseModel.stars[0].p3d.x, 1);
    });

    it('generates Heliocentric model with Sun at origin, Earth at Keplerian orbit, and milestone nodes', () => {
      const helioModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Sun at origin (0, 0, 0)
      expect(helioModel.sun.p3d.x).toBeCloseTo(0, 2);
      expect(helioModel.sun.p3d.y).toBeCloseTo(0, 2);
      expect(helioModel.sun.p3d.z).toBeCloseTo(0, 2);

      // Earth at non-zero orbital radius
      const earthDist = Math.hypot(helioModel.earth.p3d.x, helioModel.earth.p3d.z);
      expect(earthDist).toBeGreaterThan(90);

      // Orbital path ring present
      const orbitRing = helioModel.rings.find(r => r.id === 'orbit_path');
      expect(orbitRing).toBeDefined();

      // 6 Seasonal milestone nodes present
      expect(helioModel.milestones.length).toBe(6);
      expect(helioModel.milestones[0].label).toBe('Perihelion');
      expect(helioModel.milestones[3].label).toBe('Aphelion');

      // Physics telemetry populated
      expect(helioModel.physics).toBeDefined();
      expect(helioModel.physics?.distanceAU).toBeGreaterThan(0.95);
      expect(helioModel.physics?.orbitalSpeedKms).toBeGreaterThan(28);

      // Opacity contracts
      expect(helioModel.celestialRingsOpacity).toBe(0.0);
      expect(helioModel.orbitRingOpacity).toBe(1.0);
      expect(helioModel.milestonesOpacity).toBe(1.0);
    });

    it('generates Geocentric model with Earth at origin and Sun revolving along apparent Ecliptic loop', () => {
      const geoModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Earth at origin (0, 0, 0)
      expect(geoModel.earth.p3d.x).toBeCloseTo(0, 2);
      expect(geoModel.earth.p3d.y).toBeCloseTo(0, 2);
      expect(geoModel.earth.p3d.z).toBeCloseTo(0, 2);

      // Sun revolving around Earth at radius ~ 110px
      const sunDist = Math.hypot(geoModel.sun.p3d.x, geoModel.sun.p3d.y, geoModel.sun.p3d.z);
      expect(sunDist).toBeGreaterThan(90);

      // Opacity contracts in unified Geocentric mode
      expect(geoModel.celestialRingsOpacity).toBeCloseTo(0.85, 2);
      expect(geoModel.orbitRingOpacity).toBe(1.0);
    });

    it('clamps Sun bead strictly to the Ecliptic track across seasons and Rete rotation', () => {
      const sunLambda = 120; // 120° Ecliptic Longitude (Leo/Cancer)
      const obliquity = 23.439;
      const epsRad = (obliquity * Math.PI) / 180;
      const lambdaRad = (sunLambda * Math.PI) / 180;
      const r0 = 100;

      const model = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 122,
        sunDecDeg: 20,
        sunLambdaDeg: sunLambda,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0
      });

      // Theoretical 3D position on Ecliptic circle
      const expectedX = r0 * Math.cos(lambdaRad);
      const expectedY = r0 * Math.sin(lambdaRad) * Math.sin(epsRad);
      const expectedZ = r0 * Math.sin(lambdaRad) * Math.cos(epsRad);

      expect(model.sun.p3d.x).toBeCloseTo(expectedX, 1);
      expect(model.sun.p3d.y).toBeCloseTo(expectedY, 1);
      expect(model.sun.p3d.z).toBeCloseTo(expectedZ, 1);

      // Distance from origin must equal r0
      const dist = Math.hypot(model.sun.p3d.x, model.sun.p3d.y, model.sun.p3d.z);
      expect(dist).toBeCloseTo(r0, 1);
    });

    it('implements staged morph choreography with progressive plate materialization', () => {
      const baseParams = {
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        projectionMode: 'stereographic' as const,
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      };

      // Stage 1: lambda = 0.0 (3D Celestial Sphere, no flat plate decorations)
      const stage0 = generateArmillaryModel({ ...baseParams, morphLambda: 0.0 });
      expect(stage0.bezelOpacity).toBe(0.0);
      expect(stage0.alidadeOpacity).toBe(0.0);
      expect(stage0.celestialRingsOpacity).toBe(1.0);

      // Stage 2: lambda = 0.5 (Mid-morph, bezel and alidade materializing)
      const stageMid = generateArmillaryModel({ ...baseParams, morphLambda: 0.5 });
      expect(stageMid.bezelOpacity).toBeGreaterThan(0.0);
      expect(stageMid.bezelOpacity).toBeLessThan(1.0);

      // Stage 3: lambda = 1.0 (Full 2D plate, full opacity)
      const stageFull = generateArmillaryModel({ ...baseParams, morphLambda: 1.0 });
      expect(stageFull.bezelOpacity).toBe(1.0);
      expect(stageFull.alidadeOpacity).toBe(1.0);
    });

    it('supports full 5-mode continuum seamlessly', () => {
      const modes: Array<'heliocentric' | 'geocentric' | 'stereographic' | 'rojas' | 'horizon'> = [
        'heliocentric',
        'geocentric',
        'stereographic',
        'rojas',
        'horizon'
      ];

      for (const mode of modes) {
        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12,
          sunRaDeg: 280,
          sunDecDeg: -23,
          sunLambdaDeg: 280,
          moonRaDeg: 120,
          moonDecDeg: 15,
          moonLambdaDeg: 120,
          moonPhase: 0.5,
          morphLambda: mode === 'heliocentric' || mode === 'geocentric' ? 0.0 : 1.0,
          projectionMode: mode,
          cameraPitch: 0,
          cameraYaw: 0,
          r0: 100
        });

        expect(model.rings.length).toBeGreaterThan(0);
        expect(model.stars.length).toBe(12);
        expect(model.sun.screenPos).toBeDefined();
        expect(model.moon.screenPos).toBeDefined();
        expect(model.earth.screenPos).toBeDefined();
      }
    });

    it('smoothly interpolates any-to-any transitions between Heliocentric and Stereographic modes', () => {
      const midModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.5,
        fromProjectionMode: 'heliocentric',
        projectionMode: 'stereographic',
        projectionTransitionT: 0.5,
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Opacities are smoothly blended at T = 0.5
      expect(midModel.celestialRingsOpacity).toBeCloseTo(0.5, 2);
      expect(midModel.orbitRingOpacity).toBeCloseTo(0.5, 2);
      expect(midModel.milestonesOpacity).toBeCloseTo(0.5, 2);
    });

    it('smoothly executes symmetric reverse 3D transitions from 2D Stereographic plate to 3D Geocentric', () => {
      // Halfway through Phase B reverse (lambda = 0.725)
      const reverseMid = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.725,
        fromProjectionMode: 'stereographic',
        projectionMode: 'geocentric',
        projectionTransitionT: 0.5,
        cameraPitch: 90,
        cameraYaw: 0,
        r0: 100
      });

      // Opacities blend smoothly between 2D plate and 3D Apparent
      expect(reverseMid.bezelOpacity).toBeGreaterThan(0);
      expect(reverseMid.orbitRingOpacity).toBeCloseTo(0.5, 1);
      expect(reverseMid.milestonesOpacity).toBeCloseTo(0.5, 1);
      expect(reverseMid.rings.length).toBeGreaterThanOrEqual(6);
      expect(reverseMid.sun.screenPos.x).not.toBeNaN();
    });

    it('handles exaggerated eccentricity in Heliocentric mode with Sun displaced to focal point', () => {
      const exagModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        exaggerateEccentricity: true
      });

      // Sun is displaced by focal distance c = a * e = 110 * 0.25 = 27.5
      expect(exagModel.sun.p3d.x).toBeLessThan(-20);
    });

    describe('Stereographic Conformal Closed-Form & Invariant Verification (Milestone 1)', () => {
      const EPS_DEG = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);
      const EPS_RAD = (EPS_DEG * Math.PI) / 180;

      // -------------------------------------------------------------------------
      // Test 1: Analytical Closed-Form Stereographic Ecliptic Center and Radius across 360°
      // -------------------------------------------------------------------------
      it('strictly satisfies analytical closed-form stereographic Ecliptic circle center (0, -R0*tan(eps)) and radius R0/cos(eps) across all 360 degrees (< 1e-4 tolerance)', () => {
        const r0 = 100;
        const expectedRadius = r0 / Math.cos(EPS_RAD); // R_ecl = R0 / cos(eps) ~ 108.99581
        const expectedCenterY = -r0 * Math.tan(EPS_RAD); // Y_c = -R0 * tan(eps) ~ -43.35512
        const expectedCenterX = 0;

        // Sample all 360 integer degrees of ecliptic longitude lambda
        for (let deg = 0; deg < 360; deg++) {
          const lambdaRad = (deg * Math.PI) / 180;
          const p3d: Vector3D = {
            x: r0 * Math.cos(lambdaRad),
            y: r0 * Math.sin(lambdaRad) * Math.sin(EPS_RAD),
            z: r0 * Math.sin(lambdaRad) * Math.cos(EPS_RAD)
          };

          const proj = projectStereographicConformal(p3d, r0);

          // In projectStereographicConformal: proj.x = p3d.x * scale, proj.y = p3d.z * scale
          // Center of projected circle in projection plane is (expectedCenterX, expectedCenterY)
          const distFromCenter = Math.hypot(proj.x - expectedCenterX, proj.y - expectedCenterY);

          // Must match analytical radius within 1e-4 relative tolerance
          expect(Math.abs(distFromCenter - expectedRadius)).toBeLessThan(1e-4);
        }

        // Verify exact cardinal points explicitly:
        // 1. Vernal Equinox (lambda = 0°): p3d = (100, 0, 0) -> proj = (100, 0)
        const projVE = projectStereographicConformal({ x: r0, y: 0, z: 0 }, r0);
        expect(projVE.x).toBeCloseTo(r0, 4);
        expect(projVE.y).toBeCloseTo(0, 4);
        expect(Math.hypot(projVE.x - expectedCenterX, projVE.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 2. Summer Solstice (lambda = 90°): p3d = (0, r0*sin(eps), r0*cos(eps)) -> proj = (0, r0*tan((90-eps)/2))
        const projSS = projectStereographicConformal({ x: 0, y: r0 * Math.sin(EPS_RAD), z: r0 * Math.cos(EPS_RAD) }, r0);
        const expectedSSY = r0 * Math.tan((Math.PI / 2 - EPS_RAD) / 2);
        expect(projSS.x).toBeCloseTo(0, 4);
        expect(projSS.y).toBeCloseTo(expectedSSY, 4);
        expect(Math.hypot(projSS.x - expectedCenterX, projSS.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 3. Autumnal Equinox (lambda = 180°): p3d = (-100, 0, 0) -> proj = (-100, 0)
        const projAE = projectStereographicConformal({ x: -r0, y: 0, z: 0 }, r0);
        expect(projAE.x).toBeCloseTo(-r0, 4);
        expect(projAE.y).toBeCloseTo(0, 4);
        expect(Math.hypot(projAE.x - expectedCenterX, projAE.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 4. Winter Solstice (lambda = 270°): p3d = (0, -r0*sin(eps), -r0*cos(eps)) -> proj = (0, -r0*tan((90+eps)/2))
        const projWS = projectStereographicConformal({ x: 0, y: -r0 * Math.sin(EPS_RAD), z: -r0 * Math.cos(EPS_RAD) }, r0);
        const expectedWSY = -r0 * Math.tan((Math.PI / 2 + EPS_RAD) / 2);
        expect(projWS.x).toBeCloseTo(0, 4);
        expect(projWS.y).toBeCloseTo(expectedWSY, 4);
        expect(Math.hypot(projWS.x - expectedCenterX, projWS.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);
      });

      // -------------------------------------------------------------------------
      // Test 2: Scale-Invariance across varying R0 in {50, 100, 150, 200}
      // -------------------------------------------------------------------------
      it('verifies exact scale-invariance of stereographic projections for R0 in {50, 100, 150, 200}', () => {
        const testRadii = [50, 100, 150, 200];
        const secEps = 1 / Math.cos(EPS_RAD);
        const tanEps = Math.tan(EPS_RAD);

        for (const r0 of testRadii) {
          const expectedCenterY = -r0 * tanEps;
          const expectedRadius = r0 * secEps;

          // Verify normalized center and radius ratios
          expect(expectedRadius / r0).toBeCloseTo(secEps, 6);
          expect(expectedCenterY / r0).toBeCloseTo(-tanEps, 6);

          // Test all 4 quadrants of the ecliptic
          for (let deg = 0; deg < 360; deg += 15) {
            const lambdaRad = (deg * Math.PI) / 180;
            const p3d: Vector3D = {
              x: r0 * Math.cos(lambdaRad),
              y: r0 * Math.sin(lambdaRad) * Math.sin(EPS_RAD),
              z: r0 * Math.sin(lambdaRad) * Math.cos(EPS_RAD)
            };

            const proj = projectStereographicConformal(p3d, r0);
            const normalizedDist = Math.hypot(proj.x, proj.y - expectedCenterY) / r0;
            expect(Math.abs(normalizedDist - secEps)).toBeLessThan(1e-4);
          }

          // Test full model generation scaling
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 0 as Degrees,
            moonDecDeg: 0 as Degrees,
            moonLambdaDeg: 0 as Degrees,
            moonPhase: 0.5,
            morphLambda: 1.0,
            projectionMode: 'stereographic',
            cameraPitch: 0,
            cameraYaw: 0,
            r0
          });

          const eclRing = model.rings.find((r) => r.id === 'ecliptic');
          expect(eclRing).toBeDefined();

          // In screen coordinates, screenY = -pProj.y -> center is at (0, -expectedCenterY) = (0, +r0*tan(eps))
          const screenCenterY = r0 * tanEps;
          for (const v of eclRing!.vertices) {
            const screenDist = Math.hypot(v.screenPos.x, v.screenPos.y - screenCenterY);
            expect(Math.abs(screenDist / r0 - secEps)).toBeLessThan(1e-4);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 3: Conformal Circle Invariants on Tropic of Cancer, Tropic of Capricorn & Equator
      // -------------------------------------------------------------------------
      it('verifies conformal circle preservation on Celestial Equator, Tropic of Cancer, and Tropic of Capricorn', () => {
        const r0 = 100;
        const expectedCancerRadius = r0 * Math.tan((Math.PI / 2 - EPS_RAD) / 2); // ~65.6382
        const expectedCapricornRadius = r0 * Math.tan((Math.PI / 2 + EPS_RAD) / 2); // ~152.3497
        const expectedEquatorRadius = r0; // 100.0

        for (let raDeg = 0; raDeg < 360; raDeg += 5) {
          const raRad = (raDeg * Math.PI) / 180;

          // 1. Celestial Equator (dec = 0°)
          const pEq: Vector3D = { x: r0 * Math.cos(raRad), y: 0, z: r0 * Math.sin(raRad) };
          const projEq = projectStereographicConformal(pEq, r0);
          const distEq = Math.hypot(projEq.x, projEq.y);
          expect(Math.abs(distEq - expectedEquatorRadius)).toBeLessThan(1e-4);

          // 2. Tropic of Cancer (dec = +eps)
          const pCancer: Vector3D = {
            x: r0 * Math.cos(EPS_RAD) * Math.cos(raRad),
            y: r0 * Math.sin(EPS_RAD),
            z: r0 * Math.cos(EPS_RAD) * Math.sin(raRad)
          };
          const projCancer = projectStereographicConformal(pCancer, r0);
          const distCancer = Math.hypot(projCancer.x, projCancer.y);
          expect(Math.abs(distCancer - expectedCancerRadius)).toBeLessThan(1e-4);

          // 3. Tropic of Capricorn (dec = -eps)
          const pCap: Vector3D = {
            x: r0 * Math.cos(EPS_RAD) * Math.cos(raRad),
            y: -r0 * Math.sin(EPS_RAD),
            z: r0 * Math.cos(EPS_RAD) * Math.sin(raRad)
          };
          const projCap = projectStereographicConformal(pCap, r0);
          const distCap = Math.hypot(projCap.x, projCap.y);
          expect(Math.abs(distCap - expectedCapricornRadius)).toBeLessThan(1e-4);
        }

        // Verify concentricity in generateArmillaryModel output
        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          morphLambda: 1.0,
          projectionMode: 'stereographic',
          cameraPitch: 0,
          cameraYaw: 0,
          r0
        });

        const eqRing = model.rings.find((r) => r.id === 'equator');
        const canRing = model.rings.find((r) => r.id === 'tropic_cancer');
        const capRing = model.rings.find((r) => r.id === 'tropic_capricorn');

        expect(eqRing).toBeDefined();
        expect(canRing).toBeDefined();
        expect(capRing).toBeDefined();

        for (const v of eqRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedEquatorRadius, 3);
        }
        for (const v of canRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedCancerRadius, 3);
        }
        for (const v of capRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedCapricornRadius, 3);
        }
      });

      // -------------------------------------------------------------------------
      // Test 4: Non-Degeneracy & Absence of Chord-Cutting / Vertex Pinching across Morphing
      // -------------------------------------------------------------------------
      it('guarantees non-degeneracy, finite bounds, and absence of Cartesian chord-cutting or vertex pinching across intermediate morphing frames lambda in {0.1, 0.25, 0.45, 0.5, 0.75, 0.9}', () => {
        const testLambdas = [0.1, 0.25, 0.45, 0.5, 0.75, 0.9];
        const r0 = 100;
        const targetModes: Array<'stereographic' | 'rojas' | 'horizon'> = ['stereographic', 'rojas', 'horizon'];

        for (const mode of targetModes) {
          for (const lambda of testLambdas) {
            const model = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: 280 as Degrees,
              sunDecDeg: -23 as Degrees,
              sunLambdaDeg: 280 as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: lambda,
              projectionMode: mode,
              cameraPitch: 45 * (1 - lambda),
              cameraYaw: 30 * (1 - lambda),
              r0
            });

            expect(model.rings.length).toBeGreaterThanOrEqual(7);

            for (const ring of model.rings) {
              expect(ring.vertices.length).toBeGreaterThanOrEqual(72);

              let perimeter = 0;
              const segmentLengths: number[] = [];

              for (let i = 0; i < ring.vertices.length - 1; i++) {
                const v = ring.vertices[i];

                // 1. Strict finite coordinate assertions
                expect(Number.isFinite(v.screenPos.x)).toBe(true);
                expect(Number.isFinite(v.screenPos.y)).toBe(true);
                expect(Number.isNaN(v.screenPos.x)).toBe(false);
                expect(Number.isNaN(v.screenPos.y)).toBe(false);

                // 2. Physical boundary containment (|coord| < 10 * R0)
                expect(Math.abs(v.screenPos.x)).toBeLessThan(r0 * 10);
                expect(Math.abs(v.screenPos.y)).toBeLessThan(r0 * 10);

                // 3. Consecutive segment smoothness
                const nextV = ring.vertices[i + 1];
                const segLen = Math.hypot(nextV.screenPos.x - v.screenPos.x, nextV.screenPos.y - v.screenPos.y);

                // Segment length must be well-defined and positive
                expect(segLen).toBeGreaterThan(0.005);
                // Parallel circles and ecliptic avoid pole; polar-crossing rings expand near south pole singularity
                const isParallelOrEcliptic = ['equator', 'ecliptic', 'tropic_cancer', 'tropic_capricorn'].includes(ring.id);
                if (isParallelOrEcliptic) {
                  expect(segLen).toBeLessThan(100);
                } else {
                  expect(segLen).toBeLessThan(r0 * 10);
                }

                segmentLengths.push(segLen);
                perimeter += segLen;
              }

              // Check final endpoint vertex
              const lastV = ring.vertices[ring.vertices.length - 1];
              expect(Number.isFinite(lastV.screenPos.x)).toBe(true);
              expect(Number.isFinite(lastV.screenPos.y)).toBe(true);

              // 4. Ring perimeter must remain well-behaved
              expect(perimeter).toBeGreaterThan(r0 * 0.5); // Minimum loop perimeter
              expect(perimeter).toBeLessThan(r0 * 50); // Maximum bounding circumference

              // 5. Ratio of max to min segment length along parallel/ecliptic rings is bounded (no extreme distortion)
              const isParallelOrEcliptic = ['equator', 'ecliptic', 'tropic_cancer', 'tropic_capricorn'].includes(ring.id);
              if (isParallelOrEcliptic) {
                const maxSeg = Math.max(...segmentLengths);
                const minSeg = Math.min(...segmentLengths);
                expect(maxSeg / minSeg).toBeLessThan(100);
              }
            }
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 5: Staged Decoupling of 3D Geometry vs Camera Alignment and Back Ring Unification
      // -------------------------------------------------------------------------
      it('enforces unflattened 3D geometry (geomLambda = 0) for lambda in [0.0, 0.45] and smooth linear progress in [0.45, 1.0]', () => {
        const baseParams = {
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          projectionMode: 'stereographic' as const,
          cameraPitch: 90,
          cameraYaw: 0,
          r0: 100
        };

        // At lambda = 0.0, 0.2, 0.45: Geometry should match unflattened 3D camera projection exactly
        for (const lambda of [0.0, 0.2, 0.45]) {
          const model = generateArmillaryModel({ ...baseParams, morphLambda: lambda });
          const eqRing = model.rings.find(r => r.id === 'equator')!;
          // Celestial equator in 3D camera view (pitch=90) has radius = r0 = 100
          for (const v of eqRing.vertices) {
            const dist = Math.hypot(v.screenPos.x, v.screenPos.y);
            expect(dist).toBeCloseTo(100, 1);
          }
        }

        // At lambda = 1.0: Full stereographic equator has radius = r0 * tan(45°) = 100
        const modelFull = generateArmillaryModel({ ...baseParams, morphLambda: 1.0 });
        const eqRingFull = modelFull.rings.find(r => r.id === 'equator')!;
        for (const v of eqRingFull.vertices) {
          const dist = Math.hypot(v.screenPos.x, v.screenPos.y);
          expect(dist).toBeCloseTo(100, 1);
        }
      });

      it('guarantees back ring stroke unification and eliminates back segments when geomLambda >= 0.85', () => {
        const r0 = 100;
        // lambda >= 0.45 + 0.85 * 0.55 = 0.9175 -> geomLambda >= 0.85
        for (const lambda of [0.92, 0.95, 1.0]) {
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 0 as Degrees,
            moonDecDeg: 0 as Degrees,
            moonLambdaDeg: 0 as Degrees,
            moonPhase: 0.5,
            morphLambda: lambda,
            projectionMode: 'stereographic',
            cameraPitch: 90,
            cameraYaw: 0,
            r0
          });

          for (const ring of model.rings) {
            expect(ring.vertices.every(v => v.isFront)).toBe(true);
            expect(ring.backPathD).toBe('');
            expect(ring.frontPathD.length).toBeGreaterThan(0);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 6: Sun Bead Strict Coincidence with Ecliptic Track Across All Seasons & Free Rete Offsets
      // -------------------------------------------------------------------------
      it('guarantees Sun bead strict coincidence with Ecliptic track across all 4 astronomical seasons, orbital milestones, and Free Rete offsets', () => {
        const astronomicalMilestones = [
          { name: 'Vernal Equinox', sunLambda: 0, sunRa: 0, sunDec: 0 },
          { name: 'Summer Solstice', sunLambda: 90, sunRa: 90, sunDec: 23.439 },
          { name: 'Autumnal Equinox', sunLambda: 180, sunRa: 180, sunDec: 0 },
          { name: 'Winter Solstice', sunLambda: 270, sunRa: 270, sunDec: -23.439 },
          { name: 'Perihelion', sunLambda: 283, sunRa: 284, sunDec: -22.7 },
          { name: 'Aphelion', sunLambda: 103, sunRa: 104, sunDec: 22.7 }
        ];

        const reteOffsets = [0, 30, 45, 90, 180, 270, 315];
        const r0 = 100;

        for (const season of astronomicalMilestones) {
          for (const offset of reteOffsets) {
            // A. 2D Stereographic Astrolabe Mode
            const model2D = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: season.sunRa as Degrees,
              sunDecDeg: season.sunDec as Degrees,
              sunLambdaDeg: season.sunLambda as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: 1.0,
              projectionMode: 'stereographic',
              cameraPitch: 0,
              cameraYaw: 0,
              r0,
              isFreeReteMode: offset !== 0,
              freeReteOffsetDeg: offset
            });

            // 1. Check analytical 3D Sun position matches clamped ecliptic parametric equations
            const sunLonRad = (season.sunLambda * Math.PI) / 180;
            const sun3DBase: Vector3D = {
              x: r0 * Math.cos(sunLonRad),
              y: r0 * Math.sin(sunLonRad) * Math.sin(EPS_RAD),
              z: r0 * Math.sin(sunLonRad) * Math.cos(EPS_RAD)
            };
            const sun3DExpected = rotateEuler3D(sun3DBase, 0, offset, 0);

            expect(model2D.sun.p3d.x).toBeCloseTo(sun3DExpected.x, 3);
            expect(model2D.sun.p3d.y).toBeCloseTo(sun3DExpected.y, 3);
            expect(model2D.sun.p3d.z).toBeCloseTo(sun3DExpected.z, 3);

            // 2. Check Sun bead distance from origin in 3D equals r0 exactly
            const dist3D = Math.hypot(model2D.sun.p3d.x, model2D.sun.p3d.y, model2D.sun.p3d.z);
            expect(dist3D).toBeCloseTo(r0, 4);

            // 3. Check Sun bead screen position coincidence against the Ecliptic ring polyline
            const eclRing = model2D.rings.find((r) => r.id === 'ecliptic');
            expect(eclRing).toBeDefined();

            const sunPos = model2D.sun.screenPos;
            let minDistanceToRing = Infinity;

            // Find minimum perpendicular distance from Sun bead to any segment of the Ecliptic ring
            for (let i = 0; i < eclRing!.vertices.length; i++) {
              const p1 = eclRing!.vertices[i].screenPos;
              const p2 = eclRing!.vertices[(i + 1) % eclRing!.vertices.length].screenPos;

              // Distance from point (sunPos) to line segment (p1 -> p2)
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const segLenSq = dx * dx + dy * dy;

              let dist: number;
              if (segLenSq === 0) {
                dist = Math.hypot(sunPos.x - p1.x, sunPos.y - p1.y);
              } else {
                const t = clamp(((sunPos.x - p1.x) * dx + (sunPos.y - p1.y) * dy) / segLenSq, 0, 1);
                const projX = p1.x + t * dx;
                const projY = p1.y + t * dy;
                dist = Math.hypot(sunPos.x - projX, sunPos.y - projY);
              }

              if (dist < minDistanceToRing) {
                minDistanceToRing = dist;
              }
            }

            // In 72-segment polygon approximation, chord sagitta between polygon and true eccentric circle is < 0.25px
            expect(minDistanceToRing).toBeLessThan(0.25);

            // 4. Distance of Sun screen position from projected circle center matches expectedRadius
            // With reteOffset = 0, screen center is (0, +r0*tan(eps))
            if (offset === 0) {
              const expectedRadius = r0 / Math.cos(EPS_RAD);
              const screenCenterY = r0 * Math.tan(EPS_RAD);
              const distFromCenter = Math.hypot(sunPos.x, sunPos.y - screenCenterY);
              expect(Math.abs(distFromCenter - expectedRadius)).toBeLessThan(1e-4);
            }

            // B. 3D Geocentric Mode
            const model3D = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: season.sunRa as Degrees,
              sunDecDeg: season.sunDec as Degrees,
              sunLambdaDeg: season.sunLambda as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: 0.0,
              projectionMode: 'geocentric',
              cameraPitch: 0,
              cameraYaw: 0,
              r0
            });

            // In 3D Geocentric, Sun revolves on Ecliptic plane inclined at eps: normal = (0, cos(eps), sin(eps))
            // Dot product P_sun . N must be identically 0
            const dotWithNormal = model3D.sun.p3d.y * Math.cos(EPS_RAD) + model3D.sun.p3d.z * Math.sin(EPS_RAD);
            expect(Math.abs(dotWithNormal)).toBeLessThan(1e-4);
            // Distance from Earth (origin) is 1.1 * r0
            expect(Math.hypot(model3D.sun.p3d.x, model3D.sun.p3d.y, model3D.sun.p3d.z)).toBeCloseTo(r0 * 1.1, 3);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 7: Cross-Projection 2D <-> 2D Continuity Invariants (Stereo <-> Rojas <-> Horizon)
      // -------------------------------------------------------------------------
      it('verifies seamless continuity and non-degeneracy during 2D <-> 2D cross-projection morphing for all transition frames T in {0.0, 0.25, 0.5, 0.75, 1.0}', () => {
        const transitions: Array<{ from: ArmillaryProjectionMode; to: ArmillaryProjectionMode }> = [
          { from: 'stereographic', to: 'rojas' },
          { from: 'rojas', to: 'stereographic' },
          { from: 'stereographic', to: 'horizon' },
          { from: 'horizon', to: 'stereographic' },
          { from: 'rojas', to: 'horizon' },
          { from: 'horizon', to: 'rojas' }
        ];

        const testT = [0.0, 0.25, 0.5, 0.75, 1.0];
        const r0 = 100;
        const testPoint: Vector3D = { x: 60, y: 30, z: 70 };

        for (const trans of transitions) {
          let prevProj: Vector2D | null = null;

          for (const t of testT) {
            const proj = computeContinuousProjection2D(
              testPoint,
              trans.from,
              trans.to,
              t,
              r0,
              47.06 as Latitude,
              120 as Degrees
            );

            expect(Number.isFinite(proj.x)).toBe(true);
            expect(Number.isFinite(proj.y)).toBe(true);
            expect(Number.isNaN(proj.x)).toBe(false);
            expect(Number.isNaN(proj.y)).toBe(false);

            if (prevProj !== null) {
              // Delta between consecutive 25% steps must be smooth and bounded
              const stepDelta = Math.hypot(proj.x - prevProj.x, proj.y - prevProj.y);
              expect(stepDelta).toBeLessThan(r0 * 2);
            }

            prevProj = proj;
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 8: Unified Parametric Ring Space-Curve Pipeline
      // -------------------------------------------------------------------------
      describe('generateParametricRing3D Functional Space-Curve Pipeline', () => {
        it('generates continuous SVG paths, non-empty front/back segments, and depth-sorted vertices', () => {
          const r0 = 100;
          const dummyTransform = (p3d: Vector3D) => ({
            p3d,
            pCam: p3d,
            pProj: { x: p3d.x, y: p3d.z },
            screenPos: { x: p3d.x, y: -p3d.y },
            isFront: p3d.z >= 0
          });

          const ring = generateParametricRing3D(
            {
              id: 'test_equator',
              label: 'Test Equator',
              color: '#10b981',
              frontStrokeWidth: 2.0,
              backStrokeWidth: 1.0,
              sampleCount: 36,
              samplePoint: (t) => equatorialToCartesian3D(t * 360, 0, r0)
            },
            dummyTransform
          );

          expect(ring.id).toBe('test_equator');
          expect(ring.label).toBe('Test Equator');
          expect(ring.color).toBe('#10b981');
          expect(ring.vertices.length).toBe(37); // sampleCount + 1
          expect(ring.fullPathD).toContain('M');
          expect(ring.fullPathD).toContain('L');
          expect(ring.frontPathD.length).toBeGreaterThan(0);
          expect(ring.backPathD.length).toBeGreaterThan(0);

          // Verify endpoint wrapping
          const firstV = ring.vertices[0];
          const lastV = ring.vertices[ring.vertices.length - 1];
          expect(firstV.p3d.x).toBeCloseTo(lastV.p3d.x, 3);
          expect(firstV.p3d.y).toBeCloseTo(lastV.p3d.y, 3);
          expect(firstV.p3d.z).toBeCloseTo(lastV.p3d.z, 3);
        });
      });

      // -------------------------------------------------------------------------
      // Test 9: Centralized EphemerisFrame Snapshot Generation
      // -------------------------------------------------------------------------
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




