import { useMemo } from 'react';
import { 
  toRadians, 
  getJulianDate, 
  calculateLunarPosition, 
  calculateTrueLunarNodeEvents 
} from '../../../../utils/cosmicMath';
import { TidalVectors } from '../../../../types';
import { OrbitalAngles } from '../../../../types/coordinates';

export interface UseTideMathParams {
  tides?: TidalVectors | null;
  angles?: Partial<OrbitalAngles> | null;
  localTideStatus?: "High Tide" | "Low Tide" | string;
  phaseValue?: number;
  timeOfDay?: number;
  sunLambdaDeg?: number;
  nodeLongitude?: number;
  moonBetaDeg?: number;
  currentDate?: Date;
  julianDate?: number;
}

export interface NodalSegments {
  waxAsc: string;
  waxDesc: string;
  wanAsc: string;
  wanDesc: string;
}

export interface NodePositions {
  asc: { x: number; y: number };
  desc: { x: number; y: number };
}

export interface UseTideMathResult {
  safeTides: TidalVectors;
  safeAngles: Partial<OrbitalAngles>;
  safeLocalTideStatus: string;
  computedPhaseValue: number;
  tideTextColor: string;
  localTideColor: string;
  sunAngleDeg: number;
  isLeftHemisphere: boolean;
  safeSunLambda: number;
  trueAscNodeLon: number;
  trueDescNodeLon: number;
  thetaNodeDeg: number;
  thetaDescNodeDeg: number;
  nodalSegments: NodalSegments;
  nodePos: NodePositions;
  moonAngleDeg: number;
  moonRad: number;
  moonX: number;
  moonY: number;
  isMoonAsc: boolean;
}

