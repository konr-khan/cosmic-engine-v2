/**
 * @file MoonElevationDome.tsx
 * Topocentric Moon Diurnal Elevation Arc Visualizer.
 * Displays real-time lunar diurnal position, transit culmination, monthly declination envelope,
 * 18.6-year major standstill boundaries, and interactive 4-quadrant draconic nodal timeline.
 */

import React, { useState } from 'react';
import { Moon } from 'lucide-react';
import { formatTime } from '../../../utils/cosmicMath';
import { PhaseVisual } from '../../common/PhaseVisual';
import { OrbitalData, SolarAlmanacData } from '../../../types';
import { SkyDomeBase } from './SkyDomeBase';
import { LUNAR_ELEVATION_BADGE_CLASSES } from './todayTokens';
import { useMoonElevationMath, LUNAR_MAX_DEC } from './hooks/useMoonElevationMath';
import { SkyDomeFooter } from './common/SkyDomeFooter';
import { DraconicTimelineRail } from './common/DraconicTimelineRail';
import { LunarPhaseDisc } from './common/LunarPhaseDisc';

export interface MoonElevationDomeProps {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  longitude?: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  initialNodalMode?: boolean;
  isNodalMode?: boolean;
  onToggleNodal?: () => void;
  isQuadMode?: boolean;
  variant?: 'card' | 'embedded';
}

