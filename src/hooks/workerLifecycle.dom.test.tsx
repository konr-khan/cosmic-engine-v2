// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { MockWorker, installMockWorker } from '../workers/mockWorkerFixture';
import { useDashboardLayout, STORAGE_KEY } from './useDashboardLayout';
import { Latitude, Longitude, HoursDecimal, JulianDate } from '../types/units';
import { EclipseData, LunarEvents } from '../types/astronomy';

describe('Real-DOM <StrictMode> Hook Lifecycle & Persistence Integration', () => {
  const originalWorker = globalThis.Worker;
  const originalLocalStorageDesc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  beforeAll(() => {
    const jsdomWin = (globalThis as unknown as { jsdom?: { window: Window } }).jsdom?.window;
    if (jsdomWin?.localStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: jsdomWin.localStorage,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  });

  afterAll(() => {
    if (originalLocalStorageDesc) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDesc);
    }
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    globalThis.Worker = originalWorker;
    MockWorker.reset();
  });

  it('maintains persistent worker subscription under React 19 <StrictMode>, preserves 60 FPS frames, and disposes cleanly on unmount', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    installMockWorker();

    const { ephemerisWorkerManager } = await import('../workers/ephemerisWorkerManager');
    const { useEphemerisWorker } = await import('./useEphemerisWorker');

    interface HarnessProps {
      jd: number;
      timeOfDay: number;
      enabled?: boolean;
    }

    const WorkerHarness: React.FC<HarnessProps> = ({ jd, timeOfDay, enabled = true }) => {
      const { lunarEvents, eclipse, isWorkerActive } = useEphemerisWorker({
        latitude: 47.06 as Latitude,
        longitude: -122.81 as Longitude,
        julianDate: jd as JulianDate,
        timeOfDay: timeOfDay as HoursDecimal,
        isLunarActive: enabled,
        isEclipseActive: enabled,
        isOrbitalActive: enabled,
        throttleMs: 100,
      });
      return (
        <div>
          <span data-testid="worker-active">{String(isWorkerActive)}</span>
          <span data-testid="lunar-dist">{lunarEvents?.distanceKm ?? 'none'}</span>
          <span data-testid="eclipse-type">{eclipse?.type ?? 'none'}</span>
        </div>
      );
    };

    try {
      const { getByTestId, rerender, unmount } = render(
        <StrictMode>
          <WorkerHarness jd={2451545.0} timeOfDay={12} />
        </StrictMode>
      );

      expect(getByTestId('worker-active').textContent).toBe('true');
      const worker = ephemerisWorkerManager.worker as unknown as MockWorker;
      expect(worker).toBeDefined();
      // StrictMode simulated unmount disposes Mount 1's request id=1 without terminating the singleton worker,
      // and Mount 2 queues JD=2451545.0 inside the 100ms throttle window.
      expect(worker.terminate).not.toHaveBeenCalled();
      expect(worker.postMessage).toHaveBeenCalledTimes(1);
      const discardedStrictMsg = worker.postMessage.mock.calls[0][0] as { id: number; payload: { julianDate: number } };
      expect(discardedStrictMsg.payload.julianDate).toBe(2451545.0);
      expect(ephemerisWorkerManager.pendingRequests.has(discardedStrictMsg.id)).toBe(false);

      // Settle StrictMode Mount 2's initial throttled request (100ms) -> id=2 is now active in flight
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(worker.postMessage).toHaveBeenCalledTimes(2);
      const activeMsg = worker.postMessage.mock.calls[1][0] as { id: number; payload: { julianDate: number } };
      expect(activeMsg.payload.julianDate).toBe(2451545.0);
      expect(ephemerisWorkerManager.pendingRequests.has(activeMsg.id)).toBe(true);

      // Simulate rapid 60 FPS ticks (16ms increments) while id=2 is still in-flight
      act(() => {
        vi.advanceTimersByTime(16);
        rerender(
          <StrictMode>
            <WorkerHarness jd={2451545.01} timeOfDay={12.24} />
          </StrictMode>
        );
      });
      act(() => {
        vi.advanceTimersByTime(16);
        rerender(
          <StrictMode>
            <WorkerHarness jd={2451545.02} timeOfDay={12.48} />
          </StrictMode>
        );
      });

      // Resolve in-flight id=2 first -> worker response updates state smoothly without being aborted by 16ms rerenders
      expect(ephemerisWorkerManager.pendingRequests.has(activeMsg.id)).toBe(true);
      act(() => {
        worker.emitMessage({
          type: 'EPHEMERIS_SUCCESS',
          id: activeMsg.id,
          payload: {
            lunarEvents: { distanceKm: 363300, moonrise: 6, transit: 12, moonset: 18 } as unknown as LunarEvents,
            eclipse: { type: 'TOTAL_SOLAR' } as unknown as EclipseData,
            timestamp: 1000,
          },
        });
      });

      // Wait remaining throttle window (~68ms -> 100ms total) for trailing frame JD=2451545.02
      act(() => {
        vi.advanceTimersByTime(70);
      });

      expect(worker.postMessage).toHaveBeenCalledTimes(3);
      const trailingMsg = worker.postMessage.mock.calls[2][0] as { id: number; payload: { julianDate: number } };
      expect(trailingMsg.payload.julianDate).toBe(2451545.02);

      act(() => {
        worker.emitMessage({
          type: 'EPHEMERIS_SUCCESS',
          id: trailingMsg.id,
          payload: {
            lunarEvents: { distanceKm: 391234, moonrise: 7, transit: 13, moonset: 19 } as unknown as LunarEvents,
            eclipse: { type: 'TOTAL_LUNAR' } as unknown as EclipseData,
            timestamp: 2000,
          },
        });
      });

      expect(getByTestId('lunar-dist').textContent).toBe('391234');
      expect(getByTestId('eclipse-type').textContent).toBe('TOTAL_LUNAR');

      // Disable orbital calculation -> effect cleanup/re-run clears worker state
      act(() => {
        rerender(
          <StrictMode>
            <WorkerHarness jd={2451545.02} timeOfDay={12.48} enabled={false} />
          </StrictMode>
        );
      });

      // Queue another frame then unmount cleanly before completion -> zero dangling pending callbacks
      act(() => {
        rerender(
          <StrictMode>
            <WorkerHarness jd={2451545.05} timeOfDay={13.0} enabled={true} />
          </StrictMode>
        );
      });
      unmount();

      expect(ephemerisWorkerManager.pendingRequests.size).toBe(0);
    } finally {
      const { ephemerisWorkerManager } = await import('../workers/ephemerisWorkerManager');
      ephemerisWorkerManager.terminate();
    }
  });

  it('delivers async useAnnualSolarWorker results safely and skips post-unmount state updates', async () => {
    vi.resetModules();
    installMockWorker();

    const { ephemerisWorkerManager, EphemerisWorkerManager: ReloadedManager } = await import('../workers/ephemerisWorkerManager');
    const { useAnnualSolarWorker } = await import('./useEphemerisWorker');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const AnnualHarness: React.FC = () => {
      const items = useAnnualSolarWorker({
        year: 2026,
        latitude: 47.06 as Latitude,
      });
      return <span data-testid="annual-len">{items.length}</span>;
    };

    try {
      const { getByTestId, unmount } = render(
        <StrictMode>
          <AnnualHarness />
        </StrictMode>
      );

      // Synchronous warm seed gives immediate 365-day array
      expect(getByTestId('annual-len').textContent).toBe('365');
      expect(ephemerisWorkerManager).toBeInstanceOf(ReloadedManager);

      unmount();
      // Emit synthetic message post-unmount -> no React warnings or uncaught errors
      const worker = ephemerisWorkerManager.worker as unknown as MockWorker;
      act(() => {
        worker?.emitMessage({
          type: 'ANNUAL_SOLAR_SUCCESS',
          id: 999,
          payload: { annualSolar: [] },
        });
      });
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      ephemerisWorkerManager.terminate();
    }
  });

  it('persists preset and toggled widget state across remounts in real localStorage under <StrictMode>', () => {
    vi.useFakeTimers();
    let capturedLayout!: ReturnType<typeof useDashboardLayout>;

    const LayoutHarness: React.FC = () => {
      capturedLayout = useDashboardLayout();
      return (
        <div>
          <span data-testid="preset">{capturedLayout.activePresetKey}</span>
          <span data-testid="window-count">{capturedLayout.windows.length}</span>
          <span data-testid="today-visible">{String(capturedLayout.widgets.today)}</span>
        </div>
      );
    };

    const firstMount = render(
      <StrictMode>
        <LayoutHarness />
      </StrictMode>
    );

    expect(firstMount.getByTestId('preset').textContent).toBe('master');
    expect(firstMount.getByTestId('today-visible').textContent).toBe('true');

    // Switch to 'horology' preset
    act(() => {
      capturedLayout.handleSelectPreset('horology');
    });
    expect(firstMount.getByTestId('preset').textContent).toBe('horology');
    expect(firstMount.getByTestId('window-count').textContent).toBe('4');

    // Toggle 'today' widget off under <StrictMode> -> widgets.today turns false while window layout slots remain intact
    act(() => {
      capturedLayout.toggleWidget('today');
    });
    expect(firstMount.getByTestId('today-visible').textContent).toBe('false');
    expect(capturedLayout.windows.length).toBe(4);

    // Flush debounced localStorage save (300ms) and unmount
    act(() => {
      vi.advanceTimersByTime(350);
    });
    firstMount.unmount();

    const rawSaved = localStorage.getItem(STORAGE_KEY);
    expect(rawSaved).not.toBeNull();

    // Fresh mount restores both 'horology' preset and hidden 'today' widget cleanly
    const secondMount = render(
      <StrictMode>
        <LayoutHarness />
      </StrictMode>
    );
    expect(secondMount.getByTestId('preset').textContent).toBe('horology');
    expect(secondMount.getByTestId('today-visible').textContent).toBe('false');
    expect(secondMount.getByTestId('window-count').textContent).toBe('4');
  });
});
