import { useMemo } from 'react';
import { EclipseData } from '../../../../types';
import { Vector3D } from '../../../../types/coordinates';
import {
  generateOrbitalSegments,
  toRadians,
  calculateNodalOrbitalAngles
} from '../../../../utils/cosmicMath';

export interface UseSyzygyMathResult {
  beta: number;
  phaseVal: number;
  phaseDeg: number;
  isAscending: boolean;
  isWaxing: boolean;
  liveEarthX: number;
  liveEarthY: number;
  liveMoonX: number;
  liveMoonY: number;
  waxAsc: string[];
  waxDesc: string[];
  wanAsc: string[];
  wanDesc: string[];
  ascNodeX: number;
  ascNodeY: number;
  descNodeX: number;
  descNodeY: number;
  isAscBehindEarth: boolean;
  isDescBehindEarth: boolean;
  moonSubsolarVector: Vector3D;
}

const LIVE_EARTH_X = 310;
const LIVE_EARTH_Y = 110;
const LIVE_ORBITAL_RX = 85;
const SCALE_PX_PER_DEG = 8.5;

/**
 * Memoizes 72-sample 4-quadrant orbital paths, nodal line intersections,
 * 3D Earth-disc occlusion flags, and camera-space lunar terminator vectors
 * for LiveSyzygyView so pointer-hover re-renders do not recompute trig loops.
 */
export function useSyzygyMath(eclipse: EclipseData): UseSyzygyMathResult {
  const beta = eclipse.beta;
  const phaseVal = eclipse.phaseValue || 0;
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);
  const nodeAngleInputDeg = eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0);

  const orbitalGeometry = useMemo(() => {
    const nodeAngleRad = toRadians(nodeAngleInputDeg);
    const { waxAsc, waxDesc, wanAsc, wanDesc } = generateOrbitalSegments(
      LIVE_EARTH_X,
      LIVE_EARTH_Y,
      LIVE_ORBITAL_RX,
      SCALE_PX_PER_DEG,
      nodeAngleRad,
      'side',
      72
    );

    const { tAsc, tDesc } = calculateNodalOrbitalAngles(nodeAngleRad);
    const ascNodeX = LIVE_EARTH_X - Math.cos(tAsc) * LIVE_ORBITAL_RX;
    const ascNodeY = LIVE_EARTH_Y;
    const descNodeX = LIVE_EARTH_X - Math.cos(tDesc) * LIVE_ORBITAL_RX;
    const descNodeY = LIVE_EARTH_Y;

    const ascNodeDepth = Math.sin(tAsc) * LIVE_ORBITAL_RX;
    const descNodeDepth = Math.sin(tDesc) * LIVE_ORBITAL_RX;
    const isAscBehindEarth = ascNodeDepth <= 0 && Math.abs(ascNodeX - LIVE_EARTH_X) <= 18;
    const isDescBehindEarth = descNodeDepth <= 0 && Math.abs(descNodeX - LIVE_EARTH_X) <= 18;

    return {
      waxAsc,
      waxDesc,
      wanAsc,
      wanDesc,
      ascNodeX,
      ascNodeY,
      descNodeX,
      descNodeY,
      isAscBehindEarth,
      isDescBehindEarth
    };
  }, [nodeAngleInputDeg]);

  return useMemo(() => {
    const phaseRad = phaseVal * 2 * Math.PI;
    const phaseDeg = Math.round(phaseVal * 360);
    const isWaxing = phaseVal < 0.5;
    const liveMoonX = LIVE_EARTH_X - Math.cos(phaseRad) * LIVE_ORBITAL_RX;
    const liveMoonY = LIVE_EARTH_Y - beta * SCALE_PX_PER_DEG;

    const dx = 50 - liveMoonX;
    const dy = 110 - liveMoonY;
    const dz = -(Math.sin(phaseRad) * LIVE_ORBITAL_RX);
    const vx = dx;
    const vy = -dy;
    const vz = -dz;
    const len = Math.hypot(vx, vy, vz) || 1;
    const moonSubsolarVector: Vector3D = {
      x: vx / len,
      y: vy / len,
      z: vz / len
    };

    return {
      beta,
      phaseVal,
      phaseDeg,
      isAscending,
      isWaxing,
      liveEarthX: LIVE_EARTH_X,
      liveEarthY: LIVE_EARTH_Y,
      liveMoonX,
      liveMoonY,
      ...orbitalGeometry,
      moonSubsolarVector
    };
  }, [beta, phaseVal, isAscending, orbitalGeometry]);
}
