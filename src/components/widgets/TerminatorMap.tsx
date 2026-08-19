import React, { useMemo, useState } from 'react';
import { CONFIG, getTerminatorShadowPaths, getDayOfYear, clamp } from '../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../types';

export interface TerminatorMapProps {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  hoverTime?: number | null;
  currentDate?: Date;
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
  orbitalData,
  latitude = 47.06, 
  longitude = -122.81, 
  timeOfDay = 12, 
  hoverTime,
  currentDate = new Date()
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<'sun' | 'moon' | 'observer' | null>(null);

  const declination = (solarData?.declination ?? 0) as number;
  const activeTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : timeOfDay;

  // --- 1. Earth-Sun Keplerian Distance & Dynamic Disc Scaling ---
  const dayOfYear = currentDate ? getDayOfYear(currentDate) : 1;
  const meanAnomaly = (2 * Math.PI * (dayOfYear - 4)) / 365.25;
  const sunDistanceAU = 1.0 - 0.0167 * Math.cos(meanAnomaly);
  const sunDistanceKm = Math.round(sunDistanceAU * 149597870.7);
  const sunAngularDiamArcmin = 31.98 / sunDistanceAU;

  // Dynamic Sun Disc Radius (Base 4.5px, dynamically scaled with orbital distance)
  const sunScale = 1.0 + (1.0 / sunDistanceAU - 1.0) * 4.0;
  const sunRadius = clamp(4.5 * sunScale, 3.5, 6.0);
  const sunGlowRadius = sunRadius * 2.4;

  const sunLong = (12 - activeTime) * 15;
  const normalizedSunLong = ((sunLong + 180) % 360 + 360) % 360 - 180;
  const sunCy = 90 - declination;
  const userCy = 90 - latitude;

  // --- 2. Sublunar Point (Moon) Coordinates, Distance & Ephemeris ---
  const lunarDec = (orbitalData?.lunarEvents?.declination ?? orbitalData?.lunarPos?.declination ?? 0) as number;
  const transit = orbitalData?.lunarEvents?.transit ?? 12;
  const moonPhase = orbitalData?.phase?.name || 'Waxing Crescent';
  const moonIllum = ((orbitalData?.phase?.value ?? 0.34) * 100).toFixed(0);
  const moonDistKm = orbitalData?.lunarEvents?.distanceKm || orbitalData?.lunarPos?.distanceKm || 384400;
  const moonAngularDiamArcmin = 31.13 * (384400 / moonDistKm);
  const isSupermoon = moonDistKm < 365000;
  const isMicromoon = moonDistKm > 400000;

  // Dynamic Moon Disc Radius (Base 4.0px, dynamically scaled with geocentric distance)
  const moonScale = 1.0 + (384400 / moonDistKm - 1.0) * 2.5;
  const moonRadius = clamp(4.0 * moonScale, 3.0, 5.5);
  const moonGlowRadius = moonRadius * 2.5;

  // Map subsolar & sublunar positions relative to centered observer longitude
  const relSunX = (normalizedSunLong - longitude + 180 + 360) % 360;
  const moonHourAngle = (activeTime - transit) * 15;
  const relMoonX = ((180 - moonHourAngle) % 360 + 360) % 360;
  const moonCy = 90 - lunarDec;

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

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Declination & Meridian Info Rail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Map dynamically centers on observer meridian ({longitude >= 0 ? `+${longitude.toFixed(1)}` : `${longitude.toFixed(1)}`}°)
        </p>
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
        {hoveredPoint === 'sun' && (
          <div className="absolute top-3 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
            <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
              <span>Subsolar Point (Sun at Zenith)</span>
            </div>
            <div className="text-slate-300">
              Declination (δ): <strong className="text-white">{declination >= 0 ? `+${declination.toFixed(1)}°` : `${declination.toFixed(1)}°`}</strong>
            </div>
            <div className="text-slate-300">
              Subsolar Longitude: <strong className="text-amber-300">{normalizedSunLong >= 0 ? `+${normalizedSunLong.toFixed(1)}°` : `${normalizedSunLong.toFixed(1)}°`}</strong>
            </div>
            <div className="text-slate-300">
              Distance: <strong className="text-amber-300">{sunDistanceAU.toFixed(3)} AU</strong> ({(sunDistanceKm / 1e6).toFixed(1)}M km)
            </div>
            <div className="text-slate-300">
              Apparent Diam: <strong className="text-white">{sunAngularDiamArcmin.toFixed(1)}'</strong> <span className="text-slate-400 text-[9px]">({sunDistanceAU < 0.99 ? 'Perihelion' : sunDistanceAU > 1.01 ? 'Aphelion' : 'Mean Size'})</span>
            </div>
            <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
              The Sun is at local zenith (+90° altitude) directly overhead at this surface location.
            </div>
          </div>
        )}

