/**
 * @file polarDialGeometry.ts
 * Geometric SVG sector path calculation for daylight/twilight wedges in PolarSunlightDial.
 */

/**
 * Generates an SVG path string for daylight/twilight sector wedges in SunClock.
 * @param duration - Sector duration in decimal hours
 * @param center - SVG canvas center coordinate in pixels
 * @param radius - Sector arc radius in pixels
 * @returns SVG path `d` attribute string
 */
export const getSectorPath = (duration: number, center: number, radius: number): string => {
  if (duration <= 0) return "";
  if (duration >= 24) {
    return `M ${center},${center - radius} A ${radius},${radius} 0 1,1 ${center},${center + radius} A ${radius},${radius} 0 1,1 ${center},${center - radius}`;
  }
  
  const half = duration / 2;
  const startAngle = (12 - half - 12) * 15 - 90;
  const endAngle = (12 + half - 12) * 15 - 90;
  
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  
  const x1 = center + radius * Math.cos(startRad);
  const y1 = center + radius * Math.sin(startRad);
  const x2 = center + radius * Math.cos(endRad);
  const y2 = center + radius * Math.sin(endRad);
  
  const largeArcFlag = duration > 12 ? 1 : 0;
  return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};
