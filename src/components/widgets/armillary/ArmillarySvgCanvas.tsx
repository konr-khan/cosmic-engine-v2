import React, { useState, useRef, useCallback } from 'react';
import { 
  ArmillaryModelOutput, 
  ArmillaryProjectionMode, 
  HoveredStarInfo, 
  ArmillaryCameraState, 
  AlidadeSightingInfo,
  ArmillaryMilestoneNode
} from './types';
import { ZODIAC_SIGNS, calculateAlidadeSighting, toRadians } from '../../../utils/cosmicMath';
import { ArmillaryHoverHud } from './ArmillaryHoverHud';

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
  camera,
  onCameraChange,
  r0 = 100,
  latitude = 47.06,
  longitude = 15.44,
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
    apparentSolarHours, 
    physics,
    celestialRingsOpacity,
    orbitRingOpacity,
    lunarOrbitOpacity,
    milestonesOpacity,
    starsOpacity,
    bezelOpacity,
    alidadeOpacity
  } = model;

  const isOrbital = projectionMode === 'heliocentric' || projectionMode === 'geocentric';
  const is3D = projectionMode === '3D' || (morphLambda <= 0.05 && !isOrbital);
  const isStereo2D = morphLambda >= 0.95 && projectionMode === 'stereographic';

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

    setIsDraggingCamera(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pitch: camera.pitch,
      yaw: camera.yaw,
      reteStartAngle: 0
    };
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
        <defs>
          {/* Radial Gradient for Outer Brass Mater Rim */}
          <radialGradient id="brassRim" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#1e293b" stopOpacity="0.8" />
            <stop offset="96%" stopColor="#451a03" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
          </radialGradient>

          {/* Glow Filters */}
          <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="laserConeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* 1. Outer Precision Bezel (SED Hairline Double-Grooved Bezel) */}
        {bezelOpacity > 0.01 && (
          <g opacity={bezelOpacity} className="transition-opacity duration-300 pointer-events-none">
            {/* Outer Double-Grooved Rings */}
            <circle cx="0" cy="0" r="140" fill="none" stroke="#b45309" strokeWidth="0.75" />
            <circle cx="0" cy="0" r="134" fill="#020617" fillOpacity="0.85" stroke="#78350f" strokeWidth="0.75" />

            {/* 360-degree Precision Micro-Ticks */}
            {Array.from({ length: 72 }).map((_, i) => {
              const deg = i * 5;
              const rad = (deg * Math.PI) / 180;
              const isMajor = deg % 30 === 0;
              const isMid = deg % 15 === 0;
              const rInner = isMajor ? 134 : (isMid ? 136 : 137.5);
              const rOuter = 140;

              const x1 = rInner * Math.sin(rad);
              const y1 = -rInner * Math.cos(rad);
              const x2 = rOuter * Math.sin(rad);
              const y2 = -rOuter * Math.cos(rad);

              return (
                <line
                  key={`tick-${deg}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? '#f59e0b' : '#78350f'}
                  strokeWidth={isMajor ? 0.75 : 0.5}
                  opacity={isMajor ? 0.9 : 0.6}
                />
              );
            })}

            {/* 24-Hour Markers on Outer Limb (SED Micro-Typography) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const hour = i;
              const deg = hour * 15;
              const rad = (deg * Math.PI) / 180;
              const rText = 127;
              const x = rText * Math.sin(rad);
              const y = -rText * Math.cos(rad);

              const romanHours = [
                'XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI',
                'XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'
              ];

              return (
                <text
                  key={`hour-${i}`}
                  x={x}
                  y={y}
                  fontSize="3.8"
                  fill="#fbbf24"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity="0.8"
                >
                  {romanHours[i]}
                </text>
              );
            })}
          </g>
        )}

        {/* 2. Volumetric Laser Projection Beacon & Ray Cones (For 2D/3D Astrolabe Plates) */}
        {showRays && focalBeacon && !isOrbital && (
          <g filter="url(#laserGlow)" className="pointer-events-none">
            {/* Translucent Conic Projection Light Wash */}
            {focalBeacon.conePathD && (
              <path
                d={focalBeacon.conePathD}
                fill="url(#laserConeGradient)"
                stroke="#38bdf8"
                strokeWidth="0.5"
                strokeDasharray="4 2"
                opacity="0.75"
              />
            )}

            {/* Radiating Laser Rays from Focal Pole through Celestial Circles */}
            {focalBeacon.laserRays.map((ray, idx) => (
              <line
                key={`laser-ray-${idx}`}
                x1={ray.start.x}
                y1={ray.start.y}
                x2={ray.end.x}
                y2={ray.end.y}
                stroke={ray.color}
                strokeWidth="1.0"
                strokeDasharray="2 3"
                opacity={ray.opacity}
              />
            ))}

            {/* Glowing Projection Focal Pole Beacon */}
            <circle
              cx={focalBeacon.focalScreenPos.x}
              cy={focalBeacon.focalScreenPos.y}
              r="5"
              fill="#38bdf8"
              fillOpacity="0.3"
            />
            <circle
              cx={focalBeacon.focalScreenPos.x}
              cy={focalBeacon.focalScreenPos.y}
              r="2.5"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.0"
            />
            <text
              x={focalBeacon.focalScreenPos.x}
              y={focalBeacon.focalScreenPos.y + 7.5}
              fontSize="3.0"
              fill="#38bdf8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              ⌖ FOCAL BEACON
            </text>
          </g>
        )}

        {/* 2b. Topocentric Observer Field of View (FOV) Sky Cone (In Heliocentric & Geocentric Modes) */}
        {observerCone && orbitRingOpacity > 0.05 && (
          <g className="pointer-events-none">
            {/* Local Horizon Tangent Disc (Alt = 0°) */}
            {observerCone.horizonDiscPathD && (
              <path
                d={observerCone.horizonDiscPathD}
                fill="#06b6d4"
                fillOpacity="0.15"
                stroke="#06b6d4"
                strokeWidth="0.6"
                strokeDasharray="2 2"
              />
            )}

            {/* Translucent Observer Sky Cone Envelope */}
            {observerCone.conePathD && (
              <path
                d={observerCone.conePathD}
                fill={observerCone.isDaytime ? '#38bdf8' : '#818cf8'}
                fillOpacity="0.18"
                stroke={observerCone.isDaytime ? '#38bdf8' : '#818cf8'}
                strokeWidth="0.5"
                strokeDasharray="3 2"
                opacity="0.85"
              />
            )}

            {/* Zenith Ray Line pointing outward from Observer */}
            <line
              x1={observerCone.zenithRay.start.x}
              y1={observerCone.zenithRay.start.y}
              x2={observerCone.zenithRay.end.x}
              y2={observerCone.zenithRay.end.y}
              stroke="#38bdf8"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.85"
            />

            {/* Observer Zenith Target Marker */}
            <circle
              cx={observerCone.zenithScreenPos.x}
              cy={observerCone.zenithScreenPos.y}
              r="1.6"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
            <text
              x={observerCone.zenithScreenPos.x}
              y={observerCone.zenithScreenPos.y - 3.2}
              fontSize="2.8"
              fill="#38bdf8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              ZENITH
            </text>
          </g>
        )}

        {/* 3. Tympan Altitude Circles (Muted Almucantars) */}
        {showTympan && isStereo2D && celestialRingsOpacity > 0.05 && (
          <g className="pointer-events-none" opacity={0.35 * celestialRingsOpacity}>
            {almucantars.map((a) => (
              <circle
                key={`almucantar-${a.altitude}`}
                cx="0"
                cy={-a.centerY}
                r={a.radius}
                fill="none"
                stroke={a.isHorizon ? '#06b6d4' : '#64748b'}
                strokeWidth={a.isHorizon ? 1.0 : 0.5}
                strokeDasharray={a.isHorizon ? 'none' : '3,3'}
              />
            ))}
          </g>
        )}

        {/* 4. Back Ring Segments (Depth Sorted: zCam < 0) */}
        <g>
          {rings.map((ring) => {
            const isOrbitPath = ring.id === 'orbit_path';
            const ringOpacity = isOrbitPath ? orbitRingOpacity : celestialRingsOpacity;
            if (ringOpacity <= 0.01) return null;

            return (
              <path
                key={`back-${ring.id}`}
                d={is3D ? ring.backPathD : ring.fullPathD}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.backStrokeWidth}
                strokeDasharray={is3D ? '3,2' : 'none'}
                opacity={ringOpacity * (is3D ? 0.35 : 0.85)}
              />
            );
          })}
        </g>

        {/* 5. Front Ring Segments (Depth Sorted: zCam >= 0) */}
        <g filter="url(#ringGlow)">
          {rings.map((ring) => {
            const isOrbitPath = ring.id === 'orbit_path';
            const ringOpacity = isOrbitPath ? orbitRingOpacity : celestialRingsOpacity;
            if (ringOpacity <= 0.01) return null;

            return (
              <path
                key={`front-${ring.id}`}
                d={ring.frontPathD}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.frontStrokeWidth}
                opacity={ringOpacity}
              />
            );
          })}
        </g>

        {/* 6. Zodiac Ecliptic Rete Segments & Glyphs */}
        {celestialRingsOpacity > 0.05 && ZODIAC_SIGNS.map((sign, idx) => {
          const eclRing = rings.find((r) => r.id === 'ecliptic');
          if (!eclRing || eclRing.vertices.length === 0) return null;

          const midIndex = Math.floor(((idx * 30 + 15) / 360) * (eclRing.vertices.length - 1));
          const v = eclRing.vertices[midIndex];
          if (!v) return null;

          return (
            <g key={`zodiac-${sign.name}`} opacity={celestialRingsOpacity}>
              <circle
                cx={v.screenPos.x}
                cy={v.screenPos.y}
                r="1.0"
                fill={sign.color}
              />
              <text
                x={v.screenPos.x}
                y={v.screenPos.y - 2.8}
                fontSize="4.2"
                fill={sign.color}
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none drop-shadow"
              >
                {sign.symbol}
              </text>
            </g>
          );
        })}

        {/* 7. Navigational Astrolabe Stars with Precision Pointers (Click to Snap) */}
        {showStars && starsOpacity > 0.05 && (
          <g filter="url(#starGlow)" opacity={starsOpacity}>
            {stars.map((star) => {
              const starRadius = Math.max(1.2, 3.2 - (star.magnitude + 1.5) * 0.6);
              const isHovered = hoveredStar?.id === star.id;

              return (
                <g 
                  key={star.id}
                  className="cursor-pointer transition-all"
                  onClick={() => handleTargetClick(star.name, star.screenPos)}
                  onPointerEnter={(e) => {
                    e.stopPropagation();
                    setHoveredStar({
                      ...star,
                      screenX: star.screenPos.x,
                      screenY: star.screenPos.y
                    });
                  }}
                  onPointerLeave={() => setHoveredStar(null)}
                >
                  {/* Gothic Flamme / Star Pointer */}
                  <line
                    x1={0}
                    y1={0}
                    x2={star.screenPos.x}
                    y2={star.screenPos.y}
                    stroke="#f59e0b"
                    strokeWidth="0.4"
                    strokeDasharray="2,2"
                    opacity={isHovered ? 0.9 : 0.25}
                  />

                  {/* Star Pointer Diamond Core */}
                  <circle
                    cx={star.screenPos.x}
                    cy={star.screenPos.y}
                    r={starRadius}
                    fill={isHovered ? '#fbbf24' : '#e0f2fe'}
                    stroke="#0284c7"
                    strokeWidth={isHovered ? 1.2 : 0.6}
                  />

                  {/* Star Label */}
                  <text
                    x={star.screenPos.x + 2.5}
                    y={star.screenPos.y - 2.5}
                    fontSize="3.2"
                    fill={isHovered ? '#fbbf24' : '#94a3b8'}
                    fontFamily="monospace"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {star.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 8. Earth-Sun Connection Line in Orbital Modes */}
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

        {/* 9. Seasonal Milestone Nodes (Heliocentric / Geocentric) */}
        {milestonesOpacity > 0.05 && milestones.map((m) => (
          <g
            key={m.id}
            className="cursor-pointer transition-transform hover:scale-110"
            opacity={milestonesOpacity * (m.isFront ? 1.0 : 0.4)}
            onPointerEnter={() => setHoveredMilestone(m)}
            onPointerLeave={() => setHoveredMilestone(null)}
          >
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
              className="pointer-events-none drop-shadow"
            >
              {m.label}
            </text>
          </g>
        ))}

        {/* 10. Earth Bead (Heliocentric / Geocentric) */}
        <g
          filter="url(#ringGlow)"
          className="cursor-pointer"
          onPointerEnter={() => setHoveredBead('earth')}
          onPointerLeave={() => setHoveredBead(null)}
        >
          {/* Earth Atmosphere Glow */}
          <circle
            cx={earth.screenPos.x}
            cy={earth.screenPos.y}
            r="4.8"
            fill="#38bdf8"
            fillOpacity="0.3"
          />
          {/* Earth Core */}
          <circle
            cx={earth.screenPos.x}
            cy={earth.screenPos.y}
            r="2.8"
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          {/* Axial Tilt Marker (23.44°) */}
          <line
            x1={earth.screenPos.x - 3.5 * Math.sin(toRadians(23.44))}
            y1={earth.screenPos.y - 3.5 * Math.cos(toRadians(23.44))}
            x2={earth.screenPos.x + 3.5 * Math.sin(toRadians(23.44))}
            y2={earth.screenPos.y + 3.5 * Math.cos(toRadians(23.44))}
            stroke="#38bdf8"
            strokeWidth="0.6"
            opacity="0.85"
          />
          <text
            x={earth.screenPos.x}
            y={earth.screenPos.y + 7.0}
            fontSize="3.2"
            fill="#38bdf8"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            {projectionMode === 'geocentric' ? '⊕ EARTH (Center)' : '⊕ EARTH'}
          </text>
        </g>

        {/* 10b. Topocentric Observer Pin ("YOU") on Earth's Surface */}
        {observerCone && orbitRingOpacity > 0.05 && (
          <g
            className="cursor-pointer"
            onPointerEnter={() => setHoveredBead('observer')}
            onPointerLeave={() => setHoveredBead(null)}
          >
            {/* Pulsing Location Ring */}
            <circle
              cx={observerCone.observerScreenPos.x}
              cy={observerCone.observerScreenPos.y}
              r="3.8"
              fill="#38bdf8"
              fillOpacity="0.35"
              stroke="#38bdf8"
              strokeWidth="0.5"
              strokeDasharray="2 1"
            />
            <circle
              cx={observerCone.observerScreenPos.x}
              cy={observerCone.observerScreenPos.y}
              r="1.8"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.6"
            />
            <text
              x={observerCone.observerScreenPos.x + 3.5}
              y={observerCone.observerScreenPos.y - 2.5}
              fontSize="3.0"
              fill="#38bdf8"
              fontFamily="monospace"
              fontWeight="bold"
            >
              YOU
            </text>
          </g>
        )}

        {/* 10c. Lunar Ascending & Descending Nodes */}
        {lunarNodes && lunarOrbitOpacity > 0.05 && (
          <g>
            {/* Ascending Node (Northbound, Sky Blue) */}
            <g
              className="cursor-pointer transition-transform hover:scale-110"
              onPointerEnter={() => setHoveredNode('asc')}
              onPointerLeave={() => setHoveredNode(null)}
            >
              <circle
                cx={lunarNodes.ascendingNode.screenPos.x}
                cy={lunarNodes.ascendingNode.screenPos.y}
                r="2.5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="0.6"
              />
              <text
                x={lunarNodes.ascendingNode.screenPos.x}
                y={lunarNodes.ascendingNode.screenPos.y - 3.5}
                fontSize="3.2"
                fill="#38bdf8"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                ☊
              </text>
            </g>

            {/* Descending Node (Southbound, Rose Red) */}
            <g
              className="cursor-pointer transition-transform hover:scale-110"
              onPointerEnter={() => setHoveredNode('desc')}
              onPointerLeave={() => setHoveredNode(null)}
            >
              <circle
                cx={lunarNodes.descendingNode.screenPos.x}
                cy={lunarNodes.descendingNode.screenPos.y}
                r="2.5"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="0.6"
              />
              <text
                x={lunarNodes.descendingNode.screenPos.x}
                y={lunarNodes.descendingNode.screenPos.y - 3.5}
                fontSize="3.2"
                fill="#f43f5e"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                ☋
              </text>
            </g>
          </g>
        )}

        {/* 11. Sun Bead (Golden Orb with Radial Corona - Click to Snap) */}
        <g 
          filter="url(#sunGlow)"
          className="cursor-pointer"
          onClick={() => handleTargetClick('Sun (Sol)', sun.screenPos)}
          onPointerEnter={() => setHoveredBead('sun')}
          onPointerLeave={() => setHoveredBead(null)}
        >
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
          >
            ☉ SUN
          </text>
        </g>

        {/* 12. Moon Bead (Gray/Silver Phase Disc - Click to Snap) */}
        <g 
          filter="url(#starGlow)"
          className="cursor-pointer"
          onClick={() => handleTargetClick('Moon (Luna)', moon.screenPos)}
          onPointerEnter={() => setHoveredBead('moon')}
          onPointerLeave={() => setHoveredBead(null)}
        >
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
          >
            ☽ MOON
          </text>
        </g>

        {/* 13. Interactive Astrolabe Rule (SED Hairline Alidade Sighting Arm) */}
        {showRule && alidadeOpacity > 0.05 && (
          <g 
            className="cursor-grab active:cursor-grabbing"
            opacity={alidadeOpacity}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
              setIsDraggingRule(true);
            }}
          >
            {/* Extended Cyan Laser Sighting Ray */}
            <line
              x1={-140 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y1={140 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              x2={140 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y2={-140 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              stroke="#38bdf8"
              strokeWidth="0.75"
              strokeDasharray="3 2"
              opacity="0.85"
            />

            {/* Sighting Arm Precision Body */}
            <line
              x1={-135 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y1={135 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              x2={135 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y2={-135 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              stroke="#fbbf24"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.95"
            />
            {/* Inner Inlay */}
            <line
              x1={-130 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y1={130 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              x2={130 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y2={-130 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              stroke="#78350f"
              strokeWidth="0.75"
              strokeLinecap="round"
            />

            {/* Top Pinnule (Sighting Vane) with Central Pinhole */}
            <g transform={`translate(${115 * Math.sin((ruleAngleDeg * Math.PI) / 180)}, ${-115 * Math.cos((ruleAngleDeg * Math.PI) / 180)}) rotate(${ruleAngleDeg})`}>
              <rect x="-2.5" y="-4" width="5" height="8" rx="0.75" fill="#d97706" stroke="#ffffff" strokeWidth="0.6" />
              <circle cx="0" cy="0" r="0.9" fill="#020617" stroke="#38bdf8" strokeWidth="0.5" />
            </g>

            {/* Bottom Pinnule (Sighting Vane) with Central Pinhole */}
            <g transform={`translate(${-115 * Math.sin((ruleAngleDeg * Math.PI) / 180)}, ${115 * Math.cos((ruleAngleDeg * Math.PI) / 180)}) rotate(${ruleAngleDeg})`}>
              <rect x="-2.5" y="-4" width="5" height="8" rx="0.75" fill="#d97706" stroke="#ffffff" strokeWidth="0.6" />
              <circle cx="0" cy="0" r="0.9" fill="#020617" stroke="#38bdf8" strokeWidth="0.5" />
            </g>

            {/* Sighting Arm Pointer Tip Badge */}
            <g transform={`translate(${135 * Math.sin((ruleAngleDeg * Math.PI) / 180)}, ${-135 * Math.cos((ruleAngleDeg * Math.PI) / 180)})`}>
              <circle cx="0" cy="0" r="1.8" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.6" />
            </g>

            {/* Center Pivot Reticle Pin */}
            <circle cx="0" cy="0" r="3.2" fill="#78350f" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.0" fill="#38bdf8" />
          </g>
        )}

        {/* Center Origin Pivot Pin (Hidden in Geocentric mode where Earth is at center) */}
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
    </div>
  );
};
