import React, { useState } from 'react';
import { Moon, Compass } from 'lucide-react';
import { PhaseVisual } from '../../common/PhaseVisual';
import { 
  toRadians, 
  toDegrees, 
  formatTime, 
  clamp, 
  calculateLunarIllumination 
} from '../../../utils/cosmicMath';
import { OrbitalData } from '../../../types';

export interface MoonElevationDomeProps {
  orbitalData?: OrbitalData | null;
  displayTime: number;
  latitude: number;
  onSetTime?: (time: number) => void;
}

export const MoonElevationDome: React.FC<MoonElevationDomeProps> = ({
  orbitalData,
  displayTime,
  latitude,
  onSetTime,
}) => {
  const [isHoveringMoonMetrics, setIsHoveringMoonMetrics] = useState(false);

  // --- Moon Elevation & Phase Math ---
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

  // Moon Arc Coordinates (SVG: 260x120 - upsized by ~50%)
  const elR = 92;
  const elCx = 130;
  const elCy = 104;
  const moonX = elCx + elR * Math.sin(toRadians(moonHourAngle));
  const moonY = elCy - elR * Math.sin(toRadians(currentMoonElevation));

  // --- Lunar Altitude Bounds & Zenith Cap Math ---
  // Major lunar standstill declination: 23.439° (obliquity) + 5.145° (lunar inclination) = 28.584°
  const LUNAR_MAX_DEC = 28.584;
  const absLat = Math.abs(latitude);
  const isLunarTropical = absLat <= LUNAR_MAX_DEC;

  // Maximum possible lunar transit elevation across all 18.6-year nodal cycles
  const maxAnnualMoonNoon = isLunarTropical ? 90 : (90 - absLat + LUNAR_MAX_DEC);
  const minAnnualMoonNoon = 90 - absLat - LUNAR_MAX_DEC;

  // Lunar Zenith Cap geometry (unreachable sector when latitude is outside lunar tropics)
  let lunarCapPathD = '';
  if (!isLunarTropical && maxAnnualMoonNoon < 89.5) {
    const yCap = elCy - elR * Math.sin(toRadians(maxAnnualMoonNoon));
    const xCapL = elCx - elR * Math.cos(toRadians(maxAnnualMoonNoon));
    const xCapR = elCx + elR * Math.cos(toRadians(maxAnnualMoonNoon));
    lunarCapPathD = `M ${xCapL.toFixed(1)} ${yCap.toFixed(1)} A ${elR} ${elR} 0 0 1 ${xCapR.toFixed(1)} ${yCap.toFixed(1)} Z`;
  }

  // Max Lunar Altitude Chord Line
  const maxMoonY = elCy - elR * Math.sin(toRadians(maxAnnualMoonNoon));
  const maxMoonXL = elCx - elR * Math.cos(toRadians(maxAnnualMoonNoon));
  const maxMoonXR = elCx + elR * Math.cos(toRadians(maxAnnualMoonNoon));

  // Min Lunar Altitude Chord Line (if above horizon)
  const minMoonY = minAnnualMoonNoon > 0 ? elCy - elR * Math.sin(toRadians(minAnnualMoonNoon)) : elCy;
  const minMoonXL = minAnnualMoonNoon > 0 ? elCx - elR * Math.cos(toRadians(minAnnualMoonNoon)) : elCx - elR;
  const minMoonXR = minAnnualMoonNoon > 0 ? elCx + elR * Math.cos(toRadians(minAnnualMoonNoon)) : elCx + elR;

  return (
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

      {/* Semicircular Moon Dome SVG (Upsized 50%) */}
      <div className="relative w-full py-1 flex items-center justify-center">
        <svg viewBox="0 0 260 120" className="w-full max-h-[155px] overflow-visible" preserveAspectRatio="xMidYMid meet">
          {/* Horizon Line (0°) */}
          <line x1="18" y1={elCy} x2="242" y2={elCy} stroke="#334155" strokeWidth="0.75" strokeOpacity="0.7" />
          <text x="16" y={elCy + 10} textAnchor="end" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>
          <text x="244" y={elCy + 10} textAnchor="start" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>

          {/* Semicircular Elevation Arc Dome */}
          <path
            d={`M ${elCx - elR} ${elCy} A ${elR} ${elR} 0 0 1 ${elCx + elR} ${elCy}`}
            fill="none"
            stroke="#334155"
            strokeWidth="0.75"
            strokeDasharray="4 3"
            strokeOpacity="0.6"
          />

          {/* Lunar Zenith Cap (Outside Lunar Tropics) */}
          {lunarCapPathD && (
            <path
              d={lunarCapPathD}
              fill="#020617"
              fillOpacity="0.6"
              stroke="#475569"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
          )}

          {/* Max Lunar Standstill Transit Reference Line */}
          {maxAnnualMoonNoon > 0 && maxAnnualMoonNoon < 89.5 && (
            <g>
              <line
                x1={maxMoonXL}
                y1={maxMoonY}
                x2={maxMoonXR}
                y2={maxMoonY}
                stroke="#94a3b8"
                strokeWidth="0.7"
                strokeDasharray="3 2"
                strokeOpacity="0.75"
              />
              <text
                x={maxMoonXR + 3}
                y={maxMoonY + 2.5}
                className="text-[6.5px] font-mono fill-slate-400 font-medium pointer-events-none select-none"
              >
                {maxAnnualMoonNoon.toFixed(0)}°
              </text>
              <title>{`Max Possible Lunar Altitude: ${maxAnnualMoonNoon.toFixed(1)}°`}</title>
            </g>
          )}

          {/* Min Lunar Standstill Transit Reference Line */}
          {minAnnualMoonNoon > 0 && (
            <g>
              <line
                x1={minMoonXL}
                y1={minMoonY}
                x2={minMoonXR}
                y2={minMoonY}
                stroke="#64748b"
                strokeWidth="0.7"
                strokeDasharray="3 2"
                strokeOpacity="0.7"
              />
              <text
                x={minMoonXR + 3}
                y={minMoonY + 2.5}
                className="text-[6.5px] font-mono fill-slate-500 font-medium pointer-events-none select-none"
              >
                {minAnnualMoonNoon.toFixed(0)}°
              </text>
              <title>{`Min Possible Lunar Altitude: ${minAnnualMoonNoon.toFixed(1)}°`}</title>
            </g>
          )}

          {/* Zenith Marker (90°) */}
          <line x1={elCx} y1={elCy - elR - 3} x2={elCx} y2={elCy - elR + 3} stroke="#475569" strokeWidth="0.75" />
          <text x={elCx} y={elCy - elR - 5} textAnchor="middle" className="text-[8px] font-mono fill-slate-500 font-medium">+90°</text>

          {/* Observer Horizon Center Origin */}
          <circle cx={elCx} cy={elCy} r="2" fill="#475569" />

          {/* Moon Elevation Vector & Miniature Phase Disc */}
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
              {/* Miniature Moon Phase Disc with Parallactic Angle Orientation */}
              <g
                transform={`translate(${moonX}, ${moonY})`}
                className="drop-shadow-md"
                opacity={currentMoonElevation >= 0 ? 1.0 : 0.45}
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

                {/* Outer Specular Rim */}
                <circle cx="0" cy="0" r="5.5" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.6" />
              </g>
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

      {/* Interactive Hover HUD Popover */}
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

      {/* Moon Phase & Apsides Metrics Bar */}
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

      {/* Lunar Standstill Limits & Zenith Cap Stats Strip (Below Moon Phase) */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-slate-400">Max Standstill:</span>
          <strong className="text-slate-200 font-semibold">{maxAnnualMoonNoon.toFixed(1)}°</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <span className="text-slate-400">Min Standstill:</span>
          <strong className="text-slate-400 font-semibold">
            {minAnnualMoonNoon > 0 ? `${minAnnualMoonNoon.toFixed(1)}°` : 'Below 0°'}
          </strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Zenith Cap:</span>
          <strong className={isLunarTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
            {isLunarTropical ? 'None (90°)' : `>${maxAnnualMoonNoon.toFixed(1)}°`}
          </strong>
        </div>
      </div>

      {/* Mirrored Footer Summary Badges: Moonrise / Moonset, Lunar Transit, Declination */}
      <div className="grid grid-cols-3 gap-2 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[8px] sm:text-[8.5px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Moonrise / Moonset</span>
          <span className="text-slate-200 font-semibold text-[11px] sm:text-xs font-mono whitespace-nowrap">
            {moonrise !== null && moonrise !== undefined ? formatTime(moonrise).substring(0, 5) : '--:--'} / {moonset !== null && moonset !== undefined ? formatTime(moonset).substring(0, 5) : '--:--'}
          </span>
        </div>
        <div
          onClick={() => transit && onSetTime && onSetTime(transit)}
          className="text-center bg-indigo-950/60 hover:bg-indigo-900/80 transition-all cursor-pointer p-1.5 rounded-lg border border-indigo-500/40 text-indigo-300 shadow-sm flex flex-col justify-center min-w-0"
          title="Click to jump clock to Lunar Transit"
        >
          <span className="text-[8px] sm:text-[8.5px] text-indigo-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap flex items-center justify-center gap-0.5 truncate">
            <Compass className="w-2.5 h-2.5 shrink-0" /> Lunar Transit
          </span>
          <span className="text-indigo-200 font-semibold text-[11px] sm:text-xs font-mono whitespace-nowrap">{formatTime(transit).substring(0, 5)} <span className="text-indigo-400/80 text-[10px] font-normal font-sans">UTC</span></span>
        </div>
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[8px] sm:text-[8.5px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Declination (δ)</span>
          <span className={`text-[11px] sm:text-xs font-semibold font-mono whitespace-nowrap ${moonDeclination >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {moonDeclination >= 0 ? `+${(moonDeclination as number).toFixed(1)}°` : `${(moonDeclination as number).toFixed(1)}°`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MoonElevationDome;
