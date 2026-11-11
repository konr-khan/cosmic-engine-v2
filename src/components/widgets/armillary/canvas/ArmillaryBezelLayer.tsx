import React from 'react';

export interface ArmillaryBezelLayerProps {
  bezelOpacity: number;
}

const ROMAN_HOURS = [
  'XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI',
  'XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'
];

export const ArmillaryBezelLayer: React.FC<ArmillaryBezelLayerProps> = ({ bezelOpacity }) => {
  if (bezelOpacity <= 0.01) return null;

  const bezelScale = 0.94 + 0.06 * bezelOpacity;

  return (
    <g 
      opacity={bezelOpacity} 
      transform={`scale(${bezelScale})`}
      className="transition-opacity duration-300 pointer-events-none"
    >
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
            opacity="0.85"
            className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
          >
            {ROMAN_HOURS[i]}
          </text>
        );
      })}
    </g>
  );
};
