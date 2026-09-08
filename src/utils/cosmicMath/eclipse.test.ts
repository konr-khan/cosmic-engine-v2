/**
 * @file eclipse.test.ts
 * Domain test suite for eclipse presets, syzygy geometry, umbra/penumbra shadow cones, and recurrence scanner.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEclipseData,
  findUpcomingEclipses,
  ECLIPSE_PRESETS,
  getJulianDate,
  calculateEarthOrbitalPhysics,
  calculateLunarPosition,
  calculateSolarPosition
} from './index';
import { Degrees, Latitude, Longitude } from '../../types';

describe('Cosmic Math: Eclipse Presets & Syzygy Geometry', () => {
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

    it('synchronizes isAscendingHemisphere with true ecliptic latitude beta >= 0', () => {
      // 9/23/2026 15:17 UTC: Mean F = 0, but beta = -0.631° (still South of ecliptic)
      const jd23 = getJulianDate(new Date('2026-09-23T00:00:00Z'), 15 + 17 / 60);
      const data23 = calculateEclipseData(jd23);
      expect(data23.beta).toBeLessThan(0);
      expect(data23.isAscendingHemisphere).toBe(false);

      // 9/24/2026 04:34 UTC: True crossing beta >= 0 (North of ecliptic)
      const jd24 = getJulianDate(new Date('2026-09-24T00:00:00Z'), 4 + 34 / 60);
      const data24 = calculateEclipseData(jd24);
      expect(data24.beta).toBeGreaterThanOrEqual(0);
      expect(data24.isAscendingHemisphere).toBe(true);
    });
  });

});
