import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEphemerisWorker } from './useEphemerisWorker';
import { EphemerisWorkerManager, ephemerisWorkerManager } from '../workers/ephemerisWorkerManager';

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

describe('EphemerisWorkerManager Singleton Suite', () => {
  const originalWorker = globalThis.Worker;

  afterEach(() => {
    globalThis.Worker = originalWorker;
    ephemerisWorkerManager.terminate();
  });

  it('handles environment where Worker is undefined', () => {
    delete globalThis.Worker;
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
      constructor(url, options) {
        workerInstanceCount++;
        this.url = url;
        this.options = options;
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
      }
    }

    globalThis.Worker = MockWorker;
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
    expect(manager.worker.postMessage).toHaveBeenCalledTimes(2);
    expect(manager.worker.postMessage).toHaveBeenNthCalledWith(1, {
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
    expect(manager.worker.postMessage).toHaveBeenNthCalledWith(2, {
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
    manager.worker.onmessage({
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
    manager.worker.onmessage({
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
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
      }
    }

    globalThis.Worker = MockWorker;
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
    expect(manager.worker.postMessage).toHaveBeenCalledTimes(1);

    // When worker responds, both callbacks must receive the payload
    manager.worker.onmessage({
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
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
      }
    }

    globalThis.Worker = MockWorker;
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
    expect(manager.worker.postMessage).toHaveBeenCalledTimes(1);

    // Simulate successful worker response
    manager.worker.onmessage({
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
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
      }
    }

    globalThis.Worker = MockWorker;
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
    manager.worker.onerror(new Error('Worker script load failure'));

    expect(manager.isAvailable()).toBe(false);
    expect(manager.worker).toBeNull();
    expect(cb).toHaveBeenCalledTimes(1);
    const payload = cb.mock.calls[0][0];
    expect(payload.lunarEvents).not.toBeNull();
    expect(payload.eclipse).not.toBeNull();
  });

  it('dispatches synchronous fallback calculations on EPHEMERIS_ERROR message', () => {
    class MockWorker {
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
      }
    }

    globalThis.Worker = MockWorker;
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

    manager.worker.onmessage({
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

  it('terminates active worker and clears pending requests on terminate()', () => {
    class MockWorker {
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
      }
    }

    globalThis.Worker = MockWorker;
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

    const workerInstance = manager.worker;
    expect(workerInstance).not.toBeNull();

    manager.terminate();
    expect(workerInstance.terminate).toHaveBeenCalled();
    expect(manager.worker).toBeNull();
    expect(manager.pendingRequests.size).toBe(0);
  });
});
