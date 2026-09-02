import { ArmillaryRingVertex, ArmillaryRingPath } from './types';
import { Vector3D } from '../../../types/coordinates';

/**
 * Builds standard SVG path strings for front (z >= 0) and back (z < 0) segments.
 * Correctly maintains sub-path continuity across the z = 0 depth-split boundary.
 */
export function buildSegmentedSvgPaths(vertices: ArmillaryRingVertex[]): { frontPathD: string; backPathD: string; fullPathD: string } {
  const len = vertices.length;
  if (len === 0) return { frontPathD: '', backPathD: '', fullPathD: '' };

  const fullSegments: string[] = new Array(len);
  const frontSegments: string[] = [];
  const backSegments: string[] = [];

  let inFront = false;
  let inBack = false;

  for (let i = 0; i < len; i++) {
    const v = vertices[i];
    const sx = v.screenPos.x.toFixed(2);
    const sy = v.screenPos.y.toFixed(2);
    const coord = `${sx} ${sy}`;

    fullSegments[i] = i === 0 ? `M ${coord}` : `L ${coord}`;

    if (v.isFront) {
      if (!inFront) {
        frontSegments.push(`M ${coord}`);
        inFront = true;
      } else {
        frontSegments.push(`L ${coord}`);
      }
      inBack = false;
    } else {
      if (!inBack) {
        backSegments.push(`M ${coord}`);
        inBack = true;
      } else {
        backSegments.push(`L ${coord}`);
      }
      inFront = false;
    }
  }

  return {
    frontPathD: frontSegments.join(' '),
    backPathD: backSegments.join(' '),
    fullPathD: fullSegments.join(' ') + ' '
  };
}

export interface ParametricRingConfig {
  id: string;
  label: string;
  color: string;
  frontStrokeWidth: number;
  backStrokeWidth: number;
  sampleCount?: number;
  samplePoint: (t: number) => Vector3D; // t in [0, 1]
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

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const p3d = config.samplePoint(t);
    vertices[i] = transformVertex(p3d);
  }

  const paths = buildSegmentedSvgPaths(vertices);

  return {
    id: config.id,
    label: config.label,
    color: config.color,
    frontStrokeWidth: config.frontStrokeWidth,
    backStrokeWidth: config.backStrokeWidth,
    vertices,
    ...paths
  };
}
