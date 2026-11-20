import { useSyncExternalStore, useRef, useCallback } from 'react';
import { CosmicStoreState, StateSelector, StateUpdater } from '../types/store';

export type { CosmicStoreState };

/**
 * Utility for shallow equality comparison between two objects or values.
 * Prevents unnecessary re-renders in useSyncExternalStore when selector outputs an object.
 */
export function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (Object.is(objA, objB)) return true;
  if (objA instanceof Date && objB instanceof Date) {
    return objA.getTime() === objB.getTime();
  }
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const a = objA as Record<string, unknown>;
  const b = objB as Record<string, unknown>;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
    const valA = a[key];
    const valB = b[key];
    if (Object.is(valA, valB)) continue;
    if (valA instanceof Date && valB instanceof Date && valA.getTime() === valB.getTime()) {
      continue;
    }
    return false;
  }
  return true;
}

export class CosmicStore {
  private state: CosmicStoreState;
  private listeners: Set<() => void>;
  private animationFrameId: number | null;
  private lastTickTime: number | null;

  constructor() {
    const now = new Date();
    const initialTimeOfDay = parseFloat(
      (now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600).toFixed(3)
    );

    this.state = {
      date: now,
      timeOfDay: initialTimeOfDay,
      speed: 1,
      isPlaying: false,
      latitude: 47.06,
      longitude: -122.81,
    };

    this.listeners = new Set();
    this.animationFrameId = null;
    this.lastTickTime = null;
  }

  getState = (): CosmicStoreState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setState = (partialState: StateUpdater<CosmicStoreState>): void => {
    const nextState = typeof partialState === 'function' ? partialState(this.state) : partialState;
    let hasChanged = false;
    for (const key in nextState) {
      const k = key as keyof CosmicStoreState;
      const prevVal = this.state[k];
      const nextVal = nextState[k];
      if (prevVal instanceof Date && nextVal instanceof Date) {
        if (prevVal.getTime() !== nextVal.getTime()) {
          hasChanged = true;
          break;
        }
      } else if (!Object.is(prevVal, nextVal)) {
        hasChanged = true;
        break;
      }
    }
    if (hasChanged) {
      this.state = { ...this.state, ...nextState };
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (err) {
          console.error('Error in CosmicStore subscriber:', err);
        }
      });
    }
  };

  setDate = (date: Date): void => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    this.setState({ date });
  };

  setTimeOfDay = (timeOfDay: number): void => {
    if (!Number.isFinite(timeOfDay)) return;
    this.setState({ timeOfDay: Math.max(0, Math.min(24, timeOfDay)) });
  };

  setDateTime = (date: Date, timeOfDay: number): void => {
    const validDate = date instanceof Date && !Number.isNaN(date.getTime());
    const validTime = Number.isFinite(timeOfDay);
    if (!validDate && !validTime) return;
    const partial: Partial<CosmicStoreState> = {};
    if (validDate) partial.date = date;
    if (validTime) partial.timeOfDay = Math.max(0, Math.min(24, timeOfDay));
    this.setState(partial);
  };

  setLatitude = (latitude: number): void => {
    if (!Number.isFinite(latitude)) return;
    this.setState({ latitude: Math.max(-90, Math.min(90, latitude)) });
  };

  setLongitude = (longitude: number): void => {
    if (!Number.isFinite(longitude)) return;
    this.setState({ longitude: Math.max(-180, Math.min(180, longitude)) });
  };

  setObserverLocation = (latitude: number, longitude: number): void => {
    const validLat = Number.isFinite(latitude);
    const validLon = Number.isFinite(longitude);
    if (!validLat && !validLon) return;
    const partial: Partial<CosmicStoreState> = {};
    if (validLat) partial.latitude = Math.max(-90, Math.min(90, latitude));
    if (validLon) partial.longitude = Math.max(-180, Math.min(180, longitude));
    this.setState(partial);
  };

  setSpeed = (speed: number): void => {
    if (!Number.isFinite(speed)) return;
    this.setState({ speed });
  };

  setIsPlaying = (isPlaying: boolean): void => {
    this.setState({ isPlaying });
    if (isPlaying) {
      this.startTicker();
    } else {
      this.stopTicker();
    }
  };

  togglePlay = (): void => {
    this.setIsPlaying(!this.state.isPlaying);
  };

  tickTime = (deltaSeconds: number): void => {
    if (!Number.isFinite(deltaSeconds)) return;
    const { timeOfDay, speed, date } = this.state;
    let newTime = timeOfDay + (deltaSeconds * speed) / 3600;
    let newDate = date;

    if (newTime >= 24) {
      const daysToAdd = Math.floor(newTime / 24);
      newTime = newTime % 24;
      newDate = new Date(date.getTime() + daysToAdd * 86_400_000);
    } else if (newTime < 0) {
      const daysToSub = Math.ceil(Math.abs(newTime) / 24);
      newTime = (newTime % 24 + 24) % 24;
      newDate = new Date(date.getTime() - daysToSub * 86_400_000);
    }

    this.setState({
      timeOfDay: newTime,
      date: newDate,
    });
  };

  startTicker = (): void => {
    if (this.animationFrameId) return;
    this.lastTickTime = performance.now();
    const loop = (now: number) => {
      if (!this.state.isPlaying) {
        this.animationFrameId = null;
        return;
      }
      const deltaMs = Math.max(0, Math.min(now - (this.lastTickTime ?? now), 500));
      this.lastTickTime = now;
      this.tickTime(deltaMs / 1000);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  };

  stopTicker = (): void => {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };
}

