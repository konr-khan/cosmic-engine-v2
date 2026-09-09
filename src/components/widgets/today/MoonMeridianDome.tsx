import React, { useState, useMemo } from 'react';
import { Moon } from 'lucide-react';
import {
  formatTime,
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
} from '../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../types';
import { SkyDomeBase, EL_CX, EL_CY } from './SkyDomeBase';

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
  const todayCulmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );
  const peakAlt = todayCulmination.altitude;

  // Major lunar standstill: 23.439° + 5.145° = 28.584°
  const LUNAR_MAX_DEC = 28.584;
  const absLat = Math.abs(latitude);
  const isLunarTropical = absLat <= LUNAR_MAX_DEC;

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
    <SkyDomeBase
      title="Moon Meridian Profile"
      icon={Moon}
      iconColorClass={isNodalModeActive ? (isAscendingBranch ? 'text-sky-400' : 'text-rose-400') : 'text-slate-300'}
      peakLabel="Transit Peak"
      peakElevation={peakAlt}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={currentMoonElevation}
      elevationColorClass={isNodalModeActive ? (isAscendingBranch ? 'text-sky-300' : 'text-rose-300') : 'text-slate-200'}
      elevationStatusSubtitle={currentMoonElevation >= 0 ? 'Above Horizon' : 'Sub-Horizon'}
      leftHorizonLabel="S"
      centerHorizonLabel="Z"
      rightHorizonLabel="N"
      showZenithAxis={true}
      latitude={latitude}
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
          {/* Dark Body Base Disc */}
          <circle cx="0" cy="0" r="5.5" fill="#020617" stroke="#334155" strokeWidth="0.75" />

          {/* Phase Illuminated Geometry */}
          <g transform={`rotate(${parallacticAngle || 0})`}>
            {(() => {
              const pVal = phase.value ?? 0;
              if (pVal > 0.48 && pVal < 0.52) {
                return <circle cx="0" cy="0" r="5.5" fill="#f8fafc" />;
              }
              if (pVal > 0.02 && pVal < 0.98) {
                const isWaxing = pVal < 0.5;
                const startY = isWaxing ? -5.5 : 5.5;
                const endY = isWaxing ? 5.5 : -5.5;
                const rxAbs = Math.abs(5.5 * Math.cos(pVal * 2 * Math.PI));
                let termSweep: number;
                if (isWaxing) {
                  termSweep = pVal < 0.25 ? 0 : 1;
                } else {
                  termSweep = pVal < 0.75 ? 1 : 0;
                }
                const d = `M 0,${startY} A 5.5,5.5 0 0,1 0,${endY} A ${rxAbs.toFixed(2)},5.5 0 0,${termSweep} 0,${startY}`;
                return <path d={d} fill="#f8fafc" />;
              }
              return null;
            })()}
          </g>

          {/* Specular Rim with Nodal Color Encoding */}
          <circle
            cx="0"
            cy="0"
            r="5.5"
            fill="none"
            stroke={nodalThemeColor}
            strokeWidth="1.2"
            strokeDasharray={activeMoonPoint.isParked ? '1.5 1.5' : undefined}
            strokeOpacity={activeMoonPoint.isParked ? 0.5 : 0.9}
          />
          <title>
            {activeMoonPoint.isParked
              ? 'Moon below Horizon · Parked at Horizon Gate'
              : `Current Moon Elevation: ${currentMoonElevation >= 0 ? '+' : ''}${currentMoonElevation.toFixed(1)}° (${isNodalModeActive ? (isAscendingBranch ? 'β ≥ 0° North of Ecliptic' : 'β < 0° South of Ecliptic') : phase.name})`}
          </title>
        </g>
      )}
      extraSvgContent={
        <g className="meridian-lunar-geometry" id="meridian-lunar-geometry">
          {/* 18.6-Year Major Standstill Bounds Swath (Ghosted Indigo Arc) */}
          {standstillSwathD && (
            <path
              id="standstill-swath-guide"
              d={standstillSwathD}
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeDasharray="3 2"
              strokeOpacity="0.35"
            >
              <title>{`18.6-Year Major Standstill Range: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'} to ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}`}</title>
            </path>
          )}

          {/* Monthly Declination Migration Highway Swath (Translucent Silver Arc) */}
          {monthlySwathD && (
            <>
              <path
                d={monthlySwathD}
                fill="none"
                stroke={isNodalModeActive ? nodalThemeColor : '#e2e8f0'}
                strokeWidth="5"
                strokeOpacity="0.15"
                className="blur-[1px] pointer-events-none"
              />
              <path
                id="monthly-lunar-swath-core"
                d={monthlySwathD}
                fill="none"
                stroke={isNodalModeActive ? nodalThemeColor : '#e2e8f0'}
                strokeWidth="2.5"
                strokeOpacity={isNodalModeActive ? 0.6 : 0.45}
              >
                <title>{`Monthly Lunar Transit Range: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'} to ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}`}</title>
              </path>
            </>
          )}

          {/* Major Standstill Max Tick Pin */}
          <g id="standstill-max-tick">
            <line
              x1={standstillMaxTick.x1}
              y1={standstillMaxTick.y1}
              x2={standstillMaxTick.x2}
              y2={standstillMaxTick.y2}
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeDasharray="2 1"
              strokeLinecap="round"
            />
            <title>{`Major Standstill Max: ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}`}</title>
          </g>

          {/* Major Standstill Min Tick Pin */}
          <g id="standstill-min-tick">
            <line
              x1={standstillMinTick.x1}
              y1={standstillMinTick.y1}
              x2={standstillMinTick.x2}
              y2={standstillMinTick.y2}
              stroke="#6366f1"
              strokeWidth="1.2"
              strokeDasharray="2 1"
              strokeLinecap="round"
            />
            <title>{`Major Standstill Min: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'}`}</title>
          </g>

          {/* Monthly Max Culmination Tick Pin */}
          <g id="monthly-max-tick">
            <line
              x1={monthMaxTick.x1}
              y1={monthMaxTick.y1}
              x2={monthMaxTick.x2}
              y2={monthMaxTick.y2}
              stroke="#e2e8f0"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <title>{`Monthly Max Transit Peak: ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}`}</title>
          </g>

          {/* Monthly Min Culmination Tick Pin */}
          <g id="monthly-min-tick">
            <line
              x1={monthMinTick.x1}
              y1={monthMinTick.y1}
              x2={monthMinTick.x2}
              y2={monthMinTick.y2}
              stroke="#94a3b8"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <title>{`Monthly Min Transit Peak: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'}`}</title>
          </g>

          {/* Ecliptic Node Crossing Marker (When Nodal Mode Active) */}
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

          {/* Today's Moon Diurnal Chord (Touching Meridian Arc at Lunar Transit) */}
          {todayChord.daylightD && (
            <path
              id="moon-today-diurnal-chord"
              d={todayChord.daylightD}
              fill="none"
              stroke={nodalThemeColor}
              strokeWidth="1.5"
              strokeOpacity="0.85"
            >
              <title>{`Today's Lunar Diurnal Path (Transit Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag})`}</title>
            </path>
          )}

          {/* Lunar Horizon Gate Anchor Marker (0°) */}
          <g id="moon-horizon-gate-anchor" transform={`translate(${todayChord.anchorPoint.x}, ${todayChord.anchorPoint.y})`}>
            <circle
              cx="0"
              cy="0"
              r="3.5"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.8"
              strokeDasharray="1.5 1.5"
              strokeOpacity="0.6"
            >
              <title>Lunar Horizon Gate (0°): Setting &amp; Rising Station</title>
            </circle>
          </g>

          {/* Daily Culmination Peak Target Halo on the Arc */}
          <g id="meridian-transit-peak-target">
            <line
              x1={EL_CX}
              y1={EL_CY}
              x2={todayPeakPoint.x}
              y2={todayPeakPoint.y}
              stroke={nodalThemeColor}
              strokeWidth="0.75"
              strokeDasharray="2 2"
              strokeOpacity="0.35"
            />
            <circle
              cx={todayPeakPoint.x}
              cy={todayPeakPoint.y}
              r="5.5"
              fill="none"
              stroke={nodalThemeColor}
              strokeWidth="1.0"
              strokeDasharray="2 2"
              strokeOpacity="0.75"
            >
              <title>{`Today's Transit Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag}`}</title>
            </circle>
          </g>
        </g>
      }
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
              title={`18.6-Year Standstill Range: Δδ = ${standstillSpanDeg.toFixed(1)}° between ±${LUNAR_MAX_DEC.toFixed(1)}°`}
            >
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Standstill Span</span>
              <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                Δδ {standstillSpanDeg.toFixed(1)}°
              </span>
              <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                18.6y Cycle
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
    </SkyDomeBase>
  );
};

export default MoonMeridianDome;
