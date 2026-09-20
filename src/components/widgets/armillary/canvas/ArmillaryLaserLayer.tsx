import React from 'react';
import { ProjectionFocalBeaconOutput } from '../types';

export interface ArmillaryLaserLayerProps {
  showRays: boolean;
  focalBeacon?: ProjectionFocalBeaconOutput;
  isOrbital: boolean;
  morphLambda?: number;
}

export const ArmillaryLaserLayer: React.FC<ArmillaryLaserLayerProps> = ({
  showRays,
  focalBeacon,
  isOrbital,
  morphLambda
}) => {
  if (!showRays || !focalBeacon) return null;
  if (isOrbital && (!morphLambda || morphLambda <= 0.45)) return null;

  const phaseBURaw = morphLambda !== undefined ? Math.max(0, Math.min(1, (morphLambda - 0.45) / 0.55)) : 1.0;
  const phaseBU = parseFloat(phaseBURaw.toFixed(6));

  return (
    <g filter="url(#laserGlow)" className="pointer-events-none">
      {/* Translucent Conic Projection Light Wash */}
      {focalBeacon.conePathD && (
        <path
          d={focalBeacon.conePathD}
          fill="url(#laserConeGradient)"
          stroke="#38bdf8"
          strokeWidth="0.5"
          strokeDasharray="4 2"
          opacity={0.75 * phaseBU}
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
          opacity={ray.opacity * Math.min(1, phaseBU * 1.5)}
        />
      ))}

      {/* Glowing Projection Focal Pole Beacon */}
      {phaseBU > 0.3 && (
        <g opacity={Math.max(0, (phaseBU - 0.3) / 0.7)}>
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
        </g>
      )}
      {phaseBU >= 0.6 && (
        <text
          x={focalBeacon.focalScreenPos.x}
          y={focalBeacon.focalScreenPos.y + 7.5}
          fontSize="3.0"
          fill="#38bdf8"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
          opacity={Math.max(0, (phaseBU - 0.6) / 0.4)}
        >
          ⌖ FOCAL BEACON
        </text>
      )}
    </g>
  );
};
