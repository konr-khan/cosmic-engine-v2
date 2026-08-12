import { useSyncExternalStore, useRef, useCallback } from 'react';

/**
 * Utility for shallow equality comparison between two objects or values.
 * Prevents unnecessary re-renders in useSyncExternalStore when selector outputs an object.
 */
export function shallowEqual(objA, objB) {
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

class CosmicStore {
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

  getState = () => this.state;

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setState = (partialState) => {
    const nextState = typeof partialState === 'function' ? partialState(this.state) : partialState;
    let hasChanged = false;
    for (const key in nextState) {
      if (this.state[key] !== nextState[key]) {
        hasChanged = true;
        break;
      }
    }
    if (hasChanged) {
      this.state = { ...this.state, ...nextState };
      this.listeners.forEach((listener) => listener());
    }
  };

  setDate = (date) => this.setState({ date });
  setTimeOfDay = (timeOfDay) => this.setState({ timeOfDay });
  setLatitude = (latitude) => this.setState({ latitude });
  setLongitude = (longitude) => this.setState({ longitude });
  setObserverLocation = (latitude, longitude) => this.setState({ latitude, longitude });
  setSpeed = (speed) => this.setState({ speed });
  setUseAnalemma = (useAnalemma) => this.setState({ useAnalemma });

  setIsPlaying = (isPlaying) => {
    this.setState({ isPlaying });
    if (isPlaying) {
      this.startTicker();
    } else {
      this.stopTicker();
    }
  };

  togglePlay = () => {
    this.setIsPlaying(!this.state.isPlaying);
  };

  tickTime = (deltaSeconds) => {
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

  startTicker = () => {
    if (this.animationFrameId) return;
    this.lastTickTime = performance.now();
    const loop = (now) => {
      if (!this.state.isPlaying) {
        this.animationFrameId = null;
        return;
      }
      const deltaMs = now - this.lastTickTime;
      this.lastTickTime = now;
      this.tickTime(deltaMs / 1000);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  };

  stopTicker = () => {
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
export function useChronometerStore(selector = (state) => state, isEquivalent = shallowEqual) {
  const lastStateRef = useRef(null);
  const lastSelectedRef = useRef(null);

  const getSnapshot = useCallback(() => {
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
  setDate: (d) => cosmicStore.setDate(d),
  setTimeOfDay: (t) => cosmicStore.setTimeOfDay(t),
  setLatitude: (lat) => cosmicStore.setLatitude(lat),
  setLongitude: (lon) => cosmicStore.setLongitude(lon),
  setObserverLocation: (lat, lon) => cosmicStore.setObserverLocation(lat, lon),
  setSpeed: (s) => cosmicStore.setSpeed(s),
  setIsPlaying: (p) => cosmicStore.setIsPlaying(p),
  togglePlay: () => cosmicStore.togglePlay(),
  setUseAnalemma: (u) => cosmicStore.setUseAnalemma(u),
  tickTime: (dt) => cosmicStore.tickTime(dt),
};
