import React from 'react';
import { EclipseData } from '../../../types';
import { generateOrbitalSegments, toRadians } from '../../../utils/cosmicMath';
import { MiniGlobe } from '../../common/MiniGlobe';

export interface LiveSyzygyViewProps {
  eclipse: EclipseData;
  latitude: number;
  longitude: number;
  timeOfDay: number;
  sunLambdaDeg: number;
  setHoveredEntity: (entity: 'sun' | 'earth' | 'moon' | 'umbra' | 'penumbra' | null) => void;
}

export const LiveSyzygyView: React.FC<LiveSyzygyViewProps> = ({
  eclipse,
  latitude,
  longitude,
  timeOfDay,
  sunLambdaDeg,
  setHoveredEntity
}) => {
  const beta = eclipse.beta;
  const phaseVal = eclipse.phaseValue || 0;
  const phaseRad = phaseVal * 2 * Math.PI;
  const phaseDeg = Math.round(phaseVal * 360);
  const scalePxPerDeg = 8.5;
  const isAscending = eclipse.isAscendingHemisphere ?? (beta >= 0);
  const isWaxing = phaseVal <= 0.5;

  const liveEarthX = 310;
  const liveEarthY = 110;
  const liveOrbitalRx = 85;

  const nodeAngleRad = toRadians(eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg || 0));
  const liveMoonX = liveEarthX - (Math.cos(phaseRad) * liveOrbitalRx);
  const liveMoonY = liveEarthY - (beta * scalePxPerDeg);

  const { waxAsc, waxDesc, wanAsc, wanDesc } = generateOrbitalSegments(
    liveEarthX,
    liveEarthY,
    liveOrbitalRx,
    scalePxPerDeg,
    nodeAngleRad,
    'side',
    72
  );

  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const ascNodeX = liveEarthX - (Math.cos(tAsc) * liveOrbitalRx);
  const ascNodeY = liveEarthY;
  const descNodeX = liveEarthX - (Math.cos(tDesc) * liveOrbitalRx);
  const descNodeY = liveEarthY;

  return (
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

      {/* 4. BACK LUNAR ORBIT (Waning: Dashed stroke, behind Earth) */}
      <g className="pointer-events-none">
        {wanAsc.length > 0 && <path d={wanAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />}
        {wanDesc.length > 0 && <path d={wanDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.9" />}
      </g>

      {/* Line connecting Earth and Moon (Back) */}
      {!isWaxing && (
        <line x1={liveEarthX} y1={liveEarthY} x2={liveMoonX} y2={liveMoonY} stroke="#64748b" strokeWidth="1" opacity="0.6" />
      )}

      {/* DYNAMIC MOON BODY (When behind Earth / Waning) */}
      {!isWaxing && (
        <g 
          transform={`translate(${liveMoonX}, ${liveMoonY})`} 
          className="cursor-pointer"
          onPointerEnter={() => setHoveredEntity('moon')}
          onPointerLeave={() => setHoveredEntity(null)}
        >
          <circle
            r="8"
            fill={eclipse.isEclipseActive ? '#f43f5e' : '#475569'}
            fillOpacity={eclipse.isEclipseActive ? 1 : 0.75}
            stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')}
            strokeWidth="2"
            strokeDasharray="3 2"
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
      )}

      {/* 5. HIGH-PRECISION EARTH MINI-GLOBE WITH 23.44° AXIAL TILT, EQUATOR & OBSERVER PIN */}
      <MiniGlobe
        cx={liveEarthX}
        cy={liveEarthY}
        radius={18}
        viewMode="transverse"
        sunLambdaDeg={sunLambdaDeg}
        latitude={latitude}
        longitude={longitude}
        timeOfDay={timeOfDay}
        showTerminator={true}
        showParallels={true}
        showPolarAxis={true}
        showObserverPin={true}
        showAtmosphereGlow={true}
        onPointerEnter={() => setHoveredEntity('earth')}
        onPointerLeave={() => setHoveredEntity(null)}
      />

      {/* 6. FRONT LUNAR ORBIT (Waxing: Solid stroke, in front of Earth) */}
      <g className="pointer-events-none">
        {waxAsc.length > 0 && <path d={waxAsc.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.9" />}
        {waxDesc.length > 0 && <path d={waxDesc.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="1.4" opacity="0.9" />}

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

      {/* Line connecting Earth and Moon (Front) */}
      {isWaxing && (
        <line x1={liveEarthX} y1={liveEarthY} x2={liveMoonX} y2={liveMoonY} stroke="#64748b" strokeWidth="1" opacity="0.6" />
      )}

      {/* DYNAMIC MOON BODY (When in front of Earth / Waxing) */}
      {isWaxing && (
        <g 
          transform={`translate(${liveMoonX}, ${liveMoonY})`} 
          className="cursor-pointer"
          onPointerEnter={() => setHoveredEntity('moon')}
          onPointerLeave={() => setHoveredEntity(null)}
        >
          <circle
            r="8"
            fill={eclipse.isEclipseActive ? '#f43f5e' : '#94a3b8'}
            fillOpacity={1}
            stroke={eclipse.isEclipseActive ? '#fbbf24' : (isAscending ? '#38bdf8' : '#f43f5e')}
            strokeWidth="2"
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
      )}
    </g>
  );
};

export default LiveSyzygyView;
