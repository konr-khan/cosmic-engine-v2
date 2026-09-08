import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MicroTideView } from './index';

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
});
