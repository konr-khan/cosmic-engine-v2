import { describe, it, expect, vi } from 'vitest';
import { useCosmicEngine } from './useCosmicEngine';

// Mock React hooks to execute immediately in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useMemo: (factory: () => any) => factory(),
    useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: (effect: () => any) => { effect(); },
    useRef: (initial: any) => ({ current: initial }),
    useCallback: (fn: any) => fn,
    useSyncExternalStore: (subscribe: any, getSnapshot: () => any) => getSnapshot()
  };
});

describe('useCosmicEngine Hook Suite', () => {
  it('returns valid solarData, orbitalData, and julianDate structures', () => {
    const testDate = new Date(2026, 5, 21); // June 21, 2026
    const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true);

    expect(result.julianDate).toBeDefined();
    expect(result.solarData).toBeDefined();
    expect(result.orbitalData).toBeDefined();
    expect(result.solarData.declination).toBeGreaterThan(23.0);
  });

  it('falls back to cosmicStore state values when invoked without explicit arguments', () => {
    const result = useCosmicEngine();

    expect(result.julianDate).toBeDefined();
    expect(result.solarData).toBeDefined();
    expect(result.orbitalData).toBeDefined();
  });

  it('merges partial parameter overrides with cosmicStore state', () => {
    const customDate = new Date(2026, 11, 21); // Winter solstice
    const result = useCosmicEngine(customDate, null, null, null, null);

    expect(result.julianDate).toBeDefined();
    expect(result.solarData.declination).toBeLessThan(-23.0);
  });

  describe('Selective Calculation & Domain Flag Optimization', () => {
    it('skips lunarEvents when lunarAlmanac widget is set to false', () => {
      const testDate = new Date(2026, 5, 21);
      const activeWidgets = { lunarAlmanac: false, macroOrbit: true, microTides: true };
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, activeWidgets);

      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData!.lunarEvents).toBeNull();
    });

    it('skips eclipse calculations when eclipse and macroOrbit widgets are false', () => {
      const testDate = new Date(2026, 5, 21);
      const activeWidgets = { eclipse: false, macroOrbit: false, lunarAlmanac: true, microTides: true };
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, activeWidgets);

      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData!.eclipse).toBeNull();
    });

    it('skips entire orbitalData structure when all orbital widgets are false', () => {
      const testDate = new Date(2026, 5, 21);
      const activeWidgets = { 
        almanac: true, 
        map: false,
        lunarAlmanac: false, eclipse: false, macroOrbit: false, microTides: false 
      };
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, activeWidgets);

      expect(result.solarData).not.toBeNull();
      expect(result.orbitalData).toBeNull();
    });

    it('computes lunarEvents and eclipse when default/unfiltered widgets active', () => {
      const testDate = new Date(2026, 5, 21);
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true);

      expect(result.orbitalData!.lunarEvents).not.toBeNull();
      expect(result.orbitalData!.lunarEvents!.distanceKm).toBeGreaterThan(350000);
      expect(result.orbitalData!.eclipse).not.toBeNull();
    });

    it('scopes calculations for solar-only widget { almanac: true } bypassing orbitalData and worker', () => {
      const testDate = new Date(2026, 5, 21);
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, { almanac: true });

      expect(result.solarData).not.toBeNull();
      expect(result.orbitalData).toBeNull();
    });

    it('scopes calculations for { lunarAlmanac: true } calculating lunarEvents and skipping eclipse', () => {
      const testDate = new Date(2026, 5, 21);
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, { lunarAlmanac: true });

      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData!.lunarEvents).not.toBeNull();
      expect(result.orbitalData!.eclipse).toBeNull();
    });

    it('scopes calculations for { eclipse: true } calculating eclipse and skipping lunarEvents', () => {
      const testDate = new Date(2026, 5, 21);
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, { eclipse: true });

      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData!.eclipse).not.toBeNull();
      expect(result.orbitalData!.lunarEvents).toBeNull();
    });

    it('scopes calculations for { today: true } calculating lunarEvents and orbital data', () => {
      const testDate = new Date(2026, 5, 21);
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, { today: true });

      expect(result.solarData).not.toBeNull();
      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData!.lunarEvents).not.toBeNull();
      expect(result.orbitalData!.eclipse).toBeNull();
    });
  });

  describe('Time-Lapse & State Transitions', () => {
    it('updates Julian Date linearly as timeOfDay advances', () => {
      const testDate = new Date(2026, 0, 1);
      const initial = useCosmicEngine(testDate, 0, 0, 0);
      const noon = useCosmicEngine(testDate, 12, 0, 0);

      expect((noon.julianDate as number) - (initial.julianDate as number)).toBeCloseTo(0.5, 4);
    });
  });

  describe('Extreme Latitude & Polar Night / Day Edge Cases', () => {
    it('detects Midnight Sun (24h daylight) at 80°N during Summer Solstice (June 21)', () => {
      const solsticeJune = new Date(2026, 5, 21);
      const result = useCosmicEngine(solsticeJune, 12, 80, 0);

      expect(result.solarData.isMidnightSun).toBe(true);
      expect(result.solarData.isPolarNight).toBe(false);
      expect(result.solarData.dayLength).toBeGreaterThanOrEqual(24);
    });

    it('detects Polar Night (0h daylight) at 80°N during Winter Solstice (December 21)', () => {
      const solsticeDec = new Date(2026, 11, 21);
      const result = useCosmicEngine(solsticeDec, 12, 80, 0);

      expect(result.solarData.isPolarNight).toBe(true);
      expect(result.solarData.isMidnightSun).toBe(false);
      expect(result.solarData.dayLength).toBeLessThanOrEqual(0);
    });

    it('returns approximately 12.1 hours of daylight at Equator during Equinox (accounting for refraction)', () => {
      const equinoxMarch = new Date(2026, 2, 20);
      const result = useCosmicEngine(equinoxMarch, 12, 0, 0);

      expect(result.solarData.isPolarNight).toBe(false);
      expect(result.solarData.isMidnightSun).toBe(false);
      expect(result.solarData.dayLength).toBeGreaterThan(12.0);
      expect(result.solarData.dayLength).toBeLessThan(12.2);
    });

    it('inverts seasonal polar night/day in Southern Hemisphere (-65°S)', () => {
      const solsticeDec = new Date(2026, 11, 21);
      const result = useCosmicEngine(solsticeDec, 12, -65, 0);

      // Dec Solstice in S. Hemisphere is Midnight Sun / long summer day
      expect(result.solarData.dayLength).toBeGreaterThan(20);
    });
  });

  describe('Degenerate Longitude & Polar Boundary Matrix (+90°N, -90°S)', () => {
    it('guarantees zero NaN propagation at North and South Poles across all longitudes and times', () => {
      const poles = [90, -90];
      const longitudes = [-180, -120, -75, 0, 45, 90, 180];
      const dates = [
        new Date(2026, 2, 20), // Spring Equinox
        new Date(2026, 5, 21), // Summer Solstice
        new Date(2026, 8, 22), // Autumn Equinox
        new Date(2026, 11, 21) // Winter Solstice
      ];
      const times = [0, 6, 12, 18, 23.5];

      poles.forEach(lat => {
        longitudes.forEach(lon => {
          dates.forEach(date => {
            times.forEach(t => {
              const res = useCosmicEngine(date, t, lat, lon, true);
              const { solarData, orbitalData, julianDate } = res;

              // Julian Date check
              expect(Number.isNaN(julianDate)).toBe(false);

              // Solar Data checks
              expect(Number.isNaN(solarData.solarNoon)).toBe(false);
              expect(Number.isNaN(solarData.sunrise)).toBe(false);
              expect(Number.isNaN(solarData.sunset)).toBe(false);
              expect(Number.isNaN(solarData.dayLength)).toBe(false);
              expect(Number.isNaN(solarData.civil)).toBe(false);
              expect(Number.isNaN(solarData.nautical)).toBe(false);
              expect(Number.isNaN(solarData.astronomical)).toBe(false);
              expect(Number.isNaN(solarData.equationOfTime)).toBe(false);
              expect(Number.isNaN(solarData.noonElevation)).toBe(false);
              expect(Number.isNaN(solarData.declination)).toBe(false);

              // Mutual exclusivity of polar flags
              expect(solarData.isPolarNight && solarData.isMidnightSun).toBe(false);

              // Orbital Data checks
              if (orbitalData) {
                expect(Number.isNaN(orbitalData.angles.toSun)).toBe(false);
                expect(Number.isNaN(orbitalData.angles.toMoon)).toBe(false);
                expect(Number.isNaN(orbitalData.angles.sunDegrees)).toBe(false);
                expect(Number.isNaN(orbitalData.angles.moonDegrees)).toBe(false);
                expect(Number.isNaN(orbitalData.phase.value)).toBe(false);
                expect(Number.isNaN(orbitalData.tides.rx)).toBe(false);
                expect(Number.isNaN(orbitalData.tides.alignment)).toBe(false);
                expect(['High Tide', 'Low Tide']).toContain(orbitalData.localTideStatus);
              }
            });
          });
        });
      });
    });
  });

  describe('Analemma Toggle & Solar Noon Equation of Time Correction', () => {
    it('bypasses Equation of Time correction when useAnalemma is false', () => {
      const testDate = new Date(2026, 10, 3); // November 3 (EoT ~ +16.4 min)
      const longitude = -122.81;
      
      const withoutAnalemma = useCosmicEngine(testDate, 12, 47.06, longitude, false);
      expect(withoutAnalemma.solarData.equationOfTime).toBe(0);
      expect(withoutAnalemma.solarData.solarNoon).toBeCloseTo(12 - (longitude / 15), 5);

      const withAnalemma = useCosmicEngine(testDate, 12, 47.06, longitude, true);
      expect(withAnalemma.solarData.equationOfTime).not.toBe(0);
      expect(withAnalemma.solarData.solarNoon).not.toBeCloseTo(withoutAnalemma.solarData.solarNoon, 2);
    });
  });

  describe('Gravitational Tidal Physics & Local Tide Vector Status', () => {
    it('calculates Spring Tide during syzygy alignment and assigns valid tide states', () => {
      const newMoonDate = new Date(2024, 3, 8); // Syzygy
      const result = useCosmicEngine(newMoonDate, 12, 0, 0, true);

      expect(result.orbitalData).not.toBeNull();
      expect(['Spring Tide', 'Neap Tide', 'Transitional']).toContain(result.orbitalData!.tides.type);
      expect(['High Tide', 'Low Tide']).toContain(result.orbitalData!.localTideStatus);
      expect(result.orbitalData!.tides.rx).toBeGreaterThan(result.orbitalData!.tides.ry);
    });

    it('aligns angles.sunDegrees and angles.moonDegrees directly with canonical Meeus ephemeris', () => {
      const testDate = new Date(2026, 5, 21); // June Solstice
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true);

      expect(result.orbitalData).not.toBeNull();
      // Sun at June Solstice is at ~90° ecliptic longitude
      expect(result.orbitalData!.angles.sunDegrees).toBeCloseTo(result.solarData.lambda as number, 3);
      expect(result.orbitalData!.angles.sunDegrees).toBeCloseTo(90, 0);
      // Moon degrees match true Meeus lunar longitude
      expect(result.orbitalData!.angles.moonDegrees).toBeCloseTo(result.orbitalData!.lunarPos.lambda as number, 3);
      // Normalized phase matches Meeus phase
      expect(result.orbitalData!.phase.value).toBeCloseTo(result.orbitalData!.lunarPos.phase, 3);
    });
  });
});
