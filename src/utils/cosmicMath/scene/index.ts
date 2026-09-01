/**
 * @file index.ts
 * Central barrel re-export entry for the Unified 3D Astronomical Scene Graph module.
 * 
 * Provides:
 * - Types and interfaces: SceneBody3D, SceneEarth3D, SceneMoon3D, CosmicScene3D, ProjectedScene2D, etc.
 * - Coordinate transformations: transformVector3D, rotatePointEuler3D, calculateShadowCones3D, etc.
 * - Scene graph generator: generateCosmicScene
 * - Canonical camera rigs: projectHeliocentricTopDown, projectGeocentricTransverse, projectGeocentricAxial, projectEulerCamera
 */

export * from './types';
export * from './transforms';
export * from './generator';
export * from './cameras';
