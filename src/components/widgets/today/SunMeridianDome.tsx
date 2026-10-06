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
import { J2000_DATE } from '../../../utils/cosmicMath';
import { MeridianDomeBase } from './MeridianDomeBase';
import { MeridianDomeFooter } from './common';
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
  currentDate = J2000_DATE,
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
          <MeridianDomeFooter
            badge1={{
              label: 'Solstice Span',
              value: `Δδ ${solsticeSpanDeg.toFixed(1)}°`,
              subText: 'Min ↔ Max',
              tooltip: `Annual Solstice Range: Δδ = ${solsticeSpanDeg.toFixed(1)}° between ±${OBLIQUITY.toFixed(1)}°`
            }}
            badge2={{
              label: 'Summer Peak',
              value: `${summerNoon.toFixed(1)}° ${summerSolstice.shortTag}`,
              valueColorClass: 'text-amber-300',
              subText: 'Highest Noon'
            }}
            badge3={{
              label: 'Winter Peak',
              value: winterNoon > 0 ? `${winterNoon.toFixed(1)}° ${winterSolstice.shortTag}` : 'Below 0°',
              valueColorClass: 'text-amber-500',
              subText: 'Lowest Noon'
            }}
            secondaryModeText="Twilight"
            isSecondaryActive={isTwilightModeActive}
            onToggleSecondary={handleToggleTwilight}
            primaryAriaLabel="Standard Solar Meridian View"
            secondaryAriaLabel="Twilight Strata Meridian View"
            secondaryTheme="amber"
            primaryActiveTextClass="text-amber-400"
          />
        </>
      )}
    </MeridianDomeBase>
  );
};

export default SunMeridianDome;
