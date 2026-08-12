import React from 'react';
import { CONFIG, toRadians } from '../../utils/cosmicMath';

export const LivingMarble = ({ declination, timeOfDay, longitude, radius = 45 }) => {
  // 1. Calculate Sun's Position relative to the User
  const sunLon = (12 - timeOfDay) * 15;
  const relSunAngle = sunLon - longitude;
  
  let phaseAngle = relSunAngle % 360;
  if (phaseAngle < 0) phaseAngle += 360;

  // 2. Grid Lines (Longitude)
  const gridLines = [];
  for (let l = -180; l < 360; l += 30) {
    const rad = toRadians(l - longitude);
    const x = radius * Math.sin(rad);
    const isVisible = Math.cos(rad) > 0;
    
    if (isVisible) {
      gridLines.push(
        <ellipse 
          key={l} 
          cx="0" cy="0" 
          rx={Math.abs(x)} ry={radius} 
          fill="none" 
          stroke={CONFIG.THEME.ACCENT} 
          strokeWidth="0.5" 
          opacity="0.3" 
        />
      );
    }
  }

  // Helper to generate a terminator arc path for a given solar altitude offset angle
  const getTerminatorPath = (angleOffset = 0) => {
    const adjustedAngle = (phaseAngle + angleOffset + 360) % 360;
    const theta = toRadians(adjustedAngle); 
    const px = -radius * Math.cos(theta); 
    const isRightLit = adjustedAngle > 0 && adjustedAngle < 180;
    const isFront = adjustedAngle < 90 || adjustedAngle > 270;
    
    let path = `M 0 -${radius} `;
    path += `A ${Math.max(0.01, Math.abs(px))} ${radius} 0 0 ${isFront === isRightLit ? 1 : 0} 0 ${radius} `;
    path += `A ${radius} ${radius} 0 0 ${isRightLit ? 1 : 0} 0 -${radius}`;
    return path;
  };

  const dayPath = getTerminatorPath(0);
  const civilPath = getTerminatorPath(-6);
  const nauticalPath = getTerminatorPath(-12);
  const astroPath = getTerminatorPath(-18);

  return (
    <g>
      <defs>
        <clipPath id="earthClip">
          <circle r={radius} />
        </clipPath>
      </defs>
      
      {/* Base: Night Ocean */}
      <circle r={radius} fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
      
      {/* Grid Lines (Always Visible, faint) */}
      <g clipPath="url(#earthClip)">
         {gridLines}
         <line x1={-radius} y1="0" x2={radius} y2="0" stroke={CONFIG.THEME.ACCENT} strokeWidth="1" opacity="0.5" />
      </g>
      
      {/* Multi-tiered Twilight Light Overlays */}
      <g transform={`rotate(${-declination})`} clipPath="url(#earthClip)">
         {/* Astronomical Twilight Band */}
         <path d={astroPath} fill="#334155" fillOpacity="0.4" stroke="none" />
         
         {/* Nautical Twilight Band */}
         <path d={nauticalPath} fill="#64748b" fillOpacity="0.35" stroke="none" />

         {/* Civil Twilight Band */}
         <path d={civilPath} fill="#fbbf24" fillOpacity="0.25" stroke="none" />

         {/* Daylight Band */}
         <path d={dayPath} fill="#fde047" fillOpacity="0.45" stroke="none" />
         
         {/* Day Limb Rim */}
         <path d={dayPath} fill="none" stroke="#fef08a" strokeWidth="1" strokeOpacity="0.7" />
      </g>

      {/* Gloss / Atmosphere (Static Overlay) */}
      <circle r={radius} fill="url(#atmosGradient)" style={{ mixBlendMode: 'screen' }} opacity="0.35" pointerEvents="none" />
      <defs>
        <radialGradient id="atmosGradient">
          <stop offset="80%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor={CONFIG.THEME.ACCENT} stopOpacity="0.6" />
        </radialGradient>
      </defs>
    </g>
  );
};

export default LivingMarble;
