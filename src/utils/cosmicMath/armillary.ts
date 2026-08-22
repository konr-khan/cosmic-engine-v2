import { toRadians, toDegrees, clamp } from './core';
import { Degrees, Radians, Latitude, Longitude, HoursDecimal, JulianDate, asDegrees } from '../../types/units';

export type ArmillaryProjectionMode = 'stereographic' | 'rojas' | 'horizon';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface ArmillaryStarData {
  id: string;
  name: string;
  bayer: string;
  constellation: string;
  raDeg: Degrees;
  decDeg: Degrees;
  magnitude: number;
  p3d: Vector3D;
}

export interface ZodiacSignSegment {
  name: string;
  symbol: string;
  startLambda: number;
  endLambda: number;
  color: string;
}

export interface AlmucantarCircleData {
  altitude: Degrees;
  centerY: number;
  radius: number;
  isHorizon: boolean;
}

export interface UnequalHourArcData {
  hourIndex: number;
  label: string;
  points2D: Vector2D[];
}

export interface ArmillaryRingVertex {
  p3d: Vector3D;
  pCam: Vector3D;
  pProj: Vector2D;
  screenPos: Vector2D;
  isFront: boolean;
}

export interface ArmillaryRingPath {
  id: string;
  label: string;
  color: string;
  frontStrokeWidth: number;
  backStrokeWidth: number;
  vertices: ArmillaryRingVertex[];
  frontPathD: string;
  backPathD: string;
  fullPathD: string;
}

export interface ArmillaryModelOutput {
  rings: ArmillaryRingPath[];
  almucantars: AlmucantarCircleData[];
  unequalHours: UnequalHourArcData[];
  stars: (ArmillaryStarData & {
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
    altDeg: number;
    azDeg: number;
  })[];
  sun: {
    raDeg: Degrees;
    decDeg: Degrees;
    lambdaDeg: Degrees;
    p3d: Vector3D;
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
    altDeg: number;
    azDeg: number;
  };
  moon: {
    raDeg: Degrees;
    decDeg: Degrees;
    lambdaDeg: Degrees;
    phase: number;
    p3d: Vector3D;
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
    altDeg: number;
    azDeg: number;
  };
  siderealTimeDeg: Degrees;
  localSiderealTimeDeg: Degrees;
  planetaryHour: {
    hourNumber: number;
    isDay: boolean;
    rulingPlanet: string;
    label: string;
    progressPercent: number;
  };
}

/**
 * 12 Bright Classical Navigational Astrolabe Stars (Epoch J2000.0)
 */
export const ASTROLABE_STARS: Omit<ArmillaryStarData, 'p3d'>[] = [
  { id: 'sirius', name: 'Sirius', bayer: 'α CMa', constellation: 'Canis Major', raDeg: asDegrees(101.287), decDeg: asDegrees(-16.716), magnitude: -1.46 },
  { id: 'vega', name: 'Vega', bayer: 'α Lyr', constellation: 'Lyra', raDeg: asDegrees(279.234), decDeg: asDegrees(38.784), magnitude: 0.03 },
  { id: 'arcturus', name: 'Arcturus', bayer: 'α Boo', constellation: 'Boötes', raDeg: asDegrees(213.915), decDeg: asDegrees(19.182), magnitude: -0.05 },
  { id: 'capella', name: 'Capella', bayer: 'α Aur', constellation: 'Auriga', raDeg: asDegrees(79.172), decDeg: asDegrees(45.998), magnitude: 0.08 },
  { id: 'rigel', name: 'Rigel', bayer: 'β Ori', constellation: 'Orion', raDeg: asDegrees(78.634), decDeg: asDegrees(-8.201), magnitude: 0.13 },
  { id: 'betelgeuse', name: 'Betelgeuse', bayer: 'α Ori', constellation: 'Orion', raDeg: asDegrees(88.793), decDeg: asDegrees(7.407), magnitude: 0.50 },
  { id: 'aldebaran', name: 'Aldebaran', bayer: 'α Tau', constellation: 'Taurus', raDeg: asDegrees(68.980), decDeg: asDegrees(16.509), magnitude: 0.85 },
  { id: 'spica', name: 'Spica', bayer: 'α Vir', constellation: 'Virgo', raDeg: asDegrees(201.298), decDeg: asDegrees(-11.161), magnitude: 0.98 },
  { id: 'antares', name: 'Antares', bayer: 'α Sco', constellation: 'Scorpius', raDeg: asDegrees(247.352), decDeg: asDegrees(-26.432), magnitude: 1.06 },
  { id: 'altair', name: 'Altair', bayer: 'α Aql', constellation: 'Aquila', raDeg: asDegrees(297.696), decDeg: asDegrees(8.868), magnitude: 0.77 },
  { id: 'deneb', name: 'Deneb', bayer: 'α Cyg', constellation: 'Cygnus', raDeg: asDegrees(310.358), decDeg: asDegrees(45.280), magnitude: 1.25 },
  { id: 'fomalhaut', name: 'Fomalhaut', bayer: 'α PsA', constellation: 'Piscis Austrinus', raDeg: asDegrees(344.413), decDeg: asDegrees(-29.622), magnitude: 1.17 }
];

