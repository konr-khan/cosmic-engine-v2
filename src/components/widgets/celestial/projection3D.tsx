import React from 'react';
import { toRadians } from '../../../utils/cosmicMath';

export interface ProjectedPoint3D {
  px: number;
  py: number;
  z: number;
}

/**
 * Orthographic 3D Projection Helper
 * Transforms 3D cartesian coordinates (x, y, z) into 2D SVG canvas coordinates with pitch and yaw rotations.
 */
export const project3D = (
  x: number,
  y: number,
  z: number,
  pitch = 22,
  yaw = -35,
  scale = 1.0,
  cx = 200,
  cy = 160
): ProjectedPoint3D => {
  const radP = toRadians(pitch);
  const radY = toRadians(yaw);

  // Rotate around Y axis (Yaw)
  const x1 = x * Math.cos(radY) + z * Math.sin(radY);
  const z1 = -x * Math.sin(radY) + z * Math.cos(radY);

  // Rotate around X axis (Pitch)
  const y2 = y * Math.cos(radP) - z1 * Math.sin(radP);
  const z2 = y * Math.sin(radP) + z1 * Math.cos(radP);

  return {
    px: cx + x1 * scale,
    py: cy - y2 * scale,
    z: z2
  };
};

/**
 * Renders a 3D projected circle/ellipse SVG path.
 */
export const renderCircle3D = (
  radius: number,
  tiltXDeg: number,
  rotateYDeg: number,
  color: string,
  strokeWidth = 1.5,
  strokeDash = '',
  opacity = 0.8,
  pitch = 22,
  yaw = -35,
  scale = 1.0,
  cx = 200,
  cy = 160
): React.ReactElement => {
  const points: ProjectedPoint3D[] = [];
  const steps = 72;
  const radTilt = toRadians(tiltXDeg);
  const radRotY = toRadians(rotateYDeg);

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    // Circle in 3D plane
    const x0 = radius * Math.cos(theta);
    const y0 = 0;
    const z0 = radius * Math.sin(theta);

    // Tilt around X axis
    const y1 = y0 * Math.cos(radTilt) - z0 * Math.sin(radTilt);
    const z1 = y0 * Math.sin(radTilt) + z0 * Math.cos(radTilt);

    // Rotate around Y axis
    const x2 = x0 * Math.cos(radRotY) + z1 * Math.sin(radRotY);
    const z2 = -x0 * Math.sin(radRotY) + z1 * Math.cos(radRotY);

    const proj = project3D(x2, y1, z2, pitch, yaw, scale, cx, cy);
    points.push(proj);
  }

  let pathD = `M ${points[0].px.toFixed(1)} ${points[0].py.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].px.toFixed(1)} ${points[i].py.toFixed(1)}`;
  }

  return (
    <path 
      d={pathD} 
      fill="none" 
      stroke={color} 
      strokeWidth={strokeWidth} 
      strokeDasharray={strokeDash} 
      strokeOpacity={opacity} 
    />
  );
};
