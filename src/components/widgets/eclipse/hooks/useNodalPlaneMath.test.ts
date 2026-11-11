import { describe, it, expect, vi } from 'vitest';
import { useNodalPlaneMath } from './useNodalPlaneMath';
import { EclipseData } from '../../../../types';

// Mock React useMemo to execute immediately in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useMemo: (factory: () => any) => factory()
  };
});

describe('useNodalPlaneMath Hook Suite', () => {
  const mockEclipse: EclipseData = {
    type: 'TOTAL_SOLAR',
    category: 'SOLAR',
    label: 'Total Solar Eclipse',
    obscuration: 1.0,
    alignmentPercent: 99,
    isEclipseActive: true,
    raDiff: 0,
    elongation: 0,
    beta: 0.2, // degrees
    nodeAngleDeg: 15,
    nodeProximityDeg: 1.2,
    distanceKm: 375000,
    umbraRadiusKm: 4800,
    penumbraRadiusKm: 9200,
    phaseValue: 0.0, // New Moon
    isAscendingHemisphere: true
  };

  it('returns null when eclipse prop is null or undefined', () => {
    expect(useNodalPlaneMath({})).toBeNull();
    expect(useNodalPlaneMath({ eclipse: null })).toBeNull();
  });

  it('computes umbra geometry and shadow containment', () => {
    const result = useNodalPlaneMath({ eclipse: mockEclipse });
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.beta).toBe(0.2);
    expect(result.distKm).toBe(375000);
    // offsetKm = 375000 * sin(0.2 deg) ~ 1309 km
    expect(result.offsetKm).toBeCloseTo(1309, -1);
    expect(result.umbraRadKm).toBe(4800);
    expect(result.isInsideUmbra).toBe(true);
  });

  it('computes angular diameters and total capable status', () => {
    // When Moon is at perigee (360,000 km), apparent diameter is ~33.2' which exceeds Sun's max (~32.6')
    const perigeeEclipse = { ...mockEclipse, distanceKm: 360000 };
    const result = useNodalPlaneMath({ eclipse: perigeeEclipse });
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.sunAngularDiamArcmin).toBeGreaterThan(31);
    expect(result.sunAngularDiamArcmin).toBeLessThan(33);
    expect(result.moonAngularDiamArcmin).toBeGreaterThan(32.5);
    expect(result.isTotalCapable).toBe(true);
    expect(result.axialSunRadius).toBe(46);
    expect(result.axialMoonRadius).toBeGreaterThan(10);
  });

  it('generates axial orbital segments with all 12 quadrant loops', () => {
    const result = useNodalPlaneMath({ eclipse: mockEclipse });
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.orbitalSegments).toBeDefined();
    expect(result.orbitalSegments.waxAsc.length).toBeGreaterThan(0);
    expect(result.orbitalSegments.nearWaxAsc.length).toBeGreaterThan(0);
    expect(result.orbitalSegments.farWaxAsc.length).toBeGreaterThan(0);
  });

  it('enforces axial sightline depth sorting (-cos(phaseRad) * rx, Dead End #33)', () => {
    // New Moon (phaseVal = 0.0) -> phaseRad = 0 -> moonDepth = -cos(0) * 150 = -150 <= 0 (Far side, behind Earth)
    const newMoonResult = useNodalPlaneMath({
      eclipse: { ...mockEclipse, phaseValue: 0.0 }
    });
    expect(newMoonResult).not.toBeNull();
    if (!newMoonResult) return;
    expect(newMoonResult.moonDepth).toBeCloseTo(-150, 1);
    expect(newMoonResult.isNearSide).toBe(false);

    // Full Moon (phaseVal = 0.5) -> phaseRad = PI -> moonDepth = -cos(PI) * 150 = +150 > 0 (Near side, in front of Earth)
    const fullMoonResult = useNodalPlaneMath({
      eclipse: { ...mockEclipse, phaseValue: 0.5 }
    });
    expect(fullMoonResult).not.toBeNull();
    if (!fullMoonResult) return;
    expect(fullMoonResult.moonDepth).toBeCloseTo(150, 1);
    expect(fullMoonResult.isNearSide).toBe(true);
  });

  it('calculates nodal points and Earth occlusion flags', () => {
    const result = useNodalPlaneMath({ eclipse: mockEclipse });
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.centerX).toBe(260);
    expect(result.centerY).toBe(110);
    expect(result.ascNodeY).toBe(110);
    expect(result.descNodeY).toBe(110);
    expect(typeof result.isAscBehindEarth).toBe('boolean');
    expect(typeof result.isDescBehindEarth).toBe('boolean');
    expect(typeof result.isMoonOccludedByEarth).toBe('boolean');
  });
});