/**
 * 12 Zodiac Constellations on the Ecliptic Rete
 */
export const ZODIAC_SIGNS: ZodiacSignSegment[] = [
  { name: 'Aries', symbol: '♈', startLambda: 0, endLambda: 30, color: '#f87171' },
  { name: 'Taurus', symbol: '♉', startLambda: 30, endLambda: 60, color: '#fb923c' },
  { name: 'Gemini', symbol: '♊', startLambda: 60, endLambda: 90, color: '#facc15' },
  { name: 'Cancer', symbol: '♋', startLambda: 90, endLambda: 120, color: '#4ade80' },
  { name: 'Leo', symbol: '♌', startLambda: 120, endLambda: 150, color: '#2dd4bf' },
  { name: 'Virgo', symbol: '♍', startLambda: 150, endLambda: 180, color: '#38bdf8' },
  { name: 'Libra', symbol: '♎', startLambda: 180, endLambda: 210, color: '#818cf8' },
  { name: 'Scorpio', symbol: '♏', startLambda: 210, endLambda: 240, color: '#c084fc' },
  { name: 'Sagittarius', symbol: '♐', startLambda: 240, endLambda: 270, color: '#f472b6' },
  { name: 'Capricorn', symbol: '♑', startLambda: 270, endLambda: 300, color: '#fb7185' },
  { name: 'Aquarius', symbol: '♒', startLambda: 300, endLambda: 330, color: '#38bdf8' },
  { name: 'Pisces', symbol: '♓', startLambda: 330, endLambda: 360, color: '#a78bfa' }
];

const CHALDEAN_PLANETS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const;

/**
 * Computes Greenwich Mean Sidereal Time (GMST) in degrees [0, 360).
 */
export function calculateGMST(julianDate: JulianDate | number): Degrees {
  const d = julianDate - 2451545.0;
  const gmst = (280.46061837 + 360.98564736629 * d) % 360;
  return asDegrees((gmst + 360) % 360);
}

/**
 * Computes Local Sidereal Time (LST) in degrees [0, 360).
 */
export function calculateLST(julianDate: JulianDate | number, longitude: Longitude): Degrees {
  const gmst = calculateGMST(julianDate);
  const lst = (gmst + longitude + 360) % 360;
  return asDegrees(lst);
}

/**
 * Converts equatorial coordinates (RA, Dec) into 3D Cartesian coordinates on celestial sphere of radius R0.
 * Coordinate frame:
 * +Y: North Celestial Pole
 * -Y: South Celestial Pole
 * +Z: Vernal Equinox (RA = 0°, Dec = 0°)
 * +X: RA = 90°, Dec = 0°
 */
export function equatorialToCartesian3D(raDeg: Degrees | number, decDeg: Degrees | number, r0: number = 100): Vector3D {
  const raRad = toRadians(raDeg);
  const decRad = toRadians(decDeg);
  const cosDec = Math.cos(decRad);

  return {
    x: r0 * cosDec * Math.sin(raRad),
    y: r0 * Math.sin(decRad),
    z: r0 * cosDec * Math.cos(raRad)
  };
}

/**
 * Converts 3D Cartesian equatorial point back into RA and Dec.
 */
export function cartesian3DToEquatorial(p: Vector3D): { raDeg: Degrees; decDeg: Degrees } {
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  if (r < 1e-9) return { raDeg: asDegrees(0), decDeg: asDegrees(0) };

  const decRad = Math.asin(clamp(p.y / r, -1, 1));
  const raRad = Math.atan2(p.x, p.z);
  const raDeg = (toDegrees(raRad) + 360) % 360;

  return {
    raDeg: asDegrees(raDeg),
    decDeg: asDegrees(toDegrees(decRad))
  };
}

