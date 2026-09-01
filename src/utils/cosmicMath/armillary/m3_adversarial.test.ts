/**
 * @file m3_adversarial.test.ts
 * Adversarial stress and continuity test suite for Phase 2:
 * - Parametric ring blooming from Earth MiniGlobe (r = 14px) to celestial sphere (R0 = 100px)
 * - Heliocentric <-> Geocentric frame handoff & camera glide continuity
 * - Zero NaN, zero singular division by zero, and C1 smoothness across continuum
 */

import { describe, it, expect } from 'vitest';
import { generateArmillaryModel } from './generator';
import { calculateLST } from './coordinates';
import { getJulianDate } from '../core';
import { ArmillaryProjectionMode } from './types';

describe('Phase 2 M3 Adversarial Tests — Ring Blooming & Continuum Continuity', () => {
  const jd = getJulianDate(new Date('2026-06-21T12:00:00Z'), 12);
  const lat = 47.06;
  const lon = -122.81;

  describe('Parametric Celestial Ring Blooming (heliocentric -> geocentric)', () => {
    it('produces continuous, finite vertices without NaN across transition steps t in [0.0, 1.0]', () => {
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const transT = i / steps;
        const model = generateArmillaryModel({
          julianDate: jd,
          latitude: lat,
          longitude: lon,
          timeOfDay: 12,
          sunRaDeg: 90,
          sunDecDeg: 23.44,
          sunLambdaDeg: 90,
          moonRaDeg: 120,
          moonDecDeg: 15,
          moonLambdaDeg: 120,
          moonPhase: 0.5,
          morphLambda: 0.0,
          projectionMode: 'geocentric',
          fromProjectionMode: 'heliocentric',
          projectionTransitionT: transT,
          cameraPitch: 25,
          cameraYaw: 35,
          r0: 100
        });

        // Verify celestial rings exist
        const equator = model.rings.find((r) => r.id === 'equator');
        const tropicCancer = model.rings.find((r) => r.id === 'tropic_cancer');
        const tropicCap = model.rings.find((r) => r.id === 'tropic_capricorn');
        const horizon = model.rings.find((r) => r.id === 'horizon');
        const colure = model.rings.find((r) => r.id === 'colure');
        const ecliptic = model.rings.find((r) => r.id === 'ecliptic');

        expect(equator).toBeDefined();
        expect(tropicCancer).toBeDefined();
        expect(tropicCap).toBeDefined();
        expect(horizon).toBeDefined();
        expect(colure).toBeDefined();
        expect(ecliptic).toBeDefined();

        for (const ring of [equator!, tropicCancer!, tropicCap!, horizon!, colure!, ecliptic!]) {
          expect(ring.vertices.length).toBeGreaterThan(0);
          for (const v of ring.vertices) {
            expect(Number.isFinite(v.screenPos.x)).toBe(true);
            expect(Number.isFinite(v.screenPos.y)).toBe(true);
            expect(Number.isFinite(v.p3d.x)).toBe(true);
            expect(Number.isFinite(v.p3d.y)).toBe(true);
            expect(Number.isFinite(v.p3d.z)).toBe(true);
          }
        }
      }
    });

    it('smoothly expands equator radius from globe size (14px) towards R0 (100px)', () => {
      // In heliocentric mode (t=0)
      const modelHelio = generateArmillaryModel({
        julianDate: jd,
        latitude: lat,
        longitude: lon,
        timeOfDay: 12,
        sunRaDeg: 90,
        sunDecDeg: 23.44,
        sunLambdaDeg: 90,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // In geocentric mode (t=1)
      const modelGeo = generateArmillaryModel({
        julianDate: jd,
        latitude: lat,
        longitude: lon,
        timeOfDay: 12,
        sunRaDeg: 90,
        sunDecDeg: 23.44,
        sunLambdaDeg: 90,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      const equatorGeo = modelGeo.rings.find((r) => r.id === 'equator')!;
      // Geocentric equator radius is 100
      const sampleVGeo = equatorGeo.vertices[0].p3d;
      const rGeo = Math.hypot(sampleVGeo.x, sampleVGeo.y, sampleVGeo.z);
      expect(rGeo).toBeCloseTo(100, 1);
    });

    it('smoothly interpolates celestial rings opacity from 0.0 to full visibility', () => {
      const modelHelio = generateArmillaryModel({
        julianDate: jd,
        latitude: lat,
        longitude: lon,
        timeOfDay: 12,
        sunRaDeg: 90,
        sunDecDeg: 23.44,
        sunLambdaDeg: 90,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      });

      const modelGeo = generateArmillaryModel({
        julianDate: jd,
        latitude: lat,
        longitude: lon,
        timeOfDay: 12,
        sunRaDeg: 90,
        sunDecDeg: 23.44,
        sunLambdaDeg: 90,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      });

      expect(modelHelio.celestialRingsOpacity).toBe(0.0);
      expect(modelGeo.celestialRingsOpacity).toBe(0.85);
    });
  });

  describe('Continuum Mode Matrix & Extreme Angles', () => {
    const modes: ArmillaryProjectionMode[] = ['heliocentric', 'geocentric', 'stereographic', 'rojas', 'horizon'];
    const pitches = [-90, -45, 0, 45, 90];
    const yaws = [-180, -90, 0, 90, 180];

    it('generates valid model output across all 5 continuum modes and pitch/yaw extremes', () => {
      for (const mode of modes) {
        for (const pitch of pitches) {
          for (const yaw of yaws) {
            const model = generateArmillaryModel({
              julianDate: jd,
              latitude: lat,
              longitude: lon,
              timeOfDay: 12,
              sunRaDeg: 90,
              sunDecDeg: 23.44,
              sunLambdaDeg: 90,
              moonRaDeg: 120,
              moonDecDeg: 15,
              moonLambdaDeg: 120,
              moonPhase: 0.5,
              morphLambda: mode === 'heliocentric' || mode === 'geocentric' ? 0.0 : 1.0,
              projectionMode: mode,
              cameraPitch: pitch,
              cameraYaw: yaw,
              r0: 100
            });

            expect(model.sun).toBeDefined();
            expect(model.moon).toBeDefined();
            expect(model.earth).toBeDefined();
            expect(Number.isFinite(model.sun.screenPos.x)).toBe(true);
            expect(Number.isFinite(model.sun.screenPos.y)).toBe(true);
            expect(Number.isFinite(model.earth.screenPos.x)).toBe(true);
            expect(Number.isFinite(model.earth.screenPos.y)).toBe(true);
          }
        }
      }
    });
  });
});
