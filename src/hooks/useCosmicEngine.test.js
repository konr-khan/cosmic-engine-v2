import { describe, it, expect, vi } from 'vitest';
import { useCosmicEngine } from './useCosmicEngine';

// Mock React hooks to execute immediately in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (factory) => factory(),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: (effect) => { effect(); },
    useRef: (initial) => ({ current: initial })
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

  describe('Selective Calculation & Domain Flag Optimization', () => {
    it('skips lunarEvents when lunarAlmanac widget is set to false', () => {
      const testDate = new Date(2026, 5, 21);
      const activeWidgets = { lunarAlmanac: false, macroOrbit: true, microTides: true };
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, activeWidgets);

      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData.lunarEvents).toBeNull();
    });

    it('skips eclipse calculations when eclipse and macroOrbit widgets are false', () => {
      const testDate = new Date(2026, 5, 21);
      const activeWidgets = { eclipse: false, macroOrbit: false, lunarAlmanac: true, microTides: true };
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, activeWidgets);

      expect(result.orbitalData).not.toBeNull();
      expect(result.orbitalData.eclipse).toBeNull();
    });

    it('skips entire orbitalData structure when all orbital widgets are false', () => {
      const testDate = new Date(2026, 5, 21);
      const activeWidgets = { 
        almanac: true, sunclock: true, map: true,
        lunarAlmanac: false, eclipse: false, macroOrbit: false, microTides: false, celestialSphere: false 
      };
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true, activeWidgets);

      expect(result.solarData).not.toBeNull();
      expect(result.orbitalData).toBeNull();
    });

    it('computes lunarEvents and eclipse when default/unfiltered widgets active', () => {
      const testDate = new Date(2026, 5, 21);
      const result = useCosmicEngine(testDate, 12, 47.06, -122.81, true);

      expect(result.orbitalData.lunarEvents).not.toBeNull();
      expect(result.orbitalData.lunarEvents.distanceKm).toBeGreaterThan(350000);
      expect(result.orbitalData.eclipse).not.toBeNull();
    });
  });

  describe('Time-Lapse & State Transitions', () => {
    it('updates Julian Date linearly as timeOfDay advances', () => {
      const testDate = new Date(2026, 0, 1);
      const initial = useCosmicEngine(testDate, 0, 0, 0);
      const noon = useCosmicEngine(testDate, 12, 0, 0);

      expect(noon.julianDate - initial.julianDate).toBeCloseTo(0.5, 4);
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
});