/**
 * Converts Alt-Azimuth coordinates to Topocentric 3D Cartesian vector.
 * +Y: Zenith (+90° Alt)
 * +Z: North (Az = 0°)
 * +X: East (Az = 90°)
 */
export function horizontalToCartesian3D(altDeg: Degrees | number, azDeg: Degrees | number, r0: number = 100): Vector3D {
  const altRad = toRadians(altDeg);
  const azRad = toRadians(azDeg);
  const cosAlt = Math.cos(altRad);

  return {
    x: r0 * cosAlt * Math.sin(azRad),
    y: r0 * Math.sin(altRad),
    z: r0 * cosAlt * Math.cos(azRad)
  };
}

/**
 * Computes topocentric Altitude and Azimuth from observer Latitude and Local Hour Angle (H) & Declination.
 */
export function equatorialToHorizontal(
  raDeg: Degrees | number,
  decDeg: Degrees | number,
  latitude: Latitude,
  lstDeg: Degrees | number
): { altDeg: number; azDeg: number } {
  const H = ((lstDeg - raDeg + 360) % 360);
  const hRad = toRadians(H);
  const latRad = toRadians(latitude);
  const decRad = toRadians(decDeg);

  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
  const altRad = Math.asin(clamp(sinAlt, -1, 1));
  const altDeg = toDegrees(altRad);

  const cosAlt = Math.cos(altRad);
  let azDeg = 0;
  if (Math.abs(cosAlt) > 1e-7) {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * cosAlt);
    const sinAz = -Math.cos(decRad) * Math.sin(hRad) / cosAlt;
    const azRad = Math.atan2(sinAz, cosAz);
    azDeg = (toDegrees(azRad) + 360) % 360;
  }

  return { altDeg: parseFloat(altDeg.toFixed(2)), azDeg: parseFloat(azDeg.toFixed(2)) };
}

/**
 * Applies 3D Euler rotations for observer camera (pitch around X, yaw around Y, roll/tilt).
 */
export function rotateEuler3D(p: Vector3D, pitchDeg: number, yawDeg: number, rollDeg: number = 0): Vector3D {
  const pitch = toRadians(pitchDeg);
  const yaw = toRadians(yawDeg);
  const roll = toRadians(rollDeg);

  // 1. Roll around Z
  const cosR = Math.cos(roll);
  const sinR = Math.sin(roll);
  const x1 = p.x * cosR - p.y * sinR;
  const y1 = p.x * sinR + p.y * cosR;
  const z1 = p.z;

  // 2. Yaw around Y
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x2 = x1 * cosY + z1 * sinY;
  const y2 = y1;
  const z2 = -x1 * sinY + z1 * cosY;

  // 3. Pitch around X
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const x3 = x2;
  const y3 = y2 * cosP - z2 * sinP;
  const z3 = y2 * sinP + z2 * cosP;

  return { x: x3, y: y3, z: z3 };
}

/**
 * Stereographic Conformal Projection
 * Projects from South Celestial Pole (0, -R0, 0) onto equatorial plane y = 0.
 * Conformal property: preserves all circles and angles.
 */
export function projectStereographicConformal(p: Vector3D, r0: number = 100): Vector2D {
  const denom = r0 + p.y;
  if (Math.abs(denom) < 1e-6) {
    return { x: p.x * 1000, y: p.z * 1000 };
  }
  const scale = (2 * r0) / denom;
  return {
    x: p.x * (scale / 2),
    y: p.z * (scale / 2)
  };
}

/**
 * Universal Rojas Orthographic Projection
 * Projects orthographically onto the solstitial colure plane (meridian z = 0).
 * Historical property: Declinations map to parallel horizontal chords, hour circles to semi-ellipses.
 */
export function projectRojasOrthographic(p: Vector3D, _r0: number = 100): Vector2D {
  return {
    x: p.x,
    y: p.y
  };
}

/**
 * Topocentric Horizon Stereonet Projection
 * Projected from Nadir (a = -90°) onto the horizon plane (a = 0°).
 * Zenith (a = +90°) is at (0, 0), horizon is a circle of radius R0.
 */
