/**
 * @file cameras.ts
 * Canonical camera projection pipelines for the Unified 3D Astronomical Scene Graph.
 * 
 * Implements:
 * 1. projectHeliocentricTopDown: Top-down orthographic projection on Ecliptic plane (X, Y)
 * 2. projectGeocentricTransverse: Side-on ecliptic transverse profile with shadow cones
 * 3. projectGeocentricAxial: Down-the-barrel Sun-Earth sightline through Earth
 * 4. projectEulerCamera: Generalized 3D Euler camera with Pitch, Yaw, Roll and depth sorting
 */

import { Degrees, Radians, asDegrees, toRadians, toDegrees } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { 
  CosmicScene3D, 
  ProjectedScene2D, 
  CameraViewport, 
  ProjectedBody2D, 
  ProjectedEarth2D, 
  ProjectedMilestone2D, 
  LunarOrbitSegment2D, 
  ProjectedShadowCones2D 
} from './types';
import { rotatePointEuler3D } from './transforms';
import { generateOrbitalSegments } from '../projection';

/** Options for standard 2D camera viewport configuration */
export interface CameraOptions {
  width: number;
  height: number;
  scale?: number;
  centerX?: number;
  centerY?: number;
}

/** Options for generalized 3D Euler camera rig */
export interface EulerCameraOptions extends CameraOptions {
  pitch?: Degrees | number;
  yaw?: Degrees | number;
  roll?: Degrees | number;
  isPerspective?: boolean;
  focalDistance?: number;
}

/**
 * Helper to normalize camera options or discrete viewport arguments.
 */
function resolveViewport(
  options?: Partial<CameraOptions> | number,
  heightArg?: number,
  scaleArg?: number,
  defaultWidth: number = 500,
  defaultHeight: number = 500,
  defaultCenterX?: number,
  defaultCenterY?: number
): CameraViewport {
  if (typeof options === 'number') {
    const w = options;
    const h = heightArg ?? w;
    const s = scaleArg !== undefined ? scaleArg : 1.0;
    return {
      width: w,
      height: h,
      scale: s,
      centerX: defaultCenterX ?? w / 2,
      centerY: defaultCenterY ?? h / 2
    };
  }

  const w = options?.width ?? defaultWidth;
  const h = options?.height ?? defaultHeight;
  const s = options?.scale !== undefined ? options.scale : 1.0;
  return {
    width: w,
    height: h,
    scale: s,
    centerX: options?.centerX ?? (defaultCenterX !== undefined ? defaultCenterX : w / 2),
    centerY: options?.centerY ?? (defaultCenterY !== undefined ? defaultCenterY : h / 2)
  };
}

/**
 * Pipeline 1: Top-down orthographic projection onto Heliocentric Ecliptic plane (X, Y).
 * 
 * Maps Sun at focus F1, Earth on Keplerian ellipse, 6 seasonal milestone nodes,
 * and circular lunar orbit around Earth.
 * 
 * @param scene - Active CosmicScene3D state
 * @param options - Viewport dimensions or options object
 * @param height - Viewport height (if options is number)
 * @param scale - Viewport scale factor (if options is number)
 * @returns ProjectedScene2D model
 */
