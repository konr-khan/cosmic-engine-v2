import React, { useMemo } from 'react';
import { toRadians, CONFIG } from '../../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../../types';
import { project3D, renderCircle3D } from './projection3D';

export interface GeocentricSphereViewProps {
  latitude: number;
  longitude: number;
  timeOfDay: number;
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
}

export const GeocentricSphereView: React.FC<GeocentricSphereViewProps> = ({
  latitude,
  longitude,
  timeOfDay,
  solarData,
  orbitalData
}) => {
  const declination = (solarData ? solarData.declination : 0) as number;
  const moonDeg = orbitalData && orbitalData.angles ? (orbitalData.angles.moonDegrees as number) : 0;

  const geocentricScene = useMemo(() => {
    const pitch = 20;
    const yaw = -30;
    const scale = 1.0;
    const cx = 200;
    const cy = 160;
    const sphereR = 110;
    const earthR = 32;

    // 1. Earth Axial Tilt & Poles
    const tiltDeg = 23.44;
    const radTilt = toRadians(tiltDeg);

    const northPole3D = { x: 0, y: earthR * Math.cos(radTilt), z: -earthR * Math.sin(radTilt) };
    const southPole3D = { x: 0, y: -earthR * Math.cos(radTilt), z: earthR * Math.sin(radTilt) };

    const pNorth = project3D(northPole3D.x, northPole3D.y, northPole3D.z, pitch, yaw, scale, cx, cy);
    const pSouth = project3D(southPole3D.x, southPole3D.y, southPole3D.z, pitch, yaw, scale, cx, cy);

    // 2. Observer Location on Earth Surface
    const latRad = toRadians(latitude);
    const lonRad = toRadians(longitude);

    const obsX = earthR * Math.cos(latRad) * Math.sin(lonRad);
    const obsY = earthR * Math.sin(latRad);
    const obsZ = earthR * Math.cos(latRad) * Math.cos(lonRad);

    const pObsEarth = project3D(obsX, obsY, obsZ, pitch, yaw, scale, cx, cy);

    // Zenith Ray extending out to Celestial Vault
    const zenithX = (sphereR / earthR) * obsX;
    const zenithY = (sphereR / earthR) * obsY;
    const zenithZ = (sphereR / earthR) * obsZ;

    const pZenithVault = project3D(zenithX, zenithY, zenithZ, pitch, yaw, scale, cx, cy);

    // 3. True Solar Coordinates on Ecliptic Ring
    const sunLambdaDeg = ((solarData?.lambda ?? solarData?.eclipticLongitude ?? ((12 - timeOfDay) * 15 + declination)) as number);
    const sunLambdaRad = toRadians(sunLambdaDeg);
    const sunX0 = sphereR * Math.cos(sunLambdaRad);
    const sunZ0 = sphereR * Math.sin(sunLambdaRad);
    const sunY1 = -sunZ0 * Math.sin(radTilt);
    const sunZ1 = sunZ0 * Math.cos(radTilt);

    const pSun = project3D(sunX0, sunY1, sunZ1, pitch, yaw, scale, cx, cy);

    // 4. True Lunar & Nodal Coordinates
    const nodeLonDeg = orbitalData?.nodeLongitude ?? orbitalData?.angles?.nodeLongitude ?? 125.0;
    const nodeLonRad = toRadians(nodeLonDeg);

    const lunarLambdaDeg = orbitalData?.lunarPos?.lambda ?? orbitalData?.angles?.moonDegrees ?? moonDeg;
    const lunarBetaDeg = orbitalData?.lunarPos?.beta ?? 0;
    const lunarLambdaRad = toRadians(lunarLambdaDeg);
    const lunarBetaRad = toRadians(lunarBetaDeg);

    // Lunar position in 3D (Ecliptic frame -> Tilted Ecliptic frame)
    const moonEclX = sphereR * Math.cos(lunarBetaRad) * Math.cos(lunarLambdaRad);
    const moonEclY = sphereR * Math.sin(lunarBetaRad);
    const moonEclZ = sphereR * Math.cos(lunarBetaRad) * Math.sin(lunarLambdaRad);

    const moonX1 = moonEclX;
    const moonY1 = moonEclY * Math.cos(radTilt) - moonEclZ * Math.sin(radTilt);
    const moonZ1 = moonEclY * Math.sin(radTilt) + moonEclZ * Math.cos(radTilt);

    const pMoon = project3D(moonX1, moonY1, moonZ1, pitch, yaw, scale, cx, cy);

    // 5. Dynamic Eclipse Node Markers (Ascending & Descending on Ecliptic plane)
    const nodeAscX0 = sphereR * Math.cos(nodeLonRad);
    const nodeAscZ0 = sphereR * Math.sin(nodeLonRad);
    const nodeAscY1 = -nodeAscZ0 * Math.sin(radTilt);
    const nodeAscZ1 = nodeAscZ0 * Math.cos(radTilt);

    const pNodeAsc = project3D(nodeAscX0, nodeAscY1, nodeAscZ1, pitch, yaw, scale, cx, cy);
    const pNodeDesc = project3D(-nodeAscX0, -nodeAscY1, -nodeAscZ1, pitch, yaw, scale, cx, cy);

    // 6. Dynamic Moon Orbit Ring (Tilted 5.14° to Ecliptic, pivoting at Ascending Node)
    const moonOrbitPoints: { px: number; py: number; z: number }[] = [];
    const moonOrbitSteps = 72;
    const incRad = toRadians(5.14);

    for (let i = 0; i <= moonOrbitSteps; i++) {
      const u = (i / moonOrbitSteps) * 2 * Math.PI; // Argument of latitude
      const xOrb = sphereR * Math.cos(u);
      const yOrb = sphereR * Math.sin(u) * Math.sin(incRad);
      const zOrb = sphereR * Math.sin(u) * Math.cos(incRad);

      // Rotate in ecliptic plane by node longitude
      const xEcl = xOrb * Math.cos(nodeLonRad) - zOrb * Math.sin(nodeLonRad);
      const yEcl = yOrb;
      const zEcl = xOrb * Math.sin(nodeLonRad) + zOrb * Math.cos(nodeLonRad);

      // Tilt around X-axis by ecliptic obliquity (23.44°)
      const x3D = xEcl;
      const y3D = yEcl * Math.cos(radTilt) - zEcl * Math.sin(radTilt);
      const z3D = yEcl * Math.sin(radTilt) + zEcl * Math.cos(radTilt);

      moonOrbitPoints.push(project3D(x3D, y3D, z3D, pitch, yaw, scale, cx, cy));
    }

    let moonOrbitPathD = `M ${moonOrbitPoints[0].px.toFixed(1)} ${moonOrbitPoints[0].py.toFixed(1)}`;
    for (let i = 1; i < moonOrbitPoints.length; i++) {
      moonOrbitPathD += ` L ${moonOrbitPoints[i].px.toFixed(1)} ${moonOrbitPoints[i].py.toFixed(1)}`;
    }

    return {
      pNorth, pSouth, pObsEarth, pZenithVault,
      pSun, pMoon, pNodeAsc, pNodeDesc,
      moonOrbitPathD
    };
  }, [latitude, longitude, timeOfDay, declination, moonDeg, solarData, orbitalData]);

  return (
    <g>
      {/* Outer Celestial Vault Grid */}
      <circle cx="200" cy="160" r="110" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

      {/* 1. Celestial Equator Ring (0° Tilt) */}
      {renderCircle3D(110, 0, 0, "#818cf8", 1.5, "4 2", 0.6)}

      {/* 2. Ecliptic Ring (23.44° Tilt) */}
      {renderCircle3D(110, 23.44, 0, "#f59e0b", 2.0, "", 0.85)}

      {/* 3. Dynamic Moon Orbit Ring (5.14° Inclination pivoting at Ascending Node) */}
      <path 
        d={geocentricScene.moonOrbitPathD} 
        fill="none" 
        stroke="#34d399" 
        strokeWidth="1.8" 
        strokeOpacity="0.85" 
      />

      {/* 4. Center Earth Globe */}
      <circle cx="200" cy="160" r="32" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Earth Rotational Axis (23.44°) */}
      <line 
        x1={geocentricScene.pNorth.px} y1={geocentricScene.pNorth.py} 
        x2={geocentricScene.pSouth.px} y2={geocentricScene.pSouth.py} 
        stroke="#60a5fa" strokeWidth="2" strokeDasharray="3 2" 
      />

      {/* 5. Observer Location & Zenith Laser Ray */}
      {/* Observer Surface Marker */}
      <circle 
        cx={geocentricScene.pObsEarth.px} cy={geocentricScene.pObsEarth.py} 
        r="4" fill="#06b6d4" stroke="white" strokeWidth="1.5" className="drop-shadow" 
      />
      {/* Observer Zenith Laser Line extending to Celestial Sphere */}
      <line 
        x1={geocentricScene.pObsEarth.px} y1={geocentricScene.pObsEarth.py} 
        x2={geocentricScene.pZenithVault.px} y2={geocentricScene.pZenithVault.py} 
        stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" 
      />
      <circle 
        cx={geocentricScene.pZenithVault.px} cy={geocentricScene.pZenithVault.py} 
        r="5" fill="#06b6d4" stroke="white" strokeWidth="1.5" className="animate-pulse" 
      />
      <text 
        x={geocentricScene.pZenithVault.px + 8} y={geocentricScene.pZenithVault.py + 4} 
        className="text-[9px] font-mono font-bold fill-cyan-300"
      >
        YOU (Zenith)
      </text>

      {/* 6. Sun Body on Ecliptic */}
      <circle 
        cx={geocentricScene.pSun.px} cy={geocentricScene.pSun.py} 
        r="8" fill={CONFIG.THEME.SUN_FILL} stroke="white" strokeWidth="2" className="drop-shadow" 
      />
      <text 
        x={geocentricScene.pSun.px + 10} y={geocentricScene.pSun.py + 3} 
        className="text-[9px] font-mono font-bold fill-amber-300"
      >
        SUN
      </text>

      {/* 7. Moon Body on Inclined Orbit */}
      <circle 
        cx={geocentricScene.pMoon.px} cy={geocentricScene.pMoon.py} 
        r="6" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" className="drop-shadow" 
      />
      <text 
        x={geocentricScene.pMoon.px + 8} y={geocentricScene.pMoon.py + 3} 
        className="text-[9px] font-mono font-bold fill-emerald-300"
      >
        MOON
      </text>

      {/* 8. Eclipse Nodes Highlights (Ascending & Descending Node Markers) */}
      <g transform={`translate(${geocentricScene.pNodeAsc.px}, ${geocentricScene.pNodeAsc.py})`}>
        <circle r="7" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />
        <circle r="4" fill="#f43f5e" stroke="white" strokeWidth="1" />
        <text x="8" y="-4" className="text-[8px] font-mono font-bold fill-rose-400">
          Node ☊ (Ascending)
        </text>
      </g>

      <g transform={`translate(${geocentricScene.pNodeDesc.px}, ${geocentricScene.pNodeDesc.py})`}>
        <circle r="7" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />
        <circle r="4" fill="#f43f5e" stroke="white" strokeWidth="1" />
        <text x="-70" y="12" className="text-[8px] font-mono font-bold fill-rose-400">
          Node ☋ (Descending)
        </text>
      </g>
    </g>
  );
};
