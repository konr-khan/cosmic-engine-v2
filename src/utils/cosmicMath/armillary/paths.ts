import { ArmillaryRingVertex, ArmillaryRingPath } from './types';
import { Vector3D } from '../../../types/coordinates';

/**
 * Builds standard SVG path strings for front (z >= 0) and back (z < 0) segments.
 * Correctly maintains sub-path continuity across the z = 0 depth-split boundary.
 */
export function buildSegmentedSvgPaths(vertices: ArmillaryRingVertex[]): { frontPathD: string; backPathD: string; fullPathD: string } {
  if (vertices.length === 0) return { frontPathD: '', backPathD: '', fullPathD: '' };

  let fullPathD = `M ${vertices[0].screenPos.x.toFixed(2)} ${vertices[0].screenPos.y.toFixed(2)} `;
  for (let i = 1; i < vertices.length; i++) {
    fullPathD += `L ${vertices[i].screenPos.x.toFixed(2)} ${vertices[i].screenPos.y.toFixed(2)} `;
  }

  // Front segments (z >= 0)
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

  // Back segments (z < 0)
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
