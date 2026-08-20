import React, { useMemo } from 'react';
import { EclipseData } from '../../../types';
import { clamp, calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';

export interface NodalPlaneVisualizerProps {
  eclipse?: EclipseData | null;
  currentDate?: Date;
}

export const NodalPlaneVisualizer: React.FC<NodalPlaneVisualizerProps> = ({ 
  eclipse,
  currentDate = new Date()
}) => {
  if (!eclipse) return null;

  const beta = eclipse.beta; // Ecliptic latitude: -5.14° to +5.14°
  const distKm = eclipse.distanceKm || 384400;
  const offsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
  const penumbraRadKm = eclipse.penumbraRadiusKm || 9500;
  const umbraRadKm = eclipse.umbraRadiusKm || 4600;
  const isInsideCorridor = Math.abs(offsetKm) <= penumbraRadKm;
  const isInsideUmbra = Math.abs(offsetKm) <= umbraRadKm;

  // --- Dynamic Distance & Apparent Angular Size Scaling ---
  const solarPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(getJulianDate(currentDate, 12)),
    [currentDate]
  );
  const sunAngularDiamArcmin = solarPhysics.sunAngularDiameterArcmin; // ~31.5' (Aphelion) to ~32.5' (Perihelion)

  const moonDistKm = eclipse.distanceKm || 384400;
  const moonAngularDiamArcmin = 31.13 * (384400 / moonDistKm); // ~29.4' (Apogee) to ~33.5' (Perigee)

  // Apparent radii in SVG pixels (scaled so Earth is prominent and Moon is distinct)
  const axialSunRadius = 38;
  const axialMoonRadius = clamp(8.5 * (moonAngularDiamArcmin / 31.13), 7.0, 10.0);
  const isTotalCapable = moonAngularDiamArcmin >= sunAngularDiamArcmin;
  // --- Orbital Geometry in Axial Projection (3D Elliptical Orbital Loop) ---
  const centerX = 200;
  const centerY = 90;
  
  // Real-time seasonal nodal orientation across the sightline:
  const nodeAngleRad = ((eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0)) * Math.PI) / 180;
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);

  const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 0.5 (Full Moon) to 1.0
  const phaseRad = phaseVal * 2 * Math.PI;
  const isWaxing = phaseVal <= 0.5;

  // Transverse displacement perpendicular to the Sun-Earth sightline:
  // At Syzygy (New/Full Moon), sin(phaseRad) = 0 -> Moon is centered at X=200 in front of the Sun/Earth!
  // At Quarters (First/Last Quarter), sin(phaseRad) = +/-1 -> Moon is at the outer extremities (X=200 +/- 110)!
  const moonX = centerX + (Math.sin(phaseRad) * 110);
  const moonY = centerY - (beta * 8.5);

  // 3D Elliptical Orbital Loop: 4-Quadrant Paths (Waxing/Waning x Ascending/Descending)
  const N = 72;
  const waxAsc: string[] = [];
  const waxDesc: string[] = [];
  const wanAsc: string[] = [];
  const wanDesc: string[] = [];

  for (let i = 0; i < N; i++) {
    const t1 = (i / N) * 2 * Math.PI;
    const t2 = ((i + 1) / N) * 2 * Math.PI;
    const x1 = centerX + Math.sin(t1) * 110;
    const y1 = centerY - Math.sin(t1 + nodeAngleRad) * 5.145 * 8.5;
    const x2 = centerX + Math.sin(t2) * 110;
    const y2 = centerY - Math.sin(t2 + nodeAngleRad) * 5.145 * 8.5;

    const midT = (t1 + t2) / 2;
    const midBeta = Math.sin(midT + nodeAngleRad) * 5.145;
    const isWax = midT <= Math.PI;
    const isAsc = midBeta >= 0;

    const seg = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (isWax) {
      if (isAsc) waxAsc.push(seg);
      else waxDesc.push(seg);
    } else {
      if (isAsc) wanAsc.push(seg);
      else wanDesc.push(seg);
    }
  }

  // Node Positions where orbital loop crosses horizontal ecliptic plane (Y = 90)
  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const ascNodeX = centerX + (Math.sin(tAsc) * 110);
  const ascNodeY = centerY;
  const descNodeX = centerX + (Math.sin(tDesc) * 110);
  const descNodeY = centerY;

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* Header with Apparent Size Readout */}
      <div className="text-xs text-slate-300 mb-1 font-mono flex justify-between items-center px-1">
        <span className="font-semibold text-emerald-400 flex items-center gap-1 font-sans">
          Axial Sightline (5.14° Tilt)
        </span>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-amber-400 font-medium">☉ {sunAngularDiamArcmin.toFixed(1)}'</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-300 font-medium">☽ {moonAngularDiamArcmin.toFixed(1)}'</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
            isTotalCapable 
              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' 
              : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
          }`}>
            {isTotalCapable ? 'Total Capable' : 'Annular Only'}
          </span>
        </div>
      </div>

      {/* SVG Axial Projection Diagram */}
      <div className="relative w-full flex-1 flex items-center justify-center my-0.5 min-h-[140px]">
        <svg viewBox="0 0 400 180" className="w-full h-full max-h-[170px] overflow-visible" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Sun Corona Soft Glow */}
            <radialGradient id="axialSunCorona" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="90%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Earth Penumbra Target Gradient */}
            <radialGradient id="axialPenumbraTarget" cx="50%" cy="50%" r="50%">
              <stop offset="30%" stopColor="#020617" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#1e293b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          {/* Ecliptic Reference Line (Horizontal 0° plane) */}
          <line x1="20" y1={centerY} x2="380" y2={centerY} stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
          <text x="25" y={centerY - 5} className="text-[8px] font-mono fill-amber-400/80">Ecliptic Plane (0°)</text>

          {/* 1. BACKGROUND SUN DISC (Partially eclipsed behind Earth) */}
          <g>
            <circle cx={centerX} cy={centerY} r={axialSunRadius * 1.3} fill="url(#axialSunCorona)" />
            <circle cx={centerX} cy={centerY} r={axialSunRadius} fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
            <text x={centerX} y={centerY - axialSunRadius - 4} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-amber-300">
              SUN ({sunAngularDiamArcmin.toFixed(1)}')
            </text>
          </g>

          {/* 2. EARTH SHADOW TARGET CONES (At Lunar Distance) */}
          {/* Penumbra Shadow Envelope */}
          <circle cx={centerX} cy={centerY} r="28" fill="url(#axialPenumbraTarget)" stroke="#64748b" strokeWidth="0.75" strokeDasharray="2 2" />
          {/* Umbra Shadow Core */}
          <circle cx={centerX} cy={centerY} r="15" fill="#020617" stroke="#f43f5e" strokeWidth="1" />
          
          {/* 3. 3D OPEN ELLIPTICAL LUNAR ORBITAL LOOP AROUND EARTH */}
          <g className="pointer-events-none">
            {/* Waxing Ascending: Solid Sky Blue */}
            {waxAsc.length > 0 && (
              <path d={waxAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.9" />
            )}
            {/* Waxing Descending: Solid Crimson Red */}
            {waxDesc.length > 0 && (
              <path d={waxDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" opacity="0.9" />
            )}
            {/* Waning Ascending: Dashed Sky Blue */}
            {wanAsc.length > 0 && (
              <path d={wanAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />
            )}
            {/* Waning Descending: Dashed Crimson Red */}
            {wanDesc.length > 0 && (
              <path d={wanDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />
            )}

            {/* Ascending Node Marker (☊) */}
            <circle cx={ascNodeX} cy={ascNodeY} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            <text 
              x={ascNodeX < centerX ? ascNodeX - 6 : ascNodeX + 6} 
              y={ascNodeY - 5} 
              textAnchor={ascNodeX < centerX ? "end" : "start"} 
              className="text-[7.5px] font-mono fill-sky-400 font-semibold select-none"
            >
              ☊ Node
            </text>

            {/* Descending Node Marker (☋) */}
            <circle cx={descNodeX} cy={descNodeY} r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
            <text 
              x={descNodeX > centerX ? descNodeX + 6 : descNodeX - 6} 
              y={descNodeY + 12} 
              textAnchor={descNodeX > centerX ? "start" : "end"} 
              className="text-[7.5px] font-mono fill-rose-400 font-semibold select-none"
            >
              ☋ Node
            </text>
          </g>

          {/* 4. CLEAN VECTOR EARTH BODY (Matching Syzygy window styling) */}
          <g>
            <circle cx={centerX} cy={centerY} r="20" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
            <text x={centerX} y={centerY + 4} textAnchor="middle" className="text-[9px] font-mono font-bold fill-blue-300 select-none pointer-events-none">
              EARTH
            </text>
          </g>

          {/* 5. DYNAMIC MOON DISC IN REAL-TIME ORBIT */}
          <g transform={`translate(${moonX}, ${moonY})`}>
            <circle 
              r={axialMoonRadius} 
              fill={eclipse.isEclipseActive ? (isInsideUmbra ? '#f43f5e' : '#fb923c') : (isWaxing ? '#0f172a' : '#475569')} 
              fillOpacity={!eclipse.isEclipseActive && !isWaxing ? 0.75 : 0.9} 
              stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')} 
              strokeWidth="2" 
              strokeDasharray={!eclipse.isEclipseActive && !isWaxing ? "3 2" : undefined}
              className="drop-shadow"
            />
            <circle r="1.5" fill={isAscending ? '#38bdf8' : '#f43f5e'} />
            <text 
              x={moonX > centerX ? 10 : -10} 
              y="-3" 
              textAnchor={moonX > centerX ? 'start' : 'end'} 
              className={`text-[8px] font-mono font-bold ${
                eclipse.isEclipseActive ? 'fill-rose-300' : (isAscending ? 'fill-sky-300' : 'fill-rose-300')
              }`}
            >
              MOON ({moonAngularDiamArcmin.toFixed(1)}')
            </text>
            <text 
              x={moonX > centerX ? 10 : -10} 
              y="7" 
              textAnchor={moonX > centerX ? 'start' : 'end'} 
              className="text-[7px] font-mono fill-slate-400 select-none"
            >
              [{isWaxing ? 'Waxing / Solid' : 'Waning / Dashed'}]
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Mini Metrics Bar */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/60 text-[9px] font-mono text-center">
        <div>
          <span className="text-slate-400 block text-[8px] uppercase font-sans">Apparent Ratio</span>
          <span className={`font-semibold ${isTotalCapable ? 'text-amber-400' : 'text-indigo-300'}`}>
            {(moonAngularDiamArcmin / sunAngularDiamArcmin).toFixed(3)}×
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[8px] uppercase font-sans">Vertical Offset</span>
          <span className={`font-semibold ${isInsideCorridor ? 'text-rose-400' : 'text-slate-200'}`}>
            {offsetKm > 0 ? `+${offsetKm.toLocaleString()}` : offsetKm.toLocaleString()} km
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[8px] uppercase font-sans">Eclipse Mode</span>
          <span className={`font-semibold ${eclipse.isEclipseActive ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {eclipse.isEclipseActive ? eclipse.label.substring(0, 14) : (isInsideCorridor ? 'Near Node' : 'Missed')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NodalPlaneVisualizer;
