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

  // 2. Build exact, non-tearing twilight and daylight paths using 3D spherical geometry
  const generateIlluminationPath = (thresholdDeg: number): string => {
    const h0Rad = toRadians(thresholdDeg);
    const sinH0 = Math.sin(h0Rad);
    const cosH0 = Math.cos(h0Rad);

    // Magnitude of Sun vector component in the screen plane (X-Y)
    const sPerpSq = sx * sx + sy * sy;
    const sPerp = Math.sqrt(sPerpSq);

    // Handle polar singularity where Sun vector is purely along Z (normal to screen)
    if (sPerp < 1e-6) {
      if (sz >= sinH0) {
        // Entire visible hemisphere is illuminated
        return `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z`;
      }
      // Sun is on the opposite side of Earth facing directly away; entire front is dark
      return '';
    }

    // Orthonormal basis (u, v, s) where u is in screen plane, v has positive Z component
    const ux = -sy / sPerp;
    const uy = sx / sPerp;
    const uz = 0;

    const vx = -sx * sz / sPerp;
    const vy = -sy * sz / sPerp;
    const vz = sPerp;

    // The condition for a point on the circle of altitude h0 to be visible on front hemisphere is:
    // pz(phi) = cosH0 * vz * sin(phi) + sinH0 * sz >= 0
    // => sin(phi) >= -(sinH0 * sz) / (cosH0 * sPerp) = mu
    const denom = cosH0 * sPerp;
    const mu = -(sinH0 * sz) / denom;

    // Case A: mu >= 1 => sin(phi) >= mu is impossible (terminator is entirely on backside)
    if (mu >= 1) {
      if (sz >= sinH0) {
        // Entire visible hemisphere is illuminated
        return `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z`;
      }
      return '';
    }

    // Case B: mu <= -1 => sin(phi) >= mu is true for all phi (terminator circle is entirely on front hemisphere)
    if (mu <= -1) {
      const NUM_SAMPLES = 72;
      const ellipsePoints: { x: number; y: number }[] = [];

      for (let i = 0; i <= NUM_SAMPLES; i++) {
        const phi = (i / NUM_SAMPLES) * 2 * Math.PI;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const px = cosH0 * cosPhi * ux + cosH0 * sinPhi * vx + sinH0 * sx;
        const py = cosH0 * cosPhi * uy + cosH0 * sinPhi * vy + sinH0 * sy;
        ellipsePoints.push({
          x: radius * px,
          y: -radius * py
        });
      }

      if (sz >= 0) {
        // Sun is in front: the interior of the ellipse is illuminated
        let d = `M ${ellipsePoints[0].x.toFixed(2)} ${ellipsePoints[0].y.toFixed(2)} `;
        for (let i = 1; i < ellipsePoints.length; i++) {
          d += `L ${ellipsePoints[i].x.toFixed(2)} ${ellipsePoints[i].y.toFixed(2)} `;
        }
        d += 'Z';
        return d;
      } else {
        // Sun is on the backside (sz < 0): the center of the globe is DARK night.
        // The illuminated twilight area is the outer annular rim between the ellipse cutout and the globe edge (radius R).
        let d = `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z `;
        d += `M ${ellipsePoints[0].x.toFixed(2)} ${ellipsePoints[0].y.toFixed(2)} `;
        for (let i = ellipsePoints.length - 1; i >= 0; i--) {
          d += `L ${ellipsePoints[i].x.toFixed(2)} ${ellipsePoints[i].y.toFixed(2)} `;
        }
        d += 'Z';
        return d;
      }
    }

    // Case C: -1 < mu < 1 => Terminator circle intersects the limb (pz = 0) at exactly two points
    // The continuous front arc is defined on phi in [phiStart, phiEnd]
    const phi0 = Math.asin(mu);
    const phiStart = phi0;
    const phiEnd = Math.PI - phi0;

    const NUM_ARC_SAMPLES = 48;
    const frontArcPoints: { x: number; y: number; px: number; py: number }[] = [];

    for (let i = 0; i <= NUM_ARC_SAMPLES; i++) {
      const phi = phiStart + (i / NUM_ARC_SAMPLES) * (phiEnd - phiStart);
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const px = cosH0 * cosPhi * ux + cosH0 * sinPhi * vx + sinH0 * sx;
      const py = cosH0 * cosPhi * uy + cosH0 * sinPhi * vy + sinH0 * sy;

      frontArcPoints.push({
        x: radius * px,
        y: -radius * py,
        px,
        py
      });
    }

    // End point and Start point on the outer limb (where pz = 0 and px^2 + py^2 = 1)
    const endPt = frontArcPoints[frontArcPoints.length - 1];
    const startPt = frontArcPoints[0];

    // Compute limb angles (in standard math coordinates where py is North)
    const thetaEnd = Math.atan2(endPt.py, endPt.px);
    const thetaStart = Math.atan2(startPt.py, startPt.px);

    // Determine the angular difference connecting thetaEnd to thetaStart
    let deltaTheta = thetaStart - thetaEnd;
    while (deltaTheta <= 0) deltaTheta += 2 * Math.PI;

    // Test the midpoint of the forward rim arc vs the backward rim arc to find illuminated side
    const midTheta1 = thetaEnd + deltaTheta / 2;
    const illum1 = Math.cos(midTheta1) * sx + Math.sin(midTheta1) * sy;

    let rimSweep = deltaTheta;
    if (illum1 < sinH0) {
      // The other arc along the rim is the illuminated one
      rimSweep = deltaTheta - 2 * Math.PI;
    }

    // Build the closed SVG polygon path:
    // 1. Follow front terminator arc from startPt to endPt
    let path = `M ${frontArcPoints[0].x.toFixed(2)} ${frontArcPoints[0].y.toFixed(2)} `;
    for (let i = 1; i < frontArcPoints.length; i++) {
      path += `L ${frontArcPoints[i].x.toFixed(2)} ${frontArcPoints[i].y.toFixed(2)} `;
    }

    // 2. Sample along the outer circular rim from endPt back to startPt
    const NUM_RIM_SAMPLES = 32;
    for (let j = 1; j <= NUM_RIM_SAMPLES; j++) {
      const theta = thetaEnd + (j / NUM_RIM_SAMPLES) * rimSweep;
      const rimX = radius * Math.cos(theta);
      const rimY = -radius * Math.sin(theta);
      path += `L ${rimX.toFixed(2)} ${rimY.toFixed(2)} `;
    }

    path += 'Z';
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
      <g clipPath="url(#earthClip)" fillRule="evenodd">
        {astroPath && <path d={astroPath} fill={CONFIG.THEME.ASTRONOMICAL_FILL} fillRule="evenodd" />}
        {nauticalPath && <path d={nauticalPath} fill={CONFIG.THEME.NAUTICAL_FILL} fillRule="evenodd" />}
        {civilPath && <path d={civilPath} fill={CONFIG.THEME.CIVIL_FILL} fillRule="evenodd" />}
        {dayPath && <path d={dayPath} fill={CONFIG.THEME.DAY_FILL} fillRule="evenodd" />}
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
