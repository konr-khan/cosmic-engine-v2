import { toRadians, toDegrees, clamp } from './core';
import { Degrees, Radians, Latitude, Longitude, HoursDecimal, JulianDate, asDegrees } from '../../types/units';
import { Vector2D, Vector3D } from '../../types/coordinates';
import { calculateEarthOrbitalPhysics } from './solar';

export type { Vector2D, Vector3D };

export type ArmillaryModelMode = 'heliocentric' | 'geocentric' | '3D' | 'stereographic' | 'rojas' | 'horizon';
export type ArmillaryProjectionMode = ArmillaryModelMode;

export interface ArmillaryMilestoneNode {
  id: string;
  label: string;
  date: string;
  color: string;
  textColor: string;
  fillColor: string;
  p3d: Vector3D;
  pCam: Vector3D;
  screenPos: Vector2D;
  distanceAU: number;
  distanceKm: number;
  speedKms: number;
  description: string;
  isFront: boolean;
}

export interface ArmillaryOrbitalPhysics {
  distanceAU: number;
  distanceKm: number;
  orbitalSpeedKms: number;
  solarIrradiancePercent: number;
  sunAngularDiameterArcmin: number;
}

export const ARMILLARY_MILESTONES_DATA = [
  {
    id: 'perihelion',
    label: 'Perihelion',
    date: 'Jan 3',
    helioEclipticLon: 102.9,
    color: '#ef4444',
    textColor: 'text-rose-400',
    fillColor: 'fill-rose-400',
    distanceAU: 0.983,
    distanceKm: 147098070,
    speedKms: 30.29,
    description: "Earth's closest approach to the Sun. Orbital velocity peaks according to Kepler's 2nd Law."
  },
  {
    id: 'mar_equinox',
    label: 'March Equinox',
    date: 'Mar 20',
    helioEclipticLon: 180.0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 0.996,
    distanceKm: 149000000,
    speedKms: 29.84,
    description: "Vernal Equinox. Sun crosses the celestial equator northbound; equal day and night worldwide."
  },
  {
    id: 'jun_solstice',
    label: 'June Solstice',
    date: 'Jun 21',
    helioEclipticLon: 270.0,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 1.016,
    distanceKm: 152000000,
    speedKms: 29.31,
    description: "Northern Summer Solstice. Earth's Northern Hemisphere reaches maximum +23.44° axial tilt toward the Sun."
  },
  {
    id: 'aphelion',
    label: 'Aphelion',
    date: 'Jul 4',
    helioEclipticLon: 282.9,
    color: '#38bdf8',
    textColor: 'text-sky-400',
    fillColor: 'fill-sky-400',
    distanceAU: 1.017,
    distanceKm: 152097700,
    speedKms: 29.29,
    description: "Earth's furthest orbital point from the Sun. Orbital velocity reaches minimum speed."
  },
  {
    id: 'sep_equinox',
    label: 'September Equinox',
    date: 'Sep 22',
    helioEclipticLon: 0.0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 1.003,
    distanceKm: 150050000,
    speedKms: 29.74,
    description: "Autumnal Equinox. Sun crosses the celestial equator southbound; equal day and night worldwide."
  },
  {
    id: 'dec_solstice',
    label: 'December Solstice',
    date: 'Dec 21',
    helioEclipticLon: 90.0,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 0.984,
    distanceKm: 147100000,
    speedKms: 30.27,
    description: "Northern Winter Solstice. Earth's Northern Hemisphere reaches maximum -23.44° axial tilt away from the Sun."
  }
];

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
  milestones: ArmillaryMilestoneNode[];
  physics?: ArmillaryOrbitalPhysics;
  earth: {
    p3d: Vector3D;
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
  };
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
  apparentSolarHours?: number;
  isFreeRete?: boolean;
  focalBeacon?: ProjectionFocalBeaconOutput;
  planetaryHour: {
    hourNumber: number;
    isDay: boolean;
    rulingPlanet: string;
    label: string;
    progressPercent: number;
  };
  celestialRingsOpacity: number;
  orbitRingOpacity: number;
  milestonesOpacity: number;
  starsOpacity: number;
  bezelOpacity: number;
  alidadeOpacity: number;
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
  isFreeReteMode?: boolean;
  freeReteOffsetDeg?: number;
  exaggerateEccentricity?: boolean;
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
    sunset = 18,
    isFreeReteMode = false,
    freeReteOffsetDeg = 0,
    exaggerateEccentricity = false
  } = params;

  const lambdaClamp = clamp(morphLambda, 0, 1);
  const transT = clamp(projectionTransitionT, 0, 1);
  const obliquity = 23.439;
  const baseLstDeg = calculateLST(julianDate, longitude);
  const lstDeg = isFreeReteMode 
    ? asDegrees(((baseLstDeg + freeReteOffsetDeg) % 360 + 360) % 360)
    : baseLstDeg;
  const gmstDeg = calculateGMST(julianDate);

  const { apparentSolarHours } = calculateReteAngleToLST(lstDeg, sunRaDeg);
  const focalBeacon = generateProjectionFocalBeacon(projectionMode, r0, cameraPitch, cameraYaw, lambdaClamp);

  const reteOffset = isFreeReteMode ? freeReteOffsetDeg : 0;

  // Calculate live Keplerian orbital physics
  const physicsSolar = calculateEarthOrbitalPhysics(julianDate);
  const physics: ArmillaryOrbitalPhysics = {
    distanceAU: physicsSolar.distanceAU ?? 1.0,
    distanceKm: physicsSolar.distanceKm ?? 149597870,
    orbitalSpeedKms: physicsSolar.orbitalSpeedKms ?? 29.78,
    solarIrradiancePercent: physicsSolar.solarIrradiancePercent ?? 100.0,
    sunAngularDiameterArcmin: physicsSolar.sunAngularDiameterArcmin ?? 32.0
  };

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
    const is3DTarget = projectionMode === 'heliocentric' || projectionMode === 'geocentric' || projectionMode === '3D';
    const effectiveLambda = is3DTarget ? 0 : lambdaClamp;

    const screenX = (1 - effectiveLambda) * pCam.x + effectiveLambda * pProjX;
    const screenY = (1 - effectiveLambda) * (-pCam.y) + effectiveLambda * (-pProjY);
    const isFront = effectiveLambda >= 0.98 ? true : pCam.z >= 0;

    return {
      p3d,
      pCam,
      pProj: { x: pProjX, y: pProjY },
      screenPos: { x: screenX, y: screenY },
      isFront
    };
  };

  // -------------------------------------------------------------
  // Universal Multi-Model Geometry Derivations
  // -------------------------------------------------------------
  interface RawModeGeometry {
    sun3D: Vector3D;
    earth3D: Vector3D;
    moon3D: Vector3D;
    milestones3D: Array<{ id: string; p3d: Vector3D }>;
    celestialRingsOpacity: number;
    orbitRingOpacity: number;
    milestonesOpacity: number;
    starsOpacity: number;
    bezelOpacity: number;
    alidadeOpacity: number;
  }

  const getRawModeGeometry = (mode: ArmillaryModelMode): RawModeGeometry => {
    const isHelio = mode === 'heliocentric';
    const isGeo = mode === 'geocentric';
    const is3DMode = mode === '3D';

    if (isHelio) {
      const a = r0 * 1.1;
      const e = exaggerateEccentricity ? 0.25 : 0.01671;
      const b = a * Math.sqrt(1 - e * e);
      const c = a * e;
      const sun3D = exaggerateEccentricity ? { x: -c, y: 0, z: 0 } : { x: 0, y: 0, z: 0 };

      // Earth's heliocentric longitude: lambda_earth = sunLambdaDeg + 180°
      const earthLonRad = toRadians((sunLambdaDeg + 180) % 360);
      const earth3D: Vector3D = {
        x: a * Math.cos(earthLonRad),
        y: 0,
        z: b * Math.sin(earthLonRad)
      };

      // Moon relative to Earth
      const moonAngleRad = toRadians(moonLambdaDeg);
      const moon3D: Vector3D = {
        x: earth3D.x + 16 * Math.cos(moonAngleRad),
        y: earth3D.y + 16 * Math.sin(toRadians(5.14)) * Math.sin(moonAngleRad),
        z: earth3D.z + 16 * Math.sin(moonAngleRad)
      };

      // Heliocentric milestones along Earth's orbit
      const milestones3D = ARMILLARY_MILESTONES_DATA.map((m) => {
        const lonRad = toRadians(m.helioEclipticLon);
        return {
          id: m.id,
          p3d: {
            x: a * Math.cos(lonRad),
            y: 0,
            z: b * Math.sin(lonRad)
          }
        };
      });

      return {
        sun3D,
        earth3D,
        moon3D,
        milestones3D,
        celestialRingsOpacity: 0.0,
        orbitRingOpacity: 1.0,
        milestonesOpacity: 1.0,
        starsOpacity: 0.25,
        bezelOpacity: 0.0,
        alidadeOpacity: 0.0
      };
    }

    if (isGeo) {
      const earth3D: Vector3D = { x: 0, y: 0, z: 0 };
      const a = r0 * 1.1;
      const sunLonRad = toRadians(sunLambdaDeg);
      const epsRad = toRadians(obliquity);

      // Sun apparent position revolving around Earth (r_sun = -r_earth)
      const sun3D: Vector3D = {
        x: a * Math.cos(sunLonRad),
        y: a * Math.sin(sunLonRad) * Math.sin(epsRad),
        z: a * Math.sin(sunLonRad) * Math.cos(epsRad)
      };

      // Geocentric Moon at physical orbit distance
      const moon3D = equatorialToCartesian3D(moonRaDeg, moonDecDeg, 26);

      // Inverted milestones along Sun's apparent ecliptic path (helioLon + 180°)
      const milestones3D = ARMILLARY_MILESTONES_DATA.map((m) => {
        const apparentSunLonRad = toRadians((m.helioEclipticLon + 180) % 360);
        return {
          id: m.id,
          p3d: {
            x: a * Math.cos(apparentSunLonRad),
            y: a * Math.sin(apparentSunLonRad) * Math.sin(epsRad),
            z: a * Math.sin(apparentSunLonRad) * Math.cos(epsRad)
          }
        };
      });

      return {
        sun3D,
        earth3D,
        moon3D,
        milestones3D,
        celestialRingsOpacity: 0.35,
        orbitRingOpacity: 1.0,
        milestonesOpacity: 1.0,
        starsOpacity: 0.4,
        bezelOpacity: 0.2,
        alidadeOpacity: 0.0
      };
    }

    // 3D Armillary & 2D Astrolabe modes
    const earth3D: Vector3D = { x: 0, y: 0, z: 0 };
    const sun3DBase = equatorialToCartesian3D(sunRaDeg, sunDecDeg, r0);
    const sun3D = rotateEuler3D(sun3DBase, 0, reteOffset, 0);
    const moon3DBase = equatorialToCartesian3D(moonRaDeg, moonDecDeg, r0);
    const moon3D = rotateEuler3D(moon3DBase, 0, reteOffset, 0);

    const milestones3D = ARMILLARY_MILESTONES_DATA.map((m) => {
      const apparentSunLonRad = toRadians((m.helioEclipticLon + 180) % 360);
      const epsRad = toRadians(obliquity);
      return {
        id: m.id,
        p3d: {
          x: r0 * Math.cos(apparentSunLonRad),
          y: r0 * Math.sin(apparentSunLonRad) * Math.sin(epsRad),
          z: r0 * Math.sin(apparentSunLonRad) * Math.cos(epsRad)
        }
      };
    });

    return {
      sun3D,
      earth3D,
      moon3D,
      milestones3D,
      celestialRingsOpacity: 1.0,
      orbitRingOpacity: is3DMode ? 0.35 : 0.0,
      milestonesOpacity: is3DMode ? 0.4 : 0.0,
      starsOpacity: 1.0,
      bezelOpacity: is3DMode ? 0.6 : 1.0,
      alidadeOpacity: is3DMode ? 0.8 : 1.0
    };
  };

  const targetGeom = getRawModeGeometry(projectionMode);
  const sourceGeom = fromProjectionMode && fromProjectionMode !== projectionMode && transT < 1.0
    ? getRawModeGeometry(fromProjectionMode)
    : targetGeom;

  // Blend bodies smoothly across states
  const blendedSun3D: Vector3D = {
    x: (1 - transT) * sourceGeom.sun3D.x + transT * targetGeom.sun3D.x,
    y: (1 - transT) * sourceGeom.sun3D.y + transT * targetGeom.sun3D.y,
    z: (1 - transT) * sourceGeom.sun3D.z + transT * targetGeom.sun3D.z
  };

  const blendedEarth3D: Vector3D = {
    x: (1 - transT) * sourceGeom.earth3D.x + transT * targetGeom.earth3D.x,
    y: (1 - transT) * sourceGeom.earth3D.y + transT * targetGeom.earth3D.y,
    z: (1 - transT) * sourceGeom.earth3D.z + transT * targetGeom.earth3D.z
  };

  const blendedMoon3D: Vector3D = {
    x: (1 - transT) * sourceGeom.moon3D.x + transT * targetGeom.moon3D.x,
    y: (1 - transT) * sourceGeom.moon3D.y + transT * targetGeom.moon3D.y,
    z: (1 - transT) * sourceGeom.moon3D.z + transT * targetGeom.moon3D.z
  };

  const celestialRingsOpacity = (1 - transT) * sourceGeom.celestialRingsOpacity + transT * targetGeom.celestialRingsOpacity;
  const orbitRingOpacity = (1 - transT) * sourceGeom.orbitRingOpacity + transT * targetGeom.orbitRingOpacity;
  const milestonesOpacity = (1 - transT) * sourceGeom.milestonesOpacity + transT * targetGeom.milestonesOpacity;
  const starsOpacity = (1 - transT) * sourceGeom.starsOpacity + transT * targetGeom.starsOpacity;
  const bezelOpacity = (1 - transT) * sourceGeom.bezelOpacity + transT * targetGeom.bezelOpacity;
  const alidadeOpacity = (1 - transT) * sourceGeom.alidadeOpacity + transT * targetGeom.alidadeOpacity;

  // -------------------------------------------------------------
  // Celestial & Orbital Ring Paths
  // -------------------------------------------------------------
  const rings: ArmillaryRingPath[] = [];
  const NUM_SAMPLES = 72;

  // 0. Orbital Path Ring (Keplerian / Ecliptic orbit)
  const orbitRingVertices: ArmillaryRingVertex[] = [];
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const angleRad = (i / NUM_SAMPLES) * 2 * Math.PI;
    const a = r0 * 1.1;
    const isTargetHelio = projectionMode === 'heliocentric';
    const isSourceHelio = fromProjectionMode === 'heliocentric';
    const isHelioT = (1 - transT) * (isSourceHelio ? 1 : 0) + transT * (isTargetHelio ? 1 : 0);

    const e = exaggerateEccentricity ? 0.25 : 0.01671;
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e;

    const xHelio = a * Math.cos(angleRad) + (exaggerateEccentricity ? -c * 0.5 : 0);
    const yHelio = 0;
    const zHelio = b * Math.sin(angleRad);

    const epsRad = toRadians(obliquity);
    const xGeo = a * Math.cos(angleRad);
    const yGeo = a * Math.sin(angleRad) * Math.sin(epsRad);
    const zGeo = a * Math.sin(angleRad) * Math.cos(epsRad);

    const p3dOrb: Vector3D = {
      x: isHelioT * xHelio + (1 - isHelioT) * xGeo,
      y: isHelioT * yHelio + (1 - isHelioT) * yGeo,
      z: isHelioT * zHelio + (1 - isHelioT) * zGeo
    };
    orbitRingVertices.push(transformVertex(p3dOrb));
  }
  const orbitPaths = buildSegmentedSvgPaths(orbitRingVertices);
  rings.push({
    id: 'orbit_path',
    label: 'Orbital Path',
    color: '#38bdf8', // Sky Blue
    frontStrokeWidth: 1.6,
    backStrokeWidth: 0.8,
    vertices: orbitRingVertices,
    ...orbitPaths
  });

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

  // 2. Ecliptic Rete Ring (Inclined at 23.44°, Rotates with LST or Free Rete Offset)
  const eclipticVertices: ArmillaryRingVertex[] = [];
  const epsRad = toRadians(obliquity);
  for (let i = 0; i <= NUM_SAMPLES; i++) {
    const lDeg = (i / NUM_SAMPLES) * 360;
    const lRad = toRadians(lDeg);
    const xBase = r0 * Math.cos(lRad);
    const yBase = r0 * Math.sin(lRad) * Math.sin(epsRad);
    const zBase = r0 * Math.sin(lRad) * Math.cos(epsRad);
    const p3dRotated = rotateEuler3D({ x: xBase, y: yBase, z: zBase }, 0, reteOffset, 0);
    eclipticVertices.push(transformVertex(p3dRotated));
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

  // 7. Celestial Navigational Stars (Rotates with Rete)
  const stars = ASTROLABE_STARS.map((s) => {
    const p3dBase = equatorialToCartesian3D(s.raDeg, s.decDeg, r0);
    const p3dRotated = rotateEuler3D(p3dBase, 0, reteOffset, 0);
    const v = transformVertex(p3dRotated);
    const horiz = equatorialToHorizontal(s.raDeg, s.decDeg, latitude, lstDeg);
    return {
      ...s,
      p3d: p3dRotated,
      pCam: v.pCam,
      pProj: v.pProj,
      screenPos: v.screenPos,
      isFront: v.isFront,
      altDeg: horiz.altDeg,
      azDeg: horiz.azDeg
    };
  });

  // 8. Milestone Nodes
  const milestones: ArmillaryMilestoneNode[] = ARMILLARY_MILESTONES_DATA.map((m, idx) => {
    const targetM3D = targetGeom.milestones3D[idx]?.p3d || { x: 0, y: 0, z: 0 };
    const sourceM3D = sourceGeom.milestones3D[idx]?.p3d || targetM3D;
    const blendedM3D: Vector3D = {
      x: (1 - transT) * sourceM3D.x + transT * targetM3D.x,
      y: (1 - transT) * sourceM3D.y + transT * targetM3D.y,
      z: (1 - transT) * sourceM3D.z + transT * targetM3D.z
    };
    const v = transformVertex(blendedM3D);
    return {
      ...m,
      p3d: blendedM3D,
      pCam: v.pCam,
      screenPos: v.screenPos,
      isFront: v.isFront
    };
  });

  // 9. Earth, Sun, and Moon Beads
  const earthV = transformVertex(blendedEarth3D);
  const sunV = transformVertex(blendedSun3D);
  const moonV = transformVertex(blendedMoon3D);
  const sunHoriz = equatorialToHorizontal(sunRaDeg, sunDecDeg, latitude, lstDeg);
  const moonHoriz = equatorialToHorizontal(moonRaDeg, moonDecDeg, latitude, lstDeg);

  // 10. Almucantars and Planetary Hours
  const almucantars = generateAlmucantars(latitude, 15, r0);
  const planetaryHour = calculatePlanetaryHour(timeOfDay, sunrise, sunset, dayOfWeek);

  return {
    rings,
    almucantars,
    unequalHours: [],
    milestones,
    physics,
    earth: {
      p3d: blendedEarth3D,
      pCam: earthV.pCam,
      pProj: earthV.pProj,
      screenPos: earthV.screenPos,
      isFront: earthV.isFront
    },
    stars,
    sun: {
      raDeg: asDegrees(sunRaDeg),
      decDeg: asDegrees(sunDecDeg),
      lambdaDeg: asDegrees(sunLambdaDeg),
      p3d: blendedSun3D,
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
      p3d: blendedMoon3D,
      pCam: moonV.pCam,
      pProj: moonV.pProj,
      screenPos: moonV.screenPos,
      isFront: moonV.isFront,
      altDeg: moonHoriz.altDeg,
      azDeg: moonHoriz.azDeg
    },
    siderealTimeDeg: gmstDeg,
    localSiderealTimeDeg: lstDeg,
    apparentSolarHours,
    isFreeRete: isFreeReteMode,
    focalBeacon,
    planetaryHour,
    celestialRingsOpacity,
    orbitRingOpacity,
    milestonesOpacity,
    starsOpacity,
    bezelOpacity,
    alidadeOpacity
  };
}

