/**
 * @file App.test.tsx
 * Unit test suite for root observatory container App.tsx:
 * - Layout mounting and 12-column panoramic grid structure
 * - Top navigation bar (ObsNavbar) integration and preset triggers
 * - Dashboard window mounting and fallback/suspense boundaries
 * - Chronometer dock mounting and collapse state
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from './App';
import { PRESET_LAYOUTS } from './hooks/useDashboardLayout';
import { cosmicActions } from './store/cosmicStore';

describe('App Root Observatory Dashboard', () => {

  it('renders root observatory container and top navigation bar', () => {
    const html = renderToStaticMarkup(<App />);

    // Root background and typography
    expect(html).toContain('bg-slate-950');
    expect(html).toContain('text-slate-100');

    // ObsNavbar branding
    expect(html).toContain('COSMIC');
    expect(html).toContain('ENGINE');
    expect(html).toContain('Astrolabe Celestial Mechanics');
  });

  it('renders all default windows defined in master preset layout', () => {
    const html = renderToStaticMarkup(<App />);
    const masterWindows = PRESET_LAYOUTS.master.windows;

    for (const win of masterWindows) {
      const escapedTitle = win.title.replace(/&/g, '&amp;').replace(/'/g, '&#x27;');
      expect(html).toContain(escapedTitle);
      expect(html).toContain(`id="${win.id}"`);
    }
  });

  it('renders bottom-pinned orbital chronometer dock', () => {
    const html = renderToStaticMarkup(<App />);

    // Bottom dock fixed positioning container
    expect(html).toContain('fixed bottom-0 left-0 right-0 z-50');

    // Chronometer controls
    expect(html).toContain('UTC');
    expect(html).toContain('LAT');
    expect(html).toContain('LON');
  });

  it('reflects store state updates when observer coordinates change', () => {
    // Set custom coordinates in store
    cosmicActions.setLatitude(51.5);
    cosmicActions.setLongitude(-0.12);

    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('51.5');
    expect(html).toContain('-0.1');

    // Reset back to defaults
    cosmicActions.setLatitude(47.06);
    cosmicActions.setLongitude(-122.33);
  });

  it('renders 12-column responsive layout grid', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('grid grid-cols-12 gap-6 items-start');
  });
});
