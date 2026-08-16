import { useSyncExternalStore, useRef, useCallback } from 'react';
import { CosmicStoreState, StateSelector, StateUpdater } from '../types/store';

/**
 * Utility for shallow equality comparison between two objects or values.
 * Prevents unnecessary re-renders in useSyncExternalStore when selector outputs an object.
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
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
      useAnalemma: true,
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
      if (this.state[k] !== nextState[k]) {
        hasChanged = true;
        break;
      }
    }
    if (hasChanged) {
      this.state = { ...this.state, ...nextState };
      this.listeners.forEach((listener) => listener());
    }
  };

  setDate = (date: Date): void => this.setState({ date });
  setTimeOfDay = (timeOfDay: number): void => this.setState({ timeOfDay });
  setLatitude = (latitude: number): void => this.setState({ latitude });
  setLongitude = (longitude: number): void => this.setState({ longitude });
  setObserverLocation = (latitude: number, longitude: number): void => this.setState({ latitude, longitude });
  setSpeed = (speed: number): void => this.setState({ speed });
  setUseAnalemma = (useAnalemma: boolean): void => this.setState({ useAnalemma });

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
    const { timeOfDay, speed, date } = this.state;
    let newTime = timeOfDay + (deltaSeconds * speed) / 3600;
    let newDate = date;

    if (newTime >= 24) {
      const daysToAdd = Math.floor(newTime / 24);
      newTime = newTime % 24;
      newDate = new Date(date);
      newDate.setDate(newDate.getDate() + daysToAdd);
    } else if (newTime < 0) {
      const daysToSub = Math.ceil(Math.abs(newTime) / 24);
      newTime = (newTime % 24 + 24) % 24;
      newDate = new Date(date);
      newDate.setDate(newDate.getDate() - daysToSub);
    }

    this.setState({
      timeOfDay: parseFloat(newTime.toFixed(4)),
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
      const deltaMs = Math.min(now - (this.lastTickTime || now), 500);
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

/**
 * Custom hook to subscribe to cosmicStore state slices using React's useSyncExternalStore.
 * Memoizes getSnapshot results via shallow equality to prevent infinite re-render loops.
 */
export function useChronometerStore<T = CosmicStoreState>(
  selector: StateSelector<CosmicStoreState, T> = (state) => state as unknown as T,
  isEquivalent: (a: any, b: any) => boolean = shallowEqual
): T {
  const lastStateRef = useRef<CosmicStoreState | null>(null);
  const lastSelectedRef = useRef<T | null>(null);

  const getSnapshot = useCallback((): T => {
    const currentState = cosmicStore.getState();

    if (lastStateRef.current === currentState && lastSelectedRef.current !== null) {
      return lastSelectedRef.current;
    }

    const nextSelected = selector(currentState);

    if (lastSelectedRef.current !== null && isEquivalent(lastSelectedRef.current, nextSelected)) {
      lastStateRef.current = currentState;
      return lastSelectedRef.current;
    }

    lastStateRef.current = currentState;
    lastSelectedRef.current = nextSelected;
    return nextSelected;
  }, [selector, isEquivalent]);

  try {
    return useSyncExternalStore(cosmicStore.subscribe, getSnapshot, getSnapshot);
  } catch (e) {
    return selector(cosmicStore.getState());
  }
}

export const cosmicActions = {
  setDate: (d: Date) => cosmicStore.setDate(d),
  setTimeOfDay: (t: number) => cosmicStore.setTimeOfDay(t),
  setLatitude: (lat: number) => cosmicStore.setLatitude(lat),
  setLongitude: (lon: number) => cosmicStore.setLongitude(lon),
  setObserverLocation: (lat: number, lon: number) => cosmicStore.setObserverLocation(lat, lon),
  setSpeed: (s: number) => cosmicStore.setSpeed(s),
  setIsPlaying: (p: boolean) => cosmicStore.setIsPlaying(p),
  togglePlay: () => cosmicStore.togglePlay(),
  setUseAnalemma: (u: boolean) => cosmicStore.setUseAnalemma(u),
  tickTime: (dt: number) => cosmicStore.tickTime(dt),
};