/**
 * Solves the Apparent Local Sidereal Time and Solar Time when the user manually spins the Rete.
 * In classical astrolabes, matching a star's pointer to its current altitude solves the local time.
 */
export function calculateReteAngleToLST(
  reteAngleDeg: number,
  sunRaDeg: number
): { apparentLSTDeg: number; apparentSolarHours: number } {
  const apparentLSTDeg = ((reteAngleDeg % 360) + 360) % 360;
  // Hour angle of the Sun: H = LST - RA_sun
  const sunHourAngleDeg = ((apparentLSTDeg - sunRaDeg + 540) % 360) - 180;
  // Solar time: T = (H / 15) + 12
  const apparentSolarHours = ((((sunHourAngleDeg / 15) + 12) % 24) + 24) % 24;

  return {
    apparentLSTDeg: parseFloat(apparentLSTDeg.toFixed(1)),
    apparentSolarHours: parseFloat(apparentSolarHours.toFixed(2))
  };
}

export interface LaserRay {
  start: Vector2D;
  end: Vector2D;
  color: string;
  opacity: number;
}

export interface ProjectionFocalBeaconOutput {
  focal3D: Vector3D;
  focalScreenPos: Vector2D;
  focalZCam: number;
  laserRays: LaserRay[];
  conePathD: string;
}

