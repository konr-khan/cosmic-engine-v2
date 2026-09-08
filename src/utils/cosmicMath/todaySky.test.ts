/**
 * @file todaySky.test.ts
 * Unit test suite for sky dome projection, diurnal path generator,
 * and monthly lunar declination extrema solver.
 */

import { describe, it, expect } from 'vitest';
import { 
  projectSkyDomePoint, 
  generateDiurnalPath, 
  calculateMonthlyLunarDeclinationBounds,
  getSolarTwilightStatus,
  getLunarElevationStatus,
  EL_R, 
  EL_CX, 
  EL_CY 
} from './todaySky';

describe('Sky Dome Coordinate Projection (projectSkyDomePoint)', () => {
  it('projects meridian transit (H = 0) exactly onto the central meridian X = EL_CX', () => {
    // Equinox at latitude 45°N
    const pt = projectSkyDomePoint(0, 0, 45);
    expect(pt.x).toBeCloseTo(EL_CX, 4);
    expect(pt.elevation).toBeCloseTo(45, 2);
    expect(pt.y).toBeCloseTo(EL_CY - EL_R * Math.sin((45 * Math.PI) / 180), 2);
  });

  it('projects equinox sunrise and sunset exactly onto East (38, 104) and West (222, 104)', () => {
    // Equinox delta = 0 at any temperate latitude
    const sunrise = projectSkyDomePoint(-90, 0, 45);
    expect(sunrise.x).toBeCloseTo(EL_CX - EL_R, 4); // 130 - 92 = 38
    expect(sunrise.elevation).toBeCloseTo(0, 4);
    expect(sunrise.y).toBeCloseTo(EL_CY, 4); // 104

    const sunset = projectSkyDomePoint(90, 0, 45);
    expect(sunset.x).toBeCloseTo(EL_CX + EL_R, 4); // 130 + 92 = 222
    expect(sunset.elevation).toBeCloseTo(0, 4);
    expect(sunset.y).toBeCloseTo(EL_CY, 4); // 104
  });

  it('ensures body bead projection satisfies clamping invariants', () => {
    const pt = projectSkyDomePoint(180, -23.44, 45);
    // At midnight in winter, elevation is deep below horizon
    expect(pt.elevation).toBeLessThan(-20);
    expect(pt.y).toBeGreaterThan(EL_CY);
  });
});

describe('Diurnal Path Generator (generateDiurnalPath)', () => {
  it('generates an exact Equinox arc connecting East and West on the horizon', () => {
    const res = generateDiurnalPath(47.06, 0);

    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    expect(res.peakAlt).toBeCloseTo(90 - 47.06, 2);
    expect(res.riseHourAngle).toBeCloseTo(90, 2);

    expect(res.risePoint).not.toBeNull();
    expect(res.setPoint).not.toBeNull();
    expect(res.risePoint!.x).toBeCloseTo(EL_CX - EL_R, 1);
    expect(res.risePoint!.y).toBe(EL_CY);
    expect(res.setPoint!.x).toBeCloseTo(EL_CX + EL_R, 1);
    expect(res.setPoint!.y).toBe(EL_CY);

    // SVG path starts at rise and ends at set
    expect(res.pathD.startsWith('M 38.0 104.0')).toBe(true);
    expect(res.pathD.endsWith('222.0 104.0')).toBe(true);
  });

  it('generates Winter Solstice arc with narrower horizon span and lower culmination', () => {
    const res = generateDiurnalPath(47.06, -23.439);

    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    // Culmination at ~19.5°
    expect(res.peakAlt).toBeCloseTo(90 - 47.06 - 23.439, 1);
    expect(res.peakPoint.y).toBeGreaterThan(EL_CY - EL_R * Math.sin((40 * Math.PI) / 180));

    // Sunrise occurs south of east: risePoint.x > EL_CX - EL_R (closer to center)
    expect(res.risePoint!.x).toBeGreaterThan(EL_CX - EL_R);
    expect(res.setPoint!.x).toBeLessThan(EL_CX + EL_R);
    expect(res.risePoint!.y).toBe(EL_CY);
    expect(res.setPoint!.y).toBe(EL_CY);
  });

  it('generates Summer Solstice arc with high culmination and horizon contact', () => {
    const res = generateDiurnalPath(47.06, 23.439);

    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    // Culmination at ~66.38°
    expect(res.peakAlt).toBeCloseTo(90 - 47.06 + 23.439, 1);
    expect(res.riseHourAngle).toBeGreaterThan(90);

    expect(res.risePoint!.y).toBe(EL_CY);
    expect(res.setPoint!.y).toBe(EL_CY);
  });

  it('correctly detects and handles Polar Night', () => {
    // Latitude 75°N, Winter Solstice (-23.44°)
    const res = generateDiurnalPath(75, -23.439);

    expect(res.isPolarNight).toBe(true);
    expect(res.isCircumpolar).toBe(false);
    expect(res.pathD).toBe('');
    expect(res.risePoint).toBeNull();
    expect(res.setPoint).toBeNull();
    expect(res.peakAlt).toBeLessThan(0);
  });

  it('correctly detects and handles Midnight Sun / Circumpolar motion', () => {
    // Latitude 75°N, Summer Solstice (+23.44°)
    const res = generateDiurnalPath(75, 23.439);

    expect(res.isCircumpolar).toBe(true);
    expect(res.isPolarNight).toBe(false);
    expect(res.pathD.length).toBeGreaterThan(0);
    // Culmination at 90 - 75 + 23.44 = 38.44°
    expect(res.peakAlt).toBeCloseTo(38.44, 1);
  });

  it('handles tropical latitudes with overhead zenith culmination (90°)', () => {
    // Latitude 10°N, declination 10°
    const res = generateDiurnalPath(10, 10);
    expect(res.peakAlt).toBeCloseTo(90, 4);
    expect(res.peakPoint.y).toBeCloseTo(EL_CY - EL_R, 4); // Zenith = 12
  });
});

