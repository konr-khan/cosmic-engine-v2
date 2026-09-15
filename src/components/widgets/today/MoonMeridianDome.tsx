/**
 * @file MoonMeridianDome.tsx
 * Observatory Meridian Profile Visualizer for the Moon.
 * Displays the local celestial meridian from South Horizon (0°) through Zenith (90°)
 * to North Horizon (180°), charting real-time lunar elevation, today's diurnal chord,
 * 18.6-year standstill limits, monthly declination envelope, and nodal crossing markers.
 */

import React, { useState } from 'react';
import { Moon } from 'lucide-react';
import { OrbitalData, SolarAlmanacData } from '../../../types';
import { MeridianDomeBase, EL_CX } from './MeridianDomeBase';
import { LunarPhaseDisc } from './common/LunarPhaseDisc';
import { useMoonMeridianMath, LUNAR_MAX_DEC } from './hooks/useMoonMeridianMath';

export interface MoonMeridianDomeProps {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
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

  const {
    phase,
    parallacticAngle,
    currentMoonElevation,
    elevationStatusSubtitle,
    activeMoonPoint,
    todayCulmination,
    peakAlt,
    standstillMax,
    standstillMin,
    monthMax,
    monthMin,
    isPolar,
    isStandstillActive,
    isAscendingBranch,
    nodalThemeColor,
    nodalData,
    eclipticCulmination,
    eclipticNodePoint,
    eclipticNodeTick,
    targetMaxAlt,
    polarMaxCounterpart,
    showPolarMaxChord,
    standstillSpanDeg,
    swaths,
    radialTicks,
    todayChordConfig,
    gateAnchor,
    peakTarget,
  } = useMoonMeridianMath({
    orbitalData,
    solarData,
    displayTime,
    latitude,
    currentDate,
    isNodalModeActive,
  });

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
      elevationStatusSubtitle={elevationStatusSubtitle}
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
      swaths={swaths}
      radialTicks={radialTicks}
      geometryGroupId="meridian-lunar-geometry"
      geometryGroupClassName="meridian-lunar-geometry"
      extraMeridianSvg={
        showPolarMaxChord || isNodalModeActive ? (
          <>
            {showPolarMaxChord && polarMaxCounterpart && (
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
      todayChordConfig={todayChordConfig}
      gateAnchor={gateAnchor}
      peakTarget={peakTarget}
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
