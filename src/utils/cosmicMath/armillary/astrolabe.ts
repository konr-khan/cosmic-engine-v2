import { Degrees, Latitude, HoursDecimal, asDegrees } from '../../../types/units';
import { toRadians, clamp } from '../core';
import { AlmucantarCircleData, ArmillaryProjectionMode } from './types';
import { CHALDEAN_PLANETS } from './constants';

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
 * Generates continuous Almucantars for Stereographic, Horizon, or cross-transitioning plates.
 */
export function generateContinuousAlmucantars(
  latitude: Latitude,
  projectionMode: ArmillaryProjectionMode,
  fromProjectionMode: ArmillaryProjectionMode | undefined,
  transT: number = 1.0,
  stepDeg: number = 15,
  r0: number = 100
): AlmucantarCircleData[] {
  const isHorizonTarget = projectionMode === 'horizon';
  const isHorizonSource = fromProjectionMode === 'horizon';
  const isTransitioning = fromProjectionMode && fromProjectionMode !== projectionMode && transT < 1.0;

  const list: AlmucantarCircleData[] = [];
  for (let alt = 0; alt <= 85; alt += stepDeg) {
    const stereoCircle = calculateAlmucantarCircle(alt, latitude, r0);
    const clampedAlt = clamp(alt, -89.9, 90);
    const horizonRadius = r0 * Math.tan(toRadians((90 - clampedAlt) / 2));
    const horizonCircle: AlmucantarCircleData = {
      altitude: asDegrees(alt),
      centerY: 0,
      radius: parseFloat(horizonRadius.toFixed(2)),
      isHorizon: Math.abs(alt) < 0.1
    };

    if (!isTransitioning) {
      list.push(isHorizonTarget ? horizonCircle : stereoCircle);
    } else {
      const sourceCircle = isHorizonSource ? horizonCircle : stereoCircle;
      const targetCircle = isHorizonTarget ? horizonCircle : stereoCircle;
      const t = clamp(transT, 0, 1);
      list.push({
        altitude: asDegrees(alt),
        centerY: parseFloat(((1 - t) * sourceCircle.centerY + t * targetCircle.centerY).toFixed(2)),
        radius: parseFloat(((1 - t) * sourceCircle.radius + t * targetCircle.radius).toFixed(2)),
        isHorizon: Math.abs(alt) < 0.1
      });
    }
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
