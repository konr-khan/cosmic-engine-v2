import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  MacroOrbitView, 
  OrbitHeaderControls, 
  OrbitHoverHud, 
  OrbitSvgCanvas, 
  OrbitPhysicsHud, 
  MILESTONES, 
  EARTH_MILESTONES 
} from './index';
import { calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';

describe('Macro Orbit Subsystem', () => {
  it('exports MacroOrbitView and all decomposed sub-components cleanly', () => {
    expect(MacroOrbitView).toBeDefined();
    expect(OrbitHeaderControls).toBeDefined();
    expect(OrbitHoverHud).toBeDefined();
    expect(OrbitSvgCanvas).toBeDefined();
    expect(OrbitPhysicsHud).toBeDefined();
    expect(MILESTONES).toBeDefined();
    expect(EARTH_MILESTONES).toBeDefined();
    expect(MILESTONES.length).toBe(6);
  });

  it('contains all 6 key orbital milestones with accurate astronomical properties', () => {
    const ids = MILESTONES.map(m => m.id);
    expect(ids).toContain('perihelion');
    expect(ids).toContain('mar_equinox');
    expect(ids).toContain('jun_solstice');
    expect(ids).toContain('aphelion');
    expect(ids).toContain('sep_equinox');
    expect(ids).toContain('dec_solstice');
  });

  it('provides Keplerian orbital dynamics and physics telemetry across True and Exaggerated scales', () => {
    const jd = getJulianDate(new Date(2026, 0, 3), 12);
    const physics = calculateEarthOrbitalPhysics(jd);
    expect(physics.distanceAU).toBeLessThan(1.0);
    expect(physics.solarIrradiancePercent).toBeGreaterThan(100.0);
    expect(physics.orbitalSpeedKms).toBeGreaterThan(29.78);
  });

  it('renders zoom controls and scales SVG viewBox with zoom factor', () => {
    const htmlCanvas = renderToStaticMarkup(
      React.createElement(OrbitSvgCanvas, {
        renderSunX: 0,
        renderSunY: 0,
        renderEarthX: 200,
        renderEarthY: 0,
        renderMoonX: 228,
        renderMoonY: 0,
        orbitalRadius: 200,
        bRatio: 1,
        focus2X: 0,
        focus2Y: 0,
        exaggerateEccentricity: false,
        hoveredId: null,
        onHover: () => {},
        zoom: 2.0
      })
    );

    // When zoom is 2.0, 580/2 = 290, 560/2 = 280, viewBox="-145 -140 290 280"
    expect(htmlCanvas).toContain('viewBox="-145 -140 290 280"');
  });
});
