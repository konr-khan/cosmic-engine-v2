import { describe, it, expect } from 'vitest';
import {
  calculateSubsolarPoint,
  calculateSublunarPoint,
  projectMapX,
  projectMapY,
  buildSeamSafeSvgPath,
  generate24HourGroundTrack,
  findActiveNodalCrossing,
  getLunarNodeProximityTelemetry
} from './terminatorTracks';
import { J2000_JD } from './astroConstants';
import { calculateTrueLunarNodeEvents } from './lunar';

describe('terminatorTracks - Diurnal Ground Tracks & Lunar Node Engine', () => {
  it('calculates valid subsolar coordinates at J2000 epoch', () => {
    const subsolar = calculateSubsolarPoint(J2000_JD);
    expect(subsolar.lat).toBeGreaterThanOrEqual(-24);
    expect(subsolar.lat).toBeLessThanOrEqual(24);
    expect(subsolar.lon).toBeGreaterThanOrEqual(-180);
    expect(subsolar.lon).toBeLessThanOrEqual(180);
  });

  it('calculates valid sublunar coordinates at J2000 epoch', () => {
    const sublunar = calculateSublunarPoint(J2000_JD);
    expect(sublunar.lat).toBeGreaterThanOrEqual(-29);
    expect(sublunar.lat).toBeLessThanOrEqual(29);
    expect(sublunar.lon).toBeGreaterThanOrEqual(-180);
    expect(sublunar.lon).toBeLessThanOrEqual(180);
  });

  it('projects geographic coordinates onto observer-centered equirectangular map', () => {
    const observerLon = -122.81;
    // When lon equals observerLon, it must map exactly to prime center (X = 180)
    expect(projectMapX(observerLon, observerLon)).toBeCloseTo(180, 5);

    // North pole (+90°) maps to Y = 0
    expect(projectMapY(90)).toBe(0);
    // Equator (0°) maps to Y = 90
    expect(projectMapY(0)).toBe(90);
    // South pole (-90°) maps to Y = 180
    expect(projectMapY(-90)).toBe(180);
  });

  it('buildSeamSafeSvgPath prevents horizontal wrap-around streak artifacts', () => {
    // Normal sequential points with no boundary wrap
    const normalPts = [
      { x: 100, y: 50 },
      { x: 90, y: 52 },
      { x: 80, y: 54 }
    ];
    const normalPath = buildSeamSafeSvgPath(normalPts);
    expect(normalPath).toBe('M 100 50 L 90 52 L 80 54');

    // Westward antimeridian wrap from near 0 to near 360
    const wrapWestPts = [
      { x: 5, y: 50 },
      { x: 355, y: 52 }
    ];
    const wrapWestPath = buildSeamSafeSvgPath(wrapWestPts);
    // Must interpolate to 0 and resume at 360 without drawing 5 -> 355
    expect(wrapWestPath).toContain('L 0');
    expect(wrapWestPath).toContain('M 360');

    // Eastward antimeridian wrap from near 360 to near 0
    const wrapEastPts = [
      { x: 355, y: 50 },
      { x: 5, y: 52 }
    ];
    const wrapEastPath = buildSeamSafeSvgPath(wrapEastPts);
    expect(wrapEastPath).toContain('L 360');
    expect(wrapEastPath).toContain('M 0');
  });

  it('generates 24-hour ground tracks with 49 sampled points and distinct past/future paths', () => {
    const sunTrack = generate24HourGroundTrack('sun', J2000_JD, -122.81, 30);
    expect(sunTrack.points.length).toBe(49);
    expect(sunTrack.points[0].hoursOffset).toBe(-12);
    expect(sunTrack.points[24].hoursOffset).toBeCloseTo(0, 5);
    expect(sunTrack.points[48].hoursOffset).toBe(12);

    expect(sunTrack.pastD).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)?/);
    expect(sunTrack.futureD).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)?/);

    const moonTrack = generate24HourGroundTrack('moon', J2000_JD, -122.81, 30);
    expect(moonTrack.points.length).toBe(49);
    expect(moonTrack.pastD).toBeDefined();
    expect(moonTrack.futureD).toBeDefined();
  });

  it('detects active nodal crossing when within +-12 hours of crossing', () => {
    // Find a true node crossing near J2000
    const events = calculateTrueLunarNodeEvents(J2000_JD, 30);
    expect(events.allCrossings.length).toBeGreaterThan(0);

    const targetCrossing = events.allCrossings[0];
    const crossingJD = Number(targetCrossing.jd);

    // When evaluating at exact crossing epoch, crossing should be detected
    const activeMarker = findActiveNodalCrossing(crossingJD, 0);
    expect(activeMarker).not.toBeNull();
    if (activeMarker) {
      expect(activeMarker.type).toBe(targetCrossing.type);
      expect(activeMarker.symbol).toBe(targetCrossing.type === 'ascending' ? '☊' : '☋');
      expect(activeMarker.x).toBeGreaterThanOrEqual(0);
      expect(activeMarker.x).toBeLessThanOrEqual(360);
      expect(activeMarker.y).toBeGreaterThanOrEqual(0);
      expect(activeMarker.y).toBeLessThanOrEqual(180);
      expect(activeMarker.label).toContain(targetCrossing.type === 'ascending' ? 'Ascending' : 'Descending');
    }

    // When evaluating 5 days away from any crossing, activeMarker should be null
    const offTargetJD = crossingJD + 5.0;
    const offMarker = findActiveNodalCrossing(offTargetJD, 0);
    expect(offMarker).toBeNull();
  });

  it('gates hover HUD node proximity telemetry to within +-24 hours', () => {
    const events = calculateTrueLunarNodeEvents(J2000_JD, 30);
    const targetCrossing = events.allCrossings[0];
    const crossingJD = Number(targetCrossing.jd);

    // Within 24h:
    const nearTelemetry = getLunarNodeProximityTelemetry(crossingJD);
    expect(nearTelemetry.isNear).toBe(true);
    expect(nearTelemetry.symbol).toBeDefined();
    expect(nearTelemetry.badgeText).toBeDefined();
    expect(nearTelemetry.hoursToNearestNode).toBeLessThanOrEqual(24);

    // 5 days away:
    const farTelemetry = getLunarNodeProximityTelemetry(crossingJD + 5.0);
    expect(farTelemetry.isNear).toBe(false);
    expect(farTelemetry.badgeText).toBeUndefined();
  });
});
