import React, { useState, useMemo } from 'react';
import { Sun, Compass } from 'lucide-react';
import { 
  toRadians, 
  toDegrees, 
  formatTime, 
  clamp, 
  calculateEarthOrbitalPhysics,
  getJulianDate 
} from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';

export interface SunElevationDomeProps {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
}

export const SunElevationDome: React.FC<SunElevationDomeProps> = ({
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  onSetTime,
}) => {
  const [isHoveringSunMetrics, setIsHoveringSunMetrics] = useState(false);

  // Earth-Sun Distance & Orbital Physics from Canonical Solver
  const fallbackPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(getJulianDate(currentDate, displayTime)),
    [currentDate, displayTime]
  );
  const sunDistanceAU = solarData?.distanceAU ?? fallbackPhysics.distanceAU;
  const sunDistanceKm = solarData?.distanceKm ?? fallbackPhysics.distanceKm;

  // --- Sun Elevation Math ---
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

  return (
    <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800/60 flex flex-col justify-between shadow-inner backdrop-blur-sm relative">
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

      {/* Interactive Hover HUD Popover for Sun / Solar Analemma */}
      {isHoveringSunMetrics && (
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
      )}

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

      {/* Mirrored Footer Summary Badges: Sunrise / Sunset, Solar Noon Snap Button, Declination */}
      <div className="grid grid-cols-3 gap-2 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[8px] sm:text-[8.5px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Sunrise / Sunset</span>
          <span className="text-slate-200 font-semibold text-[11px] sm:text-xs font-mono whitespace-nowrap">
            {formatTime(sunrise).substring(0, 5)} / {formatTime(sunset).substring(0, 5)}
          </span>
        </div>
        <div 
          onClick={() => solarNoon && onSetTime && onSetTime(solarNoon)}
          className="text-center bg-amber-950/60 hover:bg-amber-900/80 transition-all cursor-pointer p-1.5 rounded-lg border border-amber-500/40 text-amber-300 shadow-sm flex flex-col justify-center min-w-0"
          title="Click to jump clock to Solar Noon"
        >
          <span className="text-[8px] sm:text-[8.5px] text-amber-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap flex items-center justify-center gap-0.5 truncate">
            <Compass className="w-2.5 h-2.5 shrink-0" /> Solar Noon
          </span>
          <span className="text-amber-200 font-semibold text-[11px] sm:text-xs font-mono whitespace-nowrap">{formatTime(solarNoon).substring(0, 5)} <span className="text-amber-400/80 text-[10px] font-normal font-sans">UTC</span></span>
        </div>
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[8px] sm:text-[8.5px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Declination (δ)</span>
          <span className={`text-[11px] sm:text-xs font-semibold font-mono whitespace-nowrap ${(sunDeclination as number) >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {(sunDeclination as number) >= 0 ? `+${(sunDeclination as number).toFixed(1)}°` : `${(sunDeclination as number).toFixed(1)}°`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SunElevationDome;
