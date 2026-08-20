import React from 'react';
import { EclipseData } from '../../../types';
import { calculateEarthSideGeometry } from '../../../utils/cosmicMath';

export interface SelenocentricOrbitViewProps {
  eclipse: EclipseData;
  latitude: number;
  longitude: number;
  timeOfDay: number;
  sunLambdaDeg: number;
}

export const SelenocentricOrbitView: React.FC<SelenocentricOrbitViewProps> = ({
  eclipse,
  latitude,
  longitude,
  timeOfDay,
  sunLambdaDeg
}) => {
  const beta = eclipse.beta;
  const distKm = eclipse.distanceKm || 384000;
  const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
  const phaseVal = eclipse.phaseValue || 0;
  const phaseDeg = Math.round(phaseVal * 360);
  const scalePxPerDeg = 8.5;

  const distFromFullRad = Math.sin(((phaseDeg - 180) * Math.PI) / 180);
  const selenocentricEarthX = 260 - Math.max(-120, Math.min(120, distFromFullRad * 130));
  const selenocentricEarthY = 110 + (beta * scalePxPerDeg);

  const lunarEarthGeom = calculateEarthSideGeometry(
    selenocentricEarthX,
    selenocentricEarthY,
    18,
    sunLambdaDeg,
    latitude,
    timeOfDay
  );

  return (
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
      </g>
    </g>
  );
};
