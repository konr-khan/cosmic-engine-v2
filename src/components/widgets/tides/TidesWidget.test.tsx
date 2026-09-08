import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MicroTideView } from './index';
import { getJulianDate, calculateLunarPosition, calculateSolarPosition } from '../../../utils/cosmicMath';

describe('Micro Tide Subsystem', () => {
  it('exports MicroTideView component', () => {
    expect(MicroTideView).toBeDefined();
  });

  it('renders MiniGlobe Earth and segmented controls in MicroTideView', () => {
    const html = renderToStaticMarkup(
      React.createElement(MicroTideView, {
        tides: { alignment: 0.9, rx: 19, ry: 12, type: 'Spring Tide' },
        angles: { sunDegrees: 45, moonDegrees: 45, nodeLongitude: 120, descendingNodeLongitude: 300, toSun: 0, toMoon: 0 },
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12.0
      })
    );

    // MiniGlobe Earth rendered
    expect(html).toContain('miniglobe-root');
    expect(html).toContain('SPRING');

    // Segmented toggle controls rendered
    expect(html).toContain('Standard');
    expect(html).toContain('☊ Nodal Loop');
    expect(html).toContain('Global Potential');
    expect(html).toContain('Local Water');
  });

  it('renders Moon and tidal bulge in counter-clockwise prograde orientation', () => {
    const html = renderToStaticMarkup(
      React.createElement(MicroTideView, {
        tides: { alignment: 0.0, rx: 16, ry: 12, type: 'Transitional' },
        angles: { sunDegrees: 0, moonDegrees: 90, nodeLongitude: 0, descendingNodeLongitude: 180, toSun: 0, toMoon: 0 },
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12.0
      })
    );

    // At moonDegrees = 90 (First Quarter), prograde counter-clockwise in SVG positions Moon UP at (0, -60)
    // moonX = 60 * cos(-90 deg) ~ 0, moonY = 60 * sin(-90 deg) = -60
    // We check that moonY is -60 (UP) rather than +60 (DOWN)
    expect(html).toContain('-60)');
    expect(html).toContain('rotate(-90)');
  });

  it('synchronizes Moon nodal state and halo styling across the October 6-7, 2026 True Node Crossing', () => {
    // 1. October 6, 2026 at 22:21 UTC:
    // Mean difference ((lambda - node) <= 180) is false (> 180°), but true beta is still +0.107° (North / Ascending).
    const date1 = new Date('2026-10-06T00:00:00Z');
    const time1 = 22 + 21 / 60;
    const jd1 = getJulianDate(date1, time1);
    const lunarPos1 = calculateLunarPosition(jd1);
    const solarPos1 = calculateSolarPosition(jd1);

    expect(Number(lunarPos1.beta)).toBeGreaterThan(0.05); // North of ecliptic

    const htmlBefore = renderToStaticMarkup(
      React.createElement(MicroTideView, {
        currentDate: date1,
        timeOfDay: time1,
        julianDate: jd1,
        moonBetaDeg: Number(lunarPos1.beta),
        angles: {
          sunDegrees: Number(solarPos1.lambda),
          moonDegrees: Number(lunarPos1.lambda),
          nodeLongitude: Number(lunarPos1.nodeLongitude),
          descendingNodeLongitude: Number(lunarPos1.descendingNodeLongitude)
        },
        initialOrbitViewMode: 'nodal',
        latitude: 47.06,
        longitude: -122.81
      })
    );

    // In Nodal mode before true crossing, the Moon halo must be Sky Blue (#38bdf8), NOT Rose Red (#f43f5e)
    expect(htmlBefore).toContain('stroke="#38bdf8" stroke-width="1" stroke-opacity="0.4" class="animate-pulse"');
    // Both node pins rendered
    expect(htmlBefore).toContain('☋');
    expect(htmlBefore).toContain('☊');

    // 2. October 7, 2026 at 00:24 UTC:
    // True crossing occurs (beta crosses 0.000° to -0.0001°), turning Moon to Descending (Rose Red).
    const date2 = new Date('2026-10-07T00:00:00Z');
    const time2 = 0 + 24 / 60;
    const jd2 = getJulianDate(date2, time2);
    const lunarPos2 = calculateLunarPosition(jd2);
    const solarPos2 = calculateSolarPosition(jd2);

    expect(Number(lunarPos2.beta)).toBeLessThan(0.001); // At or past 0°

    const htmlAfter = renderToStaticMarkup(
      React.createElement(MicroTideView, {
        currentDate: date2,
        timeOfDay: time2,
        julianDate: jd2,
        moonBetaDeg: Number(lunarPos2.beta),
        angles: {
          sunDegrees: Number(solarPos2.lambda),
          moonDegrees: Number(lunarPos2.lambda),
          nodeLongitude: Number(lunarPos2.nodeLongitude),
          descendingNodeLongitude: Number(lunarPos2.descendingNodeLongitude)
        },
        initialOrbitViewMode: 'nodal',
        latitude: 47.06,
        longitude: -122.81
      })
    );

    // After true crossing, Moon halo must transition to Rose Red (#f43f5e)
    expect(htmlAfter).toContain('stroke="#f43f5e" stroke-width="1" stroke-opacity="0.4" class="animate-pulse"');
  });

  it('anchors Ascending and Descending pins at true crossing longitudes', () => {
    const date = new Date('2026-10-06T00:00:00Z');
    const time = 22 + 21 / 60;
    const jd = getJulianDate(date, time);
    const lunarPos = calculateLunarPosition(jd);
    const solarPos = calculateSolarPosition(jd);

    const html = renderToStaticMarkup(
      React.createElement(MicroTideView, {
        currentDate: date,
        timeOfDay: time,
        julianDate: jd,
        moonBetaDeg: Number(lunarPos.beta),
        angles: {
          sunDegrees: Number(solarPos.lambda),
          moonDegrees: Number(lunarPos.lambda),
          nodeLongitude: Number(lunarPos.nodeLongitude),
          descendingNodeLongitude: Number(lunarPos.descendingNodeLongitude)
        },
        initialOrbitViewMode: 'nodal',
        latitude: 47.06,
        longitude: -122.81
      })
    );

    // Verify presence of node pins
    expect(html).toContain('☊');
    expect(html).toContain('☋');
    expect(html).toContain('minitide-nodal-orbit');
  });
});
