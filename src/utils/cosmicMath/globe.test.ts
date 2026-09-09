/**
 * @file globe.test.ts
 * Comprehensive unit test suite for 3D Earth spherical projection,
 * analytical limb clipping, and rotational vector landmass rendering (globe.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  projectContinentLandmasses,
  generateAnalyticalLimbPath,
  MiniGlobeViewMode,
} from './globe';
import { toRadians } from '../../types/units';

describe('globe.ts: Spherical Continent Projections & Analytical Limb Clipping', () => {

  const SAMPLE_TRIANGLE_LANDMASS: [number, number][][] = [
    // Simple 3-point triangle in Northern / Eastern hemisphere [lon, lat]
    [
      [10, 20],
      [30, 40],
      [20, 50],
    ]
  ];

  const SAMPLE_MULTI_LANDMASSES: [number, number][][] = [
    // Africa / Europe approximate bounding triangle
    [
      [0, 10],
      [30, -20],
      [20, 35],
    ],
    // Americas approximate triangle
    [
      [-80, 10],
      [-60, -30],
      [-100, 40],
    ],
  ];

  describe('projectContinentLandmasses', () => {
    it('returns an empty array when radius <= 0', () => {
      expect(projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, 0, 'topdown', 12, 0.41, 0)).toEqual([]);
      expect(projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, -50, 'topdown', 12, 0.41, 0)).toEqual([]);
    });

    it('returns an empty array when viewMode is "flat"', () => {
      const paths = projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, 100, 'flat', 12, 0.41, 0);
      expect(paths).toEqual([]);
    });

    it('skips degenerate landmasses with fewer than 3 vertices', () => {
      const degenerate: [number, number][][] = [
        [],
        [[10, 20]],
        [[10, 20], [30, 40]],
      ];
      const paths = projectContinentLandmasses(degenerate, 100, 'topdown', 12, 0.41, 0);
      expect(paths).toEqual([]);
    });

    it('projects continents in "topdown" (ecliptic NEP) view with valid SVG path grammar', () => {
      const radius = 80;
      const epsRad = toRadians(23.44);
      const paths = projectContinentLandmasses(SAMPLE_MULTI_LANDMASSES, radius, 'topdown', 12, epsRad, 0);

      expect(paths.length).toBeGreaterThan(0);
      for (const d of paths) {
        expect(d).toMatch(/^M\s+[-\d.]+\s+[-\d.]+\s+L/);
        expect(d.endsWith('Z')).toBe(true);

        // All vertex coordinates should be within display radius bounds (plus small numerical tolerance)
        const coords = d.split(/[MLZ\s]+/).filter(Boolean).map(Number);
        for (let i = 0; i < coords.length; i += 2) {
          const x = coords[i];
          const y = coords[i + 1];
          const dist = Math.hypot(x, y);
          expect(dist).toBeLessThanOrEqual(radius * 1.05);
        }
      }
    });

    it('projects continents in "transverse" side-on view and responds to axial tilt / sunLambda', () => {
      const radius = 80;
      const epsRad = toRadians(23.44);

      // June solstice (sunLambda = 90) vs December solstice (sunLambda = 270)
      const pathsJune = projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, radius, 'transverse', 12, epsRad, 90);
      const pathsDec = projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, radius, 'transverse', 12, epsRad, 270);

      expect(pathsJune.length).toBeGreaterThan(0);
      expect(pathsDec.length).toBeGreaterThan(0);
      expect(pathsJune[0]).not.toBe(pathsDec[0]);
    });

    it('projects continents in "axial" anti-solar sightline view', () => {
      const radius = 100;
      const epsRad = toRadians(23.44);
      const paths = projectContinentLandmasses(SAMPLE_MULTI_LANDMASSES, radius, 'axial', 12, epsRad, 0);

      expect(paths.length).toBeGreaterThan(0);
      for (const d of paths) {
        expect(d.startsWith('M')).toBe(true);
        expect(d.endsWith('Z')).toBe(true);
      }
    });

    it('projects continents in "euler3d" view respecting camera pitch, yaw, and roll', () => {
      const radius = 90;
      const pathsZero = projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, radius, 'euler3d', 12, 0.41, 0, {
        pitch: 0,
        yaw: 0,
        roll: 0,
      });

      const pathsRotated = projectContinentLandmasses(SAMPLE_TRIANGLE_LANDMASS, radius, 'euler3d', 12, 0.41, 0, {
        pitch: 45,
        yaw: 90,
        roll: 30,
      });

      expect(pathsZero.length).toBeGreaterThan(0);
      expect(pathsRotated.length).toBeGreaterThan(0);
      expect(pathsZero[0]).not.toEqual(pathsRotated[0]);
    });

    it('clips polygon edges when crossing the front/back hemisphere boundary (z = -0.02)', () => {
      // Polygon spanning from front hemisphere (lon 0) to back hemisphere (lon 180) at noon
      const hemisphereSpanningPoly: [number, number][][] = [
        [
          [0, 0],     // Front (h = 0, z > 0)
          [180, 0],   // Back (h = 180, z < 0)
          [90, 60],   // Side
        ]
      ];

      const radius = 100;
      const paths = projectContinentLandmasses(hemisphereSpanningPoly, radius, 'topdown', 12, 0.41, 0);
      expect(paths.length).toBeGreaterThan(0);

      // Clipped points must have finite coordinates
      const numbers = paths[0].split(/[MLZ\s]+/).filter(Boolean).map(Number);
      for (const n of numbers) {
        expect(Number.isFinite(n)).toBe(true);
      }
    });
  });

  describe('generateAnalyticalLimbPath', () => {
    const RADIUS = 100;

    it('returns empty string when radius <= 0', () => {
      expect(generateAnalyticalLimbPath(0, 1, 0, 0)).toBe('');
      expect(generateAnalyticalLimbPath(-10, 1, 0, 0)).toBe('');
    });

    it('handles singular pole case (Sun along viewer line of sight, sPerp < 1e-6)', () => {
      // Sun directly in front facing observer (sz = 1.0)
      const frontSun = generateAnalyticalLimbPath(RADIUS, 0, 0, 1.0, 0);
      expect(frontSun).toContain(`M 0 -${RADIUS}`);
      expect(frontSun).toContain(`A ${RADIUS} ${RADIUS}`);
      expect(frontSun.endsWith('Z')).toBe(true);

      // Sun directly behind observer (sz = -1.0)
      const backSun = generateAnalyticalLimbPath(RADIUS, 0, 0, -1.0, 0);
      expect(backSun).toBe('');
    });

    it('handles Case A: entire terminator circle on backside of sphere (mu >= 1)', () => {
      // High threshold or high sz putting entire circle behind limb
      const pathFront = generateAnalyticalLimbPath(RADIUS, 0.01, 0.01, 0.99, -30);
      expect(pathFront).toContain(`A ${RADIUS} ${RADIUS}`);

      const pathBack = generateAnalyticalLimbPath(RADIUS, 0.01, 0.01, -0.99, 30);
      expect(pathBack).toBe('');
    });

    it('handles Case B: entire terminator circle on front hemisphere (mu <= -1)', () => {
      // When Sun elevation threshold makes terminator circle fully visible on front face
      const path = generateAnalyticalLimbPath(RADIUS, 0.02, 0.02, 0.98, 30);
      expect(path.length).toBeGreaterThan(0);
      expect(path.startsWith('M')).toBe(true);
      expect(path.endsWith('Z')).toBe(true);
    });

    it('handles Case C: 2-point limb intersection and closed rim sweep (|mu| < 1)', () => {
      // Standard half-lit Earth: Sun at 45° angle in camera frame
      const sx = Math.SQRT1_2;
      const sy = 0;
      const sz = Math.SQRT1_2;

      const path = generateAnalyticalLimbPath(RADIUS, sx, sy, sz, 0);
      expect(path.length).toBeGreaterThan(0);
      expect(path).toMatch(/^M\s+[-\d.]+\s+[-\d.]+\s+L/);
      expect(path.endsWith('Z')).toBe(true);

      // Verify coordinate limits
      const coords = path.split(/[MLZ\s]+/).filter(Boolean).map(Number);
      for (let i = 0; i < coords.length; i += 2) {
        const x = coords[i];
        const y = coords[i + 1];
        const dist = Math.hypot(x, y);
        expect(dist).toBeLessThanOrEqual(RADIUS * 1.05);
      }
    });

    it('supports all canonical solar twilight thresholds (0°, -6°, -12°, -18°)', () => {
      const sx = 0.6;
      const sy = 0.0;
      const sz = 0.8;

      const daylightPath = generateAnalyticalLimbPath(RADIUS, sx, sy, sz, 0);
      const civilPath = generateAnalyticalLimbPath(RADIUS, sx, sy, sz, -6);
      const nauticalPath = generateAnalyticalLimbPath(RADIUS, sx, sy, sz, -12);
      const astroPath = generateAnalyticalLimbPath(RADIUS, sx, sy, sz, -18);

      expect(daylightPath.length).toBeGreaterThan(0);
      expect(civilPath.length).toBeGreaterThan(0);
      expect(nauticalPath.length).toBeGreaterThan(0);
      expect(astroPath.length).toBeGreaterThan(0);

      // As twilight goes deeper into negative angles, the illuminated region expands
      expect(daylightPath).not.toEqual(civilPath);
      expect(civilPath).not.toEqual(nauticalPath);
      expect(nauticalPath).not.toEqual(astroPath);
    });
  });
});
