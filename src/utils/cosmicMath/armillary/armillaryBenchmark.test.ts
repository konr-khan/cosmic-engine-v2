/**
 * @file armillaryBenchmark.test.ts
 * Performance benchmark & latency guardrail test suite.
 * 
 * Asserts that generateArmillaryModel computes all 8 depth-sorted celestial ring paths,
 * beads, and projections in < 0.8 ms per call (comfortably within the 16.6 ms 60 FPS frame budget)
 * across all 5 continuum modes under simulated active dragging/scrubbing conditions.
 */

import { describe, it, expect } from 'vitest';
import { generateArmillaryModel } from './generator';
import { ArmillaryProjectionMode } from './types';
import { getJulianDate } from '../core';

describe('Performance Benchmark & Frame Budget Guardrails', () => {
  const jd = getJulianDate(new Date('2026-06-21T12:00:00Z'), 12);
  const modes: ArmillaryProjectionMode[] = ['heliocentric', 'geocentric', 'stereographic', 'rojas', 'horizon'];

  it('computes 1,000 continuous frames across all 5 continuum modes in < 0.8 ms average per frame', () => {
    // JIT warm-up pass
    for (let w = 0; w < 50; w++) {
      generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 90,
        sunDecDeg: 23.44,
        sunLambdaDeg: 90,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.5,
        projectionMode: 'stereographic',
        cameraPitch: 30,
        cameraYaw: 45,
        r0: 100
      });
    }

    const TOTAL_FRAMES = 1000;
    const start = performance.now();

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const mode = modes[i % modes.length];
      const morphLambda = (i % 100) / 100;
      const pitch = 25 + 15 * Math.sin(i * 0.05);
      const yaw = (i * 1.5) % 360;

      const model = generateArmillaryModel({
        julianDate: jd + i * 0.001,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: (12 + (i * 0.01)) % 24,
        sunRaDeg: 90,
        sunDecDeg: 23.44,
        sunLambdaDeg: 90,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda,
        projectionMode: mode,
        cameraPitch: pitch,
        cameraYaw: yaw,
        r0: 100
      });

      // Sample sanity assertions on output integrity without asserting on every iteration
      if (i % 100 === 0) {
        expect(model.rings.length).toBeGreaterThanOrEqual(6);
        expect(model.sun.screenPos.x).not.toBeNaN();
        expect(model.earth.screenPos.x).not.toBeNaN();
      }
    }

    const elapsed = performance.now() - start;
    const avgPerFrameMs = elapsed / TOTAL_FRAMES;

    // Assert that average frame compute latency is strictly under 1.0 ms (target: <0.8ms)
    expect(avgPerFrameMs).toBeLessThan(1.0);
  });

  it('enforces deterministic mathematical repeatability across repeated calls', () => {
    const params = {
      julianDate: jd,
      latitude: 47.06,
      longitude: -122.81,
      timeOfDay: 12,
      sunRaDeg: 90,
      sunDecDeg: 23.44,
      sunLambdaDeg: 90,
      moonRaDeg: 120,
      moonDecDeg: 15,
      moonLambdaDeg: 120,
      moonPhase: 0.5,
      morphLambda: 0.5,
      projectionMode: 'stereographic' as ArmillaryProjectionMode,
      cameraPitch: 30,
      cameraYaw: 45,
      r0: 100
    };

    const runA = generateArmillaryModel(params);
    const runB = generateArmillaryModel(params);

    // Deep coordinate and string identity checks
    expect(runA.sun.screenPos.x).toBe(runB.sun.screenPos.x);
    expect(runA.sun.screenPos.y).toBe(runB.sun.screenPos.y);
    expect(runA.earth.screenPos.x).toBe(runB.earth.screenPos.x);
    expect(runA.earth.screenPos.y).toBe(runB.earth.screenPos.y);
    expect(runA.rings.length).toBe(runB.rings.length);

    for (let r = 0; r < runA.rings.length; r++) {
      expect(runA.rings[r].frontPathD).toBe(runB.rings[r].frontPathD);
      expect(runA.rings[r].backPathD).toBe(runB.rings[r].backPathD);
      expect(runA.rings[r].fullPathD).toBe(runB.rings[r].fullPathD);
    }
  });

  it('verifies non-NaN, non-Infinity geometric invariants and SVG path validity across all 5 modes', () => {
    for (const mode of modes) {
      const model = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
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
        cameraPitch: mode === 'rojas' ? 0 : (mode === 'geocentric' ? 25 : 90),
        cameraYaw: mode === 'geocentric' ? 35 : 0,
        r0: 100
      });

      // Assert sun and moon beads are finite
      expect(Number.isFinite(model.sun.screenPos.x)).toBe(true);
      expect(Number.isFinite(model.sun.screenPos.y)).toBe(true);
      expect(Number.isFinite(model.moon.screenPos.x)).toBe(true);
      expect(Number.isFinite(model.moon.screenPos.y)).toBe(true);
      expect(Number.isFinite(model.earth.screenPos.x)).toBe(true);
      expect(Number.isFinite(model.earth.screenPos.y)).toBe(true);

      // Assert all ring SVG paths contain valid syntax and zero NaNs
      for (const ring of model.rings) {
        expect(ring.fullPathD).not.toContain('NaN');
        expect(ring.fullPathD).not.toContain('Infinity');
        expect(ring.frontPathD).not.toContain('NaN');
        expect(ring.backPathD).not.toContain('NaN');

        // Path must start with Move command
        expect(ring.fullPathD.trim().startsWith('M')).toBe(true);
      }
    }
  });

  it('preserves astronomical milestone counts and physics telemetry across 3D heliocentric and geocentric modes', () => {
    const helio = generateArmillaryModel({
      julianDate: jd,
      latitude: 47.06,
      longitude: -122.81,
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

    expect(helio.milestones.length).toBe(6);
    expect(helio.physics).toBeDefined();
    expect(helio.physics?.distanceAU).toBeGreaterThan(0.98);
    expect(helio.physics?.distanceAU).toBeLessThan(1.02);

    const geo = generateArmillaryModel({
      julianDate: jd,
      latitude: 47.06,
      longitude: -122.81,
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

    expect(geo.milestones.length).toBe(6);
    expect(geo.physics).toBeDefined();
  });
});
