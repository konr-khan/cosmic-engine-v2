// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import App from './App';
import { cosmicActions, cosmicStore } from './store/cosmicStore';
import { STORAGE_KEY } from './hooks/useDashboardLayout';
import { ArmillarySvgCanvas } from './components/widgets/armillary/ArmillarySvgCanvas';
import { generateArmillaryModel, getJulianDate, calculateEphemerisFrame } from './utils/cosmicMath';
import { Latitude, Longitude, HoursDecimal, Degrees } from './types/units';

describe('Real-DOM <StrictMode> App, Store Subscriptions & Interaction Tests', () => {
  const initialDate = new Date('2026-06-21T12:00:00Z');
  const originalLocalStorageDesc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  beforeAll(() => {
    // Node 25+ defines a non-functional globalThis.localStorage getter when --localstorage-file is omitted,
    // which Vitest's populateGlobal skips overriding. Bind jsdom's real Storage implementation here.
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
    act(() => {
      cosmicActions.setIsPlaying(false);
      cosmicActions.setDate(initialDate);
      cosmicActions.setTimeOfDay(12.0);
      cosmicActions.setLatitude(47.06);
      cosmicActions.setLongitude(-122.81);
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('mounts <App /> under <StrictMode>, switches workspace presets via ObsNavbar, and persists across reload', () => {
    vi.useFakeTimers();

    const firstRender = render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    expect(firstRender.getByText('COSMIC')).toBeTruthy();
    expect(firstRender.getByText('Eclipse Mechanics & Shadow Geometry')).toBeTruthy();

    // Open Presets dropdown and choose Renaissance Horology Suite (hides eclipse/map/macro/tides)
    const presetsBtn = firstRender.getByRole('button', { name: /Presets/i });
    fireEvent.click(presetsBtn);
    const horologyOption = firstRender.getByRole('menuitem', { name: /Renaissance Horology Suite/i });
    fireEvent.click(horologyOption);

    expect(firstRender.queryByText('Eclipse Mechanics & Shadow Geometry')).toBeNull();
    expect(firstRender.getByText('Gyro-Morph Armillary & Astrolabe Projections')).toBeTruthy();

    // Open Simulation Layers menu and toggle Solar Almanac off, then close the dropdown menu
    const layersBtn = firstRender.getByRole('button', { name: /Simulation Layers/i });
    fireEvent.click(layersBtn);
    const solarLayerToggle = firstRender.getByRole('menuitemcheckbox', { name: /Solar Almanac & 24h Polar Clock/i });
    fireEvent.click(solarLayerToggle);
    fireEvent.click(layersBtn);

    expect(firstRender.queryByText('Solar Almanac & 24h Polar Clock')).toBeNull();

    // Flush 300ms debounced localStorage save and unmount -> verify restored state in fresh <App /> mount
    act(() => {
      vi.advanceTimersByTime(350);
    });
    firstRender.unmount();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('horology');

    const reloadedRender = render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    expect(reloadedRender.queryByText('Eclipse Mechanics & Shadow Geometry')).toBeNull();
    expect(reloadedRender.queryByText('Solar Almanac & 24h Polar Clock')).toBeNull();
    expect(reloadedRender.getByText('Gyro-Morph Armillary & Astrolabe Projections')).toBeTruthy();
  });

  it('propagates cosmicStore mutations to mounted DOM components via useSyncExternalStore', () => {
    const view = render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    expect(view.getByText('47.06°N')).toBeTruthy();
    expect(view.getByDisplayValue('12:00')).toBeTruthy();

    act(() => {
      cosmicActions.setLatitude(64.84);
      cosmicActions.setTimeOfDay(18.5);
    });

    expect(cosmicStore.getState().latitude).toBe(64.84);
    expect(view.getByText('64.84°N')).toBeTruthy();
    expect(view.getByDisplayValue('18:30')).toBeTruthy();
  });

  it('handles native non-passive wheel zoom and pointer drag / leave cleanup in ArmillarySvgCanvas', () => {
    const jd = getJulianDate(initialDate, 12);
    const lat = 47.06 as Latitude;
    const lon = -122.81 as Longitude;
    const frame = calculateEphemerisFrame(jd, lat, lon);
    const model = generateArmillaryModel({
      julianDate: jd,
      latitude: lat,
      longitude: lon,
      timeOfDay: 12 as HoursDecimal,
      sunRaDeg: frame.solarPos.rightAscension as Degrees,
      sunDecDeg: frame.solarPos.declination,
      sunLambdaDeg: frame.solarPos.lambda,
      moonRaDeg: frame.lunarPos.rightAscension,
      moonDecDeg: frame.lunarPos.declination,
      moonLambdaDeg: frame.lunarPos.lambda,
      moonPhase: frame.lunarPos.phase,
      morphLambda: 0,
      projectionMode: 'heliocentric',
      cameraPitch: 25,
      cameraYaw: 35,
      r0: 100,
    });

    const onCameraChange = vi.fn();
    const { container, getByText } = render(
      <StrictMode>
        <ArmillarySvgCanvas
          model={model}
          projectionMode="heliocentric"
          morphLambda={0}
          showRays={true}
          showStars={true}
          showTympan={true}
          showRule={false}
          camera={{ pitch: 25, yaw: 35, roll: 0 }}
          onCameraChange={onCameraChange}
          r0={100}
        />
      </StrictMode>
    );

    const svgEl = container.querySelector('svg[viewBox]') as SVGSVGElement;
    expect(svgEl).not.toBeNull();
    expect(getByText('1.0×')).toBeTruthy();

    // Real native wheel event triggers non-passive listener and zooms to 1.1x
    act(() => {
      const wheelEvt = new WheelEvent('wheel', { deltaY: -120, cancelable: true });
      svgEl.dispatchEvent(wheelEvt);
    });
    expect(getByText('1.1×')).toBeTruthy();

    // Pointer drag updates camera; pointerLeave resets drag state so subsequent move is ignored
    fireEvent.pointerDown(svgEl, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(svgEl, { clientX: 120, clientY: 110, pointerId: 1 });
    expect(onCameraChange).toHaveBeenCalledTimes(1);

    fireEvent.pointerLeave(svgEl);
    onCameraChange.mockClear();

    fireEvent.pointerMove(svgEl, { clientX: 150, clientY: 140, pointerId: 1 });
    expect(onCameraChange).not.toHaveBeenCalled();
  });
});
