import React, { useState } from 'react';
import { Sparkles, Zap, Flame, Compass, Info } from 'lucide-react';
import { CONFIG, calculateEarthOrbitalPhysics, getJulianDate } from '../../utils/cosmicMath';

export const MacroOrbitView = ({ positions, eclipse, solarData, currentDate = new Date() }) => {
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState(false);
  const { earth = { x: 200, y: 0 }, moon = { x: 260, y: 0 } } = positions || {};
  const isEclipse = eclipse && eclipse.isEclipseActive;

  // Calculate live Keplerian orbital physics
  const julianDate = getJulianDate(currentDate, 12);
  const physics = (solarData && solarData.distanceAU) ? solarData : calculateEarthOrbitalPhysics(julianDate);

  const {
    distanceAU = 1.00,
    distanceKm = 149597870,
    orbitalSpeedKms = 29.78,
    solarIrradiancePercent = 100.0,
    sunAngularDiameterArcmin = 32.0,
    isPerihelion = false,
    isAphelion = false
  } = physics;

  // Compute visual Earth coordinates if exaggerated eccentricity (e = 0.25) is turned on
  const orbitalRadius = 200;
  let renderEarthX = earth.x;
  let renderEarthY = earth.y;
  let renderSunX = 0;
  let renderSunY = 0;
  let focus2X = 0;

  if (exaggerateEccentricity) {
    const e = 0.25;
    const a = orbitalRadius;
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e; // Focal distance = 50px
    renderSunX = -c; // Sun at Focus F1 (-50, 0)
    focus2X = c;     // Empty Focus F2 (+50, 0)

    // Convert Earth angle relative to orbital center
    const angleRad = Math.atan2(earth.y, earth.x);
    renderEarthX = a * Math.cos(angleRad);
    renderEarthY = b * Math.sin(angleRad);
  }

  // Calculate Moon position relative to Earth
  const moonDx = moon.x - earth.x;
  const moonDy = moon.y - earth.y;
  const renderMoonX = renderEarthX + moonDx;
  const renderMoonY = renderEarthY + moonDy;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* Top Inline Controls & Eclipse Indicator */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Keplerian 1 AU orbital radius &amp; seasonal distance physics
        </p>

        <div className="flex items-center gap-2">
          {/* Mode Toggle: True Scale vs Exaggerated e=0.25 */}
          <button
            onClick={() => setExaggerateEccentricity(!exaggerateEccentricity)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
              exaggerateEccentricity 
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm' 
                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
            title="Toggle exaggerated orbital eccentricity (e = 0.25) to visualize Kepler's 1st & 2nd Laws"
          >
            {exaggerateEccentricity ? 'Mode: Exaggerated (e=0.25)' : 'Mode: True Scale (e=0.0167)'}
          </button>

          {isEclipse && (
            <span className="text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/80 px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {eclipse.label}
            </span>
          )}
        </div>
      </div>

      {/* Main SVG Viewport */}
      <div className="relative w-full flex-1 min-h-[210px] flex items-center justify-center p-2 bg-slate-950 rounded-xl border border-slate-800/80">
        <svg viewBox="-260 -260 520 520" className="w-full h-full max-h-[290px]" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="sunMacroGlow" cx="50%" cy="50%" r="50%">
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sun Ray Beams when Eclipse Active */}
          {isEclipse && (
            <line 
              x1={renderSunX} y1={renderSunY} x2={renderEarthX} y2={renderEarthY} 
              stroke={eclipse.category === 'SOLAR' ? '#fbbf24' : '#f43f5e'} 
              strokeWidth="3" opacity="0.6" strokeDasharray="6 3" className="animate-pulse" 
            />
          )}

          {/* Earth Orbit Ring (Circle in True Scale, Ellipse in Exaggerated Mode) */}
          {exaggerateEccentricity ? (
            <g>
              {/* Major Axis Line */}
              <line x1="-200" y1="0" x2="200" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
              {/* Exaggerated Ellipse e = 0.25 (a=200, b=193.6) */}
              <ellipse cx="0" cy="0" rx="200" ry="193.6" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Empty Focus F2 Indicator */}
              <circle cx={focus2X} cy="0" r="3" fill="#64748b" opacity="0.5" />
              <text x={focus2X} y="-8" textAnchor="middle" className="text-[7px] font-mono fill-slate-500">Focus F₂</text>
            </g>
          ) : (
            <circle cx="0" cy="0" r="200" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
          )}

          {/* Radial Line Sun -> Earth */}
          <line x1={renderSunX} y1={renderSunY} x2={renderEarthX} y2={renderEarthY} stroke="#475569" strokeWidth="1" opacity="0.4" />

          {/* Perihelion & Aphelion Markers */}
          <g>
            {/* Perihelion (Jan ~3) - Leftmost point relative to Sun */}
            <circle cx="-200" cy="0" r="4" fill="#ef4444" />
            <text x="-205" y="-8" textAnchor="end" className="text-[8px] font-mono font-extrabold fill-rose-400">
              Perihelion (Jan 3)
            </text>
            <text x="-205" y="12" textAnchor="end" className="text-[7px] font-mono fill-rose-300">
              0.983 AU | 30.29 km/s
            </text>

            {/* Aphelion (July ~4) - Rightmost point relative to Sun */}
            <circle cx="200" cy="0" r="4" fill="#38bdf8" />
            <text x="205" y="-8" textAnchor="start" className="text-[8px] font-mono font-extrabold fill-sky-400">
              Aphelion (Jul 4)
            </text>
            <text x="205" y="12" textAnchor="start" className="text-[7px] font-mono fill-sky-300">
              1.017 AU | 29.29 km/s
            </text>
          </g>
          
          {/* Solstice & Equinox Markers along Orbit */}
          <g opacity="0.6">
            <circle cx="0" cy="200" r="3" fill="#f59e0b" />
            <text x="-16" y="215" className="text-[8px] font-mono font-bold fill-amber-400">Jun Solstice</text>

            <circle cx="0" cy="-200" r="3" fill="#c084fc" />
            <text x="-16" y="-208" className="text-[8px] font-mono font-bold fill-purple-300">Dec Solstice</text>
          </g>

          {/* Sun Center */}
          <g transform={`translate(${renderSunX}, ${renderSunY})`}>
            <circle cx="0" cy="0" r="28" fill="url(#sunMacroGlow)" />
            <circle cx="0" cy="0" r="24" fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="3" textAnchor="middle" className="text-[9px] font-black fill-slate-950 font-mono">
              SUN {exaggerateEccentricity ? '(Focus F₁)' : ''}
            </text>
          </g>

          {/* Earth and Moon System */}
          <g transform={`translate(${renderEarthX}, ${renderEarthY})`}>
            {/* Moon Orbit Ring */}
            <circle r="44" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            {/* Earth Body */}
            <circle r="11" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="drop-shadow" />
            <text x="0" y="17" textAnchor="middle" className="text-[8px] font-mono font-bold fill-blue-300">EARTH</text>
          </g>
          
          {/* Moon Body */}
          <circle cx={renderMoonX} cy={renderMoonY} r="5" fill="#e2e8f0" stroke="#334155" strokeWidth="1" className="drop-shadow" />
        </svg>
      </div>

      {/* Dynamic Physics HUD Footer */}
      <div className="mt-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" /> Earth-Sun Distance
          </span>
          <span className="font-bold text-indigo-300">
            {distanceAU} AU <span className="text-slate-500">({(distanceKm / 1e6).toFixed(1)}M km)</span>
          </span>
        </div>

        <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Orbital Speed
          </span>
          <span className="font-bold text-amber-300">
            {orbitalSpeedKms} km/s
          </span>
        </div>

        <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" /> Solar Irradiance
          </span>
          <span className="font-bold text-rose-300">
            {solarIrradiancePercent}% <span className="text-slate-500">of mean</span>
          </span>
        </div>

        <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-400" /> Solar Diameter
          </span>
          <span className="font-bold text-cyan-300">
            {sunAngularDiameterArcmin}' <span className="text-slate-500">arcmin</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MacroOrbitView;
