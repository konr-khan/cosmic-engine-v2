import React, { useState } from 'react';
import { EclipseData } from '../../../types';
import { getPhaseName, calculateLunarIllumination } from '../../../utils/cosmicMath';

export interface ShadowRayDiagramProps {
  eclipse?: EclipseData | null;
  diagramMode?: 'live' | 'solar' | 'lunar';
  setDiagramMode?: (mode: 'live' | 'solar' | 'lunar') => void;
  lunarViewSubTab?: 'pov' | 'orbit';
  setLunarViewSubTab?: (tab: 'pov' | 'orbit') => void;
}

export const ShadowRayDiagram: React.FC<ShadowRayDiagramProps> = ({
  eclipse,
  diagramMode = 'live',
  setDiagramMode,
  lunarViewSubTab = 'pov',
  setLunarViewSubTab
}) => {
  const [hoveredEntity, setHoveredEntity] = useState<'sun' | 'earth' | 'moon' | 'umbra' | 'penumbra' | null>(null);
  if (!eclipse) return null;

  // Physical vertical offset calculation in km and scaled SVG pixels
  const beta = eclipse.beta; // -5.14° to +5.14°
  const distKm = eclipse.distanceKm || 384000;
  const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
  const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 1.0 (Full Moon = 0.5)
  const phaseRad = phaseVal * 2 * Math.PI;
  const phaseDeg = Math.round(phaseVal * 360);
  const phaseName = getPhaseName(phaseVal);
  const illumPercent = calculateLunarIllumination(phaseVal);

  // Map -5.14° to +5.14° ecliptic latitude to SVG Y pixel displacement
  const scalePxPerDeg = 8.5;

  // Calculate Live Orbit Moon Coordinates
  const liveEarthX = 310;
  const liveEarthY = 110;
  const liveOrbitalRx = 85;
  const liveOrbitalRy = 38;
  const liveMoonX = liveEarthX - (liveOrbitalRx * Math.cos(phaseRad));
  const liveMoonY = liveEarthY + (liveOrbitalRy * Math.sin(phaseRad)) - (beta * 4);

  // Calculate shadow miss margin in km
  const penumbraRad = eclipse.penumbraRadiusKm || 9500;

  let shadowStatus = { 
    text: `Elongation: ${phaseDeg}° (${phaseName}) | Offset: ${verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : verticalOffsetKm.toLocaleString()} km`, 
    bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700' 
  };
  if (eclipse.isEclipseActive) {
    shadowStatus = { text: `✨ DIRECT ECLIPSE: ${eclipse.label}`, bg: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold' };
  } else if (Math.abs(verticalOffsetKm) > penumbraRad) {
    shadowStatus = { text: `💡 Shadow Miss: Moon passes ${verticalOffsetKm > 0 ? '+' : ''}${verticalOffsetKm.toLocaleString()} km ${verticalOffsetKm > 0 ? 'ABOVE' : 'BELOW'} Shadow Cone`, bg: 'bg-slate-900 text-slate-300 border-slate-700' };
  }

  return (
    <div className="w-full h-full flex flex-col justify-between relative">
      
      {/* Top Bar: Streamlined Mode Selector & Live Dynamic Offset Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 gap-1">
            <button
              onClick={() => setDiagramMode && setDiagramMode('live')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                diagramMode === 'live' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Orbit
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('solar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                diagramMode === 'solar' ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solar Focus
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('lunar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                diagramMode === 'lunar' ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lunar Focus
            </button>
          </div>

          {/* Integrated inline sub-toggle when in Lunar Focus mode */}
          {diagramMode === 'lunar' && (
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 gap-1 text-[11px]">
              <button
                onClick={() => setLunarViewSubTab && setLunarViewSubTab('pov')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  lunarViewSubTab === 'pov' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Surface POV
              </button>
              <button
                onClick={() => setLunarViewSubTab && setLunarViewSubTab('orbit')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  lunarViewSubTab === 'orbit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Selenocentric
              </button>
            </div>
          )}
        </div>

        {/* Live Shadow State Indicator */}
        {diagramMode !== 'lunar' && (
          <div className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] flex items-center gap-1.5 backdrop-blur-sm ${shadowStatus.bg}`}>
            <span>{shadowStatus.text}</span>
          </div>
        )}
      </div>

      {/* Floating Glassmorphic Macro-Orbit style Hover HUD Overlay */}
      {hoveredEntity === 'sun' && (
        <div className="absolute top-12 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
          <div className="text-xs font-bold text-amber-400">Sun (Primary Light Source)</div>
          <div className="text-slate-300">Distance: <strong className="text-white">~149.6M km (1.00 AU)</strong></div>
          <div className="text-slate-300">Solar Radius: <strong className="text-amber-300">696,340 km</strong></div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Emits direct converging & diverging solar rays shaping Earth's umbra & penumbra shadow cones.
          </div>
        </div>
      )}

      {hoveredEntity === 'earth' && (
        <div className="absolute top-12 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
          <div className="text-xs font-bold text-blue-400">Earth (Geocentric Reference Origin)</div>
          <div className="text-slate-300">Radius: <strong className="text-white">6,378 km (1.00 R_E)</strong></div>
          <div className="text-slate-300">Umbra Radius at Moon: <strong className="text-rose-300">{Math.round(eclipse.umbraRadiusKm).toLocaleString()} km</strong></div>
          <div className="text-slate-300">Penumbra Radius at Moon: <strong className="text-slate-300">{Math.round(eclipse.penumbraRadiusKm).toLocaleString()} km</strong></div>
        </div>
      )}

      {hoveredEntity === 'moon' && (
        <div className="absolute top-12 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
          <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
            <span>Moon ({phaseName})</span>
            <span className="text-slate-400 text-[9px]">{illumPercent}% Illum</span>
          </div>
          <div className="text-slate-300">
            Orbital Elongation: <strong className="text-white">{phaseDeg}°</strong>
          </div>
          <div className="text-slate-300">
            Distance: <strong className="text-indigo-300">{distKm.toLocaleString()} km</strong> ({(distKm / 6371).toFixed(1)} R_E)
          </div>
          <div className="text-slate-300">
            Ecliptic Lat (β): <strong className="text-rose-300">{beta}°</strong>
          </div>
          <div className="text-slate-300">
            Vertical Miss: <strong className={verticalOffsetKm === 0 ? "text-emerald-400" : (verticalOffsetKm > 0 ? "text-amber-400" : "text-indigo-400")}>
              {verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : `${verticalOffsetKm.toLocaleString()}`} km
            </strong>
          </div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            {eclipse.isEclipseActive ? `✨ Active Direct Eclipse: ${eclipse.label}` : 'Moon orbital plane alignment currently outside direct shadow cone.'}
          </div>
        </div>
      )}

      {hoveredEntity === 'umbra' && (
        <div className="absolute top-12 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
          <div className="text-xs font-bold text-rose-400">Earth Umbra Cone (Total Shadow)</div>
          <div className="text-slate-300">Umbra Radius at Moon: <strong className="text-white">{Math.round(eclipse.umbraRadiusKm).toLocaleString()} km</strong></div>
          <div className="text-slate-300">Total Shadow Length: <strong className="text-rose-300">~1,384,000 km</strong></div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Region where Earth completely blocks direct sunlight. Moon inside umbra turns crimson (Blood Moon).
          </div>
        </div>
      )}

      {hoveredEntity === 'penumbra' && (
        <div className="absolute top-12 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
          <div className="text-xs font-bold text-slate-300">Earth Penumbra Cone (Partial Shadow)</div>
          <div className="text-slate-300">Penumbra Radius at Moon: <strong className="text-white">{Math.round(eclipse.penumbraRadiusKm).toLocaleString()} km</strong></div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Region of partial sunlight blockage causing faint subtle dimming of the lunar surface.
          </div>
        </div>
      )}

      {/* SVG Shadow Ray Diagram with Dynamic Real Engine State & Interactive Derivation Tooltips */}
      <svg viewBox="0 0 520 220" className="w-full h-full block flex-1 min-h-[220px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Umbra Dark Gradient */}
          <linearGradient id="umbraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>

          {/* Penumbra Soft Gradient */}
          <linearGradient id="penumbraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
          </linearGradient>

          {/* Solar Corona Glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>

          {/* Earth Atmosphere Crimson Glow for Lunar POV */}
          <radialGradient id="earthBloodRing" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#000000" stopOpacity="1" />
            <stop offset="90%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* MODE A: LIVE ORBIT STATE */}
        {diagramMode === 'live' && (
          <g>
            {/* Ecliptic Reference Centerline (0°) */}
            <line x1="10" y1="110" x2="510" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            <text x="92" y="104" className="text-[8px] font-mono fill-slate-500">Ecliptic Plane (0°)</text>

            {/* 1. SUN BODY (Left) */}
            <g 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredEntity('sun')}
              onPointerLeave={() => setHoveredEntity(null)}
            >
              <circle cx="50" cy="110" r="32" fill="url(#sunGlow)" />
              <circle cx="50" cy="110" r="28" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
              <text x="50" y="114" textAnchor="middle" className="text-[10px] font-black fill-slate-950 font-mono select-none pointer-events-none">
                SUN
              </text>
            </g>

            {/* Earth Shadow Cones projecting rightwards into space */}
            <polygon 
              points="310,92 510,65 510,155 310,128" 
              fill="url(#penumbraGrad)" 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredEntity('penumbra')}
              onPointerLeave={() => setHoveredEntity(null)}
            />
            <polygon 
              points="310,92 490,110 310,128" 
              fill="url(#umbraGrad)" 
              stroke="#f43f5e" 
              strokeWidth="1" 
              strokeOpacity="0.6" 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredEntity('umbra')}
              onPointerLeave={() => setHoveredEntity(null)}
            />

            {/* Sun Rays to Earth */}
            <line x1="50" y1="82" x2="310" y2="92" stroke="#f59e0b" strokeWidth="1" opacity="0.5" strokeDasharray="3 3" />
            <line x1="50" y1="138" x2="310" y2="128" stroke="#f59e0b" strokeWidth="1" opacity="0.5" strokeDasharray="3 3" />

            {/* Moon Tilted Orbit Path Ellipse around Earth */}
            <g className="cursor-help">
              <ellipse cx={liveEarthX} cy={liveEarthY} rx={liveOrbitalRx} ry={liveOrbitalRy} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
              <text x={liveEarthX + liveOrbitalRx - 20} y={liveEarthY - liveOrbitalRy - 4} className="text-[8px] font-mono fill-emerald-400">Moon Orbit (5.14° Tilt)</text>
            </g>

            {/* 2. EARTH BODY (Middle) */}
            <g 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredEntity('earth')}
              onPointerLeave={() => setHoveredEntity(null)}
            >
              <circle cx={liveEarthX} cy={liveEarthY} r="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
              <text x={liveEarthX} y={liveEarthY + 4} textAnchor="middle" className="text-[9px] font-mono font-bold fill-blue-300 select-none pointer-events-none">
                EARTH
              </text>
            </g>

            {/* Line connecting Earth and Moon */}
            <line x1={liveEarthX} y1={liveEarthY} x2={liveMoonX} y2={liveMoonY} stroke="#64748b" strokeWidth="1" opacity="0.6" />

            {/* DYNAMIC MOON BODY positioned at exact live phase angle & ecliptic latitude */}
            <g 
              transform={`translate(${liveMoonX}, ${liveMoonY})`} 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredEntity('moon')}
              onPointerLeave={() => setHoveredEntity(null)}
            >
              <circle
                r="8"
                fill={eclipse.isEclipseActive ? '#f43f5e' : '#94a3b8'}
                stroke={eclipse.isEclipseActive ? '#fbbf24' : '#ffffff'}
                strokeWidth="2"
                className="drop-shadow"
              />
              <text
                x={liveMoonX > liveEarthX ? 12 : -12}
                y="4"
                textAnchor={liveMoonX > liveEarthX ? 'start' : 'end'}
                className="text-[9px] font-mono font-bold fill-emerald-300 select-none pointer-events-none"
              >
                MOON ({phaseDeg}° Elong)
              </text>
            </g>
          </g>
        )}

        {/* MODE B: SOLAR FOCUS MODE (2D Moon Orbit around Earth) */}
        {diagramMode === 'solar' && (() => {
          const earthX = 380;
          const earthY = 110;
          const rx = 100;
          const ry = 42;

          // Moon 2D orbit position around Earth based on phase angle & 5.14° inclination
          const moonOrbitalX = earthX - (rx * Math.cos(phaseRad));
          const moonOrbitalY = earthY + (ry * Math.sin(phaseRad)) - (beta * 4);

          return (
            <g>
              {/* Ecliptic Plane Reference Line */}
              <line x1="10" y1="110" x2="510" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

              {/* SUN BODY (Left) */}
              <g 
                className="cursor-pointer"
                onPointerEnter={() => setHoveredEntity('sun')}
                onPointerLeave={() => setHoveredEntity(null)}
              >
                <circle cx="50" cy="110" r="32" fill="url(#sunGlow)" />
                <circle cx="50" cy="110" r="28" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                <text x="50" y="114" textAnchor="middle" className="text-[10px] font-black fill-slate-950 font-mono select-none pointer-events-none">
                  SUN
                </text>
              </g>

              {/* 2D Tilted Lunar Orbital Plane Ring around Earth */}
              <g className="cursor-help">
                <ellipse cx={earthX} cy={earthY} rx={rx} ry={ry} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                <text x={earthX - rx} y={earthY - ry - 4} className="text-[8px] font-mono fill-emerald-400 font-bold">
                  Moon 2D Orbit Plane (5.14° Inclination)
                </text>
              </g>

              {/* Light Rays from Sun extending towards Earth & Moon */}
              <line x1="50" y1="82" x2={earthX} y2={earthY - 20} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <line x1="50" y1="138" x2={earthX} y2={earthY + 20} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

              {/* Moon Shadow Cone projecting from Moon */}
              {moonOrbitalX < earthX && (
                <polygon
                  points={`${moonOrbitalX},${moonOrbitalY - 4} ${earthX},${earthY - (beta * 5) - 6} ${earthX},${earthY - (beta * 5) + 6} ${moonOrbitalX},${moonOrbitalY + 4}`}
                  fill="url(#umbraGrad)" opacity="0.8" stroke="#fbbf24" strokeWidth="0.5"
                  className="cursor-pointer"
                  onPointerEnter={() => setHoveredEntity('umbra')}
                  onPointerLeave={() => setHoveredEntity(null)}
                />
              )}

              {/* MOON BODY orbiting Earth in 2D */}
              <g 
                transform={`translate(${moonOrbitalX}, ${moonOrbitalY})`} 
                className="cursor-pointer"
                onPointerEnter={() => setHoveredEntity('moon')}
                onPointerLeave={() => setHoveredEntity(null)}
              >
                {Math.abs(beta) > 0.3 && (
                  <line x1="0" y1="0" x2="0" y2={earthY - moonOrbitalY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                )}
                <circle r="14" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
                <circle r="9" fill={eclipse.type.includes('SOLAR') ? '#fbbf24' : '#94a3b8'} stroke="#ffffff" strokeWidth="2" className="drop-shadow" />
                <text x={moonOrbitalX > earthX - 40 ? -12 : 14} y="4" textAnchor={moonOrbitalX > earthX - 40 ? 'end' : 'start'} className="text-[9px] font-mono font-bold fill-emerald-400 select-none pointer-events-none">
                  MOON ({phaseDeg}° Elong, β={beta}°)
                </text>
              </g>

              {/* EARTH BODY (Right) */}
              <g 
                className="cursor-pointer"
                onPointerEnter={() => setHoveredEntity('earth')}
                onPointerLeave={() => setHoveredEntity(null)}
              >
                <circle cx={earthX} cy={earthY} r="20" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                <text x={earthX} y={earthY + 4} textAnchor="middle" className="text-[9px] font-mono font-bold fill-blue-300 select-none pointer-events-none">
                  EARTH
                </text>
              </g>

              {/* Umbra Spot on Earth Surface when solar eclipse active */}
              {eclipse.category === 'SOLAR' && eclipse.isEclipseActive ? (
                <g>
                  <circle cx={earthX - 20} cy={earthY} r="3.5" fill="#020617" stroke="#fbbf24" strokeWidth="1.5" className="animate-ping" />
                  <text x={earthX} y={earthY + 34} textAnchor="middle" className="text-[8px] font-mono font-bold fill-amber-400">
                    ✨ Umbral Spot on Earth Surface
                  </text>
                </g>
              ) : (
                <text x={earthX} y={earthY + 34} textAnchor="middle" className="text-[8px] font-mono fill-slate-400">
                  {Math.abs(phaseDeg) > 25 ? `Moon ${phaseDeg}° off New Moon alignment` : `Shadow passes ${beta > 0 ? '+' : ''}${verticalOffsetKm.toLocaleString()} km ${verticalOffsetKm > 0 ? 'above' : 'below'} Earth`}
                </text>
              )}
            </g>
          );
        })()}

        {/* MODE C: LUNAR FOCUS MODE (Selenocentric Orbit or Surface POV View) */}
        {diagramMode === 'lunar' && (
          lunarViewSubTab === 'pov' ? (
            // OPTION B SUB-TAB 1: LUNAR SURFACE POV (Looking up at Earth & Sun from Moon)
            <g>
              {/* Lunar Sky Backdrop */}
              <rect x="0" y="0" width="520" height="220" fill="#020617" rx="8" />

              {/* Lunar Horizon Line */}
              <path d="M 0 190 Q 130 180, 260 185 T 520 190 L 520 220 L 0 220 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <text x="20" y="210" className="text-[9px] font-mono font-bold fill-slate-400">
                🌕 Lunar Surface Perspective (View from Moon looking up at Earth)
              </text>

              {/* Sky Center Coordinates */}
              <g transform="translate(260, 100)">
                {/* Sun in Lunar Sky */}
                <g className="cursor-help">
                  <title>{`Sun in Lunar Sky\n• Angular Diameter: 32.0' arcmin\n• Distance: ~1.00 AU`}</title>
                  <circle cx="0" cy="0" r="32" fill="url(#sunGlow)" />
                  <circle cx="0" cy="0" r="26" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                </g>

                {/* Solar Corona Rays if Earth Eclipses Sun */}
                {eclipse.category === 'LUNAR' && (
                  <g>
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                      <line
                        key={a}
                        x1={36 * Math.cos((a * Math.PI) / 180)}
                        y1={36 * Math.sin((a * Math.PI) / 180)}
                        x2={60 * Math.cos((a * Math.PI) / 180)}
                        y2={60 * Math.sin((a * Math.PI) / 180)}
                        stroke="#fef08a" strokeWidth="2" opacity="0.7" strokeDasharray="3 2" className="animate-pulse"
                      />
                    ))}
                  </g>
                )}

                {/* Earth Body in Lunar Sky (Appears ~1.9° Angular Diameter, 3.7x Moon size) */}
                {(() => {
                  // Offset Earth based on phase difference from Full Moon (180°)
                  const phaseOffset = Math.sin(((phaseDeg - 180) * Math.PI) / 180) * 140;
                  const earthX = phaseOffset;
                  const earthY = beta * 6;

                  const isTerrestrialLunarEclipse = eclipse.category === 'LUNAR' && eclipse.isEclipseActive;

                  return (
                    <g transform={`translate(${earthX}, ${earthY})`} className="cursor-help">
                      <title>{`Earth in Lunar Sky\n• Angular Diameter: ~1.9° (114' arcmin, 3.7x Sun)\n• Phase Offset from Full: ${Math.round(Math.abs(phaseDeg - 180))}°\n• Ecliptic Latitude β: ${beta}°\n• Eclipse Status: ${isTerrestrialLunarEclipse ? 'Direct Solar Eclipse by Earth' : 'Sun Unobstructed'}`}</title>
                      {/* Crimson Atmospheric Ring ("Blood Ring") during Eclipse */}
                      {isTerrestrialLunarEclipse && (
                        <g>
                          <circle cx="0" cy="0" r="54" fill="#9f1239" opacity="0.3" className="animate-ping" />
                          <circle cx="0" cy="0" r="48" fill="none" stroke="#f43f5e" strokeWidth="4" opacity="0.9" />
                          <circle cx="0" cy="0" r="46" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                        </g>
                      )}

                      {/* Earth Body (Dark nightside with blue limb or bright day crescent) */}
                      <circle cx="0" cy="0" r="44" fill={isTerrestrialLunarEclipse ? '#020617' : '#1e3a8a'} stroke={isTerrestrialLunarEclipse ? '#ef4444' : '#60a5fa'} strokeWidth="2" />
                      
                      {/* Earth Surface Continent Texture Accent */}
                      {!isTerrestrialLunarEclipse && (
                        <circle cx="0" cy="0" r="44" fill="#3b82f6" fillOpacity="0.3" />
                      )}

                      <text x="0" y="4" textAnchor="middle" className={`text-[10px] font-mono font-extrabold select-none pointer-events-none ${isTerrestrialLunarEclipse ? 'fill-rose-300' : 'fill-blue-200'}`}>
                        EARTH (1.9°)
                      </text>
                    </g>
                  );
                })()}
              </g>

              {/* HUD Readout Callout */}
              <g transform="translate(360, 25)">
                <rect x="0" y="0" width="145" height="52" fill="#0f172a" opacity="0.9" rx="6" stroke="#334155" strokeWidth="1" />
                <text x="8" y="15" className="text-[8px] font-mono font-bold fill-indigo-300">
                  Lunar Sky Event:
                </text>
                <text x="8" y="29" className={`text-[9px] font-mono font-extrabold ${eclipse.category === 'LUNAR' ? 'fill-rose-400' : 'fill-emerald-400'}`}>
                  {eclipse.category === 'LUNAR' ? '🔥 Solar Eclipse by Earth' : '☀️ Sun Unobstructed'}
                </text>
                <text x="8" y="43" className="text-[8px] font-mono fill-slate-400">
                  Earth Diameter: 1.9° (114' arcmin)
                </text>
              </g>
            </g>
          ) : (
            // OPTION B SUB-TAB 2: SELENOCENTRIC ORBIT DIAGRAM (Moon at Center, Earth Orbiting Moon)
            <g>
              {/* Ecliptic Plane Center Line */}
              <line x1="10" y1="110" x2="510" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

              {/* SUN (Left) */}
              <g className="cursor-help">
                <title>{`Sun (Primary Illuminator)\n• Distance: ~149.6M km (1.00 AU)\n• Angular Diameter: 32.0' arcmin`}</title>
                <circle cx="50" cy="110" r="32" fill="url(#sunGlow)" />
                <circle cx="50" cy="110" r="28" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                <text x="50" y="114" textAnchor="middle" className="text-[10px] font-black fill-slate-950 font-mono select-none pointer-events-none">
                  SUN
                </text>
              </g>

              {/* FIXED MOON AT CENTER (Selenocentric Frame) */}
              <g transform="translate(260, 110)" className="cursor-help">
                <title>{`Moon (Selenocentric Coordinate Frame Origin)\n• Lunar Radius: 1,737.4 km\n• Geocentric Distance: ${distKm.toLocaleString()} km (${(distKm / 6371).toFixed(1)} R_E)\n• Obscuration: ${eclipse.obscuration}%`}</title>
                <circle r="14" fill="#64748b" stroke="#ffffff" strokeWidth="2" className="drop-shadow" />
                <text x="0" y="24" textAnchor="middle" className="text-[9px] font-mono font-bold fill-emerald-300 select-none pointer-events-none">
                  MOON (Selenocentric Center)
                </text>
              </g>

              {/* Earth Orbiting Moon in Selenocentric Frame */}
              {(() => {
                const distFromFullRad = Math.sin(((phaseDeg - 180) * Math.PI) / 180);
                const selenocentricEarthX = 260 - Math.max(-120, Math.min(120, distFromFullRad * 130));
                const selenocentricEarthY = 110 + (beta * scalePxPerDeg);

                return (
                  <g>
                    {/* Earth Shadow Cone extending past Moon into space */}
                    <polygon 
                      points={`${selenocentricEarthX},${selenocentricEarthY - 18} 500,60 500,160 ${selenocentricEarthX},${selenocentricEarthY + 18}`} 
                      fill="url(#penumbraGrad)" 
                      className="cursor-help"
                    >
                      <title>{`Earth Penumbra Cone\n• Penumbra Radius at Moon: ${Math.round(eclipse.penumbraRadiusKm).toLocaleString()} km`}</title>
                    </polygon>
                    <polygon 
                      points={`${selenocentricEarthX},${selenocentricEarthY - 18} 480,110 ${selenocentricEarthX},${selenocentricEarthY + 18}`} 
                      fill="url(#umbraGrad)" 
                      stroke="#f43f5e" 
                      strokeWidth="1" 
                      className="cursor-help"
                    >
                      <title>{`Earth Umbra Cone\n• Umbra Radius at Moon: ${Math.round(eclipse.umbraRadiusKm).toLocaleString()} km`}</title>
                    </polygon>

                    {/* EARTH BODY revolving relative to Moon */}
                    <g transform={`translate(${selenocentricEarthX}, ${selenocentricEarthY})`} className="cursor-help">
                      <title>{`Earth (Relative Orbit Frame)\n• Apparent Separation: ${distKm.toLocaleString()} km\n• Ecliptic Latitude β: ${beta}°\n• Vertical Miss: ${verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : verticalOffsetKm.toLocaleString()} km`}</title>
                      <circle r="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" className="text-[8px] font-mono font-bold fill-blue-200 select-none pointer-events-none">
                        EARTH
                      </text>
                      <text x="0" y="-22" textAnchor="middle" className="text-[8px] font-mono fill-indigo-300 font-bold select-none pointer-events-none">
                        Relative Earth Orbit
                      </text>
                    </g>
                  </g>
                );
              })()}
            </g>
          )
        )}
      </svg>

    </div>
  );
};

export default ShadowRayDiagram;
