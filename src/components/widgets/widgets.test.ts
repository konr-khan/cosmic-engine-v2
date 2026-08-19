import { describe, it, expect } from 'vitest';
import { SolarAlmanac, SolarShortcutsRail, PolarSunlightDial, SolarRibbonChart } from './solar';
import { TodayHorizonView, SunElevationDome, MoonElevationDome } from './today';
import { calculateSolarPosition, calculateEarthOrbitalPhysics, getJulianDate } from '../../utils/cosmicMath';

describe('Solar Subsystem Modular Exports & Integration', () => {
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
});

describe('Today Horizon Subsystem Modular Exports & Integration', () => {
  it('exports all decomposed today sub-components cleanly', () => {
    expect(TodayHorizonView).toBeDefined();
    expect(SunElevationDome).toBeDefined();
    expect(MoonElevationDome).toBeDefined();
  });
});