        {hoveredPoint === 'moon' && (
          <div className="absolute top-3 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Sublunar Point (Moon at Zenith)</span>
              <span className="text-slate-400 text-[9px]">{moonIllum}% Illum</span>
            </div>
            <div className="text-slate-300">
              Phase: <strong className="text-white">{moonPhase}</strong>
            </div>
            <div className="text-slate-300">
              Declination (δ): <strong className="text-slate-200">{lunarDec >= 0 ? `+${lunarDec.toFixed(1)}°` : `${lunarDec.toFixed(1)}°`}</strong>
            </div>
            <div className="text-slate-300">
              Distance: <strong className="text-indigo-300">{moonDistKm.toLocaleString()} km</strong> ({(moonDistKm / 6371).toFixed(1)} R_E)
            </div>
            <div className="text-slate-300">
              Apparent Diam: <strong className="text-white">{moonAngularDiamArcmin.toFixed(1)}'</strong> <span className="text-slate-400 text-[9px]">({isSupermoon ? 'Supermoon' : isMicromoon ? 'Micromoon' : 'Mean Size'})</span>
            </div>
            <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
              The Moon is at local zenith (+90° altitude) directly overhead at this surface location.
            </div>
          </div>
        )}

        {hoveredPoint === 'observer' && (
          <div className="absolute top-3 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
            <div className="text-xs font-bold text-indigo-400">Observer Location</div>
            <div className="text-slate-300">
              Coordinates: <strong className="text-white">{Math.abs(latitude).toFixed(2)}°{latitude >= 0 ? 'N' : 'S'}, {Math.abs(longitude).toFixed(2)}°{longitude >= 0 ? 'E' : 'W'}</strong>
            </div>
            <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
              Prime center of map projection (centered on your local meridian).
            </div>
          </div>
        )}

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

            {/* Subsolar Point Marker with Soft Dynamic Distance-Scaled Glow */}
            <g 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredPoint('sun')}
              onPointerLeave={() => setHoveredPoint(null)}
            >
              <circle cx={relSunX} cy={sunCy} r={sunGlowRadius} fill={CONFIG.THEME.SUN_FILL} opacity="0.25" />
              <circle cx={relSunX} cy={sunCy} r={sunRadius} fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="1.5" className="drop-shadow" />
              <text x={relSunX + sunRadius + 3} y={sunCy + 3} className="text-[7.5px] fill-amber-300 font-bold font-mono select-none pointer-events-none">
                SUN
              </text>
            </g>
            
            {/* Hover Subsolar Ray Guide when hover sync active */}
            {hoverTime !== null && hoverTime !== undefined && (
              <line x1={relSunX} y1="0" x2={relSunX} y2="180" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
            )}

            {/* Sublunar Point Marker (Moon Zenith) with Soft Dynamic Distance-Scaled Glow */}
            <g 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredPoint('moon')}
              onPointerLeave={() => setHoveredPoint(null)}
            >
              <circle cx={relMoonX} cy={moonCy} r={moonGlowRadius} fill="#94a3b8" opacity="0.25" />
              <circle cx={relMoonX} cy={moonCy} r={moonRadius} fill="#f8fafc" stroke="#475569" strokeWidth="1.5" className="drop-shadow" />
              <text x={relMoonX + moonRadius + 3} y={moonCy + 3} className="text-[7.5px] fill-slate-300 font-bold font-mono select-none pointer-events-none">
                MOON
              </text>
            </g>

            {/* User Observer Position Marker with Glow */}
            <g 
              className="cursor-pointer"
              onPointerEnter={() => setHoveredPoint('observer')}
              onPointerLeave={() => setHoveredPoint(null)}
            >
              <circle cx={180} cy={userCy} r="8" fill="#6366f1" opacity="0.25" />
              <circle cx={180} cy={userCy} r="3.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.2" className="drop-shadow" />
              <text x={186} y={userCy - 4} className="text-[8px] fill-indigo-300 font-bold font-mono">YOU</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
         <div className="flex items-center gap-3">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-300 inline-block" /> Subsolar</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400 inline-block" /> Sublunar</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 border border-indigo-400 inline-block" /> You</span>
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
