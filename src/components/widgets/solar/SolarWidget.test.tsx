import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  SolarAlmanac, 
  SolarShortcutsRail, 
  PolarSunlightDial, 
  SolarRibbonChart 
} from './index';
import { calculateSolarPosition, calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';
import { AnnualSolarMatrixItem } from '../../../types';

describe('Solar Almanac Subsystem', () => {
  it('exports all decomposed solar sub-components cleanly', () => {
    expect(SolarAlmanac).toBeDefined();
    expect(SolarShortcutsRail).toBeDefined();
    expect(PolarSunlightDial).toBeDefined();
    expect(SolarRibbonChart).toBeDefined();
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
