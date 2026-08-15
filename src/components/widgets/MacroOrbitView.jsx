import React, { useState } from 'react';
import { Sparkles, Zap, Flame, Compass, Info } from 'lucide-react';
import { CONFIG, calculateEarthOrbitalPhysics, getJulianDate } from '../../utils/cosmicMath';

const MILESTONES = [
  {
    id: 'perihelion',
    label: 'Perihelion',
    date: 'Jan 3',
    rawX: -200,
    rawY: 0,
    color: '#ef4444',
    textColor: 'text-rose-400',
    fillColor: 'fill-rose-400',
    distanceAU: 0.983,
    distanceKm: 147098070,
    speedKms: 30.29,
    description: "Earth's closest approach to the Sun. Orbital velocity peaks according to Kepler's 2nd Law (Equal Areas in Equal Times).",
    textAnchor: 'end',
    textDx: -10,
    textDy: -6,
    subDy: 8
  },
  {
    id: 'mar_equinox',
    label: 'March Equinox',
    date: 'Mar 20',
    rawX: -141.42,
    rawY: 141.42,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 0.996,
    distanceKm: 149000000,
    speedKms: 29.84,
    description: "Vernal Equinox. Sun crosses the celestial equator northbound; day and night are approximately equal (12h) worldwide.",
    textAnchor: 'end',
    textDx: -8,
    textDy: 4,
    subDy: 16
  },
  {
    id: 'jun_solstice',
    label: 'June Solstice',
    date: 'Jun 21',
    rawX: 0,
    rawY: 200,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 1.016,
    distanceKm: 152000000,
    speedKms: 29.31,
    description: "Northern Summer Solstice. Earth's Northern Hemisphere reaches maximum axial tilt (+23.44°) toward the Sun; longest daylight in the North.",
    textAnchor: 'middle',
    textDx: 0,
    textDy: 16,
    subDy: 28
  },
  {
    id: 'aphelion',
    label: 'Aphelion',
    date: 'Jul 4',
    rawX: 200,
    rawY: 0,
    color: '#38bdf8',
    textColor: 'text-sky-400',
    fillColor: 'fill-sky-400',
    distanceAU: 1.017,
    distanceKm: 152097700,
    speedKms: 29.29,
    description: "Earth's furthest orbital point from the Sun. Orbital velocity reaches minimum speed according to Kepler's 2nd Law.",
    textAnchor: 'start',
    textDx: 10,
    textDy: -6,
    subDy: 8
  },
  {
    id: 'sep_equinox',
    label: 'September Equinox',
    date: 'Sep 22',
    rawX: 141.42,
    rawY: -141.42,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 1.003,
    distanceKm: 150050000,
    speedKms: 29.74,
    description: "Autumnal Equinox. Sun crosses the celestial equator southbound; day and night are approximately equal (12h) worldwide.",
    textAnchor: 'start',
    textDx: 8,
    textDy: 4,
    subDy: 16
  },
  {
    id: 'dec_solstice',
    label: 'December Solstice',
    date: 'Dec 21',
    rawX: 0,
    rawY: -200,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 0.984,
    distanceKm: 147200000,
    speedKms: 30.27,
    description: "Northern Winter Solstice. Earth's Southern Hemisphere reaches maximum axial tilt toward the Sun; shortest daylight in the North.",
    textAnchor: 'middle',
    textDx: 0,
    textDy: -16,
    subDy: -28
  }
];