export function useTideMath(params: UseTideMathParams): UseTideMathResult {
  const {
    tides,
    angles,
    localTideStatus,
    phaseValue,
    timeOfDay = 12.0,
    sunLambdaDeg = 0,
    nodeLongitude,
    moonBetaDeg,
    currentDate,
    julianDate
  } = params;

  const safeTides = tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const safeAngles: Partial<OrbitalAngles> = angles || { sunDegrees: 0, moonDegrees: 0 };
  const safeLocalTideStatus = localTideStatus || "Low Tide";

  // Compute lunar phase value (0 to 1) if not explicitly provided
  const computedPhaseValue = phaseValue !== undefined
    ? phaseValue
    : (((safeAngles.moonDegrees || 0) - (safeAngles.sunDegrees || 0) + 360) % 360) / 360;

  const tideTextColor =
    (safeTides.alignment || 0) > 0 ? "text-indigo-400" : "text-amber-400";
  const localTideColor =
    safeLocalTideStatus === "High Tide" ? "text-sky-400" : "text-slate-400";

  // Refined "TO SUN" Rotation Logic (Prograde counter-clockwise in SVG where +Y is down)
  const rawSunAngle = Number(safeAngles.sunDegrees) || 0;
  const sunAngleDeg = -rawSunAngle;
  const isLeftHemisphere = Math.cos(toRadians(sunAngleDeg)) < 0;

  // Ascending and Descending Node Angular Locations on the 2D Orbital Circle
  const safeNodeLon = Number(nodeLongitude ?? safeAngles.nodeLongitude) || 0;
  const safeSunLambda = Number(sunLambdaDeg) || 0;
  const rawNodeDelta = ((safeNodeLon - safeSunLambda) % 360 + 360) % 360;
  const rawNodeDeg = ((rawSunAngle + rawNodeDelta) % 360 + 360) % 360;
  const rawDescNodeDeg = (rawNodeDeg + 180) % 360;

  // True Lunar Node Crossings (where true ecliptic latitude beta = 0, Dead End #16)
  const { trueAscNodeLon, trueDescNodeLon } = useMemo(() => {
    const jd = julianDate !== undefined
      ? julianDate
      : (currentDate !== undefined ? getJulianDate(currentDate, timeOfDay) : null);

    if (jd !== null) {
      const trueEvents = calculateTrueLunarNodeEvents(jd, 16);
      const ascCrossings = trueEvents.allCrossings.filter((c: { type: string }) => c.type === 'ascending');
      const descCrossings = trueEvents.allCrossings.filter((c: { type: string }) => c.type === 'descending');

      const ascCrossing = ascCrossings.sort((a: { daysOffset: number }, b: { daysOffset: number }) => Math.abs(a.daysOffset) - Math.abs(b.daysOffset))[0];
      const descCrossing = descCrossings.sort((a: { daysOffset: number }, b: { daysOffset: number }) => Math.abs(a.daysOffset) - Math.abs(b.daysOffset))[0];

      if (ascCrossing && descCrossing) {
        const ascPos = calculateLunarPosition(ascCrossing.jd);
        const descPos = calculateLunarPosition(descCrossing.jd);
        return {
          trueAscNodeLon: Number(ascPos.lambda),
          trueDescNodeLon: Number(descPos.lambda)
        };
      }
    }

    return {
      trueAscNodeLon: rawNodeDeg,
      trueDescNodeLon: rawDescNodeDeg
    };
  }, [julianDate, currentDate, timeOfDay, rawNodeDeg, rawDescNodeDeg]);

  const thetaNodeDeg = -trueAscNodeLon;
  const thetaDescNodeDeg = -trueDescNodeLon;

  // 4-Quadrant Nodal Orbital Loop Segments (Waxing/Waning x Ascending/Descending)
  const nodalSegments = useMemo<NodalSegments>(() => {
    const steps = 72;
    const r = 60;
    const waxAsc: string[] = [];
    const waxDesc: string[] = [];
    const wanAsc: string[] = [];
    const wanDesc: string[] = [];

    const totalAscArc = ((trueDescNodeLon - trueAscNodeLon) % 360 + 360) % 360;

    for (let i = 0; i < steps; i++) {
      const deg1 = (i / steps) * 360;
      const deg2 = ((i + 1) / steps) * 360;
      // Negate angle for prograde counter-clockwise motion in SVG (+Y is down)
      const rad1 = toRadians(-deg1);
      const rad2 = toRadians(-deg2);

      const x1 = r * Math.cos(rad1);
      const y1 = r * Math.sin(rad1);
      const x2 = r * Math.cos(rad2);
      const y2 = r * Math.sin(rad2);

      const midDeg = (deg1 + deg2) / 2;
      const elong = ((midDeg - rawSunAngle) % 360 + 360) % 360;
      const deltaFromAsc = ((midDeg - trueAscNodeLon) % 360 + 360) % 360;

      const isWax = elong <= 180;
      const isAsc = deltaFromAsc <= totalAscArc;

      const seg = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      if (isWax) {
        if (isAsc) waxAsc.push(seg);
        else waxDesc.push(seg);
      } else {
        if (isAsc) wanAsc.push(seg);
        else wanDesc.push(seg);
      }
    }

    return {
      waxAsc: waxAsc.join(' '),
      waxDesc: waxDesc.join(' '),
      wanAsc: wanAsc.join(' '),
      wanDesc: wanDesc.join(' ')
    };
  }, [rawSunAngle, trueAscNodeLon, trueDescNodeLon]);

  // Node Pins Positions (R = 60px)
  const nodePos = useMemo<NodePositions>(() => {
    const radAsc = toRadians(thetaNodeDeg);
    const radDesc = toRadians(thetaDescNodeDeg);
    return {
      asc: { x: 60 * Math.cos(radAsc), y: 60 * Math.sin(radAsc) },
      desc: { x: 60 * Math.cos(radDesc), y: 60 * Math.sin(radDesc) }
    };
  }, [thetaNodeDeg, thetaDescNodeDeg]);

  // Moon Position & Nodal State (Prograde counter-clockwise in SVG)
  const rawMoonAngle = Number(safeAngles.moonDegrees) || 0;
  const moonAngleDeg = -rawMoonAngle;
  const moonRad = toRadians(moonAngleDeg);
  const moonX = 60 * Math.cos(moonRad);
  const moonY = 60 * Math.sin(moonRad);

  const isMoonAsc = moonBetaDeg !== undefined
    ? moonBetaDeg >= 0
    : (((rawMoonAngle - trueAscNodeLon) % 360 + 360) % 360 <= ((trueDescNodeLon - trueAscNodeLon) % 360 + 360) % 360);

  return {
    safeTides,
    safeAngles,
    safeLocalTideStatus,
    computedPhaseValue,
    tideTextColor,
    localTideColor,
    sunAngleDeg,
    isLeftHemisphere,
    safeSunLambda,
    trueAscNodeLon,
    trueDescNodeLon,
    thetaNodeDeg,
    thetaDescNodeDeg,
    nodalSegments,
    nodePos,
    moonAngleDeg,
    moonRad,
    moonX,
    moonY,
    isMoonAsc
  };
}
