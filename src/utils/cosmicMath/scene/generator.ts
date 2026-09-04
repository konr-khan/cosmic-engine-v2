/**
 * @file generator.ts
 * Generates the unified 3D Astronomical Scene Graph from pure Meeus ephemeris algorithms.
 * 
 * Establishes a single geometric source of truth for all 3D bodies, Keplerian orbits,
 * seasonal milestone nodes, 3D inclined lunar trajectories, and syzygy shadow cones.
 */

import { asDegrees, asRadians, asJulianDate, toRadians } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { dateToJulianDate, julianDateToDate } from '../core';
import { 
  J2000_JD, 
  ASTRONOMICAL_UNIT_KM, 
  EARTH_RADIUS_WGS84_KM,
  SUN_RADIUS_KM,
  EARTH_AXIAL_OBLIQUITY_J2000_DEG, 
  EARTH_ECCENTRICITY_TRUE, 
  EARTH_ECCENTRICITY_EXAGGERATED,
  EARTH_PERIHELION_LONGITUDE_DEG,
  MOON_ORBIT_INCLINATION_DEG
} from '../astroConstants';
import { calculateEarthOrbitalPhysics } from '../solar';
import { calculateLunarPosition } from '../lunar';
import { calculateEclipseData } from '../eclipse';
import { EARTH_MILESTONES } from '../milestones';
import { 
  GenerateCosmicSceneParams, 
  CosmicScene3D, 
  MilestoneNode3D, 
  ShadowCones3D, 
  LunarOrbit3D, 
  ScaleMode,
  SeasonalMilestoneId
} from './types';
import { normalizeVector3D } from './transforms';

/**
 * Generates the complete 3D Cosmic Scene Graph for a given epoch and scale mode.
 * 
 * @param params - Configuration parameters including date/Julian date, scale mode, observer coordinates
 * @returns Complete hierarchical CosmicScene3D state
 */
