import { describe, it, expect, vi, afterEach } from 'vitest';
import { useEphemerisWorker, useAnnualSolarWorker, useAnnualLunarWorker } from './useEphemerisWorker';
import {
  EphemerisWorkerManager,
  ephemerisWorkerManager,
  PendingRequestEntry,
} from '../workers/ephemerisWorkerManager';
import { MockWorker, installMockWorker } from '../../tests/fixtures/mockWorkerFixture';
import { executeSyncFallbackForEntry } from '../workers/workerFallback';
import { Latitude, Longitude, JulianDate } from '../types/units';
import { EclipseData, LunarEvents } from '../types/astronomy';

// Mock React's hooks to execute synchronously in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useMemo: <T>(factory: () => T): T => factory(),
    useEffect: (effect: () => void | (() => void)): void => {
      effect();
    },
    useState: <T>(initial: T | (() => T)): [T, ReturnType<typeof vi.fn>] => [
      typeof initial === 'function' ? (initial as () => T)() : initial,
      vi.fn(),
    ],
    useRef: <T>(initial: T): { current: T } => ({ current: initial }),
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
      isOrbitalActive: true,
    });

    expect(result.isWorkerActive).toBe(false);
    expect(result.lunarEvents).not.toBeNull();
    expect(result.lunarEvents!.distanceKm).toBeGreaterThan(350000);
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
      isOrbitalActive: true,
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
      isOrbitalActive: false,
    });

    expect(noOrbital.lunarEvents).toBeNull();
    expect(noOrbital.eclipse).toBeNull();
  });

  it('returns valid annual solar matrix via synchronous fallback when Worker is unavailable', () => {
    const solarData = useAnnualSolarWorker({
      year: 2026,
      latitude: 47.06,
    });

    expect(solarData).toHaveLength(365);
    expect(solarData[0].day).toBe(1);
    expect(solarData[0].sunrise).toBeDefined();
    expect(solarData[0].sunset).toBeDefined();
  });

  it('returns valid annual lunar matrix via synchronous fallback when Worker is unavailable', () => {
    const lunarData = useAnnualLunarWorker({
      year: 2026,
      latitude: 47.06,
      longitude: -122.81,
    });

    expect(lunarData).toHaveLength(365);
    expect(lunarData[0].day).toBe(1);
    expect(lunarData[0].distanceKm).toBeGreaterThan(350000);
    expect(lunarData[0].phaseValue).toBeDefined();
  });

  it('correctly handles initial render state and worker payload integration', () => {
    const result = useEphemerisWorker({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      isLunarActive: true,
      isEclipseActive: true,
      isOrbitalActive: true,
    });

    expect(result).toBeDefined();
    expect(result.lunarEvents).toBeDefined();
  });
});

