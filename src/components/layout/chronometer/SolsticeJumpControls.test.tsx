/**
 * @file SolsticeJumpControls.test.tsx
 * Unit test suite for SolsticeJumpControls component:
 * - Twilight phase badge rendering and semantic styling variations
 * - 4 milestone jump buttons (Mar Equinox, Jun Solstice, Sep Equinox, Dec Solstice)
 * - Exact UTC date firing on click, preserving the target UTC year
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SolsticeJumpControls } from './SolsticeJumpControls';

describe('SolsticeJumpControls Component', () => {
  describe('Twilight Phase Badge Rendering & Styling', () => {
    it('defaults to Daylight phase with amber styling when no phase prop is provided', () => {
      const html = renderToStaticMarkup(<SolsticeJumpControls />);
      expect(html).toContain('Twilight Phase');
      expect(html).toContain('Daylight');
      expect(html).toContain('bg-amber-500/15 text-amber-300 border-amber-500/40');
    });

    it('renders Midnight Sun with amber styling', () => {
      const html = renderToStaticMarkup(
        <SolsticeJumpControls currentTwilightPhase="Midnight Sun" />
      );
      expect(html).toContain('Midnight Sun');
      expect(html).toContain('bg-amber-500/15 text-amber-300 border-amber-500/40');
    });

    it('renders Civil, Nautical, and Astronomical Twilight phases with indigo styling', () => {
      const phases = ['Civil Twilight', 'Nautical Twilight', 'Astronomical Twilight'];
      for (const phase of phases) {
        const html = renderToStaticMarkup(
          <SolsticeJumpControls currentTwilightPhase={phase} />
        );
        expect(html).toContain(phase);
        expect(html).toContain('bg-indigo-500/15 text-indigo-300 border-indigo-500/40');
      }
    });

    it('renders Night with slate neutral styling', () => {
      const html = renderToStaticMarkup(
        <SolsticeJumpControls currentTwilightPhase="Night" />
      );
      expect(html).toContain('Night');
      expect(html).toContain('bg-slate-800 text-slate-300 border-slate-700');
    });
  });

  describe('Milestone Jump Buttons Markup', () => {
    it('renders all 4 milestone jump buttons with correct labels and icons', () => {
      const html = renderToStaticMarkup(<SolsticeJumpControls />);
      expect(html).toContain('🌸 Mar Equinox');
      expect(html).toContain('☀️ Jun Solstice');
      expect(html).toContain('🍂 Sep Equinox');
      expect(html).toContain('❄️ Dec Solstice');
    });
  });

  describe('Date Jump Event Callbacks', () => {
    const getButtons = (vdom: unknown): Array<React.ReactElement<{ onClick?: () => void }>> => {
      if (!React.isValidElement(vdom)) {
        throw new Error('Expected valid ReactElement');
      }
      const children = (vdom.props as { children: React.ReactNode[] }).children;
      const buttonGrid = children[1];
      if (!React.isValidElement(buttonGrid)) {
        throw new Error('Expected button grid element');
      }
      return (buttonGrid.props as { children: Array<React.ReactElement<{ onClick?: () => void }>> }).children;
    };

    it('fires onDateChange with exact UTC dates preserving the UTC year', () => {
      const onDateChange = vi.fn();
      const mockDate = new Date('2026-08-15T14:30:00Z');

      const vdom = SolsticeJumpControls({
        date: mockDate,
        onDateChange
      });

      const buttons = getButtons(vdom);
      expect(buttons).toHaveLength(4);

      // 1. Mar Equinox: Month index 2 (March), Day 20
      buttons[0].props.onClick?.();
      expect(onDateChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 2, 20)));

      // 2. Jun Solstice: Month index 5 (June), Day 21
      buttons[1].props.onClick?.();
      expect(onDateChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 5, 21)));

      // 3. Sep Equinox: Month index 8 (September), Day 22
      buttons[2].props.onClick?.();
      expect(onDateChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 8, 22)));

      // 4. Dec Solstice: Month index 11 (December), Day 21
      buttons[3].props.onClick?.();
      expect(onDateChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 11, 21)));

      expect(onDateChange).toHaveBeenCalledTimes(4);
    });

    it('preserves non-default year when jumping across solstices/equinoxes', () => {
      const onDateChange = vi.fn();
      const futureDate = new Date('2032-01-01T00:00:00Z');

      const vdom = SolsticeJumpControls({
        date: futureDate,
        onDateChange
      });

      const buttons = getButtons(vdom);
      buttons[1].props.onClick?.(); // Jun Solstice
      expect(onDateChange).toHaveBeenCalledWith(new Date(Date.UTC(2032, 5, 21)));
    });

    it('falls back to current UTC year when date prop is omitted', () => {
      const onDateChange = vi.fn();
      const currentYear = new Date().getUTCFullYear();

      const vdom = SolsticeJumpControls({
        onDateChange
      });

      const buttons = getButtons(vdom);
      buttons[0].props.onClick?.(); // Mar Equinox
      expect(onDateChange).toHaveBeenCalledWith(new Date(Date.UTC(currentYear, 2, 20)));
    });

    it('does not throw when clicking buttons without onDateChange handler', () => {
      const vdom = SolsticeJumpControls({});
      const buttons = getButtons(vdom);
      expect(() => {
        buttons[0].props.onClick?.();
        buttons[1].props.onClick?.();
        buttons[2].props.onClick?.();
        buttons[3].props.onClick?.();
      }).not.toThrow();
    });
  });
});
