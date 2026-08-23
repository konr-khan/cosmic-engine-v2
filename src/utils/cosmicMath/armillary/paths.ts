import { ArmillaryRingVertex } from './types';

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
