/**
 * Cosmic Engine V2.0 — Pure Mathematical Projection & Geometry Domain
 * 
 * Implements IAU standard 23.44° Earth obliquity projections, observer pin coordinates,
 * and 4-quadrant orbital loop path generators for side-on and axial sightline eclipse viewers.
 */

export interface EarthSideGeometry {
  earthR: number;
  poleLineX: number;
  poleLineY: number;
  eqX1: number;
  eqY1: number;
  eqX2: number;
  eqY2: number;
  obsPx: number;
  obsPy: number;
  isDaylight: boolean;
}

/**
 * Computes Earth's projected axial tilt, equator chord endpoints, and observer pin for side-on ecliptic views (Sun on left at -X).
 * @param earthCenterX - SVG center X of Earth
 * @param earthCenterY - SVG center Y of Earth
 * @param earthRadius - Earth sphere radius in SVG pixels
 * @param sunLambdaDeg - Solar ecliptic longitude (0° at March Equinox, 90° at June Solstice)
 * @param latitude - Observer geographic latitude (-90° to +90°)
 * @param timeOfDay - Observer local mean solar time (0 to 24 hours)
 * @returns Side geometry metrics and observer coordinates
 */
export function calculateEarthSideGeometry(
  earthCenterX: number,
  earthCenterY: number,
  earthRadius: number,
  sunLambdaDeg: number,
  latitude: number,
  timeOfDay: number,
  longitude: number = 0
): EarthSideGeometry {
  const epsRad = (23.439281 * Math.PI) / 180;
  const sunLambdaRad = (sunLambdaDeg * Math.PI) / 180;

  // Projected tilt in side-on view (Sun on left at -X, Earth at center):
  const thetaSide = epsRad * Math.sin(sunLambdaRad); // rad

  // Unit vectors:
  const nx = -Math.sin(thetaSide);
  const ny = Math.cos(thetaSide);
  const ux = Math.cos(thetaSide);
  const uy = Math.sin(thetaSide);

  // Polar axis endpoints (flush to planetary limb):
  const poleLineX = nx * earthRadius;
  const poleLineY = ny * earthRadius;

  // Front equator chord endpoints:
  const eqX1 = earthCenterX - earthRadius * ux;
  const eqY1 = earthCenterY + earthRadius * uy;
  const eqX2 = earthCenterX + earthRadius * ux;
  const eqY2 = earthCenterY - earthRadius * uy;

  // Observer Location Pin (incorporating geographic longitude offset):
  const latRad = (latitude * Math.PI) / 180;
  const localHourAngleDeg = ((timeOfDay - 12) * 15) + longitude;
  const hRad = (localHourAngleDeg * Math.PI) / 180;

  const xBody = -Math.cos(latRad) * Math.cos(hRad); // negative towards Sun on left
  const yBody = Math.sin(latRad);

  const xProj = xBody * Math.cos(thetaSide) - yBody * Math.sin(thetaSide);
  const yProj = xBody * Math.sin(thetaSide) + yBody * Math.cos(thetaSide);

  const obsPx = earthCenterX + earthRadius * xProj;
  const obsPy = earthCenterY - earthRadius * yProj;
  const isDaylight = xBody < 0; // facing Sun on left

  return {
    earthR: earthRadius,
    poleLineX,
    poleLineY,
    eqX1,
    eqY1,
    eqX2,
    eqY2,
    obsPx,
    obsPy,
    isDaylight
  };
}

export interface EarthAxialGeometry {
  earthR: number;
  poleLineX: number;
  poleLineY: number;
  equatorPathD: string;
  obsPx: number;
  obsPy: number;
  isDaylight: boolean;
}

/**
 * Computes Earth's 3D projected axial tilt, 16-point equator arc, and observer pin along the Sun-Earth axial sightline.
 * @param centerX - SVG center X of Earth
 * @param centerY - SVG center Y of Earth
 * @param earthRadius - Earth sphere radius in SVG pixels
 * @param sunLambdaDeg - Solar ecliptic longitude (0° at March Equinox, 90° at June Solstice)
 * @param latitude - Observer geographic latitude (-90° to +90°)
 * @param timeOfDay - Observer local mean solar time (0 to 24 hours)
 * @returns Axial geometry metrics, equator curve path string, and observer coordinates
 */
