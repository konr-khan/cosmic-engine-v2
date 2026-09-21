import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  EclipseDemonstrator, 
  EclipseStatusBadge, 
  ShadowRayDiagram, 
  ShadowRayHoverHud,
  LiveSyzygyView,
  NodalPlaneVisualizer, 
  SkyViewSimulator, 
  EclipseScanner
} from './index';
import { calculateEclipseData, getJulianDate, dateToJulianDate } from '../../../utils/cosmicMath';
import { EclipseData } from '../../../types';

describe('Eclipse Demonstrator Subsystem', () => {
  it('exports all decomposed eclipse sub-components and sub-views cleanly', () => {
    expect(EclipseDemonstrator).toBeDefined();
    expect(EclipseStatusBadge).toBeDefined();
    expect(ShadowRayDiagram).toBeDefined();
    expect(ShadowRayHoverHud).toBeDefined();
    expect(LiveSyzygyView).toBeDefined();
    expect(NodalPlaneVisualizer).toBeDefined();
    expect(SkyViewSimulator).toBeDefined();
    expect(EclipseScanner).toBeDefined();
  });

  it('computes direct eclipse syzygy data for historic Great American Eclipse (Apr 8, 2024)', () => {
    const jdApr2024 = getJulianDate(new Date(2024, 3, 8), 18.283);
    const eclipse = calculateEclipseData(jdApr2024);

    expect(eclipse.isEclipseActive).toBe(true);
    expect(eclipse.category).toBe('SOLAR');
    expect(eclipse.obscuration).toBeGreaterThanOrEqual(95);
    expect(eclipse.type).toBe('TOTAL_SOLAR');
  });

  it('integrates unified 3D eclipse geometry with MiniGlobe transverse and axial projection modes', () => {
    const jd = getJulianDate(new Date(2026, 2, 20), 12);
    const eclipse = calculateEclipseData(jd);
    expect(eclipse).toBeDefined();
    expect(typeof eclipse.beta).toBe('number');
    expect(typeof eclipse.alignmentPercent).toBe('number');
  });

  it('conforms NodalPlaneVisualizer dimensions and viewBox to 520x220 matching ShadowRayDiagram', () => {
    const jd = getJulianDate(new Date(2026, 2, 20), 12);
    const eclipse = calculateEclipseData(jd);

    const nodalHtml = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse,
        currentDate: new Date('2026-03-20T12:00:00Z'),
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    const shadowHtml = renderToStaticMarkup(
      React.createElement(ShadowRayDiagram, {
        eclipse,
        currentDate: new Date('2026-03-20T12:00:00Z'),
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // Both cards conform to identical 520x220 viewBox and min-h-[220px]
    expect(nodalHtml).toContain('viewBox="0 0 520 220"');
    expect(shadowHtml).toContain('viewBox="0 0 520 220"');
    expect(nodalHtml).toContain('min-h-[220px]');
    expect(shadowHtml).toContain('min-h-[220px]');

    // Both cards center horizontal ecliptic reference line at y = 110
    expect(nodalHtml).toContain('y1="110"');
    expect(nodalHtml).toContain('y2="110"');
    expect(shadowHtml).toContain('y1="110"');
    expect(shadowHtml).toContain('y2="110"');

    // NodalPlaneVisualizer incorporates upsized Earth MiniGlobe (r=24) and apparent size metrics
    expect(nodalHtml).toContain('Axial Sightline (5.14° Tilt)');
    expect(nodalHtml).toContain('SUN');
    expect(nodalHtml).toContain('MOON');

    // Both NodalPlaneVisualizer and ShadowRayDiagram integrate Dual-Zone masking
    expect(nodalHtml).toContain('clipPath id="axialEarthClip"');
    expect(nodalHtml).toContain('mask id="axialOutsideEarth"');
    expect(shadowHtml).toContain('clipPath id="syzygyEarthClip"');
    expect(shadowHtml).toContain('mask id="syzygyOutsideEarth"');
  });

  it('renders NodalPlaneVisualizer with ghosted transit silhouette behind Earth at New Moon without popping', () => {
    // New Moon (phaseValue = 0.0)
    const newMoonEclipse: EclipseData = {
      type: 'TOTAL_SOLAR',
      category: 'SOLAR',
      label: 'Solar Eclipse',
      obscuration: 100,
      beta: 0.0,
      nodeProximityDeg: 0.0,
      alignmentPercent: 100,
      isEclipseActive: true,
      distanceKm: 360000,
      umbraRadiusKm: 18,
      penumbraRadiusKm: 34,
      raDiff: 0,
      elongation: 0,
      phaseValue: 0.0
    };

    const html = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse: newMoonEclipse,
        currentDate: new Date('2026-03-20T12:00:00Z'),
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // Moon should be rendered as a ghosted transit silhouette behind Earth rather than popping on the surface
    expect(html).toContain('[Behind Earth / Transit]');
    expect(html).toContain('clip-path="url(#axialEarthClip)"');
    expect(html).toContain('mask="url(#axialOutsideEarth)"');
  });

  it('unmutes viewer-side orbital paths in Axial Sightline and Syzygy views while ghosting only sun-facing far-side paths', () => {
    const date2028 = new Date('2028-01-15T13:40:00Z');
    const jd2028 = dateToJulianDate(date2028);
    const eclipse2028 = calculateEclipseData(jd2028);

    const nodalHtml = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse: eclipse2028,
        currentDate: date2028,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 13.67
      })
    );

    const syzygyHtml = renderToStaticMarkup(
      React.createElement(
        'svg',
        null,
        React.createElement(LiveSyzygyView, {
          eclipse: eclipse2028,
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 13.67,
          sunLambdaDeg: 295,
          setHoveredEntity: () => {}
        })
      )
    );

    // In Axial Sightline, near-side paths are rendered unmasked in front of Earth at 0.9 opacity
    // while only far-side paths are clipped to axialEarthClip at 0.22 opacity
    expect(nodalHtml).toContain('opacity="0.22"');
    expect(nodalHtml).toContain('clip-path="url(#axialEarthClip)"');
    expect(nodalHtml).toContain('opacity="0.9"');

    // In Syzygy view, waxing front paths are rendered unmasked at 0.9 opacity across Earth
    expect(syzygyHtml).toContain('opacity="0.9"');
    expect(syzygyHtml).toContain('clip-path="url(#syzygyEarthClip)"');
  });

  it('preserves solid waxing stroke and Earth-occluded circular outline at 0009Z and 0109Z on 8/03/2027', () => {
    const date0009 = new Date('2027-08-03T00:09:00Z');
    const jd0009 = dateToJulianDate(date0009);
    const eclipse0009 = calculateEclipseData(jd0009);

    const html0009 = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse: eclipse0009,
        currentDate: date0009,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 0.15
      })
    );

    // At 0009Z on 8/03/2027, the Moon has already entered its waxing phase (~14h after New Moon).
    // It must render with a solid stroke (not dashed) and retain its occluded outline across Earth
    expect(eclipse0009.phaseValue).toBeLessThanOrEqual(0.5); // Waxing
    expect(html0009).toContain('clip-path="url(#axialEarthClip)"');
    expect(html0009).toContain('[Behind Earth / Transit]');

    const date0109 = new Date('2027-08-03T01:09:00Z');
    const jd0109 = dateToJulianDate(date0109);
    const eclipse0109 = calculateEclipseData(jd0109);

    const html0109 = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse: eclipse0109,
        currentDate: date0109,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 1.15
      })
    );

    // At 0109Z, Moon center is just outside Earth (dist ~24.2px), but disc overlaps Earth disc.
    // Occluded overlay must remain present across Earth disc without losing outline
    expect(html0109).toContain('clip-path="url(#axialEarthClip)"');
  });

  it('mutes ascending and descending nodes only when directly behind Earth disc while preserving full vibrancy in open sky and in front of Earth', () => {
    // 1. Axial Sightline: Ascending Node directly behind Earth (tAsc = 0, nodeAngleDeg = 0)
    // When nodeAngleDeg = 0: tAsc = 0, ascNodeX = 260 (center), ascNodeDepth = -150 <= 0 (behind Earth)
    // tDesc = PI, descNodeX = 260 (center), descNodeDepth = +150 > 0 (in front of Earth)
    const alignedEclipse: EclipseData = {
      type: 'NONE',
      category: 'NO_ECLIPSE',
      label: 'No Eclipse',
      obscuration: 0,
      beta: 0.0,
      nodeProximityDeg: 0.0,
      nodeAngleDeg: 0,
      alignmentPercent: 0,
      isEclipseActive: false,
      distanceKm: 384400,
      umbraRadiusKm: 18,
      penumbraRadiusKm: 34,
      raDiff: 90,
      elongation: 90,
      phaseValue: 0.25
    };

    const axialHtml = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse: alignedEclipse,
        currentDate: new Date('2026-03-20T12:00:00Z'),
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // Ascending Node is directly behind Earth: muted styling (dashed stroke, 0.35 opacity, fill-sky-400/60)
    expect(axialHtml).toContain('stroke-dasharray="2 1.5"');
    expect(axialHtml).toContain('fill-sky-400/60');
    // Descending Node is directly in front of Earth: vibrant styling (solid white stroke, bright fill-rose-400)
    expect(axialHtml).toContain('fill-rose-400 font-semibold');

    // 2. Syzygy View: Ascending Node directly behind Earth (tAsc = 270 deg / 3*PI/2)
    // When nodeAngleDeg = 90: tAsc = -90 = 270 deg, ascNodeX = 310 (center), ascNodeDepth = sin(270)*85 = -85 <= 0
    const syzygyEclipse: EclipseData = {
      ...alignedEclipse,
      nodeAngleDeg: 90
    };

    const syzygyHtml = renderToStaticMarkup(
      React.createElement(
        'svg',
        null,
        React.createElement(LiveSyzygyView, {
          eclipse: syzygyEclipse,
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12,
          sunLambdaDeg: 0,
          setHoveredEntity: () => {}
        })
      )
    );

    // Ascending Node directly behind Earth in Syzygy view: muted styling
    expect(syzygyHtml).toContain('stroke-dasharray="2 1.5"');
    expect(syzygyHtml).toContain('fill-sky-400/60');

    // 3. Open Sky: When node is far from Earth (e.g. nodeAngleDeg = 45 in Axial view)
    // Both nodes are at dist = 150 * sin(45) ~ 106px >> 24px (open sky). Both must be vibrant!
    const openSkyEclipse: EclipseData = {
      ...alignedEclipse,
      nodeAngleDeg: 45
    };

    const openSkyHtml = renderToStaticMarkup(
      React.createElement(NodalPlaneVisualizer, {
        eclipse: openSkyEclipse,
        currentDate: new Date('2026-03-20T12:00:00Z'),
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12
      })
    );

    // In open sky, neither node is directly behind Earth: both have bright full-vibrancy classes
    expect(openSkyHtml).toContain('fill-sky-400 font-semibold');
    expect(openSkyHtml).toContain('fill-rose-400 font-semibold');
  });

  it('renders SkyViewSimulator with prograde Right-to-Left transit across solar eclipse without bouncing', () => {
    // 1. Pre-eclipse (elongation = 359 deg -> Moon West of Sun, Right of center)
    const preEclipse: EclipseData = {
      type: 'TOTAL_SOLAR',
      category: 'SOLAR',
      label: 'Total Solar Eclipse',
      obscuration: 20,
      beta: 0.1,
      nodeProximityDeg: 0.1,
      alignmentPercent: 98,
      isEclipseActive: true,
      distanceKm: 360000,
      umbraRadiusKm: 18,
      penumbraRadiusKm: 34,
      raDiff: 359,
      elongation: 359,
      phaseValue: 359 / 360
    };
    const preHtml = renderToStaticMarkup(React.createElement(SkyViewSimulator, { eclipse: preEclipse }));
    expect(preHtml).toContain('Central Path Sky Simulator (Totality Track)');
    // At elongation = 359, dLon = -1 deg, moonX = 120 - (-1 * 75) = 195 (Right side)
    expect(preHtml).toContain('cx="195"');

    // 2. Central eclipse (elongation = 0 deg -> Moon directly centered)
    const peakEclipse: EclipseData = { ...preEclipse, elongation: 0, obscuration: 100 };
    const peakHtml = renderToStaticMarkup(React.createElement(SkyViewSimulator, { eclipse: peakEclipse }));
    // At elongation = 0, dLon = 0 deg, moonX = 120 (Centered)
    expect(peakHtml).toContain('cx="120"');

    // 3. Post-eclipse (elongation = 1 deg -> Moon East of Sun, Left of center)
    const postEclipse: EclipseData = { ...preEclipse, elongation: 1, obscuration: 20 };
    const postHtml = renderToStaticMarkup(React.createElement(SkyViewSimulator, { eclipse: postEclipse }));
    // At elongation = 1, dLon = +1 deg, moonX = 120 - (1 * 75) = 45 (Left side, does NOT bounce back to 195!)
    expect(postHtml).toContain('cx="45"');
  });
});
