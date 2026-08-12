import React, { useState, useMemo } from 'react';
import { Compass, Globe, Sun, Moon, Sparkles, Eye, Layers, ArrowUpRight } from 'lucide-react';
import { toRadians, toDegrees, CONFIG } from '../../utils/cosmicMath';

// Orthographic 3D Projection Helper
const project3D = (x, y, z, pitch = 22, yaw = -35, scale = 1.0, cx = 200, cy = 160) => {
  const radP = toRadians(pitch);
  const radY = toRadians(yaw);

  // Rotate around Y axis (Yaw)
  const x1 = x * Math.cos(radY) + z * Math.sin(radY);
  const z1 = -x * Math.sin(radY) + z * Math.cos(radY);

  // Rotate around X axis (Pitch)
  const y2 = y * Math.cos(radP) - z1 * Math.sin(radP);
  const z2 = y * Math.sin(radP) + z1 * Math.cos(radP);

  return {
    px: cx + x1 * scale,
    py: cy - y2 * scale,
    z: z2
  };
};

export const CelestialSphereView = ({ 
  latitude = 47.06, 
  longitude = -122.81, 
  solarData, 
  orbitalData, 
  timeOfDay = 12 
}) => {
  const [viewMode, setViewMode] = useState('geocentric'); // 'geocentric' | 'heliocentric'

  const declination = solarData ? solarData.declination : 0;
  const moonDeg = orbitalData && orbitalData.angles ? orbitalData.angles.moonDegrees : 0;

  // Render 3D Circle/Ellipse Path
  const renderCircle3D = (radius, tiltXDeg, rotateYDeg, color, strokeWidth = 1.5, strokeDash = "", opacity = 0.8, pitch = 22, yaw = -35, scale = 1.0, cx = 200, cy = 160) => {
    const points = [];
    const steps = 72;
    const radTilt = toRadians(tiltXDeg);
    const radRotY = toRadians(rotateYDeg);

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      // Circle in 3D plane
      let x0 = radius * Math.cos(theta);
      let y0 = 0;
      let z0 = radius * Math.sin(theta);

      // Tilt around X axis
      let y1 = y0 * Math.cos(radTilt) - z0 * Math.sin(radTilt);
      let z1 = y0 * Math.sin(radTilt) + z0 * Math.cos(radTilt);

      // Rotate around Y axis
      let x2 = x0 * Math.cos(radRotY) + z1 * Math.sin(radRotY);
      let z2 = -x0 * Math.sin(radRotY) + z1 * Math.cos(radRotY);

      const proj = project3D(x2, y1, z2, pitch, yaw, scale, cx, cy);
      points.push(proj);
    }

    let pathD = `M ${points[0].px.toFixed(1)} ${points[0].py.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].px.toFixed(1)} ${points[i].py.toFixed(1)}`;
    }

    return (
      <path 
        d={pathD} 
        fill="none" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeDasharray={strokeDash} 
        strokeOpacity={opacity} 
      />
    );
  };

  // Calculations for Geocentric Mode
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

    // 3. Sun Position on Ecliptic Ring (tilted 23.44°)
    const sunLonRad = toRadians((12 - timeOfDay) * 15 + declination);
    const sunX0 = sphereR * Math.cos(sunLonRad);
    const sunZ0 = sphereR * Math.sin(sunLonRad);
    const sunY1 = -sunZ0 * Math.sin(radTilt);
    const sunZ1 = sunZ0 * Math.cos(radTilt);

    const pSun = project3D(sunX0, sunY1, sunZ1, pitch, yaw, scale, cx, cy);

    // 4. Moon Position on Tilted Moon Orbit (tilted 5.14° to Ecliptic)
    const moonRad = toRadians(moonDeg);
    const moonIncRad = toRadians(5.14);
    const moonX0 = sphereR * Math.cos(moonRad);
    const moonZ0 = sphereR * Math.sin(moonRad);
    const moonY1 = -moonZ0 * Math.sin(moonIncRad + radTilt);
    const moonZ1 = moonZ0 * Math.cos(moonIncRad + radTilt);

    const pMoon = project3D(moonX0, moonY1, moonZ1, pitch, yaw, scale, cx, cy);

    // 5. Eclipse Node Markers (Ascending & Descending Nodes where Moon Orbit crosses Ecliptic)
    const nodeAsc3D = { x: sphereR, y: 0, z: 0 };
    const nodeDesc3D = { x: -sphereR, y: 0, z: 0 };

    const pNodeAsc = project3D(nodeAsc3D.x, nodeAsc3D.y, nodeAsc3D.z, pitch, yaw, scale, cx, cy);
    const pNodeDesc = project3D(nodeDesc3D.x, nodeDesc3D.y, nodeDesc3D.z, pitch, yaw, scale, cx, cy);

    // Check if Moon is near Node (Eclipse Proximity)
    const moonDistToNode = Math.min(
      Math.abs((moonDeg % 180)),
      Math.abs(180 - (moonDeg % 180))
    );
    const isNearEclipseNode = moonDistToNode < 15;

    return {
      pNorth, pSouth, pObsEarth, pZenithVault,
      pSun, pMoon, pNodeAsc, pNodeDesc,
      isNearEclipseNode, pitch, yaw, scale, cx, cy, sphereR, earthR
    };
  }, [latitude, longitude, timeOfDay, declination, moonDeg]);

  // Calculations for Heliocentric Mode
  const heliocentricScene = useMemo(() => {
    const pitch = 24;
    const yaw = -30;
    const scale = 1.0;
    const cx = 200;
    const cy = 160;
    const orbitR = 120;

    // Earth Position on Heliocentric Orbit (based on orbital date / days since epoch)
    const daysSinceEpoch = solarData ? solarData.daysSinceEpoch : 0;
    const dayOfYear = ((daysSinceEpoch % 365.25) + 365.25) % 365.25;
    const earthOrbitRad = toRadians(((dayOfYear - 79) / 365.25) * 360);
    const earthX = orbitR * Math.cos(earthOrbitRad);
    const earthZ = orbitR * Math.sin(earthOrbitRad);

    const pSunCenter = project3D(0, 0, 0, pitch, yaw, scale, cx, cy);
    const pEarthCenter = project3D(earthX, 0, earthZ, pitch, yaw, scale, cx, cy);

    // Moon Orbit around Earth (Radius 24px)
    const moonLocalR = 24;
    const moonRad = toRadians(moonDeg);
    const moonLocalX = earthX + moonLocalR * Math.cos(earthOrbitRad + moonRad);
    const moonLocalZ = earthZ + moonLocalR * Math.sin(earthOrbitRad + moonRad);
    const pMoonHelioc = project3D(moonLocalX, 0, moonLocalZ, pitch, yaw, scale, cx, cy);

    // Solstice & Equinox Markers along Earth Orbit Ring
    const solSummer = project3D(0, 0, orbitR, pitch, yaw, scale, cx, cy);
    const solWinter = project3D(0, 0, -orbitR, pitch, yaw, scale, cx, cy);
    const eqSpring = project3D(orbitR, 0, 0, pitch, yaw, scale, cx, cy);
    const eqAutumn = project3D(-orbitR, 0, 0, pitch, yaw, scale, cx, cy);

    return {
      pSunCenter, pEarthCenter, pMoonHelioc,
      solSummer, solWinter, eqSpring, eqAutumn,
      pitch, yaw, scale, cx, cy, orbitR
    };
  }, [solarData, timeOfDay, moonDeg]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 p-4 md:p-6 h-full flex flex-col justify-between select-none">
      
      {/* Top Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-blue-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" /> Celestial Sphere & Ecliptic Orbital View
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatial geometry of Earth's axial tilt ($23.44^\circ$) & Lunar inclination ($5.14^\circ$)
          </p>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('geocentric')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'geocentric'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Geocentric (Sky Vault)
          </button>
          <button
            onClick={() => setViewMode('heliocentric')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'heliocentric'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Heliocentric (Space)
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div className="relative w-full flex-1 min-h-[300px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        
        {/* Legend Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" /> Celestial Equator (0°)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Ecliptic Plane (23.44°)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Moon Orbit (5.14° Tilt)
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Observer Zenith Ray
          </div>
        </div>

        {/* Eclipse Proximity Alert */}
        {geocentricScene.isNearEclipseNode && (
          <div className="absolute top-3 right-3 bg-amber-950/90 border border-amber-600 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 animate-pulse z-10">
            <Sparkles className="w-4 h-4 text-amber-400" /> Near Eclipse Node Zone (Alignment!)
          </div>
        )}

        <svg viewBox="0 0 400 320" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          
          {/* ==========================================
              GEOCENTRIC MODE (EARTH AT CENTER)
             ========================================== */}
          {viewMode === 'geocentric' && (
            <g>
              {/* Outer Celestial Vault Grid */}
              <circle cx="200" cy="160" r="110" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* 1. Celestial Equator Ring (0° Tilt) */}
              {renderCircle3D(110, 0, 0, "#818cf8", 1.5, "4 2", 0.6)}

              {/* 2. Ecliptic Ring (23.44° Tilt) */}
              {renderCircle3D(110, 23.44, 0, "#f59e0b", 2.0, "", 0.85)}

              {/* 3. Moon Orbit Ring (5.14° Inclination relative to Ecliptic) */}
              {renderCircle3D(110, 28.58, 0, "#34d399", 1.8, "", 0.8)}

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
          )}

          {/* ==========================================
              HELIOCENTRIC MODE (SUN AT CENTER)
             ========================================== */}
          {viewMode === 'heliocentric' && (
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
          )}

        </svg>
      </div>

      {/* Footer Spatial Context Readout */}
      <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Observer Zenith: <strong className="text-cyan-400">{latitude.toFixed(1)}°N, {longitude.toFixed(1)}°W</strong></span>
        <span>Axial Tilt: <strong className="text-amber-400">23.44°</strong></span>
        <span>Lunar Tilt: <strong className="text-emerald-400">5.14°</strong></span>
      </div>
    </div>
  );
};

export default CelestialSphereView;
