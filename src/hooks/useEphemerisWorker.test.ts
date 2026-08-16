import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEphemerisWorker, useAnnualSolarWorker, useAnnualLunarWorker } from './useEphemerisWorker';
import { EphemerisWorkerManager, ephemerisWorkerManager } from '../workers/ephemerisWorkerManager';

// Mock React's hooks to execute synchronously in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useMemo: (factory: () => any) => factory(),
    useEffect: (effect: () => any) => effect(),
    useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useRef: (initial: any) => ({ current: initial })
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

  it('returns valid annual solar matrix via synchronous fallback when Worker is unavailable', () => {
    const solarData = useAnnualSolarWorker({
      year: 2026,
      latitude: 47.06
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
      longitude: -122.81
    });

    expect(lunarData).toHaveLength(365);
    expect(lunarData[0].day).toBe(1);
    expect(lunarData[0].distanceKm).toBeGreaterThan(350000);
    expect(lunarData[0].phaseValue).toBeDefined();
  });
});

describe('EphemerisWorkerManager Singleton Suite', () => {
  const originalWorker = globalThis.Worker;

  afterEach(() => {
    globalThis.Worker = originalWorker;
    ephemerisWorkerManager.terminate();
  });

  it('handles environment where Worker is undefined', () => {
    delete (globalThis as any).Worker;
    const manager = new EphemerisWorkerManager();

    expect(manager.isAvailable()).toBe(false);

    const onResult = vi.fn();
    const unsubscribe = manager.requestCalculation({
      latitude: 45,
      longitude: -120,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true
    }, onResult);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('multiplexes multiple requests through a single Worker instance', () => {
    let workerInstanceCount = 0;

    class MockWorker {
      url: any;
      options: any;
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
      constructor(url?: any, options?: any) {
        workerInstanceCount++;
        this.url = url;
        this.options = options;
      }
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    expect(manager.isAvailable()).toBe(true);

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const unsub1 = manager.requestCalculation({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true
    }, cb1);

    const unsub2 = manager.requestCalculation({
      latitude: 35.68,
      longitude: 139.76,
      julianDate: 2451545.0,
      timeOfDay: 18,
      calculateLunar: true,
      calculateEclipse: false
    }, cb2);

    // Exactly 1 worker instance should be created
    expect(workerInstanceCount).toBe(1);
    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(2);
    expect((manager.worker as any).postMessage).toHaveBeenNthCalledWith(1, {
      type: 'CALCULATE_EPHEMERIS',
      id: 1,
      payload: {
        latitude: 47.06,
        longitude: -122.81,
        julianDate: 2451545.0,
        timeOfDay: 12,
        calculateLunar: true,
        calculateEclipse: true
      }
    });
    expect((manager.worker as any).postMessage).toHaveBeenNthCalledWith(2, {
      type: 'CALCULATE_EPHEMERIS',
      id: 2,
      payload: {
        latitude: 35.68,
        longitude: 139.76,
        julianDate: 2451545.0,
        timeOfDay: 18,
        calculateLunar: true,
        calculateEclipse: false
      }
    });

    // Simulate worker response for request 1
    (manager.worker as any).onmessage({
      data: {
        type: 'EPHEMERIS_SUCCESS',
        id: 1,
        payload: { lunarEvents: { test: 1 }, eclipse: null, timestamp: 100 }
      }
    });

    expect(cb1).toHaveBeenCalledWith({ lunarEvents: { test: 1 }, eclipse: null, timestamp: 100 });
    expect(cb2).not.toHaveBeenCalled();

    // Test unsubscribe before response for request 2
    unsub2();

    (manager.worker as any).onmessage({
      data: {
        type: 'EPHEMERIS_SUCCESS',
        id: 2,
        payload: { lunarEvents: { test: 2 }, eclipse: null, timestamp: 200 }
      }
    });
    expect(cb2).not.toHaveBeenCalled();

    unsub1();
  });

  it('coalesces concurrent requests with identical parameters into a single worker postMessage call', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const identicalParams = {
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true
    };

    // Dispatch 2 requests with identical parameters
    manager.requestCalculation(identicalParams, cb1);
    manager.requestCalculation(identicalParams, cb2);

    // Should only have posted 1 message to the worker thread
    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(1);

    // When worker responds, both callbacks must receive the payload
    (manager.worker as any).onmessage({
      data: {
        type: 'EPHEMERIS_SUCCESS',
        id: 1,
        payload: { lunarEvents: { distanceKm: 384400 }, eclipse: { type: 'NONE' }, timestamp: 500 }
      }
    });
    expect(cb1).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: { type: 'NONE' }, timestamp: 500 });
    expect(cb2).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: { type: 'NONE' }, timestamp: 500 });
  });

  it('deduplicates and coalesces identical in-flight requests without sending duplicate messages', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const params = {
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true
    };

    const unsub1 = manager.requestCalculation(params, cb1);
    const unsub2 = manager.requestCalculation(params, cb2);

    // Only 1 message should be sent to worker despite 2 subscribers
    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(1);

    // Simulate successful worker response
    (manager.worker as any).onmessage({
      data: {
        type: 'EPHEMERIS_SUCCESS',
        id: 1,
        payload: { lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 12345 }
      }
    });

    // Both subscribers should receive the payload
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 12345 });
    expect(cb2).toHaveBeenCalledWith({ lunarEvents: { distanceKm: 384400 }, eclipse: null, timestamp: 12345 });

    unsub1();
    unsub2();
  });

  it('handles worker errors gracefully and dispatches fallback calculations to pending callbacks', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestCalculation({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true
    }, cb);

    expect(manager.worker).not.toBeNull();

    // Trigger worker error
    (manager.worker as any).onerror(new Error('Worker script load failure'));

    expect(manager.isAvailable()).toBe(false);
    expect(manager.worker).toBeNull();
    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.lunarEvents).not.toBeNull();
    expect(payload.eclipse).not.toBeNull();
  });

  it('dispatches synchronous fallback calculations on EPHEMERIS_ERROR message', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestCalculation({
      latitude: 47.06,
      longitude: -122.81,
      julianDate: 2451545.0,
      timeOfDay: 12,
      calculateLunar: true,
      calculateEclipse: true
    }, cb);

    (manager.worker as any).onmessage({
      data: {
        type: 'EPHEMERIS_ERROR',
        id: 1,
        error: 'Calculation error'
      }
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.lunarEvents).not.toBeNull();
    expect(payload.eclipse).not.toBeNull();
  });

  it('handles annual solar calculation dispatch, result delivery, and deduplication', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    // Coalesced in-flight requests
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: 47.06 }, cb1);
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: 47.06 }, cb2);

    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(1);
    expect((manager.worker as any).postMessage).toHaveBeenCalledWith({
      type: 'CALCULATE_ANNUAL_SOLAR',
      id: 1,
      payload: { year: 2026, latitude: 47.06 }
    });

    // Simulate worker success response
    const mockSolar = [{ day: 1, sunrise: 7.5, sunset: 16.5 }];
    (manager.worker as any).onmessage({
      data: {
        type: 'ANNUAL_SOLAR_SUCCESS',
        id: 1,
        payload: { annualSolar: mockSolar }
      }
    });

    expect(cb1).toHaveBeenCalledWith({ annualSolar: mockSolar });
    expect(cb2).toHaveBeenCalledWith({ annualSolar: mockSolar });

    // Subsequent request should hit cache directly without posting to worker
    const cb3 = vi.fn();
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: 47.06 }, cb3);
    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(1); // Still 1
    expect(cb3).toHaveBeenCalledWith({ annualSolar: mockSolar });
  });

  it('handles annual solar fallback on ANNUAL_SOLAR_ERROR', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestAnnualSolarCalculation({ year: 2026, latitude: 47.06 }, cb);

    (manager.worker as any).onmessage({
      data: {
        type: 'ANNUAL_SOLAR_ERROR',
        id: 1,
        error: 'Failed'
      }
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.annualSolar).toHaveLength(365);
  });

  it('handles annual lunar calculation dispatch, result delivery, and deduplication', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb1 = vi.fn();
    const cb2 = vi.fn();

    // Coalesced in-flight requests
    manager.requestAnnualLunarCalculation({ year: 2026, latitude: 47.06, longitude: -122.81 }, cb1);
    manager.requestAnnualLunarCalculation({ year: 2026, latitude: 47.06, longitude: -122.81 }, cb2);

    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(1);
    expect((manager.worker as any).postMessage).toHaveBeenCalledWith({
      type: 'CALCULATE_ANNUAL_LUNAR',
      id: 1,
      payload: { year: 2026, latitude: 47.06, longitude: -122.81 }
    });

    // Simulate worker success response
    const mockLunar = [{ day: 1, moonrise: 10, moonset: 22, distanceKm: 384400 }];
    (manager.worker as any).onmessage({
      data: {
        type: 'ANNUAL_LUNAR_SUCCESS',
        id: 1,
        payload: { annualLunar: mockLunar }
      }
    });

    expect(cb1).toHaveBeenCalledWith({ annualLunar: mockLunar });
    expect(cb2).toHaveBeenCalledWith({ annualLunar: mockLunar });

    // Subsequent request should hit cache directly without posting to worker
    const cb3 = vi.fn();
    manager.requestAnnualLunarCalculation({ year: 2026, latitude: 47.06, longitude: -122.81 }, cb3);
    expect((manager.worker as any).postMessage).toHaveBeenCalledTimes(1); // Still 1
    expect(cb3).toHaveBeenCalledWith({ annualLunar: mockLunar });
  });

  it('handles annual lunar fallback on ANNUAL_LUNAR_ERROR', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestAnnualLunarCalculation({ year: 2026, latitude: 47.06, longitude: -122.81 }, cb);

    (manager.worker as any).onmessage({
      data: {
        type: 'ANNUAL_LUNAR_ERROR',
        id: 1,
        error: 'Failed'
      }
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.annualLunar).toHaveLength(365);
  });

  it('terminates active worker and clears pending requests on terminate()', () => {
    class MockWorker {
      postMessage: any = vi.fn();
      terminate: any = vi.fn();
      onmessage: any = null;
      onerror: any = null;
    }

    globalThis.Worker = MockWorker as any;
    const manager = new EphemerisWorkerManager();

    const cb = vi.fn();
    manager.requestCalculation({
      latitude: 0,
      longitude: 0,
      julianDate: 2451545.0,
      timeOfDay: 0,
      calculateLunar: true,
      calculateEclipse: true
    }, cb);

    const workerInstance = manager.worker as any;
    expect(workerInstance).not.toBeNull();

    manager.terminate();
    expect(workerInstance.terminate).toHaveBeenCalled();
    expect(manager.worker).toBeNull();
    expect(manager.pendingRequests.size).toBe(0);
    expect(manager.annualSolarCache.size).toBe(0);
    expect(manager.annualLunarCache.size).toBe(0);
  });
});
