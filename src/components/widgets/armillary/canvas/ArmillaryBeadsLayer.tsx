import React from 'react';
import { 
  ArmillaryModelOutput, 
  ArmillaryProjectionMode, 
  ArmillaryMilestoneNode,
  ArmillaryLunarNodes,
  ArmillaryCameraState
} from '../types';
import { MiniGlobe } from '../../../common/MiniGlobe';
import { MiniMoon } from '../../../common/MiniMoon';
import { ArmillaryDefsIds, DEFAULT_ARMILLARY_DEFS_IDS } from './ArmillaryDefs';
import { ArmillaryNodesSublayer } from './ArmillaryNodesSublayer';
import { DEFAULT_OBSERVER_LATITUDE, DEFAULT_OBSERVER_LONGITUDE } from '../../../../utils/cosmicMath';
import { COSMIC_PALETTE } from '../../../common/designTokens';

export interface ArmillaryBeadsLayerProps {
  earth: ArmillaryModelOutput['earth'];
  sun: ArmillaryModelOutput['sun'];
  moon: ArmillaryModelOutput['moon'];
  milestones: ArmillaryMilestoneNode[];
  hoveredMilestone?: ArmillaryMilestoneNode | null;
  isDragging?: boolean;
  lunarNodes?: ArmillaryLunarNodes;
  projectionMode?: ArmillaryProjectionMode;
  morphLambda?: number;
  camera?: ArmillaryCameraState | { pitch?: number; yaw?: number; roll?: number };
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  sunLambdaDeg?: number;
  isOrbital?: boolean;
  orbitRingOpacity?: number;
  milestonesOpacity?: number;
  lunarOrbitOpacity?: number;
  showLunarNodes?: boolean;
  hoveredNode?: 'asc' | 'desc' | null;
  onHoverBead: (bead: 'sun' | 'moon' | 'earth' | null) => void;
  onHoverMilestone: (m: ArmillaryMilestoneNode | null) => void;
  onHoverNode: (node: 'asc' | 'desc' | null) => void;
  onTargetClick: (name: string, screenPos: { x: number; y: number }) => void;
  defsIds?: ArmillaryDefsIds;
}

