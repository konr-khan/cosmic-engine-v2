import React from 'react';
import { HoveredStarInfo, ArmillaryModelOutput } from '../types';

export interface ArmillaryStarsLayerProps {
  stars: ArmillaryModelOutput['stars'];
  showStars: boolean;
  starsOpacity: number;
  hoveredStar: HoveredStarInfo | null;
  onHoverStar: (star: HoveredStarInfo | null) => void;
  onTargetClick: (name: string, screenPos: { x: number; y: number }) => void;
}

export const ArmillaryStarsLayer: React.FC<ArmillaryStarsLayerProps> = ({
  stars,
  showStars,
  starsOpacity,
  hoveredStar,
  onHoverStar,
  onTargetClick
}) => {
  if (!showStars || starsOpacity <= 0.05) return null;

  return (
    <g filter="url(#starGlow)" opacity={starsOpacity}>
      {stars.map((star) => {
        const starRadius = Math.max(1.2, 3.2 - (star.magnitude + 1.5) * 0.6);
        const isHovered = hoveredStar?.id === star.id;

        return (
          <g 
            key={star.id}
            className="cursor-pointer transition-all"
            onClick={() => onTargetClick(star.name, star.screenPos)}
            onPointerEnter={(e) => {
              e.stopPropagation();
              onHoverStar({
                ...star,
                screenX: star.screenPos.x,
                screenY: star.screenPos.y
              });
            }}
            onPointerLeave={() => onHoverStar(null)}
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
  );
};
