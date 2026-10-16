import { Vector2D, Vector3D } from '../../../types/coordinates';
import { createEulerCameraRotator } from './coordinates';
import { ArmillaryProjectionMode, ProjectionFocalBeaconOutput, LaserRay } from './types';

// Pre-computed static unit circle points for 8 cardinal/intercardinal rays
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const PRECOMPUTED_RAYS = RAY_ANGLES.map(angleDeg => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    cos: Math.cos(rad),
    sin: Math.sin(rad),
    angleDeg,
    color: angleDeg % 90 === 0 ? '#38bdf8' : '#fbbf24'
  };
});

// Pre-computed static unit circle points for 72 cone samples
const NUM_CONE_SAMPLES = 72;
const PRECOMPUTED_CONE = Array.from({ length: NUM_CONE_SAMPLES + 1 }, (_, i) => {
  const rad = (i / NUM_CONE_SAMPLES) * 2 * Math.PI;
  return {
    cos: Math.cos(rad),
    sin: Math.sin(rad)
  };
});

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
  morphLambda: number = 0.0,
  precomputedRotator?: (x: number, y: number, z: number) => Vector3D,
  skipDetails: boolean = false
): ProjectionFocalBeaconOutput {
  let focal3D: Vector3D;
  if (projectionMode === 'stereographic') {
    focal3D = { x: 0, y: -r0, z: 0 };
  } else if (projectionMode === 'rojas') {
    focal3D = { x: 0, y: 0, z: r0 * 1.5 };
  } else {
    focal3D = { x: 0, y: -r0, z: 0 };
  }

  const rotateCam = precomputedRotator ?? createEulerCameraRotator(cameraPitch, cameraYaw, 0);
  const pCam = rotateCam(focal3D.x, focal3D.y, focal3D.z);
  const targetFocalY = projectionMode === 'rojas' ? 0 : r0 * 1.2;
  const rawX = (1 - morphLambda) * pCam.x;
  const rawY = (1 - morphLambda) * (-pCam.y) + morphLambda * targetFocalY;
  const focalScreenPos: Vector2D = {
    x: rawX === 0 ? 0 : rawX,
    y: rawY === 0 ? 0 : rawY
  };

  if (skipDetails) {
    return {
      focal3D,
      focalScreenPos,
      focalZCam: pCam.z,
      laserRays: [],
      conePathD: ''
    };
  }

  const oneMinusMorph = 1 - morphLambda;
  const laserRays: LaserRay[] = new Array(PRECOMPUTED_RAYS.length);

  for (let idx = 0; idx < PRECOMPUTED_RAYS.length; idx++) {
    const ray = PRECOMPUTED_RAYS[idx];
    const ringPointX = r0 * ray.cos;
    const ringPointZ = r0 * ray.sin;
    const ringCam = rotateCam(ringPointX, 0, ringPointZ);
    // On equatorial plane y = 0, projectStereographicConformal(p, r0) is identically (p.x, p.z)
    const endX = oneMinusMorph * ringCam.x + morphLambda * ringPointX;
    const endY = oneMinusMorph * (-ringCam.y) + morphLambda * (-ringPointZ);

    laserRays[idx] = {
      start: focalScreenPos,
      end: { x: endX, y: endY },
      color: ray.color,
      opacity: 0.6
    };
  }

  const fmt1 = (val: number) => Math.round(val * 10) / 10;
  let conePathD = `M ${fmt1(focalScreenPos.x)} ${fmt1(focalScreenPos.y)} `;
  for (let i = 0; i <= NUM_CONE_SAMPLES; i++) {
    const sample = PRECOMPUTED_CONE[i];
    const ringPointX = r0 * sample.cos;
    const ringPointZ = r0 * sample.sin;
    const ringCam = rotateCam(ringPointX, 0, ringPointZ);

    const endX = oneMinusMorph * ringCam.x + morphLambda * ringPointX;
    const endY = oneMinusMorph * (-ringCam.y) + morphLambda * (-ringPointZ);
    conePathD += `L ${fmt1(endX)} ${fmt1(endY)} `;
  }
  conePathD += 'Z';

  return {
    focal3D,
    focalScreenPos,
    focalZCam: pCam.z,
    laserRays,
    conePathD
  };
}
