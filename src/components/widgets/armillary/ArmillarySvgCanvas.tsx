import React, { useState, useRef } from 'react';
import { 
  ArmillaryModelOutput, 
  ArmillaryProjectionMode, 
  HoveredStarInfo, 
  ArmillaryCameraState, 
  AlidadeSightingInfo,
  ArmillaryMilestoneNode
} from './types';
import { calculateAlidadeSighting } from '../../../utils/cosmicMath';
import { ArmillaryHoverHud } from './ArmillaryHoverHud';
import {
  ArmillaryDefs,
  ArmillaryBezelLayer,
  ArmillaryTympanLayer,
  ArmillaryLaserLayer,
  ArmillaryObserverConeLayer,
  ArmillaryRingsLayer,
  ArmillaryStarsLayer,
  ArmillaryBeadsLayer,
  ArmillaryAlidadeLayer
} from './canvas';
import { ArmillaryEarthPip } from './ArmillaryEarthPip';

export interface ArmillarySvgCanvasProps {
  model: ArmillaryModelOutput;
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  showRays: boolean;
  showStars: boolean;
  showTympan: boolean;
  showRule: boolean;
  camera: ArmillaryCameraState;
  onCameraChange: (cam: ArmillaryCameraState) => void;
  r0?: number;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  showObserverCone?: boolean;
  isFreeReteMode?: boolean;
  onFreeReteRotate?: (deltaDeg: number) => void;
  ruleAngleDeg?: number;
  onRuleAngleChange?: (angle: number) => void;
  onSnapToTarget?: (name: string, angleDeg: number) => void;
}

