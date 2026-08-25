import React from 'react';

export interface ArmillaryAlidadeLayerProps {
  showRule: boolean;
  alidadeOpacity: number;
  ruleAngleDeg: number;
  onPointerDownRule: (e: React.PointerEvent<SVGGElement>) => void;
}

export const ArmillaryAlidadeLayer: React.FC<ArmillaryAlidadeLayerProps> = ({
  showRule,
  alidadeOpacity,
  ruleAngleDeg,
  onPointerDownRule
}) => {
  if (!showRule || alidadeOpacity <= 0.05) return null;

  const rad = (ruleAngleDeg * Math.PI) / 180;
  const sinA = Math.sin(rad);
  const cosA = Math.cos(rad);

  return (
    <g 
      className="cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
      opacity={alidadeOpacity}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPointerDownRule(e);
      }}
    >
      {/* Invisible Touch Hitbox for Sighting Arm Dragging */}
      <line
        x1={-140 * sinA}
        y1={140 * cosA}
        x2={140 * sinA}
        y2={-140 * cosA}
        stroke="transparent"
        strokeWidth="20"
        strokeLinecap="round"
      />

      {/* Extended Cyan Laser Sighting Ray */}
      <line
        x1={-140 * sinA}
        y1={140 * cosA}
        x2={140 * sinA}
        y2={-140 * cosA}
        stroke="#38bdf8"
        strokeWidth="0.75"
        strokeDasharray="3 2"
        opacity="0.85"
      />

      {/* Sighting Arm Precision Body */}
      <line
        x1={-135 * sinA}
        y1={135 * cosA}
        x2={135 * sinA}
        y2={-135 * cosA}
        stroke="#fbbf24"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* Inner Inlay */}
      <line
        x1={-130 * sinA}
        y1={130 * cosA}
        x2={130 * sinA}
        y2={-130 * cosA}
        stroke="#78350f"
        strokeWidth="0.75"
        strokeLinecap="round"
      />

      {/* Top Pinnule (Sighting Vane) with Central Pinhole */}
      <g transform={`translate(${115 * sinA}, ${-115 * cosA}) rotate(${ruleAngleDeg})`}>
        <rect x="-2.5" y="-4" width="5" height="8" rx="0.75" fill="#d97706" stroke="#ffffff" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="0.9" fill="#020617" stroke="#38bdf8" strokeWidth="0.5" />
      </g>

      {/* Bottom Pinnule (Sighting Vane) with Central Pinhole */}
      <g transform={`translate(${-115 * sinA}, ${115 * cosA}) rotate(${ruleAngleDeg})`}>
        <rect x="-2.5" y="-4" width="5" height="8" rx="0.75" fill="#d97706" stroke="#ffffff" strokeWidth="0.6" />
        <circle cx="0" cy="0" r="0.9" fill="#020617" stroke="#38bdf8" strokeWidth="0.5" />
      </g>

      {/* Sighting Arm Pointer Tip Badge */}
      <g transform={`translate(${135 * sinA}, ${-135 * cosA})`}>
        <circle cx="0" cy="0" r="1.8" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.6" />
      </g>

      {/* Center Pivot Reticle Pin */}
      <circle cx="0" cy="0" r="3.2" fill="#78350f" stroke="#fbbf24" strokeWidth="1" />
      <circle cx="0" cy="0" r="1.0" fill="#38bdf8" />
    </g>
  );
};