export const ArmillaryBeadsLayer: React.FC<ArmillaryBeadsLayerProps> = ({
  earth,
  sun,
  moon,
  milestones,
  hoveredMilestone,
  lunarNodes,
  projectionMode,
  morphLambda,
  camera,
  latitude,
  longitude,
  timeOfDay = 12.0,
  sunLambdaDeg,
  isOrbital = false,
  isDragging = false,
  orbitRingOpacity = 1,
  milestonesOpacity = 1,
  lunarOrbitOpacity = 1,
  showLunarNodes = true,
  hoveredNode,
  onHoverBead,
  onHoverMilestone,
  onHoverNode,
  onTargetClick,
  defsIds = DEFAULT_ARMILLARY_DEFS_IDS
}) => {
  // Derive effective mode, morph progress lambda, and camera angles
  const effectiveLambda = morphLambda ?? 0;
  const isHeliocentric = projectionMode === 'heliocentric' || !!isOrbital;
  const isGeocentric = projectionMode === 'geocentric';

  // In 3D Apparent mode & 3D Heliocentric Orbit mode during 3D phase (effectiveLambda <= 0.45),
  // retain 3D Euler orientation for Earth and Moon.
  // In 2D astrolabe plate modes or once geometry flattens (effectiveLambda > 0.45), lock MiniGlobe viewMode="flat"
  let miniGlobeViewMode: 'topdown' | 'euler3d' | 'flat';
  if ((isHeliocentric || isGeocentric) && effectiveLambda <= 0.45) {
    miniGlobeViewMode = 'euler3d';
  } else {
    miniGlobeViewMode = 'flat';
  }

  const cameraPitch = camera?.pitch ?? 0;
  const cameraYaw = camera?.yaw ?? 0;
  const cameraRoll = camera?.roll ?? 0;

  const lat = latitude ?? DEFAULT_OBSERVER_LATITUDE;
  const lon = longitude ?? DEFAULT_OBSERVER_LONGITUDE;
  const sunLambda = sunLambdaDeg ?? (sun ? Number(sun.lambdaDeg ?? sun.raDeg ?? 0) : 0);

  const is3DView = miniGlobeViewMode === 'euler3d';

  // Determine globe position and radius
  // In plate modes or center geocentric mode, Earth is centered at (0, 0)
  // In orbital mode, Earth is at earth.screenPos
  const globeX = isHeliocentric ? earth.screenPos.x : (effectiveLambda > 0 ? 0 : earth.screenPos.x);
  const globeY = isHeliocentric ? earth.screenPos.y : (effectiveLambda > 0 ? 0 : earth.screenPos.y);

  // Radius matching plate proportions: flat mode uses 4.5px, 3D euler & topdown orbit modes use 4.8px
  const globeRadius = miniGlobeViewMode === 'flat' ? 4.5 : 4.8;

  // Dynamic light direction for Earth bead in Heliocentric Orbit mode:
  // The illuminated daylight crescent on the 2D globe must always point directly toward the central Sun on screen
  const sunAngleDeg = isHeliocentric
    ? ((Math.atan2(sun.screenPos.y - earth.screenPos.y, sun.screenPos.x - earth.screenPos.x) * 180) / Math.PI + 360) % 360
    : undefined;

  // Dynamic in-plane angle pointing from Moon to Sun in SVG screen coordinates
  const moonToSunAngleDeg = ((Math.atan2(sun.screenPos.y - moon.screenPos.y, sun.screenPos.x - moon.screenPos.x) * 180) / Math.PI + 360) % 360;
  const moonRadius = 2.6;

  return (
    <>
      {/* 1. Earth-Sun Connection Line in Orbital Modes */}
      {isOrbital && orbitRingOpacity > 0.05 && (
        <line
          x1={earth.screenPos.x}
          y1={earth.screenPos.y}
          x2={sun.screenPos.x}
          y2={sun.screenPos.y}
          stroke={COSMIC_PALETTE.amber}
          strokeWidth="0.75"
          strokeDasharray="3 3"
          opacity={lunarOrbitOpacity * 0.6}
          className="pointer-events-none"
        />
      )}

      {/* 2. Seasonal Milestone Nodes & Draconic Lunar Node Pins */}
      <ArmillaryNodesSublayer
        milestones={milestones}
        hoveredMilestone={hoveredMilestone}
        milestonesOpacity={milestonesOpacity}
        lunarNodes={lunarNodes}
        showLunarNodes={showLunarNodes}
        lunarOrbitOpacity={lunarOrbitOpacity}
        hoveredNode={hoveredNode}
        isDragging={isDragging}
        onHoverMilestone={onHoverMilestone}
        onHoverNode={onHoverNode}
        onTargetClick={onTargetClick}
      />

      {/* 3. Depth-Sorted Celestial Bodies (Earth, Sun, Moon) */}
      {(() => {
        const renderEarth = () => (
          <g
            key="bead-earth"
            className="cursor-pointer"
            style={{ touchAction: 'none' }}
            onPointerEnter={() => onHoverBead('earth')}
            onPointerLeave={() => onHoverBead(null)}
          >
            <MiniGlobe
              cx={globeX}
              cy={globeY}
              radius={globeRadius}
              viewMode={miniGlobeViewMode}
              camera={{
                pitch: cameraPitch,
                yaw: cameraYaw,
                roll: cameraRoll
              }}
              sunAngleDeg={sunAngleDeg}
              sunLambdaDeg={sunLambda}
              subsolarCameraVector={earth.subsolarCameraVector}
              declination={sun?.decDeg}
              rightAscension={sun?.raDeg}
              latitude={lat}
              longitude={lon}
              timeOfDay={timeOfDay}
              showTerminator={miniGlobeViewMode !== 'flat'}
              showTwilightBands={miniGlobeViewMode === 'euler3d'}
              showParallels={miniGlobeViewMode !== 'flat'}
              showPolarAxis={miniGlobeViewMode !== 'flat'}
              showObserverPin={true}
              showAtmosphereGlow={miniGlobeViewMode !== 'flat'}
              showLabel={false}
              onPointerEnter={() => onHoverBead('earth')}
              onPointerLeave={() => onHoverBead(null)}
            />

            {/* Monospace text label below globe */}
            {miniGlobeViewMode !== 'flat' && (
              <text
                x={globeX}
                y={globeY + globeRadius + 3.5}
                fontSize="3.2"
                fill="#38bdf8"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
                className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
              >
                {isGeocentric ? '⊕ EARTH (Center)' : '⊕ EARTH'}
              </text>
            )}
          </g>
        );

        const renderSun = () => (
          <g 
            key="bead-sun"
            filter={`url(#${defsIds.sunGlow})`}
            className="cursor-pointer"
            style={{ touchAction: 'none' }}
            onClick={(e) => {
              e.stopPropagation();
              onTargetClick('Sun (Sol)', sun.screenPos);
            }}
            onPointerEnter={() => onHoverBead('sun')}
            onPointerLeave={() => onHoverBead(null)}
          >
            {/* Invisible Touch Hitbox */}
            <circle
              cx={sun.screenPos.x}
              cy={sun.screenPos.y}
              r="12"
              fill="transparent"
            />
            {/* Ray to Earth / Center */}
            {(!isHeliocentric || effectiveLambda > 0.05) && (
              <line
                x1={globeX}
                y1={globeY}
                x2={sun.screenPos.x}
                y2={sun.screenPos.y}
                stroke="#f59e0b"
                strokeWidth="0.6"
                opacity="0.5"
              />
            )}
            {/* Outer Sun Corona */}
            <circle
              cx={sun.screenPos.x}
              cy={sun.screenPos.y}
              r="5.5"
              fill="#f59e0b"
              fillOpacity="0.25"
            />
            {/* Core Sun Bead */}
            <circle
              cx={sun.screenPos.x}
              cy={sun.screenPos.y}
              r="3.0"
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth="1.0"
            />
            <text
              x={sun.screenPos.x}
              y={sun.screenPos.y + 7.0}
              fontSize="3.5"
              fill="#fbbf24"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ☉ SUN
            </text>
          </g>
        );

        const renderMoon = () => (
          <g 
            key="bead-moon"
            filter={`url(#${defsIds.starGlow})`}
            className="cursor-pointer"
            style={{ touchAction: 'none' }}
            onClick={(e) => {
              e.stopPropagation();
              onTargetClick('Moon (Luna)', moon.screenPos);
            }}
            onPointerEnter={() => onHoverBead('moon')}
            onPointerLeave={() => onHoverBead(null)}
          >
            {/* Invisible Touch Hitbox */}
            <circle
              cx={moon.screenPos.x}
              cy={moon.screenPos.y}
              r="12"
              fill="transparent"
            />
            {/* Ray to Earth / Center */}
            <line
              x1={globeX}
              y1={globeY}
              x2={moon.screenPos.x}
              y2={moon.screenPos.y}
              stroke="#94a3b8"
              strokeWidth="0.6"
              opacity="0.4"
            />
            {/* Harmonized 3D MiniMoon Bead */}
            <MiniMoon
              cx={moon.screenPos.x}
              cy={moon.screenPos.y}
              radius={moonRadius}
              subsolarCameraVector={is3DView ? moon.subsolarCameraVector : null}
              phase={moon.phase}
              sunAngleDeg={moonToSunAngleDeg}
              stroke="#475569"
              strokeWidth={0.75}
              showCoronaGlow={true}
              coronaColor="#94a3b8"
            />
            <text
              x={moon.screenPos.x}
              y={moon.screenPos.y + 7.0}
              fontSize="3.5"
              fill="#cbd5e1"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ☽ MOON
            </text>
          </g>
        );

        // 3D camera depths for z-sorting celestial bodies (furthest to nearest)
        const earthZ = earth.pCam?.z ?? 0;
        const sunZ = sun.pCam?.z ?? 0;
        const moonZ = moon.pCam?.z ?? 0;

        const bodyItems = [
          { id: 'earth', z: earthZ, order: 0, render: renderEarth },
          { id: 'sun', z: sunZ, order: 1, render: renderSun },
          { id: 'moon', z: moonZ, order: 2, render: renderMoon }
        ];

        if (is3DView) {
          // Dynamic camera depth sorting: lowest z (furthest from camera) rendered first,
          // highest z (closest to camera) rendered last so foreground bodies occlude background bodies
          bodyItems.sort((a, b) => (a.z - b.z) || (a.order - b.order));
        }

        return bodyItems.map((item) => item.render());
      })()}
    </>
  );
};
