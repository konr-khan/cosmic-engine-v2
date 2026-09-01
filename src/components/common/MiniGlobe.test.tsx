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
});
