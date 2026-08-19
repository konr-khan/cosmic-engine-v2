import React, { useMemo } from 'react';
import { toRadians, CONFIG } from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';
import { project3D, renderCircle3D } from './projection3D';

export interface HeliocentricOrbitViewProps {
  solarData?: SolarAlmanacData | null;
  moonDegrees: number;
}

export const HeliocentricOrbitView: React.FC<HeliocentricOrbitViewProps> = ({
  solarData,
  moonDegrees
}) => {
  const heliocentricScene = useMemo(() => {
    const pitch = 24;
    const yaw = -30;
    const scale = 1.0;
    const cx = 200;
    const cy = 160;
    const orbitR = 120;

    // Earth Position on Heliocentric Orbit (based on orbital date / days since epoch)
    const daysSinceEpoch = solarData ? (solarData.daysSinceEpoch as number) : 0;
    const dayOfYear = ((daysSinceEpoch % 365.25) + 365.25) % 365.25;
    const earthOrbitRad = toRadians(((dayOfYear - 79) / 365.25) * 360);
    const earthX = orbitR * Math.cos(earthOrbitRad);
    const earthZ = orbitR * Math.sin(earthOrbitRad);

    const pEarthCenter = project3D(earthX, 0, earthZ, pitch, yaw, scale, cx, cy);

    // Moon Orbit around Earth (Radius 24px)
    const moonLocalR = 24;
    const moonRad = toRadians(moonDegrees);
    const moonLocalX = earthX + moonLocalR * Math.cos(earthOrbitRad + moonRad);
    const moonLocalZ = earthZ + moonLocalR * Math.sin(earthOrbitRad + moonRad);
    const pMoonHelioc = project3D(moonLocalX, 0, moonLocalZ, pitch, yaw, scale, cx, cy);

    // Solstice & Equinox Markers along Earth Orbit Ring
    const solSummer = project3D(0, 0, orbitR, pitch, yaw, scale, cx, cy);
    const solWinter = project3D(0, 0, -orbitR, pitch, yaw, scale, cx, cy);
    const eqSpring = project3D(orbitR, 0, 0, pitch, yaw, scale, cx, cy);
    const eqAutumn = project3D(-orbitR, 0, 0, pitch, yaw, scale, cx, cy);

    // Perihelion (Jan 3 ~ 283°) and Aphelion (Jul 4 ~ 103°) Markers
    const perihelionRad = toRadians(283);
    const aphelionRad = toRadians(103);
    const nodePerihelion = project3D(orbitR * Math.cos(perihelionRad), 0, orbitR * Math.sin(perihelionRad), pitch, yaw, scale, cx, cy);
    const nodeAphelion = project3D(orbitR * Math.cos(aphelionRad), 0, orbitR * Math.sin(aphelionRad), pitch, yaw, scale, cx, cy);

    return {
      pEarthCenter, pMoonHelioc,
      solSummer, solWinter, eqSpring, eqAutumn,
      nodePerihelion, nodeAphelion,
      orbitR
    };
  }, [solarData, moonDegrees]);

  return (
    <g>
      {/* 1. Earth Orbit Ring around Sun */}
      {renderCircle3D(120, 0, 0, "#f59e0b", 1.5, "4 2", 0.7)}

      {/* 2. Sun Corona at Center */}
      <circle cx="200" cy="160" r="24" fill={CONFIG.THEME.SUN_FILL} opacity="0.15" className="animate-pulse" />
      <circle cx="200" cy="160" r="16" fill={CONFIG.THEME.SUN_FILL} stroke="white" strokeWidth="2" className="drop-shadow-lg" />
      <text x="200" y="163" textAnchor="middle" className="text-[8px] font-black fill-amber-950 font-mono select-none pointer-events-none">
        SUN
      </text>

      {/* 3. Earth Globe on Orbit */}
      <g transform={`translate(${heliocentricScene.pEarthCenter.px}, ${heliocentricScene.pEarthCenter.py})`}>
        <circle r="10" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" className="drop-shadow" />
        {/* Tilted Earth Axis (23.44°) */}
        <line x1="-4" y1="-12" x2="4" y2="12" stroke="#93c5fd" strokeWidth="1.5" />
        <text x="14" y="4" className="text-[9px] font-mono font-bold fill-blue-300 drop-shadow-sm select-none pointer-events-none">
          EARTH (23.44°)
        </text>
      </g>

      {/* 4. Moon Body orbiting Earth */}
      <circle 
        cx={heliocentricScene.pMoonHelioc.px} cy={heliocentricScene.pMoonHelioc.py} 
        r="3.5" fill="#f8fafc" stroke="#334155" strokeWidth="1" 
      />

      {/* 5. Solstice & Equinox Milestone Nodes with Translucent Halos */}
      {/* June Solstice */}
      <g transform={`translate(${heliocentricScene.solSummer.px}, ${heliocentricScene.solSummer.py})`}>
        <circle r="8" fill="#f59e0b" opacity="0.25" className="animate-pulse" />
        <circle r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
        <text x="7" y="3" className="text-[8px] font-mono font-bold fill-amber-400 select-none pointer-events-none">Jun Solstice</text>
      </g>

      {/* December Solstice */}
      <g transform={`translate(${heliocentricScene.solWinter.px}, ${heliocentricScene.solWinter.py})`}>
        <circle r="8" fill="#f59e0b" opacity="0.25" className="animate-pulse" />
        <circle r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
        <text x="7" y="3" className="text-[8px] font-mono font-bold fill-amber-400 select-none pointer-events-none">Dec Solstice</text>
      </g>

      {/* March Equinox */}
      <g transform={`translate(${heliocentricScene.eqSpring.px}, ${heliocentricScene.eqSpring.py})`}>
        <circle r="8" fill="#c084fc" opacity="0.25" className="animate-pulse" />
        <circle r="3.5" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
        <text x="7" y="3" className="text-[8px] font-mono font-bold fill-purple-300 select-none pointer-events-none">Mar Equinox</text>
      </g>

      {/* September Equinox */}
      <g transform={`translate(${heliocentricScene.eqAutumn.px}, ${heliocentricScene.eqAutumn.py})`}>
        <circle r="8" fill="#c084fc" opacity="0.25" className="animate-pulse" />
        <circle r="3.5" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
        <text x="-68" y="3" className="text-[8px] font-mono font-bold fill-purple-300 select-none pointer-events-none">Sep Equinox</text>
      </g>

      {/* Perihelion (Red Halo Node) */}
      <g transform={`translate(${heliocentricScene.nodePerihelion.px}, ${heliocentricScene.nodePerihelion.py})`}>
        <circle r="8" fill="#ef4444" opacity="0.25" className="animate-pulse" />
        <circle r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
        <text x="7" y="3" className="text-[8px] font-mono font-bold fill-rose-400 select-none pointer-events-none">Perihelion</text>
      </g>

      {/* Aphelion (Sky Blue Halo Node) */}
      <g transform={`translate(${heliocentricScene.nodeAphelion.px}, ${heliocentricScene.nodeAphelion.py})`}>
        <circle r="8" fill="#38bdf8" opacity="0.25" className="animate-pulse" />
        <circle r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
        <text x="-52" y="3" className="text-[8px] font-mono font-bold fill-sky-400 select-none pointer-events-none">Aphelion</text>
      </g>
    </g>
  );
};