export function projectTopocentricHorizon(altDeg: number, azDeg: number, r0: number = 100): Vector2D {
  const clampedAlt = clamp(altDeg, -89.9, 90);
  const r = r0 * Math.tan(toRadians((90 - clampedAlt) / 2));
  const azRad = toRadians(azDeg);

  return {
    x: r * Math.sin(azRad),
    y: -r * Math.cos(azRad)
  };
}

/**
 * Calculates the analytical stereographic Almucantar (Altitude circle) center and radius for a given latitude.
 */
export function calculateAlmucantarCircle(altDeg: Degrees | number, latitude: Latitude, r0: number = 100): AlmucantarCircleData {
  const latRad = toRadians(latitude);
  const altRad = toRadians(altDeg);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinAlt = Math.sin(altRad);
  const cosAlt = Math.cos(altRad);

  const denom = sinLat + sinAlt;
  if (Math.abs(denom) < 1e-6) {
    return {
      altitude: asDegrees(altDeg),
      centerY: 0,
      radius: r0 * 10,
      isHorizon: Math.abs(altDeg) < 0.1
    };
  }

  const centerY = r0 * (cosLat / denom);
  const radius = Math.abs(r0 * (cosAlt / denom));

  return {
    altitude: asDegrees(altDeg),
    centerY: parseFloat(centerY.toFixed(2)),
    radius: parseFloat(radius.toFixed(2)),
    isHorizon: Math.abs(altDeg) < 0.1
  };
}

/**
 * Generates the set of Almucantar elevation circles (every stepDeg degrees) for the Tympan plate.
 */
export function generateAlmucantars(latitude: Latitude, stepDeg: number = 15, r0: number = 100): AlmucantarCircleData[] {
  const list: AlmucantarCircleData[] = [];
  for (let alt = 0; alt <= 85; alt += stepDeg) {
    list.push(calculateAlmucantarCircle(alt, latitude, r0));
  }
  return list;
}

/**
 * Solves the Historical 12 Unequal (Planetary) Hours and current ruling planet.
 */
export function calculatePlanetaryHour(
  currentTime: HoursDecimal,
  sunrise: HoursDecimal,
  sunset: HoursDecimal,
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ... 6 = Saturday
): { hourNumber: number; isDay: boolean; rulingPlanet: string; label: string; progressPercent: number } {
  let isDay = false;
  let hourNumber = 1;
  let progressPercent = 0;

  // Planetary day rulers (Sun starts Sunday, Moon Monday, Mars Tuesday, Mercury Wednesday, Jupiter Thursday, Venus Friday, Saturn Saturday)
  const DAY_RULERS = [3, 6, 2, 5, 1, 4, 0]; // Index in CHALDEAN_PLANETS: Sun=3, Moon=6, Mars=2, Mercury=5, Jupiter=1, Venus=4, Saturn=0
  const dayRulerIndex = DAY_RULERS[dayOfWeek % 7];

  const dayLength = (sunset - sunrise + 24) % 24 || 12;
  const nightLength = 24 - dayLength;

  if (currentTime >= sunrise && currentTime < sunset) {
    isDay = true;
    const elapsed = currentTime - sunrise;
    const fraction = elapsed / dayLength;
    const hourFraction = fraction * 12;
    hourNumber = Math.min(12, Math.floor(hourFraction) + 1);
    progressPercent = Math.round((hourFraction - Math.floor(hourFraction)) * 100);
  } else {
    isDay = false;
    const elapsed = (currentTime - sunset + 24) % 24;
    const fraction = elapsed / nightLength;
    const hourFraction = fraction * 12;
    hourNumber = Math.min(12, Math.floor(hourFraction) + 1);
    progressPercent = Math.round((hourFraction - Math.floor(hourFraction)) * 100);
  }

  // Chaldean rotation of hours: ruler advances by 1 in Chaldean sequence every unequal hour
  const totalHoursElapsed = isDay ? (hourNumber - 1) : (12 + hourNumber - 1);
  const currentRulerIndex = (dayRulerIndex + totalHoursElapsed) % 7;
  const rulingPlanet = CHALDEAN_PLANETS[currentRulerIndex];

  const ordinalSuffix = hourNumber === 1 ? '1st' : hourNumber === 2 ? '2nd' : hourNumber === 3 ? '3rd' : `${hourNumber}th`;
  const label = `${ordinalSuffix} Hour of ${isDay ? 'Day' : 'Night'} (${rulingPlanet})`;

  return {
    hourNumber,
    isDay,
    rulingPlanet,
    label,
    progressPercent
  };
}

