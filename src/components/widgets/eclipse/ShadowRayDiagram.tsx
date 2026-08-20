import React, { useState } from 'react';
import { EclipseData } from '../../../types';
import { getPhaseName, calculateLunarIllumination, toRadians, calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';

export interface ShadowRayDiagramProps {
  eclipse?: EclipseData | null;
  diagramMode?: 'live' | 'solar' | 'lunar';
  setDiagramMode?: (mode: 'live' | 'solar' | 'lunar') => void;
  lunarViewSubTab?: 'pov' | 'orbit';
  setLunarViewSubTab?: (tab: 'pov' | 'orbit') => void;
  currentDate?: Date;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
}

export const ShadowRayDiagram: React.FC<ShadowRayDiagramProps> = ({
  eclipse,
  diagramMode = 'live',
  setDiagramMode,
  lunarViewSubTab = 'pov',
  setLunarViewSubTab,
  currentDate = new Date(),
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12
}) => {
  const [hoveredEntity, setHoveredEntity] = useState<'sun' | 'earth' | 'moon' | 'umbra' | 'penumbra' | null>(null);
  if (!eclipse) return null;

  const solarPhysics = calculateEarthOrbitalPhysics(getJulianDate(currentDate, 12));
  const sunLambdaDeg = ((solarPhysics?.lambda ?? solarPhysics?.eclipticLongitude ?? 0) as number);

  // Helper to compute Earth's projected axial tilt, dashed equator line, and observer pin in side-on ecliptic profile
  const getEarthSideGeometry = (earthCenterX: number, earthCenterY: number, earthRadius: number) => {
    const epsRad = (23.439281 * Math.PI) / 180;
    const sunLambdaRad = (sunLambdaDeg * Math.PI) / 180;

    // Projected tilt in side-on view (Sun on left at -X, Earth at center):
    const thetaSide = epsRad * Math.sin(sunLambdaRad); // rad

    // Unit vectors:
    const nx = -Math.sin(thetaSide);
    const ny = Math.cos(thetaSide);
    const ux = Math.cos(thetaSide);
    const uy = Math.sin(thetaSide);

    // Polar axis endpoints:
    const poleLineX = nx * (earthRadius + 3.5);
    const poleLineY = ny * (earthRadius + 3.5);

    // Front equator chord endpoints:
    const eqX1 = earthCenterX - earthRadius * ux;
    const eqY1 = earthCenterY + earthRadius * uy;
    const eqX2 = earthCenterX + earthRadius * ux;
    const eqY2 = earthCenterY - earthRadius * uy;

    // Observer Location Pin:
    const latRad = (latitude * Math.PI) / 180;
    const hRad = ((timeOfDay - 12) * Math.PI) / 12;

    const xBody = -Math.cos(latRad) * Math.cos(hRad); // negative towards Sun on left
    const yBody = Math.sin(latRad);

    const xProj = xBody * Math.cos(thetaSide) - yBody * Math.sin(thetaSide);
    const yProj = xBody * Math.sin(thetaSide) + yBody * Math.cos(thetaSide);

    const obsPx = earthCenterX + earthRadius * xProj;
    const obsPy = earthCenterY - earthRadius * yProj;
    const isDaylight = xBody < 0; // facing Sun on left

    return {
      earthR: earthRadius,
      poleLineX,
      poleLineY,
      eqX1,
      eqY1,
      eqX2,
      eqY2,
      obsPx,
      obsPy,
      isDaylight
    };
  };

  // Physical vertical offset calculation in km and scaled SVG pixels
  const beta = eclipse.beta; // -5.14° to +5.14°
  const distKm = eclipse.distanceKm || 384000;
  const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
  const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 1.0 (Full Moon = 0.5)
  const phaseRad = phaseVal * 2 * Math.PI;
  const phaseDeg = Math.round(phaseVal * 360);
  const phaseName = getPhaseName(phaseVal);
  const illumPercent = calculateLunarIllumination(phaseVal);
  const scalePxPerDeg = 8.5;
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);
  const isWaxing = phaseVal <= 0.5;

  // Calculate Strict Side-On Orbit Coordinates (Ecliptic X-Z Projection)
  const liveEarthX = 310;
  const liveEarthY = 110;
  const liveOrbitalRx = 85;

  // Real-Time Seasonal Nodal Alignment Angle (Sun - Node):
  const nodeAngleRad = ((eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0)) * Math.PI) / 180;

  // Moon position on the strict side-on projected orbit:
  const liveMoonX = liveEarthX - (Math.cos(phaseRad) * liveOrbitalRx);
  const liveMoonY = liveEarthY - (beta * scalePxPerDeg);

  // Generate 4-quadrant orbit paths: Waxing (Solid) vs Waning (Dashed), Ascending (Blue) vs Descending (Red)
  const N = 72;
  const liveWaxAsc: string[] = [];
  const liveWaxDesc: string[] = [];
  const liveWanAsc: string[] = [];
  const liveWanDesc: string[] = [];

  for (let i = 0; i < N; i++) {
    const t1 = (i / N) * 2 * Math.PI;
    const t2 = ((i + 1) / N) * 2 * Math.PI;
    const x1 = liveEarthX - Math.cos(t1) * liveOrbitalRx;
    const y1 = liveEarthY - Math.sin(t1 + nodeAngleRad) * 5.145 * scalePxPerDeg;
    const x2 = liveEarthX - Math.cos(t2) * liveOrbitalRx;
    const y2 = liveEarthY - Math.sin(t2 + nodeAngleRad) * 5.145 * scalePxPerDeg;

    const midT = (t1 + t2) / 2;
    const midBeta = Math.sin(midT + nodeAngleRad) * 5.145;
    const isWax = midT <= Math.PI;
    const isAsc = midBeta >= 0;

    const seg = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (isWax) {
      if (isAsc) liveWaxAsc.push(seg);
      else liveWaxDesc.push(seg);
    } else {
      if (isAsc) liveWanAsc.push(seg);
      else liveWanDesc.push(seg);
    }
  }

  // Node positions where orbit crosses the horizontal ecliptic plane (Y = 110)
  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const ascNodeX = liveEarthX - (Math.cos(tAsc) * liveOrbitalRx);
  const ascNodeY = liveEarthY;
  const descNodeX = liveEarthX - (Math.cos(tDesc) * liveOrbitalRx);
  const descNodeY = liveEarthY;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-1 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-amber-400 font-sans text-xs flex items-center gap-1">
            Syzygy &amp; Shadow Rays
          </span>
          <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80 gap-0.5 text-[10px]">
            <button
              onClick={() => setDiagramMode && setDiagramMode('live')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                diagramMode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orbit
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('solar')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                diagramMode === 'solar' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solar
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('lunar')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                diagramMode === 'lunar' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lunar
            </button>
          </div>

          {/* Integrated inline sub-toggle when in Lunar Focus mode */}
          {diagramMode === 'lunar' && (
            <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80 gap-0.5 text-[10px]">
              <button
                onClick={() => setLunarViewSubTab && setLunarViewSubTab('pov')}
                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  lunarViewSubTab === 'pov' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                POV
              </button>
              <button
                onClick={() => setLunarViewSubTab && setLunarViewSubTab('orbit')}
                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  lunarViewSubTab === 'orbit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Orbit
              </button>
            </div>
          )}
        </div>

        {/* Live Shadow State Indicator */}
        {diagramMode !== 'lunar' && (
          <div className={`px-2 py-0.5 rounded-md border font-bold text-[9px] flex items-center gap-1 backdrop-blur-sm ${shadowStatus.bg}`}>
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

            {/* Strict Side-On Projected Lunar Orbital Ring */}
            <g className="pointer-events-none">
              {/* Waxing Ascending: Solid Sky Blue */}
              {liveWaxAsc.length > 0 && (
                <path d={liveWaxAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.9" />
              )}
              {/* Waxing Descending: Solid Crimson Red */}
              {liveWaxDesc.length > 0 && (
                <path d={liveWaxDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" opacity="0.9" />
              )}
              {/* Waning Ascending: Dashed Sky Blue */}
              {liveWanAsc.length > 0 && (
                <path d={liveWanAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />
              )}
              {/* Waning Descending: Dashed Crimson Red */}
              {liveWanDesc.length > 0 && (
                <path d={liveWanDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />
              )}

              {/* Ascending Node Marker (☊) */}
              <circle cx={ascNodeX} cy={ascNodeY} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <text
                x={ascNodeX < liveEarthX ? ascNodeX - 6 : ascNodeX + 6}
                y={ascNodeY - 5}
                textAnchor={ascNodeX < liveEarthX ? "end" : "start"}
                className="text-[7.5px] font-mono fill-sky-400 font-semibold select-none"
              >
                ☊ Node
              </text>

              {/* Descending Node Marker (☋) */}
              <circle cx={descNodeX} cy={descNodeY} r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
              <text
                x={descNodeX > liveEarthX ? descNodeX + 6 : descNodeX - 6}
                y={descNodeY + 12}
                textAnchor={descNodeX > liveEarthX ? "start" : "end"}
                className="text-[7.5px] font-mono fill-rose-400 font-semibold select-none"
              >
                ☋ Node
              </text>
            </g>

            {/* 2. EARTH BODY (Middle) WITH 23.44° AXIAL TILT, DASHED EQUATOR & OBSERVER PIN */}
            {(() => {
              const liveEarthGeom = getEarthSideGeometry(liveEarthX, liveEarthY, 18);
              return (
                <g 
                  className="cursor-pointer"
                  onPointerEnter={() => setHoveredEntity('earth')}
                  onPointerLeave={() => setHoveredEntity(null)}
                >
                  {/* Earth Disc */}
                  <circle cx={liveEarthX} cy={liveEarthY} r={liveEarthGeom.earthR} fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />

                  {/* Projected 23.44° Polar Axis with N/S Markers */}
                  <line 
                    x1={liveEarthX - liveEarthGeom.poleLineX} 
                    y1={liveEarthY + liveEarthGeom.poleLineY} 
                    x2={liveEarthX + liveEarthGeom.poleLineX} 
                    y2={liveEarthY - liveEarthGeom.poleLineY} 
                    stroke="#93c5fd" 
                    strokeWidth="0.85" 
                    strokeDasharray="2.5 1.5" 
                    opacity="0.65" 
                  />
                  <text 
                    x={liveEarthX + liveEarthGeom.poleLineX + 2} 
                    y={liveEarthY - liveEarthGeom.poleLineY - 1} 
                    className="text-[6px] font-mono font-bold fill-sky-300 select-none pointer-events-none"
                  >
                    N
                  </text>
                  <text 
                    x={liveEarthX - liveEarthGeom.poleLineX - 5} 
                    y={liveEarthY + liveEarthGeom.poleLineY + 5} 
                    className="text-[6px] font-mono font-bold fill-sky-400 select-none pointer-events-none"
                  >
                    S
                  </text>

                  {/* Dashed Blue Equator Line */}
                  <line 
                    x1={liveEarthGeom.eqX1} 
                    y1={liveEarthGeom.eqY1} 
                    x2={liveEarthGeom.eqX2} 
                    y2={liveEarthGeom.eqY2} 
                    stroke="#38bdf8" 
                    strokeWidth="0.85" 
                    strokeDasharray="2 1.5" 
                    opacity="0.65" 
                  />

                  {/* Earth Label */}
                  <text 
                    x={liveEarthX} 
                    y={liveEarthY + (Math.abs(liveEarthGeom.obsPy - liveEarthY) < 5 ? 11 : 3)} 
                    textAnchor="middle" 
                    className="text-[7.5px] font-mono font-bold fill-blue-300/80 select-none pointer-events-none"
                  >
                    EARTH
                  </text>

                  {/* Observer Location Pin */}
                  <g transform={`translate(${liveEarthGeom.obsPx.toFixed(1)}, ${liveEarthGeom.obsPy.toFixed(1)})`}>
                    {liveEarthGeom.isDaylight && (
                      <circle r="4" fill="#38bdf8" opacity="0.25" className="animate-pulse pointer-events-none" />
                    )}
                    <circle 
                      r="2" 
                      fill={liveEarthGeom.isDaylight ? "#38bdf8" : "#64748b"} 
                      stroke="#ffffff" 
                      strokeWidth="0.75" 
                      opacity={liveEarthGeom.isDaylight ? 1 : 0.4}
                      className="cursor-pointer drop-shadow-sm"
                    >
                      <title>{`Observer (${Math.abs(latitude).toFixed(1)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(1)}°${longitude >= 0 ? 'E' : 'W'}) — ${liveEarthGeom.isDaylight ? 'Daylight (Sunlit Face)' : 'Night (Earth Shadow/Night Face)'}`}</title>
                    </circle>
                  </g>
                </g>
              );
            })()}

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
                fill={eclipse.isEclipseActive ? '#f43f5e' : (isWaxing ? '#94a3b8' : '#475569')}
                fillOpacity={!eclipse.isEclipseActive && !isWaxing ? 0.75 : 1}
                stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')}
                strokeWidth="2"
                strokeDasharray={!eclipse.isEclipseActive && !isWaxing ? "3 2" : undefined}
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
          const moonOrbitalX = earthX - (Math.cos(phaseRad) * rx);
          const moonOrbitalY = earthY - (beta * scalePxPerDeg);

          const sWaxAsc: string[] = [];
          const sWaxDesc: string[] = [];
          const sWanAsc: string[] = [];
          const sWanDesc: string[] = [];

          for (let i = 0; i < N; i++) {
            const t1 = (i / N) * 2 * Math.PI;
            const t2 = ((i + 1) / N) * 2 * Math.PI;
            const x1 = earthX - Math.cos(t1) * rx;
            const y1 = earthY - Math.sin(t1 + nodeAngleRad) * 5.145 * scalePxPerDeg;
            const x2 = earthX - Math.cos(t2) * rx;
            const y2 = earthY - Math.sin(t2 + nodeAngleRad) * 5.145 * scalePxPerDeg;

            const midT = (t1 + t2) / 2;
            const midBeta = Math.sin(midT + nodeAngleRad) * 5.145;
            const isWax = midT <= Math.PI;
            const isAsc = midBeta >= 0;

            const seg = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
            if (isWax) {
              if (isAsc) sWaxAsc.push(seg);
              else sWaxDesc.push(seg);
            } else {
              if (isAsc) sWanAsc.push(seg);
              else sWanDesc.push(seg);
            }
          }

          const sAscNodeX = earthX - (Math.cos(tAsc) * rx);
          const sAscNodeY = earthY;
          const sDescNodeX = earthX - (Math.cos(tDesc) * rx);
          const sDescNodeY = earthY;

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

              {/* Strict Side-On Lunar Orbital Ring */}
              <g className="pointer-events-none">
                {sWaxAsc.length > 0 && <path d={sWaxAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.9" />}
                {sWaxDesc.length > 0 && <path d={sWaxDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" opacity="0.9" />}
                {sWanAsc.length > 0 && <path d={sWanAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />}
                {sWanDesc.length > 0 && <path d={sWanDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />}

                <circle cx={sAscNodeX} cy={sAscNodeY} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                <text x={sAscNodeX < earthX ? sAscNodeX - 6 : sAscNodeX + 6} y={sAscNodeY - 5} textAnchor={sAscNodeX < earthX ? "end" : "start"} className="text-[7.5px] font-mono fill-sky-400 font-semibold select-none">
                  ☊ Node
                </text>
                <circle cx={sDescNodeX} cy={sDescNodeY} r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                <text x={sDescNodeX > earthX ? sDescNodeX + 6 : sDescNodeX - 6} y={sDescNodeY + 12} textAnchor={sDescNodeX > earthX ? "start" : "end"} className="text-[7.5px] font-mono fill-rose-400 font-semibold select-none">
                  ☋ Node
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

              {/* MOON BODY orbiting Earth */}
              <g 
                transform={`translate(${moonOrbitalX}, ${moonOrbitalY})`} 
                className="cursor-pointer"
                onPointerEnter={() => setHoveredEntity('moon')}
                onPointerLeave={() => setHoveredEntity(null)}
              >
                <circle
                  r="9"
                  fill={eclipse.type.includes('SOLAR') ? '#fbbf24' : (isWaxing ? '#94a3b8' : '#475569')}
                  fillOpacity={!eclipse.isEclipseActive && !isWaxing ? 0.75 : 1}
                  stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')}
                  strokeWidth="2"
                  strokeDasharray={!eclipse.isEclipseActive && !isWaxing ? "3 2" : undefined}
                  className="drop-shadow"
                />
                <text x={moonOrbitalX > earthX - 40 ? -12 : 14} y="4" textAnchor={moonOrbitalX > earthX - 40 ? 'end' : 'start'} className="text-[9px] font-mono font-bold fill-emerald-400 select-none pointer-events-none">
                  MOON ({phaseDeg}° Elong, β={beta}°)
                </text>
              </g>

              {/* EARTH BODY (Right) WITH 23.44° AXIAL TILT, DASHED EQUATOR & OBSERVER PIN */}
              {(() => {
                const solarEarthGeom = getEarthSideGeometry(earthX, earthY, 20);
                return (
                  <g 
                    className="cursor-pointer"
                    onPointerEnter={() => setHoveredEntity('earth')}
                    onPointerLeave={() => setHoveredEntity(null)}
                  >
                    {/* Earth Base Disc */}
                    <circle cx={earthX} cy={earthY} r={solarEarthGeom.earthR} fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />

                    {/* Projected 23.44° Polar Axis with N/S Markers */}
                    <line 
                      x1={earthX - solarEarthGeom.poleLineX} 
                      y1={earthY + solarEarthGeom.poleLineY} 
                      x2={earthX + solarEarthGeom.poleLineX} 
                      y2={earthY - solarEarthGeom.poleLineY} 
                      stroke="#93c5fd" 
                      strokeWidth="0.85" 
                      strokeDasharray="2.5 1.5" 
                      opacity="0.65" 
                    />
                    <text 
                      x={earthX + solarEarthGeom.poleLineX + 2} 
                      y={earthY - solarEarthGeom.poleLineY - 1} 
                      className="text-[6px] font-mono font-bold fill-sky-300 select-none pointer-events-none"
                    >
                      N
                    </text>
                    <text 
                      x={earthX - solarEarthGeom.poleLineX - 5} 
                      y={earthY + solarEarthGeom.poleLineY + 5} 
                      className="text-[6px] font-mono font-bold fill-sky-400 select-none pointer-events-none"
                    >
                      S
                    </text>

                    {/* Dashed Blue Equator Line */}
                    <line 
                      x1={solarEarthGeom.eqX1} 
                      y1={solarEarthGeom.eqY1} 
                      x2={solarEarthGeom.eqX2} 
                      y2={solarEarthGeom.eqY2} 
                      stroke="#38bdf8" 
                      strokeWidth="0.85" 
                      strokeDasharray="2 1.5" 
                      opacity="0.65" 
                    />

                    {/* Earth Label */}
                    <text 
                      x={earthX} 
                      y={earthY + (Math.abs(solarEarthGeom.obsPy - earthY) < 5 ? 11 : 3)} 
                      textAnchor="middle" 
                      className="text-[7.5px] font-mono font-bold fill-blue-300/80 select-none pointer-events-none"
                    >
                      EARTH
                    </text>

                    {/* Observer Location Pin */}
                    <g transform={`translate(${solarEarthGeom.obsPx.toFixed(1)}, ${solarEarthGeom.obsPy.toFixed(1)})`}>
                      {solarEarthGeom.isDaylight && (
                        <circle r="4" fill="#38bdf8" opacity="0.25" className="animate-pulse pointer-events-none" />
                      )}
                      <circle 
                        r="2" 
                        fill={solarEarthGeom.isDaylight ? "#38bdf8" : "#64748b"} 
                        stroke="#ffffff" 
                        strokeWidth="0.75" 
                        opacity={solarEarthGeom.isDaylight ? 1 : 0.4}
                        className="cursor-pointer drop-shadow-sm"
                      >
                        <title>{`Observer (${Math.abs(latitude).toFixed(1)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(1)}°${longitude >= 0 ? 'E' : 'W'}) — ${solarEarthGeom.isDaylight ? 'Daylight (Sunlit Face)' : 'Night (Earth Shadow/Night Face)'}`}</title>
                      </circle>
                    </g>
                  </g>
                );
              })()}

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
                    {(() => {
                      const lunarEarthGeom = getEarthSideGeometry(selenocentricEarthX, selenocentricEarthY, 18);
                      return (
                        <g className="cursor-help">
                          <title>{`Earth (Relative Orbit Frame)\n• Apparent Separation: ${distKm.toLocaleString()} km\n• Ecliptic Latitude β: ${beta}°\n• Vertical Miss: ${verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : verticalOffsetKm.toLocaleString()} km\n• Observer (${Math.abs(latitude).toFixed(1)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(1)}°${longitude >= 0 ? 'E' : 'W'}) — ${lunarEarthGeom.isDaylight ? 'Daylight' : 'Night'}`}</title>
                          
                          {/* Earth Disc */}
                          <circle cx={selenocentricEarthX} cy={selenocentricEarthY} r={lunarEarthGeom.earthR} fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />

                          {/* Projected 23.44° Polar Axis with N/S Markers */}
                          <line 
                            x1={selenocentricEarthX - lunarEarthGeom.poleLineX} 
                            y1={selenocentricEarthY + lunarEarthGeom.poleLineY} 
                            x2={selenocentricEarthX + lunarEarthGeom.poleLineX} 
                            y2={selenocentricEarthY - lunarEarthGeom.poleLineY} 
                            stroke="#93c5fd" 
                            strokeWidth="0.85" 
                            strokeDasharray="2.5 1.5" 
                            opacity="0.65" 
                          />
                          <text 
                            x={selenocentricEarthX + lunarEarthGeom.poleLineX + 2} 
                            y={selenocentricEarthY - lunarEarthGeom.poleLineY - 1} 
                            className="text-[6px] font-mono font-bold fill-sky-300 select-none pointer-events-none"
                          >
                            N
                          </text>
                          <text 
                            x={selenocentricEarthX - lunarEarthGeom.poleLineX - 5} 
                            y={selenocentricEarthY + lunarEarthGeom.poleLineY + 5} 
                            className="text-[6px] font-mono font-bold fill-sky-400 select-none pointer-events-none"
                          >
                            S
                          </text>

                          {/* Dashed Blue Equator Line */}
                          <line 
                            x1={lunarEarthGeom.eqX1} 
                            y1={lunarEarthGeom.eqY1} 
                            x2={lunarEarthGeom.eqX2} 
                            y2={lunarEarthGeom.eqY2} 
                            stroke="#38bdf8" 
                            strokeWidth="0.85" 
                            strokeDasharray="2 1.5" 
                            opacity="0.65" 
                          />

                          <text x={selenocentricEarthX} y={selenocentricEarthY + (Math.abs(lunarEarthGeom.obsPy - selenocentricEarthY) < 5 ? 11 : 3)} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-blue-200 select-none pointer-events-none">
                            EARTH
                          </text>
                          <text x={selenocentricEarthX} y={selenocentricEarthY - 22} textAnchor="middle" className="text-[8px] font-mono fill-indigo-300 font-bold select-none pointer-events-none">
                            Relative Earth Orbit
                          </text>

                          {/* Observer Location Pin */}
                          <g transform={`translate(${lunarEarthGeom.obsPx.toFixed(1)}, ${lunarEarthGeom.obsPy.toFixed(1)})`}>
                            {lunarEarthGeom.isDaylight && (
                              <circle r="4" fill="#38bdf8" opacity="0.25" className="animate-pulse pointer-events-none" />
                            )}
                            <circle 
                              r="2" 
                              fill={lunarEarthGeom.isDaylight ? "#38bdf8" : "#64748b"} 
                              stroke="#ffffff" 
                              strokeWidth="0.75" 
                              opacity={lunarEarthGeom.isDaylight ? 1 : 0.4}
                              className="drop-shadow-sm"
                            />
                          </g>
                        </g>
                      );
                    })()}
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
