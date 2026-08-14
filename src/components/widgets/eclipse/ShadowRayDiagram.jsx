import React from 'react';

export const ShadowRayDiagram = ({
  eclipse,
  diagramMode = 'live',
  setDiagramMode,
  lunarViewSubTab = 'pov',
  setLunarViewSubTab
}) => {
  if (!eclipse) return null;

  // Physical vertical offset calculation in km and scaled SVG pixels
  const beta = eclipse.beta; // -5.14° to +5.14°
  const distKm = eclipse.distanceKm || 384000;
  const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
  const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 1.0 (Full Moon = 0.5)
  const phaseRad = phaseVal * 2 * Math.PI;
  const phaseDeg = Math.round(phaseVal * 360);

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
    text: `Phase: ${phaseDeg}° | Vertical Offset: ${verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : verticalOffsetKm.toLocaleString()} km`, 
    bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700' 
  };
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
              onClick={() => setDiagramMode && setDiagramMode('live')}
              className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                diagramMode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Orbit
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('solar')}
              className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                diagramMode === 'solar' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solar Focus (2D Moon Orbit)
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('lunar')}
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
              onClick={() => setLunarViewSubTab && setLunarViewSubTab('pov')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                lunarViewSubTab === 'pov' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌙 Lunar Surface POV
            </button>
            <button
              onClick={() => setLunarViewSubTab && setLunarViewSubTab('orbit')}
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
};

export default ShadowRayDiagram;
