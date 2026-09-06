import React from 'react';
import { 
  ArmillaryModelOutput, 
  ArmillaryProjectionMode, 
  ArmillaryMilestoneNode,
  ArmillaryLunarNodes,
  ArmillaryCameraState
} from '../types';
import { MiniGlobe } from '../../../common/MiniGlobe';

export interface ArmillaryBeadsLayerProps {
  earth: ArmillaryModelOutput['earth'];
  sun: ArmillaryModelOutput['sun'];
  moon: ArmillaryModelOutput['moon'];
  milestones: ArmillaryMilestoneNode[];
  lunarNodes?: ArmillaryLunarNodes;
  projectionMode?: ArmillaryProjectionMode;
  modelType?: 'orbit' | 'apparent' | 'rete' | 'rojas' | 'horizon' | 'heliocentric' | 'geocentric' | 'stereographic';
  morphLambda?: number;
  lambda?: number;
  camera?: ArmillaryCameraState | { pitch?: number; yaw?: number; roll?: number };
  pitch?: number;
  yaw?: number;
  roll?: number;
  observerLat?: number;
  observerLon?: number;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  sunLambdaDeg?: number;
  isOrbital?: boolean;
  orbitRingOpacity?: number;
  milestonesOpacity?: number;
  lunarOrbitOpacity?: number;
  onHoverBead: (bead: 'sun' | 'moon' | 'earth' | null) => void;
  onHoverMilestone: (m: ArmillaryMilestoneNode | null) => void;
  onHoverNode: (node: 'asc' | 'desc' | null) => void;
  onTargetClick: (name: string, screenPos: { x: number; y: number }) => void;
}

