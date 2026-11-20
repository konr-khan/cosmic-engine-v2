/**
 * @file eulerCamera.ts
 * Generalized 3D Euler camera projection rig (Pitch, Yaw, Roll + optional perspective)
 * for the Unified 3D Astronomical Scene Graph.
 */

import { Degrees, asDegrees } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import {
  CosmicScene3D,
  ProjectedScene2D,
  ProjectedBody2D,
  ProjectedEarth2D,
  ProjectedMilestone2D,
} from './types';
import { createEulerRotationMatrix } from './transforms';
import { CameraOptions, resolveViewport } from './cameras';

/** Options for generalized 3D Euler camera rig */
export interface EulerCameraOptions extends CameraOptions {
  pitch?: Degrees | number;
  yaw?: Degrees | number;
  roll?: Degrees | number;
  isPerspective?: boolean;
  focalDistance?: number;
}

/**
 * Pipeline 4: Generalized 3D Euler Camera projection with Pitch, Yaw, Roll and depth sorting.
 */
export function projectEulerCamera(
  scene: CosmicScene3D,
  pitch: Degrees | number,
  yaw: Degrees | number,
  options?: Partial<EulerCameraOptions> | number,
  height?: number,
  scale?: number
): ProjectedScene2D {
  const pitchDeg = typeof pitch === 'number' ? pitch : (pitch as number);
  const yawDeg = typeof yaw === 'number' ? yaw : (yaw as number);

  let rollDeg = 0;
  let isPerspective = false;
  let focalDistance = 500;

  if (typeof options === 'object' && options !== null) {
    rollDeg = options.roll ?? 0;
    isPerspective = options.isPerspective ?? false;
    focalDistance = options.focalDistance ?? 500;
  }

  const vp = resolveViewport(options, height, scale, 500, 500);
  const s = vp.scale;
  const cx = vp.centerX;
  const cy = vp.centerY;

  const rotM = createEulerRotationMatrix(pitchDeg, yawDeg, rollDeg);
  const m00 = rotM[0][0], m01 = rotM[0][1], m02 = rotM[0][2];
  const m10 = rotM[1][0], m11 = rotM[1][1], m12 = rotM[1][2];
  const m20 = rotM[2][0], m21 = rotM[2][1], m22 = rotM[2][2];

  const project3D = (p3d: Vector3D, radius: number = 0): { x: number; y: number; r: number; depth: number } => {
    const camX = m00 * p3d.x + m01 * p3d.y + m02 * p3d.z;
    const camY = m10 * p3d.x + m11 * p3d.y + m12 * p3d.z;
    const camZ = m20 * p3d.x + m21 * p3d.y + m22 * p3d.z;

    if (isPerspective) {
      const denom = Math.max(10, focalDistance + camZ);
      const factor = focalDistance / denom;
      return {
        x: cx + camX * factor * s,
        y: cy - camY * factor * s,
        r: radius * factor * s,
        depth: camZ
      };
    }
    return {
      x: cx + camX * s,
      y: cy - camY * s,
      r: radius * s,
      depth: camZ
    };
  };

  const sunProj = project3D(scene.sun.position, 15);
  const sun: ProjectedBody2D = {
    x: sunProj.x,
    y: sunProj.y,
    r: sunProj.r,
    visible: true,
    depth: sunProj.depth
  };

  const earthProj = project3D(scene.earth.position, 10);
  const earth: ProjectedEarth2D = {
    x: earthProj.x,
    y: earthProj.y,
    r: earthProj.r,
    visible: true,
    depth: earthProj.depth,
    axialTiltAngle2D: 90 - pitchDeg
  };

  const moonProj = project3D(scene.moon.position, 4);
  const moon: ProjectedBody2D = {
    x: moonProj.x,
    y: moonProj.y,
    r: moonProj.r,
    visible: true,
    depth: moonProj.depth
  };

  const milestones: ProjectedMilestone2D[] = scene.milestones.map(m => {
    const proj = project3D(m.position);
    return {
      id: m.id,
      label: m.label,
      date: m.date,
      x: proj.x,
      y: proj.y,
      visible: true
    };
  });

  return {
    camera: {
      name: 'euler3d',
      viewport: vp,
      pitch: asDegrees(pitchDeg),
      yaw: asDegrees(yawDeg),
      roll: asDegrees(rollDeg)
    },
    elements: {
      sun,
      earth,
      moon,
      orbitPath: '',
      milestones
    }
  };
}
