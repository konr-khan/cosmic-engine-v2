import React from 'react';
import { ArmillaryObserverCone } from '../types';

export interface ArmillaryObserverConeLayerProps {
  observerCone?: ArmillaryObserverCone;
  orbitRingOpacity: number;
  showObserverCone?: boolean;
  morphLambda?: number;
  onHoverBead: (bead: 'observer' | null) => void;
}

export const ArmillaryObserverConeLayer: React.FC<ArmillaryObserverConeLayerProps> = ({
  observerCone,
  orbitRingOpacity,
  showObserverCone = true,
  morphLambda,
  onHoverBead
}) => {
  if (!showObserverCone || !observerCone || (orbitRingOpacity <= 0.05 && (!morphLambda || morphLambda <= 0.05))) return null;

  const phaseBURaw = morphLambda !== undefined ? Math.max(0, Math.min(1, (morphLambda - 0.45) / 0.55)) : 0;
  const phaseBU = parseFloat(phaseBURaw.toFixed(6));

  return (
    <>
      {/* Topocentric Observer Field of View (FOV) Sky Cone Visuals */}
      <g className="pointer-events-none">
        {/* Local Horizon Tangent Disc (Alt = 0°) */}
        {observerCone.horizonDiscPathD && (
          <path
            d={observerCone.horizonDiscPathD}
            fill="#06b6d4"
            fillOpacity={0.16 * (1 - phaseBU)}
            stroke="#06b6d4"
            strokeOpacity={0.85 * (1 - phaseBU)}
            strokeWidth="0.6"
            strokeDasharray="2 2"
            opacity={0.85 * (1 - phaseBU)}
          />
        )}

        {/* Translucent Observer Sky Cone Fill Envelope */}
        {observerCone.conePathD && (
          <path
            d={observerCone.conePathD}
            fill={observerCone.isDaytime ? '#38bdf8' : '#818cf8'}
            fillOpacity={0.16 * (1 - phaseBU)}
            stroke="none"
            opacity={0.85 * (1 - phaseBU)}
          />
        )}

        {/* Symmetrical Left and Right Cone Silhouette Rays */}
        {observerCone.silhouetteLinesPathD && (
          <path
            d={observerCone.silhouetteLinesPathD}
            fill="none"
            stroke={observerCone.isDaytime ? '#38bdf8' : '#818cf8'}
            strokeOpacity={0.85 * (1 - phaseBU)}
            strokeWidth="0.6"
            strokeDasharray="3 2"
            opacity={0.85 * (1 - phaseBU)}
          />
        )}

        {/* Zenith Ray Line pointing outward from Observer & Zenith Target Marker */}
        {phaseBU < 0.9 && (
          <g opacity={1 - phaseBU}>
            <line
              x1={observerCone.zenithRay.start.x}
              y1={observerCone.zenithRay.start.y}
              x2={observerCone.zenithRay.end.x}
              y2={observerCone.zenithRay.end.y}
              stroke="#38bdf8"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity={0.85}
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
              className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
            >
              ZENITH
            </text>
          </g>
        )}
      </g>

      {/* Topocentric Observer Pin ("YOU") on Earth's Surface */}
      {phaseBU < 0.5 && (
        <g
          className="cursor-pointer"
          style={{ touchAction: 'none' }}
          opacity={Math.max(0, 1 - 2 * phaseBU)}
          onPointerEnter={() => onHoverBead('observer')}
          onPointerLeave={() => onHoverBead(null)}
        >
          {/* Invisible Touch Hitbox */}
          <circle
            cx={observerCone.observerScreenPos.x}
            cy={observerCone.observerScreenPos.y}
            r="10"
            fill="transparent"
          />
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
            className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
          >
            YOU
          </text>
        </g>
      )}
    </>
  );
};