/**
 * Builds standard SVG path strings for front (z >= 0) and back (z < 0) segments.
 */
export function buildSegmentedSvgPaths(vertices: ArmillaryRingVertex[]): { frontPathD: string; backPathD: string; fullPathD: string } {
  if (vertices.length === 0) return { frontPathD: '', backPathD: '', fullPathD: '' };

  let fullPathD = `M ${vertices[0].screenPos.x.toFixed(2)} ${vertices[0].screenPos.y.toFixed(2)} `;
  for (let i = 1; i < vertices.length; i++) {
    fullPathD += `L ${vertices[i].screenPos.x.toFixed(2)} ${vertices[i].screenPos.y.toFixed(2)} `;
  }

  // Front segments
  const frontSegments: string[] = [];
  let inFront = false;
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (v.isFront) {
      if (!inFront) {
        frontSegments.push(`M ${v.screenPos.x.toFixed(2)} ${v.screenPos.y.toFixed(2)}`);
        inFront = true;
      } else {
        frontSegments.push(`L ${v.screenPos.x.toFixed(2)} ${v.screenPos.y.toFixed(2)}`);
      }
    } else {
      inFront = false;
    }
  }

  // Back segments
  const backSegments: string[] = [];
  let inBack = false;
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (!v.isFront) {
      if (!inBack) {
        backSegments.push(`M ${v.screenPos.x.toFixed(2)} ${v.screenPos.y.toFixed(2)}`);
        inBack = true;
      } else {
        backSegments.push(`L ${v.screenPos.x.toFixed(2)} ${v.screenPos.y.toFixed(2)}`);
      }
    } else {
      inBack = false;
    }
  }

  return {
    frontPathD: frontSegments.join(' '),
    backPathD: backSegments.join(' '),
    fullPathD
  };
}

/**
 * Projects a 3D point into a specified 2D historical astrolabe coordinate frame.
 */
export function computeProjection2D(
  p3d: Vector3D,
  mode: ArmillaryProjectionMode,
  r0: number,
  latitude: Latitude,
  lstDeg: Degrees | number
): Vector2D {
  if (mode === 'stereographic') {
    return projectStereographicConformal(p3d, r0);
  } else if (mode === 'rojas') {
    return projectRojasOrthographic(p3d, r0);
  } else {
    const { raDeg, decDeg } = cartesian3DToEquatorial(p3d);
    const horiz = equatorialToHorizontal(raDeg, decDeg, latitude, lstDeg);
    return projectTopocentricHorizon(horiz.altDeg, horiz.azDeg, r0);
  }
}

/**
 * Generates the complete dynamic Gyro-Morph Armillary Model data structure at 60 FPS.
 */