export function generateCosmicScene(params: GenerateCosmicSceneParams = {}): CosmicScene3D {
  const {
    julianDate: jdInput,
    scaleMode = 'true',
    r0 = 200,
    latitude = 47.06,
    longitude = -122.81,
    timeOfDay = 12.0
  } = params;

  // 1. Resolve Julian Date & UTC Date Object
  let jd: number;
  let timestamp: Date;

  if (jdInput instanceof Date) {
    timestamp = jdInput;
    jd = dateToJulianDate(timestamp);
  } else if (typeof jdInput === 'number') {
    jd = jdInput;
    timestamp = julianDateToDate(jd);
  } else {
    // Default deterministically to J2000.0 epoch (pure function contract)
    jd = J2000_JD;
    timestamp = julianDateToDate(jd);
  }

  // 2. Pure Ephemeris Calculations
  const solarPhysics = calculateEarthOrbitalPhysics(jd);
  const lunarPos = calculateLunarPosition(jd);
  const eclipse = calculateEclipseData(jd);

  const obliquityDeg = EARTH_AXIAL_OBLIQUITY_J2000_DEG - 0.0000004 * (jd - J2000_JD);
  const obliquityRad = toRadians(obliquityDeg);

  const sunLambdaDeg = solarPhysics.lambda ?? solarPhysics.eclipticLongitude ?? 0;
  const sunLambdaRad = toRadians(sunLambdaDeg);
  const earthLambdaDeg = (sunLambdaDeg + 180) % 360;
  const earthLambdaRad = toRadians(earthLambdaDeg);

  const distAU = solarPhysics.distanceAU || 1.0;
  const distKm = solarPhysics.distanceKm || ASTRONOMICAL_UNIT_KM;

  // 3. Scale Mode Evaluation
  const isExag = scaleMode === 'exaggerated';
  const e = isExag ? EARTH_ECCENTRICITY_EXAGGERATED : EARTH_ECCENTRICITY_TRUE;
  const a = isExag ? r0 : 1.0;
  const bRatio = isExag ? Math.sqrt(1 - EARTH_ECCENTRICITY_EXAGGERATED * EARTH_ECCENTRICITY_EXAGGERATED) : Math.sqrt(1 - e * e);
  const b = a * bRatio;
  const c = a * e;

  // 4. Sun & Earth Positions in Heliocentric Ecliptic Space
  let sunPos: Vector3D;
  let earthPos: Vector3D;
  let f1: Vector3D;
  let f2: Vector3D;

  const perihelionLonRad = toRadians(EARTH_PERIHELION_LONGITUDE_DEG);

  if (isExag) {
    // Exaggerated Scale: Sun at Focus F1 (-c, 0, 0), Empty Focus F2 (+c, 0, 0)
    f1 = { x: -c, y: 0, z: 0 };
    f2 = { x: c, y: 0, z: 0 };
    sunPos = { x: -c, y: 0, z: 0 };
    // Earth positioned along exaggerated Kepler ellipse (prograde counter-clockwise)
    earthPos = {
      x: -a * Math.cos(sunLambdaRad),
      y: b * Math.sin(sunLambdaRad),
      z: 0
    };
  } else {
    // True Scale: Sun at (0, 0, 0)
    f1 = { x: 0, y: 0, z: 0 };
    f2 = { 
      x: -2 * c * Math.cos(perihelionLonRad), 
      y: -2 * c * Math.sin(perihelionLonRad), 
      z: 0 
    };
    sunPos = { x: 0, y: 0, z: 0 };
    earthPos = {
      x: -distAU * Math.cos(sunLambdaRad),
      y: distAU * Math.sin(sunLambdaRad),
      z: 0
    };
  }

  // 5. Earth 3D Inertial Vectors
  const axialTiltVector: Vector3D = {
    x: 0,
    y: Math.sin(obliquityRad),
    z: Math.cos(obliquityRad)
  };

  const subsolarPoint: Vector3D = {
    x: Math.cos(sunLambdaRad),
    y: Math.sin(sunLambdaRad) * Math.sin(obliquityRad),
    z: Math.sin(sunLambdaRad) * Math.cos(obliquityRad)
  };

  // 6. 3D Seasonal Milestone Nodes (Heliocentric Longitudes of Earth)
  const milestones: MilestoneNode3D[] = EARTH_MILESTONES.map(m => {
    let pos: Vector3D;
    if (isExag) {
      pos = {
        x: m.rawX,
        y: m.rawY * bRatio,
        z: 0
      };
    } else {
      // True scale position in AU
      pos = {
        x: m.distanceAU * (m.rawX / 200),
        y: m.distanceAU * (m.rawY / 200),
        z: 0
      };
    }

    return {
      id: m.id as SeasonalMilestoneId,
      label: m.label,
      date: m.date,
      position: pos,
      longitude: m.helioEclipticLon,
      distanceAU: m.distanceAU,
      distanceKm: m.distanceKm,
      speedKms: m.speedKms,
      color: m.color,
      textColor: m.textColor,
      fillColor: m.fillColor,
      description: m.description,
      textAnchor: m.textAnchor,
      textDx: m.textDx,
      textDy: m.textDy,
      subDy: m.subDy
    };
  });

  // 7. Moon 3D Position & 3D Inclined Lunar Orbit
  const lunarDistKm = lunarPos.distanceKm;
  const lunarBetaDeg = lunarPos.beta;
  const lunarBetaRad = toRadians(lunarBetaDeg);
  const lunarLonDeg = lunarPos.lambda;
  const lunarLonRad = toRadians(lunarLonDeg);
  const nodeLonDeg = lunarPos.nodeLongitude || 0;
  const descNodeLonDeg = lunarPos.descendingNodeLongitude || ((nodeLonDeg + 180) % 360);
  const nodeAngleDeg = ((sunLambdaDeg - nodeLonDeg) % 360 + 360) % 360;
  const nodeAngleRad = toRadians(nodeAngleDeg);

  const lunarOrbitalRadiusAU = lunarDistKm / ASTRONOMICAL_UNIT_KM; // ~0.00257 AU
  const lunarVisualRadius = isExag ? 40 : lunarOrbitalRadiusAU;

  // Moon position relative to Earth (prograde counter-clockwise orbit)
  const moonRelativePos: Vector3D = {
    x: -lunarVisualRadius * Math.cos(lunarLonRad) * Math.cos(lunarBetaRad),
    y: lunarVisualRadius * Math.sin(lunarLonRad) * Math.cos(lunarBetaRad),
    z: lunarVisualRadius * Math.sin(lunarBetaRad)
  };

  const moonWorldPos: Vector3D = {
    x: earthPos.x + moonRelativePos.x,
    y: earthPos.y + moonRelativePos.y,
    z: earthPos.z + moonRelativePos.z
  };

  // Sample 3D Lunar Orbit loop (72 steps)
  const numSteps = 72;
  const samples = [];
  const incDeg = Number(MOON_ORBIT_INCLINATION_DEG);
  for (let i = 0; i <= numSteps; i++) {
    const t = (i / numSteps) * 2 * Math.PI;
    const sampleBetaDeg = incDeg * Math.sin(t + nodeAngleRad);
    const sampleBetaRad = toRadians(sampleBetaDeg);
    const samplePos: Vector3D = {
      x: -lunarVisualRadius * Math.cos(t),
      y: lunarVisualRadius * Math.sin(t),
      z: lunarVisualRadius * Math.sin(sampleBetaRad)
    };
    samples.push({
      position: samplePos,
      phaseRad: t,
      betaDeg: sampleBetaDeg,
      isWaxing: t <= Math.PI,
      isAscending: sampleBetaDeg >= 0
    });
  }

  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

  const ascendingNodePosition: Vector3D = {
    x: -lunarVisualRadius * Math.cos(tAsc),
    y: lunarVisualRadius * Math.sin(tAsc),
    z: 0
  };

  const descendingNodePosition: Vector3D = {
    x: -lunarVisualRadius * Math.cos(tDesc),
    y: lunarVisualRadius * Math.sin(tDesc),
    z: 0
  };

  const lunarOrbit: LunarOrbit3D = {
    inclination: toRadians(MOON_ORBIT_INCLINATION_DEG),
    nodeLongitude: asDegrees(nodeLonDeg),
    descendingNodeLongitude: asDegrees(descNodeLonDeg),
    nodeAngleDeg: asDegrees(nodeAngleDeg),
    ascendingNodePosition,
    descendingNodePosition,
    samples
  };

  // 8. 3D Umbra & Penumbra Shadow Cones
  const rSunKm = SUN_RADIUS_KM;
  const rEarthKm = EARTH_RADIUS_WGS84_KM;
  const sinUmbra = (rSunKm - rEarthKm) / distKm;
  const umbraAngle = Math.asin(Math.max(0, Math.min(1, sinUmbra)));
  const umbraLengthKm = rEarthKm / sinUmbra;

  const sinPenumbra = (rSunKm + rEarthKm) / distKm;
  const penumbraAngle = Math.asin(Math.max(0, Math.min(1, sinPenumbra)));
  const penumbraLengthKm = rEarthKm / sinPenumbra;

  // Shadow axis points away from Sun: from Sun to Earth
  const shadowAxis: Vector3D = normalizeVector3D({
    x: Math.cos(earthLambdaRad),
    y: Math.sin(earthLambdaRad),
    z: 0
  });

  const umbraApex: Vector3D = {
    x: earthPos.x + (umbraLengthKm / ASTRONOMICAL_UNIT_KM) * shadowAxis.x,
    y: earthPos.y + (umbraLengthKm / ASTRONOMICAL_UNIT_KM) * shadowAxis.y,
    z: earthPos.z + (umbraLengthKm / ASTRONOMICAL_UNIT_KM) * shadowAxis.z
  };

  const penumbraApex: Vector3D = {
    x: earthPos.x - (penumbraLengthKm / ASTRONOMICAL_UNIT_KM) * shadowAxis.x,
    y: earthPos.y - (penumbraLengthKm / ASTRONOMICAL_UNIT_KM) * shadowAxis.y,
    z: earthPos.z - (penumbraLengthKm / ASTRONOMICAL_UNIT_KM) * shadowAxis.z
  };

  const umbraRadiusAtMoonKm = Math.max(0, 1.02 * rEarthKm * (1 - lunarDistKm / umbraLengthKm));
  const penumbraRadiusAtMoonKm = 1.02 * rEarthKm * (1 + lunarDistKm / penumbraLengthKm);

  const shadowCones: ShadowCones3D = {
    umbraApex,
    umbraAngle: asRadians(umbraAngle),
    umbraLength: umbraLengthKm,
    umbraLengthKm,
    umbraRadiusAtMoonKm,
    penumbraApex,
    penumbraAngle: asRadians(penumbraAngle),
    penumbraLength: penumbraLengthKm,
    penumbraLengthKm,
    penumbraRadiusAtMoonKm,
    axisDirection: shadowAxis,
    moonCenter: moonWorldPos,
    earthCenter: earthPos,
    isInsideUmbra: Math.abs(lunarBetaDeg) < 0.5 && eclipse.type === 'TOTAL_LUNAR',
    isInsidePenumbra: Math.abs(lunarBetaDeg) < 1.5 && eclipse.isEclipseActive
  };

  // 9. Phase Quadrant Computation
  const elongationDeg = ((lunarLonDeg - sunLambdaDeg) % 360 + 360) % 360;
  let quadrant: 1 | 2 | 3 | 4 = 1;
  if (elongationDeg < 90) quadrant = 1;
  else if (elongationDeg < 180) quadrant = 2;
  else if (elongationDeg < 270) quadrant = 3;
  else quadrant = 4;

  return {
    timestamp,
    julianDate: asJulianDate(jd),
    scaleMode,
    sun: {
      position: sunPos,
      radius: 15,
      eclipticLongitude: asDegrees(sunLambdaDeg),
      rightAscension: asDegrees(solarPhysics.rightAscension || 0),
      declination: asDegrees(solarPhysics.declination || 0)
    },
    earth: {
      position: earthPos,
      radius: 10,
      obliquity: asRadians(obliquityRad),
      heliocentricLongitude: asDegrees(earthLambdaDeg),
      subsolarPoint,
      axialTiltVector,
      distanceAU: distAU,
      distanceKm: distKm,
      orbitalSpeedKms: solarPhysics.orbitalSpeedKms || 29.78,
      solarIrradiancePercent: solarPhysics.solarIrradiancePercent || 100.0,
      sunAngularDiameterArcmin: solarPhysics.sunAngularDiameterArcmin || 32.0,
      velocity: {
        x: -solarPhysics.orbitalSpeedKms * Math.sin(earthLambdaRad),
        y: solarPhysics.orbitalSpeedKms * Math.cos(earthLambdaRad),
        z: 0
      },
      subsolarGeo: {
        lat: solarPhysics.declination,
        lon: asDegrees(-15 * (timeOfDay - 12))
      }
    },
    moon: {
      position: moonWorldPos,
      radius: 4.5,
      eclipticLongitude: asDegrees(lunarLonDeg),
      eclipticLatitude: asDegrees(lunarBetaDeg),
      rightAscension: asDegrees(lunarPos.rightAscension || 0),
      declination: asDegrees(lunarPos.declination || 0),
      distanceKm: lunarDistKm,
      phase: lunarPos.phase,
      phaseName: lunarPos.phaseName,
      illuminationFraction: lunarPos.illuminationFraction ?? 0.5,
      illuminatedFraction: lunarPos.illuminationFraction ?? 0.5,
      phaseAngleDeg: lunarPos.phaseAngleDeg ?? 90,
      ascendingNodeLongitude: asDegrees(nodeLonDeg),
      descendingNodeLongitude: asDegrees(descNodeLonDeg),
      argumentOfLatitude: asDegrees(lunarPos.argumentOfLatitude ?? 0),
      isAscendingHemisphere: lunarBetaDeg >= 0,
      isWaxing: elongationDeg <= 180,
      quadrant
    },
    milestones,
    lunarOrbit,
    shadowCones,
    foci: {
      f1,
      f2,
      semiMajorAxis: a,
      semiMinorAxis: b,
      eccentricity: e,
      linearEccentricity: c
    },
    eclipse: {
      type: eclipse.type,
      label: eclipse.label,
      isEclipseActive: eclipse.isEclipseActive,
      obscuration: eclipse.obscuration,
      alignmentPercent: eclipse.alignmentPercent
    }
  };
}
