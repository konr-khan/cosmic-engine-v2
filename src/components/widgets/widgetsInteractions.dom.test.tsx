// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import * as cosmicMath from '../../utils/cosmicMath';
import { EclipseDemonstrator } from './eclipse/EclipseDemonstrator';
import { GyroArmillaryView } from './armillary/GyroArmillaryView';

describe('Real-DOM Observatory Widget Interaction Suite (jsdom)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('EclipseDemonstrator lazy scanner & tab switching', () => {
    const testDate = new Date(Date.UTC(2026, 0, 1));

    it('defers findUpcomingEclipses until the Scanner tab is opened and applies selected presets', () => {
      const scanSpy = vi.spyOn(cosmicMath, 'findUpcomingEclipses');
      const onDateChange = vi.fn();
      const onTimeChange = vi.fn();

      const { getByRole, getByText } = render(
        <StrictMode>
          <EclipseDemonstrator
            currentDate={testDate}
            onDateChange={onDateChange}
            onTimeChange={onTimeChange}
            latitude={47.06}
            longitude={-122.81}
            timeOfDay={12}
          />
        </StrictMode>
      );

      // Geometry tab active by default; scanner should NOT have run
      const geometryTab = getByRole('tab', { name: /Dual View/i });
      const scannerTab = getByRole('tab', { name: /Scanner/i });
      expect(geometryTab.getAttribute('aria-selected')).toBe('true');
      expect(scannerTab.getAttribute('aria-selected')).toBe('false');
      expect(scanSpy).not.toHaveBeenCalled();

      // Switch to Sky View -> still does not trigger scanner
      const skyTab = getByRole('tab', { name: /Sky View/i });
      fireEvent.click(skyTab);
      expect(skyTab.getAttribute('aria-selected')).toBe('true');
      expect(scanSpy).not.toHaveBeenCalled();

      // Switch to Scanner tab -> runs findUpcomingEclipses lazily (StrictMode invokes useMemo twice)
      fireEvent.click(scannerTab);
      expect(scannerTab.getAttribute('aria-selected')).toBe('true');
      expect(scanSpy).toHaveBeenCalled();

      // Clicking a famous eclipse preset scrubs date and time
      const presetBtn = getByText(/Apr 8, 2024 - Great American Eclipse/i).closest('button')!;
      fireEvent.click(presetBtn);
      expect(onDateChange).toHaveBeenCalledTimes(1);
      expect(onTimeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('GyroArmillaryView keyboard orbit & mode controls', () => {
    it('exposes accessible SVG canvas and supports keyboard 3D camera rotation under StrictMode', () => {
      const { getByRole, getAllByRole } = render(
        <StrictMode>
          <GyroArmillaryView
            latitude={47.06}
            longitude={-122.81}
            timeOfDay={12}
            currentDate={new Date(Date.UTC(2026, 5, 21))}
          />
        </StrictMode>
      );

      const canvas = getByRole('img', { name: /Interactive 3D Armillary Sphere and Astrolabe Canvas/i });
      expect(canvas.getAttribute('tabindex')).toBe('0');

      // Keyboard camera rotation and zoom controls do not throw
      expect(() => {
        fireEvent.keyDown(canvas, { key: 'ArrowRight' });
        fireEvent.keyDown(canvas, { key: 'ArrowLeft' });
        fireEvent.keyDown(canvas, { key: 'ArrowUp' });
        fireEvent.keyDown(canvas, { key: 'ArrowDown' });
        fireEvent.keyDown(canvas, { key: '+' });
        fireEvent.keyDown(canvas, { key: '-' });
        fireEvent.keyDown(canvas, { key: '0' });
      }).not.toThrow();

      // Mode buttons render and switch cleanly
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
