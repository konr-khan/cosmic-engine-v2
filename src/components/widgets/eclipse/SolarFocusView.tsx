import React from 'react';
import { EclipseData } from '../../../types';
import { calculateEarthSideGeometry, generateOrbitalSegments } from '../../../utils/cosmicMath';

export interface SolarFocusViewProps {
  eclipse: EclipseData;
  latitude: number;
  longitude: number;
  timeOfDay: number;
  sunLambdaDeg: number;
  setHoveredEntity: (entity: 'sun' | 'earth' | 'moon' | 'umbra' | 'penumbra' | null) => void;
}

export const SolarFocusView: React.FC<SolarFocusViewProps> = ({
  eclipse,
  latitude,
  longitude,
  timeOfDay,
  sunLambdaDeg,
  setHoveredEntity
}) => {
  const earthX = 380;
  const earthY = 110;
  const rx = 100;
  const scalePxPerDeg = 8.5;

  const beta = eclipse.beta;
  const phaseVal = eclipse.phaseValue || 0;
  const phaseRad = phaseVal * 2 * Math.PI;
  const phaseDeg = Math.round(phaseVal * 360);
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);
  const isWaxing = phaseVal <= 0.5;

  const distKm = eclipse.distanceKm || 384000;
  const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));

  const nodeAngleRad = ((eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0)) * Math.PI) / 180;
  const moonOrbitalX = earthX - (Math.cos(phaseRad) * rx);
  const moonOrbitalY = earthY - (beta * scalePxPerDeg);

  const { waxAsc, waxDesc, wanAsc, wanDesc } = generateOrbitalSegments(
    earthX,
    earthY,
    rx,
    scalePxPerDeg,
    nodeAngleRad,
    'side',
    72
  );

  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const sAscNodeX = earthX - (Math.cos(tAsc) * rx);
  const sAscNodeY = earthY;
  const sDescNodeX = earthX - (Math.cos(tDesc) * rx);
  const sDescNodeY = earthY;

  const solarEarthGeom = calculateEarthSideGeometry(earthX, earthY, 20, sunLambdaDeg, latitude, timeOfDay);

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
        {waxAsc.length > 0 && <path d={waxAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.9" />}
        {waxDesc.length > 0 && <path d={waxDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" opacity="0.9" />}
        {wanAsc.length > 0 && <path d={wanAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />}
        {wanDesc.length > 0 && <path d={wanDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />}

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

      {/* EARTH BODY WITH 23.44° AXIAL TILT, DASHED EQUATOR & OBSERVER PIN */}
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
};