export function generateArmillaryModel(params: {
  julianDate: JulianDate | number;
  latitude: Latitude;
  longitude: Longitude;
  timeOfDay: HoursDecimal;
  sunRaDeg: Degrees | number;
  sunDecDeg: Degrees | number;
  sunLambdaDeg: Degrees | number;
  moonRaDeg: Degrees | number;
  moonDecDeg: Degrees | number;
  moonLambdaDeg: Degrees | number;
  moonPhase: number;
  morphLambda: number; // 0.0 (3D) to 1.0 (2D Astrolabe Plate)
  projectionMode: ArmillaryProjectionMode;
  fromProjectionMode?: ArmillaryProjectionMode;
  projectionTransitionT?: number; // 0.0 (fromMode) to 1.0 (targetMode)
  cameraPitch: number;
  cameraYaw: number;
  r0?: number;
  dayOfWeek?: number;
  sunrise?: HoursDecimal;
  sunset?: HoursDecimal;
}): ArmillaryModelOutput {
  const {
    julianDate,
    latitude,
    longitude,
    timeOfDay,
    sunRaDeg,
    sunDecDeg,
    sunLambdaDeg,
    moonRaDeg,
    moonDecDeg,
    moonLambdaDeg,
    moonPhase,
    morphLambda,
    projectionMode,
    fromProjectionMode,
    projectionTransitionT = 1.0,
    cameraPitch,
    cameraYaw,
    r0 = 100,
    dayOfWeek = 0,
    sunrise = 6,
    sunset = 18
  } = params;

  const lambdaClamp = clamp(morphLambda, 0, 1);
  const transT = clamp(projectionTransitionT, 0, 1);
  const obliquity = 23.439;
  const lstDeg = calculateLST(julianDate, longitude);
  const gmstDeg = calculateGMST(julianDate);

  // Helper to project a single 3D vector
  const transformVertex = (p3d: Vector3D): ArmillaryRingVertex => {
    // 1. 3D Camera view
    const pCam = rotateEuler3D(p3d, cameraPitch, cameraYaw, 0);

    // 2. 2D Target Projection
    const pProjTarget = computeProjection2D(p3d, projectionMode, r0, latitude, lstDeg);
    let pProjX = pProjTarget.x;
    let pProjY = pProjTarget.y;

    // 2D-to-2D Cross-Projection Interpolation (when switching between 2D historical plates)
    if (fromProjectionMode && fromProjectionMode !== projectionMode && transT < 1.0) {
      const pProjSource = computeProjection2D(p3d, fromProjectionMode, r0, latitude, lstDeg);
      pProjX = (1 - transT) * pProjSource.x + transT * pProjTarget.x;
      pProjY = (1 - transT) * pProjSource.y + transT * pProjTarget.y;
    }

    // 3. Continuous Morph Blend (3D vs 2D)
    const screenX = (1 - lambdaClamp) * pCam.x + lambdaClamp * pProjX;
    const screenY = (1 - lambdaClamp) * (-pCam.y) + lambdaClamp * (-pProjY);
    const isFront = lambdaClamp >= 0.98 ? true : pCam.z >= 0;

    return {
      p3d,
      pCam,
      pProj: { x: pProjX, y: pProjY },
      screenPos: { x: screenX, y: screenY },
      isFront
    };
  };

  const rings: ArmillaryRingPath[] = [];
  const NUM_SAMPLES = 72;

  // 1. Celestial Equator Ring (Dec = 0°)
  const equatorVertices: ArmillaryRingVertex[] = [];
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const ra = (i / NUM_SAMPLES) * 360;
    const p3d = equatorialToCartesian3D(ra, 0, r0);
    equatorVertices.push(transformVertex(p3d));
  }
  const eqPaths = buildSegmentedSvgPaths(equatorVertices);
  rings.push({
    id: 'equator',
    label: 'Celestial Equator',
    color: '#10b981', // Emerald
    frontStrokeWidth: 2.0,
    backStrokeWidth: 1.0,
    vertices: equatorVertices,
    ...eqPaths
  });

  // 2. Ecliptic Rete Ring (Inclined at 23.44°, Rotates with LST or Anomaly)
  const eclipticVertices: ArmillaryRingVertex[] = [];
  const epsRad = toRadians(obliquity);
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const lDeg = (i / NUM_SAMPLES) * 360;
    const lRad = toRadians(lDeg);
    const x = r0 * Math.cos(lRad);
    const y = r0 * Math.sin(lRad) * Math.sin(epsRad);
    const z = r0 * Math.sin(lRad) * Math.cos(epsRad);
    eclipticVertices.push(transformVertex({ x, y, z }));
  }
  const eclPaths = buildSegmentedSvgPaths(eclipticVertices);
  rings.push({
    id: 'ecliptic',
    label: 'Ecliptic (Zodiac Rete)',
    color: '#f59e0b', // Amber/Gold
    frontStrokeWidth: 2.2,
    backStrokeWidth: 1.0,
    vertices: eclipticVertices,
    ...eclPaths
  });

  // 3. Tropic of Cancer (Dec = +23.44°)
  const cancerVertices: ArmillaryRingVertex[] = [];
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const ra = (i / NUM_SAMPLES) * 360;
    const p3d = equatorialToCartesian3D(ra, obliquity, r0);
    cancerVertices.push(transformVertex(p3d));
  }
  const cancerPaths = buildSegmentedSvgPaths(cancerVertices);
  rings.push({
    id: 'tropic_cancer',
    label: 'Tropic of Cancer (+23.44°)',
    color: '#f43f5e', // Rose
    frontStrokeWidth: 1.2,
    backStrokeWidth: 0.8,
    vertices: cancerVertices,
    ...cancerPaths
  });

  // 4. Tropic of Capricorn (Dec = -23.44°)
  const capricornVertices: ArmillaryRingVertex[] = [];
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const ra = (i / NUM_SAMPLES) * 360;
    const p3d = equatorialToCartesian3D(ra, -obliquity, r0);
    capricornVertices.push(transformVertex(p3d));
  }
  const capricornPaths = buildSegmentedSvgPaths(capricornVertices);
  rings.push({
    id: 'tropic_capricorn',
    label: 'Tropic of Capricorn (-23.44°)',
    color: '#38bdf8', // Sky Blue
    frontStrokeWidth: 1.2,
    backStrokeWidth: 0.8,
    vertices: capricornVertices,
    ...capricornPaths
  });

  // 5. Local Horizon Ring (Alt = 0°)
  const horizonVertices: ArmillaryRingVertex[] = [];
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const az = (i / NUM_SAMPLES) * 360;
    const p3dHoriz = horizontalToCartesian3D(0, az, r0);
    // Convert topocentric to equatorial 3D frame via latitude tilt
    const p3dEq = rotateEuler3D(p3dHoriz, -(90 - latitude), 0, 0);
    horizonVertices.push(transformVertex(p3dEq));
  }
  const horizPaths = buildSegmentedSvgPaths(horizonVertices);
  rings.push({
    id: 'horizon',
    label: 'Local Horizon',
    color: '#06b6d4', // Cyan
    frontStrokeWidth: 2.0,
    backStrokeWidth: 1.0,
    vertices: horizonVertices,
    ...horizPaths
  });

  // 6. Solstitial Colure Ring (RA = 90° and 270° plane)
  const colureVertices: ArmillaryRingVertex[] = [];
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const theta = (i / NUM_SAMPLES) * 2 * Math.PI;
    const x = r0 * Math.cos(theta);
    const y = r0 * Math.sin(theta);
    const z = 0;
    colureVertices.push(transformVertex({ x, y, z }));
  }
  const colurePaths = buildSegmentedSvgPaths(colureVertices);
  rings.push({
    id: 'colure',
    label: 'Solstitial Colure',
    color: '#64748b', // Slate
    frontStrokeWidth: 1.2,
    backStrokeWidth: 0.8,
    vertices: colureVertices,
    ...colurePaths
  });

  // 7. Celestial Navigational Stars
  const stars = ASTROLABE_STARS.map((s) => {
    const p3d = equatorialToCartesian3D(s.raDeg, s.decDeg, r0);
    const v = transformVertex(p3d);
    const horiz = equatorialToHorizontal(s.raDeg, s.decDeg, latitude, lstDeg);
    return {
      ...s,
      p3d,
      pCam: v.pCam,
      pProj: v.pProj,
      screenPos: v.screenPos,
      isFront: v.isFront,
      altDeg: horiz.altDeg,
      azDeg: horiz.azDeg
    };
  });

  // 8. Sun Bead
  const sunP3D = equatorialToCartesian3D(sunRaDeg, sunDecDeg, r0);
  const sunV = transformVertex(sunP3D);
  const sunHoriz = equatorialToHorizontal(sunRaDeg, sunDecDeg, latitude, lstDeg);

  // 9. Moon Bead
  const moonP3D = equatorialToCartesian3D(moonRaDeg, moonDecDeg, r0);
  const moonV = transformVertex(moonP3D);
  const moonHoriz = equatorialToHorizontal(moonRaDeg, moonDecDeg, latitude, lstDeg);

  // 10. Almucantars and Planetary Hours
  const almucantars = generateAlmucantars(latitude, 15, r0);
  const planetaryHour = calculatePlanetaryHour(timeOfDay, sunrise, sunset, dayOfWeek);

  return {
    rings,
    almucantars,
    unequalHours: [],
    stars,
    sun: {
      raDeg: asDegrees(sunRaDeg),
      decDeg: asDegrees(sunDecDeg),
      lambdaDeg: asDegrees(sunLambdaDeg),
      p3d: sunP3D,
      pCam: sunV.pCam,
      pProj: sunV.pProj,
      screenPos: sunV.screenPos,
      isFront: sunV.isFront,
      altDeg: sunHoriz.altDeg,
      azDeg: sunHoriz.azDeg
    },
    moon: {
      raDeg: asDegrees(moonRaDeg),
      decDeg: asDegrees(moonDecDeg),
      lambdaDeg: asDegrees(moonLambdaDeg),
      phase: moonPhase,
      p3d: moonP3D,
      pCam: moonV.pCam,
      pProj: moonV.pProj,
      screenPos: moonV.screenPos,
      isFront: moonV.isFront,
      altDeg: moonHoriz.altDeg,
      azDeg: moonHoriz.azDeg
    },
    siderealTimeDeg: gmstDeg,
    localSiderealTimeDeg: lstDeg,
    planetaryHour
  };
}
