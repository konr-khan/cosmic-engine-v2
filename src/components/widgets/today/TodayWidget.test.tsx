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

  it('renders Sun twilight strata view with harmonized color bands when twilight mode is active', () => {
    const sunTwilightHtml = renderToStaticMarkup(
      React.createElement(SunElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        initialTwilightMode: true,
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
          distanceAU: 1.0,
          distanceKm: 149597870,
          daysSinceEpoch: 100,
          lambda: 0,
          eclipticLongitude: 0,
          isMidnightSun: false,
          isPolarNight: false
        }
      })
    );

    // Verify presence of harmonized twilight strata bands and labels
    expect(sunTwilightHtml).toContain('twilight-strata');
    expect(sunTwilightHtml).toContain('fill="#f59e0b"'); // Civil twilight
    expect(sunTwilightHtml).toContain('stroke="#d97706"'); // Civil twilight boundary
    expect(sunTwilightHtml).toContain('fill="#64748b"'); // Nautical twilight
    expect(sunTwilightHtml).toContain('stroke="#475569"'); // Nautical boundary
    expect(sunTwilightHtml).toContain('fill="#334155"'); // Astronomical twilight
    expect(sunTwilightHtml).toContain('CIVIL');
    expect(sunTwilightHtml).toContain('NAUT');
    expect(sunTwilightHtml).toContain('ASTRO');
  });

  it('renders Moon diurnal path with Eclipse-convention stroke styling (color and dash)', () => {
    // Waxing Moon (phase = 0.25)
    const waxingMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        currentDate: new Date('2026-09-08T12:00:00Z'),
        orbitalData: {
          phase: { value: 0.25, name: 'First Quarter' },
          lunarEvents: {
            moonrise: 12,
            transit: 18,
            moonset: 0,
            distanceKm: 384400,
            distanceEarthRadii: 60.3,
            isPerigee: false,
            isApogee: false,
            declination: 15,
            parallacticAngle: 0
          }
        } as unknown as OrbitalData
      })
    );

    // Waning Moon (phase = 0.75)
    const waningMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        currentDate: new Date('2026-09-08T12:00:00Z'),
        orbitalData: {
          phase: { value: 0.75, name: 'Last Quarter' },
          lunarEvents: {
            moonrise: 0,
            transit: 6,
            moonset: 12,
            distanceKm: 384400,
            distanceEarthRadii: 60.3,
            isPerigee: false,
            isApogee: false,
            declination: 15,
            parallacticAngle: 0
          }
        } as unknown as OrbitalData
      })
    );

    // Both should contain today-moon-path group
    expect(waxingMoonHtml).toContain('id="today-moon-path"');
    expect(waningMoonHtml).toContain('id="today-moon-path"');

    // Extract the today-moon-path segment from both HTML strings
    const waxingMatch = waxingMoonHtml.match(/<g[^>]*id="today-moon-path"[^>]*>([\s\S]*?)<\/g>/);
    const waningMatch = waningMoonHtml.match(/<g[^>]*id="today-moon-path"[^>]*>([\s\S]*?)<\/g>/);

    expect(waxingMatch).not.toBeNull();
    expect(waningMatch).not.toBeNull();

    // Waxing Moon path should have no dash array (solid), Waning Moon path should have stroke-dasharray="4 3"
    expect(waxingMatch![1]).not.toContain('stroke-dasharray="4 3"');
    expect(waningMatch![1]).toContain('stroke-dasharray="4 3"');

    // Both should exhibit valid Eclipse-convention color (#38bdf8 or #f43f5e)
    const hasValidColor = waxingMoonHtml.includes('#38bdf8') || waxingMoonHtml.includes('#f43f5e');
    expect(hasValidColor).toBe(true);
  });

  it('renders 4-Quadrant Draconic Orbital Progress Micro-Rail when initialNodalMode is true', () => {
    const nodalMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        initialNodalMode: true,
        currentDate: new Date('2026-09-08T12:00:00Z'),
        orbitalData: {
          phase: { value: 0.35, name: 'Waxing Gibbous' },
          lunarEvents: {
            moonrise: 14,
            transit: 20,
            moonset: 2,
            distanceKm: 384400,
            distanceEarthRadii: 60.3,
            isPerigee: false,
            isApogee: false,
            declination: 12,
            parallacticAngle: 0
          }
        } as unknown as OrbitalData
      })
    );

    // Verify presence of Draconic regime telemetry & 4-Quadrant progress micro-rail
    expect(nodalMoonHtml).toContain('Draconic:');
    expect(nodalMoonHtml).toContain('β:');
    expect(nodalMoonHtml).toContain('Next:');
    expect(nodalMoonHtml).toContain('viewBox="0 0 240 14"');
    expect(nodalMoonHtml).toContain('☊');
    expect(nodalMoonHtml).toContain('☋');
    // Verify 4-quadrant segmented rail colors
    expect(nodalMoonHtml).toContain('stroke="#38bdf8"');
    expect(nodalMoonHtml).toContain('stroke="#f43f5e"');
  });
});
