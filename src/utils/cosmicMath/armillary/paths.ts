import { ArmillaryRingVertex, ArmillaryRingPath } from './types';
import { Vector3D } from '../../../types/coordinates';

/**
 * Builds standard SVG path strings for front (z >= 0) and back (z < 0) segments.
 * Correctly maintains sub-path continuity across the z = 0 depth-split boundary.
 */
export function buildSegmentedSvgPaths(vertices: ArmillaryRingVertex[]): { frontPathD: string; backPathD: string; fullPathD: string } {
  const len = vertices.length;
  if (len === 0) return { frontPathD: '', backPathD: '', fullPathD: '' };

  let fullPathD = '';
  let frontPathD = '';
  let backPathD = '';

  let inFront = false;
  let inBack = false;

  for (let i = 0; i < len; i++) {
    const v = vertices[i];
    const sx = Math.round(v.screenPos.x * 100) / 100;
    const sy = Math.round(v.screenPos.y * 100) / 100;
    const coord = `${sx} ${sy}`;

    if (i === 0) {
      fullPathD = `M ${coord}`;
    } else {
      fullPathD += ` L ${coord}`;
    }

    if (v.isFront) {
      if (!inFront) {
        frontPathD += frontPathD.length > 0 ? ` M ${coord}` : `M ${coord}`;
        inFront = true;
      } else {
        frontPathD += ` L ${coord}`;
      }
      inBack = false;
    } else {
      if (!inBack) {
        backPathD += backPathD.length > 0 ? ` M ${coord}` : `M ${coord}`;
        inBack = true;
      } else {
        backPathD += ` L ${coord}`;
      }
      inFront = false;
    }
  }

  return {
    frontPathD,
    backPathD,
    fullPathD: fullPathD + ' '
  };
}

export interface ParametricRingConfig {
  id: string;
  label: string;
  color?: string;
  frontStrokeWidth: number;
  backStrokeWidth: number;
  sampleCount?: number;
  samplePoint: (t: number, index: number) => Vector3D; // t in [0, 1], index in [0, sampleCount]
}

/**
 * High-performance generic functional pipeline transforming 3D parametric space curves
 * into depth-sorted, projected Armillary SVG ring paths.
 */
export function generateParametricRing3D(
  config: ParametricRingConfig,
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex
): ArmillaryRingPath {
  const numSamples = config.sampleCount ?? 64;
  const vertices: ArmillaryRingVertex[] = new Array(numSamples + 1);

  let fullPathD = '';
  let frontPathD = '';
  let backPathD = '';
  let inFront = false;
  let inBack = false;

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const p3d = config.samplePoint(t, i);
    const v = transformVertex(p3d);
    vertices[i] = v;

    const sx = Math.round(v.screenPos.x * 100) / 100;
    const sy = Math.round(v.screenPos.y * 100) / 100;
    const sxy = sx + ' ' + sy;

    if (i === 0) {
      fullPathD = 'M ' + sxy;
    } else {
      fullPathD += ' L ' + sxy;
    }

    if (v.isFront) {
      if (!inFront) {
        frontPathD += frontPathD.length === 0 ? ('M ' + sxy) : (' M ' + sxy);
        inFront = true;
      } else {
        frontPathD += ' L ' + sxy;
      }
      inBack = false;
    } else {
      if (!inBack) {
        backPathD += backPathD.length === 0 ? ('M ' + sxy) : (' M ' + sxy);
        inBack = true;
      } else {
        backPathD += ' L ' + sxy;
      }
      inFront = false;
    }
  }

  return {
    id: config.id,
    label: config.label,
    color: config.color,
    frontStrokeWidth: config.frontStrokeWidth,
    backStrokeWidth: config.backStrokeWidth,
    vertices,
    frontPathD,
    backPathD,
    fullPathD: fullPathD + ' '
  };
}
