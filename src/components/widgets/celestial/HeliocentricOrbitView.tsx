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
      {renderCircle3D(120, 0, 0, "#f59e0b", 1.8, "4 2", 0.7)}

      {/* 2. Sun Corona at Center */}
      <circle cx="200" cy="160" r="18" fill={CONFIG.THEME.SUN_FILL} stroke="white" strokeWidth="3" className="drop-shadow-lg" />
      <text x="200" y="164" textAnchor="middle" className="text-[9px] font-black fill-amber-950 font-mono">
        SUN
      </text>

      {/* 3. Earth Globe on Orbit */}
      <g transform={`translate(${heliocentricScene.pEarthCenter.px}, ${heliocentricScene.pEarthCenter.py})`}>
        <circle r="12" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
        {/* Tilted Earth Axis (23.44°) */}
        <line x1="-5" y1="-14" x2="5" y2="14" stroke="#93c5fd" strokeWidth="2" />
        <text x="16" y="4" className="text-[9px] font-mono font-bold fill-blue-300">
          EARTH (23.44°)
        </text>
      </g>

      {/* 4. Moon Body orbiting Earth */}
      <circle 
        cx={heliocentricScene.pMoonHelioc.px} cy={heliocentricScene.pMoonHelioc.py} 
        r="4" fill="#e2e8f0" stroke="#334155" strokeWidth="1" 
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
