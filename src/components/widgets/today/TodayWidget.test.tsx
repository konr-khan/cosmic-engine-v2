import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  TodayHorizonView, 
  SunElevationDome, 
  MoonElevationDome,
  SkyDomeBase,
  EL_R,
  EL_CX,
  EL_CY
} from './index';
import { OrbitalData } from '../../../types';

describe('Today Horizon Subsystem', () => {
  it('exports all decomposed today sub-components cleanly', () => {
    expect(TodayHorizonView).toBeDefined();
    expect(SunElevationDome).toBeDefined();
    expect(MoonElevationDome).toBeDefined();
    expect(SkyDomeBase).toBeDefined();
    expect(EL_R).toBe(92);
    expect(EL_CX).toBe(130);
    expect(EL_CY).toBe(104);
  });

  it('renders Zenith Cap and Solstice peak lines for temperate latitudes and adapts to tropics', () => {
    // Temperate latitude (47°N): Sun max elevation is ~66.4°, Zenith Cap should render
    const temperateHtml = renderToStaticMarkup(
      React.createElement(SunElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        solarData: {
          noonElevation: 45,
          solarNoon: 12,
          equationOfTime: 0,
          sunrise: 6,
          sunset: 18,
          declination: 0,
          distanceAU: 1,
          distanceKm: 149597870,
          dayLength: 12,
          civil: 0.5,
          nautical: 1,
          astronomical: 1.5,
          daysSinceEpoch: 100,
          lambda: 0,
          eclipticLongitude: 0,
          isMidnightSun: false,
          isPolarNight: false
        }
      })
    );
    expect(temperateHtml).toContain('>66.4°');
    expect(temperateHtml).toContain('Summer Solstice Noon Peak');
    expect(temperateHtml).toContain('Winter Solstice Noon Peak');
    expect(temperateHtml).toContain('Equinox Noon Peak');
    expect(temperateHtml).toContain('Solar Transit Peak');

    // Tropical latitude (10°N): Sun reaches 90° zenith, Zenith Cap displays None (90°)
    const tropicalHtml = renderToStaticMarkup(
      React.createElement(SunElevationDome, {
        displayTime: 12,
        latitude: 10.0,
        solarData: {
          noonElevation: 80,
          solarNoon: 12,
          equationOfTime: 0,
          sunrise: 6,
          sunset: 18,
          declination: 0,
          distanceAU: 1,
          distanceKm: 149597870,
          dayLength: 12,
          civil: 0.5,
          nautical: 1,
          astronomical: 1.5,
          daysSinceEpoch: 100,
          lambda: 0,
          eclipticLongitude: 0,
          isMidnightSun: false,
          isPolarNight: false
        }
      })
    );
    expect(tropicalHtml).toContain('None (90°)');
  });

  it('renders Lunar standstill transit bounds and miniature phase disc in MoonElevationDome', () => {
    const moonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        orbitalData: {
          phase: { value: 0.25, name: 'First Quarter' },
          lunarEvents: {
            moonrise: 10,
            transit: 18,
            moonset: 2,
            distanceKm: 384400,
            distanceEarthRadii: 60.3,
            isPerigee: false,
            isApogee: false,
            declination: 15,
            parallacticAngle: 45
          }
        } as unknown as OrbitalData
      })
    );
    expect(moonHtml).toContain('Max Possible Lunar Altitude');
    expect(moonHtml).toContain('Min Possible Lunar Altitude');
    expect(moonHtml).toContain('Lunar Transit Peak');
    // Verify miniature phase visual with parallactic angle rotation is present
    expect(moonHtml).toContain('rotate(45)');
  });

  it('guarantees symmetrical 260x138 viewBox parity across both Sun and Moon domes', () => {
    const sunHtml = renderToStaticMarkup(
      React.createElement(SunElevationDome, {
        displayTime: 12,
        latitude: 47.06
      })
    );
    const moonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06
      })
    );

    // Both domes must share identical canonical viewBox="0 0 260 138"
    expect(sunHtml).toContain('viewBox="0 0 260 138"');
    expect(moonHtml).toContain('viewBox="0 0 260 138"');
  });

  it('renders 4-badge footer summary panels with segmented mode controls', () => {
    const sunHtml = renderToStaticMarkup(
      React.createElement(SunElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        solarData: {
          sunrise: 6,
          sunset: 18,
          solarNoon: 12,
          declination: 10,
          noonElevation: 50,
          equationOfTime: 0,
          dayLength: 12,
          civil: 0.5,
          nautical: 1,
          astronomical: 1.5,
          daysSinceEpoch: 100,
          lambda: 0,
          eclipticLongitude: 0,
          isMidnightSun: false,
          isPolarNight: false
        }
      })
    );

    // Sun 4-badge footer checks
    expect(sunHtml).toContain('grid-cols-4');
    expect(sunHtml).toContain('Sunrise / Set');
    expect(sunHtml).toContain('Solar Noon');
    expect(sunHtml).toContain('Declination (δ)');
    expect(sunHtml).toContain('Standard Solar View');
    expect(sunHtml).toContain('Twilight Strata View');

    const moonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        orbitalData: {
          phase: { value: 0.5, name: 'Full Moon' },
          lunarEvents: {
            moonrise: 18,
            transit: 0,
            moonset: 6,
            distanceKm: 384400,
            distanceEarthRadii: 60.3,
            isPerigee: false,
            isApogee: false,
            declination: -5,
            parallacticAngle: 0
          }
        } as unknown as OrbitalData
      })
    );

    // Moon 4-badge footer checks
    expect(moonHtml).toContain('grid-cols-4');
    expect(moonHtml).toContain('Moonrise / Set');
    expect(moonHtml).toContain('Lunar Transit');
    expect(moonHtml).toContain('Declination (δ)');
    expect(moonHtml).toContain('Standard Lunar View');
    expect(moonHtml).toContain('Lunar Nodes View');
    expect(moonHtml).toContain('☊ Nodes');
  });
});
