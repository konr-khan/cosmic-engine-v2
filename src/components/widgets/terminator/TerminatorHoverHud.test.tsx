import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TerminatorHoverHud, TerminatorHoverHudProps } from './TerminatorHoverHud';

describe('TerminatorHoverHud Presenter Suite', () => {
  const defaultProps: TerminatorHoverHudProps = {
    hoveredPoint: null,
    declination: 23.44,
    normalizedSunLong: -15.5,
    sunDistanceAU: 1.0167,
    sunDistanceKm: 152100000,
    sunAngularDiamArcmin: 31.47,
    lunarDec: 18.2,
    moonPhase: 'Waxing Gibbous',
    moonIllum: '95',
    moonDistKm: 363000,
    moonAngularDiamArcmin: 32.96,
    isSupermoon: true,
    isMicromoon: false,
    lunarNodeTelemetry: null,
    latitude: 47.06,
    longitude: -122.81
  };

  it('renders nothing when hoveredPoint is null', () => {
    const html = renderToStaticMarkup(React.createElement(TerminatorHoverHud, defaultProps));
    expect(html).toBe('');
  });

  it('renders Subsolar Point HUD when hoveredPoint is "sun"', () => {
    const html = renderToStaticMarkup(
      React.createElement(TerminatorHoverHud, {
        ...defaultProps,
        hoveredPoint: 'sun'
      })
    );

    expect(html).toContain('Subsolar Point (Sun at Zenith)');
    expect(html).toContain('+23.4°');
    expect(html).toContain('1.017 AU');
    expect(html).toContain('31.5');
  });

  it('renders Sublunar Point HUD when hoveredPoint is "moon" with gated node telemetry', () => {
    // 1. Without node telemetry
    const htmlWithoutNode = renderToStaticMarkup(
      React.createElement(TerminatorHoverHud, {
        ...defaultProps,
        hoveredPoint: 'moon'
      })
    );

    expect(htmlWithoutNode).toContain('Sublunar Point (Moon at Zenith)');
    expect(htmlWithoutNode).toContain('Waxing Gibbous');
    expect(htmlWithoutNode).toContain('95% Illum');
    expect(htmlWithoutNode).toContain('Supermoon');
    expect(htmlWithoutNode).not.toContain('data-testid="lunar-node-badge"');

    // 2. With active node telemetry
    const htmlWithNode = renderToStaticMarkup(
      React.createElement(TerminatorHoverHud, {
        ...defaultProps,
        hoveredPoint: 'moon',
        lunarNodeTelemetry: {
          isNear: true,
          type: 'ascending',
          symbol: '☊',
          hoursToNearestNode: 4.5,
          isApproaching: true,
          badgeText: '☊ Ascending Node (☊) in 4.5h'
        }
      })
    );

    expect(htmlWithNode).toContain('data-testid="lunar-node-badge"');
    expect(htmlWithNode).toContain('Ascending Node');
    expect(htmlWithNode).toContain('4.5h');
  });

  it('renders Observer Location HUD when hoveredPoint is "observer"', () => {
    const html = renderToStaticMarkup(
      React.createElement(TerminatorHoverHud, {
        ...defaultProps,
        hoveredPoint: 'observer'
      })
    );

    expect(html).toContain('Observer Location');
    expect(html).toContain('47.06°N');
    expect(html).toContain('122.81°W');
  });
});
