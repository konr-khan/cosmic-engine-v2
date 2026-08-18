import React, { useMemo } from 'react';
import { CONFIG, getTerminatorShadowPaths } from '../../utils/cosmicMath';
import { SolarAlmanacData } from '../../types';

export interface TerminatorMapProps {
  solarData?: SolarAlmanacData | null;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  hoverTime?: number | null;
}

// Simplified World Continent Outlines (Geo coordinates: [Longitude, Latitude])
const WORLD_LANDMASSES: [number, number][][] = [
  // North America
  [
    [-168, 65], [-150, 60], [-135, 57], [-124, 48], [-120, 34], [-105, 20], [-90, 16],
    [-80, 8], [-77, 8], [-75, 10], [-80, 25], [-75, 35], [-65, 44], [-60, 47], [-64, 60],
    [-85, 66], [-110, 68], [-140, 70], [-168, 65]
  ],
  // South America
  [
    [-77, 8], [-70, 12], [-60, 8], [-35, -5], [-35, -20], [-55, -40], [-68, -55],
    [-75, -50], [-72, -30], [-80, -4], [-77, 8]
  ],
  // Eurasia (Europe + Asia)
  [
    [-10, 36], [0, 43], [10, 44], [15, 38], [25, 40], [30, 31], [35, 36], [45, 40],
    [50, 30], [60, 25], [70, 20], [80, 10], [90, 22], [100, 15], [105, 10], [110, 20],
    [120, 23], [122, 30], [120, 40], [140, 50], [160, 60], [170, 66], [180, 68],
    [170, 72], [140, 72], [100, 75], [70, 70], [40, 68], [20, 70], [10, 60],
    [5, 52], [-5, 48], [-10, 42], [-10, 36]
  ],
  // Africa
  [
    [-10, 36], [10, 37], [25, 31], [33, 28], [43, 12], [51, 12], [45, 0], [40, -10],
    [35, -20], [33, -33], [20, -35], [12, -15], [8, 5], [-15, 12], [-17, 21], [-10, 36]
  ],
  // Australia
  [
    [114, -22], [120, -14], [130, -12], [136, -12], [142, -10], [150, -23], [153, -28],
    [150, -37], [138, -35], [135, -33], [115, -34], [114, -22]
  ],
  // Greenland
  [
    [-55, 60], [-40, 60], [-20, 70], [-20, 80], [-50, 82], [-70, 78], [-55, 60]
  ],
  // Antarctica
  [
    [-180, -65], [-120, -70], [-60, -68], [0, -70], [60, -68], [120, -68], [180, -65],
    [180, -90], [-180, -90], [-180, -65]
  ],
  // British Isles
  [
    [-10, 50], [-5, 50], [0, 53], [-3, 58], [-8, 58], [-10, 54], [-10, 50]
  ],
  // Japan
  [
    [130, 31], [135, 34], [140, 36], [142, 44], [140, 45], [135, 40], [130, 33], [130, 31]
  ],
  // Madagascar
  [
    [44, -12], [50, -15], [47, -25], [44, -25], [43, -16], [44, -12]
  ],
  // Indonesia / SE Asia Islands
  [
    [95, 5], [105, -6], [115, -8], [125, -8], [140, -3], [150, -8], [140, -2], [120, 1], [100, 1], [95, 5]
  ],
  // New Zealand
  [
    [166, -46], [174, -41], [178, -37], [174, -36], [170, -42], [166, -46]
  ]
];

