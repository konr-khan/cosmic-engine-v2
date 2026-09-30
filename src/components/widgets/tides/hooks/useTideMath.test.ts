import { describe, it, expect, vi } from 'vitest';
import { useTideMath } from './useTideMath';

// Mock React useMemo to execute immediately in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useMemo: (factory: () => any) => factory()
  };
});

describe('useTideMath Hook Suite', () => {
  it('provides safe fallbacks when parameters are omitted', () => {
    const result = useTideMath({});

    expect(result.safeTides).toEqual({ alignment: 0, rx: 16, ry: 12, type: 'Transitional' });
    expect(result.safeAngles).toEqual({ sunDegrees: 0, moonDegrees: 0 });
    expect(result.safeLocalTideStatus).toBe('Low Tide');
    expect(result.computedPhaseValue).toBe(0);
    expect(result.tideTextColor).toBe('text-amber-400');
    expect(result.localTideColor).toBe('text-slate-400');
    expect(result.sunAngleDeg).toBe(-0);
    expect(result.moonX).toBeCloseTo(60, 2);
    expect(result.moonY).toBeCloseTo(0, 2);
  });

  it('correctly sets styling tokens for aligned high tide', () => {
    const result = useTideMath({
      tides: { alignment: 0.8, rx: 20, ry: 10, type: 'Spring Tide' },
      localTideStatus: 'High Tide'
    });

    expect(result.tideTextColor).toBe('text-indigo-400');
    expect(result.localTideColor).toBe('text-sky-400');
  });

  it('computes phase value from angles when phaseValue is undefined', () => {
    const result = useTideMath({
      angles: { sunDegrees: 0, moonDegrees: 90 }
    });

    expect(result.computedPhaseValue).toBeCloseTo(0.25, 4);
  });

  it('preserves explicit phaseValue when supplied', () => {
    const result = useTideMath({
      angles: { sunDegrees: 0, moonDegrees: 90 },
      phaseValue: 0.5
    });

    expect(result.computedPhaseValue).toBe(0.5);
  });

  it('identifies hemisphere based on sun angle', () => {
    // Sun at 0 deg -> sunAngleDeg = 0 -> cos(0) = 1 >= 0 -> isLeftHemisphere = false
    const rightHem = useTideMath({ angles: { sunDegrees: 0, moonDegrees: 0 } });
    expect(rightHem.isLeftHemisphere).toBe(false);

    // Sun at 180 deg -> sunAngleDeg = -180 -> cos(-180) = -1 < 0 -> isLeftHemisphere = true
    const leftHem = useTideMath({ angles: { sunDegrees: 180, moonDegrees: 0 } });
    expect(leftHem.isLeftHemisphere).toBe(true);
  });

  it('calculates true lunar node crossing events when date or julianDate is supplied (Dead End #16)', () => {
    // J2000 epoch JD 2451545.0
    const result = useTideMath({
      julianDate: 2451545.0,
      angles: { sunDegrees: 280, moonDegrees: 100 }
    });

    expect(result.trueAscNodeLon).toBeGreaterThanOrEqual(0);
    expect(result.trueAscNodeLon).toBeLessThan(360);
    expect(result.trueDescNodeLon).toBeGreaterThanOrEqual(0);
    expect(result.trueDescNodeLon).toBeLessThan(360);
    // Node pins should be positioned at radius ~60px
    const ascDist = Math.hypot(result.nodePos.asc.x, result.nodePos.asc.y);
    const descDist = Math.hypot(result.nodePos.desc.x, result.nodePos.desc.y);
    expect(ascDist).toBeCloseTo(60, 2);
    expect(descDist).toBeCloseTo(60, 2);
  });

  it('generates 4-quadrant nodal SVG path segments', () => {
    const result = useTideMath({
      julianDate: 2451545.0,
      angles: { sunDegrees: 0, moonDegrees: 45 }
    });

    expect(result.nodalSegments.waxAsc).toContain('M ');
    expect(result.nodalSegments.waxDesc).toBeDefined();
    expect(result.nodalSegments.wanAsc).toBeDefined();
    expect(result.nodalSegments.wanDesc).toBeDefined();
  });

  it('accurately resolves isMoonAsc from moonBetaDeg', () => {
    const northMoon = useTideMath({ moonBetaDeg: 2.5 });
    expect(northMoon.isMoonAsc).toBe(true);

    const southMoon = useTideMath({ moonBetaDeg: -1.8 });
    expect(southMoon.isMoonAsc).toBe(false);
  });
});
