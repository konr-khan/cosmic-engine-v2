import { useMemo } from 'react';
import { EclipseData } from '../../../../types';
import { 
  clamp, 
  calculateEarthOrbitalPhysics, 
  getJulianDate, 
  generateOrbitalSegments,
  toRadians,
  calculateNodalOrbitalAngles,
  J2000_DATE,
  type OrbitalSegments
} from '../../../../utils/cosmicMath';

export type { OrbitalSegments };

export interface UseNodalPlaneMathParams {
  eclipse?: EclipseData | null;
  currentDate?: Date;
}

export interface UseNodalPlaneMathResult {
  beta: number;
  distKm: number;
  offsetKm: number;
  umbraRadKm: number;
  isInsideUmbra: boolean;
  sunAngularDiamArcmin: number;
  sunLambdaDeg: number;
  moonDistKm: number;
  moonAngularDiamArcmin: number;
  axialSunRadius: number;
  axialMoonRadius: number;
  isTotalCapable: boolean;
  centerX: number;
  centerY: number;
  orbitalRx: number;
  scalePxPerDeg: number;
  nodeAngleRad: number;
  isAscending: boolean;
  phaseVal: number;
  phaseRad: number;
  isWaxing: boolean;
  moonX: number;
  moonY: number;
  orbitalSegments: OrbitalSegments;
  ascNodeX: number;
  ascNodeY: number;
  descNodeX: number;
  descNodeY: number;
  ascNodeDepth: number;
  descNodeDepth: number;
  isAscBehindEarth: boolean;
  isDescBehindEarth: boolean;
  moonDepth: number;
  isNearSide: boolean;
  distFromEarthCenter: number;
  isMoonOccludedByEarth: boolean;
}

const EMPTY_ORBITAL_SEGMENTS: OrbitalSegments = {
  waxAsc: [],
  waxDesc: [],
  wanAsc: [],
  wanDesc: [],
  nearWaxAsc: [],
  nearWaxDesc: [],
  nearWanAsc: [],
  nearWanDesc: [],
  farWaxAsc: [],
  farWaxDesc: [],
  farWanAsc: [],
  farWanDesc: []
};

export function useNodalPlaneMath(params: UseNodalPlaneMathParams): UseNodalPlaneMathResult | null {
  const { eclipse, currentDate = J2000_DATE } = params;

  const solarPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(getJulianDate(currentDate, 12)),
    [currentDate]
  );

  const orbitalSegments = useMemo<OrbitalSegments>(() => {
    if (!eclipse) return EMPTY_ORBITAL_SEGMENTS;
    const nodeAngleRad = toRadians(eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0));
    return generateOrbitalSegments(
      260,
      110,
      150,
      10.5,
      nodeAngleRad,
      'axial',
      72
    );
  }, [eclipse]);

  if (!eclipse) return null;

  const beta = eclipse.beta; // Ecliptic latitude: -5.14° to +5.14°
  const distKm = eclipse.distanceKm || 384400;
  const offsetKm = Math.round(distKm * Math.sin(toRadians(beta)));
  const umbraRadKm = eclipse.umbraRadiusKm || 4600;
  const isInsideUmbra = Math.abs(offsetKm) <= umbraRadKm;

  // --- Dynamic Distance & Apparent Angular Size Scaling ---
  const sunAngularDiamArcmin = solarPhysics.sunAngularDiameterArcmin; // ~31.5' (Aphelion) to ~32.5' (Perihelion)
  const sunLambdaDeg = ((solarPhysics?.lambda ?? solarPhysics?.eclipticLongitude ?? 0) as number);

  const moonDistKm = eclipse.distanceKm || 384400;
  const moonAngularDiamArcmin = 31.13 * (384400 / moonDistKm); // ~29.4' (Apogee) to ~33.5' (Perigee)

  // Apparent radii in SVG pixels (scaled so Earth is prominent and Moon is distinct)
  const axialSunRadius = 46;
  const axialMoonRadius = clamp(10.5 * (moonAngularDiamArcmin / 31.13), 8.5, 12.5);
  const isTotalCapable = moonAngularDiamArcmin >= sunAngularDiamArcmin;

  // --- Orbital Geometry in Axial Projection (3D Elliptical Orbital Loop) ---
  const centerX = 260;
  const centerY = 110;
  const orbitalRx = 150;
  const scalePxPerDeg = 10.5;
  
  // Real-time seasonal nodal orientation across the sightline:
  const nodeAngleRad = toRadians(eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0));
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);

  const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 0.5 (Full Moon) to 1.0
  const phaseRad = phaseVal * 2 * Math.PI;
  const isWaxing = phaseVal <= 0.5;

  // Transverse displacement perpendicular to the Sun-Earth sightline:
  // Prograde West-to-East orbit: Waxing moves East (left, -X), Waning moves West (right, +X)
  const moonX = centerX - (Math.sin(phaseRad) * orbitalRx);
  const moonY = centerY - (beta * scalePxPerDeg);

  // Node Positions where orbital loop crosses horizontal ecliptic plane (Y = 110)
  const { tAsc, tDesc } = calculateNodalOrbitalAngles(nodeAngleRad);
  const ascNodeX = centerX - (Math.sin(tAsc) * orbitalRx);
  const ascNodeY = centerY;
  const descNodeX = centerX - (Math.sin(tDesc) * orbitalRx);
  const descNodeY = centerY;

  // Node 3D Depth along Sun-Earth sightline (-cos(t) * rx: Z > 0 is near-side in front of Earth, Z <= 0 is far-side behind Earth, Dead End #33)
  const ascNodeDepth = -Math.cos(tAsc) * orbitalRx;
  const descNodeDepth = -Math.cos(tDesc) * orbitalRx;
  const isAscBehindEarth = ascNodeDepth <= 0 && Math.abs(ascNodeX - centerX) <= 24;
  const isDescBehindEarth = descNodeDepth <= 0 && Math.abs(descNodeX - centerX) <= 24;

  // --- 3D Depth Sorting along Sun-Earth Sightline ---
  // Camera looks from deep space (+Z) toward background Sun (-Z) through Earth (Z=0).
  // Moon depth Z = -cos(phaseRad) * orbitalRx:
  // - Z > 0: Near side (First Qtr -> Full Moon -> Third Qtr, in front of Earth towards camera/shadows)
  // - Z <= 0: Far side (Third Qtr -> New Moon -> First Qtr, behind Earth towards background Sun)
  const moonDepth = -Math.cos(phaseRad) * orbitalRx;
  const isNearSide = moonDepth > 0;
  const distFromEarthCenter = Math.hypot(moonX - centerX, moonY - centerY);
  const isMoonOccludedByEarth = !isNearSide && distFromEarthCenter < 24 + axialMoonRadius;

  return {
    beta,
    distKm,
    offsetKm,
    umbraRadKm,
    isInsideUmbra,
    sunAngularDiamArcmin,
    sunLambdaDeg,
    moonDistKm,
    moonAngularDiamArcmin,
    axialSunRadius,
    axialMoonRadius,
    isTotalCapable,
    centerX,
    centerY,
    orbitalRx,
    scalePxPerDeg,
    nodeAngleRad,
    isAscending,
    phaseVal,
    phaseRad,
    isWaxing,
    moonX,
    moonY,
    orbitalSegments,
    ascNodeX,
    ascNodeY,
    descNodeX,
    descNodeY,
    ascNodeDepth,
    descNodeDepth,
    isAscBehindEarth,
    isDescBehindEarth,
    moonDepth,
    isNearSide,
    distFromEarthCenter,
    isMoonOccludedByEarth
  };
}
