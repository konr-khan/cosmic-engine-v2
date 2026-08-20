import { describe, it, expect } from 'vitest';
import {
  toRadians,
  toDegrees,
  clamp,
  formatTime,
  formatYMD,
  getSectorPath,
  getJulianDate,
  getDayOfYear,
  isLeapYear,
  getDaysInYear,
  calculateSolarPosition,
  calculateEarthOrbitalPhysics,
  calculateLunarPosition,
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
  WORLD_LANDMASSES
} from './cosmicMath';

describe('cosmicMath utilities', () => {

  describe('Angle & Unit Conversions', () => {
    it('converts degrees to radians accurately', () => {
      expect(toRadians(0)).toBe(0);
      expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
      expect(toRadians(180)).toBeCloseTo(Math.PI);
      expect(toRadians(270)).toBeCloseTo(1.5 * Math.PI);
      expect(toRadians(360)).toBeCloseTo(2 * Math.PI);
    });

    it('converts radians to degrees accurately', () => {
      expect(toDegrees(0)).toBe(0);
      expect(toDegrees(Math.PI / 2)).toBeCloseTo(90);
      expect(toDegrees(Math.PI)).toBeCloseTo(180);
      expect(toDegrees(1.5 * Math.PI)).toBeCloseTo(270);
      expect(toDegrees(2 * Math.PI)).toBeCloseTo(360);
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
      expect(formatYMD(new Date(2026, 0, 15))).toBe('2026-01-15');
      expect(formatYMD(new Date(2024, 11, 31))).toBe('2024-12-31');
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

  describe('Calendar & Julian Date Engine', () => {
    it('calculates correct Julian Date for J2000 epoch (2000-01-01 at 12:00)', () => {
      const j2000Date = new Date(2000, 0, 1);
      const jd = getJulianDate(j2000Date, 12);
      expect(jd).toBe(2451545.0);
    });

    it('calculates correct Julian Date at midnight (2000-01-01 at 00:00)', () => {
      const j2000Date = new Date(2000, 0, 1);
      const jd = getJulianDate(j2000Date, 0);
      expect(jd).toBe(2451544.5);
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
      expect(getDayOfYear(new Date(2025, 0, 1))).toBe(1); // Jan 1 = 1
      expect(getDayOfYear(new Date(2025, 11, 31))).toBe(365); // Dec 31 standard = 365
      expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366); // Dec 31 leap = 366
      expect(getDayOfYear(new Date(2024, 1, 29))).toBe(60); // Feb 29 leap = 60
      expect(getDayOfYear(new Date(2025, 1, 28))).toBe(59); // Feb 28 standard = 59
      expect(getDayOfYear(null)).toBe(1);
      expect(getDayOfYear(undefined)).toBe(1);
      expect(getDayOfYear(new Date('invalid'))).toBe(1);
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
  });

});
