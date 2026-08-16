import React, { useMemo } from 'react';
import { CONFIG, toRadians } from '../../utils/cosmicMath';

export interface LivingMarbleProps {
  declination: number;
  timeOfDay: number;
  longitude: number;
  radius?: number;
}

export const LivingMarble: React.FC<LivingMarbleProps> = ({ 
  declination, 
  timeOfDay, 
  longitude, 
  radius = 45 
}) => {
  // 1. Calculate Sun's Position relative to the Observer
  const sunLon = (12 - timeOfDay) * 15;
  const relSunLon = sunLon - longitude;
  
  const decRad = toRadians(declination);
  const relLonRad = toRadians(relSunLon);

  // Unit vector towards Sun in observer sphere coordinates:
  // sx: East (+X), sy: North (+Y in 3D, maps to -Y in SVG), sz: Towards observer (+Z)
  const sx = Math.cos(decRad) * Math.sin(relLonRad);
  const sy = Math.sin(decRad);
  const sz = Math.cos(decRad) * Math.cos(relLonRad);

  // Subsolar point on screen (if visible on front hemisphere)
  const subX = radius * sx;
  const subY = -radius * sy; // -Y is North in SVG
  const isSubsolarVisible = sz >= 0;

  // 2. Build mathematical twilight and daylight paths using 3D orthographic projection
  const generateIlluminationPath = (thresholdDeg: number): string => {
    const h0Rad = toRadians(thresholdDeg);
    const sinH0 = Math.sin(h0Rad);
    const cosH0 = Math.cos(h0Rad);

    // Orthonormal basis (u, v, s) where s is sun vector
    const sLenSq = sx * sx + sy * sy;
    let ux: number, uy: number, uz: number;
    let vx: number, vy: number, vz: number;

    if (sLenSq > 1e-6) {
      const sLen = Math.sqrt(sLenSq);
      ux = -sy / sLen;
      uy = sx / sLen;
      uz = 0;

      vx = -sx * sz / sLen;
      vy = -sy * sz / sLen;
      vz = sLen;
    } else {
      ux = 1; uy = 0; uz = 0;
      vx = 0; vy = 1; vz = 0;
    }

    // Sample the circle of altitude h0 on the sphere (3D points)
    const NUM_SAMPLES = 72;
    const frontPoints: { x: number; y: number; phi: number }[] = [];

    for (let i = 0; i <= NUM_SAMPLES; i++) {
      const phi = (i / NUM_SAMPLES) * 2 * Math.PI;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const px = cosH0 * cosPhi * ux + cosH0 * sinPhi * vx + sinH0 * sx;
      const py = cosH0 * cosPhi * uy + cosH0 * sinPhi * vy + sinH0 * sy;
      const pz = cosH0 * cosPhi * uz + cosH0 * sinPhi * vz + sinH0 * sz;

      if (pz >= 0) {
        frontPoints.push({
          x: radius * px,
          y: -radius * py,
          phi
        });
      }
    }

    // If completely in front (e.g. sun directly overhead in noon summer polar day)
    if (frontPoints.length === NUM_SAMPLES + 1) {
      let d = `M ${frontPoints[0].x.toFixed(2)} ${frontPoints[0].y.toFixed(2)} `;
      for (let i = 1; i < frontPoints.length; i++) {
        d += `L ${frontPoints[i].x.toFixed(2)} ${frontPoints[i].y.toFixed(2)} `;
      }
      d += 'Z';
      return d;
    }

    // If completely behind the globe (polar night or deep night)
    if (frontPoints.length === 0) {
      if (sinH0 < sz) {
        // Entire visible hemisphere is illuminated
        return `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z`;
      }
      return '';
    }

    // If partially on front hemisphere, connect terminator ellipse arc with outer horizon rim arc
    let path = `M ${frontPoints[0].x.toFixed(2)} ${frontPoints[0].y.toFixed(2)} `;
    for (let i = 1; i < frontPoints.length; i++) {
      path += `L ${frontPoints[i].x.toFixed(2)} ${frontPoints[i].y.toFixed(2)} `;
    }

    // Complete the loop along the outer rim between the end and start points
    const endPt = frontPoints[frontPoints.length - 1];
    const startPt = frontPoints[0];
    
    const endAngle = Math.atan2(endPt.y, endPt.x);
    const startAngle = Math.atan2(startPt.y, startPt.x);
    
    let arcSweep = (startAngle - endAngle + 2 * Math.PI) % (2 * Math.PI);
    const largeArc = arcSweep > Math.PI ? 1 : 0;
    
    // Choose arc direction towards the illuminated sun hemisphere
    const midAngle = endAngle + arcSweep / 2;
    const testX = Math.cos(midAngle);
    const testY = -Math.sin(midAngle); // North is +
    const testIllum = testX * sx + testY * sy;

    const sweepFlag = testIllum >= 0 ? 1 : 0;
    path += `A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} Z`;

    return path;
  };

  const astroPath = useMemo(() => generateIlluminationPath(-18), [sx, sy, sz]);
  const nauticalPath = useMemo(() => generateIlluminationPath(-12), [sx, sy, sz]);
  const civilPath = useMemo(() => generateIlluminationPath(-6), [sx, sy, sz]);
  const dayPath = useMemo(() => generateIlluminationPath(0), [sx, sy, sz]);

  // 3. Grid Lines (Longitude meridians)
  const gridLines: React.ReactNode[] = [];
  for (let l = -180; l < 180; l += 30) {
    const rad = toRadians(l - longitude);
    const x = radius * Math.sin(rad);
    const isVisible = Math.cos(rad) > 0;
    
    if (isVisible) {
      gridLines.push(
        <ellipse 
          key={l} 
          cx="0" cy="0" 
          rx={Math.max(0.1, Math.abs(x))} ry={radius} 
          fill="none" 
          stroke={CONFIG.THEME.ACCENT} 
          strokeWidth="0.5" 
          opacity="0.35" 
        />
      );
    }
  }

  return (
    <g>
      <defs>
        <clipPath id="earthClip">
          <circle r={radius} />
        </clipPath>
      </defs>
      
      {/* 1. Base Earth & Night Background */}
      <circle r={radius} fill={CONFIG.THEME.NIGHT_BG} />

      {/* 2. Layered Twilight & Daylight Bands (Clipped to Globe) */}
      <g clipPath="url(#earthClip)">
        {astroPath && <path d={astroPath} fill={CONFIG.THEME.ASTRONOMICAL_FILL} />}
        {nauticalPath && <path d={nauticalPath} fill={CONFIG.THEME.NAUTICAL_FILL} />}
        {civilPath && <path d={civilPath} fill={CONFIG.THEME.CIVIL_FILL} />}
        {dayPath && <path d={dayPath} fill={CONFIG.THEME.DAY_FILL} />}
      </g>

      {/* 3. Latitudinal Parallels on Globe */}
      {[-66.5, -23.5, 0, 23.5, 66.5].map((lat) => {
        const y = -radius * Math.sin(toRadians(lat));
        const rx = radius * Math.cos(toRadians(lat));
        const isMajor = lat === 0;
        return (
          <line 
            key={lat} 
            x1={-rx} 
            y1={y} 
            x2={rx} 
            y2={y} 
            stroke={isMajor ? "#6366f1" : CONFIG.THEME.ACCENT} 
            strokeWidth={isMajor ? "0.8" : "0.5"} 
            strokeDasharray={isMajor ? undefined : "2 2"}
            opacity={isMajor ? "0.6" : "0.35"} 
          />
        );
      })}

      {/* 4. Longitudinal Meridians */}
      {gridLines}

      {/* 5. Subsolar Point (Golden Sun Marker on Surface) */}
      {isSubsolarVisible && (
        <g transform={`translate(${subX.toFixed(2)}, ${subY.toFixed(2)})`}>
          <circle r="3.5" fill={CONFIG.THEME.SUN_FILL} stroke="#fff" strokeWidth="1" className="animate-pulse" />
          <circle r="1.5" fill="#fff" />
        </g>
      )}

      {/* 6. Outer Globe Border & Specular Rim */}
      <circle r={radius} fill="none" stroke="#475569" strokeWidth="1.5" />
    </g>
  );
};

export default LivingMarble;