describe('EphemerisWorkerManager Singleton Suite', () => {
  const originalWorker = globalThis.Worker;

  const getActiveMockWorker = (manager: EphemerisWorkerManager): MockWorker => {
    expect(manager.worker).not.toBeNull();
    return manager.worker as unknown as MockWorker;
  };

  afterEach(() => {
    globalThis.Worker = originalWorker;
    MockWorker.reset();
    ephemerisWorkerManager.terminate();
  });

  it('handles environment where Worker is undefined', () => {
    Reflect.deleteProperty(globalThis, 'Worker');
    const manager = new EphemerisWorkerManager();

    expect(manager.isAvailable()).toBe(false);

    const onResult = vi.fn();
    const unsubscribe = manager.requestCalculation(
      {
        latitude: 45,
        longitude: -120,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      onResult
    );

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('multiplexes multiple requests through a single Worker instance', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    expect(manager.isAvailable()).toBe(true);

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const unsub1 = manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb1
    );

    const unsub2 = manager.requestCalculation(
      {
        latitude: 35.68,
        longitude: 139.76,
        julianDate: 2451545.0,
        timeOfDay: 18,
        calculateLunar: true,
        calculateEclipse: false,
      },
      cb2
    );

    // Exactly 1 worker instance should be created
    expect(MockWorker.instances).toHaveLength(1);
    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(worker.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'CALCULATE_EPHEMERIS',
      id: 1,
      payload: {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
    });
    expect(worker.postMessage).toHaveBeenNthCalledWith(2, {
      type: 'CALCULATE_EPHEMERIS',
      id: 2,
      payload: {
        latitude: 35.68,
        longitude: 139.76,
        julianDate: 2451545.0,
        timeOfDay: 18,
        calculateLunar: true,
        calculateEclipse: false,
      },
    });

    // Simulate worker response for request 1
    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 1,
      payload: { lunarEvents: { test: 1 }, eclipse: null, timestamp: 100 },
    });

    expect(cb1).toHaveBeenCalledWith({ lunarEvents: { test: 1 }, eclipse: null, timestamp: 100 });
    expect(cb2).not.toHaveBeenCalled();

    // Test unsubscribe before response for request 2
    unsub2();

    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 2,
      payload: { lunarEvents: { test: 2 }, eclipse: null, timestamp: 200 },
    });
    expect(cb2).not.toHaveBeenCalled();

    unsub1();
  });

  it('coalesces concurrent requests with identical parameters into a single worker postMessage call', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const identicalParams = {
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true,
    };

    manager.requestCalculation(identicalParams, cb1);
    manager.requestCalculation(identicalParams, cb2);

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 1,
      payload: { lunarEvents: { distanceKm: 384400 }, eclipse: { type: 'NONE' }, timestamp: 500 },
    });
    expect(cb1).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: { type: 'NONE' }, timestamp: 500 });
    expect(cb2).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: { type: 'NONE' }, timestamp: 500 });
  });

  it('deduplicates and coalesces identical in-flight requests without sending duplicate messages', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const params = {
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true,
    };

    const unsub1 = manager.requestCalculation(params, cb1);
    const unsub2 = manager.requestCalculation(params, cb2);

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 1,
      payload: { lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 12345 },
    });

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 12345 });
    expect(cb2).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 12345 });

    unsub1();
    unsub2();
  });

  it('handles worker errors gracefully and dispatches fallback calculations to pending callbacks', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb
    );

    const worker = getActiveMockWorker(manager);
    worker.emitError(new Error('Worker script load failure'));

    expect(manager.isAvailable()).toBe(false);
    expect(manager.worker).toBeNull();
    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.lunarEvents).not.toBeNull();
    expect(payload.eclipse).not.toBeNull();
  });

  it('dispatches synchronous fallback calculations on EPHEMERIS_ERROR message', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb
    );

    getActiveMockWorker(manager).emitMessage({
      type: 'EPHEMERIS_ERROR',
      id: 1,
      error: 'Calculation error',
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.lunarEvents).not.toBeNull();
    expect(payload.eclipse).not.toBeNull();
  });

  it('handles annual solar calculation dispatch, result delivery, and deduplication', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const lat = 47.06 as Latitude;

    manager.requestAnnualSolarCalculation({ year: 2026, latitude: lat }, cb1);
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: lat }, cb2);

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledWith({
      type: 'CALCULATE_ANNUAL_SOLAR',
      id: 1,
      payload: { year: 2026, latitude: 47.06 },
    });

    const mockSolar = [{ day: 1, sunrise: 7.5, sunset: 16.5 }];
    worker.emitMessage({
      type: 'ANNUAL_SOLAR_SUCCESS',
      id: 1,
      payload: { annualSolar: mockSolar },
    });

    expect(cb1).toHaveBeenCalledWith({ annualSolar: mockSolar });
    expect(cb2).toHaveBeenCalledWith({ annualSolar: mockSolar });

    // Subsequent request should hit cache directly without posting to worker
    const cb3 = vi.fn();
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: lat }, cb3);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledWith({ annualSolar: mockSolar });
  });

  it('handles annual solar fallback on ANNUAL_SOLAR_ERROR', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: 47.06 as Latitude }, cb);

    getActiveMockWorker(manager).emitMessage({
      type: 'ANNUAL_SOLAR_ERROR',
      id: 1,
      error: 'Failed',
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.annualSolar).toHaveLength(365);
  });

  it('handles annual lunar calculation dispatch, result delivery, and deduplication', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const lat = 47.06 as Latitude;
    const lon = -122.81 as Longitude;

    manager.requestAnnualLunarCalculation({ year: 2026, latitude: lat, longitude: lon }, cb1);
    manager.requestAnnualLunarCalculation({ year: 2026, latitude: lat, longitude: lon }, cb2);

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledWith({
      type: 'CALCULATE_ANNUAL_LUNAR',
      id: 1,
      payload: { year: 2026, latitude: 47.06, longitude: -122.81 },
    });

    const mockLunar = [{ day: 1, moonrise: 10, moonset: 22, distanceKm: 384400 }];
    worker.emitMessage({
      type: 'ANNUAL_LUNAR_SUCCESS',
      id: 1,
      payload: { annualLunar: mockLunar },
    });

    expect(cb1).toHaveBeenCalledWith({ annualLunar: mockLunar });
    expect(cb2).toHaveBeenCalledWith({ annualLunar: mockLunar });

    const cb3 = vi.fn();
    manager.requestAnnualLunarCalculation({ year: 2026, latitude: lat, longitude: lon }, cb3);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledWith({ annualLunar: mockLunar });
  });

  it('handles annual lunar fallback on ANNUAL_LUNAR_ERROR', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestAnnualLunarCalculation(
      { year: 2026, latitude: 47.06 as Latitude, longitude: -122.81 as Longitude },
      cb
    );

    getActiveMockWorker(manager).emitMessage({
      type: 'ANNUAL_LUNAR_ERROR',
      id: 1,
      error: 'Failed',
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.annualLunar).toHaveLength(365);
  });

  it('terminates active worker and clears pending requests on terminate()', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestCalculation(
      {
        latitude: 0,
        longitude: 0,
        julianDate: 2451545.0,
        timeOfDay: 0,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb
    );

    const workerInstance = getActiveMockWorker(manager);

    manager.terminate();
    expect(workerInstance.terminate).toHaveBeenCalled();
    expect(manager.worker).toBeNull();
    expect(manager.pendingRequests.size).toBe(0);
    expect(manager.annualSolarCache.size).toBe(0);
    expect(manager.annualLunarCache.size).toBe(0);
  });

  it('triggers terminate() on window beforeunload and pagehide events', () => {
    installMockWorker();
    const listeners: Record<string, Array<(ev?: unknown) => void>> = {};
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        addEventListener: (event: string, handler: (ev?: unknown) => void) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(handler);
        },
        removeEventListener: vi.fn(),
      },
    });

    const manager = new EphemerisWorkerManager();
    const terminateSpy = vi.spyOn(manager, 'terminate');

    expect(listeners['beforeunload']).toBeDefined();
    expect(listeners['pagehide']).toBeDefined();

    listeners['beforeunload'][0]();
    expect(terminateSpy).toHaveBeenCalledTimes(1);

    listeners['pagehide'][0]();
    expect(terminateSpy).toHaveBeenCalledTimes(2);

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
  });

  it('unregisters beforeunload and pagehide listeners on terminate() and re-registers on lazy worker re-creation', () => {
    installMockWorker();
    const originalWindow = globalThis.window;
    const removed: Record<string, Array<(ev?: unknown) => void>> = {};
    const listeners: Record<string, Array<(ev?: unknown) => void>> = {};
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        addEventListener: vi.fn((event: string, handler: (ev?: unknown) => void) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: (ev?: unknown) => void) => {
          removed[event] = removed[event] || [];
          removed[event].push(handler);
        }),
      },
    });

    const manager = new EphemerisWorkerManager();
    expect(listeners['beforeunload']).toHaveLength(1);
    expect(listeners['pagehide']).toHaveLength(1);

    manager.terminate();
    expect(removed['beforeunload']).toHaveLength(1);
    expect(removed['pagehide']).toHaveLength(1);
    expect(removed['beforeunload'][0]).toBe(listeners['beforeunload'][0]);
    expect(removed['pagehide'][0]).toBe(listeners['pagehide'][0]);

    // Subsequent calculation lazily spawns a fresh worker and re-attaches unload listeners
    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      vi.fn()
    );
    expect(MockWorker.instances).toHaveLength(1);
    expect(listeners['beforeunload']).toHaveLength(2);
    expect(listeners['pagehide']).toHaveLength(2);

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
  });

  it('discards stale out-of-order ephemeris worker responses via monotonic sequence stamping', () => {
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cb3 = vi.fn();

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb1
    );

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451546.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb2
    );

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);

    // Simulate response 2 arriving BEFORE response 1 (out-of-order completion)
    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 2,
      payload: { lunarEvents: { day: 2 }, eclipse: null, timestamp: 200 },
    });

    expect(cb2).toHaveBeenCalledWith({ lunarEvents: { day: 2 }, eclipse: null, timestamp: 200 });
    expect(manager.latestProcessedEphemerisId).toBe(2);

    // Response 1 arrives later (stale sequence id: 1 < 2)
    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 1,
      payload: { lunarEvents: { day: 1 }, eclipse: null, timestamp: 100 },
    });

    expect(cb1).not.toHaveBeenCalled();

    // Now dispatch request 3 (id: 3)
    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451547.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
      },
      cb3
    );

    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 3,
      payload: { lunarEvents: { day: 3 }, eclipse: null, timestamp: 300 },
    });

    expect(cb3).toHaveBeenCalledWith({ lunarEvents: { day: 3 }, eclipse: null, timestamp: 300 });
    expect(manager.latestProcessedEphemerisId).toBe(3);
  });

  it('throttles rapid calculation requests and coalesces them into trailing worker calls', () => {
    vi.useFakeTimers();
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cb3 = vi.fn();

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        throttleMs: 100,
      },
      cb1
    );

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'CALCULATE_EPHEMERIS',
      id: 1,
      payload: expect.objectContaining({ julianDate: 2451545.0 }),
    });

    vi.advanceTimersByTime(20);

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.02,
        timeOfDay: 12.5,
        throttleMs: 100,
      },
      cb2
    );

    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(20);

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.04,
        timeOfDay: 13.0,
        throttleMs: 100,
      },
      cb3
    );

    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60);

    expect(worker.postMessage).toHaveBeenCalledTimes(3);
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'CALCULATE_EPHEMERIS',
      id: 3,
      payload: expect.objectContaining({ julianDate: 2451545.04, timeOfDay: 13.0 }),
    });

    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 3,
      payload: { lunarEvents: { day: 3 }, eclipse: null, timestamp: 999 },
    });

    expect(cb3).toHaveBeenCalledWith({ lunarEvents: { day: 3 }, eclipse: null, timestamp: 999 });

    vi.useRealTimers();
  });

  it('coalesces concurrent throttled calls with identical coordinates and merges different active flags', () => {
    vi.useFakeTimers();
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cbLeading = vi.fn();
    const cbLunarOnly = vi.fn();
    const cbEclipseOnly = vi.fn();

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true,
        throttleMs: 100,
      },
      cbLeading
    );

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(20);

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.04,
        timeOfDay: 13.0,
        calculateLunar: true,
        calculateEclipse: false,
        throttleMs: 100,
      },
      cbLunarOnly
    );

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.04,
        timeOfDay: 13.0,
        calculateLunar: false,
        calculateEclipse: true,
        throttleMs: 100,
      },
      cbEclipseOnly
    );

    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(80);

    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'CALCULATE_EPHEMERIS',
      id: 2,
      payload: expect.objectContaining({
        julianDate: 2451545.04,
        timeOfDay: 13.0,
        calculateLunar: true,
        calculateEclipse: true,
      }),
    });

    const mockPayload = {
      lunarEvents: { distanceKm: 384400 } as unknown as LunarEvents,
      eclipse: { type: 'PARTIAL_SOLAR' } as unknown as EclipseData,
      timestamp: 1000,
    };
    worker.emitMessage({
      type: 'EPHEMERIS_SUCCESS',
      id: 2,
      payload: mockPayload,
    });

    expect(cbLunarOnly).toHaveBeenCalledWith(mockPayload);
    expect(cbEclipseOnly).toHaveBeenCalledWith(mockPayload);

    vi.useRealTimers();
  });

  it('safely drops throttled request when unsubscribed before timer fires', () => {
    vi.useFakeTimers();
    installMockWorker();
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        throttleMs: 100,
      },
      cb1
    );

    const worker = getActiveMockWorker(manager);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(20);

    const unsubscribe2 = manager.requestCalculation(
      {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.02,
        timeOfDay: 12.5,
        throttleMs: 100,
      },
      cb2
    );

    unsubscribe2();

    vi.advanceTimersByTime(100);

    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('preserves in-flight leading requests and throttle timers across 60 FPS subscription updates without dispatching stale frames', () => {
    vi.useFakeTimers();
    try {
      installMockWorker();
      const manager = new EphemerisWorkerManager();
      const sub = manager.createEphemerisSubscription();
      const onResult = vi.fn();

      // Frame 0 (t=0ms): Leading-edge dispatch (id = 1)
      sub.update(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.0,
          timeOfDay: 12,
          calculateLunar: true,
          calculateEclipse: true,
          throttleMs: 100,
        },
        onResult
      );

      const worker = getActiveMockWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledTimes(1);

      // Frames 1..5 (16ms, 32ms, 48ms, 64ms, 80ms): rapid 60 FPS updates replace queued frame only
      for (let frame = 1; frame <= 5; frame++) {
        vi.advanceTimersByTime(16);
        sub.update(
          {
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            julianDate: 2451545.0 + frame * 0.0002,
            timeOfDay: 12 + frame * 0.0048,
            calculateLunar: true,
            calculateEclipse: true,
            throttleMs: 100,
          },
          onResult
        );
      }

      // Leading-edge id=1 must NOT be cancelled by intermediate ticks; worker completion at t=80ms delivers result
      expect(worker.postMessage).toHaveBeenCalledTimes(1);
      expect(manager.pendingThrottledEntries.size).toBe(1);
      worker.emitMessage({
        type: 'EPHEMERIS_SUCCESS',
        id: 1,
        payload: { lunarEvents: { distanceKm: 384400 } as unknown as LunarEvents, eclipse: null, timestamp: 10 },
      });
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenLastCalledWith(
        expect.objectContaining({ timestamp: 10 }),
        2451545.0,
        47.06,
        -122.81
      );

      // Advance remaining 20ms to hit 100ms throttle expiry -> dispatches ONLY latest queued frame (frame 5)
      vi.advanceTimersByTime(20);
      expect(worker.postMessage).toHaveBeenCalledTimes(2);
      expect(worker.postMessage).toHaveBeenLastCalledWith({
        type: 'CALCULATE_EPHEMERIS',
        id: 2,
        payload: expect.objectContaining({ julianDate: 2451545.0 + 5 * 0.0002 }),
      });

      worker.emitMessage({
        type: 'EPHEMERIS_SUCCESS',
        id: 2,
        payload: { lunarEvents: { distanceKm: 384410 } as unknown as LunarEvents, eclipse: null, timestamp: 20 },
      });
      expect(onResult).toHaveBeenCalledTimes(2);
      expect(onResult).toHaveBeenLastCalledWith(
        expect.objectContaining({ timestamp: 20 }),
        2451545.0 + 5 * 0.0002,
        47.06,
        -122.81
      );

      // Frame 6 arrives after throttle expiry: leading-edge dispatch id=3, then dispose() cancels it cleanly
      vi.advanceTimersByTime(110);
      sub.update(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.002,
          timeOfDay: 12.048,
          calculateLunar: true,
          calculateEclipse: true,
          throttleMs: 100,
        },
        onResult
      );
      expect(worker.postMessage).toHaveBeenCalledTimes(3);

      sub.dispose();
      worker.emitMessage({
        type: 'EPHEMERIS_SUCCESS',
        id: 3,
        payload: { lunarEvents: null, eclipse: null, timestamp: 30 },
      });
      expect(onResult).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops stale queued frame before leading-edge dispatch when throttle window elapses prior to timer callback', () => {
    vi.useFakeTimers();
    try {
      installMockWorker();
      const manager = new EphemerisWorkerManager();
      const sub = manager.createEphemerisSubscription();
      const onResult = vi.fn();

      // t=0: leading dispatch (id=1)
      sub.update(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.0,
          timeOfDay: 12,
          throttleMs: 100,
        },
        onResult
      );

      // t=20: queued frame (JD + 0.01)
      vi.advanceTimersByTime(20);
      sub.update(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.01,
          timeOfDay: 12.24,
          throttleMs: 100,
        },
        onResult
      );

      const worker = getActiveMockWorker(manager);
      expect(worker.postMessage).toHaveBeenCalledTimes(1);

      // Advance system clock directly past throttle window without running pending timer first
      vi.setSystemTime(Date.now() + 100);
      sub.update(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.05,
          timeOfDay: 13.2,
          throttleMs: 100,
        },
        onResult
      );

      // Only id=2 (JD + 0.05) should dispatch; stale JD + 0.01 must NOT flush
      expect(worker.postMessage).toHaveBeenCalledTimes(2);
      expect(worker.postMessage).toHaveBeenLastCalledWith({
        type: 'CALCULATE_EPHEMERIS',
        id: 2,
        payload: expect.objectContaining({ julianDate: 2451545.05 }),
      });

      sub.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  describe('Annual Matrix LRU Cache Policy', () => {
    it('evicts the oldest entry when cache size exceeds MAX_ANNUAL_CACHE_SIZE (16)', () => {
      vi.stubGlobal('Worker', undefined);
      try {
        const manager = new EphemerisWorkerManager();

        for (let i = 0; i < 17; i++) {
          manager.requestAnnualSolarCalculation({ year: 2026, latitude: (10 + i) as Latitude }, () => {});
        }

        expect(manager.annualSolarCache.size).toBe(16);
        expect(manager.annualSolarCache.has('SOLAR_2026_10')).toBe(false);
        expect(manager.annualSolarCache.has('SOLAR_2026_26')).toBe(true);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('promotes accessed cache entry to most recently used on cache hit', () => {
      vi.stubGlobal('Worker', undefined);
      try {
        const manager = new EphemerisWorkerManager();

        for (let i = 0; i < 16; i++) {
          manager.requestAnnualSolarCalculation({ year: 2026, latitude: (10 + i) as Latitude }, () => {});
        }

        // Access key 10 to refresh recency
        manager.requestAnnualSolarCalculation({ year: 2026, latitude: 10 as Latitude }, () => {});

        // Add a 17th entry (lat 26)
        manager.requestAnnualSolarCalculation({ year: 2026, latitude: 26 as Latitude }, () => {});

        expect(manager.annualSolarCache.has('SOLAR_2026_10')).toBe(true);
        expect(manager.annualSolarCache.has('SOLAR_2026_11')).toBe(false);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('invokes synchronous fallback when worker request times out', () => {
      vi.useFakeTimers();
      try {
        installMockWorker();
        const manager = new EphemerisWorkerManager();

        const cb = vi.fn();
        manager.requestCalculation(
          {
            latitude: 47.06,
            longitude: -122.81,
            julianDate: 2451545.0,
            timeOfDay: 12,
            calculateLunar: true,
            calculateEclipse: true,
          },
          cb
        );

        expect(manager.pendingRequests.size).toBe(1);
        expect(cb).not.toHaveBeenCalled();

        vi.advanceTimersByTime(5000);

        expect(cb).toHaveBeenCalledTimes(1);
        const payload = cb.mock.calls[0][0];
        expect(payload.lunarEvents).toBeDefined();
        expect(payload.eclipse).toBeDefined();
        expect(manager.pendingRequests.size).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Synchronous Fallback Hardening & Pathological Input Resilience', () => {
    it('handles NaN coordinates and non-finite Julian Date in useEphemerisWorker without throwing', () => {
      expect(() => {
        const result = useEphemerisWorker({
          latitude: NaN as Latitude,
          longitude: NaN as Longitude,
          julianDate: NaN as JulianDate,
          timeOfDay: NaN,
          isLunarActive: true,
          isEclipseActive: true,
          isOrbitalActive: true,
        });
        expect(result).toBeDefined();
        expect(result.isWorkerActive).toBe(false);
        expect(result.lunarEvents).not.toBeNull();
        expect(result.eclipse).not.toBeNull();
      }).not.toThrow();
    });

    it('handles extreme out-of-range coordinates in useEphemerisWorker gracefully', () => {
      const result = useEphemerisWorker({
        latitude: 999 as Latitude,
        longitude: -5000 as Longitude,
        julianDate: 2451545.0 as JulianDate,
        timeOfDay: 35,
        isLunarActive: true,
        isEclipseActive: true,
        isOrbitalActive: true,
      });

      expect(result).toBeDefined();
      expect(result.lunarEvents).not.toBeNull();
      expect(result.eclipse).not.toBeNull();
    });

    it('handles NaN and extreme years in useAnnualSolarWorker without throwing', () => {
      const nanSolar = useAnnualSolarWorker({
        year: NaN,
        latitude: 47.06,
      });
      expect(nanSolar).toBeDefined();
      expect(Array.isArray(nanSolar)).toBe(true);
      expect(nanSolar.length).toBeGreaterThan(0);

      const extremeSolar = useAnnualSolarWorker({
        year: 999999,
        latitude: 47.06,
      });
      expect(extremeSolar).toBeDefined();
      expect(extremeSolar.length).toBeGreaterThan(0);
    });

    it('handles NaN and extreme years in useAnnualLunarWorker without throwing', () => {
      const nanLunar = useAnnualLunarWorker({
        year: NaN,
        latitude: 47.06,
        longitude: -122.81,
      });
      expect(nanLunar).toBeDefined();
      expect(Array.isArray(nanLunar)).toBe(true);
      expect(nanLunar.length).toBeGreaterThan(0);

      const extremeLunar = useAnnualLunarWorker({
        year: 999999,
        latitude: 47.06,
        longitude: -122.81,
      });
      expect(extremeLunar).toBeDefined();
      expect(extremeLunar.length).toBeGreaterThan(0);
    });

    it('guarantees callback delivery in EphemerisWorkerManager fallback even under simulated calculation error', () => {
      vi.stubGlobal('Worker', undefined);
      try {
        const manager = new EphemerisWorkerManager();

        const solarCb = vi.fn();
        manager.requestAnnualSolarCalculation({ year: NaN, latitude: NaN as Latitude }, solarCb);
        expect(solarCb).toHaveBeenCalledTimes(1);
        expect(solarCb.mock.calls[0][0].annualSolar).toBeDefined();

        const lunarCb = vi.fn();
        manager.requestAnnualLunarCalculation(
          { year: NaN, latitude: NaN as Latitude, longitude: NaN as Longitude },
          lunarCb
        );
        expect(lunarCb).toHaveBeenCalledTimes(1);
        expect(lunarCb.mock.calls[0][0].annualLunar).toBeDefined();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('guarantees callback dispatch with safe empty payloads in executeSyncFallbackForEntry when error occurs', () => {
      const manager = new EphemerisWorkerManager();
      const setInCache = <T,>(cache: { set: (k: string, v: T) => unknown }, key: string, value: T) => {
        cache.set(key, value);
      };
      const solarCb = vi.fn();

      const brokenSolarEntry = {
        type: 'ANNUAL_SOLAR' as const,
        signature: 'BROKEN_SOLAR',
        callbacks: new Set([solarCb]),
        params: {
          get year(): number {
            throw new Error('Simulated property accessor failure');
          },
          latitude: 45 as Latitude,
        },
      } satisfies PendingRequestEntry;

      expect(() => {
        executeSyncFallbackForEntry(brokenSolarEntry, manager.annualSolarCache, manager.annualLunarCache, setInCache);
      }).not.toThrow();

      expect(solarCb).toHaveBeenCalledWith({ annualSolar: [] });

      const lunarCb = vi.fn();
      const brokenLunarEntry = {
        type: 'ANNUAL_LUNAR' as const,
        signature: 'BROKEN_LUNAR',
        callbacks: new Set([lunarCb]),
        params: {
          get year(): number {
            throw new Error('Simulated property accessor failure');
          },
          latitude: 45 as Latitude,
          longitude: 0 as Longitude,
        },
      } satisfies PendingRequestEntry;

      expect(() => {
        executeSyncFallbackForEntry(brokenLunarEntry, manager.annualSolarCache, manager.annualLunarCache, setInCache);
      }).not.toThrow();

      expect(lunarCb).toHaveBeenCalledWith({ annualLunar: [] });

      const ephemerisCb = vi.fn();
      const brokenEphemerisEntry = {
        type: 'EPHEMERIS' as const,
        signature: 'BROKEN_EPHEMERIS',
        callbacks: new Set([ephemerisCb]),
        params: {
          get latitude(): Latitude {
            throw new Error('Simulated property accessor failure');
          },
          longitude: 0 as Longitude,
          julianDate: 2451545.0 as JulianDate,
          timeOfDay: 12,
          calculateLunar: true,
          calculateEclipse: true,
        },
      } satisfies PendingRequestEntry;

      expect(() => {
        executeSyncFallbackForEntry(brokenEphemerisEntry, manager.annualSolarCache, manager.annualLunarCache, setInCache);
      }).not.toThrow();

      expect(ephemerisCb).toHaveBeenCalledWith(
        expect.objectContaining({
          lunarEvents: null,
          eclipse: null,
        })
      );
    });

    it('tracks sequence monotonicity per capability lane so fast eclipse responses do not drop slower lunar responses', () => {
      installMockWorker();
      const manager = new EphemerisWorkerManager();
      const lunarCb = vi.fn();
      const eclipseCb = vi.fn();

      manager.requestCalculation(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.0 as JulianDate,
          timeOfDay: 12,
          calculateLunar: true,
          calculateEclipse: false,
        },
        lunarCb
      );
      manager.requestCalculation(
        {
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          julianDate: 2451545.5 as JulianDate,
          timeOfDay: 0,
          calculateLunar: false,
          calculateEclipse: true,
        },
        eclipseCb
      );

      const worker = manager.worker as unknown as MockWorker;
      const lunarReqId = (worker.postMessage.mock.calls[0][0] as { id: number }).id;
      const eclipseReqId = (worker.postMessage.mock.calls[1][0] as { id: number }).id;

      // Fast eclipse-only response (higher id) finishes first
      worker.emitMessage({
        type: 'EPHEMERIS_SUCCESS',
        id: eclipseReqId,
        payload: { lunarEvents: null, eclipse: { type: 'NONE' }, timestamp: 200 },
      });
      // Slower lunar-only response (lower id, different lane) finishes second and MUST still be delivered
      worker.emitMessage({
        type: 'EPHEMERIS_SUCCESS',
        id: lunarReqId,
        payload: { lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 100 },
      });

      expect(eclipseCb).toHaveBeenCalledTimes(1);
      expect(lunarCb).toHaveBeenCalledTimes(1);
      manager.terminate();
    });
  });
});
