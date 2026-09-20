/**
 * @file armillary.test.ts
 * Domain test suite for Gyro-Morph Armillary & Astrolabe mathematical engine, coordinate conversions, and plate projections.
 */

import { describe, it, expect } from 'vitest';
import {
  equatorialToCartesian3D,
  cartesian3DToEquatorial,
  horizontalToCartesian3D,
  equatorialToHorizontal,
  projectStereographicConformal,
  projectRojasOrthographic,
  projectTopocentricHorizon,
  calculateAlmucantarCircle,
  generateAlmucantars,
  generateContinuousAlmucantars,
  calculatePlanetaryHour,
  generateArmillaryModel,
  computeRawModeGeometry,
  computeArmillaryLunarNodes,
  computeProjection2D,
  computeContinuousProjection2D,
  calculateReteAngleToLST,
  generateProjectionFocalBeacon,
  calculateAlidadeSighting,
  rotateEuler3D
} from './index';
import { ASTROLABE_STARS, ZODIAC_SIGNS } from './constants';
import { ArmillaryProjectionMode } from './types';
import { clamp, calculateGMST, calculateLST } from '../core';
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG } from '../astroConstants';
import { Vector2D, Vector3D, Degrees, Latitude, Longitude, HoursDecimal } from '../../../types';

describe('Gyro-Morph Armillary & Astrolabe Mathematical Engine', () => {
    it('calculates accurate GMST and Local Sidereal Time (LST)', () => {
      const gmstEpoch = calculateGMST(2451545.0); // Epoch J2000.0 (Jan 1, 2000 12h TT)
      expect(gmstEpoch).toBeCloseTo(280.46, 1);

      const lstOlympia = calculateLST(2451545.0, -122.81);
      expect(lstOlympia).toBeGreaterThanOrEqual(0);
      expect(lstOlympia).toBeLessThan(360);
      expect(lstOlympia).toBeCloseTo((280.4606 - 122.81 + 360) % 360, 1);
    });

    it('transforms equatorial coordinates to 3D Cartesian coordinates and back (+X Vernal Equinox)', () => {
      // North Pole (RA = 0, Dec = 90) -> (0, 100, 0)
      const pNorthPole = equatorialToCartesian3D(0, 90, 100);
      expect(pNorthPole.x).toBeCloseTo(0);
      expect(pNorthPole.y).toBeCloseTo(100);
      expect(pNorthPole.z).toBeCloseTo(0);

      const eqBack = cartesian3DToEquatorial(pNorthPole);
      expect(eqBack.decDeg).toBeCloseTo(90);

      // Vernal Equinox (RA = 0, Dec = 0) -> (+X: 100, 0, 0)
      const pEquinox = equatorialToCartesian3D(0, 0, 100);
      expect(pEquinox.x).toBeCloseTo(100);
      expect(pEquinox.y).toBeCloseTo(0);
      expect(pEquinox.z).toBeCloseTo(0);

      const eqBack2 = cartesian3DToEquatorial(pEquinox);
      expect(eqBack2.raDeg).toBeCloseTo(0);
      expect(eqBack2.decDeg).toBeCloseTo(0);

      // RA = 90°, Dec = 0° -> (+Z: 0, 0, 100)
      const pRA90 = equatorialToCartesian3D(90, 0, 100);
      expect(pRA90.x).toBeCloseTo(0);
      expect(pRA90.y).toBeCloseTo(0);
      expect(pRA90.z).toBeCloseTo(100);

      const eqBack3 = cartesian3DToEquatorial(pRA90);
      expect(eqBack3.raDeg).toBeCloseTo(90);
      expect(eqBack3.decDeg).toBeCloseTo(0);
    });

    it('projects stereographic conformal coordinates preserving equator, circles, and singularity bounds', () => {
      // Equator point at Vernal Equinox (100, 0, 0) -> (100, 0)
      const pEq = { x: 100, y: 0, z: 0 };
      const projEq = projectStereographicConformal(pEq, 100);
      expect(projEq.x).toBeCloseTo(100);
      expect(projEq.y).toBeCloseTo(0);

      // Equator point at RA = 90 (0, 0, 100) -> (0, 100)
      const pEq90 = { x: 0, y: 0, z: 100 };
      const projEq90 = projectStereographicConformal(pEq90, 100);
      expect(projEq90.x).toBeCloseTo(0);
      expect(projEq90.y).toBeCloseTo(100);

      // North Pole (0, 100, 0) -> (0, 0)
      const pNP = { x: 0, y: 100, z: 0 };
      const projNP = projectStereographicConformal(pNP, 100);
      expect(projNP.x).toBeCloseTo(0);
      expect(projNP.y).toBeCloseTo(0);

      // South Celestial Pole singularity guard (y -> -100)
      const pSP = { x: 10, y: -100, z: 10 };
      const projSP = projectStereographicConformal(pSP, 100);
      expect(Number.isFinite(projSP.x)).toBe(true);
      expect(Number.isFinite(projSP.y)).toBe(true);
      expect(Math.abs(projSP.x)).toBeLessThanOrEqual(1000);
      expect(Math.abs(projSP.y)).toBeLessThanOrEqual(1000);
    });

    it('projects universal Rojas orthographic coordinates', () => {
      const p = { x: 50, y: 80, z: 30 };
      const rojas = projectRojasOrthographic(p, 100);
      expect(rojas.x).toBe(50);
      expect(rojas.y).toBe(80);
    });

    it('projects topocentric horizon stereonet coordinates', () => {
      // Zenith (Alt = 90) -> (0, 0)
      const zen = projectTopocentricHorizon(90, 0, 100);
      expect(zen.x).toBeCloseTo(0);
      expect(zen.y).toBeCloseTo(0);

      // Horizon North (Alt = 0, Az = 0) -> (0, -100)
      const horizN = projectTopocentricHorizon(0, 0, 100);
      expect(horizN.x).toBeCloseTo(0);
      expect(horizN.y).toBeCloseTo(-100);

      // Horizon East (Alt = 0, Az = 90) -> (100, 0)
      const horizE = projectTopocentricHorizon(0, 90, 100);
      expect(horizE.x).toBeCloseTo(100);
      expect(horizE.y).toBeCloseTo(0);
    });

    it('computes topocentric horizontal coordinates via 2-argument atan2', () => {
      // Meridian transit due South: lat = 45, dec = 0, lst = 0, ra = 0 -> alt = 45, az = 180 (South)
      const southTransit = equatorialToHorizontal(0, 0, 45, 0);
      expect(southTransit.altDeg).toBeCloseTo(45, 1);
      expect(southTransit.azDeg).toBeCloseTo(180, 1);

      // North Star: lat = 47.06, dec = 90, lst = 0, ra = 0 -> alt = 47.06, az = 0 (North)
      const polaris = equatorialToHorizontal(0, 90, 47.06, 0);
      expect(polaris.altDeg).toBeCloseTo(47.06, 1);
      expect(polaris.azDeg).toBeCloseTo(0, 1);
    });

    it('calculates analytical Almucantar elevation circles for astrolabe tympan', () => {
      const horizon = calculateAlmucantarCircle(0, 45, 100);
      expect(horizon.isHorizon).toBe(true);
      expect(horizon.centerY).toBeCloseTo(100); // 100 * cot(45) = 100
      expect(horizon.radius).toBeCloseTo(141.42, 1); // 100 * csc(45) = 141.42

      const almucantars = generateAlmucantars(47.06, 15, 100);
      expect(almucantars.length).toBeGreaterThanOrEqual(6);
      expect(almucantars[0].altitude).toBe(0);

      // Continuous Almucantar interpolation between stereographic (eccentric) and horizon (concentric)
      const stereoAlm = generateContinuousAlmucantars(47.06, 'stereographic', undefined, 1.0, 15, 100);
      const horizonAlm = generateContinuousAlmucantars(47.06, 'horizon', undefined, 1.0, 15, 100);
      const midAlm = generateContinuousAlmucantars(47.06, 'horizon', 'stereographic', 0.5, 15, 100);

      expect(stereoAlm.length).toBe(horizonAlm.length);
      expect(horizonAlm.every(a => a.centerY === 0)).toBe(true); // Horizon is strictly concentric
      expect(midAlm[0].centerY).toBeCloseTo(stereoAlm[0].centerY * 0.5, 1);
    });

    it('calculates historical unequal planetary hours and Chaldean ruler', () => {
      const midMorningHour = calculatePlanetaryHour(11.5, 6, 18, 0); // 11:30 AM (6th hour of day)
      expect(midMorningHour.isDay).toBe(true);
      expect(midMorningHour.hourNumber).toBe(6);
      expect(midMorningHour.rulingPlanet).toBeDefined();

      const noonHour = calculatePlanetaryHour(12, 6, 18, 0); // 12:00 PM (starts 7th hour of day)
      expect(noonHour.isDay).toBe(true);
      expect(noonHour.hourNumber).toBe(7);

      const midnightHour = calculatePlanetaryHour(0, 6, 18, 0); // Midnight (starts 7th hour of night)
      expect(midnightHour.isDay).toBe(false);
      expect(midnightHour.hourNumber).toBe(7);
    });

    it('contains all 12 classical astrolabe navigational stars and 12 zodiac signs', () => {
      expect(ASTROLABE_STARS.length).toBe(12);
      expect(ASTROLABE_STARS.some(s => s.name === 'Sirius')).toBe(true);
      expect(ASTROLABE_STARS.some(s => s.name === 'Vega')).toBe(true);
      expect(ASTROLABE_STARS.some(s => s.name === 'Arcturus')).toBe(true);

      expect(ZODIAC_SIGNS.length).toBe(12);
      expect(ZODIAC_SIGNS[0].name).toBe('Aries');
      expect(ZODIAC_SIGNS[11].name).toBe('Pisces');
    });

    it('derives raw mode geometry and lunar nodes via decomposed sub-generators', () => {
      const geomParams = {
        r0: 100,
        obliquity: 23.439,
        sunLambdaDeg: 90,
        moonLambdaDeg: 180,
        moonRaDeg: 180,
        moonDecDeg: 0,
        exaggerateEccentricity: false,
        reteOffset: 0,
        lambdaClamp: 0
      };

      const helioGeom = computeRawModeGeometry('heliocentric', geomParams);
      expect(helioGeom.celestialRingsOpacity).toBe(0.0);
      expect(helioGeom.orbitRingOpacity).toBe(1.0);
      expect(helioGeom.milestones3D.length).toBe(6);

      const geoGeom = computeRawModeGeometry('geocentric', geomParams);
      expect(geoGeom.celestialRingsOpacity).toBe(0.85);
      expect(geoGeom.earth3D).toEqual({ x: 0, y: 0, z: 0 });

      const stereoGeom = computeRawModeGeometry('stereographic', { ...geomParams, lambdaClamp: 1.0 });
      expect(stereoGeom.celestialRingsOpacity).toBe(1.0);
      expect(stereoGeom.bezelOpacity).toBe(1.0);

      const dummyVertex = (p: Vector3D) => ({
        p3d: p,
        pCam: p,
        pProj: { x: p.x, y: p.y },
        screenPos: { x: p.x, y: p.y },
        isFront: true
      });
      const nodes = computeArmillaryLunarNodes({
        isHelioMode: true,
        blendedEarth3D: { x: 100, y: 0, z: 0 },
        transformVertex: dummyVertex
      });
      expect(nodes.ascendingNode.screenPos.x).toBe(116);
      expect(nodes.descendingNode.screenPos.x).toBe(84);
    });

    it('generates full dynamic Gyro-Morph Armillary Model across 3D and 2D morph factors', () => {
      const jd = 2451545.0;
      const model3D = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0, // 3D Armillary
        projectionMode: 'stereographic',
        cameraPitch: 25,
        cameraYaw: 45,
        r0: 100
      });

      expect(model3D.rings.length).toBe(8);
      expect(model3D.stars.length).toBe(12);
      expect(model3D.sun.screenPos).toBeDefined();
      expect(model3D.moon.screenPos).toBeDefined();
      expect(model3D.planetaryHour.label).toBeDefined();

      const model2D = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0, // 2D Stereographic Plate
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      expect(model2D.rings.length).toBe(8);
      expect(model2D.stars.length).toBe(12);
      // In 2D stereographic, equator is a 100px radius circle
      const eqRing = model2D.rings.find(r => r.id === 'equator');
      expect(eqRing).toBeDefined();
    });

    it('interpolates dynamically between two 2D projections during cross-morph transitions', () => {
      const jd = 2451545.0;
      const p3d = { x: 50, y: 30, z: 80 };
      const stereo2D = computeProjection2D(p3d, 'stereographic', 100, 47.06, 0);
      const rojas2D = computeProjection2D(p3d, 'rojas', 100, 47.06, 0);

      // Verify continuous projection endpoints & zero endpoint snapping (t -> 1.0-)
      const projStart = computeContinuousProjection2D(p3d, 'stereographic', 'rojas', 0.0, 100, 47.06, 0);
      const projNearEnd = computeContinuousProjection2D(p3d, 'stereographic', 'rojas', 0.999, 100, 47.06, 0);
      const projEnd = computeContinuousProjection2D(p3d, 'stereographic', 'rojas', 1.0, 100, 47.06, 0);
      expect(projStart.x).toBeCloseTo(stereo2D.x, 3);
      expect(projStart.y).toBeCloseTo(stereo2D.y, 3);
      expect(projNearEnd.x).toBeCloseTo(rojas2D.x, 0);
      expect(projNearEnd.y).toBeCloseTo(rojas2D.y, 0);
      expect(projEnd.x).toBeCloseTo(rojas2D.x, 3);
      expect(projEnd.y).toBeCloseTo(rojas2D.y, 3);

      // Verify smooth intermediate projection & zero endpoint snap between stereographic and horizon
      const horizon2D = computeProjection2D(p3d, 'horizon', 100, 47.06, 0);

      // Stereographic -> Horizon
      const projStereoStart = computeContinuousProjection2D(p3d, 'stereographic', 'horizon', 0.0, 100, 47.06, 0);
      const projStereoMid = computeContinuousProjection2D(p3d, 'stereographic', 'horizon', 0.5, 100, 47.06, 0);
      const projStereoNearEnd = computeContinuousProjection2D(p3d, 'stereographic', 'horizon', 0.999, 100, 47.06, 0);
      const projStereoEnd = computeContinuousProjection2D(p3d, 'stereographic', 'horizon', 1.0, 100, 47.06, 0);

      expect(projStereoStart.x).toBeCloseTo(stereo2D.x, 3);
      expect(projStereoStart.y).toBeCloseTo(stereo2D.y, 3);
      expect(typeof projStereoMid.x).toBe('number');
      expect(typeof projStereoMid.y).toBe('number');
      expect(projStereoNearEnd.x).toBeCloseTo(horizon2D.x, 1);
      expect(projStereoNearEnd.y).toBeCloseTo(horizon2D.y, 1);
      expect(projStereoEnd.x).toBeCloseTo(horizon2D.x, 3);
      expect(projStereoEnd.y).toBeCloseTo(horizon2D.y, 3);

      // Horizon -> Stereographic (Zero 90° snap at t -> 1.0)
      const projHorizonStart = computeContinuousProjection2D(p3d, 'horizon', 'stereographic', 0.0, 100, 47.06, 0);
      const projHorizonNearEnd = computeContinuousProjection2D(p3d, 'horizon', 'stereographic', 0.999, 100, 47.06, 0);
      const projHorizonEnd = computeContinuousProjection2D(p3d, 'horizon', 'stereographic', 1.0, 100, 47.06, 0);

      expect(projHorizonStart.x).toBeCloseTo(horizon2D.x, 3);
      expect(projHorizonStart.y).toBeCloseTo(horizon2D.y, 3);
      expect(projHorizonNearEnd.x).toBeCloseTo(stereo2D.x, 1);
      expect(projHorizonNearEnd.y).toBeCloseTo(stereo2D.y, 1);
      expect(projHorizonEnd.x).toBeCloseTo(stereo2D.x, 3);
      expect(projHorizonEnd.y).toBeCloseTo(stereo2D.y, 3);

      // Halfway transition between stereographic and rojas
      const modelCross = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0, // Full 2D
        projectionMode: 'rojas',
        fromProjectionMode: 'stereographic',
        projectionTransitionT: 0.5, // 50% transition
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      expect(modelCross.rings.length).toBe(8);
      const eqVertex = modelCross.rings[0].vertices[0];
      expect(eqVertex.screenPos).toBeDefined();
      expect(typeof eqVertex.screenPos.x).toBe('number');
      expect(typeof eqVertex.screenPos.y).toBe('number');

      // Verify lunar orbit ring is generated
      const lunarOrbit = modelCross.rings.find((r) => r.id === 'lunar_orbit');
      expect(lunarOrbit).toBeDefined();
      expect(lunarOrbit?.label).toContain('Lunar Orbit');

      // Verify muted palette for Tropic rings
      const cancerRing = modelCross.rings.find((r) => r.id === 'tropic_cancer');
      const capricornRing = modelCross.rings.find((r) => r.id === 'tropic_capricorn');
      expect(cancerRing?.color).toBe('#d97706'); // Muted Antique Brass
      expect(capricornRing?.color).toBe('#94a3b8'); // Muted Slate
    });

    it('generates topocentric observer FOV sky cone and lunar nodes in orbital modes', () => {
      const helioModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
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

      // Observer FOV Sky Cone
      expect(helioModel.observerCone).toBeDefined();
      expect(helioModel.observerCone?.observerScreenPos).toBeDefined();
      expect(helioModel.observerCone?.zenithScreenPos).toBeDefined();
      expect(helioModel.observerCone?.horizonDiscPathD).toMatch(/^M\s.+Z$/);
      expect(helioModel.observerCone?.conePathD).toMatch(/^M\s.+Z$/);
      expect(typeof helioModel.observerCone?.sunElevationDeg).toBe('number');
      expect(typeof helioModel.observerCone?.isDaytime).toBe('boolean');

      // Lunar Nodes (Ascending & Descending)
      expect(helioModel.lunarNodes).toBeDefined();
      expect(helioModel.lunarNodes?.ascendingNode.screenPos).toBeDefined();
      expect(helioModel.lunarNodes?.descendingNode.screenPos).toBeDefined();
    });

    it('solves apparent local sidereal and solar time from free Rete angles', () => {
      // Sun at RA 180°
      const noon = calculateReteAngleToLST(180, 180);
      expect(noon.apparentLSTDeg).toBe(180);
      expect(noon.apparentSolarHours).toBe(12);

      // Sun at RA 180°, Rete rotated to 270° (6 hours later -> 18:00)
      const dusk = calculateReteAngleToLST(270, 180);
      expect(dusk.apparentLSTDeg).toBe(270);
      expect(dusk.apparentSolarHours).toBe(18);
    });

    it('generates volumetric projection focal beacons and laser ray paths', () => {
      const beaconStereo = generateProjectionFocalBeacon('stereographic', 100, 25, 35, 0.0);
      expect(beaconStereo.focal3D.y).toBe(-100);
      expect(beaconStereo.laserRays.length).toBe(8);
      expect(beaconStereo.conePathD).toContain('M ');
      expect(beaconStereo.laserRays[0].start).toBeDefined();
      expect(beaconStereo.laserRays[0].end).toBeDefined();

      const beaconRojas = generateProjectionFocalBeacon('rojas', 100, 0, 0, 1.0);
      expect(beaconRojas.focal3D.z).toBe(150);
      expect(beaconRojas.laserRays.length).toBe(8);
    });

    it('calculates Alidade sighting coordinates and target detection', () => {
      const testStars = [
        { name: 'Sirius', screenPos: { x: 0, y: -80 }, altDeg: 35, azDeg: 180, magnitude: -1.46, raDeg: 101, decDeg: -16.7 }
      ];
      const testSun = { screenPos: { x: 80, y: 0 }, altDeg: 45, azDeg: 90, raDeg: 0, decDeg: 0 };
      const testMoon = { screenPos: { x: -80, y: 0 }, altDeg: 10, azDeg: 270, raDeg: 180, decDeg: 0 };

      // Sighting arm pointing North (0°)
      const sighting = calculateAlidadeSighting(0, 47.06, 100, testStars, testSun, testMoon);
      expect(sighting.ruleAngleDeg).toBe(0);
      expect(sighting.rightAscensionDeg).toBe(0);
      expect(sighting.rightAscensionHours).toBe(0);
      expect(typeof sighting.localAltitudeDeg).toBe('number');
      expect(typeof sighting.localAzimuthDeg).toBe('number');

      // Sighting arm aligned with Sirius at (0, -80) -> angle 0°
      const sightingSirius = calculateAlidadeSighting(0, 47.06, 100, testStars, testSun, testMoon);
      expect(sightingSirius.nearestTarget).toBeDefined();
      expect(sightingSirius.nearestTarget?.name).toBe('Sirius');
    });

    it('supports Free Rete mode in generateArmillaryModel with apparent solar time solver', () => {
      const model = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        isFreeReteMode: true,
        freeReteOffsetDeg: 45
      });

      expect(model.isFreeRete).toBe(true);
      expect(typeof model.apparentSolarHours).toBe('number');
      expect(model.focalBeacon).toBeDefined();
      expect(model.focalBeacon?.laserRays.length).toBe(8);
      // Continuous 360° closed cone polygon
      expect(model.focalBeacon?.conePathD).toMatch(/^M\s.+Z$/);
    });

    it('rotates Ecliptic Rete and Stars when freeReteOffsetDeg is applied', () => {
      const baseModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        isFreeReteMode: false
      });

      const rotatedModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        isFreeReteMode: true,
        freeReteOffsetDeg: 90
      });

      // Sun bead was rotated 90 degrees around center
      expect(rotatedModel.sun.p3d.x).not.toBeCloseTo(baseModel.sun.p3d.x, 1);
      // Star positions rotated
      expect(rotatedModel.stars[0].p3d.x).not.toBeCloseTo(baseModel.stars[0].p3d.x, 1);
    });

    it('generates Heliocentric model with Sun at origin, Earth at Keplerian orbit, and milestone nodes', () => {
      const helioModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
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

      // Sun at origin (0, 0, 0)
      expect(helioModel.sun.p3d.x).toBeCloseTo(0, 2);
      expect(helioModel.sun.p3d.y).toBeCloseTo(0, 2);
      expect(helioModel.sun.p3d.z).toBeCloseTo(0, 2);

      // Earth at non-zero orbital radius
      const earthDist = Math.hypot(helioModel.earth.p3d.x, helioModel.earth.p3d.z);
      expect(earthDist).toBeGreaterThan(90);

      // Orbital path ring present
      const orbitRing = helioModel.rings.find(r => r.id === 'orbit_path');
      expect(orbitRing).toBeDefined();

      // 6 Seasonal milestone nodes present
      expect(helioModel.milestones.length).toBe(6);
      expect(helioModel.milestones[0].label).toBe('Perihelion');
      expect(helioModel.milestones[3].label).toBe('Aphelion');

      // Physics telemetry populated
      expect(helioModel.physics).toBeDefined();
      expect(helioModel.physics?.distanceAU).toBeGreaterThan(0.95);
      expect(helioModel.physics?.orbitalSpeedKms).toBeGreaterThan(28);

      // Opacity contracts
      expect(helioModel.celestialRingsOpacity).toBe(0.0);
      expect(helioModel.orbitRingOpacity).toBe(1.0);
      expect(helioModel.milestonesOpacity).toBe(1.0);
    });

    it('generates Geocentric model with Earth at origin and Sun revolving along apparent Ecliptic loop', () => {
      const geoModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
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

      // Earth at origin (0, 0, 0)
      expect(geoModel.earth.p3d.x).toBeCloseTo(0, 2);
      expect(geoModel.earth.p3d.y).toBeCloseTo(0, 2);
      expect(geoModel.earth.p3d.z).toBeCloseTo(0, 2);

      // Sun revolving around Earth at radius ~ 110px
      const sunDist = Math.hypot(geoModel.sun.p3d.x, geoModel.sun.p3d.y, geoModel.sun.p3d.z);
      expect(sunDist).toBeGreaterThan(90);

      // Opacity contracts in unified Geocentric mode
      expect(geoModel.celestialRingsOpacity).toBeCloseTo(0.85, 2);
      expect(geoModel.orbitRingOpacity).toBe(1.0);
    });

    it('clamps Sun bead strictly to the Ecliptic track across seasons and Rete rotation', () => {
      const sunLambda = 120; // 120° Ecliptic Longitude (Leo/Cancer)
      const obliquity = 23.439;
      const epsRad = (obliquity * Math.PI) / 180;
      const lambdaRad = (sunLambda * Math.PI) / 180;
      const r0 = 100;

      const model = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 122,
        sunDecDeg: 20,
        sunLambdaDeg: sunLambda,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 0,
        cameraYaw: 0,
        r0
      });

      // Theoretical 3D position on Ecliptic circle
      const expectedX = r0 * Math.cos(lambdaRad);
      const expectedY = r0 * Math.sin(lambdaRad) * Math.sin(epsRad);
      const expectedZ = r0 * Math.sin(lambdaRad) * Math.cos(epsRad);

      expect(model.sun.p3d.x).toBeCloseTo(expectedX, 1);
      expect(model.sun.p3d.y).toBeCloseTo(expectedY, 1);
      expect(model.sun.p3d.z).toBeCloseTo(expectedZ, 1);

      // Distance from origin must equal r0
      const dist = Math.hypot(model.sun.p3d.x, model.sun.p3d.y, model.sun.p3d.z);
      expect(dist).toBeCloseTo(r0, 1);
    });

    it('implements staged morph choreography with progressive plate materialization', () => {
      const baseParams = {
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        projectionMode: 'stereographic' as const,
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      };

      // Stage 1: lambda = 0.0 (3D Celestial Sphere, no flat plate decorations)
      const stage0 = generateArmillaryModel({ ...baseParams, morphLambda: 0.0 });
      expect(stage0.bezelOpacity).toBe(0.0);
      expect(stage0.alidadeOpacity).toBe(0.0);
      expect(stage0.celestialRingsOpacity).toBe(1.0);

      // Stage 2: lambda = 0.5 (Mid-morph, bezel and alidade materializing)
      const stageMid = generateArmillaryModel({ ...baseParams, morphLambda: 0.5 });
      expect(stageMid.bezelOpacity).toBeGreaterThan(0.0);
      expect(stageMid.bezelOpacity).toBeLessThan(1.0);

      // Stage 3: lambda = 1.0 (Full 2D plate, full opacity)
      const stageFull = generateArmillaryModel({ ...baseParams, morphLambda: 1.0 });
      expect(stageFull.bezelOpacity).toBe(1.0);
      expect(stageFull.alidadeOpacity).toBe(1.0);
    });

    it('supports full 5-mode continuum seamlessly', () => {
      const modes: Array<'heliocentric' | 'geocentric' | 'stereographic' | 'rojas' | 'horizon'> = [
        'heliocentric',
        'geocentric',
        'stereographic',
        'rojas',
        'horizon'
      ];

      for (const mode of modes) {
        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12,
          sunRaDeg: 280,
          sunDecDeg: -23,
          sunLambdaDeg: 280,
          moonRaDeg: 120,
          moonDecDeg: 15,
          moonLambdaDeg: 120,
          moonPhase: 0.5,
          morphLambda: mode === 'heliocentric' || mode === 'geocentric' ? 0.0 : 1.0,
          projectionMode: mode,
          cameraPitch: 0,
          cameraYaw: 0,
          r0: 100
        });

        expect(model.rings.length).toBeGreaterThan(0);
        expect(model.stars.length).toBe(12);
        expect(model.sun.screenPos).toBeDefined();
        expect(model.moon.screenPos).toBeDefined();
        expect(model.earth.screenPos).toBeDefined();
      }
    });

    it('smoothly interpolates any-to-any transitions between Heliocentric and Stereographic modes', () => {
      const midModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.5,
        fromProjectionMode: 'heliocentric',
        projectionMode: 'stereographic',
        projectionTransitionT: 0.5,
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Opacities are smoothly blended at T = 0.5
      expect(midModel.celestialRingsOpacity).toBeCloseTo(0.5, 2);
      expect(midModel.orbitRingOpacity).toBeCloseTo(0.5, 2);
      expect(midModel.milestonesOpacity).toBeCloseTo(0.5, 2);
    });

    it('smoothly executes symmetric reverse 3D transitions from 2D Stereographic plate to 3D Geocentric', () => {
      // Halfway through Phase B reverse (lambda = 0.725)
      const reverseMid = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.725,
        fromProjectionMode: 'stereographic',
        projectionMode: 'geocentric',
        projectionTransitionT: 0.5,
        cameraPitch: 90,
        cameraYaw: 0,
        r0: 100
      });

      // Opacities blend smoothly between 2D plate and 3D Apparent
      expect(reverseMid.bezelOpacity).toBeGreaterThan(0);
      expect(reverseMid.orbitRingOpacity).toBeCloseTo(0.5, 1);
      expect(reverseMid.milestonesOpacity).toBeCloseTo(0.5, 1);
      expect(reverseMid.rings.length).toBeGreaterThanOrEqual(6);
      expect(reverseMid.sun.screenPos.x).not.toBeNaN();
    });

    it('handles exaggerated eccentricity in Heliocentric mode with Sun displaced to focal point', () => {
      const exagModel = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100,
        exaggerateEccentricity: true
      });

      // Sun is displaced by focal distance c = a * e = 110 * 0.25 = 27.5
      expect(exagModel.sun.p3d.x).toBeLessThan(-20);
    });

    describe('Phase 1: Copernican to Geocentric 3D Translation (Phase A: lambda <= 0.45)', () => {
      const baseHelioParams = {
        julianDate: 2451545.0,
        latitude: 47.06 as Latitude,
        longitude: -122.81 as Longitude,
        timeOfDay: 12 as HoursDecimal,
        sunRaDeg: 280 as Degrees,
        sunDecDeg: -23 as Degrees,
        sunLambdaDeg: 280 as Degrees,
        moonRaDeg: 120 as Degrees,
        moonDecDeg: 15 as Degrees,
        moonLambdaDeg: 120 as Degrees,
        moonPhase: 0.5,
        projectionMode: 'heliocentric' as const,
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      };

      it('validates Earth 3D distance > 100px at lambda = 0.0 and origin (0, 0, 0) within 1e-4 at lambda = 0.45', () => {
        // At morphLambda = 0.0: Pure heliocentric Keplerian orbit (a = r0 * 1.1 = 110px)
        const model0 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 });
        const earthDist0 = Math.hypot(model0.earth.p3d.x, model0.earth.p3d.y, model0.earth.p3d.z);
        expect(earthDist0).toBeGreaterThan(100);

        // At morphLambda = 0.45: Full translation to geocentric celestial origin (0, 0, 0)
        const model45 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.45 });
        expect(Math.abs(model45.earth.p3d.x)).toBeLessThanOrEqual(1e-4);
        expect(Math.abs(model45.earth.p3d.y)).toBeLessThanOrEqual(1e-4);
        expect(Math.abs(model45.earth.p3d.z)).toBeLessThanOrEqual(1e-4);
        const earthDist45 = Math.hypot(model45.earth.p3d.x, model45.earth.p3d.y, model45.earth.p3d.z);
        expect(earthDist45).toBeCloseTo(0, 4);
      });

      it('strictly decreases Earth distance from origin across intermediate frames [0.10, 0.20, 0.35, 0.45] with finite bounds and no NaNs', () => {
        const intermediateLambdas = [0.10, 0.20, 0.35, 0.45];
        let prevDist = Math.hypot(
          generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 }).earth.p3d.x,
          generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 }).earth.p3d.y,
          generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 }).earth.p3d.z
        );

        for (const lambda of intermediateLambdas) {
          const model = generateArmillaryModel({ ...baseHelioParams, morphLambda: lambda });
          const { x, y, z } = model.earth.p3d;

          expect(Number.isFinite(x)).toBe(true);
          expect(Number.isFinite(y)).toBe(true);
          expect(Number.isFinite(z)).toBe(true);
          expect(Number.isNaN(x)).toBe(false);
          expect(Number.isNaN(y)).toBe(false);
          expect(Number.isNaN(z)).toBe(false);

          const dist = Math.hypot(x, y, z);
          expect(dist).toBeLessThan(prevDist);
          expect(dist).toBeGreaterThanOrEqual(0);
          prevDist = dist;
        }
      });

      it('guarantees observerCone is defined across all morphLambda in [0.0, 0.45] and observerScreenPos smoothly translates along with Earth', () => {
        const lambdas = [0.0, 0.10, 0.20, 0.35, 0.45];
        let prevEarthScreenDist = Infinity;
        let prevObsScreenDist = Infinity;

        for (const lambda of lambdas) {
          const model = generateArmillaryModel({ ...baseHelioParams, morphLambda: lambda });

          expect(model.observerCone).toBeDefined();
          const obsCone = model.observerCone!;

          expect(Number.isFinite(obsCone.observerScreenPos.x)).toBe(true);
          expect(Number.isFinite(obsCone.observerScreenPos.y)).toBe(true);
          expect(Number.isNaN(obsCone.observerScreenPos.x)).toBe(false);
          expect(Number.isNaN(obsCone.observerScreenPos.y)).toBe(false);

          // Observer screen position offset from Earth screen position is strictly bounded (radius ~ 4.8px)
          const offsetFromEarth = Math.hypot(
            obsCone.observerScreenPos.x - model.earth.screenPos.x,
            obsCone.observerScreenPos.y - model.earth.screenPos.y
          );
          expect(offsetFromEarth).toBeLessThanOrEqual(5.0);

          // Screen distance from center strictly decreases as Earth translates to origin
          const earthScreenDist = Math.hypot(model.earth.screenPos.x, model.earth.screenPos.y);
          const obsScreenDist = Math.hypot(obsCone.observerScreenPos.x, obsCone.observerScreenPos.y);

          expect(earthScreenDist).toBeLessThan(prevEarthScreenDist);
          expect(obsScreenDist).toBeLessThan(prevObsScreenDist);

          prevEarthScreenDist = earthScreenDist;
          prevObsScreenDist = obsScreenDist;
        }
      });

      it('continuously blends layer opacities, Sun, Moon, and milestone coordinates across Phase A', () => {
        // At lambda = 0.0
        const m0 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 });
        expect(m0.celestialRingsOpacity).toBeCloseTo(0.0, 4);
        expect(m0.starsOpacity).toBeCloseTo(0.25, 4);
        expect(m0.orbitRingOpacity).toBe(1.0);
        expect(m0.lunarOrbitOpacity).toBe(1.0);
        expect(m0.milestonesOpacity).toBe(1.0);

        // At lambda = 0.225 (50% of Phase A)
        const mHalf = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.225 });
        expect(mHalf.celestialRingsOpacity).toBeCloseTo(0.85 * 0.5, 4);
        expect(mHalf.starsOpacity).toBeCloseTo(0.25 + 0.55 * 0.5, 4);
        expect(mHalf.orbitRingOpacity).toBe(1.0);

        // At lambda = 0.45 (100% of Phase A)
        const m45 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.45 });
        expect(m45.celestialRingsOpacity).toBeCloseTo(0.85, 4);
        expect(m45.starsOpacity).toBeCloseTo(0.80, 4);
        expect(m45.orbitRingOpacity).toBe(1.0);

        // Sun at lambda = 0.45 is at apparent Ecliptic radius a = 110px
        const sunDist45 = Math.hypot(m45.sun.p3d.x, m45.sun.p3d.y, m45.sun.p3d.z);
        expect(sunDist45).toBeCloseTo(110, 2);

        // Moon at lambda = 0.45 is at physical geocentric radius 26px
        const moonDist45 = Math.hypot(m45.moon.p3d.x, m45.moon.p3d.y, m45.moon.p3d.z);
        expect(moonDist45).toBeCloseTo(26, 2);

        // All milestones at lambda = 0.45 are at radius a = 110px
        expect(m45.milestones.length).toBe(6);
        for (const node of m45.milestones) {
          const mDist = Math.hypot(node.p3d.x, node.p3d.y, node.p3d.z);
          expect(mDist).toBeCloseTo(110, 2);
        }
      });
    });


    describe('Stereographic Conformal Closed-Form & Invariant Verification (Milestone 1)', () => {
      const EPS_DEG = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);
      const EPS_RAD = (EPS_DEG * Math.PI) / 180;

      // -------------------------------------------------------------------------
      // Test 1: Analytical Closed-Form Stereographic Ecliptic Center and Radius across 360°
      // -------------------------------------------------------------------------
      it('strictly satisfies analytical closed-form stereographic Ecliptic circle center (0, -R0*tan(eps)) and radius R0/cos(eps) across all 360 degrees (< 1e-4 tolerance)', () => {
        const r0 = 100;
        const expectedRadius = r0 / Math.cos(EPS_RAD); // R_ecl = R0 / cos(eps) ~ 108.99581
        const expectedCenterY = -r0 * Math.tan(EPS_RAD); // Y_c = -R0 * tan(eps) ~ -43.35512
        const expectedCenterX = 0;

        // Sample all 360 integer degrees of ecliptic longitude lambda
        for (let deg = 0; deg < 360; deg++) {
          const lambdaRad = (deg * Math.PI) / 180;
          const p3d: Vector3D = {
            x: r0 * Math.cos(lambdaRad),
            y: r0 * Math.sin(lambdaRad) * Math.sin(EPS_RAD),
            z: r0 * Math.sin(lambdaRad) * Math.cos(EPS_RAD)
          };

          const proj = projectStereographicConformal(p3d, r0);

          // In projectStereographicConformal: proj.x = p3d.x * scale, proj.y = p3d.z * scale
          // Center of projected circle in projection plane is (expectedCenterX, expectedCenterY)
          const distFromCenter = Math.hypot(proj.x - expectedCenterX, proj.y - expectedCenterY);

          // Must match analytical radius within 1e-4 relative tolerance
          expect(Math.abs(distFromCenter - expectedRadius)).toBeLessThan(1e-4);
        }

        // Verify exact cardinal points explicitly:
        // 1. Vernal Equinox (lambda = 0°): p3d = (100, 0, 0) -> proj = (100, 0)
        const projVE = projectStereographicConformal({ x: r0, y: 0, z: 0 }, r0);
        expect(projVE.x).toBeCloseTo(r0, 4);
        expect(projVE.y).toBeCloseTo(0, 4);
        expect(Math.hypot(projVE.x - expectedCenterX, projVE.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 2. Summer Solstice (lambda = 90°): p3d = (0, r0*sin(eps), r0*cos(eps)) -> proj = (0, r0*tan((90-eps)/2))
        const projSS = projectStereographicConformal({ x: 0, y: r0 * Math.sin(EPS_RAD), z: r0 * Math.cos(EPS_RAD) }, r0);
        const expectedSSY = r0 * Math.tan((Math.PI / 2 - EPS_RAD) / 2);
        expect(projSS.x).toBeCloseTo(0, 4);
        expect(projSS.y).toBeCloseTo(expectedSSY, 4);
        expect(Math.hypot(projSS.x - expectedCenterX, projSS.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 3. Autumnal Equinox (lambda = 180°): p3d = (-100, 0, 0) -> proj = (-100, 0)
        const projAE = projectStereographicConformal({ x: -r0, y: 0, z: 0 }, r0);
        expect(projAE.x).toBeCloseTo(-r0, 4);
        expect(projAE.y).toBeCloseTo(0, 4);
        expect(Math.hypot(projAE.x - expectedCenterX, projAE.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 4. Winter Solstice (lambda = 270°): p3d = (0, -r0*sin(eps), -r0*cos(eps)) -> proj = (0, -r0*tan((90+eps)/2))
        const projWS = projectStereographicConformal({ x: 0, y: -r0 * Math.sin(EPS_RAD), z: -r0 * Math.cos(EPS_RAD) }, r0);
        const expectedWSY = -r0 * Math.tan((Math.PI / 2 + EPS_RAD) / 2);
        expect(projWS.x).toBeCloseTo(0, 4);
        expect(projWS.y).toBeCloseTo(expectedWSY, 4);
        expect(Math.hypot(projWS.x - expectedCenterX, projWS.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);
      });

      // -------------------------------------------------------------------------
      // Test 2: Scale-Invariance across varying R0 in {50, 100, 150, 200}
      // -------------------------------------------------------------------------
      it('verifies exact scale-invariance of stereographic projections for R0 in {50, 100, 150, 200}', () => {
        const testRadii = [50, 100, 150, 200];
        const secEps = 1 / Math.cos(EPS_RAD);
        const tanEps = Math.tan(EPS_RAD);

        for (const r0 of testRadii) {
          const expectedCenterY = -r0 * tanEps;
          const expectedRadius = r0 * secEps;

          // Verify normalized center and radius ratios
          expect(expectedRadius / r0).toBeCloseTo(secEps, 6);
          expect(expectedCenterY / r0).toBeCloseTo(-tanEps, 6);

          // Test all 4 quadrants of the ecliptic
          for (let deg = 0; deg < 360; deg += 15) {
            const lambdaRad = (deg * Math.PI) / 180;
            const p3d: Vector3D = {
              x: r0 * Math.cos(lambdaRad),
              y: r0 * Math.sin(lambdaRad) * Math.sin(EPS_RAD),
              z: r0 * Math.sin(lambdaRad) * Math.cos(EPS_RAD)
            };

            const proj = projectStereographicConformal(p3d, r0);
            const normalizedDist = Math.hypot(proj.x, proj.y - expectedCenterY) / r0;
            expect(Math.abs(normalizedDist - secEps)).toBeLessThan(1e-4);
          }

          // Test full model generation scaling
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 0 as Degrees,
            moonDecDeg: 0 as Degrees,
            moonLambdaDeg: 0 as Degrees,
            moonPhase: 0.5,
            morphLambda: 1.0,
            projectionMode: 'stereographic',
            cameraPitch: 0,
            cameraYaw: 0,
            r0
          });

          const eclRing = model.rings.find((r) => r.id === 'ecliptic');
          expect(eclRing).toBeDefined();

          // In screen coordinates, screenY = -pProj.y -> center is at (0, -expectedCenterY) = (0, +r0*tan(eps))
          const screenCenterY = r0 * tanEps;
          for (const v of eclRing!.vertices) {
            const screenDist = Math.hypot(v.screenPos.x, v.screenPos.y - screenCenterY);
            expect(Math.abs(screenDist / r0 - secEps)).toBeLessThan(1e-4);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 3: Conformal Circle Invariants on Tropic of Cancer, Tropic of Capricorn & Equator
      // -------------------------------------------------------------------------
      it('verifies conformal circle preservation on Celestial Equator, Tropic of Cancer, and Tropic of Capricorn', () => {
        const r0 = 100;
        const expectedCancerRadius = r0 * Math.tan((Math.PI / 2 - EPS_RAD) / 2); // ~65.6382
        const expectedCapricornRadius = r0 * Math.tan((Math.PI / 2 + EPS_RAD) / 2); // ~152.3497
        const expectedEquatorRadius = r0; // 100.0

        for (let raDeg = 0; raDeg < 360; raDeg += 5) {
          const raRad = (raDeg * Math.PI) / 180;

          // 1. Celestial Equator (dec = 0°)
          const pEq: Vector3D = { x: r0 * Math.cos(raRad), y: 0, z: r0 * Math.sin(raRad) };
          const projEq = projectStereographicConformal(pEq, r0);
          const distEq = Math.hypot(projEq.x, projEq.y);
          expect(Math.abs(distEq - expectedEquatorRadius)).toBeLessThan(1e-4);

          // 2. Tropic of Cancer (dec = +eps)
          const pCancer: Vector3D = {
            x: r0 * Math.cos(EPS_RAD) * Math.cos(raRad),
            y: r0 * Math.sin(EPS_RAD),
            z: r0 * Math.cos(EPS_RAD) * Math.sin(raRad)
          };
          const projCancer = projectStereographicConformal(pCancer, r0);
          const distCancer = Math.hypot(projCancer.x, projCancer.y);
          expect(Math.abs(distCancer - expectedCancerRadius)).toBeLessThan(1e-4);

          // 3. Tropic of Capricorn (dec = -eps)
          const pCap: Vector3D = {
            x: r0 * Math.cos(EPS_RAD) * Math.cos(raRad),
            y: -r0 * Math.sin(EPS_RAD),
            z: r0 * Math.cos(EPS_RAD) * Math.sin(raRad)
          };
          const projCap = projectStereographicConformal(pCap, r0);
          const distCap = Math.hypot(projCap.x, projCap.y);
          expect(Math.abs(distCap - expectedCapricornRadius)).toBeLessThan(1e-4);
        }

        // Verify concentricity in generateArmillaryModel output
        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          morphLambda: 1.0,
          projectionMode: 'stereographic',
          cameraPitch: 0,
          cameraYaw: 0,
          r0
        });

        const eqRing = model.rings.find((r) => r.id === 'equator');
        const canRing = model.rings.find((r) => r.id === 'tropic_cancer');
        const capRing = model.rings.find((r) => r.id === 'tropic_capricorn');

        expect(eqRing).toBeDefined();
        expect(canRing).toBeDefined();
        expect(capRing).toBeDefined();

        for (const v of eqRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedEquatorRadius, 3);
        }
        for (const v of canRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedCancerRadius, 3);
        }
        for (const v of capRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedCapricornRadius, 3);
        }
      });

      // -------------------------------------------------------------------------
      // Test 4: Non-Degeneracy & Absence of Chord-Cutting / Vertex Pinching across Morphing
      // -------------------------------------------------------------------------
      it('guarantees non-degeneracy, finite bounds, and absence of Cartesian chord-cutting or vertex pinching across intermediate morphing frames lambda in {0.1, 0.25, 0.45, 0.5, 0.75, 0.9}', () => {
        const testLambdas = [0.1, 0.25, 0.45, 0.5, 0.75, 0.9];
        const r0 = 100;
        const targetModes: Array<'stereographic' | 'rojas' | 'horizon'> = ['stereographic', 'rojas', 'horizon'];

        for (const mode of targetModes) {
          for (const lambda of testLambdas) {
            const model = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: 280 as Degrees,
              sunDecDeg: -23 as Degrees,
              sunLambdaDeg: 280 as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: lambda,
              projectionMode: mode,
              cameraPitch: 45 * (1 - lambda),
              cameraYaw: 30 * (1 - lambda),
              r0
            });

            expect(model.rings.length).toBeGreaterThanOrEqual(7);

            for (const ring of model.rings) {
              expect(ring.vertices.length).toBeGreaterThanOrEqual(72);

              let perimeter = 0;
              const segmentLengths: number[] = [];

              for (let i = 0; i < ring.vertices.length - 1; i++) {
                const v = ring.vertices[i];

                // 1. Strict finite coordinate assertions
                expect(Number.isFinite(v.screenPos.x)).toBe(true);
                expect(Number.isFinite(v.screenPos.y)).toBe(true);
                expect(Number.isNaN(v.screenPos.x)).toBe(false);
                expect(Number.isNaN(v.screenPos.y)).toBe(false);

                // 2. Physical boundary containment (|coord| < 10 * R0)
                expect(Math.abs(v.screenPos.x)).toBeLessThan(r0 * 10);
                expect(Math.abs(v.screenPos.y)).toBeLessThan(r0 * 10);

                // 3. Consecutive segment smoothness
                const nextV = ring.vertices[i + 1];
                const segLen = Math.hypot(nextV.screenPos.x - v.screenPos.x, nextV.screenPos.y - v.screenPos.y);

                // Segment length must be well-defined and positive
                expect(segLen).toBeGreaterThan(0.005);
                // Parallel circles and ecliptic avoid pole; polar-crossing rings expand near south pole singularity
                const isParallelOrEcliptic = ['equator', 'ecliptic', 'tropic_cancer', 'tropic_capricorn'].includes(ring.id);
                if (isParallelOrEcliptic) {
                  expect(segLen).toBeLessThan(100);
                } else {
                  expect(segLen).toBeLessThan(r0 * 10);
                }

                segmentLengths.push(segLen);
                perimeter += segLen;
              }

              // Check final endpoint vertex
              const lastV = ring.vertices[ring.vertices.length - 1];
              expect(Number.isFinite(lastV.screenPos.x)).toBe(true);
              expect(Number.isFinite(lastV.screenPos.y)).toBe(true);

              // 4. Ring perimeter must remain well-behaved
              expect(perimeter).toBeGreaterThan(r0 * 0.5); // Minimum loop perimeter
              expect(perimeter).toBeLessThan(r0 * 50); // Maximum bounding circumference

              // 5. Ratio of max to min segment length along parallel/ecliptic rings is bounded (no extreme distortion)
              const isParallelOrEcliptic = ['equator', 'ecliptic', 'tropic_cancer', 'tropic_capricorn'].includes(ring.id);
              if (isParallelOrEcliptic) {
                const maxSeg = Math.max(...segmentLengths);
                const minSeg = Math.min(...segmentLengths);
                expect(maxSeg / minSeg).toBeLessThan(100);
              }
            }
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 5: Staged Decoupling of 3D Geometry vs Camera Alignment and Back Ring Unification
      // -------------------------------------------------------------------------
      it('enforces unflattened 3D geometry (geomLambda = 0) for lambda in [0.0, 0.45] and smooth linear progress in [0.45, 1.0]', () => {
        const baseParams = {
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          projectionMode: 'stereographic' as const,
          cameraPitch: 90,
          cameraYaw: 0,
          r0: 100
        };

        // At lambda = 0.0, 0.2, 0.45: Geometry should match unflattened 3D camera projection exactly
        for (const lambda of [0.0, 0.2, 0.45]) {
          const model = generateArmillaryModel({ ...baseParams, morphLambda: lambda });
          const eqRing = model.rings.find(r => r.id === 'equator')!;
          // Celestial equator in 3D camera view (pitch=90) has radius = r0 = 100
          for (const v of eqRing.vertices) {
            const dist = Math.hypot(v.screenPos.x, v.screenPos.y);
            expect(dist).toBeCloseTo(100, 1);
          }
        }

        // At lambda = 1.0: Full stereographic equator has radius = r0 * tan(45°) = 100
        const modelFull = generateArmillaryModel({ ...baseParams, morphLambda: 1.0 });
        const eqRingFull = modelFull.rings.find(r => r.id === 'equator')!;
        for (const v of eqRingFull.vertices) {
          const dist = Math.hypot(v.screenPos.x, v.screenPos.y);
          expect(dist).toBeCloseTo(100, 1);
        }
      });

      it('guarantees back ring stroke unification and eliminates back segments when geomLambda >= 0.85', () => {
        const r0 = 100;
        // lambda >= 0.45 + 0.85 * 0.55 = 0.9175 -> geomLambda >= 0.85
        for (const lambda of [0.92, 0.95, 1.0]) {
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 0 as Degrees,
            moonDecDeg: 0 as Degrees,
            moonLambdaDeg: 0 as Degrees,
            moonPhase: 0.5,
            morphLambda: lambda,
            projectionMode: 'stereographic',
            cameraPitch: 90,
            cameraYaw: 0,
            r0
          });

          for (const ring of model.rings) {
            expect(ring.vertices.every(v => v.isFront)).toBe(true);
            expect(ring.backPathD).toBe('');
            expect(ring.frontPathD.length).toBeGreaterThan(0);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 6: Sun Bead Strict Coincidence with Ecliptic Track Across All Seasons & Free Rete Offsets
      // -------------------------------------------------------------------------
      it('guarantees Sun bead strict coincidence with Ecliptic track across all 4 astronomical seasons, orbital milestones, and Free Rete offsets', () => {
        const astronomicalMilestones = [
          { name: 'Vernal Equinox', sunLambda: 0, sunRa: 0, sunDec: 0 },
          { name: 'Summer Solstice', sunLambda: 90, sunRa: 90, sunDec: 23.439 },
          { name: 'Autumnal Equinox', sunLambda: 180, sunRa: 180, sunDec: 0 },
          { name: 'Winter Solstice', sunLambda: 270, sunRa: 270, sunDec: -23.439 },
          { name: 'Perihelion', sunLambda: 283, sunRa: 284, sunDec: -22.7 },
          { name: 'Aphelion', sunLambda: 103, sunRa: 104, sunDec: 22.7 }
        ];

        const reteOffsets = [0, 30, 45, 90, 180, 270, 315];
        const r0 = 100;

        for (const season of astronomicalMilestones) {
          for (const offset of reteOffsets) {
            // A. 2D Stereographic Astrolabe Mode
            const model2D = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: season.sunRa as Degrees,
              sunDecDeg: season.sunDec as Degrees,
              sunLambdaDeg: season.sunLambda as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: 1.0,
              projectionMode: 'stereographic',
              cameraPitch: 0,
              cameraYaw: 0,
              r0,
              isFreeReteMode: offset !== 0,
              freeReteOffsetDeg: offset
            });

            // 1. Check analytical 3D Sun position matches clamped ecliptic parametric equations
            const sunLonRad = (season.sunLambda * Math.PI) / 180;
            const sun3DBase: Vector3D = {
              x: r0 * Math.cos(sunLonRad),
              y: r0 * Math.sin(sunLonRad) * Math.sin(EPS_RAD),
              z: r0 * Math.sin(sunLonRad) * Math.cos(EPS_RAD)
            };
            const sun3DExpected = rotateEuler3D(sun3DBase, 0, offset, 0);

            expect(model2D.sun.p3d.x).toBeCloseTo(sun3DExpected.x, 3);
            expect(model2D.sun.p3d.y).toBeCloseTo(sun3DExpected.y, 3);
            expect(model2D.sun.p3d.z).toBeCloseTo(sun3DExpected.z, 3);

            // 2. Check Sun bead distance from origin in 3D equals r0 exactly
            const dist3D = Math.hypot(model2D.sun.p3d.x, model2D.sun.p3d.y, model2D.sun.p3d.z);
            expect(dist3D).toBeCloseTo(r0, 4);

            // 3. Check Sun bead screen position coincidence against the Ecliptic ring polyline
            const eclRing = model2D.rings.find((r) => r.id === 'ecliptic');
            expect(eclRing).toBeDefined();

            const sunPos = model2D.sun.screenPos;
            let minDistanceToRing = Infinity;

            // Find minimum perpendicular distance from Sun bead to any segment of the Ecliptic ring
            for (let i = 0; i < eclRing!.vertices.length; i++) {
              const p1 = eclRing!.vertices[i].screenPos;
              const p2 = eclRing!.vertices[(i + 1) % eclRing!.vertices.length].screenPos;

              // Distance from point (sunPos) to line segment (p1 -> p2)
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const segLenSq = dx * dx + dy * dy;

              let dist: number;
              if (segLenSq === 0) {
                dist = Math.hypot(sunPos.x - p1.x, sunPos.y - p1.y);
              } else {
                const t = clamp(((sunPos.x - p1.x) * dx + (sunPos.y - p1.y) * dy) / segLenSq, 0, 1);
                const projX = p1.x + t * dx;
                const projY = p1.y + t * dy;
                dist = Math.hypot(sunPos.x - projX, sunPos.y - projY);
              }

              if (dist < minDistanceToRing) {
                minDistanceToRing = dist;
              }
            }

            // In 72-segment polygon approximation, chord sagitta between polygon and true eccentric circle is < 0.25px
            expect(minDistanceToRing).toBeLessThan(0.25);

            // 4. Distance of Sun screen position from projected circle center matches expectedRadius
            // With reteOffset = 0, screen center is (0, +r0*tan(eps))
            if (offset === 0) {
              const expectedRadius = r0 / Math.cos(EPS_RAD);
              const screenCenterY = r0 * Math.tan(EPS_RAD);
              const distFromCenter = Math.hypot(sunPos.x, sunPos.y - screenCenterY);
              expect(Math.abs(distFromCenter - expectedRadius)).toBeLessThan(1e-4);
            }

            // B. 3D Geocentric Mode
            const model3D = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: season.sunRa as Degrees,
              sunDecDeg: season.sunDec as Degrees,
              sunLambdaDeg: season.sunLambda as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: 0.0,
              projectionMode: 'geocentric',
              cameraPitch: 0,
              cameraYaw: 0,
              r0
            });

            // In 3D Geocentric, Sun revolves on Ecliptic plane inclined at eps: normal = (0, cos(eps), sin(eps))
            // Dot product P_sun . N must be identically 0
            const dotWithNormal = model3D.sun.p3d.y * Math.cos(EPS_RAD) + model3D.sun.p3d.z * Math.sin(EPS_RAD);
            expect(Math.abs(dotWithNormal)).toBeLessThan(1e-4);
            // Distance from Earth (origin) is 1.1 * r0
            expect(Math.hypot(model3D.sun.p3d.x, model3D.sun.p3d.y, model3D.sun.p3d.z)).toBeCloseTo(r0 * 1.1, 3);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 7: Cross-Projection 2D <-> 2D Continuity Invariants (Stereo <-> Rojas <-> Horizon)
      // -------------------------------------------------------------------------
      it('verifies seamless continuity and non-degeneracy during 2D <-> 2D cross-projection morphing for all transition frames T in {0.0, 0.25, 0.5, 0.75, 1.0}', () => {
        const transitions: Array<{ from: ArmillaryProjectionMode; to: ArmillaryProjectionMode }> = [
          { from: 'stereographic', to: 'rojas' },
          { from: 'rojas', to: 'stereographic' },
          { from: 'stereographic', to: 'horizon' },
          { from: 'horizon', to: 'stereographic' },
          { from: 'rojas', to: 'horizon' },
          { from: 'horizon', to: 'rojas' }
        ];

        const testT = [0.0, 0.25, 0.5, 0.75, 1.0];
        const r0 = 100;
        const testPoint: Vector3D = { x: 60, y: 30, z: 70 };

        for (const trans of transitions) {
          let prevProj: Vector2D | null = null;

          for (const t of testT) {
            const proj = computeContinuousProjection2D(
              testPoint,
              trans.from,
              trans.to,
              t,
              r0,
              47.06 as Latitude,
              120 as Degrees
            );

            expect(Number.isFinite(proj.x)).toBe(true);
            expect(Number.isFinite(proj.y)).toBe(true);
            expect(Number.isNaN(proj.x)).toBe(false);
            expect(Number.isNaN(proj.y)).toBe(false);

            if (prevProj !== null) {
              // Delta between consecutive 25% steps must be smooth and bounded
              const stepDelta = Math.hypot(proj.x - prevProj.x, proj.y - prevProj.y);
              expect(stepDelta).toBeLessThan(r0 * 2);
            }

            prevProj = proj;
          }
        }
      });
  });

  // =========================================================================
  // Phase 1 Mathematical Hardening & Singularity Safeguards
  // =========================================================================
  describe('Phase 1 Mathematical Hardening & Singularity Safeguards', () => {
    // 1. Polar Observers (+/- 90 deg)
    it('produces finite, valid models for extreme polar observers (North and South Poles)', () => {
      const poles: Latitude[] = [90 as Latitude, -90 as Latitude, 89.99 as Latitude, -89.99 as Latitude];
      const modes: ArmillaryProjectionMode[] = ['heliocentric', 'geocentric', 'stereographic', 'rojas', 'horizon'];

      for (const lat of poles) {
        for (const mode of modes) {
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: lat,
            longitude: 0 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 90 as Degrees,
            moonDecDeg: 5 as Degrees,
            moonLambdaDeg: 90 as Degrees,
            moonPhase: 0.5,
            morphLambda: 0.5,
            projectionMode: mode,
            cameraPitch: 45,
            cameraYaw: 45,
            r0: 100
          });

          expect(Number.isFinite(model.sun.screenPos.x)).toBe(true);
          expect(Number.isFinite(model.sun.screenPos.y)).toBe(true);
          expect(Number.isFinite(model.moon.screenPos.x)).toBe(true);
          expect(Number.isFinite(model.moon.screenPos.y)).toBe(true);
          expect(Number.isFinite(model.earth.screenPos.x)).toBe(true);
          expect(Number.isFinite(model.earth.screenPos.y)).toBe(true);
          expect(model.rings.length).toBeGreaterThanOrEqual(6);

          for (const ring of model.rings) {
            expect(ring.fullPathD).not.toContain('NaN');
            expect(ring.fullPathD).not.toContain('Infinity');
          }
        }
      }
    });

    // 2. Equatorial Observers (0 deg)
    it('generates consistent Almucantar circles and horizontal coordinates at the Equator', () => {
      const almucantars = generateAlmucantars(0 as Latitude, 15, 100);
      expect(almucantars.length).toBe(6);
      for (const a of almucantars) {
        expect(Number.isFinite(a.centerY)).toBe(true);
        expect(Number.isFinite(a.radius)).toBe(true);
        expect(a.radius).toBeLessThanOrEqual(2500);
      }
    });

    // 3. Southern Hemisphere Almucantar singularity guards
    it('strictly bounds Almucantar radius and center coordinates in Southern Hemisphere latitudes (alt ~ -lat)', () => {
      // Testing exact potential zero denominators sin(lat) + sin(alt) = 0
      const southernLats: Latitude[] = [-30 as Latitude, -45 as Latitude, -60 as Latitude, -15 as Latitude];
      for (const lat of southernLats) {
        const matchingAlt = Math.abs(lat);
        const circle = calculateAlmucantarCircle(matchingAlt, lat, 100);
        expect(Number.isFinite(circle.radius)).toBe(true);
        expect(Number.isFinite(circle.centerY)).toBe(true);
        expect(circle.radius).toBeLessThanOrEqual(2500);
        expect(Math.abs(circle.centerY)).toBeLessThanOrEqual(2500);

        // Perturbed latitude (near-singularity)
        const perturbedLat = (lat + 0.001) as Latitude;
        const perturbedCircle = calculateAlmucantarCircle(matchingAlt, perturbedLat, 100);
        expect(Number.isFinite(perturbedCircle.radius)).toBe(true);
        expect(perturbedCircle.radius).toBeLessThanOrEqual(2500);
      }
    });

    // 4. Nadir Sinking Boundary Guard in projectTopocentricHorizon
    it('clamps runaway radial coordinates when celestial beads sink toward Nadir (alt -> -90°)', () => {
      const r0 = 100;
      const nadirAlts = [-89.9, -89.99, -90, -120];
      for (const alt of nadirAlts) {
        const proj = projectTopocentricHorizon(alt, 45, r0);
        expect(Number.isFinite(proj.x)).toBe(true);
        expect(Number.isFinite(proj.y)).toBe(true);
        expect(Math.abs(proj.x)).toBeLessThanOrEqual(r0 * 10);
        expect(Math.abs(proj.y)).toBeLessThanOrEqual(r0 * 10);
      }
    });

    // 5. Circumpolar & Polar Day/Night Robustness in calculatePlanetaryHour
    it('reliably solves unequal planetary hours during midnight sun, polar night, and out-of-range hours', () => {
      // Polar Day (midnight sun: 24h daylight)
      const polarDay = calculatePlanetaryHour(14 as HoursDecimal, 0 as HoursDecimal, 24 as HoursDecimal, 0);
      expect(polarDay.isDay).toBe(true);
      expect(polarDay.hourNumber).toBeGreaterThanOrEqual(1);
      expect(polarDay.hourNumber).toBeLessThanOrEqual(12);
      expect(polarDay.progressPercent).toBeGreaterThanOrEqual(0);
      expect(polarDay.progressPercent).toBeLessThanOrEqual(100);

      // Polar Night (24h darkness)
      const polarNight = calculatePlanetaryHour(3 as HoursDecimal, 12 as HoursDecimal, 12 as HoursDecimal, 1);
      expect(polarNight.isDay).toBe(false);
      expect(polarNight.hourNumber).toBeGreaterThanOrEqual(1);
      expect(polarNight.hourNumber).toBeLessThanOrEqual(12);

      // Negative hour wrapping (e.g. -5h UTC -> 19h local)
      const wrappedNeg = calculatePlanetaryHour(-5 as HoursDecimal, 6 as HoursDecimal, 18 as HoursDecimal, 2);
      const wrappedEquivalent = calculatePlanetaryHour(19 as HoursDecimal, 6 as HoursDecimal, 18 as HoursDecimal, 2);
      expect(wrappedNeg.hourNumber).toBe(wrappedEquivalent.hourNumber);
      expect(wrappedNeg.isDay).toBe(wrappedEquivalent.isDay);
      expect(wrappedNeg.rulingPlanet).toBe(wrappedEquivalent.rulingPlanet);

      // Overflow hour wrapping (28h -> 4h)
      const wrappedOver = calculatePlanetaryHour(28 as HoursDecimal, 6 as HoursDecimal, 18 as HoursDecimal, 3);
      const wrappedOverEq = calculatePlanetaryHour(4 as HoursDecimal, 6 as HoursDecimal, 18 as HoursDecimal, 3);
      expect(wrappedOver.hourNumber).toBe(wrappedOverEq.hourNumber);
    });

    // 6. Negative Zero Normalization
    it('normalizes negative zeroes across equatorial, horizontal, and 2D projections', () => {
      const eq = cartesian3DToEquatorial({ x: 0, y: 0, z: 0 });
      expect(Object.is(eq.raDeg, -0)).toBe(false);
      expect(Object.is(eq.decDeg, -0)).toBe(false);

      const horizZenith = equatorialToHorizontal(0 as Degrees, 90 as Degrees, 90 as Latitude, 0 as Degrees);
      expect(Object.is(horizZenith.altDeg, -0)).toBe(false);
      expect(Object.is(horizZenith.azDeg, -0)).toBe(false);

      const projRojas = projectRojasOrthographic({ x: -0, y: -0, z: 0 }, 100);
      expect(Object.is(projRojas.x, -0)).toBe(false);
      expect(Object.is(projRojas.y, -0)).toBe(false);
    });

    // 7. Milestone Orbital Radius Preservation via slerp3D (No Chord-Cutting)
    it('preserves milestone orbital radius via slerp3D without chord-cutting collapse across lambda in [0.0, 0.45]', () => {
      const lambdas = [0.0, 0.05, 0.1, 0.15, 0.2, 0.225, 0.25, 0.3, 0.35, 0.4, 0.45];
      for (const morphLambda of lambdas) {
        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 120 as Degrees,
          moonDecDeg: 15 as Degrees,
          moonLambdaDeg: 120 as Degrees,
          moonPhase: 0.5,
          morphLambda,
          projectionMode: 'heliocentric',
          cameraPitch: 0,
          cameraYaw: 0,
          r0: 100
        });

        expect(model.milestones.length).toBeGreaterThan(0);
        for (const m of model.milestones) {
          const dist = Math.hypot(m.p3d.x, m.p3d.y, m.p3d.z);
          // Without slerp3D, milestones collapse to radius ~0 at lambda = 0.225.
          // With slerp3D, the radius is strictly preserved along the geodesic arc > 100px.
          expect(dist).toBeGreaterThan(100);
          expect(dist).toBeLessThan(120);
        }
      }
    });

    // 8. Negative Zero Normalization at Phase A End (lambda = 0.45)
    it('normalizes negative zeroes for celestial bodies in heliocentric mode at lambda = 0.45', () => {
      // sunLambdaDeg = 0 results in helioEarth.x < 0, so (1 - phaseAT) * helioEarth.x could evaluate to -0
      const model = generateArmillaryModel({
        julianDate: 2451545.0,
        latitude: 47.06 as Latitude,
        longitude: -122.81 as Longitude,
        timeOfDay: 12 as HoursDecimal,
        sunRaDeg: 0 as Degrees,
        sunDecDeg: 0 as Degrees,
        sunLambdaDeg: 0 as Degrees,
        moonRaDeg: 120 as Degrees,
        moonDecDeg: 15 as Degrees,
        moonLambdaDeg: 120 as Degrees,
        moonPhase: 0.5,
        morphLambda: 0.45,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      expect(Object.is(model.earth.p3d.x, -0)).toBe(false);
      expect(Object.is(model.earth.p3d.y, -0)).toBe(false);
      expect(Object.is(model.earth.p3d.z, -0)).toBe(false);
      expect(model.earth.p3d.x).toBe(0);
      expect(model.earth.p3d.y).toBe(0);
      expect(model.earth.p3d.z).toBe(0);

      expect(Object.is(model.sun.p3d.x, -0)).toBe(false);
      expect(Object.is(model.sun.p3d.y, -0)).toBe(false);
      expect(Object.is(model.sun.p3d.z, -0)).toBe(false);

      expect(Object.is(model.moon.p3d.x, -0)).toBe(false);
      expect(Object.is(model.moon.p3d.y, -0)).toBe(false);
      expect(Object.is(model.moon.p3d.z, -0)).toBe(false);
    });

    // 9. Lunar Orbit Ring Radius and Node Pins Lockstep Expansion
    it('expands lunar orbit ring radius and node pins from 16px to 26px in lockstep with the Moon bead in heliocentric mode', () => {
      const lambdas = [0.0, 0.15, 0.3, 0.45];

      for (const morphLambda of lambdas) {
        const phaseAT = morphLambda / 0.45;
        const expectedDist = 16 + 10 * phaseAT;

        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          moonNodeLonDeg: 0,
          morphLambda,
          projectionMode: 'heliocentric',
          cameraPitch: 0,
          cameraYaw: 0,
          r0: 100
        });

        // 1. Lunar Orbit ring radius
        const lunarOrbit = model.rings.find((r) => r.id === 'lunar_orbit');
        expect(lunarOrbit).toBeDefined();
        for (const v of lunarOrbit!.vertices) {
          const rRing = Math.hypot(
            v.p3d.x - model.earth.p3d.x,
            v.p3d.y - model.earth.p3d.y,
            v.p3d.z - model.earth.p3d.z
          );
          expect(rRing).toBeCloseTo(expectedDist, 3);
        }

        // 2. Lunar node pins distance from Earth
        expect(model.lunarNodes).toBeDefined();
        const ascDist = Math.hypot(
          model.lunarNodes!.ascendingNode.screenPos.x - model.earth.screenPos.x,
          model.lunarNodes!.ascendingNode.screenPos.y - model.earth.screenPos.y
        );
        expect(ascDist).toBeCloseTo(expectedDist, 3);

        const descDist = Math.hypot(
          model.lunarNodes!.descendingNode.screenPos.x - model.earth.screenPos.x,
          model.lunarNodes!.descendingNode.screenPos.y - model.earth.screenPos.y
        );
        expect(descDist).toBeCloseTo(expectedDist, 3);

        // 3. Moon bead distance relative to Earth in lockstep
        const moonRelDist = Math.hypot(
          model.moon.p3d.x - model.earth.p3d.x,
          model.moon.p3d.y - model.earth.p3d.y,
          model.moon.p3d.z - model.earth.p3d.z
        );
        expect(moonRelDist).toBeCloseTo(expectedDist, 3);
      }
    });

    // 10. Celestial Ring Radius Blooming Expansion
    it('blooms celestial ring radius rBloom from 14px to 100px as lambda transitions from 0.0 to 0.45', () => {
      const lambdas = [0.0, 0.15, 0.225, 0.3, 0.45];

      for (const morphLambda of lambdas) {
        const phaseAT = morphLambda / 0.45;
        const expectedRadius = (1 - phaseAT) * 14 + phaseAT * 100;

        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 120 as Degrees,
          moonDecDeg: 15 as Degrees,
          moonLambdaDeg: 120 as Degrees,
          moonPhase: 0.5,
          morphLambda,
          projectionMode: 'heliocentric',
          cameraPitch: 0,
          cameraYaw: 0,
          r0: 100
        });

        // Check Equator ring radius relative to bloom center
        const equator = model.rings.find((r) => r.id === 'equator');
        expect(equator).toBeDefined();

        // cBloom is (1 - tGeo) * blendedEarth3D
        const cBloomX = (1 - phaseAT) * model.earth.p3d.x;
        const cBloomY = (1 - phaseAT) * model.earth.p3d.y;
        const cBloomZ = (1 - phaseAT) * model.earth.p3d.z;

        for (const v of equator!.vertices) {
          const rRing = Math.hypot(
            v.p3d.x - cBloomX,
            v.p3d.y - cBloomY,
            v.p3d.z - cBloomZ
          );
          expect(rRing).toBeCloseTo(expectedRadius, 3);
        }
      }
    });
  });
});
