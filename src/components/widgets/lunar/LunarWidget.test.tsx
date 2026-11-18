import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  LunarAlmanacCard, 
  LunarRibbonChart, 
  TidalWaveOscillator, 
  LunarShortcutsRail 
} from './index';
import { AnnualLunarMatrixItem } from '../../../types';

describe('Lunar Almanac Subsystem', () => {
  it('exports all decomposed lunar sub-components cleanly', () => {
    expect(LunarAlmanacCard).toBeDefined();
    expect(LunarRibbonChart).toBeDefined();
    expect(TidalWaveOscillator).toBeDefined();
    expect(LunarShortcutsRail).toBeDefined();
  });

  it('renders LunarRibbonChart in 30-Day Synodic mode with daily phase discs, day ticks, and hover tooltip', () => {
    const mockLunarData: AnnualLunarMatrixItem[] = Array.from({ length: 365 }, (_, i) => ({
      day: i + 1,
      moonrise: 6.0,
      transit: 12.0,
      moonset: 18.0,
      phaseValue: (i % 29.53) / 29.53,
      isPerigee: i === 14,
      isApogee: i === 28,
      distanceKm: 384400
    }));

    const synodicHtml = renderToStaticMarkup(
      React.createElement(LunarRibbonChart, {
        annualLunarData: mockLunarData,
        activeDay: 15,
        totalDays: 365,
        year: 2026,
        activeData: mockLunarData[14],
        getDayLabel: (d: number) => `Day ${d}`,
        hoverDate: new Date(Date.UTC(2026, 0, 10, 12, 0, 0)),
        viewMode: 'synodic',
        onViewModeChange: () => {}
      })
    );

    expect(synodicHtml).toContain('30-Day Synodic');
    expect(synodicHtml).toContain('data-testid="lunar-readout-bar"');
    expect(synodicHtml).toContain('Moonrise:');
    expect(synodicHtml).toContain('Moonset:');
    expect(synodicHtml).toContain('data-testid="synodic-phase-disc"');
    expect(synodicHtml).toContain('data-testid="synodic-day-tick"');
    expect(synodicHtml).toContain('Dist:');
    expect(synodicHtml).toContain('384,400 km');
  });

  it('renders LunarRibbonChart in 365-Day Annual mode with month dividers', () => {
    const mockLunarData: AnnualLunarMatrixItem[] = Array.from({ length: 365 }, (_, i) => ({
      day: i + 1,
      moonrise: 6.0,
      transit: 12.0,
      moonset: 18.0,
      phaseValue: 0.5,
      isPerigee: false,
      isApogee: false,
      distanceKm: 384400
    }));

    const annualHtml = renderToStaticMarkup(
      React.createElement(LunarRibbonChart, {
        annualLunarData: mockLunarData,
        activeDay: 15,
        totalDays: 365,
        year: 2026,
        activeData: mockLunarData[14],
        getDayLabel: (d: number) => `Day ${d}`,
        viewMode: 'annual',
        onViewModeChange: () => {}
      })
    );

    expect(annualHtml).toContain('365-Day Ribbon');
    expect(annualHtml).toContain('Jan');
    expect(annualHtml).toContain('Dec');
    expect(annualHtml).toContain('Full Moon (100%)');
  });

  it('splits moonrise/moonset curves across midnight without drawing vertical full-chart lines', () => {
    const mockWrapData: AnnualLunarMatrixItem[] = [
      { day: 1, moonrise: 22.8, transit: 4.0, moonset: 10.0, phaseValue: 0.5, isPerigee: false, isApogee: false, distanceKm: 384400 },
      { day: 2, moonrise: 23.6, transit: 4.8, moonset: 10.8, phaseValue: 0.52, isPerigee: false, isApogee: false, distanceKm: 384400 },
      { day: 3, moonrise: 0.4, transit: 5.6, moonset: 11.6, phaseValue: 0.54, isPerigee: false, isApogee: false, distanceKm: 384400 },
      { day: 4, moonrise: 1.2, transit: 6.4, moonset: 12.4, phaseValue: 0.56, isPerigee: false, isApogee: false, distanceKm: 384400 }
    ];

    const wrapHtml = renderToStaticMarkup(
      React.createElement(LunarRibbonChart, {
        annualLunarData: mockWrapData,
        activeDay: 2,
        totalDays: 4,
        year: 2026,
        activeData: mockWrapData[1],
        getDayLabel: (d: number) => `Day ${d}`,
        viewMode: 'synodic',
        timeMode: 'utc',
        onViewModeChange: () => {}
      })
    );

    // Expect a second M command in the moonrise path where it exits top edge (y=20.0) and resumes at bottom edge (y=190.0)
    expect(wrapHtml).toMatch(/d="M [^"]*L [0-9.]+ 20\.0 M [0-9.]+ 190\.0 L [^"]*"/);
  });

  it('renders circumpolar 24h moonlight and down all day statuses in polar conditions', () => {
    const mockPolarData: AnnualLunarMatrixItem[] = [
      {
        day: 1,
        moonrise: 0,
        moonset: 24,
        transit: 12,
        phaseValue: 0.5,
        isPerigee: false,
        isApogee: false,
        distanceKm: 384400,
        polarState: 'circumpolar_up'
      },
      {
        day: 2,
        moonrise: null,
        moonset: null,
        transit: 12,
        phaseValue: 0.5,
        isPerigee: false,
        isApogee: false,
        distanceKm: 384400,
        polarState: 'circumpolar_down'
      }
    ];

    const upHtml = renderToStaticMarkup(
      React.createElement(LunarRibbonChart, {
        annualLunarData: mockPolarData,
        activeDay: 1,
        totalDays: 2,
        year: 2026,
        activeData: mockPolarData[0],
        getDayLabel: (d: number) => `Day ${d}`,
        viewMode: 'synodic',
        onViewModeChange: () => {}
      })
    );

    expect(upHtml).toContain('Circumpolar:');
    expect(upHtml).toContain('Up All Day (24h Moonlight)');

    const downHtml = renderToStaticMarkup(
      React.createElement(LunarRibbonChart, {
        annualLunarData: mockPolarData,
        activeDay: 2,
        totalDays: 2,
        year: 2026,
        activeData: mockPolarData[1],
        getDayLabel: (d: number) => `Day ${d}`,
        viewMode: 'synodic',
        onViewModeChange: () => {}
      })
    );

    expect(downHtml).toContain('Moon Down All Day (Sub-Horizon)');
  });

  it('renders TidalWaveOscillator ocean tidal deformation wave', () => {
    const html = renderToStaticMarkup(
      React.createElement(TidalWaveOscillator, {
        tides: {
          alignment: 0.9,
          rx: 19,
          ry: 10,
          type: 'Spring Tide'
        },
        phaseValue: 0.5,
        localTideStatus: 'High Tide'
      })
    );

    expect(html).toContain('Maximum Spring Tide (Syzygy)');
    expect(html).toContain('High Tide');
  });

  it('renders synchronized hoverTime horizontal guideline and time badge in 30-Day Synodic mode', () => {
    const mockData: AnnualLunarMatrixItem[] = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      moonrise: 6.0,
      transit: 12.0,
      moonset: 18.0,
      phaseValue: 0.5,
      isPerigee: false,
      isApogee: false,
      distanceKm: 384400
    }));

    const html = renderToStaticMarkup(
      React.createElement(LunarRibbonChart, {
        annualLunarData: mockData,
        activeDay: 15,
        totalDays: 30,
        year: 2026,
        activeData: mockData[14],
        getDayLabel: (d: number) => `Day ${d}`,
        viewMode: 'synodic',
        hoverTime: 14.5,
        timeMode: 'utc',
        onViewModeChange: () => {}
      })
    );

    // Should render the horizontal dashed line and the 14:30Z badge in synodic mode
    expect(html).toContain('14:30');
    expect(html).toContain('14:30Z');
    expect(html).toContain('stroke-dasharray="3 3"');
  });
});

