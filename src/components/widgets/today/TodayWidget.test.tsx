import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  TodayHorizonView, 
  SunElevationDome, 
  MoonElevationDome,
  SunMeridianDome,
  MoonMeridianDome,
  SkyDomeBase,
  EL_R,
  EL_CX,
  EL_CY
} from './index';
import { OrbitalData, SolarAlmanacData } from '../../../types';

describe('Today Horizon Subsystem', () => {
  it('exports all decomposed today sub-components cleanly', () => {
    expect(TodayHorizonView).toBeDefined();
    expect(SunElevationDome).toBeDefined();
    expect(MoonElevationDome).toBeDefined();
    expect(SunMeridianDome).toBeDefined();
    expect(MoonMeridianDome).toBeDefined();
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

  it('renders silver Moon arc in Std view and Eclipse-convention stroke styling in Nodal view', () => {
    // Standard view: serene lunar silver (#e2e8f0) and solid stroke
    const stdMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        initialNodalMode: false,
        currentDate: new Date('2026-09-08T12:00:00Z'),
        orbitalData: {
          phase: { value: 0.75, name: 'Last Quarter' }
        } as unknown as OrbitalData
      })
    );
    expect(stdMoonHtml).toContain('stroke="#e2e8f0"');
    const stdPathMatch = stdMoonHtml.match(/<g[^>]*id="today-moon-path"[^>]*>([\s\S]*?)<\/g>/);
    expect(stdPathMatch).not.toBeNull();
    expect(stdPathMatch![1]).not.toContain('stroke-dasharray="4 3"');

    // Nodal view Waxing Moon (phase = 0.25): solid stroke
    const waxingMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        initialNodalMode: true,
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

    // Nodal view Waning Moon (phase = 0.75): dashed stroke ('4 3')
    const waningMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 47.06,
        initialNodalMode: true,
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

  it('renders centered ±15-day Draconic Orbital Progress Micro-Rail when initialNodalMode is true', () => {
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

    // Verify presence of centered timeline telemetry & ±15-day micro-rail
    expect(nodalMoonHtml).toContain('Past:');
    expect(nodalMoonHtml).toContain('Today');
    expect(nodalMoonHtml).toContain('β:');
    expect(nodalMoonHtml).toContain('Next:');
    expect(nodalMoonHtml).toContain('viewBox="0 0 240 16"');
    expect(nodalMoonHtml).toContain('☊');
    expect(nodalMoonHtml).toContain('☋');
    expect(nodalMoonHtml).toContain('−15d');
    expect(nodalMoonHtml).toContain('+15d');
    // Verify timeline continuous colored segments
    expect(nodalMoonHtml).toContain('stroke="#38bdf8"');
    expect(nodalMoonHtml).toContain('stroke="#f43f5e"');
  });

  it('correctly adapts SunElevationDome to tropical latitudes with North culmination and compass octants', () => {
    // Honolulu (21.3°N) in June (dec = 23.44°): Sun peaks to the North!
    const tropicalSunHtml = renderToStaticMarkup(
      React.createElement(SunElevationDome, {
        displayTime: 12,
        latitude: 21.3,
        solarData: {
          noonElevation: 87.9,
          solarNoon: 12,
          equationOfTime: 0,
          sunrise: 5.8,
          sunset: 19.2,
          declination: 23.439,
          distanceAU: 1.016,
          distanceKm: 152000000,
          dayLength: 13.4,
          civil: 0.5,
          nautical: 1,
          astronomical: 1.5,
          daysSinceEpoch: 172,
          lambda: 90,
          eclipticLongitude: 90,
          isMidnightSun: false,
          isPolarNight: false
        }
      })
    );

    // North culmination indicator in peak readout and meridian
    expect(tropicalSunHtml).toContain('87.9° N');
    expect(tropicalSunHtml).toContain('>N</text>');
    expect(tropicalSunHtml).toContain('Looking North · N-Sky Arc');

    // Solstice limits show physical sky directions
    expect(tropicalSunHtml).toContain('Summer Sol:');
    expect(tropicalSunHtml).toContain('87.9° N');
    expect(tropicalSunHtml).toContain('Winter Sol:');
    expect(tropicalSunHtml).toContain('45.3° S');

    // Sunrise / Sunset compass octants
    expect(tropicalSunHtml).toContain('ENE');
    expect(tropicalSunHtml).toContain('WNW');
  });

  it('correctly adapts MoonElevationDome to sub-tropical latitudes with North culmination and standstill tags', () => {
    // Miami (25.8°N) with Moon at major northern standstill declination (+28.58°): peaks to the North!
    const tropicalMoonHtml = renderToStaticMarkup(
      React.createElement(MoonElevationDome, {
        displayTime: 12,
        latitude: 25.8,
        orbitalData: {
          phase: { value: 0.5, name: 'Full Moon' },
          lunarPos: {
            declination: 28.58,
            rightAscension: 90,
            distanceKm: 384400,
            angularDiameterArcmin: 31.0,
            eclipticLatitude: 5.14,
            eclipticLongitude: 90
          },
          lunarEvents: {
            moonrise: 6,
            transit: 12,
            moonset: 18,
            distanceKm: 384400,
            distanceEarthRadii: 60.3,
            isPerigee: false,
            isApogee: false,
            declination: 28.58,
            parallacticAngle: 0
          }
        } as unknown as OrbitalData
      })
    );

    // North culmination indicator in peak readout and meridian
    expect(tropicalMoonHtml).toContain('>N</text>');
    expect(tropicalMoonHtml).toContain('Looking North · N-Sky Arc');

    // Standstill limits show physical sky directions
    expect(tropicalMoonHtml).toContain('Max Standstill:');
    expect(tropicalMoonHtml).toContain('87.2° N');
    expect(tropicalMoonHtml).toContain('Min Standstill:');
    expect(tropicalMoonHtml).toContain('35.6° S');
  });

  it('renders TodayHorizonView in default 2-dome mode with segmented toggle buttons', () => {
    const defaultHtml = renderToStaticMarkup(
      React.createElement(TodayHorizonView, {
        currentTime: 12,
        latitude: 47.06,
      })
    );

    // Segmented toggle controls are present
    expect(defaultHtml).toContain('2-Dome Diurnal');
    expect(defaultHtml).toContain('⊞ 4-Dome Quad');

    // Default renders the 2 diurnal domes
    expect(defaultHtml).toContain('Sun Elevation Arc');
    expect(defaultHtml).toContain('Moon Elevation Arc');

    // Meridian domes are NOT mounted in 2-dome mode
    expect(defaultHtml).not.toContain('Sun Meridian Profile');
    expect(defaultHtml).not.toContain('Moon Meridian Profile');
  });

  it('renders TodayHorizonView in 4-dome mode when initialDomeMode is "4-dome"', () => {
    const quadHtml = renderToStaticMarkup(
      React.createElement(TodayHorizonView, {
        currentTime: 12,
        latitude: 47.06,
        initialDomeMode: '4-dome',
        solarData: {
          noonElevation: 50,
          solarNoon: 12,
          equationOfTime: 0,
          sunrise: 6,
          sunset: 18,
          declination: 10,
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
          isPolarNight: false,
        },
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
            parallacticAngle: 45,
          },
        } as unknown as OrbitalData,
      })
    );

    // All 4 domes are present
    expect(quadHtml).toContain('Sun Elevation Arc');
    expect(quadHtml).toContain('Moon Elevation Arc');
    expect(quadHtml).toContain('Sun Meridian Profile');
    expect(quadHtml).toContain('Moon Meridian Profile');

    // Vertical Zenith axes are rendered in meridian domes
    expect(quadHtml).toContain('x1="130" y1="104" x2="130" y2="12"');

    // Solstice and monthly swaths are rendered
    expect(quadHtml).toContain('meridian-solstice-geometry');
    expect(quadHtml).toContain('meridian-lunar-geometry');

    // Profile axis footer tags are rendered
    expect(quadHtml).toContain('Profile Axis');
    expect(quadHtml).toContain('S ↔ Z ↔ N');
  });

  it('renders SunMeridianDome standalone with solstice swath, tick pins, active bead, and bottom stats', () => {
    const sunMeridianHtml = renderToStaticMarkup(
      React.createElement(SunMeridianDome, {
        displayTime: 12,
        latitude: 47.06,
        solarData: {
          noonElevation: 50,
          solarNoon: 12,
          declination: 10,
          distanceAU: 1.0,
          distanceKm: 149597870,
          equationOfTime: -3.2,
          sunrise: 6,
          sunset: 18,
          dayLength: 12,
          civil: 0.5,
          nautical: 1,
          astronomical: 1.5,
          daysSinceEpoch: 100,
          lambda: 0,
          eclipticLongitude: 0,
          isMidnightSun: false,
          isPolarNight: false,
        },
      })
    );

    expect(sunMeridianHtml).toContain('Sun Meridian Profile');
    expect(sunMeridianHtml).toContain('Noon Peak');
    expect(sunMeridianHtml).toContain('Noon Meridian Culmination');

    // S, Z, N horizon baseline
    expect(sunMeridianHtml).toContain('>S</text>');
    expect(sunMeridianHtml).toContain('>Z</text>');
    expect(sunMeridianHtml).toContain('>N</text>');

    // Vertical dashed Zenith axis
    expect(sunMeridianHtml).toContain('x1="130" y1="104" x2="130" y2="12"');

    // Solstice swath and tick pins
    expect(sunMeridianHtml).toContain('id="solstice-swath-core"');
    expect(sunMeridianHtml).toContain('id="summer-solstice-tick"');
    expect(sunMeridianHtml).toContain('id="winter-solstice-tick"');
    expect(sunMeridianHtml).toContain('id="equinox-tick"');

    // Active solar noon bead
    expect(sunMeridianHtml).toContain('id="active-solar-noon-bead"');

    // Stats strip
    expect(sunMeridianHtml).toContain('Summer Sol:');
    expect(sunMeridianHtml).toContain('Winter Sol:');
    expect(sunMeridianHtml).toContain('Lahaina Transit:');

    // 4-badge footer
    expect(sunMeridianHtml).toContain('Solstice Span');
    expect(sunMeridianHtml).toContain('Δδ 46.9°');
    expect(sunMeridianHtml).toContain('Solar Noon');
    expect(sunMeridianHtml).toContain('Declination (δ)');
    expect(sunMeridianHtml).toContain('Profile Axis');
  });

  it('renders MoonMeridianDome standalone with monthly swath, standstill bounds, and active bead', () => {
    const moonMeridianHtml = renderToStaticMarkup(
      React.createElement(MoonMeridianDome, {
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
            parallacticAngle: 30,
          },
        } as unknown as OrbitalData,
      })
    );

    expect(moonMeridianHtml).toContain('Moon Meridian Profile');
    expect(moonMeridianHtml).toContain('Transit Peak');
    expect(moonMeridianHtml).toContain('Meridian Transit Culmination');

    // S, Z, N horizon baseline
    expect(moonMeridianHtml).toContain('>S</text>');
    expect(moonMeridianHtml).toContain('>Z</text>');
    expect(moonMeridianHtml).toContain('>N</text>');

    // Vertical dashed Zenith axis
    expect(moonMeridianHtml).toContain('x1="130" y1="104" x2="130" y2="12"');

    // Standstill and monthly swaths
    expect(moonMeridianHtml).toContain('id="standstill-swath-guide"');
    expect(moonMeridianHtml).toContain('id="monthly-lunar-swath-core"');

    // Standstill and monthly ticks
    expect(moonMeridianHtml).toContain('id="standstill-max-tick"');
    expect(moonMeridianHtml).toContain('id="standstill-min-tick"');
    expect(moonMeridianHtml).toContain('id="monthly-max-tick"');
    expect(moonMeridianHtml).toContain('id="monthly-min-tick"');

    // Active lunar transit bead
    expect(moonMeridianHtml).toContain('id="active-lunar-transit-bead"');

    // Stats strip
    expect(moonMeridianHtml).toContain('Max Standstill:');
    expect(moonMeridianHtml).toContain('Min Standstill:');
    expect(moonMeridianHtml).toContain('Monthly:');

    // 4-badge footer
    expect(moonMeridianHtml).toContain('Standstill Span');
    expect(moonMeridianHtml).toContain('Δδ 57.2°');
    expect(moonMeridianHtml).toContain('Lunar Transit');
    expect(moonMeridianHtml).toContain('Declination (δ)');
    expect(moonMeridianHtml).toContain('Profile Axis');
  });
});

