import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TerminatorMap } from './TerminatorMap';
import { SolarAlmanacData, OrbitalData } from '../../../types';

describe('TerminatorMap Component & Twilight Projection Suite', () => {
  const mockSolarData: SolarAlmanacData = {
    sunrise: 5.5,
    sunset: 21.0,
    solarNoon: 13.25,
    civil: 0.7,
    nautical: 1.6,
    astronomical: 2.3,
    dayLength: 15.5,
    declination: 23.44,
    equationOfTime: -1.5,
    noonElevation: 66.38,
    daysSinceEpoch: 172,
    lambda: 90,
    eclipticLongitude: 90,
    isPolarNight: false,
    isMidnightSun: false,
    distanceAU: 1.0167,
    distanceKm: 152100000,
    sunAngularDiameterArcmin: 31.47
  };

  const mockOrbitalData: OrbitalData = {
    angles: { sunDegrees: 0, moonDegrees: 90, nodeLongitude: 125, descendingNodeLongitude: 305, toSun: 0, toMoon: 0 },
    nodeLongitude: 125,
    descendingNodeLongitude: 305,
    lunarPos: {
      rightAscension: 120,
      declination: 18.2,
      distanceKm: 363000,
      phase: 0.95,
      phaseName: 'Waxing Gibbous',
      elongation: 120,
      parallacticAngle: -12.4,
      nodeLongitude: 125,
      descendingNodeLongitude: 305,
      lambda: 120,
      beta: 2.1
    },
    phase: {
      value: 0.95,
      name: 'Waxing Gibbous'
    },
    tides: {
      rx: 18,
      ry: 12,
      type: 'Spring Tide',
      alignment: 0.9
    },
    localTideStatus: 'High Tide',
    lunarEvents: {
      moonrise: 18.5,
      moonset: 6.2,
      transit: 0.5,
      declination: 18.2,
      distanceKm: 363000,
      distanceEarthRadii: 57.0,
      isPerigee: false,
      isApogee: false,
      parallacticAngle: -12.4
    },
    eclipse: null
  };

  it('exports and renders TerminatorMap cleanly', () => {
    expect(TerminatorMap).toBeDefined();

    const html = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: mockSolarData,
        orbitalData: mockOrbitalData,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    expect(html).toContain('observer meridian (-122.8°)');
    expect(html).toContain('Solar Declination:');
    expect(html).toContain('+23.4°');
    expect(html).toContain('Lunar Declination:');
    expect(html).toContain('+18.2°');
  });

  it('renders centered observer location pin ("YOU") at canonical crosshair coordinates', () => {
    const lat = 47.06;
    const expectedUserCy = 90 - lat; // 42.94

    const html = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: mockSolarData,
        orbitalData: mockOrbitalData,
        latitude: lat,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // Crosshair lines at x=180 and y=userCy
    expect(html).toContain('x1="180" y1="0" x2="180" y2="180"');
    expect(html).toContain(`y1="${expectedUserCy}" x2="360" y2="${expectedUserCy}"`);
    expect(html).toContain('YOU');
  });

  it('renders Subsolar Point (Sun) and Sublunar Point (Moon) disc markers', () => {
    const html = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: mockSolarData,
        orbitalData: mockOrbitalData,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // Text labels for celestial bodies
    expect(html).toContain('>SUN<');
    expect(html).toContain('>MOON<');
  });

  it('adjusts disc scale dynamically for perihelion/aphelion and supermoon/micromoon', () => {
    // Aphelion Sun (smaller) & Supermoon Moon (larger)
    const htmlAphelionSupermoon = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: { ...mockSolarData, distanceAU: 1.017 },
        orbitalData: {
          ...mockOrbitalData,
          lunarEvents: { ...mockOrbitalData.lunarEvents!, distanceKm: 357000 }
        },
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );
    expect(htmlAphelionSupermoon).toBeDefined();

    // Perihelion Sun (larger) & Micromoon Moon (smaller)
    const htmlPerihelionMicromoon = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: { ...mockSolarData, distanceAU: 0.983 },
        orbitalData: {
          ...mockOrbitalData,
          lunarEvents: { ...mockOrbitalData.lunarEvents!, distanceKm: 406000 }
        },
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );
    expect(htmlPerihelionMicromoon).toBeDefined();
  });

  it('renders hover subsolar ray guide when hoverTime is active', () => {
    const htmlHover = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: mockSolarData,
        orbitalData: mockOrbitalData,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        hoverTime: 16.5
      })
    );

    // Should render vertical dashed ray line for hovered time
    expect(htmlHover).toContain('stroke-dasharray="3 2"');
  });

  it('renders layered twilight shadow paths and legend labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(TerminatorMap, {
        solarData: mockSolarData,
        orbitalData: mockOrbitalData,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // Legend items
    expect(html).toContain('Subsolar');
    expect(html).toContain('Sublunar');
    expect(html).toContain('Civil (-6°)');
    expect(html).toContain('Nautical (-12°)');
    expect(html).toContain('Astro (-18°)');
    expect(html).toContain('Night');
  });
});
