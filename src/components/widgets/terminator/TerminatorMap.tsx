import React, { useState } from 'react';
import { CONFIG } from '../../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../../types';
import { TerminatorHoverHud } from './TerminatorHoverHud';
import { TerminatorLandmasses } from './TerminatorLandmasses';
import { TerminatorGroundTracks } from './TerminatorGroundTracks';
import { useTerminatorMapMath } from './hooks/useTerminatorMapMath';

export interface TerminatorMapProps {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  hoverTime?: number | null;
  currentDate?: Date;
  initialShowSunTrack?: boolean;
  initialShowMoonTrack?: boolean;
}

export const TerminatorMap: React.FC<TerminatorMapProps> = ({ 
  solarData, 
  orbitalData,
  latitude = 47.06, 
  longitude = -122.81, 
  timeOfDay = 12, 
  hoverTime,
  currentDate = new Date(),
  initialShowSunTrack = false,
  initialShowMoonTrack = false
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<'sun' | 'moon' | 'observer' | null>(null);
  const [showSunTrack, setShowSunTrack] = useState<boolean>(initialShowSunTrack);
  const [showMoonTrack, setShowMoonTrack] = useState<boolean>(initialShowMoonTrack);

  const {
    effectiveHoverTime,
    declination,
    sunDistanceAU,
    sunDistanceKm,
    sunAngularDiamArcmin,
    sunRadius,
    sunGlowRadius,
    normalizedSunLong,
    sunCy,
    userCy,
    relSunX,
    lunarDec,
    moonPhase,
    moonIllum,
    moonDistKm,
    moonAngularDiamArcmin,
    isSupermoon,
    isMicromoon,
    moonRadius,
    moonGlowRadius,
    relMoonX,
    moonCy,
    sunTrack,
    moonTrack,
    activeNodalMarker,
    lunarNodeTelemetry,
    astroShadow,
    nauticalShadow,
    civilShadow,
    dayShadow
  } = useTerminatorMapMath({
    solarData,
    orbitalData,
    latitude,
    longitude,
    timeOfDay,
    hoverTime,
    currentDate,
    showSunTrack,
    showMoonTrack
  });

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Declination & Meridian Info Rail with Ground Track Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-400">
            Map dynamically centers on observer meridian ({longitude >= 0 ? `+${longitude.toFixed(1)}` : `${longitude.toFixed(1)}`}°)
          </p>
          {/* Ground Track Layer Toggles */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              aria-label="Toggle 24-hour Sun Track"
              aria-pressed={showSunTrack}
              onClick={() => setShowSunTrack(prev => !prev)}
              className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer select-none ${
                showSunTrack
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span>☀️</span>
              <span>Sun Track</span>
            </button>
            <button
              type="button"
              aria-label="Toggle 24-hour Moon Track"
              aria-pressed={showMoonTrack}
              onClick={() => setShowMoonTrack(prev => !prev)}
              className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer select-none ${
                showMoonTrack
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span>🌙</span>
              <span>Moon Track</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-slate-300">
          <span className="text-[10px] uppercase font-bold text-slate-400">Solar Declination:</span>
          <strong className="text-amber-400 font-bold">{declination >= 0 ? `+${declination.toFixed(1)}` : declination.toFixed(1)}°</strong>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] uppercase font-bold text-slate-400">Lunar Declination:</span>
          <strong className="text-cyan-400 font-bold">{lunarDec >= 0 ? `+${lunarDec.toFixed(1)}` : lunarDec.toFixed(1)}°</strong>
        </div>
      </div>
      
      {/* Map SVG Container */}
      <div className="relative w-full flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 min-h-[220px]">
        {/* Glassmorphic Macro-Orbit style Hover HUD Overlay */}
        <TerminatorHoverHud
          hoveredPoint={hoveredPoint}
          declination={declination}
          normalizedSunLong={normalizedSunLong}
          sunDistanceAU={sunDistanceAU}
          sunDistanceKm={sunDistanceKm}
          sunAngularDiamArcmin={sunAngularDiamArcmin}
          lunarDec={lunarDec}
          moonPhase={moonPhase}
          moonIllum={moonIllum}
          moonDistKm={moonDistKm}
          moonAngularDiamArcmin={moonAngularDiamArcmin}
          isSupermoon={isSupermoon}
          isMicromoon={isMicromoon}
          lunarNodeTelemetry={lunarNodeTelemetry}
          latitude={latitude}
          longitude={longitude}
        />

        <svg viewBox="0 0 360 180" style={{ touchAction: 'none' }} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="terminatorBounds">
              <rect x="0" y="0" width="360" height="180" rx="8" />
            </clipPath>
          </defs>

          <g clipPath="url(#terminatorBounds)">
            {/* Ocean Base */}
            <rect width="360" height="180" fill="#0b0f19" />

            {/* Continent Landmasses */}
            <TerminatorLandmasses longitude={longitude} />

            {/* Longitude Grid Lines */}
            {[-180, -90, 0, 90, 180, 270].map(lon => {
               const x = (lon - longitude + 180 + 360) % 360;
               return <line key={lon} x1={x} y1="0" x2={x} y2="180" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.5" />;
            })}

            {/* Tropics & Equator Lines */}
            <line x1="0" y1={90 - 23.5} x2="360" y2={90 - 23.5} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1={90 + 23.5} x2="360" y2={90 + 23.5} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1={90} x2="360" y2={90} stroke="#475569" strokeWidth="0.5" strokeOpacity="0.6" />
            
            {/* User Latitude & Meridian Crosshairs */}
            <line x1="0" y1={userCy} x2="360" y2={userCy} stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="4 2" strokeOpacity="0.7" />
            <line x1={180} y1="0" x2={180} y2="180" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="4 2" strokeOpacity="0.7" />

            {/* Layered Twilight & Night Shadows (Progressively darkening into deep space night) */}
            {/* 1. Base Shadow from Horizon (Day boundary / Civil Twilight transition: h < -0.833°) */}
            <path d={dayShadow.combinedPath} fill="#020617" fillOpacity="0.25" />
            {/* 2. Civil Twilight Shadow (h < -6°) */}
            <path d={civilShadow.combinedPath} fill="#020617" fillOpacity="0.25" />
            {/* 3. Nautical Twilight Shadow (h < -12°) */}
            <path d={nauticalShadow.combinedPath} fill="#020617" fillOpacity="0.25" />
            {/* 4. Astronomical / Deep Night Shadow (h < -18°) */}
            <path d={astroShadow.combinedPath} fill="#020617" fillOpacity="0.35" />

            {/* Glowing Amber Terminator Edge (Strictly along sunrise/sunset boundary between day & twilight) */}
            {dayShadow.linePath && (
              <path d={dayShadow.linePath} fill="none" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.8" strokeDasharray="3 2" />
            )}

            {/* 24-Hour Diurnal Subsolar & Sublunar Ground Tracks */}
            <TerminatorGroundTracks
              showSunTrack={showSunTrack}
              sunTrack={sunTrack}
              showMoonTrack={showMoonTrack}
              moonTrack={moonTrack}
              activeNodalMarker={activeNodalMarker}
            />

            {/* Subsolar Point Marker with Soft Dynamic Distance-Scaled Glow */}
            <g 
              className="cursor-pointer"
              style={{ touchAction: 'none' }}
              onPointerEnter={() => setHoveredPoint('sun')}
              onPointerLeave={() => setHoveredPoint(null)}
            >
              <circle cx={relSunX} cy={sunCy} r="12" fill="transparent" />
              <circle cx={relSunX} cy={sunCy} r={sunGlowRadius} fill={CONFIG.THEME.SUN_FILL} opacity="0.25" />
              <circle cx={relSunX} cy={sunCy} r={sunRadius} fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="1.5" className="drop-shadow" />
              <text x={relSunX + sunRadius + 3} y={sunCy + 3} className="text-[7.5px] fill-amber-300 font-bold font-mono select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                SUN
              </text>
            </g>
            
            {/* Hover Subsolar Ray Guide when hover sync active */}
            {effectiveHoverTime !== null && effectiveHoverTime !== undefined && (
              <line x1={relSunX} y1="0" x2={relSunX} y2="180" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
            )}

            {/* Sublunar Point Marker (Moon Zenith) with Soft Dynamic Distance-Scaled Glow */}
            <g 
              className="cursor-pointer"
              style={{ touchAction: 'none' }}
              onPointerEnter={() => setHoveredPoint('moon')}
              onPointerLeave={() => setHoveredPoint(null)}
            >
              <circle cx={relMoonX} cy={moonCy} r="12" fill="transparent" />
              <circle cx={relMoonX} cy={moonCy} r={moonGlowRadius} fill="#94a3b8" opacity="0.25" />
              <circle cx={relMoonX} cy={moonCy} r={moonRadius} fill="#f8fafc" stroke="#475569" strokeWidth="1.5" className="drop-shadow" />
              <text x={relMoonX + moonRadius + 3} y={moonCy + 3} className="text-[7.5px] fill-slate-300 font-bold font-mono select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                MOON
              </text>
            </g>

            {/* User Observer Position Marker with Glow (Unified Sky Blue #38bdf8) */}
            <g 
              className="cursor-pointer"
              style={{ touchAction: 'none' }}
              onPointerEnter={() => setHoveredPoint('observer')}
              onPointerLeave={() => setHoveredPoint(null)}
            >
              <circle cx={180} cy={userCy} r="12" fill="transparent" />
              <circle cx={180} cy={userCy} r="8" fill="#38bdf8" opacity="0.25" className="animate-pulse" />
              <circle cx={180} cy={userCy} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" className="drop-shadow" />
              <text x={186} y={userCy - 4} className="text-[8px] fill-sky-300 font-bold font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">YOU</text>
            </g>
          </g>
        </svg>
      </div>

      {/* Bottom Color Semantic Legend */}
      <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
         <div className="flex items-center gap-3">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-300 inline-block" /> Subsolar</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400 inline-block" /> Sublunar</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 border border-sky-300 inline-block" /> You</span>
           {showMoonTrack && activeNodalMarker && (
             <span className={`flex items-center gap-1 font-semibold ${
               activeNodalMarker.type === 'ascending' ? 'text-cyan-300' : 'text-rose-300'
             }`}>
               <span>{activeNodalMarker.symbol}</span> Active Node
             </span>
           )}
         </div>
         <div className="flex items-center gap-2.5">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400 inline-block" /> Day</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/80 inline-block" /> Civil (-6°)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-500 inline-block" /> Nautical (-12°)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-700 inline-block" /> Astro (-18°)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-950 border border-slate-800 inline-block" /> Night</span>
         </div>
      </div>
    </div>
  );
};

export default TerminatorMap;
