import { describe, it, expect, vi } from 'vitest';
import { 
  useCosmicScene, 
  useHeliocentricScene, 
  useEclipseScene, 
  useArmillaryScene 
} from './useCosmicScene';
import { cosmicStore } from '../store/cosmicStore';

// Mock React hooks to execute immediately in pure unit test environment
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useMemo: (factory: () => any) => factory(),
    useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: (effect: () => any) => { effect(); },
    useRef: (initial: any) => ({ current: initial }),
    useCallback: (fn: any) => fn,
    useSyncExternalStore: (subscribe: any, getSnapshot: () => any) => getSnapshot()
  };
});

describe('useCosmicScene Hook Suite', () => {
  describe('1. Master Hook: useCosmicScene', () => {
    it('returns complete CosmicSceneData with Julian Date, 3D scene, and ephemeris frame', () => {
      const testDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
      const result = useCosmicScene({
        date: testDate,
        timeOfDay: 12,
        latitude: 47.06,
        longitude: -122.81,
        useAnalemma: true,
        scaleMode: 'true'
      });

      expect(result.julianDate).toBeDefined();
      expect(result.timestamp).toEqual(testDate);
      expect(result.scaleMode).toBe('true');
      expect(result.scene3D).toBeDefined();
      expect(result.ephemerisFrame).toBeDefined();

      // Check 3D scene bodies
      expect(result.scene3D.sun).toBeDefined();
      expect(result.scene3D.earth).toBeDefined();
      expect(result.scene3D.moon).toBeDefined();
      expect(result.scene3D.milestones.length).toBe(6);
      expect(result.scene3D.shadowCones).toBeDefined();
    });

    it('falls back to cosmicStore defaults when options are omitted', () => {
      const result = useCosmicScene();

      expect(result.julianDate).toBeDefined();
      expect(result.scene3D).toBeDefined();
      expect(result.ephemerisFrame).toBeDefined();
      expect(result.scaleMode).toBe('true');
    });

    it('handles exaggerated scaleMode override correctly', () => {
      const testDate = new Date(Date.UTC(2026, 0, 3, 12, 0, 0));
      const result = useCosmicScene({
        date: testDate,
        scaleMode: 'exaggerated'
      });

      expect(result.scaleMode).toBe('exaggerated');
      expect(result.scene3D.scaleMode).toBe('exaggerated');
      expect(result.scene3D.foci).toBeDefined();
      expect(result.scene3D.foci?.eccentricity).toBeCloseTo(0.25, 2);
    });
  });

  describe('2. Sub-Hook: useHeliocentricScene', () => {
    it('returns projected 2D coordinates, 1 AU physics HUD, and milestone nodes in True Scale mode', () => {
      const testDate = new Date(Date.UTC(2026, 0, 3, 12, 0, 0)); // Perihelion
      const result = useHeliocentricScene({
        date: testDate,
        timeOfDay: 12,
        scaleMode: 'true',
        orbitalRadius: 200
      });

      expect(result.scaleMode).toBe('true');
      expect(result.orbitalRadius).toBe(200);
      expect(result.sun).toBeDefined();
      expect(result.earth).toBeDefined();
      expect(result.moon).toBeDefined();
      expect(result.orbitPath).toBeDefined();
      expect(result.orbitPath.length).toBeGreaterThan(0);

      // Verify Earth physics
      expect(result.earth.distanceAU).toBeCloseTo(0.983, 2);
      expect(result.earth.distanceKm).toBeGreaterThan(147000000);
      expect(result.earth.distanceKm).toBeLessThan(148000000);
      expect(result.earth.orbitalSpeedKms).toBeGreaterThan(30.0);
      expect(result.earth.solarIrradiancePercent).toBeGreaterThan(102.0);
      expect(result.earth.sunAngularDiameterArcmin).toBeGreaterThan(32.4);

      // Verify 6 milestones
      expect(result.milestones.length).toBe(6);
      const milestoneIds = result.milestones.map(m => m.id);
      expect(milestoneIds).toContain('perihelion');
      expect(milestoneIds).toContain('aphelion');
      expect(milestoneIds).toContain('mar_equinox');
      expect(milestoneIds).toContain('jun_solstice');
      expect(milestoneIds).toContain('sep_equinox');
      expect(milestoneIds).toContain('dec_solstice');

      // Verify subsolar vector and axial obliquity
      expect(result.subsolarVector).toBeDefined();
      expect(result.axialTiltDeg).toBeCloseTo(23.44, 1);
    });

    it('supports overloaded scaleMode string invocation and calculates F2 focal offset', () => {
      const testDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
      const result = useHeliocentricScene('exaggerated', {
        date: testDate,
        orbitalRadius: 200
      });

      expect(result.scaleMode).toBe('exaggerated');
      expect(result.focus2X).toBeCloseTo(50, 1); // c = a * e = 200 * 0.25 = 50
      expect(result.bRatio).toBeCloseTo(Math.sqrt(1 - 0.25 * 0.25), 3);
      expect(result.sun.x).toBeCloseTo(-50, 1);
    });
  });

  describe('3. Sub-Hook: useEclipseScene', () => {
    it('returns synchronized Transverse and Axial projections with shadow cones and nodal loops', () => {
      const testDate = new Date(Date.UTC(2024, 3, 8, 18, 17, 0)); // Great American Eclipse Apr 8 2024
      const result = useEclipseScene({
        date: testDate,
        timeOfDay: 18.283,
        latitude: 47.06,
        longitude: -122.81
      });

      expect(result.julianDate).toBeDefined();
      expect(result.eclipse).toBeDefined();
      expect(result.eclipse.isEclipseActive).toBe(true);
      expect(result.eclipse.type).toBe('TOTAL_SOLAR');

      // Transverse Profile Checks
      expect(result.transverseProfile.sun.x).toBe(50);
      expect(result.transverseProfile.earth.x).toBe(310);
      expect(result.transverseProfile.earth.y).toBe(110);
      expect(result.transverseProfile.umbraCone.length).toBeGreaterThan(0);
      expect(result.transverseProfile.penumbraCone.length).toBeGreaterThan(0);
      expect(result.transverseProfile.orbitalSegments.length).toBe(4);
      expect(result.transverseProfile.ascendingNode).toBeDefined();
      expect(result.transverseProfile.descendingNode).toBeDefined();
      expect(result.transverseProjected.elements.lunarOrbitSegments).toBeDefined();

      // Axial Sightline Checks
      expect(result.axialSightline.sun.x).toBe(260);
      expect(result.axialSightline.earth.x).toBe(260);
      expect(result.axialSightline.earth.y).toBe(110);
      expect(result.axialSightline.orbitalSegments.length).toBe(4);
      expect(result.axialSightline.ascendingNode).toBeDefined();
      expect(result.axialSightline.ascendingNode.y).toBe(110);
      expect(result.axialSightline.descendingNode).toBeDefined();
      expect(result.axialSightline.descendingNode.y).toBe(110);
      expect(result.axialProjected.elements.lunarOrbitSegments).toBeDefined();
    });

    it('accurately detects Blood Moon total lunar eclipse (Mar 14, 2025)', () => {
      const testDate = new Date(Date.UTC(2025, 2, 14, 6, 58, 0));
      const result = useEclipseScene({
        date: testDate,
        timeOfDay: 6.967
      });

      expect(result.eclipse.category).toBe('LUNAR');
      expect(result.eclipse.isEclipseActive).toBe(true);
      expect(result.eclipse.type).toBe('TOTAL_LUNAR');
      expect(result.eclipse.obscuration).toBe(100);
    });
  });

  describe('4. Sub-Hook: useArmillaryScene', () => {
    it('projects 3D celestial coordinates through Euler camera angles and supplies subsolar vector', () => {
      const testDate = new Date(Date.UTC(2026, 2, 20, 12, 0, 0)); // March Equinox
      const result = useArmillaryScene({
        date: testDate,
        pitch: 35,
        yaw: 45,
        roll: 0,
        radius: 100
      });

      expect(result.julianDate).toBeDefined();
      expect(result.scene3D).toBeDefined();
      expect(result.projected2D).toBeDefined();
      expect(result.earth.screenPos).toBeDefined();
      expect(result.sun.screenPos).toBeDefined();
      expect(result.moon.screenPos).toBeDefined();
      expect(result.milestones.length).toBe(6);
      expect(result.subsolarVector).toBeDefined();
      expect(result.cameraTilt.pitch).toBe(35);
      expect(result.cameraTilt.yaw).toBe(45);
    });

    it('updates projected screen positions when camera pitch and yaw change', () => {
      const testDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
      const res0 = useArmillaryScene({ date: testDate, pitch: 0, yaw: 0 });
      const res90 = useArmillaryScene({ date: testDate, pitch: 90, yaw: 0 });

      expect(res0.cameraTilt.pitch).toBe(0);
      expect(res90.cameraTilt.pitch).toBe(90);
      expect(res0.projected2D.elements.earth.axialTiltAngle2D).not.toBe(
        res90.projected2D.elements.earth.axialTiltAngle2D
      );
    });
  });
});
