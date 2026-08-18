import React, { useState } from 'react';
import { Sun, Moon, Compass } from 'lucide-react';
import { PhaseVisual } from '../common/PhaseVisual';
import { toRadians, toDegrees, formatTime, clamp, calculateLunarIllumination } from '../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../types';

export interface TodayHorizonViewProps {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  currentTime?: number;
  latitude?: number;
  longitude?: number;
  currentDate?: Date;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  onSetTime?: (time: number) => void;
}

export const TodayHorizonView: React.FC<TodayHorizonViewProps> = ({
  solarData,
  orbitalData,
  currentTime = 12,
  latitude = 47.06,
  longitude = -122.81,
  currentDate = new Date(),
  hoverTime,
  onHoverTime,
  onSetTime,
}) => {
  const [isHoveringMoonMetrics, setIsHoveringMoonMetrics] = useState(false);
  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;

  // --- 1. Sun Elevation Math ---
  const {
    noonElevation = 45,
    solarNoon = 12,
    equationOfTime = 0,
    sunrise = 6,
    sunset = 18,
    declination: sunDeclination = 0,
  } = solarData || {};

  const sunHourAngle = (displayTime - solarNoon) * 15;
  const sinSunAlt =
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(sunDeclination as number)) +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(sunDeclination as number)) * Math.cos(toRadians(sunHourAngle));
  const currentSunElevation = toDegrees(Math.asin(clamp(sinSunAlt, -1, 1)));

  // Sun Arc Coordinates (SVG: 200x90)
  const elR = 62;
  const elCx = 100;
  const elCy = 70;
  const sunX = elCx + elR * Math.sin(toRadians(sunHourAngle));
  const sunY = elCy - elR * Math.sin(toRadians(currentSunElevation));

  // --- 2. Moon Elevation & Phase Math ---
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {
    moonrise: 6,
    transit: 12,
    moonset: 18,
    distanceKm: 384400,
    distanceEarthRadii: 60.3,
    isPerigee: false,
    isApogee: false,
    declination: 0,
    parallacticAngle: 0,
  };
  const {
    moonrise = 6,
    transit = 12,
    moonset = 18,
    distanceKm = 384400,
    distanceEarthRadii = 60.3,
    isPerigee = false,
    isApogee = false,
    declination = 0,
    parallacticAngle = 0,
  } = lunarEvents;

  const moonDeclination = (orbitalData?.lunarPos?.declination ?? declination ?? 0) as number;

  const illPercent = calculateLunarIllumination(phase.value ?? 0);

  const moonHourAngle = (displayTime - transit) * 15;
  const sinMoonAlt =
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(moonDeclination as number)) +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(moonDeclination as number)) * Math.cos(toRadians(moonHourAngle));
  const currentMoonElevation = toDegrees(Math.asin(clamp(sinMoonAlt, -1, 1)));

  const sinMoonPeak =
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(moonDeclination as number)) +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(moonDeclination as number));
  const transitPeakElevation = toDegrees(Math.asin(clamp(sinMoonPeak, -1, 1)));

  const moonX = elCx + elR * Math.sin(toRadians(moonHourAngle));
  const moonY = elCy - elR * Math.sin(toRadians(currentMoonElevation));

  return (
    <div className="flex flex-col h-full w-full justify-between select-none relative">
      {/* Top Inline Header */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Instantaneous local sky dome elevations for Sun and Moon with astronomical metrics
        </p>
        {hoverTime !== null && hoverTime !== undefined && (
          <div className="bg-sky-950/90 text-sky-300 border border-sky-500/80 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold shadow-md">
            Scrubbing: {Math.floor(hoverTime).toString().padStart(2, '0')}:
            {Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Sun Elevation Dome (Left) & Moon Elevation Dome (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch">
        
        {/* LEFT PANE: Sun Elevation Arc Dome */}
        <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800/60 flex flex-col justify-between shadow-inner backdrop-blur-sm">
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-1 px-1 font-mono">
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Sun className="w-4 h-4 text-amber-400" /> Sun Elevation Arc
            </div>
            <div className="text-xs text-amber-400/90 font-mono">
              <span className="text-[10px] text-slate-400 font-sans uppercase mr-1">Noon Peak:</span>
              <strong className="text-white font-semibold">{(noonElevation as number).toFixed(1)}°</strong>
            </div>
          </div>

          {/* Semicircular Sun Dome SVG */}
          <div className="relative w-full py-1 flex items-center justify-center">
            <svg viewBox="0 0 200 88" className="w-full max-h-[105px] overflow-visible" preserveAspectRatio="xMidYMid meet">
              {/* Horizon Line (0°) */}
              <line x1="20" y1={elCy} x2="180" y2={elCy} stroke="#334155" strokeWidth="0.75" strokeOpacity="0.7" />
              <text x="18" y={elCy + 10} textAnchor="end" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>
              <text x="182" y={elCy + 10} textAnchor="start" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>

              {/* Semicircular Elevation Arc Dome */}
              <path
                d={`M ${elCx - elR} ${elCy} A ${elR} ${elR} 0 0 1 ${elCx + elR} ${elCy}`}
                fill="none"
                stroke="#334155"
                strokeWidth="0.75"
                strokeDasharray="4 3"
                strokeOpacity="0.6"
              />

              {/* Zenith Marker (90°) */}
              <line x1={elCx} y1={elCy - elR - 3} x2={elCx} y2={elCy - elR + 3} stroke="#475569" strokeWidth="0.75" />
              <text x={elCx} y={elCy - elR - 5} textAnchor="middle" className="text-[8px] font-mono fill-slate-500 font-medium">+90°</text>

              {/* Observer Horizon Center Origin */}
              <circle cx={elCx} cy={elCy} r="2" fill="#475569" />

              {/* Sun Elevation Vector & Disc */}
              {currentSunElevation > -18 && (
                <g>
                  <line
                    x1={elCx}
                    y1={elCy}
                    x2={sunX}
                    y2={sunY}
                    stroke={currentSunElevation >= 0 ? '#fbbf24' : '#64748b'}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  <circle
                    cx={sunX}
                    cy={sunY}
                    r="5"
                    fill={currentSunElevation >= 0 ? '#fbbf24' : '#475569'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    className="drop-shadow"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Live Sun Elevation Angle Readout Badge */}
          <div className="text-center my-1 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800/60 shadow-sm">
            <div className={`text-sm font-mono font-semibold ${currentSunElevation >= 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {currentSunElevation >= 0 ? `+${currentSunElevation.toFixed(1)}°` : `${currentSunElevation.toFixed(1)}°`}
              <span className="text-[10px] text-slate-400 uppercase font-sans ml-1.5 font-normal">
                {currentSunElevation > 0 ? '(Above Horizon)' : '(Below Horizon)'}
              </span>
            </div>
          </div>

          {/* Footer Summary Badges */}
          <div className="grid grid-cols-3 gap-2 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
              <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Sunrise / Sunset</span>
              <span className="text-slate-200 font-semibold text-xs font-mono">
                {formatTime(sunrise).substring(0, 5)} / {formatTime(sunset).substring(0, 5)}
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
              <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Solar Noon</span>
              <span className="text-amber-400 font-semibold text-xs font-mono">{formatTime(solarNoon).substring(0, 5)} <span className="text-slate-400 text-[10px] font-normal">UTC</span></span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
              <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Eq of Time</span>
              <span className={`text-xs font-semibold font-mono ${equationOfTime >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                {equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Moon Elevation Arc Dome & Moon Phase */}
        <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800/60 flex flex-col justify-between shadow-inner backdrop-blur-sm relative">
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-1 px-1 font-mono">
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Moon className="w-4 h-4 text-slate-300" /> Moon Elevation Arc
            </div>
            <div className="text-xs text-slate-300 font-mono">
              <span className="text-[10px] text-slate-400 font-sans uppercase mr-1">Transit Peak:</span>
              <strong className="text-white font-semibold">{transitPeakElevation.toFixed(1)}°</strong>
            </div>
          </div>

          {/* Semicircular Moon Dome SVG */}
          <div className="relative w-full py-1 flex items-center justify-center">
            <svg viewBox="0 0 200 88" className="w-full max-h-[105px] overflow-visible" preserveAspectRatio="xMidYMid meet">
              {/* Horizon Line (0°) */}
              <line x1="20" y1={elCy} x2="180" y2={elCy} stroke="#334155" strokeWidth="0.75" strokeOpacity="0.7" />
              <text x="18" y={elCy + 10} textAnchor="end" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>
              <text x="182" y={elCy + 10} textAnchor="start" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>

              {/* Semicircular Elevation Arc Dome */}
              <path
                d={`M ${elCx - elR} ${elCy} A ${elR} ${elR} 0 0 1 ${elCx + elR} ${elCy}`}
                fill="none"
                stroke="#334155"
                strokeWidth="0.75"
                strokeDasharray="4 3"
                strokeOpacity="0.6"
              />

              {/* Zenith Marker (90°) */}
              <line x1={elCx} y1={elCy - elR - 3} x2={elCx} y2={elCy - elR + 3} stroke="#475569" strokeWidth="0.75" />
              <text x={elCx} y={elCy - elR - 5} textAnchor="middle" className="text-[8px] font-mono fill-slate-500 font-medium">+90°</text>

              {/* Observer Horizon Center Origin */}
              <circle cx={elCx} cy={elCy} r="2" fill="#475569" />

              {/* Moon Elevation Vector & Disc */}
              {currentMoonElevation > -18 && (
                <g>
                  <line
                    x1={elCx}
                    y1={elCy}
                    x2={moonX}
                    y2={moonY}
                    stroke={currentMoonElevation >= 0 ? '#94a3b8' : '#475569'}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  <circle
                    cx={moonX}
                    cy={moonY}
                    r="5"
                    fill={currentMoonElevation >= 0 ? '#f8fafc' : '#475569'}
                    stroke="#334155"
                    strokeWidth="1.2"
                    className="drop-shadow"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Live Moon Elevation Readout Badge */}
          <div className="text-center my-1 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800/60 shadow-sm">
            <div className={`text-sm font-mono font-semibold ${currentMoonElevation >= 0 ? 'text-slate-200' : 'text-slate-400'}`}>
              {currentMoonElevation >= 0 ? `+${currentMoonElevation.toFixed(1)}°` : `${currentMoonElevation.toFixed(1)}°`}
              <span className="text-[10px] text-slate-400 uppercase font-sans ml-1.5 font-normal">
                {currentMoonElevation > 0 ? '(Above Horizon)' : '(Below Horizon)'}
              </span>
            </div>
          </div>

          {/* Interactive Hover HUD Popover styled like Solar System Macro Orbit */}
          {isHoveringMoonMetrics && (
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
          )}

          {/* Moon Phase & Apsides Metrics Bar (1.5x Moon Graphic without outer border + Rich Hover Popover Trigger) */}
          <div 
            className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1 cursor-pointer transition-colors hover:border-slate-700"
            onPointerEnter={() => setIsHoveringMoonMetrics(true)}
            onPointerLeave={() => setIsHoveringMoonMetrics(false)}
            title={`Geocentric Distance: ${(distanceEarthRadii || (distanceKm / 6371)).toFixed(1)} R_E (${(distanceKm || 384400).toLocaleString()} km)`}
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center">
                <PhaseVisual phase={phase.value} size={52} parallacticAngle={parallacticAngle} />
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

          {/* Mirrored Footer Summary Badges: Moonrise / Moonset, Lunar Transit, Declination */}
          <div className="grid grid-cols-3 gap-2 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
              <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Moonrise / Moonset</span>
              <span className="text-slate-200 font-semibold text-xs font-mono">
                {moonrise !== null && moonrise !== undefined ? formatTime(moonrise).substring(0, 5) : '--:--'} / {moonset !== null && moonset !== undefined ? formatTime(moonset).substring(0, 5) : '--:--'}
              </span>
            </div>
            <div
              onClick={() => transit && onSetTime && onSetTime(transit)}
              className="text-center bg-indigo-950/60 hover:bg-indigo-900/80 transition-all cursor-pointer p-1.5 rounded-lg border border-indigo-500/40 text-indigo-300 shadow-sm"
              title="Click to jump clock to Lunar Transit"
            >
              <span className="text-[9px] text-indigo-400 block uppercase font-sans font-medium flex items-center justify-center gap-0.5">
                <Compass className="w-2.5 h-2.5" /> Lunar Transit
              </span>
              <span className="text-indigo-200 font-semibold text-xs font-mono">{formatTime(transit).substring(0, 5)} <span className="text-indigo-400/80 text-[10px] font-normal">UTC</span></span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
              <span className="text-[9px] text-slate-400 block uppercase font-sans font-medium">Declination (δ)</span>
              <span className={`text-xs font-semibold font-mono ${moonDeclination >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                {moonDeclination >= 0 ? `+${(moonDeclination as number).toFixed(1)}°` : `${(moonDeclination as number).toFixed(1)}°`}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TodayHorizonView;
