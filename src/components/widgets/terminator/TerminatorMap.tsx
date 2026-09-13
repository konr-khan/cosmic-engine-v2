import React, { useMemo, useState } from 'react';
import { 
  CONFIG, 
  getTerminatorShadowPaths, 
  clamp, 
  calculateEarthOrbitalPhysics, 
  getJulianDate,
  WORLD_LANDMASSES,
  generate24HourGroundTrack,
  findActiveNodalCrossing,
  getLunarNodeProximityTelemetry
} from '../../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../../types';
import { useHoverTime } from '../../../store/hoverStore';
import { TerminatorHoverHud } from './TerminatorHoverHud';

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
  const storeHoverTime = useHoverTime();
  const effectiveHoverTime = hoverTime !== undefined ? hoverTime : storeHoverTime;
  const [hoveredPoint, setHoveredPoint] = useState<'sun' | 'moon' | 'observer' | null>(null);
  const [showSunTrack, setShowSunTrack] = useState<boolean>(initialShowSunTrack);
  const [showMoonTrack, setShowMoonTrack] = useState<boolean>(initialShowMoonTrack);

  const declination = (solarData?.declination ?? 0) as number;
  const activeTime = effectiveHoverTime !== null ? effectiveHoverTime : timeOfDay;
  const activeJD = useMemo(() => getJulianDate(currentDate, activeTime), [currentDate, activeTime]);

  // --- 1. Earth-Sun Keplerian Distance & Dynamic Disc Scaling ---
  const fallbackPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(activeJD),
    [activeJD]
  );
  const sunDistanceAU = solarData?.distanceAU ?? fallbackPhysics.distanceAU;
  const sunDistanceKm = solarData?.distanceKm ?? fallbackPhysics.distanceKm;
  const sunAngularDiamArcmin = solarData?.sunAngularDiameterArcmin ?? fallbackPhysics.sunAngularDiameterArcmin;

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

  // --- 3. 24-Hour Diurnal Subsolar & Sublunar Ground Tracks ---
  const sunTrack = useMemo(() => {
    if (!showSunTrack) return null;
    return generate24HourGroundTrack('sun', activeJD, longitude, 30);
  }, [showSunTrack, activeJD, longitude]);

  const moonTrack = useMemo(() => {
    if (!showMoonTrack) return null;
    return generate24HourGroundTrack('moon', activeJD, longitude, 30);
  }, [showMoonTrack, activeJD, longitude]);

  const activeNodalMarker = useMemo(() => {
    if (!showMoonTrack) return null;
    return findActiveNodalCrossing(activeJD, longitude);
  }, [showMoonTrack, activeJD, longitude]);

  const lunarNodeTelemetry = useMemo(() => {
    return getLunarNodeProximityTelemetry(activeJD);
  }, [activeJD]);

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
            {landmassPaths}

            {/* Longitude Grid Lines */}
            {[-180, -90, 0, 90, 180, 270].map(lon => {
               let x = (lon - longitude + 180 + 360) % 360;
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

            {/* 24-Hour Diurnal Subsolar Ground Track */}
            {showSunTrack && sunTrack && (
              <g className="sun-ground-track pointer-events-none">
                {/* Past 12h: subtle dotted amber (historical trail) */}
                {sunTrack.pastD && (
                  <path
                    d={sunTrack.pastD}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeDasharray="1 3"
                    strokeOpacity="0.30"
                  />
                )}
                {/* Future 12h: prominent dashed amber (future trajectory) */}
                {sunTrack.futureD && (
                  <path
                    d={sunTrack.futureD}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    strokeOpacity="0.55"
                  />
                )}
              </g>
            )}

            {/* 24-Hour Diurnal Sublunar Ground Track & Active Nodal Crossing */}
            {showMoonTrack && moonTrack && (
              <g className="moon-ground-track">
                {/* Past 12h: subtle dotted cyan/slate (historical trail) */}
                {moonTrack.pastD && (
                  <path
                    d={moonTrack.pastD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="1 3"
                    strokeOpacity="0.30"
                    className="pointer-events-none"
                  />
                )}
                {/* Future 12h: prominent dashed cyan/slate (future trajectory) */}
                {moonTrack.futureD && (
                  <path
                    d={moonTrack.futureD}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.1"
                    strokeDasharray="3.5 2.5"
                    strokeOpacity="0.55"
                    className="pointer-events-none"
                  />
                )}
                {/* Active Ecliptic Nodal Crossing Marker if within +-12h */}
                {activeNodalMarker && (
                  <g className="nodal-crossing-marker cursor-help pointer-events-auto">
                    <circle
                      cx={activeNodalMarker.x}
                      cy={activeNodalMarker.y}
                      r="7"
                      fill={activeNodalMarker.type === 'ascending' ? '#06b6d4' : '#f43f5e'}
                      fillOpacity="0.25"
                      className="animate-pulse"
                    />
                    <circle
                      cx={activeNodalMarker.x}
                      cy={activeNodalMarker.y}
                      r="3"
                      fill={activeNodalMarker.type === 'ascending' ? '#22d3ee' : '#fb7185'}
                      stroke="#ffffff"
                      strokeWidth="0.75"
                    />
                    <text
                      x={activeNodalMarker.x + 5}
                      y={activeNodalMarker.y - 4}
                      className={`text-[8px] font-mono font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] select-none ${
                        activeNodalMarker.type === 'ascending' ? 'fill-cyan-300' : 'fill-rose-300'
                      }`}
                    >
                      {activeNodalMarker.symbol} Node
                    </text>
                    <title>{activeNodalMarker.label}</title>
                  </g>
                )}
              </g>
            )}

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