export const MoonElevationDome: React.FC<MoonElevationDomeProps> = ({
  orbitalData,
  solarData,
  displayTime,
  latitude,
  longitude,
  currentDate = new Date(),
  onSetTime,
  initialNodalMode = false,
  isNodalMode,
  onToggleNodal,
  isQuadMode = false,
  variant,
}) => {
  const [isHoveringMoonMetrics, setIsHoveringMoonMetrics] = useState(false);
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
    illPercent,
    moonrise,
    transit,
    moonset,
    distanceKm,
    distanceEarthRadii,
    isPerigee,
    isApogee,
    moonDeclination,
    parallacticAngle,
    currentParallacticAngle,
    currentMoonElevation,
    moonX,
    moonY,
    transitPeakElevation,
    culmination,
    riseSetAz,
    extremaCulminations,
    standstillMaxCulmination,
    standstillMinCulmination,
    maxAnnualMoonNoon,
    minAnnualMoonNoon,
    isLunarTropical,
    isPolar,
    lunarCapPathD,
    nodalData,
    diurnalPaths,
    moonTrackColor,
    lunarStatus,
  } = useMoonElevationMath({
    orbitalData,
    solarData,
    displayTime,
    latitude,
    longitude,
    currentDate,
    isNodalModeActive,
  });

  return (
    <SkyDomeBase
      title="Moon Elevation Arc"
      icon={Moon}
      iconColorClass="text-slate-300"
      peakLabel={isPolar ? 'Constant Altitude' : 'Transit Peak'}
      peakElevation={transitPeakElevation}
      peakDirectionSuffix={culmination.shortTag}
      meridianDirection={culmination.meridianLabel}
      culminationDirection={culmination.direction}
      sightingBanner={culmination.sightingSummary}
      currentElevation={currentMoonElevation}
      elevationColorClass={LUNAR_ELEVATION_BADGE_CLASSES[lunarStatus.phase]}
      elevationStatusSubtitle={lunarStatus.label}
      latitude={latitude}
      capPathD={lunarCapPathD}
      variant={variant}
      diurnalPaths={diurnalPaths}
      bodyX={moonX}
      bodyY={moonY}
      bodyVectorStroke={currentMoonElevation >= 0 ? moonTrackColor : '#475569'}
      extraSvgContent={isNodalModeActive && nodalData.isNearNode && nodalData.nearestNode.isVisible && (
        <g className="lunar-upcoming-node-layer">
          {(() => {
            const node = nodalData.nearestNode;
            const isAsc = nodalData.nearestNodeType === 'ascending';
            const color = isAsc ? '#38bdf8' : '#f43f5e';
            const symbol = isAsc ? '☊' : '☋';
            const dist = nodalData.nearestNodeDistDays;
            let labelText: string;
            if (dist <= 0.05) {
              labelText = `${symbol} Crossing Now`;
            } else if (dist <= 0.5) {
              const hours = Math.max(1, Math.round(dist * 24));
              labelText = nodalData.isApproachingNearestNode
                ? `${symbol} in ${hours}h`
                : `${symbol} ${hours}h ago`;
            } else {
              labelText = nodalData.isApproachingNearestNode
                ? `${symbol} in ${dist.toFixed(1)}d`
                : `${symbol} ${dist.toFixed(1)}d ago`;
            }

            return (
              <g
                transform={`translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`}
                className="drop-shadow-md cursor-default"
                opacity={node.isAboveHorizon ? 1.0 : 0.5}
              >
                <circle cx="0" cy="0" r="8" fill={color} fillOpacity="0.25" className="animate-pulse" />
                <circle cx="0" cy="0" r="4.5" fill="#020617" stroke={color} strokeWidth="1.2" />
                <text x="0" y="2.5" textAnchor="middle" className="text-[7px] font-bold pointer-events-none select-none" fill={color}>
                  {symbol}
                </text>
                <text x="0" y="-7.5" textAnchor="middle" className="text-[6.5px] font-mono font-semibold pointer-events-none select-none" fill={color}>
                  {labelText}
                </text>
                <title>{`${isAsc ? 'Ascending Node (☊)' : 'Descending Node (☋)'}: True Ecliptic Crossing (β = 0°) at El ${node.elevation.toFixed(1)}°, Dec ${node.declination.toFixed(1)}° (${node.isAboveHorizon ? 'Above Horizon' : 'Sub-Horizon / Setting'})`}</title>
              </g>
            );
          })()}
        </g>
      )}
      renderBodyGraphic={() => (
        <g
          transform={`translate(${moonX}, ${moonY})`}
          className="drop-shadow-md"
          opacity={currentMoonElevation >= 0 ? 1.0 : 0.45}
        >
          <LunarPhaseDisc
            radius={5.5}
            phaseValue={phase.value ?? 0}
            parallacticAngle={parallacticAngle || 0}
            rimStroke="#64748b"
            rimStrokeWidth={0.5}
            rimStrokeOpacity={0.6}
          />
        </g>
      )}
      popover={isHoveringMoonMetrics ? (
        <div className="absolute bottom-20 right-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>{phase.name}</span>
            <span className="text-slate-400 text-[10px] font-normal">{illPercent}% Illum</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Distance: <strong className="text-white font-semibold">{(distanceKm || 384400).toLocaleString()} km</strong>{' '}
            <span className="text-slate-400">({(distanceEarthRadii || ((distanceKm || 384400) / 6371)).toFixed(1)} R_E)</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Parallactic Angle: <strong className="text-indigo-300 font-semibold">{parallacticAngle.toFixed(1)}°</strong>
          </div>
          <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-tight">
            {isPerigee
              ? 'Lunar Perigee: Moon is at its closest orbital approach to Earth (~363,300 km), creating maximum gravitational tides.'
              : isApogee
              ? 'Lunar Apogee: Moon is at its furthest orbital distance (~405,500 km), with minimal apparent angular size.'
              : 'Mean Orbit: Moon is near average geocentric distance (~384,400 km / 60.3 Earth Radii).'}
          </div>
        </div>
      ) : null}
    >
      {/* Moon Phase & Apsides Metrics Bar */}
      <div 
        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1 cursor-pointer transition-colors hover:border-slate-700"
        onPointerEnter={() => setIsHoveringMoonMetrics(true)}
        onPointerLeave={() => setIsHoveringMoonMetrics(false)}
        title={`Geocentric Distance: ${(distanceEarthRadii || (distanceKm / 6371)).toFixed(1)} R_E (${(distanceKm || 384400).toLocaleString()} km)`}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center">
            <PhaseVisual phase={phase.value} size={52} parallacticAngle={currentParallacticAngle} />
          </div>
          <div className="font-mono text-left">
            <div className="text-xs font-semibold text-slate-200">{phase.name}</div>
            <div className="text-[10px] text-slate-400 font-medium">{illPercent}% Illuminated</div>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] space-y-0.5">
          <div className="text-slate-400">
            Dist: <strong className="text-slate-200 font-semibold">{(distanceKm || 384400).toLocaleString()} km</strong>
          </div>
          <div>
            <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
              isPerigee
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : isApogee
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
            }`}>
              {isPerigee ? 'Perigee' : isApogee ? 'Apogee' : 'Mean Orbit'}
            </span>
          </div>
        </div>
      </div>

      {/* Lunar Standstill Limits (Std Mode) or 4-Quadrant Draconic Orbital Progress Micro-Rail (Nodal Mode) */}
      {!isNodalModeActive ? (
        <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-slate-400">Max Standstill:</span>
            <strong className="text-slate-200 font-semibold">{maxAnnualMoonNoon.toFixed(1)}° {standstillMaxCulmination.shortTag}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-400">Min Standstill:</span>
            <strong className="text-slate-400 font-semibold">
              {minAnnualMoonNoon > 0 ? `${minAnnualMoonNoon.toFixed(1)}° ${standstillMinCulmination.shortTag}` : 'Below 0°'}
            </strong>
          </div>
          {isQuadMode && (
            <>
              <div className="flex items-center gap-1.5" title="18.6-Year Major Lunar Standstill Span: Δδ = 57.2°">
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Standstill Span:</span>
                <strong className="text-indigo-300 font-semibold">Δδ {(2 * LUNAR_MAX_DEC).toFixed(1)}°</strong>
              </div>
              <div className="flex items-center gap-1.5" title="Monthly Lunar Declination Bounds over rolling 30-day window">
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Monthly:</span>
                <strong className="text-indigo-300 font-semibold">
                  {(extremaCulminations.maxBound.altitude - Math.max(0, extremaCulminations.minBound.altitude)).toFixed(1)}°
                </strong>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Zenith Cap:</span>
            <strong className={isLunarTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
              {isLunarTropical ? 'None (90°)' : `>${maxAnnualMoonNoon.toFixed(1)}°`}
            </strong>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1 font-mono">
          {/* Top Line: Past Node, Live Today State, and Next Node */}
          <div className="flex items-center justify-between text-[9.5px]">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-slate-500 font-sans">Past:</span>
              <strong className={nodalData.prevNodeType === 'ascending' ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                {nodalData.prevNodeType === 'ascending' ? '☊' : '☋'}{' '}
                {nodalData.daysSincePrevNode <= 0.5
                  ? `${Math.max(1, Math.round(nodalData.daysSincePrevNode * 24))}h ago`
                  : `${nodalData.daysSincePrevNode}d ago`}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800/60 shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${nodalData.isMoonAscending ? 'bg-sky-400' : 'bg-rose-400'}`} />
              <span className="text-slate-200 font-semibold text-[9.5px]">
                {nodalData.isMoonAscending ? 'North (☊)' : 'South (☋)'}
              </span>
              <span className={`font-mono font-medium ${nodalData.isMoonAscending ? 'text-sky-300' : 'text-rose-300'}`}>
                β: {nodalData.moonBeta >= 0 ? `+${nodalData.moonBeta.toFixed(1)}°` : `${nodalData.moonBeta.toFixed(1)}°`}
              </span>
            </div>

            <div className="flex items-center gap-1 min-w-0 truncate justify-end">
              <span className="text-slate-500 font-sans">Next:</span>
              <strong className={nodalData.upcomingNodeType === 'ascending' ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                {nodalData.upcomingNodeType === 'ascending' ? '☊' : '☋'}{' '}
                {nodalData.daysToNextNode <= 0.5
                  ? `in ${Math.max(1, Math.round(nodalData.daysToNextNode * 24))}h`
                  : `in ${nodalData.daysToNextNode}d`}
              </strong>
            </div>
          </div>

          {/* Bottom Line: Centered +-15-Day Draconic Rail SVG */}
          <DraconicTimelineRail nodalData={nodalData} />
        </div>
      )}

      {/* Mirrored Footer Summary Badges: Moonrise / Moonset, Lunar Transit Snap Button, Declination, Mode Toggle */}
      <SkyDomeFooter
        riseSetTitle="Moonrise / Set"
        riseSetPrimaryText={`${moonrise !== null && moonrise !== undefined ? formatTime(moonrise).substring(0, 5) : '--:--'} / ${moonset !== null && moonset !== undefined ? formatTime(moonset).substring(0, 5) : '--:--'}`}
        riseSetOctantText={riseSetAz.riseOctant !== '--' ? `${riseSetAz.riseOctant} · ${riseSetAz.setOctant}` : undefined}
        riseSetTooltip={riseSetAz.riseFormatted !== '--' ? `Moonrise: ${riseSetAz.riseFormatted} · Moonset: ${riseSetAz.setFormatted}` : undefined}
        transitLabel="Lunar Transit"
        transitTimeFormatted={formatTime(transit).substring(0, 5)}
        onSnapTransit={() => transit && onSetTime && onSetTime(transit)}
        transitTheme="indigo"
        transitTooltip="Click to jump clock to Lunar Transit"
        declinationLabel={isQuadMode ? 'Dec (δ) · Span' : 'Declination (δ)'}
        declinationFormatted={moonDeclination >= 0 ? `+${(moonDeclination as number).toFixed(1)}°` : `${(moonDeclination as number).toFixed(1)}°`}
        declinationColorClass={moonDeclination >= 0 ? 'text-indigo-400' : 'text-rose-400'}
        declinationSpanText={isQuadMode ? `Δδ ${(2 * LUNAR_MAX_DEC).toFixed(1)}° Span` : undefined}
        declinationTooltip={isQuadMode ? `Lunar Declination: ${moonDeclination.toFixed(1)}° · 18.6-Year Standstill Range: Δδ = ${(2 * LUNAR_MAX_DEC).toFixed(1)}°` : undefined}
        primaryModeText="Std"
        secondaryModeText="☊ Nodes"
        isSecondaryActive={isNodalModeActive}
        onToggleMode={handleToggleNodal}
        primaryAriaLabel="Standard Lunar View"
        secondaryAriaLabel="Lunar Nodes View"
        secondaryTheme="sky"
      />
    </SkyDomeBase>
  );
};

export default MoonElevationDome;