/**
 * Generates the 3D position and 2D projected laser rays for the Center of Projection (Focal Pole).
 * For Stereographic: South Celestial Pole (0, -R0, 0)
 * For Universal Rojas: +Z orthogonal beam
 * For Horizon Stereonet: Nadir (0, -R0, 0 in horizon frame)
 */
export function generateProjectionFocalBeacon(
  projectionMode: ArmillaryProjectionMode,
  r0: number = 100,
  cameraPitch: number = 25,
  cameraYaw: number = 35,
  morphLambda: number = 0.0
): ProjectionFocalBeaconOutput {
  let focal3D: Vector3D;
  if (projectionMode === 'stereographic') {
    focal3D = { x: 0, y: -r0, z: 0 };
  } else if (projectionMode === 'rojas') {
    focal3D = { x: 0, y: 0, z: r0 * 1.5 };
  } else {
    focal3D = { x: 0, y: -r0, z: 0 };
  }

  const pCam = rotateEuler3D(focal3D, cameraPitch, cameraYaw, 0);
  const focalScreenPos: Vector2D = {
    x: (1 - morphLambda) * pCam.x,
    y: (1 - morphLambda) * (-pCam.y) + morphLambda * (r0 * 1.2)
  };

  const laserRays: LaserRay[] = [];

  // 1. Generate 8 discrete cardinal/intercardinal laser rays
  const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const angleDeg of RAY_ANGLES) {
    const rad = toRadians(angleDeg);
    const ringPoint3D: Vector3D = {
      x: r0 * Math.sin(rad),
      y: 0,
      z: r0 * Math.cos(rad)
    };
    const ringCam = rotateEuler3D(ringPoint3D, cameraPitch, cameraYaw, 0);
    const ringProj = projectStereographicConformal(ringPoint3D, r0);

    const endX = (1 - morphLambda) * ringCam.x + morphLambda * ringProj.x;
    const endY = (1 - morphLambda) * (-ringCam.y) + morphLambda * (-ringProj.y);

    laserRays.push({
      start: focalScreenPos,
      end: { x: endX, y: endY },
      color: angleDeg % 90 === 0 ? '#38bdf8' : '#fbbf24',
      opacity: 0.6
    });
  }

  // 2. Generate smooth 360-degree closed conic envelope (72 samples, 0° to 360°)
  const NUM_CONE_SAMPLES = 72;
  const conePoints: Vector2D[] = [];
  for (let i = 0; i <= NUM_CONE_SAMPLES; i++) {
    const rad = (i / NUM_CONE_SAMPLES) * 2 * Math.PI;
    const ringPoint3D: Vector3D = {
      x: r0 * Math.sin(rad),
      y: 0,
      z: r0 * Math.cos(rad)
    };
    const ringCam = rotateEuler3D(ringPoint3D, cameraPitch, cameraYaw, 0);
    const ringProj = projectStereographicConformal(ringPoint3D, r0);

    const endX = (1 - morphLambda) * ringCam.x + morphLambda * ringProj.x;
    const endY = (1 - morphLambda) * (-ringCam.y) + morphLambda * (-ringProj.y);
    conePoints.push({ x: endX, y: endY });
  }

  let conePathD = '';
  if (conePoints.length > 0) {
    conePathD = `M ${focalScreenPos.x.toFixed(1)} ${focalScreenPos.y.toFixed(1)} `;
    for (const pt of conePoints) {
      conePathD += `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
    }
    conePathD += 'Z';
  }

  return {
    focal3D,
    focalScreenPos,
    focalZCam: pCam.z,
    laserRays,
    conePathD
  };
}

export interface AlidadeSightingInfo {
  ruleAngleDeg: number;
  rightAscensionDeg: number;
  rightAscensionHours: number;
  localAltitudeDeg: number;
  localAzimuthDeg: number;
  nearestTarget?: {
    name: string;
    type: 'star' | 'sun' | 'moon';
    angularDiffDeg: number;
    magnitude?: number;
  };
}

/**
 * Calculates real-time astronomical sighting telemetry for the brass Astrolabe Rule (Alidade).
 */
export function calculateAlidadeSighting(
  ruleAngleDeg: number,
  latitude: Latitude,
  lstDeg: number,
  stars: Array<{ name: string; screenPos: Vector2D; altDeg: number; azDeg: number; magnitude: number; raDeg: number; decDeg: number }>,
  sun: { screenPos: Vector2D; altDeg: number; azDeg: number; raDeg: number; decDeg: number },
  moon: { screenPos: Vector2D; altDeg: number; azDeg: number; raDeg: number; decDeg: number }
): AlidadeSightingInfo {
  const normAngle = ((ruleAngleDeg % 360) + 360) % 360;
  const raDeg = (normAngle * 360 / 360) % 360;
  const raHours = raDeg / 15;

  const sightingHoriz = equatorialToHorizontal(raDeg, 0, latitude, lstDeg);

  let nearestTarget: AlidadeSightingInfo['nearestTarget'] | undefined = undefined;
  let minDiff = 360;

  // Check Sun
  const sunAngle = (Math.atan2(sun.screenPos.y, sun.screenPos.x) * 180 / Math.PI + 90 + 360) % 360;
  const diffSun = Math.min(Math.abs(normAngle - sunAngle), 360 - Math.abs(normAngle - sunAngle));
  if (diffSun < minDiff && diffSun < 10) {
    minDiff = diffSun;
    nearestTarget = { name: 'Sun (Sol)', type: 'sun', angularDiffDeg: parseFloat(diffSun.toFixed(1)) };
  }

  // Check Moon
  const moonAngle = (Math.atan2(moon.screenPos.y, moon.screenPos.x) * 180 / Math.PI + 90 + 360) % 360;
  const diffMoon = Math.min(Math.abs(normAngle - moonAngle), 360 - Math.abs(normAngle - moonAngle));
  if (diffMoon < minDiff && diffMoon < 10) {
    minDiff = diffMoon;
    nearestTarget = { name: 'Moon (Luna)', type: 'moon', angularDiffDeg: parseFloat(diffMoon.toFixed(1)) };
  }

  // Check Stars
  for (const s of stars) {
    const sAngle = (Math.atan2(s.screenPos.y, s.screenPos.x) * 180 / Math.PI + 90 + 360) % 360;
    const diff = Math.min(Math.abs(normAngle - sAngle), 360 - Math.abs(normAngle - sAngle));
    if (diff < minDiff && diff < 10) {
      minDiff = diff;
      nearestTarget = {
        name: s.name,
        type: 'star',
        angularDiffDeg: parseFloat(diff.toFixed(1)),
        magnitude: s.magnitude
      };
    }
  }

  return {
    ruleAngleDeg: parseFloat(normAngle.toFixed(1)),
    rightAscensionDeg: parseFloat(raDeg.toFixed(1)),
    rightAscensionHours: parseFloat(raHours.toFixed(2)),
    localAltitudeDeg: parseFloat(sightingHoriz.altDeg.toFixed(1)),
    localAzimuthDeg: parseFloat(sightingHoriz.azDeg.toFixed(1)),
    nearestTarget
  };
}
