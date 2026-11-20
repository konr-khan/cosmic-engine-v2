import React from 'react';
import { ArmillaryMilestoneNode, ArmillaryLunarNodes } from '../types';
import { COSMIC_PALETTE, MILESTONE_COLORS, NODAL_COLORS } from '../../../common/designTokens';

export interface ArmillaryNodesSublayerProps {
  milestones: ArmillaryMilestoneNode[];
  hoveredMilestone?: ArmillaryMilestoneNode | null;
  milestonesOpacity: number;
  lunarNodes?: ArmillaryLunarNodes;
  showLunarNodes: boolean;
  lunarOrbitOpacity: number;
  hoveredNode?: 'asc' | 'desc' | null;
  isDragging: boolean;
  onHoverMilestone: (m: ArmillaryMilestoneNode | null) => void;
  onHoverNode: (node: 'asc' | 'desc' | null) => void;
  onTargetClick: (name: string, screenPos: { x: number; y: number }) => void;
}

/**
 * Renders seasonal orbital milestone nodes and interactive Draconic lunar node pins (☊ / ☋)
 * for the Gyro-Morph Armillary canvas.
 */
export const ArmillaryNodesSublayer: React.FC<ArmillaryNodesSublayerProps> = ({
  milestones,
  hoveredMilestone,
  milestonesOpacity,
  lunarNodes,
  showLunarNodes,
  lunarOrbitOpacity,
  hoveredNode,
  isDragging,
  onHoverMilestone,
  onHoverNode,
  onTargetClick,
}) => {
  return (
    <>
      {/* Seasonal Milestone Nodes (Heliocentric / Geocentric) */}
      {milestonesOpacity > 0.05 && milestones.map((m) => {
        const isHovered = !isDragging && hoveredMilestone?.id === m.id;
        const mColor = m.color || (
          m.id === 'perihelion' ? MILESTONE_COLORS.perihelion :
          m.id === 'mar_equinox' || m.id === 'sep_equinox' ? MILESTONE_COLORS.equinox :
          m.id === 'jun_solstice' || m.id === 'dec_solstice' ? MILESTONE_COLORS.solstice :
          MILESTONE_COLORS.aphelion
        );
        return (
          <g
            key={m.id}
            className={isDragging ? 'pointer-events-none' : 'cursor-pointer'}
            style={{ touchAction: 'none' }}
            opacity={milestonesOpacity * (m.isFront ? 1.0 : 0.4)}
            onPointerEnter={() => {
              if (!isDragging) onHoverMilestone(m);
            }}
            onPointerLeave={() => onHoverMilestone(null)}
          >
            <circle
              cx={m.screenPos.x}
              cy={m.screenPos.y}
              r={isHovered ? 9 : 7}
              fill="transparent"
            />
            <circle
              cx={m.screenPos.x}
              cy={m.screenPos.y}
              r={isHovered ? 7.0 : 4.5}
              fill={mColor}
              opacity={isHovered ? 0.45 : 0.20}
              className={`pointer-events-none transition-[r,opacity] duration-200 ${isHovered ? 'animate-pulse' : ''}`}
            />
            <circle
              cx={m.screenPos.x}
              cy={m.screenPos.y}
              r={isHovered ? 2.8 : 2.0}
              fill={mColor}
              stroke={COSMIC_PALETTE.white}
              strokeWidth={isHovered ? 1.2 : 0.75}
              className="pointer-events-none transition-[r,stroke-width] duration-150 drop-shadow-md"
            />
            <text
              x={m.screenPos.x}
              y={m.screenPos.y - (isHovered ? 6.5 : 5.0)}
              fontSize="3.0"
              fill={mColor}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Interactive Draconic Lunar Node Pins (☊ Ascending & ☋ Descending) */}
      {showLunarNodes && lunarNodes && lunarOrbitOpacity > 0.05 && (
        <>
          <g
            key="lunar-node-asc"
            data-testid="lunar-node-asc"
            className={isDragging ? 'pointer-events-none' : 'cursor-pointer'}
            style={{ touchAction: 'none' }}
            opacity={lunarOrbitOpacity * (lunarNodes.ascendingNode.isFront ? 1.0 : 0.4)}
            onClick={(e) => {
              e.stopPropagation();
              onTargetClick('Ascending Node (☊ Caput)', lunarNodes.ascendingNode.screenPos);
            }}
            onPointerEnter={() => {
              if (!isDragging) onHoverNode('asc');
            }}
            onPointerLeave={() => onHoverNode(null)}
          >
            <circle
              cx={lunarNodes.ascendingNode.screenPos.x}
              cy={lunarNodes.ascendingNode.screenPos.y}
              r={hoveredNode === 'asc' ? 10 : 8}
              fill="transparent"
            />
            <circle
              cx={lunarNodes.ascendingNode.screenPos.x}
              cy={lunarNodes.ascendingNode.screenPos.y}
              r={hoveredNode === 'asc' ? 6.0 : 4.0}
              fill={NODAL_COLORS.ascending}
              opacity={hoveredNode === 'asc' ? 0.45 : 0.20}
              className={`pointer-events-none transition-[r,opacity] duration-200 ${hoveredNode === 'asc' ? 'animate-pulse' : ''}`}
            />
            <circle
              cx={lunarNodes.ascendingNode.screenPos.x}
              cy={lunarNodes.ascendingNode.screenPos.y}
              r={hoveredNode === 'asc' ? 2.5 : 1.8}
              fill={NODAL_COLORS.ascending}
              stroke={COSMIC_PALETTE.white}
              strokeWidth={hoveredNode === 'asc' ? 1.0 : 0.6}
              className="pointer-events-none transition-[r,stroke-width] duration-150 drop-shadow-md"
            />
            <text
              x={lunarNodes.ascendingNode.screenPos.x}
              y={lunarNodes.ascendingNode.screenPos.y - (hoveredNode === 'asc' ? 5.5 : 4.0)}
              fontSize="3.2"
              fill={NODAL_COLORS.ascending}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ☊
            </text>
          </g>

          <g
            key="lunar-node-desc"
            data-testid="lunar-node-desc"
            className={isDragging ? 'pointer-events-none' : 'cursor-pointer'}
            style={{ touchAction: 'none' }}
            opacity={lunarOrbitOpacity * (lunarNodes.descendingNode.isFront ? 1.0 : 0.4)}
            onClick={(e) => {
              e.stopPropagation();
              onTargetClick('Descending Node (☋ Cauda)', lunarNodes.descendingNode.screenPos);
            }}
            onPointerEnter={() => {
              if (!isDragging) onHoverNode('desc');
            }}
            onPointerLeave={() => onHoverNode(null)}
          >
            <circle
              cx={lunarNodes.descendingNode.screenPos.x}
              cy={lunarNodes.descendingNode.screenPos.y}
              r={hoveredNode === 'desc' ? 10 : 8}
              fill="transparent"
            />
            <circle
              cx={lunarNodes.descendingNode.screenPos.x}
              cy={lunarNodes.descendingNode.screenPos.y}
              r={hoveredNode === 'desc' ? 6.0 : 4.0}
              fill={NODAL_COLORS.descending}
              opacity={hoveredNode === 'desc' ? 0.45 : 0.20}
              className={`pointer-events-none transition-[r,opacity] duration-200 ${hoveredNode === 'desc' ? 'animate-pulse' : ''}`}
            />
            <circle
              cx={lunarNodes.descendingNode.screenPos.x}
              cy={lunarNodes.descendingNode.screenPos.y}
              r={hoveredNode === 'desc' ? 2.5 : 1.8}
              fill={NODAL_COLORS.descending}
              stroke={COSMIC_PALETTE.white}
              strokeWidth={hoveredNode === 'desc' ? 1.0 : 0.6}
              className="pointer-events-none transition-[r,stroke-width] duration-150 drop-shadow-md"
            />
            <text
              x={lunarNodes.descendingNode.screenPos.x}
              y={lunarNodes.descendingNode.screenPos.y - (hoveredNode === 'desc' ? 5.5 : 4.0)}
              fontSize="3.2"
              fill={NODAL_COLORS.descending}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ☋
            </text>
          </g>
        </>
      )}
    </>
  );
};
