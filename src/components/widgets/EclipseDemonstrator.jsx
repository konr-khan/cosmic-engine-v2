import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Layers, Eye, Compass, Calendar, 
  AlertTriangle, CheckCircle2, ChevronRight, Sun, Moon, Globe 
} from 'lucide-react';
import { 
  CONFIG, 
  calculateEclipseData, 
  ECLIPSE_PRESETS, 
  findUpcomingEclipses, 
  formatYMD 
} from '../../utils/cosmicMath';

export const EclipseDemonstrator = ({ 
  currentDate = new Date(), 
  onDateChange, 
  onTimeChange,
  orbitalData 
}) => {
  const [activeTab, setActiveTab] = useState('geometry'); // 'geometry' | 'nodes' | 'sky' | 'scanner'
  const [diagramMode, setDiagramMode] = useState('live'); // 'live' | 'solar' | 'lunar'
  const [lunarViewSubTab, setLunarViewSubTab] = useState('pov'); // 'pov' | 'orbit'

  const eclipse = (orbitalData && orbitalData.eclipse) 
    ? orbitalData.eclipse 
    : calculateEclipseData(currentDate ? currentDate.getTime() / 86400000 + 2440587.5 : 2451545.0);

  // Discover upcoming eclipses from current date
  const upcomingEclipses = useMemo(() => {
    return findUpcomingEclipses(currentDate || new Date(), 4);
  }, [currentDate]);

  const handleSelectPreset = (presetDate) => {
    if (!onDateChange) return;
    onDateChange(new Date(presetDate));
    if (onTimeChange) {
      onTimeChange(18); // standard eclipse peak time around mid-day/dusk UTC
    }
  };

  const getStatusBadge = () => {
    if (eclipse.type === 'TOTAL_SOLAR') {
      return { bg: 'bg-amber-950/90 text-amber-300 border-amber-500', icon: Sparkles, text: 'TOTAL SOLAR ECLIPSE' };
    }
    if (eclipse.type === 'ANNULAR_SOLAR') {
      return { bg: 'bg-orange-950/90 text-orange-300 border-orange-500', icon: Sparkles, text: 'ANNULAR SOLAR ECLIPSE (Ring of Fire)' };
    }
    if (eclipse.type === 'PARTIAL_SOLAR') {
      return { bg: 'bg-amber-900/50 text-amber-200 border-amber-600', icon: AlertTriangle, text: `PARTIAL SOLAR ECLIPSE (${eclipse.obscuration}%)` };
    }
    if (eclipse.type === 'TOTAL_LUNAR') {
      return { bg: 'bg-rose-950/90 text-rose-300 border-rose-500', icon: Sparkles, text: 'TOTAL LUNAR ECLIPSE (Blood Moon)' };
    }
    if (eclipse.type === 'PARTIAL_LUNAR' || eclipse.type === 'PENUMBRAL_LUNAR') {
      return { bg: 'bg-rose-900/50 text-rose-200 border-rose-600', icon: AlertTriangle, text: `${eclipse.label} (${eclipse.obscuration}%)` };
    }
    return { bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: CheckCircle2, text: `NO ECLIPSE (Node Gap: ${eclipse.nodeProximityDeg}°)` };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 p-4 md:p-6 h-full flex flex-col justify-between select-none">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-blue-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" /> Eclipse Mechanics & Shadow Geometry
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Umbra, Penumbra & 5.14° Lunar Orbital Plane Node Alignment Solver
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm ${status.bg}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{status.text}</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setActiveTab('geometry')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'geometry' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Shadow Rays
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'nodes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> 5.14° Nodes
            </button>
            <button
              onClick={() => setActiveTab('sky')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'sky' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Sky View
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full flex-1 min-h-[280px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-3">
        
        {/* TAB 1: SHADOW GEOMETRY & RAY TRACING DIAGRAM */}
        {activeTab === 'geometry' && (() => {
          // Physical vertical offset calculation in km and scaled SVG pixels
          const beta = eclipse.beta; // -5.14° to +5.14°
          const distKm = eclipse.distanceKm || 384000;
          const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
          const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 1.0 (Full Moon = 0.5)
          const phaseRad = phaseVal * 2 * Math.PI;
          const phaseDeg = Math.round(phaseVal * 360);
          
          // Map -5.14° to +5.14° ecliptic latitude to SVG Y pixel displacement
          const scalePxPerDeg = 8.5;
          const moonY = 110 - (beta * scalePxPerDeg);

          // Calculate Live Orbit Moon Coordinates
          const liveEarthX = 310;
          const liveEarthY = 110;
          const liveOrbitalRx = 85;
          const liveOrbitalRy = 38;
          const liveMoonX = liveEarthX - (liveOrbitalRx * Math.cos(phaseRad));
          const liveMoonY = liveEarthY + (liveOrbitalRy * Math.sin(phaseRad)) - (beta * 4);

          // Calculate shadow miss margin in km
          const umbraRad = eclipse.umbraRadiusKm || 3474;
          const penumbraRad = eclipse.penumbraRadiusKm || 9500;

          let shadowStatus = { text: `Phase: ${phaseDeg}° | Vertical Offset: ${verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : verticalOffsetKm.toLocaleString()} km`, bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700' };
          if (eclipse.isEclipseActive) {
            shadowStatus = { text: `✨ DIRECT ECLIPSE: ${eclipse.label}`, bg: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold' };
          } else if (Math.abs(verticalOffsetKm) > penumbraRad) {
            shadowStatus = { text: `💡 Shadow Miss: Moon passes ${verticalOffsetKm > 0 ? '+' : ''}${verticalOffsetKm.toLocaleString()} km ${verticalOffsetKm > 0 ? 'ABOVE' : 'BELOW'} Shadow Cone`, bg: 'bg-slate-900 text-slate-300 border-slate-700' };
          }

          return (
            <div className="w-full h-full flex flex-col justify-between">
              
              {/* Top Bar: Mode Selector & Live Dynamic Offset Badge */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Geometry Focus:</span>
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1">
                    <button
                      onClick={() => setDiagramMode('live')}
                      className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                        diagramMode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live Orbit
                    </button>
                    <button
                      onClick={() => setDiagramMode('solar')}
                      className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                        diagramMode === 'solar' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Solar Focus (2D Moon Orbit)
                    </button>
                    <button
                      onClick={() => setDiagramMode('lunar')}
                      className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                        diagramMode === 'lunar' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lunar Focus (Selenocentric POV)
                    </button>
                  </div>
                </div>

                {/* Sub-toggle if in Lunar Focus mode */}
                {diagramMode === 'lunar' && (
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1 text-[10px]">
                    <button
                      onClick={() => setLunarViewSubTab('pov')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        lunarViewSubTab === 'pov' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🌙 Lunar Surface POV
                    </button>
                    <button
                      onClick={() => setLunarViewSubTab('orbit')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        lunarViewSubTab === 'orbit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🌐 Selenocentric Orbit
                    </button>
                  </div>
                )}

                {/* Live Shadow State Indicator */}
                {diagramMode !== 'lunar' && (
                  <div className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] flex items-center gap-1.5 ${shadowStatus.bg}`}>
                    <span>{shadowStatus.text}</span>
                  </div>
                )}
              </div>

              {/* SVG Shadow Ray Diagram with Dynamic Real Engine State or Focused Optics */}
              <svg viewBox="0 0 520 220" className="w-full h-full block max-h-[210px]" preserveAspectRatio="xMidYMid meet">
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
                    <text x="15" y="104" className="text-[8px] font-mono fill-slate-500">Ecliptic Plane (0°)</text>

                    {/* 1. SUN BODY (Left) */}
                    <circle cx="50" cy="110" r="32" fill="url(#sunGlow)" />
                    <circle cx="50" cy="110" r="28" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                    <text x="50" y="114" textAnchor="middle" className="text-[10px] font-black fill-slate-950 font-mono">
                      SUN
                    </text>

                    {/* Earth Shadow Cones projecting rightwards into space */}
                    <polygon points="310,92 510,65 510,155 310,128" fill="url(#penumbraGrad)" />
                    <polygon points="310,92 490,110 310,128" fill="url(#umbraGrad)" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.6" />

                    {/* Sun Rays to Earth */}
                    <line x1="50" y1="82" x2="310" y2="92" stroke="#f59e0b" strokeWidth="1" opacity="0.5" strokeDasharray="3 3" />
                    <line x1="50" y1="138" x2="310" y2="128" stroke="#f59e0b" strokeWidth="1" opacity="0.5" strokeDasharray="3 3" />

                    {/* Moon Tilted Orbit Path Ellipse around Earth */}
                    <ellipse cx={liveEarthX} cy={liveEarthY} rx={liveOrbitalRx} ry={liveOrbitalRy} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                    <text x={liveEarthX + liveOrbitalRx - 20} y={liveEarthY - liveOrbitalRy - 4} className="text-[8px] font-mono fill-emerald-400">Moon Orbit (5.14° Tilt)</text>

                    {/* 2. EARTH BODY (Middle) */}
                    <circle cx={liveEarthX} cy={liveEarthY} r="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                    <text x={liveEarthX} y={liveEarthY + 4} textAnchor="middle" className="text-[9px] font-mono font-bold fill-blue-300">
                      EARTH
                    </text>

                    {/* Line connecting Earth and Moon */}
                    <line x1={liveEarthX} y1={liveEarthY} x2={liveMoonX} y2={liveMoonY} stroke="#64748b" strokeWidth="1" opacity="0.6" />

                    {/* DYNAMIC MOON BODY positioned at exact live phase angle & ecliptic latitude */}
                    <g transform={`translate(${liveMoonX}, ${liveMoonY})`}>
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
                        className="text-[9px] font-mono font-bold fill-emerald-300"
                      >
                        MOON ({phaseDeg}°)
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
                      <circle cx="50" cy="110" r="32" fill="url(#sunGlow)" />
                      <circle cx="50" cy="110" r="28" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                      <text x="50" y="114" textAnchor="middle" className="text-[10px] font-black fill-slate-950 font-mono">
                        SUN
                      </text>

                      {/* 2D Tilted Lunar Orbital Plane Ring around Earth */}
                      <ellipse cx={earthX} cy={earthY} rx={rx} ry={ry} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                      <text x={earthX - rx} y={earthY - ry - 4} className="text-[8px] font-mono fill-emerald-400 font-bold">
                        Moon 2D Orbit Plane (5.14° Inclination)
                      </text>

                      {/* Light Rays from Sun extending towards Earth & Moon */}
                      <line x1="50" y1="82" x2={earthX} y2={earthY - 20} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                      <line x1="50" y1="138" x2={earthX} y2={earthY + 20} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                      {/* Moon Shadow Cone projecting from Moon */}
                      {moonOrbitalX < earthX && (
                        <polygon
                          points={`${moonOrbitalX},${moonOrbitalY - 4} ${earthX},${earthY - (beta * 5) - 6} ${earthX},${earthY - (beta * 5) + 6} ${moonOrbitalX},${moonOrbitalY + 4}`}
                          fill="url(#umbraGrad)" opacity="0.8" stroke="#fbbf24" strokeWidth="0.5"
                        />
                      )}

                      {/* MOON BODY orbiting Earth in 2D */}
                      <g transform={`translate(${moonOrbitalX}, ${moonOrbitalY})`}>
                        {Math.abs(beta) > 0.3 && (
                          <line x1="0" y1="0" x2="0" y2={earthY - moonOrbitalY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                        )}
                        <circle r="14" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
                        <circle r="9" fill={eclipse.type.includes('SOLAR') ? '#fbbf24' : '#94a3b8'} stroke="#ffffff" strokeWidth="2" className="drop-shadow" />
                        <text x={moonOrbitalX > earthX - 40 ? -12 : 14} y="4" textAnchor={moonOrbitalX > earthX - 40 ? 'end' : 'start'} className="text-[9px] font-mono font-bold fill-emerald-400">
                          MOON ({phaseDeg}°, β={beta}°)
                        </text>
                      </g>

                      {/* EARTH BODY (Right) */}
                      <circle cx={earthX} cy={earthY} r="20" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                      <text x={earthX} y={earthY + 4} textAnchor="middle" className="text-[9px] font-mono font-bold fill-blue-300">
                        EARTH
                      </text>

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
                        <circle cx="0" cy="0" r="32" fill="url(#sunGlow)" />
                        <circle cx="0" cy="0" r="26" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />

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
                            <g transform={`translate(${earthX}, ${earthY})`}>
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

                              <text x="0" y="4" textAnchor="middle" className={`text-[10px] font-mono font-extrabold ${isTerrestrialLunarEclipse ? 'fill-rose-300' : 'fill-blue-200'}`}>
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
                      <circle cx="50" cy="110" r="32" fill="url(#sunGlow)" />
                      <circle cx="50" cy="110" r="28" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                      <text x="50" y="114" textAnchor="middle" className="text-[10px] font-black fill-slate-950 font-mono">
                        SUN
                      </text>

                      {/* FIXED MOON AT CENTER (Selenocentric Frame) */}
                      <g transform="translate(260, 110)">
                        <circle r="14" fill="#64748b" stroke="#ffffff" strokeWidth="2" className="drop-shadow" />
                        <text x="0" y="24" textAnchor="middle" className="text-[9px] font-mono font-bold fill-emerald-300">
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
                            <polygon points={`${selenocentricEarthX},${selenocentricEarthY - 18} 500,60 500,160 ${selenocentricEarthX},${selenocentricEarthY + 18}`} fill="url(#penumbraGrad)" />
                            <polygon points={`${selenocentricEarthX},${selenocentricEarthY - 18} 480,110 ${selenocentricEarthX},${selenocentricEarthY + 18}`} fill="url(#umbraGrad)" stroke="#f43f5e" strokeWidth="1" />

                            {/* EARTH BODY revolving relative to Moon */}
                            <g transform={`translate(${selenocentricEarthX}, ${selenocentricEarthY})`}>
                              <circle r="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                              <text x="0" y="4" textAnchor="middle" className="text-[8px] font-mono font-bold fill-blue-200">
                                EARTH
                              </text>
                              <text x="0" y="-22" textAnchor="middle" className="text-[8px] font-mono fill-indigo-300 font-bold">
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

              {/* Dynamic Readout Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 font-mono text-[10px] text-slate-300">
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
                  <span className="text-slate-500 font-bold uppercase">Vertical Offset</span>
                  <span className={`font-bold text-xs ${verticalOffsetKm === 0 ? 'text-emerald-400' : (verticalOffsetKm > 0 ? 'text-amber-400' : 'text-indigo-400')}`}>
                    {verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : `${verticalOffsetKm.toLocaleString()}`} km
                  </span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
                  <span className="text-slate-500 font-bold uppercase">Ecliptic Lat (β)</span>
                  <span className="text-emerald-400 font-bold text-xs">{beta}° {Math.abs(beta) < 1.5 ? '(In Corridor)' : '(Out Corridor)'}</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
                  <span className="text-slate-500 font-bold uppercase">Phase Elongation</span>
                  <span className="text-amber-400 font-bold text-xs">{phaseDeg}° ({(phaseVal * 100).toFixed(0)}%)</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
                  <span className="text-slate-500 font-bold uppercase">Lunar Distance</span>
                  <span className="text-indigo-400 font-bold text-xs">{distKm.toLocaleString()} km</span>
                </div>
              </div>

            </div>
          );
        })()}

        {/* TAB 2: 5.14° NODAL PLANE ALIGNMENT VISUALIZER */}
        {activeTab === 'nodes' && (() => {
          const beta = eclipse.beta;
          const distKm = eclipse.distanceKm || 384000;
          const offsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));

          return (
            <div className="w-full h-full flex flex-col justify-between p-2">
              <div className="text-xs text-slate-300 mb-1 font-mono flex justify-between items-center">
                <span className="font-bold text-amber-300">Why Eclipses Don't Happen Every Month:</span>
                <span className="text-emerald-400 font-bold">Moon Orbit Tilt = 5.14°</span>
              </div>

              <svg viewBox="0 0 500 180" className="w-full h-full max-h-[180px]" preserveAspectRatio="xMidYMid meet">
                {/* Ecliptic Reference Line (0°) */}
                <line x1="20" y1="90" x2="480" y2="90" stroke="#f59e0b" strokeWidth="2" />
                <text x="30" y="82" className="text-[10px] font-mono font-bold fill-amber-400">Ecliptic Plane (0° Earth-Sun Orbit)</text>

                {/* Tilted Lunar Orbit Line (5.14°) */}
                <line x1="30" y1="150" x2="470" y2="30" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
                <text x="360" y="34" className="text-[10px] font-mono font-bold fill-emerald-400">Moon Orbit (5.14° Tilt)</text>

                {/* Intersection Node Point (Ascending Node ☊) */}
                <circle cx="250" cy="90" r="6" fill="#f43f5e" stroke="white" strokeWidth="1.5" className="animate-ping" />
                <circle cx="250" cy="90" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                <text x="250" y="112" textAnchor="middle" className="text-[10px] font-mono font-bold fill-rose-400">
                  Ascending Node ☊ (Eclipse Crossing Point)
                </text>

                {/* Current Moon Position Marker along Tilted Path */}
                {(() => {
                  const nodeX = 250 + (beta * 32);
                  const nodeY = 90 - (beta * 11.6);
                  return (
                    <g transform={`translate(${nodeX}, ${nodeY})`}>
                      <line x1="0" y1="0" x2="0" y2={90 - nodeY} stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle r="9" fill={eclipse.isEclipseActive ? '#f43f5e' : '#3b82f6'} stroke="white" strokeWidth="2" className="drop-shadow" />
                      <text x="12" y="4" className="text-[10px] font-mono font-bold fill-blue-300">
                        CURRENT MOON (β = {beta}°, Y = {offsetKm > 0 ? `+${offsetKm.toLocaleString()}` : offsetKm.toLocaleString()} km)
                      </text>
                    </g>
                  );
                })()}

                {/* Eclipse Corridor Threshold Box (< 1.5°) */}
                <rect x="202" y="72" width="96" height="36" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" rx="6" />
                <text x="250" y="66" textAnchor="middle" className="text-[8px] font-mono font-bold fill-rose-300">
                  ±1.5° Eclipse Corridor
                </text>
              </svg>

              {/* Alignment Proximity Meter & Physical Explanation */}
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Node Proximity Metric:</span>
                  <span className={`font-bold ${eclipse.isEclipseActive ? 'text-amber-400' : 'text-slate-300'}`}>
                    {eclipse.alignmentPercent}% Node Alignment (Ecliptic Lat β: {beta}°)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${eclipse.isEclipseActive ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-indigo-600'}`} 
                    style={{ width: `${eclipse.alignmentPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
                  {Math.abs(beta) < 1.5 ? (
                    <span className="text-amber-300 font-bold">✨ Inside Eclipse Corridor! The Moon is aligned near the node line so its shadow hits Earth.</span>
                  ) : (
                    <span>💡 The Moon is <strong>{Math.abs(offsetKm).toLocaleString()} km</strong> {offsetKm > 0 ? 'above' : 'below'} the ecliptic plane, causing its shadow to pass into empty space.</span>
                  )}
                </p>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: SKY VIEW SIMULATOR (OBSERVER FROM EARTH) */}
        {activeTab === 'sky' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 240 240" className="w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
              
              {/* Sky Background */}
              <circle cx="120" cy="120" r="100" fill={eclipse.type.includes('SOLAR') ? '#020617' : '#0f172a'} stroke="#1e293b" strokeWidth="2" />
              
              {/* SOLAR ECLIPSE VIEW */}
              {eclipse.category === 'SOLAR' && (
                <g>
                  {/* Solar Corona Glowing Rays during Totality */}
                  {eclipse.type === 'TOTAL_SOLAR' && (
                    <g>
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                        <line 
                          key={angle}
                          x1={120 + 40 * Math.cos((angle * Math.PI) / 180)}
                          y1={120 + 40 * Math.sin((angle * Math.PI) / 180)}
                          x2={120 + 75 * Math.cos((angle * Math.PI) / 180)}
                          y2={120 + 75 * Math.sin((angle * Math.PI) / 180)}
                          stroke="#fef08a" strokeWidth="3" opacity="0.6" strokeLinecap="round" className="animate-pulse"
                        />
                      ))}
                    </g>
                  )}

                  {/* Sun Disk */}
                  <circle cx="120" cy="120" r="42" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />

                  {/* Moon Disk Overlap offset based on beta & obscuration */}
                  {(() => {
                    const offset = (1 - eclipse.obscuration / 100) * 80;
                    return (
                      <circle 
                        cx={120 + offset} 
                        cy={120 + (eclipse.beta * 4)} 
                        r="42" 
                        fill="#020617" 
                        stroke={eclipse.type === 'ANNULAR_SOLAR' ? '#f59e0b' : '#334155'} 
                        strokeWidth={eclipse.type === 'ANNULAR_SOLAR' ? '3' : '1'} 
                      />
                    );
                  })()}
                </g>
              )}

              {/* LUNAR ECLIPSE VIEW */}
              {eclipse.category === 'LUNAR' && (
                <g>
                  {/* Earth Umbra Shadow Ring */}
                  <circle cx="120" cy="120" r="70" fill="#450a0a" opacity="0.5" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* Moon Body in Umbra */}
                  <circle 
                    cx="120" 
                    cy={120 + (eclipse.beta * 8)} 
                    r="40" 
                    fill={eclipse.type === 'TOTAL_LUNAR' ? '#9f1239' : '#475569'} 
                    stroke={eclipse.type === 'TOTAL_LUNAR' ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="2" 
                    className="drop-shadow-lg" 
                  />
                  {eclipse.type === 'TOTAL_LUNAR' && (
                    <circle cx="120" cy="120" r="40" fill="#fb7185" fillOpacity="0.2" className="animate-pulse" />
                  )}
                </g>
              )}

              {/* NO ECLIPSE NORMAL SKY VIEW */}
              {eclipse.category === 'NO_ECLIPSE' && (
                <g>
                  <circle cx="120" cy="120" r="45" fill="#fbbf24" stroke="#ffffff" strokeWidth="3" />
                  <text x="120" y="125" textAnchor="middle" className="text-xs font-black fill-slate-950 font-mono">
                    SUN (Normal Day)
                  </text>
                </g>
              )}
            </svg>

            {/* Viewport Overlay Label */}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
              <span className="text-amber-400 font-bold">{eclipse.label}</span>
              <span className="text-slate-400 ml-2">Obscuration: {eclipse.obscuration}%</span>
            </div>
          </div>
        )}

        {/* TAB 4: ECLIPSE EVENT SCANNER & PRESET JUMPS */}
        {activeTab === 'scanner' && (
          <div className="w-full h-full flex flex-col justify-between overflow-y-auto space-y-3 p-1">
            <div>
              <div className="text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Historic & Future Famous Eclipses:</span>
                <span className="text-indigo-400 text-[10px]">Click to Scrub Engine Date</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ECLIPSE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset.date)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 p-2.5 rounded-xl text-left transition-all group flex items-start justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold font-mono text-indigo-300 group-hover:text-amber-400">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {preset.description}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Nearest Discovered Eclipses Scanner */}
            <div className="border-t border-slate-800 pt-2">
              <div className="text-xs font-mono font-bold text-emerald-400 mb-1.5">
                Discovered Eclipses from Current Date ({formatYMD(currentDate)}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {upcomingEclipses.length > 0 ? (
                  upcomingEclipses.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(item.date)}
                      className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500 p-2 rounded-xl text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-200">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          {item.label}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                        +{item.dayOffset} days
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 font-mono">No eclipses within 365 days.</div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Footer Spatial Context Readout */}
      <div className="mt-3 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Syzygy Phase: <strong className="text-amber-400">{(eclipse.phaseValue * 100).toFixed(1)}%</strong></span>
        <span>Ecliptic Lat β: <strong className="text-rose-400">{eclipse.beta}°</strong></span>
        <span>Alignment: <strong className="text-emerald-400">{eclipse.alignmentPercent}%</strong></span>
      </div>

    </div>
  );
};

export default EclipseDemonstrator;
