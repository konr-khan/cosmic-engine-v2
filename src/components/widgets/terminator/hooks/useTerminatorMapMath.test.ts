import { describe, it, expect, vi } from 'vitest';
import { useTerminatorMapMath } from './useTerminatorMapMath';
import { SolarAlmanacData, OrbitalData } from '../../../../types';

// Mock React's hooks to execute synchronously in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useMemo: (factory: () => any) => factory(),
    useCallback: (fn: any) => fn
  };
});

vi.mock('../../../../store/hoverStore', () => ({
  useHoverTime: vi.fn(() => null)
}));

describe('useTerminatorMapMath Hook Suite', () => {
  const mockSolarData: SolarAlmanacData = {
    sunrise: 5.5,
    sunset: 21.0,
    solarNoon: 13.25,
    civil: 0.7,
    nautical: 1.6,
    astronomical: 2.3,
    dayLength: 15.5,
    declination: 23.44,
    equationOfTime: -1.5,
    noonElevation: 66.38,
    daysSinceEpoch: 172,
    lambda: 90,
    eclipticLongitude: 90,
    isPolarNight: false,
    isMidnightSun: false,
    distanceAU: 1.0167,
    distanceKm: 152100000,
    sunAngularDiameterArcmin: 31.47
  };

  const mockOrbitalData: OrbitalData = {
    angles: { sunDegrees: 0, moonDegrees: 90, nodeLongitude: 125, descendingNodeLongitude: 305, toSun: 0, toMoon: 0 },
    nodeLongitude: 125,
    descendingNodeLongitude: 305,
    lunarPos: {
      rightAscension: 120,
      declination: 18.2,
      distanceKm: 363000,
      phase: 0.95,
      phaseName: 'Waxing Gibbous',
      elongation: 120,
      parallacticAngle: -12.4,
      nodeLongitude: 125,
      descendingNodeLongitude: 305,
      lambda: 120,
      beta: 2.1
    },
    phase: {
      value: 0.95,
      name: 'Waxing Gibbous'
    },
    tides: {
      rx: 18,
      ry: 12,
      type: 'Spring Tide',
      alignment: 0.9
    },
    localTideStatus: 'High Tide',
    lunarEvents: {
      moonrise: 18.5,
      moonset: 6.2,
      transit: 0.5,
      declination: 18.2,
      distanceKm: 363000,
      distanceEarthRadii: 57.0,
      isPerigee: false,
      isApogee: false,
      parallacticAngle: -12.4
    },
    eclipse: null
  };

  it('computes astronomical coordinates and dynamic disc scaling cleanly', () => {
    const math = useTerminatorMapMath({
      solarData: mockSolarData,
      orbitalData: mockOrbitalData,
      latitude: 47.06,
      longitude: -122.81,
      timeOfDay: 12
    });

    expect(math.declination).toBeCloseTo(23.44, 2);
    expect(math.lunarDec).toBeCloseTo(18.2, 2);
    expect(math.userCy).toBeCloseTo(90 - 47.06, 2);
    expect(math.sunRadius).toBeGreaterThanOrEqual(3.5);
    expect(math.sunRadius).toBeLessThanOrEqual(6.0);
    expect(math.moonRadius).toBeGreaterThanOrEqual(3.0);
    expect(math.moonRadius).toBeLessThanOrEqual(5.5);
    expect(math.dayShadow.combinedPath).toBeDefined();
    expect(math.civilShadow.combinedPath).toBeDefined();
    expect(math.nauticalShadow.combinedPath).toBeDefined();
    expect(math.astroShadow.combinedPath).toBeDefined();
  });

  it('adjusts Keplerian disc scaling dynamically across aphelion and supermoon', () => {
    const aphelionSupermoon = useTerminatorMapMath({
      solarData: { ...mockSolarData, distanceAU: 1.017 },
      orbitalData: {
        ...mockOrbitalData,
        lunarEvents: { ...mockOrbitalData.lunarEvents!, distanceKm: 357000 }
      },
      latitude: 47.06,
      longitude: -122.81,
      timeOfDay: 12
    });

    const perihelionMicromoon = useTerminatorMapMath({
      solarData: { ...mockSolarData, distanceAU: 0.983 },
      orbitalData: {
        ...mockOrbitalData,
        lunarEvents: { ...mockOrbitalData.lunarEvents!, distanceKm: 406000 }
      },
      latitude: 47.06,
      longitude: -122.81,
      timeOfDay: 12
    });

    // Sun at perihelion (closer) should have larger radius than at aphelion
    expect(perihelionMicromoon.sunRadius).toBeGreaterThan(aphelionSupermoon.sunRadius);
    // Moon at supermoon (closer) should have larger radius than at micromoon
    expect(aphelionSupermoon.moonRadius).toBeGreaterThan(perihelionMicromoon.moonRadius);
    expect(aphelionSupermoon.isSupermoon).toBe(true);
    expect(perihelionMicromoon.isMicromoon).toBe(true);
  });

  it('respects hoverTime override over standard timeOfDay', () => {
    const regular = useTerminatorMapMath({
      solarData: mockSolarData,
      orbitalData: mockOrbitalData,
      timeOfDay: 12,
      hoverTime: null
    });

    const hovered = useTerminatorMapMath({
      solarData: mockSolarData,
      orbitalData: mockOrbitalData,
      timeOfDay: 12,
      hoverTime: 18
    });

    expect(regular.activeTime).toBe(12);
    expect(hovered.activeTime).toBe(18);
    expect(hovered.relSunX).not.toBe(regular.relSunX);
  });

  it('generates 24-hour ground tracks only when respective toggle is enabled', () => {
    const noTracks = useTerminatorMapMath({
      solarData: mockSolarData,
      orbitalData: mockOrbitalData,
      showSunTrack: false,
      showMoonTrack: false
    });

    expect(noTracks.sunTrack).toBeNull();
    expect(noTracks.moonTrack).toBeNull();

    const withTracks = useTerminatorMapMath({
      solarData: mockSolarData,
      orbitalData: mockOrbitalData,
      showSunTrack: true,
      showMoonTrack: true
    });

    expect(withTracks.sunTrack).not.toBeNull();
    expect(withTracks.sunTrack!.pastD).toBeDefined();
    expect(withTracks.sunTrack!.futureD).toBeDefined();
    expect(withTracks.moonTrack).not.toBeNull();
    expect(withTracks.moonTrack!.pastD).toBeDefined();
    expect(withTracks.moonTrack!.futureD).toBeDefined();
  });

  it('falls back gracefully to Earth orbital physics when solarData or orbitalData is null', () => {
    const fallback = useTerminatorMapMath({
      solarData: null,
      orbitalData: null,
      latitude: 47.06,
      longitude: -122.81,
      timeOfDay: 12
    });

    expect(fallback.sunDistanceAU).toBeGreaterThan(0.97);
    expect(fallback.sunDistanceAU).toBeLessThan(1.03);
    expect(fallback.sunDistanceKm).toBeGreaterThan(145000000);
    expect(fallback.sunRadius).toBeGreaterThanOrEqual(3.5);
    expect(fallback.moonDistKm).toBe(384400);
    expect(fallback.dayShadow.combinedPath).toBeDefined();
  });
});
