import React, { useState, useMemo } from 'react';
import { Sparkles, Zap, Flame, Compass, Info } from 'lucide-react';
import { CONFIG, calculateEarthOrbitalPhysics, getJulianDate } from '../../utils/cosmicMath';
import { EclipseData, SolarAlmanacData, OrbitalPositions, SolarPositionFull } from '../../types';

export interface MilestoneItem {
  id: string;
  label: string;
  date: string;
  rawX: number;
  rawY: number;
  color: string;
  textColor: string;
  fillColor: string;
  distanceAU: number;
  distanceKm: number;
  speedKms: number;
  description: string;
  textAnchor: 'start' | 'middle' | 'end';
  textDx: number;
  textDy: number;
  subDy: number;
}

const MILESTONES: MilestoneItem[] = [
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
    textDx: -14,
    textDy: -6,
    subDy: 10
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
    textDx: -14,
    textDy: 4,
    subDy: 18
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
    textDy: 20,
    subDy: 34
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
    textDx: 14,
    textDy: -6,
    subDy: 10
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
    textDx: 14,
    textDy: 4,
    subDy: 18
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
    textDy: -20,
    subDy: -34
  }
];

export interface MacroOrbitViewProps {
  positions?: OrbitalPositions | null;
  eclipse?: EclipseData | null;
  solarData?: SolarAlmanacData | null;
  currentDate?: Date;
}