describe('Monthly Lunar Declination Bounds (calculateMonthlyLunarDeclinationBounds)', () => {
  it('computes realistic monthly min and max declination bounds over a 30-day window', () => {
    const testDate = new Date('2026-09-08T12:00:00Z');
    const bounds = calculateMonthlyLunarDeclinationBounds(testDate);

    expect(bounds.minDec).toBeLessThan(0);
    expect(bounds.maxDec).toBeGreaterThan(0);
    // Range between max and min should span a full tropical month excursion (> 35°)
    const range = bounds.maxDec - bounds.minDec;
    expect(range).toBeGreaterThan(35);
    expect(range).toBeLessThan(60);

    // Bounds should not exceed physical Major Standstill limits (±29°)
    expect(bounds.maxDec).toBeLessThanOrEqual(29);
    expect(bounds.minDec).toBeGreaterThanOrEqual(-29);
  });
});

describe('Solar & Lunar Twilight Status Helpers', () => {
  it('correctly maps solar elevation to the 5 twilight phases', () => {
    // Daylight
    const day = getSolarTwilightStatus(25);
    expect(day.phase).toBe('daylight');
    expect(day.label).toBe('Daylight');

    // Civil Twilight (0° to -6°)
    const civil = getSolarTwilightStatus(-3.5);
    expect(civil.phase).toBe('civil_twilight');
    expect(civil.label).toBe('Civil Twilight');

    // Nautical Twilight (-6° to -12°)
    const naut = getSolarTwilightStatus(-8.2);
    expect(naut.phase).toBe('nautical_twilight');
    expect(naut.label).toBe('Nautical Twilight');

    // Astronomical Twilight (-12° to -18°)
    const astro = getSolarTwilightStatus(-14.7);
    expect(astro.phase).toBe('astronomical_twilight');
    expect(astro.label).toBe('Astronomical Twilight');

    // Astronomical Night (<-18°)
    const night = getSolarTwilightStatus(-30);
    expect(night.phase).toBe('night');
    expect(night.label).toBe('Astronomical Night');
  });

  it('correctly maps lunar elevation status', () => {
    expect(getLunarElevationStatus(15).label).toBe('Above Horizon');
    expect(getLunarElevationStatus(-2).label).toBe('Near Horizon');
    expect(getLunarElevationStatus(-25).label).toBe('Below Horizon');
  });

  it('generates twilight sub-horizon path segments for temperate day', () => {
    const res = generateDiurnalPath(47.06, 0);
    expect(res.twilightD).toBeDefined();
    expect(res.twilightD!.length).toBeGreaterThan(0);
    expect(res.twilightD).toContain('M');
    expect(res.twilightD).toContain('L');
  });
});
