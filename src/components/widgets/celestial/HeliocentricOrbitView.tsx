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

    return {
      pEarthCenter, pMoonHelioc,
      solSummer, solWinter, eqSpring, eqAutumn,
      orbitR
    };
  }, [solarData, moonDegrees]);

  return (
    <g>
      {/* 1. Earth Orbit Ring around Sun */}
      {renderCircle3D(120, 0, 0, "#f59e0b", 1.5, "4 2", 0.7)}

      {/* 2. Sun Corona at Center */}
      <circle cx="200" cy="160" r="22" fill={CONFIG.THEME.SUN_FILL} opacity="0.2" className="animate-pulse" />
      <circle cx="200" cy="160" r="16" fill={CONFIG.THEME.SUN_FILL} stroke="white" strokeWidth="2" className="drop-shadow-lg" />
      <text x="200" y="163" textAnchor="middle" className="text-[8px] font-black fill-amber-950 font-mono">
        SUN
      </text>

      {/* 3. Earth Globe on Orbit */}
      <g transform={`translate(${heliocentricScene.pEarthCenter.px}, ${heliocentricScene.pEarthCenter.py})`}>
        <circle r="10" fill="#3b82f6" stroke="white" strokeWidth="1.5" className="drop-shadow" />
        {/* Tilted Earth Axis (23.44°) */}
        <line x1="-4" y1="-12" x2="4" y2="12" stroke="#93c5fd" strokeWidth="1.5" />
        <text x="14" y="4" className="text-[9px] font-mono font-bold fill-blue-300 drop-shadow-sm">
          EARTH (23.44°)
        </text>
      </g>

      {/* 4. Moon Body orbiting Earth */}
      <circle 
        cx={heliocentricScene.pMoonHelioc.px} cy={heliocentricScene.pMoonHelioc.py} 
        r="3.5" fill="#f8fafc" stroke="#334155" strokeWidth="1" 
      />

      {/* 5. Solstice & Equinox Markers along Earth's Orbit */}
      <g transform={`translate(${heliocentricScene.solSummer.px}, ${heliocentricScene.solSummer.py})`}>
        <circle r="3" fill="#f59e0b" />
        <text x="6" y="3" className="text-[8px] font-mono font-bold fill-amber-400">Jun Solstice</text>
      </g>

      <g transform={`translate(${heliocentricScene.solWinter.px}, ${heliocentricScene.solWinter.py})`}>
        <circle r="3" fill="#f59e0b" />
        <text x="6" y="3" className="text-[8px] font-mono font-bold fill-amber-400">Dec Solstice</text>
      </g>

      <g transform={`translate(${heliocentricScene.eqSpring.px}, ${heliocentricScene.eqSpring.py})`}>
        <circle r="3" fill="#c084fc" />
        <text x="6" y="3" className="text-[8px] font-mono font-bold fill-purple-300">Mar Equinox</text>
      </g>

      <g transform={`translate(${heliocentricScene.eqAutumn.px}, ${heliocentricScene.eqAutumn.py})`}>
        <circle r="3" fill="#c084fc" />
        <text x="-65" y="3" className="text-[8px] font-mono font-bold fill-purple-300">Sep Equinox</text>
      </g>
    </g>
  );
};
