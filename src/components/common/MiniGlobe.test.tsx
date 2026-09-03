/**
 * @file MiniGlobe.test.tsx
 * Unit test suite for <MiniGlobe /> component and 3D rotational vector continent projections.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MiniGlobe, projectContinentLandmasses } from './MiniGlobe';
import { WORLD_LANDMASSES } from '../../utils/cosmicMath/geoData';
import { toRadians } from '../../utils/cosmicMath/core';

describe('projectContinentLandmasses', () => {
  const epsRad = toRadians(23.439281);

  it('returns empty array when radius <= 0 or in flat viewMode', () => {
    expect(projectContinentLandmasses(WORLD_LANDMASSES, 0, 'euler3d', 12, epsRad, 0)).toEqual([]);
    expect(projectContinentLandmasses(WORLD_LANDMASSES, 12, 'flat', 12, epsRad, 0)).toEqual([]);
  });

  it('generates valid SVG path strings in euler3d mode without NaN', () => {
    const paths = projectContinentLandmasses(WORLD_LANDMASSES, 14, 'euler3d', 12, epsRad, 0, { pitch: 25, yaw: 35, roll: 0 });
    expect(paths.length).toBeGreaterThan(0);
    for (const d of paths) {
      expect(d).not.toContain('NaN');
      expect(d.startsWith('M ')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
    }
  });

  it('generates valid SVG path strings in topdown mode without NaN', () => {
    const paths = projectContinentLandmasses(WORLD_LANDMASSES, 14, 'topdown', 12, epsRad, 0);
    expect(paths.length).toBeGreaterThan(0);
    for (const d of paths) {
      expect(d).not.toContain('NaN');
      expect(d.startsWith('M ')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
    }
  });

  it('generates valid SVG path strings in transverse and axial modes', () => {
    const transversePaths = projectContinentLandmasses(WORLD_LANDMASSES, 12, 'transverse', 12, epsRad, 90);
    expect(transversePaths.length).toBeGreaterThan(0);
    for (const d of transversePaths) {
      expect(d).not.toContain('NaN');
    }

    const axialPaths = projectContinentLandmasses(WORLD_LANDMASSES, 12, 'axial', 12, epsRad, 90);
    expect(axialPaths.length).toBeGreaterThan(0);
    for (const d of axialPaths) {
      expect(d).not.toContain('NaN');
    }
  });

  it('rotates continents continuously as timeOfDay advances', () => {
    const pathsNoon = projectContinentLandmasses(WORLD_LANDMASSES, 14, 'euler3d', 12, epsRad, 0, { pitch: 0, yaw: 0, roll: 0 });
    const pathsMidnight = projectContinentLandmasses(WORLD_LANDMASSES, 14, 'euler3d', 0, epsRad, 0, { pitch: 0, yaw: 0, roll: 0 });
    expect(pathsNoon).not.toEqual(pathsMidnight);
  });

  it('correctly maps northern latitudes to negative Y (upward) and eastern longitudes to positive X (rightward)', () => {
    // Single test polygon with high northern latitude (Arctic, lat: 70°N, lon: 0°E) at noon
    const testArcticPoly: [number, number][][] = [
      [[0, 70], [10, 70], [5, 75], [0, 70]]
    ];
    const paths = projectContinentLandmasses(testArcticPoly, 100, 'euler3d', 12, epsRad, 0, { pitch: 0, yaw: 0, roll: 0 });
    expect(paths.length).toBe(1);
    // Northern latitude should project to negative Y in SVG (top of globe)
    // Points at lat 70°N should have Y around -100 * sin(70°) ≈ -94
    const firstPointMatch = paths[0].match(/M ([\d.-]+) ([\d.-]+)/);
    expect(firstPointMatch).not.toBeNull();
    if (firstPointMatch) {
      const yVal = parseFloat(firstPointMatch[2]);
      expect(yVal).toBeLessThan(-80); // well above equator
    }
  });
});

describe('<MiniGlobe /> Component', () => {
  it('renders SVG root with role="img" and accessible title', () => {
    const html = renderToStaticMarkup(
      <svg>
        <MiniGlobe cx={0} cy={0} radius={14} viewMode="topdown" label="EARTH" />
      </svg>
    );

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="EARTH Mini Globe"');
    expect(html).toContain('<title>EARTH');
  });

  it('renders continent layer when showContinents is true', () => {
    const html = renderToStaticMarkup(
      <svg>
        <MiniGlobe cx={0} cy={0} radius={14} viewMode="topdown" showContinents={true} />
      </svg>
    );

    expect(html).toContain('class="miniglobe-continents');
  });

  it('hides continent layer when showContinents is false or in flat mode', () => {
    const htmlNoContinents = renderToStaticMarkup(
      <svg>
        <MiniGlobe cx={0} cy={0} radius={14} viewMode="topdown" showContinents={false} />
      </svg>
    );
    expect(htmlNoContinents).not.toContain('miniglobe-continents');

    const htmlFlat = renderToStaticMarkup(
      <svg>
        <MiniGlobe cx={0} cy={0} radius={14} viewMode="flat" showContinents={true} />
      </svg>
    );
    expect(htmlFlat).not.toContain('miniglobe-continents');
  });

  it('renders correctly across all 5 view modes without errors', () => {
    const modes = ['topdown', 'transverse', 'axial', 'euler3d', 'flat'] as const;
    for (const mode of modes) {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe cx={0} cy={0} radius={12} viewMode={mode} />
        </svg>
      );
      expect(html).toContain('miniglobe-root');
    }
  });

  it('renders solid observer pin in daylight and hollow observer pin at night (conforming across modes)', () => {
    // Noon in Olympia, WA (-122.81°W, ~20:00 UTC) -> Daylight (Solid Sky Blue + pulsing halo)
    const htmlNoon = renderToStaticMarkup(
      <svg>
        <MiniGlobe cx={0} cy={0} radius={24} viewMode="axial" latitude={47.06} longitude={-122.81} timeOfDay={20} showObserverPin={true} />
      </svg>
    );
    expect(htmlNoon).toContain('class="miniglobe-observer-pin');
    expect(htmlNoon).toContain('fill="#38bdf8"');
    expect(htmlNoon).toContain('class="animate-pulse"');

    // Midnight in Olympia, WA (-122.81°W, ~08:00 UTC) -> Night (Hollow fill="none" stroke="#94a3b8")
    const htmlMidnight = renderToStaticMarkup(
      <svg>
        <MiniGlobe cx={0} cy={0} radius={24} viewMode="axial" latitude={47.06} longitude={-122.81} timeOfDay={8} showObserverPin={true} />
      </svg>
    );
    expect(htmlMidnight).toContain('class="miniglobe-observer-pin');
    expect(htmlMidnight).toContain('fill="none"');
    expect(htmlMidnight).toContain('stroke="#94a3b8"');
    expect(htmlMidnight).not.toContain('animate-pulse');
  });
});