export function calculateEarthAxialGeometry(
  centerX: number,
  centerY: number,
  earthRadius: number,
  sunLambdaDeg: number,
  latitude: number,
  timeOfDay: number,
  longitude: number = 0
): EarthAxialGeometry {
  const earthR = earthRadius;
  const epsRad = (23.439281 * Math.PI) / 180; // Earth obliquity 23.44°
  const sunLambdaRad = (sunLambdaDeg * Math.PI) / 180;

  // Unit vectors in screen projection (Z facing viewer along Sun->Earth sightline):
  const nx = -Math.sin(epsRad) * Math.cos(sunLambdaRad);
  const ny = Math.cos(epsRad);
  const nz = -Math.sin(epsRad) * Math.sin(sunLambdaRad);

  // Length of projected axis on screen
  const nScreenLen = Math.sqrt(nx * nx + ny * ny);
  const ux = ny / nScreenLen;
  const uy = -nx / nScreenLen;
  const uz = 0;

  // Orthogonal vector in equatorial plane
  const vx = (nx * nz) / nScreenLen;
  const vy = (ny * nz) / nScreenLen;
  const vz = -nScreenLen;

  // Polar Axis line segment endpoints on screen (flush to planetary limb):
  const poleLineX = (nx / nScreenLen) * earthR;
  const poleLineY = (ny / nScreenLen) * earthR;

  // Front equator chord curve (16 sample points along front hemisphere)
  const eqPts: string[] = [];
  const eqSteps = 16;
  for (let i = 0; i <= eqSteps; i++) {
    const theta = (i / eqSteps) * Math.PI; // 0 to PI along front equator
    const ex = earthR * (Math.cos(theta) * ux - Math.sin(theta) * vx);
    const ey = earthR * (Math.cos(theta) * uy - Math.sin(theta) * vy);
    const px = centerX + ex;
    const py = centerY - ey;
    eqPts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const equatorPathD = eqPts.join(' ');

  // Observer Location Pin (incorporating geographic longitude offset)
  const latRad = (latitude * Math.PI) / 180;
  const localHourAngleDeg = ((timeOfDay - 12) * 15) + longitude;
  const hRad = (localHourAngleDeg * Math.PI) / 180;

  const xBody = Math.cos(latRad) * Math.sin(hRad);
  const yBody = Math.sin(latRad);
  const zBody = Math.cos(latRad) * Math.cos(hRad); // >0 = daylight facing Sun, <0 = night

  // Transform body coordinates to screen:
  const obsEx = earthR * (xBody * ux + yBody * nx + zBody * (-vx));
  const obsEy = earthR * (xBody * uy + yBody * ny + zBody * (-vy));
  const obsEz = earthR * (xBody * uz + yBody * nz + zBody * (-vz));

  const obsPx = centerX + obsEx;
  const obsPy = centerY - obsEy;
  const isDaylight = obsEz >= 0;

  return {
    earthR,
    poleLineX,
    poleLineY,
    equatorPathD,
    obsPx,
    obsPy,
    isDaylight
  };
}

export interface OrbitalSegments {
  waxAsc: string[];
  waxDesc: string[];
  wanAsc: string[];
  wanDesc: string[];
}

/**
 * Generates 4-quadrant segmented SVG path arrays for Waxing/Waning x Ascending/Descending 2D stroke styling.
 * @param centerX - SVG center X
 * @param centerY - SVG center Y
 * @param rx - Horizontal semi-major radius
 * @param scalePxPerDeg - Vertical pixel scale per degree of ecliptic latitude
 * @param nodeAngleRad - Annual seasonal node alignment angle in radians
 * @param projection - 'side' for transverse ecliptic profile or 'axial' for down-the-barrel sightline
 * @param steps - Number of subdivision segments (default: 72)
 * @returns Object with segmented path string arrays
 */
export function generateOrbitalSegments(
  centerX: number,
  centerY: number,
  rx: number,
  scalePxPerDeg: number = 8.5,
  nodeAngleRad: number = 0,
  projection: 'side' | 'axial' = 'side',
  steps: number = 72
): OrbitalSegments {
  const waxAsc: string[] = [];
  const waxDesc: string[] = [];
  const wanAsc: string[] = [];
  const wanDesc: string[] = [];

  for (let i = 0; i < steps; i++) {
    const t1 = (i / steps) * 2 * Math.PI;
    const t2 = ((i + 1) / steps) * 2 * Math.PI;

    let x1: number, y1: number, x2: number, y2: number;
    if (projection === 'side') {
      x1 = centerX - Math.cos(t1) * rx;
      y1 = centerY - Math.sin(t1 + nodeAngleRad) * 5.145 * scalePxPerDeg;
      x2 = centerX - Math.cos(t2) * rx;
      y2 = centerY - Math.sin(t2 + nodeAngleRad) * 5.145 * scalePxPerDeg;
    } else {
      x1 = centerX + Math.sin(t1) * rx;
      y1 = centerY - Math.sin(t1 + nodeAngleRad) * 5.145 * scalePxPerDeg;
      x2 = centerX + Math.sin(t2) * rx;
      y2 = centerY - Math.sin(t2 + nodeAngleRad) * 5.145 * scalePxPerDeg;
    }

    const midT = (t1 + t2) / 2;
    const midBeta = Math.sin(midT + nodeAngleRad) * 5.145;
    const isWax = midT <= Math.PI;
    const isAsc = midBeta >= 0;

    const seg = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (isWax) {
      if (isAsc) waxAsc.push(seg);
      else waxDesc.push(seg);
    } else {
      if (isAsc) wanAsc.push(seg);
      else wanDesc.push(seg);
    }
  }

  return { waxAsc, waxDesc, wanAsc, wanDesc };
}
