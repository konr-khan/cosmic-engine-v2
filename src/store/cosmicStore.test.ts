import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cosmicStore, cosmicActions, shallowEqual } from './cosmicStore';

describe('Cosmic Store & State Isolation Suite', () => {
  beforeEach(() => {
    cosmicActions.setDate(new Date(2026, 5, 21));
    cosmicActions.setTimeOfDay(12);
    cosmicActions.setLatitude(47.06);
    cosmicActions.setLongitude(-122.81);
    cosmicActions.setUseAnalemma(true);
    cosmicActions.setSpeed(1);
    cosmicActions.setIsPlaying(false);
  });

  it('initializes with default state properties', () => {
    const state = cosmicStore.getState();
    expect(state.latitude).toBe(47.06);
    expect(state.longitude).toBe(-122.81);
    expect(state.useAnalemma).toBe(true);
    expect(state.timeOfDay).toBe(12);
  });

  it('updates state slices and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = cosmicStore.subscribe(listener);

    cosmicActions.setTimeOfDay(14.5);
    expect(cosmicStore.getState().timeOfDay).toBe(14.5);
    expect(listener).toHaveBeenCalledTimes(1);

    cosmicActions.setObserverLocation(35.68, 139.76);
    expect(cosmicStore.getState().latitude).toBe(35.68);
    expect(cosmicStore.getState().longitude).toBe(139.76);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('performs tickTime calculations correctly across 24h day boundary', () => {
    cosmicActions.setTimeOfDay(23.5);
    const initialDate = new Date(2026, 5, 21);
    cosmicActions.setDate(initialDate);

    // Tick forward by 1 hour (3600 seconds)
    cosmicActions.tickTime(3600);

    const updatedState = cosmicStore.getState();
    expect(updatedState.timeOfDay).toBeCloseTo(0.5, 3);
    expect(updatedState.date.getDate()).toBe(22);
  });

  it('evaluates shallowEqual correctly for objects and primitives', () => {
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual(42, 42)).toBe(true);
    expect(shallowEqual(42, 43)).toBe(false);
  });

  it('clamps deltaMs to 500ms when resuming or catching up in animation frame ticker', () => {
    let frameCallback: ((time: number) => void) | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      frameCallback = cb;
      return 123;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const nowMock = vi.spyOn(performance, 'now');
    nowMock.mockReturnValue(1000);

    cosmicActions.setSpeed(1);
    cosmicActions.setTimeOfDay(12);
    cosmicActions.setIsPlaying(true);

    // Simulate 5000ms leap in performance.now (e.g. inactive tab resuming)
    nowMock.mockReturnValue(6000);
    if (frameCallback) {
      (frameCallback as (time: number) => void)(6000);
    }

    const updatedState = cosmicStore.getState();
    // Delta should be clamped to 500ms = 0.5s => (12 + 0.5 / 3600) hours
    expect(updatedState.timeOfDay).toBeCloseTo(12 + 0.5 / 3600, 4);

    cosmicActions.setIsPlaying(false);
    vi.unstubAllGlobals();
    nowMock.mockRestore();
  });
});
