import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians } from '../core';
import { rotateEuler3D } from './coordinates';
import { projectStereographicConformal } from './projections';
import { ArmillaryProjectionMode, ProjectionFocalBeaconOutput, LaserRay } from './types';

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