export function projectHeliocentricTopDown(
  scene: CosmicScene3D,
  options?: Partial<CameraOptions> | number,
  height?: number,
  scale?: number
): ProjectedScene2D {
  // Default to Macro Orbit View canvas dimensions (viewBox="-290 -280 580 560")
  const vp = resolveViewport(options, height, scale, 580, 560, 0, 0);
  const s = vp.scale;
  const cx = vp.centerX;
  const cy = vp.centerY;

  // 1. Keplerian Orbit Parameters & SVG Path
  const a = 200; // display semi-major axis
  const e = scene.scaleMode === 'exaggerated' ? 0.25 : 0.01671;
  const b = a * Math.sqrt(Math.max(0, 1 - e * e));

  const rx = a * s;
  const ry = b * s;

  // Closed elliptical SVG path centered at (cx, cy)
  const orbitPath = `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

  // 2. Projected Sun Element (at focus F1)
  const sunX = cx + scene.sun.position.x * s;
  const sunY = cy + scene.sun.position.y * s;
  const sun: ProjectedBody2D = {
    x: sunX,
    y: sunY,
    r: 15 * s,
    visible: true,
    depth: scene.sun.position.z
  };

  // 3. Projected Earth Element (on Keplerian ellipse)
  const earthX = cx + scene.earth.position.x * s;
  const earthY = cy + scene.earth.position.y * s;
  const earth: ProjectedEarth2D = {
    x: earthX,
    y: earthY,
    r: 10 * s,
    visible: true,
    depth: scene.earth.position.z,
    // In top-down view looking from +Z (NEP), Earth's North pole tilts along the solstitial colure +Y (90 deg)
    axialTiltAngle2D: 90.0
  };

  // 4. Projected Moon Element & Circular Orbit Path
  const moonOrbitRadius = 24 * s;
  const moonX = earthX + (scene.moon.position.x - scene.earth.position.x) * s;
  const moonY = earthY + (scene.moon.position.y - scene.earth.position.y) * s;
  const moon: ProjectedBody2D = {
    x: moonX,
    y: moonY,
    r: 4 * s,
    visible: true,
    depth: scene.moon.position.z
  };
  const lunarOrbitPath = `M ${earthX - moonOrbitRadius} ${earthY} a ${moonOrbitRadius} ${moonOrbitRadius} 0 1 0 ${2 * moonOrbitRadius} 0 a ${moonOrbitRadius} ${moonOrbitRadius} 0 1 0 ${-2 * moonOrbitRadius} 0 Z`;

  // 5. Projected Seasonal Milestone Nodes
  const milestones: ProjectedMilestone2D[] = scene.milestones.map((m) => ({
    id: m.id,
    label: m.label,
    date: m.date,
    color: m.color,
    fillColor: m.fillColor,
    textColor: m.textColor,
    textAnchor: m.textAnchor,
    textDx: m.textDx,
    textDy: m.textDy,
    subDy: m.subDy,
    x: cx + m.position.x * s,
    y: cy + m.position.y * s,
    visible: true
  }));

  return {
    camera: {
      name: 'topdown',
      viewport: vp
    },
    elements: {
      sun,
      earth,
      moon,
      orbitPath,
      lunarOrbitPath,
      milestones
    }
  };
}

/**
 * Pipeline 2: Side-on ecliptic transverse profile projection.
 * 
 * Maps Sun on left (X=50), Earth at center (X=310, Y=110), 3D shadow cones projecting rightward,
 * 4-quadrant inclined lunar orbit paths, and 23.439° Earth axial tilt.
 * 
 * @param scene - Active CosmicScene3D state
 * @param options - Viewport dimensions or options object
 * @param height - Viewport height (if options is number)
 * @param scale - Viewport scale factor (if options is number)
 * @returns ProjectedScene2D model
 */
export function projectGeocentricTransverse(
  scene: CosmicScene3D,
  options?: Partial<CameraOptions> | number,
  height?: number,
  scale?: number
): ProjectedScene2D {
  // Default to LiveSyzygyView canvas dimensions (viewBox="0 0 520 220")
  const vp = resolveViewport(options, height, scale, 520, 220, 310, 110);
  const s = vp.scale;
  const cx = vp.centerX;
  const cy = vp.centerY;

  const sunX = 50 * s;
  const sunY = cy;
  const earthX = cx;
  const earthY = cy;

  // 1. Sun Element (Left)
  const sun: ProjectedBody2D = {
    x: sunX,
    y: sunY,
    r: 28 * s,
    visible: true,
    depth: -100
  };

  // 2. Earth Projected Axial Tilt
  // Obliquity tilt projected in side-on view: thetaSide = eps * sin(sunLambda)
  const epsRad = scene.earth.obliquity;
  const sunLambdaDeg = scene.earth.heliocentricLongitude 
    ? ((scene.earth.heliocentricLongitude + 180) % 360) 
    : 0;
  const sunLambdaRad = toRadians(sunLambdaDeg);
  const thetaSideRad = epsRad * Math.sin(sunLambdaRad);
  const axialTiltAngle2D = toDegrees(thetaSideRad);

  const earth: ProjectedEarth2D = {
    x: earthX,
    y: earthY,
    r: 18 * s,
    visible: true,
    depth: 0,
    axialTiltAngle2D
  };

  // 3. Moon Position along inclined orbit
  const beta = scene.moon.eclipticLatitude;
  const phaseVal = scene.moon.phase ?? 0;
  const phaseRad = phaseVal * 2 * Math.PI;
  const liveOrbitalRx = 85 * s;
  const scalePxPerDeg = 8.5 * s;

  const moonX = earthX - Math.cos(phaseRad) * liveOrbitalRx;
  const moonY = earthY - beta * scalePxPerDeg;
  const moon: ProjectedBody2D = {
    x: moonX,
    y: moonY,
    r: 7.5 * s,
    visible: true,
    depth: Math.sin(phaseRad) * liveOrbitalRx
  };

  // 4. 4-Quadrant Segmented Lunar Orbit Paths
  const nodeAngleRad = toRadians(
    scene.moon.ascendingNodeLongitude !== undefined
      ? ((sunLambdaDeg - scene.moon.ascendingNodeLongitude) % 360 + 360) % 360
      : 0
  );

  const { waxAsc, waxDesc, wanAsc, wanDesc } = generateOrbitalSegments(
    earthX,
    earthY,
    liveOrbitalRx,
    scalePxPerDeg,
    nodeAngleRad,
    'side',
    72
  );

  const lunarOrbitSegments: LunarOrbitSegment2D[] = [
    { path: waxAsc.join(' '), stroke: '#38bdf8', isFront: true, isAscending: true },
    { path: waxDesc.join(' '), stroke: '#f43f5e', isFront: true, isAscending: false },
    { path: wanAsc.join(' '), stroke: '#38bdf8', strokeDasharray: '4 3', isFront: false, isAscending: true },
    { path: wanDesc.join(' '), stroke: '#f43f5e', strokeDasharray: '4 3', isFront: false, isAscending: false }
  ].filter(seg => seg.path.length > 0);

  // 5. Projected Syzygy Shadow Cones
  const umbraApexX = earthX + 180 * s;
  const penumbraRightX = earthX + 200 * s;
  const earthTopY = earthY - 18 * s;
  const earthBottomY = earthY + 18 * s;

  const shadowCones: ProjectedShadowCones2D = {
    umbraPath: `M ${earthX} ${earthTopY} L ${umbraApexX} ${earthY} L ${earthX} ${earthBottomY} Z`,
    penumbraPath: `M ${earthX} ${earthTopY} L ${penumbraRightX} ${earthY - 45 * s} L ${penumbraRightX} ${earthY + 45 * s} L ${earthX} ${earthBottomY} Z`,
    axisLine: {
      x1: sunX,
      y1: sunY,
      x2: penumbraRightX,
      y2: earthY
    }
  };

  return {
    camera: {
      name: 'transverse',
      viewport: vp
    },
    elements: {
      sun,
      earth,
      moon,
      orbitPath: `M 10 ${earthY} L 510 ${earthY}`, // Ecliptic reference centerline
      lunarOrbitSegments,
      shadowCones,
      milestones: []
    }
  };
}

/**
 * Pipeline 3: Down-the-barrel geocentric axial sightline projection.
 * 
 * Maps background Sun at (cx, cy), foreground Earth at (cx, cy), transverse elongation (X)
 * vs ecliptic latitude beta (Y) showing above/below miss geometry, and 3D projected axial tilt.
 * 
 * @param scene - Active CosmicScene3D state
 * @param options - Viewport dimensions or options object
 * @param height - Viewport height (if options is number)
 * @param scale - Viewport scale factor (if options is number)
 * @returns ProjectedScene2D model
 */
export function projectGeocentricAxial(
  scene: CosmicScene3D,
  options?: Partial<CameraOptions> | number,
  height?: number,
  scale?: number
): ProjectedScene2D {
  // Default to NodalPlaneVisualizer canvas dimensions (viewBox="0 0 400 180")
  const vp = resolveViewport(options, height, scale, 400, 180, 200, 90);
  const s = vp.scale;
  const cx = vp.centerX;
  const cy = vp.centerY;

  // 1. Background Sun Body (depth = -1000)
  const sun: ProjectedBody2D = {
    x: cx,
    y: cy,
    r: 38 * s,
    visible: true,
    depth: -1000
  };

  // 2. Foreground Earth Body with 3D Projected Axial Tilt
  const epsRad = scene.earth.obliquity;
  const sunLambdaDeg = scene.earth.heliocentricLongitude 
    ? ((scene.earth.heliocentricLongitude + 180) % 360) 
    : 0;
  const sunLambdaRad = toRadians(sunLambdaDeg);

  // Projected angle of North pole on axial screen plane
  const nx = -Math.sin(epsRad) * Math.cos(sunLambdaRad);
  const ny = Math.cos(epsRad);
  const axialTiltAngle2D = Math.atan2(-nx, ny) * (180 / Math.PI);

  const earth: ProjectedEarth2D = {
    x: cx,
    y: cy,
    r: 20 * s,
    visible: true,
    depth: 0,
    axialTiltAngle2D
  };

  // 3. Moon Position (Transverse elongation along X, Ecliptic latitude along Y)
  const beta = scene.moon.eclipticLatitude;
  const phaseVal = scene.moon.phase ?? 0;
  const phaseRad = phaseVal * 2 * Math.PI;
  const orbitalRx = 110 * s;
  const scalePxPerDeg = 8.5 * s;

  const moonX = cx + Math.sin(phaseRad) * orbitalRx;
  const moonY = cy - beta * scalePxPerDeg;
  const moon: ProjectedBody2D = {
    x: moonX,
    y: moonY,
    r: 8.5 * s,
    visible: true,
    depth: Math.cos(phaseRad) * orbitalRx
  };

  // 4. 4-Quadrant Axial Lunar Orbit Loop
  const nodeAngleRad = toRadians(
    scene.moon.ascendingNodeLongitude !== undefined
      ? ((sunLambdaDeg - scene.moon.ascendingNodeLongitude) % 360 + 360) % 360
      : 0
  );

  const { waxAsc, waxDesc, wanAsc, wanDesc } = generateOrbitalSegments(
    cx,
    cy,
    orbitalRx,
    scalePxPerDeg,
    nodeAngleRad,
    'axial',
    72
  );

  const lunarOrbitSegments: LunarOrbitSegment2D[] = [
    { path: waxAsc.join(' '), stroke: '#38bdf8', isFront: true, isAscending: true },
    { path: waxDesc.join(' '), stroke: '#f43f5e', isFront: true, isAscending: false },
    { path: wanAsc.join(' '), stroke: '#38bdf8', strokeDasharray: '4 3', isFront: false, isAscending: true },
    { path: wanDesc.join(' '), stroke: '#f43f5e', strokeDasharray: '4 3', isFront: false, isAscending: false }
  ].filter(seg => seg.path.length > 0);

  return {
    camera: {
      name: 'axial',
      viewport: vp
    },
    elements: {
      sun,
      earth,
      moon,
      orbitPath: `M 20 ${cy} L 380 ${cy}`, // Horizontal ecliptic plane (0 deg)
      lunarOrbitSegments,
      milestones: []
    }
  };
}

/**
 * Pipeline 4: Generalized 3D Euler Camera Projection.
 * 
 * Maps arbitrary 3D celestial bodies and rings through SO(3) Euler rotations
 * (Pitch, Yaw, Roll) with perspective or orthographic mapping and depth sorting.
 * 
 * @param scene - Active CosmicScene3D state
 * @param pitch - Camera pitch angle in degrees
 * @param yaw - Camera yaw angle in degrees
 * @param options - Viewport dimensions or options object
 * @param height - Viewport height (if options is number)
 * @param scale - Viewport scale factor (if options is number)
 * @returns ProjectedScene2D model
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

  // Project a 3D point into screen space
  const project3D = (p3d: Vector3D, radius: number = 0): { x: number; y: number; r: number; depth: number } => {
    const pCam = rotatePointEuler3D(p3d, pitchDeg, yawDeg, rollDeg);
    if (isPerspective) {
      const denom = Math.max(10, focalDistance + pCam.z);
      const factor = focalDistance / denom;
      return {
        x: cx + pCam.x * factor * s,
        y: cy - pCam.y * factor * s,
        r: radius * factor * s,
        depth: pCam.z
      };
    }
    return {
      x: cx + pCam.x * s,
      y: cy - pCam.y * s,
      r: radius * s,
      depth: pCam.z
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
      color: m.color,
      fillColor: m.fillColor,
      textColor: m.textColor,
      textAnchor: m.textAnchor,
      textDx: m.textDx,
      textDy: m.textDy,
      subDy: m.subDy,
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