export const MacroOrbitView = ({ positions, eclipse, solarData, currentDate = new Date() }) => {
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
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
    sunAngularDiameterArcmin = 32.0
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

  const bRatio = exaggerateEccentricity ? Math.sqrt(1 - 0.25 * 0.25) : 1;

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
      <div className="relative w-full flex-1 min-h-[210px] flex items-center justify-center p-2 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
        
        {/* Floating Milestone HUD Overlay */}
        {hoveredNode && (
          <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 shadow-2xl z-20 text-xs font-mono space-y-1 pointer-events-none transition-all animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: hoveredNode.color }} />
                <span className={hoveredNode.textColor}>{hoveredNode.label}</span>
              </div>
              <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                {hoveredNode.date}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
              <div>
                <span className="text-slate-500">Dist: </span>
                <strong className="text-indigo-300">{hoveredNode.distanceAU} AU</strong>
                <span className="text-slate-500 text-[9px]"> ({(hoveredNode.distanceKm / 1e6).toFixed(1)}M km)</span>
              </div>
              <div>
                <span className="text-slate-500">Speed: </span>
                <strong className="text-amber-300">{hoveredNode.speedKms} km/s</strong>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
              {hoveredNode.description}
            </p>
          </div>
        )}

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
              <text x={focus2X} y="-8" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Focus F₂</text>
            </g>
          ) : (
            <circle cx="0" cy="0" r="200" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
          )}

          {/* Radial Line Sun -> Earth */}
          <line x1={renderSunX} y1={renderSunY} x2={renderEarthX} y2={renderEarthY} stroke="#475569" strokeWidth="1" opacity="0.4" />

          {/* 6 Interactive Milestone Nodes along Orbit */}
          {MILESTONES.map((m) => {
            const posX = m.rawX;
            const posY = m.rawY * bRatio;
            const isHovered = hoveredNode && hoveredNode.id === m.id;

            return (
              <g 
                key={m.id}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredNode(m)}
                onPointerLeave={() => setHoveredNode(null)}
              >
                {/* Transparent Hit Area */}
                <circle cx={posX} cy={posY} r="16" fill="transparent" />

                {/* Outer Glow Halo on Hover */}
                {isHovered && (
                  <circle cx={posX} cy={posY} r="10" fill={m.color} opacity="0.3" className="animate-ping" />
                )}

                {/* Node Marker Dot */}
                <circle 
                  cx={posX} 
                  cy={posY} 
                  r={isHovered ? 6 : 4.5} 
                  fill={m.color} 
                  stroke="#ffffff" 
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-150 drop-shadow"
                />

                {/* Label Text */}
                <text 
                  x={posX + m.textDx} 
                  y={posY + m.textDy} 
                  textAnchor={m.textAnchor} 
                  className={`text-[10px] font-mono font-bold ${m.fillColor} select-none pointer-events-none`}
                >
                  {m.label} ({m.date})
                </text>

                {/* Subtext with Distance & Speed */}
                <text 
                  x={posX + m.textDx} 
                  y={posY + m.subDy} 
                  textAnchor={m.textAnchor} 
                  className={`text-[9px] font-mono ${isHovered ? 'fill-white font-bold' : 'fill-slate-400'} select-none pointer-events-none`}
                >
                  {m.distanceAU} AU | {m.speedKms} km/s
                </text>
              </g>
            );
          })}

          {/* Sun Center */}
          <g transform={`translate(${renderSunX}, ${renderSunY})`}>
            <circle cx="0" cy="0" r="28" fill="url(#sunMacroGlow)" />
            <circle cx="0" cy="0" r="24" fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" className="text-[11px] font-black fill-slate-950 font-mono select-none">
              SUN {exaggerateEccentricity ? '(F₁)' : ''}
            </text>
          </g>

          {/* Earth and Moon System */}
          <g 
            transform={`translate(${renderEarthX}, ${renderEarthY})`}
            className="cursor-pointer"
            onPointerEnter={() => setHoveredNode({
              id: 'earth_current',
              label: 'Earth (Current Position)',
              date: 'Live Ephemeris',
              color: '#3b82f6',
              textColor: 'text-blue-400',
              fillColor: 'fill-blue-400',
              distanceAU: distanceAU,
              distanceKm: distanceKm,
              speedKms: orbitalSpeedKms,
              description: `Live Keplerian orbital position. Distance: ${distanceAU} AU (${(distanceKm / 1e6).toFixed(1)}M km), Orbital Speed: ${orbitalSpeedKms} km/s, Solar Irradiance: ${solarIrradiancePercent}% of mean.`
            })}
            onPointerLeave={() => setHoveredNode(null)}
          >
            {/* Moon Orbit Ring */}
            <circle r="44" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            {/* Transparent Hit Area */}
            <circle r="18" fill="transparent" />
            {/* Earth Body */}
            <circle r="11" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="drop-shadow" />
            <text x="0" y="17" textAnchor="middle" className="text-[10px] font-mono font-bold fill-blue-300 select-none">EARTH</text>
          </g>
          
          {/* Moon Body */}
          <circle cx={renderMoonX} cy={renderMoonY} r="5" fill="#e2e8f0" stroke="#334155" strokeWidth="1" className="drop-shadow pointer-events-none" />
        </svg>
      </div>

      {/* Dynamic Physics HUD Footer */}
      <div className="mt-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-400" /> Earth-Sun Distance
          </span>
          <span className="font-bold text-indigo-300 text-xs mt-0.5">
            {distanceAU} AU <span className="text-slate-400 text-[10px]">({(distanceKm / 1e6).toFixed(1)}M km)</span>
          </span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Orbital Speed
          </span>
          <span className="font-bold text-amber-300 text-xs mt-0.5">
            {orbitalSpeedKms} km/s
          </span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" /> Solar Irradiance
          </span>
          <span className="font-bold text-rose-300 text-xs mt-0.5">
            {solarIrradiancePercent}% <span className="text-slate-400 text-[10px]">of mean</span>
          </span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
          <span className="text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Solar Diameter
          </span>
          <span className="font-bold text-cyan-300 text-xs mt-0.5">
            {sunAngularDiameterArcmin}' <span className="text-slate-400 text-[10px]">arcmin</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MacroOrbitView;
