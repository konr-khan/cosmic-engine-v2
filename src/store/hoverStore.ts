/**
 * @file hoverStore.ts
 * Dedicated external micro-store for cross-card interactive hover synchronization.
 * 
 * Isolates scrub state (hoverTime, hoverDate) from the root React tree, preventing
 * top-level re-render cascades across non-consuming observatory widgets.
 */

import { useSyncExternalStore, useCallback } from 'react';

export interface HoverState {
  hoverTime: number | null;
  hoverDate: Date | null;
}

export class HoverStore {
  private state: HoverState = {
    hoverTime: null,
    hoverDate: null
  };
  private listeners: Set<() => void> = new Set();

  getState = (): HoverState => {
    return this.state;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('HoverStore subscriber error:', e);
      }
    });
  }

  setHoverTime = (time: number | null): void => {
    if (this.state.hoverTime === time) return;
    this.state = {
      ...this.state,
      hoverTime: time
    };
    this.notify();
  };

  setHoverDate = (date: Date | null): void => {
    const prevTime = this.state.hoverDate?.getTime();
    const nextTime = date?.getTime();
    if (prevTime === nextTime) return;
    this.state = {
      ...this.state,
      hoverDate: date
    };
    this.notify();
  };

  clearHover = (): void => {
    if (this.state.hoverTime === null && this.state.hoverDate === null) return;
    this.state = {
      hoverTime: null,
      hoverDate: null
    };
    this.notify();
  };
}

export const hoverStore = new HoverStore();

export const hoverActions = {
  setHoverTime: (time: number | null) => hoverStore.setHoverTime(time),
  setHoverDate: (date: Date | null) => hoverStore.setHoverDate(date),
  clearHover: () => hoverStore.clearHover()
};

/**
 * Hook to selectively subscribe only to `hoverTime`.
 * Components using this will only re-render when `hoverTime` changes.
 */
export function useHoverTime(): number | null {
  const getSnapshot = useCallback(() => hoverStore.getState().hoverTime, []);
  return useSyncExternalStore(hoverStore.subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to selectively subscribe only to `hoverDate`.
 * Components using this will only re-render when `hoverDate` changes.
 */
export function useHoverDate(): Date | null {
  const getSnapshot = useCallback(() => hoverStore.getState().hoverDate, []);
  return useSyncExternalStore(hoverStore.subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to subscribe to the full hover state.
 */
export function useHoverState(): HoverState {
  const getSnapshot = useCallback(() => hoverStore.getState(), []);
  return useSyncExternalStore(hoverStore.subscribe, getSnapshot, getSnapshot);
}
