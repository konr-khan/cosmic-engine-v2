/**
 * @file SunElevationDome.tsx
 * Topocentric Sun Diurnal Elevation Arc Visualizer.
 * Displays real-time diurnal solar position, solar noon culmination, equinox/solstice arcs,
 * astronomical twilight strata, and seasonal solar analemma metrics.
 */

import React, { useState } from 'react';
import { Sun } from 'lucide-react';
import { formatTime } from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';
import { SkyDomeBase } from './SkyDomeBase';
import { SOLAR_TWILIGHT_BADGE_CLASSES } from './todayTokens';
import { useSunElevationMath, OBLIQUITY } from './hooks/useSunElevationMath';
import { SkyDomeFooter } from './common/SkyDomeFooter';

export interface SunElevationDomeProps {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  initialTwilightMode?: boolean;
  isTwilightMode?: boolean;
  onToggleTwilight?: () => void;
  isQuadMode?: boolean;
  variant?: 'card' | 'embedded';
}

export const SunElevationDome: React.FC<SunElevationDomeProps> = ({
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  onSetTime,
  initialTwilightMode = false,
  isTwilightMode,
  onToggleTwilight,
  isQuadMode = false,
  variant,
}) => {
  const [isHoveringSunMetrics, setIsHoveringSunMetrics] = useState(false);
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
    sunDistanceAU,
    sunDistanceKm,
    noonElevation,
    solarNoon,
    equationOfTime,
    sunrise,
    sunset,
    sunDeclination,
    currentSunElevation,
    sunX,
    sunY,
    culmination,
    riseSetAz,
    solsticeCulminations,
    isTropical,
    isPolar,
    maxAnnualNoon,
    summerSolsticeNoon,
    winterSolsticeNoon,
    capPathD,
    diurnalPaths,
    twilightStatus,
  } = useSunElevationMath({
    solarData,
    displayTime,
    latitude,
    currentDate,
    isTwilightModeActive,
  });

  return (
    <SkyDomeBase
      title="Sun Elevation Arc"
      icon={Sun}
      iconColorClass="text-amber-400"
      peakLabel={isPolar ? 'Constant Altitude' : 'Noon Peak'}
      peakElevation={noonElevation as number}
      peakDirectionSuffix={culmination.shortTag}
      meridianDirection={culmination.meridianLabel}
      culminationDirection={culmination.direction}
      sightingBanner={culmination.sightingSummary}
      currentElevation={currentSunElevation}
      elevationColorClass={SOLAR_TWILIGHT_BADGE_CLASSES[twilightStatus.phase]}
      elevationStatusSubtitle={twilightStatus.label}
      showTwilightBands={isTwilightModeActive}
      latitude={latitude}
      capPathD={capPathD}
      variant={variant}
      diurnalPaths={diurnalPaths}
      bodyX={sunX}
      bodyY={sunY}
      bodyVectorStroke={currentSunElevation >= 0 ? '#fbbf24' : '#64748b'}
      renderBodyGraphic={() => (
        <circle
          cx={sunX}
          cy={sunY}
          r="5"
          fill={
            currentSunElevation >= 0
              ? '#fbbf24'
              : currentSunElevation >= -6
              ? '#f59e0b'
              : currentSunElevation >= -12
              ? '#64748b'
              : currentSunElevation >= -18
              ? '#334155'
              : '#1e293b'
          }
          fillOpacity={currentSunElevation >= -18 ? 0.95 : 0.45}
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity={currentSunElevation >= -18 ? 0.9 : 0.4}
          className="drop-shadow"
        />
      )}
      popover={isHoveringSunMetrics ? (
        <div className="absolute bottom-20 left-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
            <span>Solar Analemma &amp; Orbit</span>
            <span className="text-slate-400 text-[10px] font-normal">32.0' Angular Diam</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Distance: <strong className="text-white font-semibold">{(sunDistanceKm || 149597870).toLocaleString()} km</strong>{' '}
            <span className="text-slate-400">({sunDistanceAU.toFixed(3)} AU)</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Equation of Time: <strong className={equationOfTime >= 0 ? 'text-indigo-300 font-semibold' : 'text-rose-300 font-semibold'}>
              {equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}
            </strong>
          </div>
          <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-tight">
            {sunDistanceAU < 0.99
              ? 'Near Perihelion: Earth is closest to the Sun (~0.983 AU in January), causing fastest orbital speed.'
              : sunDistanceAU > 1.01
              ? 'Near Aphelion: Earth is furthest from the Sun (~1.017 AU in July), causing slowest orbital speed.'
              : 'Mean 1 AU Orbit: Solar distance is near average (149.6M km / 1.000 AU).'}
          </div>
        </div>
      ) : null}
    >
      {/* Symmetrical Sun State & Analemma Bar */}
      <div 
        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1 cursor-pointer transition-colors hover:border-slate-700"
        onPointerEnter={() => setIsHoveringSunMetrics(true)}
        onPointerLeave={() => setIsHoveringSunMetrics(false)}
        title={`Earth-Sun Distance: ${sunDistanceAU.toFixed(3)} AU (${(sunDistanceKm || 149597870).toLocaleString()} km)`}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-[52px] h-[52px] rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Sun className="w-6 h-6 text-amber-400 drop-shadow-sm" />
          </div>
          <div className="font-mono text-left">
            <div className="text-xs font-semibold text-slate-200">Solar Orbit</div>
            <div className="text-[10px] text-slate-400 font-medium">
              Eq of Time: <span className={equationOfTime >= 0 ? 'text-indigo-300' : 'text-rose-300'}>{equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] space-y-0.5">
          <div className="text-slate-400">
            Dist: <strong className="text-slate-200 font-semibold">{sunDistanceAU.toFixed(3)} AU</strong>
          </div>
          <div>
            <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
              sunDistanceAU < 0.99
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : sunDistanceAU > 1.01
                ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
            }`}>
              {sunDistanceAU < 0.99 ? 'Perihelion' : sunDistanceAU > 1.01 ? 'Aphelion' : 'Mean 1 AU'}
            </span>
          </div>
        </div>
      </div>

      {/* Solstice Noon Limits & Zenith Cap Stats Strip (Below Solar Orbit) */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-slate-400">Summer Sol:</span>
          <strong className="text-amber-300 font-semibold">{summerSolsticeNoon.toFixed(1)}° {solsticeCulminations.summer.shortTag}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span className="text-slate-400">Winter Sol:</span>
          <strong className="text-amber-500 font-semibold">
            {winterSolsticeNoon > 0 ? `${winterSolsticeNoon.toFixed(1)}° ${solsticeCulminations.winter.shortTag}` : 'Below 0°'}
          </strong>
        </div>
        {isQuadMode && (
          <div className="flex items-center gap-1.5" title="Annual Solstice Migration Corridor: Δδ = 46.9°">
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Solstice Span:</span>
            <strong className="text-amber-300 font-semibold">Δδ {(2 * OBLIQUITY).toFixed(1)}°</strong>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Zenith Cap:</span>
          <strong className={isTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
            {isTropical ? 'None (90°)' : `>${maxAnnualNoon.toFixed(1)}°`}
          </strong>
        </div>
      </div>

      {/* Mirrored Footer Summary Badges: Sunrise / Sunset, Solar Noon Snap Button, Declination, Mode Toggle */}
      <SkyDomeFooter
        riseSetTitle="Sunrise / Set"
        riseSetPrimaryText={`${formatTime(sunrise).substring(0, 5)} / ${formatTime(sunset).substring(0, 5)}`}
        riseSetOctantText={riseSetAz.riseOctant !== '--' ? `${riseSetAz.riseOctant} · ${riseSetAz.setOctant}` : undefined}
        riseSetTooltip={riseSetAz.riseFormatted !== '--' ? `Sunrise: ${riseSetAz.riseFormatted} · Sunset: ${riseSetAz.setFormatted}` : undefined}
        transitLabel="Solar Noon"
        transitTimeFormatted={formatTime(solarNoon).substring(0, 5)}
        onSnapTransit={() => solarNoon && onSetTime && onSetTime(solarNoon)}
        transitTheme="amber"
        transitTooltip="Click to jump clock to Solar Noon"
        declinationLabel={isQuadMode ? 'Dec (δ) · Span' : 'Declination (δ)'}
        declinationFormatted={(sunDeclination as number) >= 0 ? `+${(sunDeclination as number).toFixed(1)}°` : `${(sunDeclination as number).toFixed(1)}°`}
        declinationColorClass={(sunDeclination as number) >= 0 ? 'text-amber-400' : 'text-rose-400'}
        declinationSpanText={isQuadMode ? `Δδ ${(2 * OBLIQUITY).toFixed(1)}° Corridor` : undefined}
        declinationTooltip={isQuadMode ? `Solar Declination: ${(sunDeclination as number).toFixed(1)}° · Annual Solstice Corridor: Δδ ${(2 * OBLIQUITY).toFixed(1)}°` : undefined}
        primaryModeText="Std"
        secondaryModeText="Twilight"
        isSecondaryActive={isTwilightModeActive}
        onToggleMode={handleToggleTwilight}
        primaryAriaLabel="Standard Solar View"
        secondaryAriaLabel="Twilight Strata View"
        secondaryTheme="amber"
      />
    </SkyDomeBase>
  );
};

export default SunElevationDome;
