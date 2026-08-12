import { describe, it, expect, vi } from 'vitest';
import { useEphemerisWorker } from './useEphemerisWorker';

// Mock React's hooks to execute synchronously in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (factory) => factory(),
    useEffect: (effect) => effect(),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useRef: (initial) => ({ current: initial })
  };
});

describe('useEphemerisWorker Hook Suite', () => {
  it('returns valid lunarEvents and eclipse via synchronous fallback when Worker is unavailable', () => {
    const result = useEphemerisWorker({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      isLunarActive: true,
      isEclipseActive: true,
      isOrbitalActive: true
    });

    expect(result.isWorkerActive).toBe(false);
    expect(result.lunarEvents).not.toBeNull();
    expect(result.lunarEvents.distanceKm).toBeGreaterThan(350000);
    expect(result.eclipse).not.toBeNull();
  });

  it('respects widget selective flags during calculation', () => {
    const noLunar = useEphemerisWorker({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      isLunarActive: false,
      isEclipseActive: true,
      isOrbitalActive: true
    });

    expect(noLunar.lunarEvents).toBeNull();
    expect(noLunar.eclipse).not.toBeNull();

    const noOrbital = useEphemerisWorker({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      isLunarActive: true,
      isEclipseActive: true,
      isOrbitalActive: false
    });

    expect(noOrbital.lunarEvents).toBeNull();
    expect(noOrbital.eclipse).toBeNull();
  });
});
