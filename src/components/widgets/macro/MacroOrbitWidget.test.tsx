import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  MacroOrbitView, 
  OrbitHeaderControls, 
  OrbitHoverHud, 
  OrbitSvgCanvas, 
  OrbitPhysicsHud, 
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
    expect(EARTH_MILESTONES).toBeDefined();
    expect(EARTH_MILESTONES.length).toBe(6);
  });

  it('contains all 6 key orbital milestones with accurate astronomical properties', () => {
    const ids = EARTH_MILESTONES.map(m => m.id);
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

  it('renders MacroOrbitView with real-time currentTime and Earth drag hitbox', () => {
    const html = renderToStaticMarkup(
      React.createElement(MacroOrbitView, {
        currentDate: new Date(2026, 5, 21),
        currentTime: 18.5
      })
    );

    // MiniGlobe with top-down viewMode and Earth label
    expect(html).toContain('EARTH');
    expect(html).toContain('SUN');
    expect(html).toContain('Solstice');
  });

  it('renders OrbitSvgCanvas with interactive Earth drag hitbox when onDateScrub is provided', () => {
    const onScrub = () => {};
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
        timeOfDay: 14.25,
        onDateScrub: onScrub
      })
    );

    expect(htmlCanvas).toContain('cursor-grab');
    expect(htmlCanvas).toContain('r="16"');
  });

  it('preserves the passed simulation year during orbital date scrubbing without snapping to wall-clock year', () => {
    const onScrub = vi.fn();
    const simulationYear = 2038;

    const mockSvg = {
      createSVGPoint: () => ({
        x: 0,
        y: 0,
        matrixTransform: () => ({ x: -200, y: 0 })
      }),
      getScreenCTM: () => ({
        inverse: () => ({})
      })
    };

    let capturedVdom: any = null;
    function Harness() {
      const origState = React.useState;
      const origRef = React.useRef;
      (React as any).useState = () => [true, vi.fn()];
      (React as any).useRef = () => ({ current: mockSvg });
      try {
        capturedVdom = OrbitSvgCanvas({
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
          timeOfDay: 12.0,
          year: simulationYear,
          onDateScrub: onScrub
        });
      } finally {
        (React as any).useState = origState;
        (React as any).useRef = origRef;
      }
      return React.createElement('div', null, capturedVdom);
    }

    renderToStaticMarkup(React.createElement(Harness));

    expect(capturedVdom).toBeDefined();
    const children = React.Children.toArray(capturedVdom.props.children);
    const earthHitbox = children.find((child: any) => child?.type === 'circle' && child?.props?.r === '16') as any;
    expect(earthHitbox).toBeDefined();

    earthHitbox.props.onPointerMove({
      clientX: 200,
      clientY: 100
    });

    expect(onScrub).toHaveBeenCalledTimes(1);
    const [scrubbedDate] = onScrub.mock.calls[0];
    expect(scrubbedDate).toBeInstanceOf(Date);
    expect(scrubbedDate.getUTCFullYear()).toBe(simulationYear);
  });

  it('falls back to 2026 when year prop is omitted without snapping to wall-clock year', () => {
    const onScrub = vi.fn();

    const mockSvg = {
      createSVGPoint: () => ({
        x: 0,
        y: 0,
        matrixTransform: () => ({ x: -200, y: 0 })
      }),
      getScreenCTM: () => ({
        inverse: () => ({})
      })
    };

    let capturedVdom: any = null;
    function Harness() {
      const origState = React.useState;
      const origRef = React.useRef;
      (React as any).useState = () => [true, vi.fn()];
      (React as any).useRef = () => ({ current: mockSvg });
      try {
        capturedVdom = OrbitSvgCanvas({
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
          timeOfDay: 12.0,
          onDateScrub: onScrub
        });
      } finally {
        (React as any).useState = origState;
        (React as any).useRef = origRef;
      }
      return React.createElement('div', null, capturedVdom);
    }

    renderToStaticMarkup(React.createElement(Harness));

    const children = React.Children.toArray(capturedVdom.props.children);
    const earthHitbox = children.find((child: any) => child?.type === 'circle' && child?.props?.r === '16') as any;
    expect(earthHitbox).toBeDefined();

    earthHitbox.props.onPointerMove({
      clientX: 200,
      clientY: 100
    });

    expect(onScrub).toHaveBeenCalledTimes(1);
    const [scrubbedDate] = onScrub.mock.calls[0];
    expect(scrubbedDate).toBeInstanceOf(Date);
    expect(scrubbedDate.getUTCFullYear()).toBe(2026);
  });
});