export const ArmillaryBeadsLayer: React.FC<ArmillaryBeadsLayerProps> = ({
  earth,
  sun,
  moon,
  milestones,
  lunarNodes,
  projectionMode,
  modelType,
  morphLambda,
  lambda,
  camera,
  pitch,
  yaw,
  roll,
  observerLat,
  observerLon,
  latitude,
  longitude,
  timeOfDay = 12.0,
  sunLambdaDeg,
  isOrbital = false,
  orbitRingOpacity = 1,
  milestonesOpacity = 1,
  lunarOrbitOpacity = 1,
  onHoverBead,
  onHoverMilestone,
  onHoverNode,
  onTargetClick
}) => {
  // Derive effective mode, morph progress lambda, and camera angles
  const effectiveLambda = morphLambda !== undefined ? morphLambda : (lambda !== undefined ? lambda : 0);
  const rawMode = modelType ?? projectionMode ?? 'apparent';

  const isHeliocentric = rawMode === 'heliocentric' || rawMode === 'orbit' || !!isOrbital;
  const isGeocentric = rawMode === 'geocentric' || rawMode === 'apparent';

  // In 3D Apparent mode (modelType === 'apparent' / geocentric and lambda === 0), pass viewMode="euler3d"
  // In 2D astrolabe plate modes ('rete', 'rojas', 'horizon', 'stereographic') or when morphing (lambda > 0), lock MiniGlobe viewMode="flat"
  // In Heliocentric orbit mode, pass viewMode="topdown"
  let miniGlobeViewMode: 'topdown' | 'euler3d' | 'flat';
  if (isHeliocentric && effectiveLambda === 0) {
    miniGlobeViewMode = 'topdown';
  } else if (isGeocentric && effectiveLambda === 0) {
    miniGlobeViewMode = 'euler3d';
  } else {
    miniGlobeViewMode = 'flat';
  }

  const cameraPitch = camera?.pitch ?? pitch ?? 0;
  const cameraYaw = camera?.yaw ?? yaw ?? 0;
  const cameraRoll = camera?.roll ?? roll ?? 0;

  const lat = observerLat ?? latitude ?? 47.06;
  const lon = observerLon ?? longitude ?? -122.81;
  const sunLambda = sunLambdaDeg ?? (sun ? Number(sun.lambdaDeg ?? sun.raDeg ?? 0) : 0);

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

  return (
    <>
      {/* 1. Earth-Sun Connection Line in Orbital Modes */}
      {isOrbital && orbitRingOpacity > 0.05 && (
        <line
          x1={earth.screenPos.x}
          y1={earth.screenPos.y}
          x2={sun.screenPos.x}
          y2={sun.screenPos.y}
          stroke="#fbbf24"
          strokeWidth="0.75"
          strokeDasharray="3 3"
          opacity={orbitRingOpacity * 0.6}
          className="pointer-events-none"
        />
      )}

      {/* 2. Seasonal Milestone Nodes (Heliocentric / Geocentric) */}
      {milestonesOpacity > 0.05 && milestones.map((m) => (
        <g
          key={m.id}
          className="cursor-pointer transition-transform hover:scale-110"
          style={{ touchAction: 'none' }}
          opacity={milestonesOpacity * (m.isFront ? 1.0 : 0.4)}
          onPointerEnter={() => onHoverMilestone(m)}
          onPointerLeave={() => onHoverMilestone(null)}
        >
          {/* Invisible Touch Hitbox */}
          <circle
            cx={m.screenPos.x}
            cy={m.screenPos.y}
            r="10"
            fill="transparent"
          />
          {/* Milestone Halo */}
          <circle
            cx={m.screenPos.x}
            cy={m.screenPos.y}
            r="4.5"
            fill={m.color}
            fillOpacity="0.2"
            stroke={m.color}
            strokeWidth="0.6"
            strokeDasharray="2 2"
          />
          {/* Milestone Core */}
          <circle
            cx={m.screenPos.x}
            cy={m.screenPos.y}
            r="2.0"
            fill={m.color}
            stroke="#ffffff"
            strokeWidth="0.75"
          />
          {/* Milestone Label */}
          <text
            x={m.screenPos.x}
            y={m.screenPos.y - 5.5}
            fontSize="3.0"
            fill={m.color}
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
          >
            {m.label}
          </text>
        </g>
      ))}

      {/* 4. High-Precision Earth Mini-Globe with 3D Euler Orientation / 2D Flat Plate Pin */}
      <g
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

      {/* 3. Lunar Nodes (Ascending ☊ & Descending ☋ Pins on Inclined Orbit - Helio Mode Only) */}
      {lunarNodes && isHeliocentric && lunarOrbitOpacity > 0.05 && (
        <g 
          className="transition-opacity duration-200"
          style={{ opacity: lunarOrbitOpacity }}
        >
          {/* Ascending Node ☊ (Northbound crossing into northern ecliptic hemisphere) */}
          <g
            className="cursor-pointer"
            style={{ 
              touchAction: 'none',
              opacity: lunarNodes.ascendingNode.isFront ? 1.0 : 0.45 
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTargetClick('Ascending Node (☊)', lunarNodes.ascendingNode.screenPos);
            }}
            onPointerEnter={() => onHoverNode('asc')}
            onPointerLeave={() => onHoverNode(null)}
          >
            {/* Touch Hitbox */}
            <circle
              cx={lunarNodes.ascendingNode.screenPos.x}
              cy={lunarNodes.ascendingNode.screenPos.y}
              r="8"
              fill="transparent"
            />
            {/* Outer Halo */}
            <circle
              cx={lunarNodes.ascendingNode.screenPos.x}
              cy={lunarNodes.ascendingNode.screenPos.y}
              r="3.8"
              fill="#38bdf8"
              fillOpacity="0.25"
            />
            {/* Core Pin */}
            <circle
              cx={lunarNodes.ascendingNode.screenPos.x}
              cy={lunarNodes.ascendingNode.screenPos.y}
              r="2.0"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.6"
            />
            <text
              x={lunarNodes.ascendingNode.screenPos.x}
              y={lunarNodes.ascendingNode.screenPos.y - 4.2}
              fontSize="3.2"
              fill="#38bdf8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ☊
            </text>
          </g>

          {/* Descending Node ☋ (Southbound crossing into southern ecliptic hemisphere) */}
          <g
            className="cursor-pointer"
            style={{ 
              touchAction: 'none',
              opacity: lunarNodes.descendingNode.isFront ? 1.0 : 0.45 
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTargetClick('Descending Node (☋)', lunarNodes.descendingNode.screenPos);
            }}
            onPointerEnter={() => onHoverNode('desc')}
            onPointerLeave={() => onHoverNode(null)}
          >
            {/* Touch Hitbox */}
            <circle
              cx={lunarNodes.descendingNode.screenPos.x}
              cy={lunarNodes.descendingNode.screenPos.y}
              r="8"
              fill="transparent"
            />
            {/* Outer Halo */}
            <circle
              cx={lunarNodes.descendingNode.screenPos.x}
              cy={lunarNodes.descendingNode.screenPos.y}
              r="3.8"
              fill="#f43f5e"
              fillOpacity="0.25"
            />
            {/* Core Pin */}
            <circle
              cx={lunarNodes.descendingNode.screenPos.x}
              cy={lunarNodes.descendingNode.screenPos.y}
              r="2.0"
              fill="#f43f5e"
              stroke="#ffffff"
              strokeWidth="0.6"
            />
            <text
              x={lunarNodes.descendingNode.screenPos.x}
              y={lunarNodes.descendingNode.screenPos.y - 4.2}
              fontSize="3.2"
              fill="#f43f5e"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ☋
            </text>
          </g>
        </g>
      )}

      {/* 4. Sun Bead (Golden Orb with Radial Corona - Click to Snap) */}
      <g 
        filter="url(#sunGlow)"
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
        {/* Ray to Origin */}
        <line
          x1="0"
          y1="0"
          x2={sun.screenPos.x}
          y2={sun.screenPos.y}
          stroke="#f59e0b"
          strokeWidth="0.6"
          opacity="0.5"
        />
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

      {/* 6. Moon Bead (Gray/Silver Phase Disc - Click to Snap) */}
      <g 
        filter="url(#starGlow)"
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
        {/* Ray to Origin */}
        <line
          x1="0"
          y1="0"
          x2={moon.screenPos.x}
          y2={moon.screenPos.y}
          stroke="#94a3b8"
          strokeWidth="0.6"
          opacity="0.4"
        />
        {/* Moon Corona Glow */}
        <circle
          cx={moon.screenPos.x}
          cy={moon.screenPos.y}
          r="4.8"
          fill="#94a3b8"
          fillOpacity="0.2"
        />
        {/* Moon Core */}
        <circle
          cx={moon.screenPos.x}
          cy={moon.screenPos.y}
          r="2.6"
          fill="#e2e8f0"
          stroke="#475569"
          strokeWidth="1.0"
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
    </>
  );
};