export const cosmicStore = new CosmicStore();

const noopSubscribe = (): (() => void) => () => {};

/**
 * Custom hook to subscribe to cosmicStore state slices using React's useSyncExternalStore.
 * Memoizes getSnapshot results via shallow equality to prevent infinite re-render loops.
 * Pass `enabled = false` when all values are externally supplied to skip store subscription overhead.
 */
export function useChronometerStore<T = CosmicStoreState>(
  selector: StateSelector<CosmicStoreState, T> = (state) => state as unknown as T,
  isEquivalent: (a: T, b: T) => boolean = (a, b) => shallowEqual(a, b),
  enabled: boolean = true
): T {
  const lastStateRef = useRef<CosmicStoreState | null>(null);
  const lastSelectorRef = useRef<StateSelector<CosmicStoreState, T> | null>(null);
  const lastSelectedRef = useRef<T | null>(null);
  const hasLastSelectedRef = useRef<boolean>(false);

  const getSnapshot = useCallback((): T => {
    const currentState = cosmicStore.getState();

    if (
      lastStateRef.current === currentState &&
      lastSelectorRef.current === selector &&
      hasLastSelectedRef.current
    ) {
      return lastSelectedRef.current as T;
    }

    const nextSelected = selector(currentState);

    if (hasLastSelectedRef.current && isEquivalent(lastSelectedRef.current as T, nextSelected)) {
      lastStateRef.current = currentState;
      lastSelectorRef.current = selector;
      return lastSelectedRef.current as T;
    }

    lastStateRef.current = currentState;
    lastSelectorRef.current = selector;
    lastSelectedRef.current = nextSelected;
    hasLastSelectedRef.current = true;
    return nextSelected;
  }, [selector, isEquivalent]);

  return useSyncExternalStore(enabled ? cosmicStore.subscribe : noopSubscribe, getSnapshot, getSnapshot);
}

export const cosmicActions = {
  setDate: (d: Date) => cosmicStore.setDate(d),
  setTimeOfDay: (t: number) => cosmicStore.setTimeOfDay(t),
  setDateTime: (d: Date, t: number) => cosmicStore.setDateTime(d, t),
  setLatitude: (lat: number) => cosmicStore.setLatitude(lat),
  setLongitude: (lon: number) => cosmicStore.setLongitude(lon),
  setObserverLocation: (lat: number, lon: number) => cosmicStore.setObserverLocation(lat, lon),
  setSpeed: (s: number) => cosmicStore.setSpeed(s),
  setIsPlaying: (p: boolean) => cosmicStore.setIsPlaying(p),
  togglePlay: () => cosmicStore.togglePlay(),
  tickTime: (dt: number) => cosmicStore.tickTime(dt),
};

// Granular static selectors for optimized selective store subscriptions
export const selectObserverLocation = (s: CosmicStoreState) => ({ latitude: s.latitude, longitude: s.longitude });
export const selectDate = (s: CosmicStoreState) => s.date;
export const selectTimeOfDay = (s: CosmicStoreState) => s.timeOfDay;
export const selectIsPlaying = (s: CosmicStoreState) => s.isPlaying;
export const selectSpeed = (s: CosmicStoreState) => s.speed;

