import React, { useState, useMemo } from 'react';
import { Moon } from 'lucide-react';
import {
  getJulianDate,
  projectSkyDomePoint,
  calculateCulminationBearing,
  calculateLunarExtremaCulminations,
  calculateMonthlyLunarDeclinationBounds,
  calculateSkyDomeLunarNodes,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
  calculateMeridianDiurnalPoint,
  calculateMeridianDiurnalChord,
  calculatePolarMeridianCounterpart,
  calculateLunarDeclinationVelocity,
} from '../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../types';
import { MeridianDomeBase, EL_CX, EL_CY, EL_R } from './MeridianDomeBase';
import { LunarPhaseDisc } from './common/LunarPhaseDisc';

export interface MoonMeridianDomeProps {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  initialNodalMode?: boolean;
  isNodalMode?: boolean;
  onToggleNodal?: () => void;
  hideFooter?: boolean;
  variant?: 'card' | 'embedded';
}

export const MoonMeridianDome: React.FC<MoonMeridianDomeProps> = ({
  orbitalData,
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  onSetTime: _onSetTime,
  initialNodalMode = false,
  isNodalMode,
  onToggleNodal,
  hideFooter = false,
  variant,
}) => {
  const [localNodalMode, setLocalNodalMode] = useState(initialNodalMode);
  const isNodalModeActive = isNodalMode !== undefined ? isNodalMode : localNodalMode;

  const handleToggleNodal = (val: boolean) => {
    if (onToggleNodal) {
      if (val !== isNodalModeActive) {
        onToggleNodal();
      }
    } else {
      setLocalNodalMode(val);
    }
  };

  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {
    transit: 12,
    declination: 0,
    parallacticAngle: 0,
  };
  const {
    transit = 12,
    declination = 0,
    parallacticAngle = 0,
  } = lunarEvents;

  const moonDeclination = (orbitalData?.lunarPos?.declination ?? declination ?? 0) as number;

  // --- Real-Time Moon Elevation & Meridian Diurnal Trajectory ---
  const moonHourAngle = (displayTime - transit) * 15;
  const currentMoonPos = projectSkyDomePoint(moonHourAngle, Number(moonDeclination), latitude);
  const currentMoonElevation = currentMoonPos.elevation;

  // Real-time instantaneous Moon position along continuous 3D diurnal path
  const activeMoonPoint = useMemo(
    () => calculateMeridianDiurnalPoint(latitude, Number(moonDeclination), moonHourAngle, 0),
    [latitude, moonDeclination, moonHourAngle]
  );

  // Today's Diurnal Chord in the Meridian projection (touching Meridian Arc at Lunar Transit)
  const todayChord = useMemo(
    () => calculateMeridianDiurnalChord(latitude, Number(moonDeclination), 0),
    [latitude, moonDeclination]
  );

  // --- Culminations & Bearings ---
  const absLat = Math.abs(latitude);
  const isPolar = absLat >= 89.9;

  const todayCulmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );
  const peakAlt = todayCulmination.altitude;

  // Major lunar standstill: 23.439° + 5.145° = 28.584°
  const LUNAR_MAX_DEC = 28.584;

  const standstillMax = useMemo(
    () => calculateCulminationBearing(latitude, LUNAR_MAX_DEC),
    [latitude]
  );
  const standstillMin = useMemo(
    () => calculateCulminationBearing(latitude, -LUNAR_MAX_DEC),
    [latitude]
  );

  // Monthly Declination Bounds over a rolling 30-day window (±15 days)
  const monthlyBounds = useMemo(
    () => calculateMonthlyLunarDeclinationBounds(currentDate),
    [currentDate]
  );

  const extremaCulminations = useMemo(
    () => calculateLunarExtremaCulminations(latitude, monthlyBounds.maxDec, monthlyBounds.minDec),
    [latitude, monthlyBounds.maxDec, monthlyBounds.minDec]
  );

  const monthMax = extremaCulminations.maxBound;
  const monthMin = extremaCulminations.minBound;

  // --- Nodal Kinematics & Color Conventions ---
  const jd = useMemo(() => getJulianDate(currentDate, displayTime), [currentDate, displayTime]);
  const solarNoon = solarData?.solarNoon ?? 12;
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;

  const nodalData = useMemo(() => {
    return calculateSkyDomeLunarNodes(
      latitude,
      jd,
      displayTime,
      solarNoon,
      sunLambda,
      {
        phaseValue: phase.value !== undefined ? Number(phase.value) : undefined,
        moonBeta: orbitalData?.lunarPos?.beta !== undefined ? Number(orbitalData.lunarPos.beta) : undefined,
      }
    );
  }, [latitude, jd, displayTime, solarNoon, sunLambda, phase.value, orbitalData?.lunarPos?.beta]);

  const isAscendingBranch = nodalData.isMoonAscending;
  // Eclipse-convention: Sky Blue for β >= 0 (North of ecliptic), Rose Red for β < 0 (South of ecliptic)
  const nodalThemeColor = isNodalModeActive
    ? (isAscendingBranch ? '#38bdf8' : '#f43f5e')
    : '#e2e8f0';
  const moonTrackDash = isNodalModeActive
    ? (nodalData.isWaxing ? undefined : '4 3')
    : undefined;

  // Ecliptic Node Crossing point on Meridian (where β = 0°)
  const eclipticCulmination = useMemo(() => {
    const eclipticDec = moonDeclination - nodalData.moonBeta;
    return calculateCulminationBearing(latitude, eclipticDec);
  }, [latitude, moonDeclination, nodalData.moonBeta]);

  const eclipticNodePoint = useMemo(
    () => calculateMeridianPoint(eclipticCulmination.altitude, eclipticCulmination.direction),
    [eclipticCulmination]
  );

  const eclipticNodeTick = useMemo(
    () => calculateMeridianRadialTick(eclipticNodePoint.thetaDeg, 86, 98),
    [eclipticNodePoint.thetaDeg]
  );

  // --- Meridian Coordinate Points on Dome Arc (R=92) ---
  const todayPeakPoint = useMemo(
    () => calculateMeridianPoint(peakAlt, todayCulmination.direction),
    [peakAlt, todayCulmination]
  );

  const standstillMaxPoint = useMemo(
    () => calculateMeridianPoint(standstillMax.altitude, standstillMax.direction),
    [standstillMax]
  );

  const standstillMinPoint = useMemo(
    () => calculateMeridianPoint(standstillMin.altitude, standstillMin.direction),
    [standstillMin]
  );

  const monthMaxPoint = useMemo(
    () => calculateMeridianPoint(monthMax.altitude, monthMax.direction),
    [monthMax]
  );

  const monthMinPoint = useMemo(
    () => calculateMeridianPoint(monthMin.altitude, monthMin.direction),
    [monthMin]
  );

  // --- Swath Arcs (along R=92 dome) ---
  const monthlySwathD = useMemo(
    () => generateMeridianSwathD(monthMinPoint.thetaDeg, monthMaxPoint.thetaDeg),
    [monthMinPoint.thetaDeg, monthMaxPoint.thetaDeg]
  );

  const standstillSwathD = useMemo(
    () => generateMeridianSwathD(standstillMinPoint.thetaDeg, standstillMaxPoint.thetaDeg),
    [standstillMinPoint.thetaDeg, standstillMaxPoint.thetaDeg]
  );

  // Option C: Standstill epoch is active if in Nodal Mode OR if monthly peak reaches within ~1° of 28.58° (Major Standstill season)
  const isStandstillEpoch = monthlyBounds.maxDec >= 27.5;
  const isStandstillActive = isNodalModeActive || isStandstillEpoch;

  const targetMaxPoint = isStandstillActive ? standstillMaxPoint : monthMaxPoint;
  const targetMinPoint = isStandstillActive ? standstillMinPoint : monthMinPoint;
  const targetMaxAlt = isStandstillActive ? standstillMax.altitude : monthMax.altitude;
  const targetMinAlt = isStandstillActive ? standstillMin.altitude : monthMin.altitude;
  const targetMaxTag = isStandstillActive ? standstillMax.shortTag : monthMax.shortTag;
  const targetMinTag = isStandstillActive ? standstillMin.shortTag : monthMin.shortTag;
  const targetTierLabel = isStandstillActive ? '18.6y Major Standstill' : 'Monthly Extrema';

  // Instantaneous lunar declination velocity to determine migration direction (approaching Max vs Min)
  const lunarVelocity = useMemo(() => calculateLunarDeclinationVelocity(jd), [jd]);
  const isApproachingMax = lunarVelocity.isApproachingMax;

  // Split Migration Swaths from Today's Lunar Transit Peak to Max and Min milestones
  const maxSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, targetMaxPoint.thetaDeg),
    [todayPeakPoint.thetaDeg, targetMaxPoint.thetaDeg]
  );

  const minSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, targetMinPoint.thetaDeg),
    [todayPeakPoint.thetaDeg, targetMinPoint.thetaDeg]
  );

  // Polar Latitudes: Counterpart pin, chord & bilateral migration swath across 180° antimeridian
  const polarMaxCounterpart = useMemo(() => {
    if (!isPolar) return null;
    return calculatePolarMeridianCounterpart(targetMaxPoint, EL_CX, EL_CY, EL_R, 87, 97);
  }, [isPolar, targetMaxPoint]);

  const polarLunarMaxCounterpartSwathD = useMemo(() => {
    if (!isPolar || !polarMaxCounterpart) return '';
    return generateMeridianSwathD(
      180 - todayPeakPoint.thetaDeg,
      polarMaxCounterpart.oppositePoint.thetaDeg
    );
  }, [isPolar, polarMaxCounterpart, todayPeakPoint.thetaDeg]);

  // --- Perpendicular Radial Tick Pins ---
  const standstillMaxTick = useMemo(
    () => calculateMeridianRadialTick(standstillMaxPoint.thetaDeg, 85, 99),
    [standstillMaxPoint.thetaDeg]
  );

  const standstillMinTick = useMemo(
    () => calculateMeridianRadialTick(standstillMinPoint.thetaDeg, 85, 99),
    [standstillMinPoint.thetaDeg]
  );

  const monthMaxTick = useMemo(
    () => calculateMeridianRadialTick(monthMaxPoint.thetaDeg, 87, 97),
    [monthMaxPoint.thetaDeg]
  );

  const monthMinTick = useMemo(
    () => calculateMeridianRadialTick(monthMinPoint.thetaDeg, 87, 97),
    [monthMinPoint.thetaDeg]
  );

  // Standstill total range in declination: 2 * 28.584° = 57.17°
  const standstillSpanDeg = 2 * LUNAR_MAX_DEC;

  return (
    <MeridianDomeBase
      title="Moon Meridian Profile"
      icon={Moon}
      iconColorClass={isNodalModeActive ? (isAscendingBranch ? 'text-sky-400' : 'text-rose-400') : 'text-slate-300'}
      peakLabel={isPolar ? 'Constant Altitude' : 'Transit Peak'}
      peakElevation={peakAlt}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={currentMoonElevation}
      elevationColorClass={isNodalModeActive ? (isAscendingBranch ? 'text-sky-300' : 'text-rose-300') : 'text-slate-200'}
      elevationStatusSubtitle={currentMoonElevation >= 0 ? 'Above Horizon' : 'Sub-Horizon'}
      latitude={latitude}
      variant={variant}
      bodyX={activeMoonPoint.x}
      bodyY={activeMoonPoint.y}
      bodyVectorStroke={currentMoonElevation >= 0 ? nodalThemeColor : '#475569'}
      renderBodyGraphic={() => (
        <g
          id="active-lunar-transit-bead"
          transform={`translate(${activeMoonPoint.x}, ${activeMoonPoint.y})`}
          className="drop-shadow-md"
          opacity={activeMoonPoint.isParked ? 0.35 : (currentMoonElevation >= 0 ? 1.0 : 0.45)}
        >
          <LunarPhaseDisc
            radius={5.5}
            phaseValue={phase.value ?? 0}
            parallacticAngle={parallacticAngle || 0}
            rimStroke={nodalThemeColor}
            rimStrokeWidth={1.2}
            rimStrokeOpacity={activeMoonPoint.isParked ? 0.5 : 0.9}
            rimStrokeDasharray={activeMoonPoint.isParked ? '1.5 1.5' : undefined}
          />
          <title>
            {activeMoonPoint.isParked
              ? 'Moon below Horizon · Parked at Horizon Gate'
              : `Current Moon Elevation: ${currentMoonElevation >= 0 ? '+' : ''}${currentMoonElevation.toFixed(1)}° (${isNodalModeActive ? (isAscendingBranch ? 'β ≥ 0° North of Ecliptic' : 'β < 0° South of Ecliptic') : phase.name})`}
          </title>
        </g>
      )}
      swaths={[
        ...(isStandstillActive
          ? (monthlySwathD
              ? [
                  {
                    id: 'monthly-lunar-swath-guide',
                    d: monthlySwathD,
                    stroke: '#94a3b8',
                    strokeWidth: 0.85,
                    strokeDasharray: '2 3',
                    strokeOpacity: 0.30,
                    title: `Monthly Lunar Transit Range: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'} to ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}`,
                  },
                ]
              : [])
          : (standstillSwathD
              ? [
                  {
                    id: 'standstill-swath-guide',
                    d: standstillSwathD,
                    stroke: '#818cf8',
                    strokeWidth: 0.85,
                    strokeDasharray: '2 3',
                    strokeOpacity: 0.25,
                    title: `18.6-Year Major Standstill Range: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'} to ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}`,
                  },
                ]
              : [])),
        ...(maxSwathD
          ? [
              {
                id: 'lunar-migration-swath-max',
                d: maxSwathD,
                stroke: isNodalModeActive ? nodalThemeColor : isStandstillActive ? '#818cf8' : '#e0e7ff',
                strokeWidth: isApproachingMax ? 1.4 : 0.9,
                strokeDasharray: '3 2',
                strokeOpacity: isApproachingMax ? 0.90 : 0.40,
                glow: true,
                glowWidth: 4,
                glowOpacity: isApproachingMax ? 0.25 : 0.10,
                title: `${targetTierLabel} Max Arc: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${targetMaxAlt.toFixed(1)}° ${targetMaxTag}${isApproachingMax ? ' (Approaching Peak)' : ''}`,
              },
            ]
          : []),
        ...(minSwathD
          ? [
              {
                id: 'lunar-migration-swath-min',
                d: minSwathD,
                stroke: isNodalModeActive ? (isAscendingBranch ? '#f43f5e' : '#38bdf8') : isStandstillActive ? '#6366f1' : '#94a3b8',
                strokeWidth: !isApproachingMax ? 1.4 : 0.9,
                strokeDasharray: '3 2',
                strokeOpacity: !isApproachingMax ? 0.90 : 0.40,
                glow: true,
                glowWidth: 4,
                glowOpacity: !isApproachingMax ? 0.25 : 0.10,
                title: `${targetTierLabel} Min Arc: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${targetMinAlt > 0 ? targetMinAlt.toFixed(1) + '° ' + targetMinTag : 'Below 0°'}${!isApproachingMax ? ' (Approaching Trough)' : ''}`,
              },
            ]
          : []),
        ...(isPolar && polarLunarMaxCounterpartSwathD && targetMaxAlt >= 0
          ? [
              {
                id: 'polar-counterpart-lunar-max-swath',
                d: polarLunarMaxCounterpartSwathD,
                stroke: isStandstillActive ? '#818cf8' : '#e0e7ff',
                strokeWidth: isApproachingMax ? 1.4 : 0.9,
                strokeDasharray: '3 2',
                strokeOpacity: isApproachingMax ? 0.85 : 0.35,
                glow: true,
                glowWidth: 4,
                glowOpacity: isApproachingMax ? 0.25 : 0.10,
                title: `Polar Lunar Max Antimeridian Arc (180°): ${targetMaxAlt.toFixed(1)}° (${isApproachingMax ? 'Approaching Peak' : 'Receding'})`,
              },
            ]
          : []),
      ]}
      radialTicks={[
        {
          id: 'standstill-max-tick',
          tick: standstillMaxTick,
          stroke: '#818cf8',
          strokeWidth: isStandstillActive ? 1.4 : 1.1,
          strokeDasharray: isStandstillActive ? undefined : '2 1',
          title: `Major Standstill Max: ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}${isStandstillActive ? ' (Active Standstill Target)' : ''}`,
        },
        {
          id: 'standstill-min-tick',
          tick: standstillMinTick,
          stroke: '#6366f1',
          strokeWidth: isStandstillActive ? 1.4 : 1.1,
          strokeDasharray: isStandstillActive ? undefined : '2 1',
          title: `Major Standstill Min: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'}${isStandstillActive ? ' (Active Standstill Target)' : ''}`,
        },
        {
          id: 'monthly-max-tick',
          tick: monthMaxTick,
          stroke: '#e2e8f0',
          strokeWidth: !isStandstillActive ? 1.4 : 1.1,
          title: `Monthly Max Transit Peak: ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}${!isStandstillActive ? ' (Active Monthly Target)' : ''}`,
        },
        {
          id: 'monthly-min-tick',
          tick: monthMinTick,
          stroke: '#94a3b8',
          strokeWidth: !isStandstillActive ? 1.4 : 1.1,
          title: `Monthly Min Transit Peak: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'}${!isStandstillActive ? ' (Active Monthly Target)' : ''}`,
        },
        ...(isPolar && polarMaxCounterpart && targetMaxAlt >= 0
          ? [
              {
                id: 'polar-counterpart-lunar-max-tick',
                tick: polarMaxCounterpart.oppositeTick,
                stroke: isStandstillActive ? '#818cf8' : '#e2e8f0',
                strokeWidth: 1.4,
                title: `Polar Lunar Max 24h Antimeridian (180°) Culmination: ${targetMaxAlt.toFixed(1)}° (${targetTierLabel})`,
              },
            ]
          : []),
      ]}
      geometryGroupId="meridian-lunar-geometry"
      geometryGroupClassName="meridian-lunar-geometry"
      extraMeridianSvg={
        (isPolar && polarMaxCounterpart && targetMaxAlt >= 0) || isNodalModeActive ? (
          <>
            {isPolar && polarMaxCounterpart && targetMaxAlt >= 0 && (
              <g id="polar-lunar-solstice-chord">
                <path
                  id="polar-lunar-max-chord"
                  d={polarMaxCounterpart.chordD}
                  fill="none"
                  stroke={isStandstillActive ? '#818cf8' : '#cbd5e1'}
                  strokeWidth={0.9}
                  strokeDasharray="3 2"
                  strokeOpacity={0.6}
                >
                  <title>{`Polar Lunar Maximum Diurnal Parallel (${targetMaxAlt.toFixed(1)}°): Constant 24h altitude across 0° and 180° meridians`}</title>
                </path>
              </g>
            )}
            {isNodalModeActive && (
              <g id="meridian-ecliptic-node-marker">
                <line
                  x1={eclipticNodeTick.x1}
                  y1={eclipticNodeTick.y1}
                  x2={eclipticNodeTick.x2}
                  y2={eclipticNodeTick.y2}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <text
                  x={eclipticNodePoint.x + (eclipticNodePoint.x > EL_CX ? 7 : -7)}
                  y={eclipticNodePoint.y - 2}
                  textAnchor="middle"
                  className="text-[6.5px] font-mono font-bold fill-sky-300 pointer-events-none select-none"
                >
                  {nodalData.isMoonAscending ? '☊' : '☋'}
                </text>
                <title>{`Ecliptic Node Level (β = 0°): ${eclipticCulmination.altitude.toFixed(1)}° ${eclipticCulmination.shortTag}`}</title>
              </g>
            )}
          </>
        ) : null
      }
      todayChordConfig={{
        daylightId: 'moon-today-diurnal-chord',
        chord: todayChord,
        stroke: nodalThemeColor,
        strokeWidth: 1.5,
        strokeDasharray: moonTrackDash,
        strokeOpacity: 0.95,
        glow: true,
        glowWidth: 3.5,
        glowOpacity: 0.25,
        daylightTitle: `Today's Lunar Diurnal Path (Transit Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag})`,
      }}
      gateAnchor={{
        id: 'moon-horizon-gate-anchor',
        x: todayChord.anchorPoint.x,
        y: todayChord.anchorPoint.y,
        r: 3.5,
        stroke: '#64748b',
        title: 'Lunar Horizon Gate (0°): Setting & Rising Station',
      }}
      peakTarget={{
        id: 'meridian-transit-peak-target',
        peakPoint: todayPeakPoint,
        stroke: nodalThemeColor,
        title: `Today's Transit Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag}`,
      }}
    >
      {!hideFooter && (
        <>
          {/* Standstill Limits & Monthly Range or Nodal Telemetry Stats Strip */}
          {!isNodalModeActive ? (
            <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-slate-400">Max Standstill:</span>
                <strong className="text-indigo-300 font-semibold">{standstillMax.altitude.toFixed(1)}° {standstillMax.shortTag}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span className="text-slate-400">Min Standstill:</span>
                <strong className="text-indigo-500 font-semibold">
                  {standstillMin.altitude > 0 ? `${standstillMin.altitude.toFixed(1)}° ${standstillMin.shortTag}` : 'Below 0°'}
                </strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Monthly:</span>
                <strong className="text-slate-300 font-semibold">
                  {monthMin.altitude.toFixed(1)}° ↔ {monthMax.altitude.toFixed(1)}°
                </strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAscendingBranch ? 'bg-sky-400' : 'bg-rose-400'}`} />
                <span className="text-slate-400">Ecliptic Lat (β):</span>
                <strong className={isAscendingBranch ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                  {nodalData.moonBeta >= 0 ? `+${nodalData.moonBeta.toFixed(2)}°` : `${nodalData.moonBeta.toFixed(2)}°`}
                </strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-sans">Next Node:</span>
                <strong className={nodalData.upcomingNodeType === 'ascending' ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                  {nodalData.upcomingNodeType === 'ascending' ? '☊' : '☋'} {nodalData.daysToNextNode <= 0.5 ? `${Math.max(1, Math.round(nodalData.daysToNextNode * 24))}h` : `${nodalData.daysToNextNode.toFixed(1)}d`}
                </strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Branch:</span>
                <strong className={isAscendingBranch ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                  {isAscendingBranch ? 'North (+β)' : 'South (−β)'}
                </strong>
              </div>
            </div>
          )}

          {/* Mirrored 4-Badge Summary Footer with Mode View Toggle (Std vs ☊ Nodes) */}
          <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
            <div 
              className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
              title={`18.6-Year Standstill Range: Δδ = ${standstillSpanDeg.toFixed(1)}° between ±${LUNAR_MAX_DEC.toFixed(1)}°${isStandstillActive ? ' (Standstill Migration Track Active)' : ''}`}
            >
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
                Standstill Span
              </span>
              <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${isStandstillActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                Δδ {standstillSpanDeg.toFixed(1)}°
              </span>
              <span className={`text-[8px] font-mono block whitespace-nowrap truncate leading-none mt-0.5 ${isStandstillActive ? 'text-indigo-400 font-medium' : 'text-slate-400'}`}>
                {isStandstillActive ? '18.6y Track Active' : '18.6y Cycle'}
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Monthly Range</span>
              <span className="text-indigo-300 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                {(monthMax.altitude - Math.max(0, monthMin.altitude)).toFixed(1)}°
              </span>
              <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                30d Envelope
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Nodal State</span>
              <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${isNodalModeActive ? (isAscendingBranch ? 'text-sky-300' : 'text-rose-300') : 'text-slate-300'}`}>
                {isNodalModeActive ? (isAscendingBranch ? '☊ Ascending' : '☋ Descending') : 'Mean Orbit'}
              </span>
              <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                {isNodalModeActive ? (isAscendingBranch ? 'North (+β)' : 'South (−β)') : '18.6y Precession'}
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate mb-0.5">Mode View</span>
              <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
                <button
                  type="button"
                  onClick={() => handleToggleNodal(false)}
                  aria-label="Standard Lunar Meridian View"
                  className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                    !isNodalModeActive
                      ? 'bg-slate-800 text-slate-200 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Std
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleNodal(true)}
                  aria-label="Lunar Nodes Meridian View"
                  className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                    isNodalModeActive
                      ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ☊ Nodes
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </MeridianDomeBase>
  );
};

export default MoonMeridianDome;
