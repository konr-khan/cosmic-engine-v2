import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  SolarAlmanac, 
  SolarShortcutsRail, 
  PolarSunlightDial, 
  SolarRibbonChart,
  SolarRibbonAxes,
  SolarRibbonBands,
  SolarRibbonOverlay
} from './index';
import { calculateSolarPosition, calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';
import { AnnualSolarMatrixItem } from '../../../types';

describe('Solar Almanac Subsystem', () => {
  it('exports all decomposed solar sub-components cleanly', () => {
    expect(SolarAlmanac).toBeDefined();
    expect(SolarShortcutsRail).toBeDefined();
    expect(PolarSunlightDial).toBeDefined();
    expect(SolarRibbonChart).toBeDefined();
    expect(SolarRibbonAxes).toBeDefined();
    expect(SolarRibbonBands).toBeDefined();
    expect(SolarRibbonOverlay).toBeDefined();
  });

  it('computes accurate Keplerian solar metrics through calculateSolarPosition and calculateEarthOrbitalPhysics', () => {
    const jd = getJulianDate(new Date(2026, 0, 3), 12); // Near Perihelion
    const solar = calculateSolarPosition(jd);
    const physics = calculateEarthOrbitalPhysics(jd);

    expect(solar.distanceAU).toBeCloseTo(physics.distanceAU, 4);
    expect(solar.distanceAU).toBeLessThan(0.99); // Perihelion < 0.99 AU
    expect(solar.isPerihelion).toBe(true);
    expect(solar.sunAngularDiameterArcmin).toBeGreaterThan(32.0);
    expect(solar.orbitalSpeedKms).toBeGreaterThan(30.0);
  });

  it('renders SolarRibbonAxes with month dividers and 24-hour time labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        'svg',
        null,
        React.createElement(SolarRibbonAxes, {
          width: 800,
          height: 440,
          paddingLeft: 55,
          paddingTop: 30,
          chartW: 680,
          chartH: 375,
          dayToX: (d: number) => 55 + (d / 365) * 680,
          timeToY: (t: number) => 30 + (t / 24) * 375,
        })
      )
    );

    // Verify month dividers & labels
    expect(html).toContain('Jan');
    expect(html).toContain('Jun');
    expect(html).toContain('Dec');

    // Verify time labels
    expect(html).toContain('12 AM');
    expect(html).toContain('12 PM');
    expect(html).toContain('Noon');
    expect(html).toContain('Midnight');
  });

  it('renders SolarRibbonBands with gradient defs, twilight bands, and key stats', () => {
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      sunrise: 6.0,
      sunset: 18.0,
      solarNoon: 12.0,
      civilDawn: 5.5,
      civilDusk: 18.5,
      nauticalDawn: 5.0,
      nauticalDusk: 19.0,
      astroDawn: 4.5,
      astroDusk: 19.5,
      dayLength: 12.0,
      declination: 0.0,
    })) as unknown as AnnualSolarMatrixItem[];

    const html = renderToStaticMarkup(
      React.createElement(
        'svg',
        null,
        React.createElement(SolarRibbonBands, {
          almanacData: mockData,
          keyStats: {
            earliestSunrise: mockData[2],
            latestSunset: mockData[7],
          },
          dayToX: (d: number) => 55 + (d / 10) * 680,
          timeToY: (t: number) => 30 + (t / 24) * 375,
          getDayLabel: (d: number) => `Day ${d}`,
          buildBandPath: () => 'M 0 0 Z',
          buildLinePath: () => 'M 0 0',
          paddingLeft: 55,
          paddingTop: 30,
          chartW: 680,
          chartH: 375,
        })
      )
    );

    // Gradient defs
    expect(html).toContain('solarAlmanacDayGrad');
    expect(html).toContain('solarAlmanacCivilGrad');
    expect(html).toContain('solarAlmanacNauticalGrad');
    expect(html).toContain('solarAlmanacAstroGrad');

    // Night base canvas
    expect(html).toContain('#020617');

    // Twilight filled bands
    expect(html).toContain('url(#solarAlmanacDayGrad)');
    expect(html).toContain('url(#solarAlmanacCivilGrad)');
    expect(html).toContain('url(#solarAlmanacNauticalGrad)');
    expect(html).toContain('url(#solarAlmanacAstroGrad)');

    // Key stats
    expect(html).toContain('Day 3');
    expect(html).toContain('Day 8');
  });

  it('renders SolarRibbonOverlay with active markers, mirrored day guide, and tooltip', () => {
    const mockData = Array.from({ length: 365 }, (_, i) => ({
      day: i + 1,
      sunrise: 7.0,
      sunset: 17.0,
      solarNoon: 12.0,
      dayLength: 10.0,
      declination: -20.0,
    })) as unknown as AnnualSolarMatrixItem[];

    const html = renderToStaticMarkup(
      React.createElement(
        'svg',
        null,
        React.createElement(SolarRibbonOverlay, {
          width: 800,
          paddingLeft: 55,
          paddingRight: 65,
          paddingTop: 30,
          chartW: 680,
          chartH: 375,
          activeDay: 10,
          activeData: mockData[9],
          hoverDay: 20,
          hoverDate: null,
          hoverTime: 14.5,
          almanacData: mockData,
          currentMirrorDayData: mockData[350],
          lonOffsetHours: 0,
          eotOffsetHours: 0,
          dayToX: (d: number) => 55 + (d / 365) * 680,
          timeToY: (t: number) => 30 + (t / 24) * 375,
          getDayLabel: (d: number) => `Day ${d}`,
        })
      )
    );

    // Active day sunrise/sunset right-axis labels
    expect(html).toContain('07:00');
    expect(html).toContain('17:00');

    // Hover time badge & guideline
    expect(html).toContain('LST');
    expect(html).toContain('Z)');

    // Solstice mirrored equivalent daylight guide & badge
    expect(html).toContain('Equiv: Day 351');

    // Hover tooltip card
    expect(html).toContain('Day 20');
    expect(html).toContain('10.0h Day');
    expect(html).toContain('Solar Noon:');
  });

  it('renders SolarRibbonChart with interactive hover hairline and tooltip', () => {
    const mockSolarData = Array.from({ length: 365 }, (_, i) => ({
      day: i + 1,
      sunrise: 7.0,
      sunset: 17.0,
      solarNoon: 12.0,
      dayLength: 10.0,
      declination: -20.0
    })) as unknown as AnnualSolarMatrixItem[];

    const solarHtml = renderToStaticMarkup(
      React.createElement(SolarRibbonChart, {
        almanacData: mockSolarData,
        totalDays: 365,
        activeDay: 1,
        activeData: mockSolarData[0],
        mirrorDayData: null,
        keyStats: {
          earliestSunrise: mockSolarData[170],
          latestSunset: mockSolarData[190]
        },
        lonOffsetHours: 0,
        eotOffsetHours: 0,
        getDayLabel: (d: number) => `Jan ${d}`,
        hoverDate: new Date(Date.UTC(2026, 0, 5, 12, 0, 0)),
        year: 2026
      })
    );

    expect(solarHtml).toContain('Jan 5');
    expect(solarHtml).toContain('10.0h Day');
    expect(solarHtml).toContain('Solar Noon:');
    expect(solarHtml).toContain('Equiv:');
  });

  it('renders PolarSunlightDial 24-hour circular polar sector dial', () => {
    const mockItem: AnnualSolarMatrixItem = {
      day: 172,
      sunrise: 5.2,
      sunset: 21.1,
      solarNoon: 13.15,
      dayLength: 15.9,
      declination: 23.44,
      civilDawn: 4.5,
      civilDusk: 21.8,
      nauticalDawn: 3.6,
      nauticalDusk: 22.7,
      astroDawn: 2.4,
      astroDusk: 23.9,
      equationOfTime: -1.5
    };

    const html = renderToStaticMarkup(
      React.createElement(PolarSunlightDial, {
        activeData: mockItem,
        currentTime: 14.0,
        timeMode: 'solar',
        setTimeMode: () => {},
        lonOffsetHours: 0,
        eotOffsetHours: 0
      })
    );

    expect(html).toContain('SOLAR DAYLIGHT');
    expect(html).toContain('15h 54m');
    expect(html).toContain('Noon');
  });
});
