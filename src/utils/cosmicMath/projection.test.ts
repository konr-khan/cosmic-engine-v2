/**
 * @file projection.test.ts
 * Domain test suite for 3D Earth obliquity, observer pin projection, 4-quadrant orbital loops, and continent landmass clipping.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEarthSideGeometry,
  calculateEarthAxialGeometry,
  generateOrbitalSegments,
  WORLD_LANDMASSES,
  projectContinentLandmasses,
  generateAnalyticalLimbPath,
  equatorialToCartesian3D,
  generateParametricRing3D
} from './index';
import { Vector3D } from '../../types';

describe('Cosmic Math: 3D Projection & Obliquity Geometry', () => {
  describe('3D Projection & Obliquity Geometry Engine', () => {
    describe('calculateEarthSideGeometry', () => {
      it('calculates zero projected tilt at Equinoxes (lambda = 0° and 180°)', () => {
        const geomMar = calculateEarthSideGeometry(310, 110, 18, 0, 45, 12);
        expect(geomMar.poleLineX).toBeCloseTo(0, 4);
        expect(geomMar.poleLineY).toBeCloseTo(18, 4);
        expect(geomMar.eqY1).toBeCloseTo(110, 4);
        expect(geomMar.eqY2).toBeCloseTo(110, 4);

        const geomSep = calculateEarthSideGeometry(310, 110, 18, 180, 45, 12);
        expect(geomSep.poleLineX).toBeCloseTo(0, 4);
        expect(geomSep.poleLineY).toBeCloseTo(18, 4);
      });

      it('calculates maximum projected tilt at Solstices (lambda = 90° and 270°)', () => {
        const geomJun = calculateEarthSideGeometry(310, 110, 18, 90, 45, 12);
        const epsRad = (23.439281 * Math.PI) / 180;
        const expectedNx = -Math.sin(epsRad);
        expect(geomJun.poleLineX).toBeCloseTo(expectedNx * 18, 3);

        const geomDec = calculateEarthSideGeometry(310, 110, 18, 270, 45, 12);
        expect(geomDec.poleLineX).toBeCloseTo(-expectedNx * 18, 3);
      });

      it('determines daylight vs night correctly for side-on observer pin', () => {
        // Observer at noon facing Sun (Sun is at -X on left)
        const noonGeom = calculateEarthSideGeometry(310, 110, 18, 0, 45, 12, 0);
        expect(noonGeom.isDaylight).toBe(true);
        expect(noonGeom.obsPx).toBeLessThan(310); // on Sunlit left side

        // Observer at midnight facing away from Sun
        const midnightGeom = calculateEarthSideGeometry(310, 110, 18, 0, 45, 0, 0);
        expect(midnightGeom.isDaylight).toBe(false);
        expect(midnightGeom.obsPx).toBeGreaterThan(310); // on dark right side

        // Observer at 09:44 UTC in Olympia, WA (-122.81°W -> 01:33 AM local solar time -> Night)
        const olympiaNight = calculateEarthSideGeometry(310, 110, 18, 147, 47.06, 9.733, -122.81);
        expect(olympiaNight.isDaylight).toBe(false);

        // Observer at 18:36 UTC in Olympia, WA (-122.81°W -> ~10:24 AM local solar time -> Daylight)
        const olympiaDay = calculateEarthSideGeometry(310, 110, 18, 162.5, 47.06, 18.6, -122.81);
        expect(olympiaDay.isDaylight).toBe(true);
      });
    });

    describe('calculateEarthAxialGeometry', () => {
      it('calculates screen-projected polar axis and 16-point equator curve', () => {
        const axial = calculateEarthAxialGeometry(200, 90, 20, 0, 47.06, 12, 0);
        expect(axial.earthR).toBe(20);
        expect(axial.equatorPathD.startsWith('M')).toBe(true);
        expect(axial.equatorPathD.split('L')).toHaveLength(17); // M + 16 L segments
        expect(Number.isNaN(axial.obsPx)).toBe(false);
        expect(Number.isNaN(axial.obsPy)).toBe(false);
      });

      it('correctly reports daylight at noon along axial sightline and accounts for longitude', () => {
        const noon = calculateEarthAxialGeometry(200, 90, 20, 0, 45, 12, 0);
        expect(noon.isDaylight).toBe(true);
        expect(noon.isObsVisible).toBe(false); // Noon faces background Sun on far side

        const midnight = calculateEarthAxialGeometry(200, 90, 20, 0, 45, 0, 0);
        expect(midnight.isDaylight).toBe(false);
        expect(midnight.isObsVisible).toBe(true); // Midnight faces camera on front side

        // Observer at 09:44 UTC in Olympia, WA (-122.81°W -> 01:33 AM local solar time -> Night)
        const olympiaAxialNight = calculateEarthAxialGeometry(200, 90, 20, 147, 47.06, 9.733, -122.81);
        expect(olympiaAxialNight.isDaylight).toBe(false);
        expect(olympiaAxialNight.isObsVisible).toBe(true);

        // Observer at 18:36 UTC in Olympia, WA (-122.81°W -> ~10:24 AM local solar time -> Daylight)
        const olympiaAxialDay = calculateEarthAxialGeometry(200, 90, 20, 162.5, 47.06, 18.6, -122.81);
        expect(olympiaAxialDay.isDaylight).toBe(true);
        expect(olympiaAxialDay.isObsVisible).toBe(false);

        // Specific 8/20/2027 scenario:
        // 08:07 UTC -> Local midnight (00:07) -> Night (Visible on front night disk, hollow pin)
        const aug20Midnight = calculateEarthAxialGeometry(260, 110, 24, 147, 47.06, 8.1167, -122.81);
        expect(aug20Midnight.isDaylight).toBe(false);
        expect(aug20Midnight.isObsVisible).toBe(true);

        // 16:17 UTC -> Local morning daylight (08:17) -> Daylight (Occluded on far side facing Sun)
        const aug20Daylight = calculateEarthAxialGeometry(260, 110, 24, 147, 47.06, 16.2833, -122.81);
        expect(aug20Daylight.isDaylight).toBe(true);
        expect(aug20Daylight.isObsVisible).toBe(false);
      });
    });

    describe('generateOrbitalSegments', () => {
      it('generates quadrant path arrays for side-on and axial projections', () => {
        const sideSegs = generateOrbitalSegments(310, 110, 85, 8.5, Math.PI / 4, 'side', 72);
        expect(sideSegs.waxAsc.length).toBeGreaterThan(0);
        expect(sideSegs.waxDesc.length).toBeGreaterThan(0);
        expect(sideSegs.wanAsc.length).toBeGreaterThan(0);
        expect(sideSegs.wanDesc.length).toBeGreaterThan(0);
        const totalSide = sideSegs.waxAsc.length + sideSegs.waxDesc.length + sideSegs.wanAsc.length + sideSegs.wanDesc.length;
        expect(totalSide).toBe(72);

        const axialSegs = generateOrbitalSegments(200, 90, 110, 8.5, Math.PI / 4, 'axial', 72);
        const totalAxial = axialSegs.waxAsc.length + axialSegs.waxDesc.length + axialSegs.wanAsc.length + axialSegs.wanDesc.length;
        expect(totalAxial).toBe(72);
      });
    });

    describe('WORLD_LANDMASSES', () => {
      it('contains valid polygon coordinates for world landmasses', () => {
        expect(WORLD_LANDMASSES.length).toBeGreaterThan(5);
        WORLD_LANDMASSES.forEach((polygon) => {
          expect(polygon.length).toBeGreaterThan(3);
          polygon.forEach(([lon, lat]) => {
            expect(lon).toBeGreaterThanOrEqual(-180);
            expect(lon).toBeLessThanOrEqual(180);
            expect(lat).toBeGreaterThanOrEqual(-90);
            expect(lat).toBeLessThanOrEqual(90);
          });
        });
      });
    });

    describe('globe.ts: projectContinentLandmasses & generateAnalyticalLimbPath', () => {
      it('returns empty array when radius <= 0 or mode is flat', () => {
        expect(projectContinentLandmasses(WORLD_LANDMASSES, 0, 'topdown', 12, 0.41, 0)).toEqual([]);
        expect(projectContinentLandmasses(WORLD_LANDMASSES, -10, 'euler3d', 12, 0.41, 0)).toEqual([]);
        expect(projectContinentLandmasses(WORLD_LANDMASSES, 100, 'flat', 12, 0.41, 0)).toEqual([]);
      });

      it('generates non-empty closed SVG polygon paths across all 3D view modes', () => {
        const modes = ['topdown', 'transverse', 'axial', 'euler3d'] as const;
        modes.forEach((mode) => {
          const paths = projectContinentLandmasses(
            WORLD_LANDMASSES,
            50,
            mode,
            12.0,
            0.409,
            0.0,
            { pitch: 20, yaw: 45, roll: 0 }
          );
          expect(paths.length).toBeGreaterThan(0);
          paths.forEach((p) => {
            expect(p.startsWith('M ')).toBe(true);
            expect(p.trim().endsWith('Z')).toBe(true);
          });
        });
      });

      it('generates analytical spherical limb paths for daylight and twilight thresholds', () => {
        // Oblique sun vector
        const pathDay = generateAnalyticalLimbPath(50, 0.707, 0, 0.707, 0);
        expect(pathDay.length).toBeGreaterThan(0);
        expect(pathDay.startsWith('M ')).toBe(true);
        expect(pathDay.endsWith('Z')).toBe(true);

        const pathCivil = generateAnalyticalLimbPath(50, 0.707, 0, 0.707, -6);
        expect(pathCivil.length).toBeGreaterThan(0);

        // Degenerate/singular cases
        expect(generateAnalyticalLimbPath(0, 0, 0, 1, 0)).toBe('');
        const polarPath = generateAnalyticalLimbPath(50, 0, 0, 1, 0);
        expect(polarPath).toContain('A 50 50');
      });
    });
  });


      describe('generateParametricRing3D Functional Space-Curve Pipeline', () => {
        it('generates continuous SVG paths, non-empty front/back segments, and depth-sorted vertices', () => {
          const r0 = 100;
          const dummyTransform = (p3d: Vector3D) => ({
            p3d,
            pCam: p3d,
            pProj: { x: p3d.x, y: p3d.z },
            screenPos: { x: p3d.x, y: -p3d.y },
            isFront: p3d.z >= 0
          });

          const ring = generateParametricRing3D(
            {
              id: 'test_equator',
              label: 'Test Equator',
              color: '#10b981',
              frontStrokeWidth: 2.0,
              backStrokeWidth: 1.0,
              sampleCount: 36,
              samplePoint: (t) => equatorialToCartesian3D(t * 360, 0, r0)
            },
            dummyTransform
          );

          expect(ring.id).toBe('test_equator');
          expect(ring.label).toBe('Test Equator');
          expect(ring.color).toBe('#10b981');
          expect(ring.vertices.length).toBe(37); // sampleCount + 1
          expect(ring.fullPathD).toContain('M');
          expect(ring.fullPathD).toContain('L');
          expect(ring.frontPathD.length).toBeGreaterThan(0);
          expect(ring.backPathD.length).toBeGreaterThan(0);

          // Verify endpoint wrapping
          const firstV = ring.vertices[0];
          const lastV = ring.vertices[ring.vertices.length - 1];
          expect(firstV.p3d.x).toBeCloseTo(lastV.p3d.x, 3);
          expect(firstV.p3d.y).toBeCloseTo(lastV.p3d.y, 3);
          expect(firstV.p3d.z).toBeCloseTo(lastV.p3d.z, 3);
        });
      });
});
