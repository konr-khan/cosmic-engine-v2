import React, { useMemo } from 'react';
import { EclipseData } from '../../../types';
import { 
  clamp, 
  calculateEarthOrbitalPhysics, 
  getJulianDate, 
  generateOrbitalSegments,
  toRadians
} from '../../../utils/cosmicMath';
import { MiniGlobe } from '../../common/MiniGlobe';

export interface NodalPlaneVisualizerProps {
  eclipse?: EclipseData | null;
  currentDate?: Date;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
}

export const NodalPlaneVisualizer: React.FC<NodalPlaneVisualizerProps> = ({ 
  eclipse,
  currentDate = new Date(),
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12
}) => {
  if (!eclipse) return null;

  const beta = eclipse.beta; // Ecliptic latitude: -5.14° to +5.14°
  const distKm = eclipse.distanceKm || 384400;
  const offsetKm = Math.round(distKm * Math.sin(toRadians(beta)));
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
  const sunLambdaDeg = ((solarPhysics?.lambda ?? solarPhysics?.eclipticLongitude ?? 0) as number);

  const moonDistKm = eclipse.distanceKm || 384400;
  const moonAngularDiamArcmin = 31.13 * (384400 / moonDistKm); // ~29.4' (Apogee) to ~33.5' (Perigee)

  // Apparent radii in SVG pixels (scaled so Earth is prominent and Moon is distinct)
  const axialSunRadius = 46;
  const axialMoonRadius = clamp(10.5 * (moonAngularDiamArcmin / 31.13), 8.5, 12.5);
  const isTotalCapable = moonAngularDiamArcmin >= sunAngularDiamArcmin;

  // --- Orbital Geometry in Axial Projection (3D Elliptical Orbital Loop) ---
  // Center harmonized to (260, 110) matching 520x220 canvas and Syzygy window's Y=110 ecliptic plane
  const centerX = 260;
  const centerY = 110;
  const orbitalRx = 150;
  const scalePxPerDeg = 10.5;
  
  // Real-time seasonal nodal orientation across the sightline:
  const nodeAngleRad = toRadians(eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0));
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);

  const phaseVal = eclipse.phaseValue || 0; // 0.0 (New Moon) to 0.5 (Full Moon) to 1.0
  const phaseRad = phaseVal * 2 * Math.PI;
  const isWaxing = phaseVal <= 0.5;

  // Transverse displacement perpendicular to the Sun-Earth sightline:
  // Prograde West-to-East orbit: Waxing moves East (left, -X), Waning moves West (right, +X)
  const moonX = centerX - (Math.sin(phaseRad) * orbitalRx);
  const moonY = centerY - (beta * scalePxPerDeg);

  // 3D Elliptical Orbital Loop: 4-Quadrant Paths (Waxing/Waning x Ascending/Descending)
  const { waxAsc, waxDesc, wanAsc, wanDesc } = generateOrbitalSegments(
    centerX,
    centerY,
    orbitalRx,
    scalePxPerDeg,
    nodeAngleRad,
    'axial',
    72
  );

  // Node Positions where orbital loop crosses horizontal ecliptic plane (Y = 110)
  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const ascNodeX = centerX - (Math.sin(tAsc) * orbitalRx);
  const ascNodeY = centerY;
  const descNodeX = centerX - (Math.sin(tDesc) * orbitalRx);
  const descNodeY = centerY;

  return (
    <div className="w-full h-full flex flex-col justify-between relative select-none">
      {/* Top Bar: Title & Live Apparent Sizes + Capability Badge */}
      <div className="flex justify-between items-center gap-1.5 mb-1 text-xs font-mono px-1">
        <span className="font-semibold text-emerald-400 flex items-center gap-1 font-sans">
          Axial Sightline (5.14° Tilt)
        </span>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-amber-400 font-medium">☉ {sunAngularDiamArcmin.toFixed(1)}'</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-300 font-medium">☽ {moonAngularDiamArcmin.toFixed(1)}'</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-indigo-300 font-semibold hidden sm:inline">{(moonAngularDiamArcmin / sunAngularDiamArcmin).toFixed(3)}×</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
            isTotalCapable 
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' 
              : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80'
          }`}>
            {isTotalCapable ? 'Total Capable' : 'Annular Only'}
          </span>
        </div>
      </div>

      {/* SVG Axial Projection Diagram Viewport (Conformed to 520x220 with Syzygy Window) */}
      <svg viewBox="0 0 520 220" className="w-full h-full block flex-1 min-h-[220px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Sun Corona Soft Glow */}
          <radialGradient id="axialSunCorona" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>

          {/* Earth Penumbra Target Gradient */}
          <radialGradient id="axialPenumbraTarget" cx="50%" cy="50%" r="50%">
            <stop offset="30%" stopColor="#020617" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#1e293b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Ecliptic Reference Line (Horizontal 0° plane, harmonized to Y = 110) */}
        <line x1="20" y1={centerY} x2="500" y2={centerY} stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
        <text x="25" y={centerY - 6} className="text-[8.5px] font-mono fill-amber-400/80 select-none">Ecliptic Plane (0°)</text>

        {/* 1. BACKGROUND SUN DISC (Partially eclipsed behind Earth along line of sight) */}
        <g>
          <title>{`Sun (Apparent Diameter: ${sunAngularDiamArcmin.toFixed(1)}')`}</title>
          <circle cx={centerX} cy={centerY} r={axialSunRadius * 1.35} fill="url(#axialSunCorona)" />
          <circle cx={centerX} cy={centerY} r={axialSunRadius} fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
          <text x={centerX} y={centerY - axialSunRadius - 6} textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-amber-300 select-none pointer-events-none">
            SUN ({sunAngularDiamArcmin.toFixed(1)}')
          </text>
        </g>

        {/* 2. EARTH SHADOW TARGET CONES (At Lunar Distance) */}
        {/* Penumbra Shadow Envelope */}
        <circle cx={centerX} cy={centerY} r="34" fill="url(#axialPenumbraTarget)" stroke="#64748b" strokeWidth="0.75" strokeDasharray="2 2" />
        {/* Umbra Shadow Core */}
        <circle cx={centerX} cy={centerY} r="18" fill="#020617" stroke="#f43f5e" strokeWidth="1" />
        
        {/* 3. BACK LUNAR ORBITAL LOOP AROUND EARTH (Waning: Dashed stroke, behind Earth) */}
        <g className="pointer-events-none">
          {/* Waning Ascending: Dashed Sky Blue */}
          {wanAsc.length > 0 && (
            <path d={wanAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.9" />
          )}
          {/* Waning Descending: Dashed Rose Red */}
          {wanDesc.length > 0 && (
            <path d={wanDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.9" />
          )}
        </g>

        {/* DYNAMIC MOON DISC (When behind Earth / Waning) */}
        {!isWaxing && (
          <g transform={`translate(${moonX}, ${moonY})`}>
            <circle 
              r={axialMoonRadius} 
              fill={eclipse.isEclipseActive ? (isInsideUmbra ? '#f43f5e' : '#fb923c') : '#475569'} 
              fillOpacity={eclipse.isEclipseActive ? 1 : 0.75} 
              stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')} 
              strokeWidth="2" 
              strokeDasharray="3 2"
              className="drop-shadow"
            />
            <circle r="1.5" fill={isAscending ? '#38bdf8' : '#f43f5e'} />
            <text 
              x={moonX > centerX ? 12 : -12} 
              y="-4" 
              textAnchor={moonX > centerX ? 'start' : 'end'} 
              className={`text-[8.5px] font-mono font-bold select-none pointer-events-none ${
                eclipse.isEclipseActive ? 'fill-rose-300' : (isAscending ? 'fill-sky-300' : 'fill-rose-300')
              }`}
            >
              MOON ({moonAngularDiamArcmin.toFixed(1)}')
            </text>
            <text 
              x={moonX > centerX ? 12 : -12} 
              y="8" 
              textAnchor={moonX > centerX ? 'start' : 'end'} 
              className="text-[7.5px] font-mono fill-slate-400 select-none pointer-events-none"
            >
              [Waning / Dashed]
            </text>
          </g>
        )}

        {/* 4. HIGH-PRECISION EARTH MINI-GLOBE IN AXIAL PROJECTION (Upsized radius=24) */}
        <MiniGlobe
          cx={centerX}
          cy={centerY}
          radius={24}
          viewMode="axial"
          sunLambdaDeg={sunLambdaDeg}
          latitude={latitude}
          longitude={longitude}
          timeOfDay={timeOfDay}
          showTerminator={true}
          showParallels={true}
          showPolarAxis={true}
          showObserverPin={true}
          showAtmosphereGlow={true}
          showLabel={true}
        />

        {/* 5. FRONT LUNAR ORBITAL LOOP AROUND EARTH (Waxing: Solid stroke, in front of Earth) */}
        <g className="pointer-events-none">
          {/* Waxing Ascending: Solid Sky Blue */}
          {waxAsc.length > 0 && (
            <path d={waxAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.9" />
          )}
          {/* Waxing Descending: Solid Rose Red */}
          {waxDesc.length > 0 && (
            <path d={waxDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.2" opacity="0.9" />
          )}

          {/* Ascending Node Marker (☊) */}
          <circle cx={ascNodeX} cy={ascNodeY} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
          <text 
            x={ascNodeX < centerX ? ascNodeX - 8 : ascNodeX + 8} 
            y={ascNodeY - 6} 
            textAnchor={ascNodeX < centerX ? "end" : "start"} 
            className="text-[8px] font-mono fill-sky-400 font-semibold select-none"
          >
            ☊ Node
          </text>

          {/* Descending Node Marker (☋) */}
          <circle cx={descNodeX} cy={descNodeY} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
          <text 
            x={descNodeX > centerX ? descNodeX + 8 : descNodeX - 8} 
            y={descNodeY + 14} 
            textAnchor={descNodeX > centerX ? "start" : "end"} 
            className="text-[8px] font-mono fill-rose-400 font-semibold select-none"
          >
            ☋ Node
          </text>
        </g>

        {/* DYNAMIC MOON DISC (When in front of Earth / Waxing) */}
        {isWaxing && (
          <g transform={`translate(${moonX}, ${moonY})`}>
            <circle 
              r={axialMoonRadius} 
              fill={eclipse.isEclipseActive ? (isInsideUmbra ? '#f43f5e' : '#fb923c') : '#0f172a'} 
              fillOpacity={0.9} 
              stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')} 
              strokeWidth="2" 
              className="drop-shadow"
            />
            <circle r="1.5" fill={isAscending ? '#38bdf8' : '#f43f5e'} />
            <text 
              x={moonX > centerX ? 12 : -12} 
              y="-4" 
              textAnchor={moonX > centerX ? 'start' : 'end'} 
              className={`text-[8.5px] font-mono font-bold select-none pointer-events-none ${
                eclipse.isEclipseActive ? 'fill-rose-300' : (isAscending ? 'fill-sky-300' : 'fill-rose-300')
              }`}
            >
              MOON ({moonAngularDiamArcmin.toFixed(1)}')
            </text>
            <text 
              x={moonX > centerX ? 12 : -12} 
              y="8" 
              textAnchor={moonX > centerX ? 'start' : 'end'} 
              className="text-[7.5px] font-mono fill-slate-400 select-none pointer-events-none"
            >
              [Waxing / Solid]
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default NodalPlaneVisualizer;
