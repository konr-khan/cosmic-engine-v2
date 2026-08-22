import React, { useState, useRef, useCallback } from 'react';
import { 
  ArmillaryModelOutput, 
  ArmillaryProjectionMode, 
  HoveredStarInfo, 
  ArmillaryCameraState, 
  AlidadeSightingInfo 
} from './types';
import { ZODIAC_SIGNS, calculateAlidadeSighting } from '../../../utils/cosmicMath';
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
  isFreeReteMode = false,
  onFreeReteRotate,
  ruleAngleDeg: controlledRuleAngle,
  onRuleAngleChange,
  onSnapToTarget
}) => {
  const [hoveredStar, setHoveredStar] = useState<HoveredStarInfo | null>(null);
  const [hoveredBead, setHoveredBead] = useState<'sun' | 'moon' | null>(null);
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

  const { rings, almucantars, stars, sun, moon, localSiderealTimeDeg, focalBeacon, apparentSolarHours } = model;
  const is3D = morphLambda <= 0.05;
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

      // In Free Rete mode on 2D plate or near outer rim, grab and spin the Rete
      if (isFreeReteMode && distFromCenter > 40) {
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
      {/* SVG Canvas Container */}
      <svg
        ref={svgRef}
        viewBox="-150 -150 300 300"
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`w-full h-full max-h-[560px] drop-shadow-2xl ${
          isDraggingRule ? 'cursor-grab active:cursor-grabbing' : (is3D ? 'cursor-move' : 'cursor-default')
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

        {/* 1. Outer Brass Mater Plate (Limb with Degrees & Hour Ticks) */}
        <circle cx="0" cy="0" r="140" fill="url(#brassRim)" stroke="#b45309" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="133" fill="#020617" fillOpacity="0.9" stroke="#78350f" strokeWidth="1" />

        {/* 360-degree Limb Ticks & 24-hour Roman Numeral Markings */}
        {Array.from({ length: 72 }).map((_, i) => {
          const deg = i * 5;
          const rad = (deg * Math.PI) / 180;
          const isMajor = deg % 30 === 0;
          const isMid = deg % 15 === 0;
          const rInner = isMajor ? 133 : (isMid ? 135 : 137);
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
              strokeWidth={isMajor ? 1.5 : 0.75}
              opacity={0.8}
            />
          );
        })}

        {/* 24-Hour Markers on Outer Limb */}
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
              fontSize="4.5"
              fill="#fbbf24"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              opacity="0.85"
            >
              {romanHours[i]}
            </text>
          );
        })}

        {/* 2. Volumetric Laser Projection Beacon & Ray Cones (When Rays Active) */}
        {showRays && focalBeacon && (
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
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity={ray.opacity}
              />
            ))}

            {/* Glowing Projection Focal Pole Beacon */}
            <circle
              cx={focalBeacon.focalScreenPos.x}
              cy={focalBeacon.focalScreenPos.y}
              r="6"
              fill="#38bdf8"
              fillOpacity="0.3"
            />
            <circle
              cx={focalBeacon.focalScreenPos.x}
              cy={focalBeacon.focalScreenPos.y}
              r="3"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            <text
              x={focalBeacon.focalScreenPos.x}
              y={focalBeacon.focalScreenPos.y + 8}
              fontSize="3.2"
              fill="#38bdf8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              ⌖ FOCAL BEACON (0, -R₀, 0)
            </text>
          </g>
        )}

        {/* 3. Tympan Altitude Circles (Almucantars) */}
        {showTympan && isStereo2D && (
          <g className="pointer-events-none opacity-45">
            {almucantars.map((a) => (
              <circle
                key={`almucantar-${a.altitude}`}
                cx="0"
                cy={-a.centerY}
                r={a.radius}
                fill="none"
                stroke={a.isHorizon ? '#06b6d4' : '#64748b'}
                strokeWidth={a.isHorizon ? 1.8 : 0.6}
                strokeDasharray={a.isHorizon ? 'none' : '3,3'}
              />
            ))}
          </g>
        )}

        {/* 4. Back Ring Segments (Depth Sorted: zCam < 0) */}
        <g opacity={is3D ? 0.35 : 0.85}>
          {rings.map((ring) => (
            <path
              key={`back-${ring.id}`}
              d={is3D ? ring.backPathD : ring.fullPathD}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.backStrokeWidth}
              strokeDasharray={is3D ? '3,2' : 'none'}
            />
          ))}
        </g>

        {/* 5. Front Ring Segments (Depth Sorted: zCam >= 0) */}
        <g filter="url(#ringGlow)">
          {rings.map((ring) => (
            <path
              key={`front-${ring.id}`}
              d={ring.frontPathD}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.frontStrokeWidth}
            />
          ))}
        </g>

        {/* 6. Zodiac Ecliptic Rete Segments & Glyphs */}
        {ZODIAC_SIGNS.map((sign, idx) => {
          const eclRing = rings.find((r) => r.id === 'ecliptic');
          if (!eclRing || eclRing.vertices.length === 0) return null;

          const midIndex = Math.floor(((idx * 30 + 15) / 360) * (eclRing.vertices.length - 1));
          const v = eclRing.vertices[midIndex];
          if (!v) return null;

          return (
            <g key={`zodiac-${sign.name}`}>
              <circle
                cx={v.screenPos.x}
                cy={v.screenPos.y}
                r="1.2"
                fill={sign.color}
              />
              <text
                x={v.screenPos.x}
                y={v.screenPos.y - 3}
                fontSize="5"
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

        {/* 7. Navigational Astrolabe Stars with Gothic Flammes (Click to Snap Sighting) */}
        {showStars && (
          <g filter="url(#starGlow)">
            {stars.map((star) => {
              const starRadius = Math.max(1.5, 3.8 - (star.magnitude + 1.5) * 0.7);
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
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    opacity={isHovered ? 0.9 : 0.3}
                  />

                  {/* Star Pointer Diamond Core */}
                  <circle
                    cx={star.screenPos.x}
                    cy={star.screenPos.y}
                    r={starRadius}
                    fill={isHovered ? '#fbbf24' : '#e0f2fe'}
                    stroke="#0284c7"
                    strokeWidth={isHovered ? 1.5 : 0.8}
                  />

                  {/* Star Label */}
                  <text
                    x={star.screenPos.x + 3}
                    y={star.screenPos.y - 3}
                    fontSize="3.8"
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

        {/* 8. Sun Bead (Golden Orb with Radial Corona - Click to Snap) */}
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
            strokeWidth="0.8"
            opacity="0.6"
          />
          {/* Outer Sun Corona */}
          <circle
            cx={sun.screenPos.x}
            cy={sun.screenPos.y}
            r="6"
            fill="#f59e0b"
            fillOpacity="0.25"
          />
          {/* Core Sun Bead */}
          <circle
            cx={sun.screenPos.x}
            cy={sun.screenPos.y}
            r="3.5"
            fill="#fbbf24"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <text
            x={sun.screenPos.x}
            y={sun.screenPos.y + 7.5}
            fontSize="4"
            fill="#fbbf24"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ☉ SUN
          </text>
        </g>

        {/* 9. Moon Bead (Cyan/Silver Phase Disc - Click to Snap) */}
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
            stroke="#38bdf8"
            strokeWidth="0.8"
            opacity="0.6"
          />
          {/* Moon Core */}
          <circle
            cx={moon.screenPos.x}
            cy={moon.screenPos.y}
            r="3.2"
            fill="#0284c7"
            stroke="#e0f2fe"
            strokeWidth="1.2"
          />
          <text
            x={moon.screenPos.x}
            y={moon.screenPos.y + 7.5}
            fontSize="4"
            fill="#38bdf8"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ☽ MOON
          </text>
        </g>

        {/* 10. Interactive Astrolabe Rule (Alidade Sighting Arm with Pinnules) */}
        {showRule && (
          <g 
            className="cursor-grab active:cursor-grabbing"
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

            {/* Sighting Arm Brass Body */}
            <line
              x1={-135 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y1={135 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              x2={135 * Math.sin((ruleAngleDeg * Math.PI) / 180)}
              y2={-135 * Math.cos((ruleAngleDeg * Math.PI) / 180)}
              stroke="#fbbf24"
              strokeWidth="3.5"
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
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Top Pinnule (Sighting Vane) with Central Pinhole */}
            <g transform={`translate(${115 * Math.sin((ruleAngleDeg * Math.PI) / 180)}, ${-115 * Math.cos((ruleAngleDeg * Math.PI) / 180)}) rotate(${ruleAngleDeg})`}>
              <rect x="-3" y="-5" width="6" height="10" rx="1" fill="#d97706" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#020617" stroke="#38bdf8" strokeWidth="0.6" />
            </g>

            {/* Bottom Pinnule (Sighting Vane) with Central Pinhole */}
            <g transform={`translate(${-115 * Math.sin((ruleAngleDeg * Math.PI) / 180)}, ${115 * Math.cos((ruleAngleDeg * Math.PI) / 180)}) rotate(${ruleAngleDeg})`}>
              <rect x="-3" y="-5" width="6" height="10" rx="1" fill="#d97706" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#020617" stroke="#38bdf8" strokeWidth="0.6" />
            </g>

            {/* Sighting Arm Pointer Tip Badge */}
            <g transform={`translate(${135 * Math.sin((ruleAngleDeg * Math.PI) / 180)}, ${-135 * Math.cos((ruleAngleDeg * Math.PI) / 180)})`}>
              <circle cx="0" cy="0" r="2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
            </g>

            {/* Center Pivot Pin */}
            <circle cx="0" cy="0" r="4.5" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Center Origin Pivot Pin */}
        <circle cx="0" cy="0" r="2.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
      </svg>

      {/* Glassmorphic Sighting & Star/Sun/Moon Hover Telemetry HUD */}
      <ArmillaryHoverHud
        hoveredStar={hoveredStar}
        hoveredBead={hoveredBead}
        showRule={showRule}
        sightingInfo={sightingInfo}
        sun={sun}
        moon={moon}
      />
    </div>
  );
};
