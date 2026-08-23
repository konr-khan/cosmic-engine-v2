import { Latitude } from '../../../types/units';
import { Vector2D } from '../../../types/coordinates';
import { equatorialToHorizontal } from './coordinates';
import { AlidadeSightingInfo } from './types';

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