export const TerminatorMap: React.FC<TerminatorMapProps> = ({ 
  solarData, 
  latitude = 47.06, 
  longitude = -122.81, 
  timeOfDay = 12, 
  hoverTime 
}) => {
  const declination = (solarData?.declination ?? 0) as number;
  const activeTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : timeOfDay;

  const sunLong = (12 - activeTime) * 15;
  const normalizedSunLong = ((sunLong + 180) % 360 + 360) % 360 - 180;
  const sunCy = 90 - declination;
  const userCy = 90 - latitude;

  // Render landmasses relative to the centered longitude with wrapping offsets (-360, 0, +360)
  const landmassPaths = useMemo(() => {
    return WORLD_LANDMASSES.map((poly, idx) => {
      const offsets = [-360, 0, 360];
      const pathD = offsets.map(offset => {
        let d = "";
        poly.forEach(([lon, lat], i) => {
          const x = (lon - longitude + 180) + offset;
          const y = 90 - lat;
          d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        });
        d += " Z";
        return d;
      }).join(" ");

      return (
        <path 
          key={idx} 
          d={pathD} 
          fill="#334155" 
          stroke="#64748b" 
          strokeWidth="0.75" 
          opacity="0.85" 
        />
      );
    });
  }, [longitude]);

  // Compute precise 3D spherical shadow paths for twilight layers
  const astroShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -18.0),
    [longitude, normalizedSunLong, declination]
  );
  const nauticalShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -12.0),
    [longitude, normalizedSunLong, declination]
  );
  const civilShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -6.0),
    [longitude, normalizedSunLong, declination]
  );
  const dayShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -0.833),
    [longitude, normalizedSunLong, declination]
  );

  const relSunX = (normalizedSunLong - longitude + 180 + 360) % 360;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Declination & Meridian Info Rail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Map dynamically centers on observer meridian ({longitude >= 0 ? `+${longitude.toFixed(1)}` : `${longitude.toFixed(1)}`}°)
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-slate-300">
          <span className="text-[10px] uppercase font-bold text-slate-400">Declination:</span>
          <strong className="text-amber-400 font-bold">{declination >= 0 ? `+${declination.toFixed(1)}` : declination.toFixed(1)}°</strong>
        </div>
      </div>
      
      {/* Map SVG Container */}
      <div className="relative w-full flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 min-h-[220px]">
        <svg viewBox="0 0 360 180" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="terminatorBounds">
              <rect x="0" y="0" width="360" height="180" rx="8" />
            </clipPath>
          </defs>

          <g clipPath="url(#terminatorBounds)">
            {/* Ocean Base */}
            <rect width="360" height="180" fill="#0b0f19" />

            {/* Continent Landmasses */}
            {landmassPaths}

            {/* Longitude Grid Lines */}
            {[-180, -90, 0, 90, 180, 270].map(lon => {
               let x = (lon - longitude + 180 + 360) % 360;
               return <line key={lon} x1={x} y1="0" x2={x} y2="180" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.5" />;
            })}

            {/* Tropics & Equator Lines */}
            <line x1="0" y1={90 - 23.5} x2="360" y2={90 - 23.5} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1={90 + 23.5} x2="360" y2={90 + 23.5} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1={90} x2="360" y2="90" stroke="#475569" strokeWidth="0.5" strokeOpacity="0.6" />
            
            {/* User Latitude & Meridian Crosshairs */}
            <line x1="0" y1={userCy} x2="360" y2={userCy} stroke="#6366f1" strokeWidth="0.75" strokeDasharray="4 2" />
            <line x1={180} y1="0" x2={180} y2="180" stroke="#6366f1" strokeWidth="0.75" strokeDasharray="4 2" />

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

            {/* Subsolar Point Marker with Pulsating Glow */}
            <circle cx={relSunX} cy={sunCy} r="10" fill={CONFIG.THEME.SUN_FILL} opacity="0.2" className="animate-pulse" />
            <circle cx={relSunX} cy={sunCy} r="4.5" fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="1.5" className="drop-shadow" />
            
            {/* Hover Subsolar Ray Guide when hover sync active */}
            {hoverTime !== null && hoverTime !== undefined && (
              <line x1={relSunX} y1="0" x2={relSunX} y2="180" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
            )}

            {/* User Observer Position Marker with Glow */}
            <circle cx={180} cy={userCy} r="8" fill="#6366f1" opacity="0.2" className="animate-pulse" />
            <circle cx={180} cy={userCy} r="3.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.2" className="drop-shadow" />
            <text x={186} y={userCy - 4} className="text-[8px] fill-indigo-300 font-bold font-mono">YOU</text>
          </g>
        </svg>
      </div>

      <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
         <span>West (-180°)</span>
         <div className="flex items-center gap-3">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400 border border-amber-300 inline-block" /> Day</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/80 inline-block" /> Civil (-6°)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-500 inline-block" /> Nautical (-12°)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-700 inline-block" /> Astro (-18°)</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-950 border border-slate-800 inline-block" /> Night</span>
         </div>
         <span>East (+180°)</span>
      </div>
    </div>
  );
};

export default TerminatorMap;