export const ArmillarySvgCanvas: React.FC<ArmillarySvgCanvasProps> = ({
  model,
  projectionMode,
  morphLambda,
  showRays,
  showStars,
  showTympan,
  showRule,
  showObserverCone = true,
  camera,
  onCameraChange,
  r0 = 100,
  latitude = 47.06,
  longitude = 15.44,
  timeOfDay = 12.0,
  isFreeReteMode = false,
  onFreeReteRotate,
  ruleAngleDeg: controlledRuleAngle,
  onRuleAngleChange,
  onSnapToTarget
}) => {
  const [hoveredStar, setHoveredStar] = useState<HoveredStarInfo | null>(null);
  const [hoveredBead, setHoveredBead] = useState<'sun' | 'moon' | 'earth' | 'observer' | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<ArmillaryMilestoneNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<'asc' | 'desc' | null>(null);
  const [localRuleAngle, setLocalRuleAngle] = useState<number>(0);
  const [isDraggingRule, setIsDraggingRule] = useState<boolean>(false);
  const [isDraggingCamera, setIsDraggingCamera] = useState<boolean>(false);
  const [isDraggingRete, setIsDraggingRete] = useState<boolean>(false);

  const ruleAngleDeg = controlledRuleAngle !== undefined ? controlledRuleAngle : localRuleAngle;
  const updateRuleAngle = (angle: number) => {
    setLocalRuleAngle(angle);
    if (onRuleAngleChange) onRuleAngleChange(angle);
  };

  const dragStartRef = useRef<{ x: number; y: number; pitch: number; yaw: number; reteStartAngle: number }>({
    x: 0,
    y: 0,
    pitch: 0,
    yaw: 0,
    reteStartAngle: 0
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { 
    rings, 
    almucantars, 
    stars, 
    sun, 
    moon, 
    earth, 
    milestones, 
    localSiderealTimeDeg, 
    focalBeacon, 
    observerCone,
    lunarNodes,
    physics,
    celestialRingsOpacity,
    orbitRingOpacity,
    lunarOrbitOpacity,
    milestonesOpacity,
    starsOpacity,
    bezelOpacity,
    alidadeOpacity
  } = model;

  const isOrbital = projectionMode === 'heliocentric';
  const is3D = projectionMode === 'geocentric' || projectionMode === 'heliocentric' || morphLambda <= 0.05;
  const isTympanVisible = (projectionMode === 'stereographic' || projectionMode === 'horizon') && morphLambda >= 0.15;

  // Calculate live Alidade sighting telemetry
  const sightingInfo: AlidadeSightingInfo | null = showRule
    ? calculateAlidadeSighting(ruleAngleDeg, latitude, localSiderealTimeDeg, stars, sun, moon)
    : null;

  // --- Mouse / Pointer Drag for 3D Camera, Free Rete, and Alidade ---
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRule) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

      // In Free Rete mode on 2D plate or 3D sphere, grab and spin the Rete
      if (isFreeReteMode && distFromCenter > 15) {
        setIsDraggingRete(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          pitch: camera.pitch,
          yaw: camera.yaw,
          reteStartAngle: angle
        };
        return;
      }
    }

    if (is3D) {
      setIsDraggingCamera(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        pitch: camera.pitch,
        yaw: camera.yaw,
        reteStartAngle: 0
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRule && svgRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
      updateRuleAngle(angle);
      return;
    }

    if (isDraggingRete && svgRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const currAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      let deltaAngle = currAngle - dragStartRef.current.reteStartAngle;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      if (onFreeReteRotate) {
        onFreeReteRotate(deltaAngle);
      }
      dragStartRef.current.reteStartAngle = currAngle;
      return;
    }

    if (!isDraggingCamera) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newYaw = (dragStartRef.current.yaw + dx * 0.6 + 360) % 360;
    const newPitch = Math.max(-85, Math.min(85, dragStartRef.current.pitch + dy * 0.6));

    onCameraChange({
      pitch: newPitch,
      yaw: newYaw,
      roll: 0
    });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    setIsDraggingCamera(false);
    setIsDraggingRule(false);
    setIsDraggingRete(false);
  };

  const handleTargetClick = (name: string, screenPos: { x: number; y: number }) => {
    const angle = (Math.atan2(screenPos.y, screenPos.x) * 180 / Math.PI + 90 + 360) % 360;
    updateRuleAngle(angle);
    if (onSnapToTarget) {
      onSnapToTarget(name, angle);
    }
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden min-h-[360px]"
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Free Rete Interactive Guidance Badge */}
      {isFreeReteMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-slate-950/90 backdrop-blur-md border border-amber-500/40 px-3 py-1 rounded-full text-[11px] font-mono text-amber-300 shadow-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Free Solver: Drag golden Rete to calculate local time</span>
        </div>
      )}

      {/* SVG Canvas Container */}
      <svg
        ref={svgRef}
        viewBox="-150 -150 300 300"
        style={{ touchAction: 'none' }}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`w-full h-full max-h-[560px] drop-shadow-2xl transition-cursor ${
          isDraggingRule 
            ? 'cursor-grab active:cursor-grabbing' 
            : isFreeReteMode 
              ? 'cursor-grab active:cursor-grabbing' 
              : (is3D ? 'cursor-move' : 'cursor-default')
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          setIsDraggingCamera(false);
          setIsDraggingRule(false);
          setHoveredStar(null);
          setHoveredBead(null);
        }}
      >
        {/* 0. SVG Defs & Glow Filters */}
        <ArmillaryDefs />

        {/* 1. Outer Precision Bezel (SED Hairline Double-Grooved Bezel) */}
        <ArmillaryBezelLayer bezelOpacity={bezelOpacity} />

        {/* 2. Volumetric Laser Projection Beacon & Ray Cones */}
        <ArmillaryLaserLayer 
          showRays={showRays} 
          focalBeacon={focalBeacon} 
          isOrbital={isOrbital} 
        />

        {/* 2b. Topocentric Observer Field of View (FOV) Sky Cone & Observer Pin */}
        <ArmillaryObserverConeLayer
          observerCone={observerCone}
          orbitRingOpacity={orbitRingOpacity}
          showObserverCone={showObserverCone}
          onHoverBead={(b) => setHoveredBead(b)}
        />

        {/* 3. Tympan Altitude Circles (Muted Progressive Almucantars) */}
        <ArmillaryTympanLayer
          showTympan={showTympan}
          isTympanVisible={isTympanVisible}
          morphLambda={morphLambda}
          celestialRingsOpacity={celestialRingsOpacity}
          almucantars={almucantars}
        />

        {/* 4 & 5. Depth-Sorted Celestial & Orbital Rings + Zodiac Glyphs */}
        <ArmillaryRingsLayer
          rings={rings}
          is3D={is3D}
          morphLambda={morphLambda}
          cameraPitch={camera.pitch}
          orbitRingOpacity={orbitRingOpacity}
          celestialRingsOpacity={celestialRingsOpacity}
          lunarOrbitOpacity={lunarOrbitOpacity}
        />

        {/* 6. Navigational Astrolabe Stars (Click to Snap) */}
        <ArmillaryStarsLayer
          stars={stars}
          showStars={showStars}
          starsOpacity={starsOpacity}
          hoveredStar={hoveredStar}
          onHoverStar={setHoveredStar}
          onTargetClick={handleTargetClick}
        />

        {/* 7. Planetary Beads (Earth, Sun clamped to Ecliptic track, Moon, Milestones, Nodes) */}
        <ArmillaryBeadsLayer
          earth={earth}
          sun={sun}
          moon={moon}
          milestones={milestones}
          lunarNodes={lunarNodes}
          projectionMode={projectionMode}
          isOrbital={isOrbital}
          orbitRingOpacity={orbitRingOpacity}
          milestonesOpacity={milestonesOpacity}
          lunarOrbitOpacity={lunarOrbitOpacity}
          onHoverBead={setHoveredBead}
          onHoverMilestone={setHoveredMilestone}
          onHoverNode={setHoveredNode}
          onTargetClick={handleTargetClick}
        />

        {/* 8. Interactive Astrolabe Rule (SED Hairline Alidade Sighting Arm) */}
        <ArmillaryAlidadeLayer
          showRule={showRule}
          alidadeOpacity={alidadeOpacity}
          ruleAngleDeg={ruleAngleDeg}
          onPointerDownRule={(e) => {
            e.preventDefault();
            e.stopPropagation();
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
            setIsDraggingRule(true);
          }}
        />

        {/* Center Origin Pivot Pin (Hidden when Earth is at center) */}
        {projectionMode !== 'geocentric' && (
          <circle cx="0" cy="0" r="2.0" fill="#f59e0b" stroke="#78350f" strokeWidth="0.75" />
        )}
      </svg>

      {/* Glassmorphic Sighting & Star/Sun/Moon/Earth/Observer/Milestone Hover Telemetry HUD */}
      <ArmillaryHoverHud
        hoveredStar={hoveredStar}
        hoveredBead={hoveredBead}
        hoveredMilestone={hoveredMilestone}
        hoveredNode={hoveredNode}
        lunarNodes={lunarNodes}
        showRule={showRule}
        sightingInfo={sightingInfo}
        sun={sun}
        moon={moon}
        earth={earth}
        physics={physics}
        observerCone={observerCone}
        latitude={latitude}
        longitude={longitude}
      />

      {/* Picture-in-Picture Living Marble Inset in Heliocentric Orbit Mode */}
      <ArmillaryEarthPip
        camera={camera}
        latitude={latitude}
        longitude={longitude}
        timeOfDay={timeOfDay}
        sunLambdaDeg={sun?.lambdaDeg ?? sun?.raDeg ?? 0}
        declination={sun?.decDeg}
        rightAscension={sun?.raDeg}
        projectionMode={projectionMode}
        morphLambda={morphLambda}
        onCameraChange={onCameraChange}
      />
    </div>
  );
};
