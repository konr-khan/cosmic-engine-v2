import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hoverStore, hoverActions } from './hoverStore';

describe('HoverStore & State Isolation Suite', () => {
  beforeEach(() => {
    hoverActions.clearHover();
  });

  it('initializes with null hover state', () => {
    const state = hoverStore.getState();
    expect(state.hoverTime).toBeNull();
    expect(state.hoverDate).toBeNull();
  });

  it('updates hoverTime and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = hoverStore.subscribe(listener);

    hoverActions.setHoverTime(14.25);
    expect(hoverStore.getState().hoverTime).toBe(14.25);
    expect(listener).toHaveBeenCalledTimes(1);

    // Setting identical time does not notify
    hoverActions.setHoverTime(14.25);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('updates hoverDate and avoids duplicate notification for same timestamp', () => {
    const listener = vi.fn();
    const unsubscribe = hoverStore.subscribe(listener);

    const d1 = new Date(2026, 5, 21);
    hoverActions.setHoverDate(d1);
    expect(hoverStore.getState().hoverDate).toEqual(d1);
    expect(listener).toHaveBeenCalledTimes(1);

    // Date with identical timestamp should not re-trigger
    const d2 = new Date(d1.getTime());
    hoverActions.setHoverDate(d2);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('clears hover state and notifies listeners', () => {
    hoverActions.setHoverTime(18);
    const listener = vi.fn();
    const unsubscribe = hoverStore.subscribe(listener);

    hoverActions.clearHover();
    expect(hoverStore.getState().hoverTime).toBeNull();
    expect(hoverStore.getState().hoverDate).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    // Clearing already empty state does not trigger listeners
    hoverActions.clearHover();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
