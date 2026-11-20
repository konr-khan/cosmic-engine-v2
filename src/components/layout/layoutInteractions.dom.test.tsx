// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { AstrolabeDial } from './chronometer/AstrolabeDial';
import { DashboardWindow } from './DashboardWindow';
import { ObsNavbar } from './ObsNavbar';

describe('Real-DOM Layout & Astrolabe Interaction Suite (jsdom)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('AstrolabeDial pointer, rollover & keyboard behavior', () => {
    const baseDate = new Date(Date.UTC(2026, 5, 21));

    it('safely ignores pointer events when SVG has zero dimensions', () => {
      const onTimeChange = vi.fn();
      const onLatChange = vi.fn();
      const { container } = render(
        <StrictMode>
          <AstrolabeDial
            date={baseDate}
            timeOfDay={12}
            latitude={47.06}
            longitude={-122.81}
            onTimeChange={onTimeChange}
            onLatChange={onLatChange}
          />
        </StrictMode>
      );

      const svg = container.querySelector('svg')!;
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      expect(() => {
        fireEvent.pointerDown(svg, { clientX: 50, clientY: 50, pointerId: 1 });
        fireEvent.pointerMove(svg, { clientX: 80, clientY: 80, pointerId: 1 });
        fireEvent.pointerUp(svg, { clientX: 80, clientY: 80, pointerId: 1 });
      }).not.toThrow();
      expect(onTimeChange).not.toHaveBeenCalled();
      expect(onLatChange).not.toHaveBeenCalled();
    });

    it('updates time and detects forward midnight date rollover when dragging the time ring', () => {
      const onTimeChange = vi.fn();
      const onDateChange = vi.fn();
      const { container } = render(
        <StrictMode>
          <AstrolabeDial
            date={baseDate}
            timeOfDay={23}
            latitude={47.06}
            longitude={-122.81}
            onTimeChange={onTimeChange}
            onDateChange={onDateChange}
          />
        </StrictMode>
      );

      const svg = container.querySelector('svg')!;
      // 270x270 rect -> scale = 1.0, center = (135, 135)
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 270,
        height: 270,
        right: 270,
        bottom: 270,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Pointer down on Time ring (R = 102, top-left ~ 23h)
      fireEvent.pointerDown(svg, { clientX: 135 - 26, clientY: 135 - 98, pointerId: 1 });
      // Drag clockwise past 00:00 top (12 o'clock) to ~01:00 (angle ~15 deg => dx ~ +26, dy ~ -98)
      fireEvent.pointerMove(svg, { clientX: 135 + 26, clientY: 135 - 98, pointerId: 1 });
      fireEvent.pointerUp(svg, { clientX: 135 + 26, clientY: 135 - 98, pointerId: 1 });

      expect(onTimeChange).toHaveBeenCalled();
      expect(onDateChange).toHaveBeenCalledTimes(1);
      const rolledDate = onDateChange.mock.calls[0][0] as Date;
      expect(rolledDate.getUTCDate()).toBe(22);
    });

    it('handles keyboard time adjustments on the slider container', () => {
      const onTimeChange = vi.fn();
      const { getByRole } = render(
        <AstrolabeDial
          date={baseDate}
          timeOfDay={12}
          latitude={47.06}
          longitude={-122.81}
          onTimeChange={onTimeChange}
        />
      );

      const slider = getByRole('slider', { name: /Observation Time of Day/i });
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(onTimeChange).toHaveBeenLastCalledWith(12.25);

      fireEvent.keyDown(slider, { key: 'PageUp' });
      expect(onTimeChange).toHaveBeenLastCalledWith(13);

      fireEvent.keyDown(slider, { key: 'Home' });
      expect(onTimeChange).toHaveBeenLastCalledWith(0);

      fireEvent.keyDown(slider, { key: 'End' });
      expect(onTimeChange).toHaveBeenLastCalledWith(24);
    });
  });

  describe('DashboardWindow interactive header controls and pointer resize', () => {
    it('toggles minimize, maximize, lock, colSpan, reset, and resizes via pointer drag', () => {
      const onToggleLock = vi.fn();
      const onToggleColSpan = vi.fn();
      const onResetSize = vi.fn();
      const onResize = vi.fn();

      const { getByRole, queryByText, getByTitle, container } = render(
        <StrictMode>
          <DashboardWindow
            id="today"
            title="Today Sky"
            colSpan={6}
            height="400px"
            isLocked={false}
            onToggleLock={onToggleLock}
            onToggleColSpan={onToggleColSpan}
            onResetSize={onResetSize}
            onResize={onResize}
          >
            <div>Widget Body Content</div>
          </DashboardWindow>
        </StrictMode>
      );

      expect(queryByText('Widget Body Content')).not.toBeNull();

      // ColSpan toggle
      fireEvent.click(getByRole('button', { name: /Expand Today Sky to 2-Column width/i }));
      expect(onToggleColSpan).toHaveBeenCalledWith('today');

      // Reset size
      fireEvent.click(getByRole('button', { name: /Reset Today Sky window size/i }));
      expect(onResetSize).toHaveBeenCalledWith('today');

      // Lock toggle
      fireEvent.click(getByRole('button', { name: /Lock Today Sky window layout/i }));
      expect(onToggleLock).toHaveBeenCalledWith('today');

      // Pointer resize handle
      const rootEl = container.firstElementChild as HTMLElement;
      Object.defineProperty(rootEl, 'offsetHeight', { value: 400, configurable: true });
      const resizeHandle = getByTitle('Drag to resize card');
      fireEvent.pointerDown(resizeHandle, { clientY: 100, pointerId: 1 });
      fireEvent.pointerMove(resizeHandle, { clientY: 180, pointerId: 1 });
      fireEvent.pointerUp(resizeHandle, { clientY: 180, pointerId: 1 });
      expect(onResize).toHaveBeenCalledWith('today', 0, 480);

      // Minimize hides body
      const collapseBtn = getByRole('button', { name: /Collapse Today Sky window/i });
      expect(collapseBtn.getAttribute('aria-expanded')).toBe('true');
      fireEvent.click(collapseBtn);
      expect(queryByText('Widget Body Content')).toBeNull();
      expect(getByRole('button', { name: /Expand Today Sky window/i }).getAttribute('aria-expanded')).toBe('false');

      // Maximize toggles aria-pressed
      const maxBtn = getByRole('button', { name: /Maximize Today Sky view/i });
      fireEvent.click(maxBtn);
      expect(getByRole('button', { name: /Restore Today Sky view/i }).getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('ObsNavbar dropdown menus, Escape & outside-click dismissal', () => {
    it('opens menus, invokes preset/widget callbacks, and dismisses on Escape and outside pointerdown', () => {
      const onSelectPreset = vi.fn();
      const onToggleWidget = vi.fn();
      const onToggleAllLocked = vi.fn();
      const onResetLayout = vi.fn();

      const { getByRole, queryByRole } = render(
        <StrictMode>
          <ObsNavbar
            activePresetKey="master"
            onSelectPreset={onSelectPreset}
            widgets={{ today: true, eclipse: false }}
            onToggleWidget={onToggleWidget}
            isAllLocked={false}
            onToggleAllLocked={onToggleAllLocked}
            onResetLayout={onResetLayout}
          />
        </StrictMode>
      );

      // Open Presets menu
      const presetsBtn = getByRole('button', { name: /Presets/i });
      fireEvent.click(presetsBtn);
      expect(queryByRole('menu', { name: 'Workspace Presets' })).not.toBeNull();

      // Dismiss via Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(queryByRole('menu', { name: 'Workspace Presets' })).toBeNull();

      // Open Simulation Layers menu and toggle a layer
      const layersBtn = getByRole('button', { name: /Simulation Layers/i });
      fireEvent.click(layersBtn);
      expect(queryByRole('menu', { name: 'Simulation Layers' })).not.toBeNull();

      const eclipseLayerItem = getByRole('menuitemcheckbox', { name: /Eclipse Mechanics/i });
      expect(eclipseLayerItem.getAttribute('aria-checked')).toBe('false');
      fireEvent.click(eclipseLayerItem);
      expect(onToggleWidget).toHaveBeenCalledWith('eclipse');

      // Outside click dismisses menu
      fireEvent.pointerDown(document.body);
      expect(queryByRole('menu', { name: 'Simulation Layers' })).toBeNull();
    });
  });
});
