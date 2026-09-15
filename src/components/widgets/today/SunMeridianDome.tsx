/**
 * @file SunMeridianDome.tsx
 * Observatory Meridian Profile Visualizer for the Sun.
 * Displays the local celestial meridian from South Horizon (0°) through Zenith (90°)
 * to North Horizon (180°), charting the real-time solar elevation, today's diurnal chord,
 * solstice bounds (June gold, December bronze), and equinox reference marks.
 */

import React, { useState } from 'react';
import { Sun } from 'lucide-react';
import { SolarAlmanacData } from '../../../types';
import { MeridianDomeBase } from './MeridianDomeBase';
import { useSunMeridianMath, OBLIQUITY } from './hooks/useSunMeridianMath';

export interface SunMeridianDomeProps {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  initialTwilightMode?: boolean;
  isTwilightMode?: boolean;
  onToggleTwilight?: () => void;
  hideFooter?: boolean;
  variant?: 'card' | 'embedded';
}

export const SunMeridianDome: React.FC<SunMeridianDomeProps> = ({
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  initialTwilightMode = false,
  isTwilightMode,
  onToggleTwilight,
  hideFooter = false,
  variant,
}) => {
  const [localTwilightMode, setLocalTwilightMode] = useState(initialTwilightMode);
  const isTwilightModeActive = isTwilightMode !== undefined ? isTwilightMode : localTwilightMode;

  const handleToggleTwilight = (val: boolean) => {
    if (onToggleTwilight) {
      if (val !== isTwilightModeActive) {
        onToggleTwilight();
      }
    } else {
      setLocalTwilightMode(val);
    }
  };

  const {
    currentSunElevation,
    elevationSubtitle,
    activeSunPoint,
    todayCulmination,
    peakAlt,
    isPolar,
    isTropical,
    summerSolstice,
    winterSolstice,
    summerNoon,
    winterNoon,
    solsticeSpanDeg,
    polarSummerCounterpart,
    polarWinterCounterpart,
    showPolarSummerChord,
    showPolarWinterChord,
    summerSolsticeColor,
    winterSolsticeColor,
    swaths,
    radialTicks,
    todayChordConfig,
    gateAnchor,
    peakTarget,
  } = useSunMeridianMath({
    solarData,
    displayTime,
    latitude,
    currentDate,
    isTwilightModeActive,
  });

  return (
    <MeridianDomeBase
      title="Sun Meridian Profile"
      icon={Sun}
      iconColorClass="text-amber-400"
      peakLabel={isPolar ? 'Constant Altitude' : 'Noon Peak'}
      peakElevation={peakAlt}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={currentSunElevation}
      elevationColorClass={currentSunElevation >= 0 ? 'text-amber-400' : 'text-slate-400'}
      elevationStatusSubtitle={elevationSubtitle}
      showTwilightBands={isTwilightModeActive}
      latitude={latitude}
      variant={variant}
      bodyX={activeSunPoint.x}
      bodyY={activeSunPoint.y}
      bodyVectorStroke={currentSunElevation >= 0 ? '#fbbf24' : '#475569'}
      renderBodyGraphic={() => (
        <g id="active-solar-noon-bead">
          <circle
            cx={activeSunPoint.x}
            cy={activeSunPoint.y}
            r={activeSunPoint.isParked ? 4.5 : 5}
            fill={
              activeSunPoint.isParked
                ? '#1e293b'
                : currentSunElevation >= 0
                ? '#fbbf24'
                : currentSunElevation >= -6
                ? '#f59e0b'
                : currentSunElevation >= -12
                ? '#64748b'
                : '#334155'
            }
            fillOpacity={activeSunPoint.isParked ? 0.35 : (currentSunElevation >= -18 ? 0.95 : 0.45)}
            stroke={activeSunPoint.isParked ? '#94a3b8' : '#ffffff'}
            strokeWidth="1.2"
            strokeDasharray={activeSunPoint.isParked ? '1.5 1.5' : undefined}
            strokeOpacity={activeSunPoint.isParked ? 0.5 : (currentSunElevation >= -18 ? 0.9 : 0.4)}
            className="drop-shadow"
          >
            <title>
              {activeSunPoint.isParked
                ? (isTwilightModeActive
                    ? `Sun below −18° (${elevationSubtitle}) · Parked at Twilight Gate`
                    : `Sun below Horizon (${elevationSubtitle}) · Parked at Horizon Gate`)
                : `Current Solar Altitude: ${currentSunElevation >= 0 ? '+' : ''}${currentSunElevation.toFixed(1)}° (${elevationSubtitle})`}
            </title>
          </circle>
        </g>
      )}
      swaths={swaths}
      radialTicks={radialTicks}
      geometryGroupId="meridian-solstice-geometry"
      geometryGroupClassName="meridian-solstice-geometry"
      extraMeridianSvg={
        isPolar && (
          <g id="polar-solstice-chords">
            {showPolarSummerChord && polarSummerCounterpart && (
              <path
                id="polar-summer-solstice-chord"
                d={polarSummerCounterpart.chordD}
                fill="none"
                stroke={summerSolsticeColor}
                strokeWidth={1.0}
                strokeDasharray="3 2"
                strokeOpacity={0.65}
              >
                <title>Polar Summer Solstice Diurnal Parallel (+23.4°): Constant 24h altitude across 0° and 180° meridians (Midnight Sun)</title>
              </path>
            )}
            {showPolarWinterChord && polarWinterCounterpart && (
              <path
                id="polar-winter-solstice-chord"
                d={polarWinterCounterpart.chordD}
                fill="none"
                stroke={winterSolsticeColor}
                strokeWidth={0.85}
                strokeDasharray="2 3"
                strokeOpacity={0.45}
              >
                <title>Polar Winter Solstice Sub-Horizon Parallel (−23.4°): Constant 24h depth across 0° and 180° meridians</title>
              </path>
            )}
          </g>
        )
      }
      todayChordConfig={todayChordConfig}
      gateAnchor={gateAnchor}
      peakTarget={peakTarget}
    >
      {!hideFooter && (
        <>
          {/* Solstice Noon Limits & Zenith Transit Stats Strip (Dedicated to Meridian Geometry) */}
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-slate-400">Summer Sol:</span>
              <strong className="text-amber-300 font-semibold">{summerNoon.toFixed(1)}° {summerSolstice.shortTag}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span className="text-slate-400">Winter Sol:</span>
              <strong className="text-amber-500 font-semibold">
                {winterNoon > 0 ? `${winterNoon.toFixed(1)}° ${winterSolstice.shortTag}` : 'Below 0°'}
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Lahaina Transit:</span>
              <strong className={isTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
                {isTropical ? 'Yes (Crosses Zenith)' : 'Outside Tropics'}
              </strong>
            </div>
          </div>

          {/* Mirrored 4-Badge Summary Footer with Mode View Toggle (Std vs Twilight) */}
          <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
            <div 
              className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
              title={`Annual Solstice Range: Δδ = ${solsticeSpanDeg.toFixed(1)}° between ±${OBLIQUITY.toFixed(1)}°`}
            >
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Solstice Span</span>
              <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                Δδ {solsticeSpanDeg.toFixed(1)}°
              </span>
              <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                Min ↔ Max
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Summer Peak</span>
              <span className="text-amber-300 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                {summerNoon.toFixed(1)}° {summerSolstice.shortTag}
              </span>
              <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                Highest Noon
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Winter Peak</span>
              <span className="text-amber-500 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                {winterNoon > 0 ? `${winterNoon.toFixed(1)}° ${winterSolstice.shortTag}` : 'Below 0°'}
              </span>
              <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                Lowest Noon
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate mb-0.5">Mode View</span>
              <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
                <button
                  type="button"
                  onClick={() => handleToggleTwilight(false)}
                  aria-label="Standard Solar Meridian View"
                  className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                    !isTwilightModeActive
                      ? 'bg-slate-800 text-amber-400 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Std
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTwilight(true)}
                  aria-label="Twilight Strata Meridian View"
                  className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                    isTwilightModeActive
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Twilight
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </MeridianDomeBase>
  );
};

export default SunMeridianDome;
