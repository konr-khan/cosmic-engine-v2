import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  ArmillaryModelOutput, 
  ArmillaryProjectionMode, 
  ArmillaryCameraState, 
  AlidadeSightingInfo
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
import { useArmillaryInteractions } from './useArmillaryInteractions';

export interface ArmillarySvgCanvasProps {
  model: ArmillaryModelOutput;
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  showRays: boolean;
  showStars: boolean;
  showTympan: boolean;
  showRule: boolean;
  showLunarNodes?: boolean;
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
  showLunarNodes = true,
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
  const {
    svgRef,
    viewBoxStr,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isOrbital,
    is3D,
    isZoomable,
    isDraggingRule,
    isDraggingCamera,
    isDragging,
    hoveredStar,
    setHoveredStar,
    hoveredBead,
    setHoveredBead,
    hoveredMilestone,
    setHoveredMilestone,
    hoveredNode,
    setHoveredNode,
    ruleAngleDeg,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handlePointerDownRule,
    handleTargetClick
  } = useArmillaryInteractions({
    camera,
    onCameraChange,
    projectionMode,
    morphLambda,
    isFreeReteMode,
    onFreeReteRotate,
    controlledRuleAngle,
    onRuleAngleChange,
    onSnapToTarget
  });

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

  const isTympanVisible = (projectionMode === 'stereographic' || projectionMode === 'horizon') && morphLambda >= 0.15;

  // Calculate live Alidade sighting telemetry
  const sightingInfo: AlidadeSightingInfo | null = showRule
    ? calculateAlidadeSighting(ruleAngleDeg, latitude, localSiderealTimeDeg, stars, sun, moon)
    : null;

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
        viewBox={viewBoxStr}
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
        onPointerLeave={handlePointerLeave}
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
          morphLambda={morphLambda}
        />

        {/* 2b. Topocentric Observer Field of View (FOV) Sky Cone & Observer Pin */}
        <ArmillaryObserverConeLayer
          observerCone={observerCone}
          orbitRingOpacity={orbitRingOpacity}
          showObserverCone={showObserverCone}
          morphLambda={morphLambda}
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
          hoveredMilestone={isDraggingCamera ? null : hoveredMilestone}
          isDragging={isDragging}
          lunarNodes={lunarNodes}
          projectionMode={projectionMode}
          isOrbital={isOrbital}
          orbitRingOpacity={orbitRingOpacity}
          milestonesOpacity={milestonesOpacity}
          lunarOrbitOpacity={lunarOrbitOpacity}
          camera={camera}
          morphLambda={morphLambda}
          latitude={latitude}
          longitude={longitude}
          timeOfDay={timeOfDay}
          sunLambdaDeg={sun?.lambdaDeg ?? sun?.raDeg ?? 0}
          showLunarNodes={showLunarNodes}
          hoveredNode={hoveredNode}
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
          onPointerDownRule={handlePointerDownRule}
        />

        {/* Center Origin Pivot Pin (Alidade center pivot screw) */}
        {showRule && !isOrbital && (
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
        subsolarCameraVector={earth?.subsolarCameraVector}
        projectionMode={projectionMode}
        morphLambda={morphLambda}
        onCameraChange={onCameraChange}
      />

      {/* 3D Orbit & Apparent View Zoom Controls */}
      {isZoomable && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-lg p-1 shadow-xl font-mono text-[10px] select-none pointer-events-auto transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              zoomOut();
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-sky-400 font-semibold min-w-[34px] text-center">
            {zoom.toFixed(1)}×
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              zoomIn();
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom !== 1.0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetZoom();
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer ml-0.5 border-l border-slate-800/80 pl-1.5"
              title="Reset Zoom (1.0×)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