export const MacroOrbitView: React.FC<MacroOrbitViewProps> = ({ 
  positions, 
  eclipse, 
  solarData, 
  currentDate = new Date() 
}) => {
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { earth = { x: 200, y: 0 }, moon = { x: 260, y: 0 } } = positions || {};
  const isEclipse = eclipse && eclipse.isEclipseActive;

  // Calculate live Keplerian orbital physics
  const julianDate = getJulianDate(currentDate, 12);
  const physics: SolarPositionFull = calculateEarthOrbitalPhysics(julianDate);

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

  // Lookup active hovered node details smoothly without recreating state
  const activeHoverData = useMemo(() => {
    if (!hoveredId) return null;
    if (hoveredId === 'earth') {
      return {
        label: 'Current Earth Position',
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        distanceAU,
        distanceKm,
        speedKms: orbitalSpeedKms,
        description: `Live Keplerian orbital position. Distance: ${distanceAU} AU (${(distanceKm / 1e6).toFixed(1)}M km), Speed: ${orbitalSpeedKms} km/s, Irradiance: ${solarIrradiancePercent}% of mean.`
      };
    }
    const found = MILESTONES.find(m => m.id === hoveredId);
    if (!found) return null;
    return {
      label: found.label,
      date: found.date,
      distanceAU: found.distanceAU,
      distanceKm: found.distanceKm,
      speedKms: found.speedKms,
      description: found.description
    };
  }, [hoveredId, currentDate, distanceAU, distanceKm, orbitalSpeedKms, solarIrradiancePercent]);

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* Top Inline Controls & Eclipse Indicator */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Keplerian 1 AU orbital radius &amp; seasonal distance physics
        </p>

        <div className="flex items-center gap-2">
          {/* Mode Toggle Switch: True Scale vs Exaggerated e=0.25 */}
          <div className="flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-lg border border-slate-800/90 text-xs font-mono">
            <button
              onClick={() => setExaggerateEccentricity(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                !exaggerateEccentricity 
                  ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/60 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="True Physical Scale (e = 0.0167, circular heliocentric appearance)"
            >
              True (e=0.017)
            </button>
            <button
              onClick={() => setExaggerateEccentricity(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                exaggerateEccentricity 
                  ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/60 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Exaggerated Elliptical Scale (e = 0.25, demonstrating dual focal points and orbital asymmetry)"
            >
              Exaggerated (e=0.25)
            </button>
          </div>

          {isEclipse && (
            <div className="flex items-center gap-1 bg-amber-950/90 text-amber-300 border border-amber-500/70 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Syzygy Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main SVG Heliocentric Orbit Viewport */}
      <div className="relative w-full flex-1 min-h-[300px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
        
        {/* Interactive Hover HUD Overlay Box (with pointer-events-none to prevent flutter) */}
        {activeHoverData && (
          <div className="absolute top-3 left-3 z-20 bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-xl max-w-xs shadow-xl font-mono space-y-1 pointer-events-none transition-opacity duration-150">
            <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
              <span>{activeHoverData.label}</span>
              <span className="text-slate-400 text-[10px]">{activeHoverData.date}</span>
            </div>
            <div className="text-[10px] text-slate-300">
              Distance: <strong className="text-white">{activeHoverData.distanceAU} AU</strong> ({(activeHoverData.distanceKm / 1e6).toFixed(1)}M km)
            </div>
            {activeHoverData.speedKms && (
              <div className="text-[10px] text-slate-300">
                Orbital Speed: <strong className="text-indigo-300">{activeHoverData.speedKms} km/s</strong>
              </div>
            )}
            <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-tight">
              {activeHoverData.description}
            </div>
          </div>
        )}

        <svg 
          viewBox="-290 -280 580 560" 
          className="w-full h-full max-h-[380px] overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Faint Concentric Distance Reference Rings (0.5 AU, 1.0 AU, 1.25 AU) */}
          <circle r="100" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.4" className="pointer-events-none" />
          <text x="0" y="-103" textAnchor="middle" className="text-[7px] font-mono fill-slate-500 select-none pointer-events-none">0.5 AU</text>

          <circle r="200" fill="none" stroke="#334155" strokeWidth="0.75" strokeDasharray="4 4" strokeOpacity="0.6" className="pointer-events-none" />
          <text x="-142" y="-142" textAnchor="middle" className="text-[8px] font-mono fill-slate-400 font-bold select-none pointer-events-none">1.0 AU (149.6M km)</text>

          {/* Coordinate Crosshairs */}
          <line x1="-260" y1="0" x2="260" y2="0" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.3" className="pointer-events-none" />
          <line x1="0" y1="-260" x2="0" y2="260" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.3" className="pointer-events-none" />

          {/* Major Orbit Ellipse */}
          <ellipse 
            cx="0" 
            cy="0" 
            rx={orbitalRadius} 
            ry={orbitalRadius * bRatio} 
            fill="none" 
            stroke="#475569" 
            strokeWidth="1.2" 
            className="pointer-events-none"
          />

          {/* Kepler Empty Focus F2 indicator when exaggerated */}
          {exaggerateEccentricity && (
            <g transform={`translate(${focus2X}, 0)`} className="pointer-events-none">
              <circle r="3" fill="#64748b" stroke="#334155" strokeWidth="1" />
              <text x="0" y="-6" textAnchor="middle" className="text-[7px] font-mono fill-slate-500">Focus F2 (Empty)</text>
            </g>
          )}

          {/* Line connecting Sun (Focus F1) to Earth */}
          <line 
            x1={renderSunX} 
            y1={renderSunY} 
            x2={renderEarthX} 
            y2={renderEarthY} 
            stroke="#e2e8f0" 
            strokeWidth="1" 
            strokeDasharray="3 2" 
            opacity="0.6" 
            className="pointer-events-none"
          />

          {/* 6 Key Astronomical Orbital Milestones */}
          {MILESTONES.map((m) => {
            const mx = m.rawX;
            const my = m.rawY * bRatio;
            const isHovered = hoveredId === m.id;
            return (
              <g key={m.id}>
                {/* Persistent Translucent Glowing Halo Node (Expands on Hover) */}
                <circle 
                  cx={mx} 
                  cy={my} 
                  r={isHovered ? 18 : 11} 
                  fill={m.color} 
                  opacity={isHovered ? 0.45 : 0.20} 
                  className={`pointer-events-none transition-all duration-200 ${isHovered ? 'animate-pulse' : ''}`} 
                />
                <circle 
                  cx={mx} 
                  cy={my} 
                  r={isHovered ? 8 : 5.5} 
                  fill={m.color} 
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                  className="pointer-events-none transition-all duration-150 drop-shadow-md"
                />
                
                {/* Labels & Dates */}
                <text 
                  x={mx + m.textDx} 
                  y={my + m.textDy} 
                  textAnchor={m.textAnchor} 
                  className={`text-xs font-mono font-bold ${m.fillColor} select-none pointer-events-none drop-shadow-sm`}
                >
                  {m.label}
                </text>
                <text 
                  x={mx + m.textDx} 
                  y={my + m.subDy} 
                  textAnchor={m.textAnchor} 
                  className="text-[10px] font-mono fill-slate-400 font-bold select-none pointer-events-none"
                >
                  {m.date}
                </text>

                {/* Generous hit target area that does not flicker */}
                <circle
                  cx={mx}
                  cy={my}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onPointerEnter={() => setHoveredId(m.id)}
                  onPointerLeave={() => setHoveredId(null)}
                />
              </g>
            );
          })}

          {/* Center Sun at Focus F1 */}
          <g transform={`translate(${renderSunX}, ${renderSunY})`} className="pointer-events-none">
            {/* Sun Corona Rays */}
            <circle r="22" fill={CONFIG.THEME.SUN_FILL} opacity="0.2" />
            <circle r="15" fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="1.5" className="drop-shadow-lg" />
            <text x="0" y="3" textAnchor="middle" className="text-[8px] font-black fill-amber-950 font-mono select-none">
              SUN
            </text>
            {exaggerateEccentricity && (
              <text x="0" y="24" textAnchor="middle" className="text-[7px] font-mono fill-amber-400 font-bold select-none">
                Focus F1 (Sun)
              </text>
            )}
          </g>

          {/* Earth Body on Orbit */}
          <g transform={`translate(${renderEarthX}, ${renderEarthY})`}>
            {/* Moon Orbit Ring */}
            <circle r={CONFIG.ORBIT.moonOrbitRadius} fill="none" stroke="#475569" strokeWidth="0.75" strokeDasharray="2 2" className="pointer-events-none" />
            {/* Earth Body */}
            <circle r="10" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="drop-shadow pointer-events-none" />
            <text x="0" y="16" textAnchor="middle" className="text-[10px] font-mono font-bold fill-blue-300 select-none pointer-events-none">EARTH</text>
            
            {/* Stable Hit Target */}
            <circle 
              r="22" 
              fill="transparent" 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredId('earth')}
              onPointerLeave={() => setHoveredId(null)}
            />
          </g>
          
          {/* Moon Body */}
          <circle cx={renderMoonX} cy={renderMoonY} r="4.5" fill="#f8fafc" stroke="#334155" strokeWidth="1" className="drop-shadow pointer-events-none" />
        </svg>
      </div>

      {/* Dynamic Physics HUD Footer */}
      <div className="mt-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800/50 text-xs font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
          <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" /> Earth-Sun Dist
          </span>
          <span className="font-semibold text-indigo-300 text-xs mt-0.5 font-mono">
            {distanceAU} AU <span className="text-slate-400 text-[10px] font-normal font-sans">({(distanceKm / 1e6).toFixed(1)}M km)</span>
          </span>
        </div>

        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
          <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Orbital Speed
          </span>
          <span className="font-semibold text-amber-300 text-xs mt-0.5 font-mono">
            {orbitalSpeedKms} <span className="text-slate-400 text-[10px] font-normal font-sans">km/s</span>
          </span>
        </div>

        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
          <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" /> Irradiance
          </span>
          <span className="font-semibold text-rose-300 text-xs mt-0.5 font-mono">
            {solarIrradiancePercent}% <span className="text-slate-400 text-[10px] font-normal font-sans">of mean</span>
          </span>
        </div>

        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
          <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-300" /> Sun Diameter
          </span>
          <span className="font-semibold text-slate-200 text-xs mt-0.5 font-mono">
            {sunAngularDiameterArcmin}' <span className="text-slate-400 text-[10px] font-normal font-sans">arcmin</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MacroOrbitView;
