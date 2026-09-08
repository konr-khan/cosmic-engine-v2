import React, { ReactNode, ComponentType } from 'react';

export const EL_R = 92;
export const EL_CX = 130;
export const EL_CY = 104;

export interface SkyDomeReferenceLine {
  y: number;
  xLeft: number;
  xRight: number;
  stroke: string;
  label: string;
  labelColor: string;
  title: string;
}

export interface SkyDomeDiurnalPath {
  id: string;
  d: string;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeOpacity?: number;
  label?: string;
  labelColor?: string;
  labelX?: number;
  labelY?: number;
  title?: string;
  isGlowing?: boolean;
}

export interface SkyDomeBaseProps {
  title: string;
  icon: ComponentType<{ className?: string }>;
  iconColorClass?: string;
  peakLabel: string;
  peakElevation: number;
  currentElevation: number;
  elevationColorClass?: string;
  latitude?: number;
  capPathD?: string;
  referenceLines?: SkyDomeReferenceLine[];
  diurnalPaths?: SkyDomeDiurnalPath[];
  showTwilightBands?: boolean;
  elevationStatusSubtitle?: string;
  bodyX?: number;
  bodyY?: number;
  bodyVectorStroke?: string;
  renderBodyGraphic?: (pos: { x: number; y: number }) => ReactNode;
  extraSvgContent?: ReactNode;
  popover?: ReactNode;
  children?: ReactNode;
}

export const SkyDomeBase: React.FC<SkyDomeBaseProps> = ({
  title,
  icon: Icon,
  iconColorClass = 'text-slate-300',
  peakLabel,
  peakElevation,
  currentElevation,
  elevationColorClass,
  latitude,
  capPathD,
  referenceLines = [],
  diurnalPaths = [],
  showTwilightBands = false,
  elevationStatusSubtitle,
  bodyX = EL_CX,
  bodyY = EL_CY,
  bodyVectorStroke = '#64748b',
  renderBodyGraphic,
  extraSvgContent,
  popover,
  children
}) => {
  const isAboveHorizon = currentElevation > 0;
  const isVisible = currentElevation > -18;
  const defaultElevationColor = currentElevation >= 0 ? 'text-amber-400' : 'text-slate-400';
  const meridianLabel = latitude !== undefined && latitude < 0 ? 'N' : 'S';

  return (
    <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800/60 flex flex-col justify-between shadow-inner backdrop-blur-sm relative">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-1 px-1 font-mono">
        <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5 font-sans">
          <Icon className={`w-4 h-4 ${iconColorClass}`} /> {title}
        </div>
        <div className="text-xs text-slate-300 font-mono">
          <span className="text-[10px] text-slate-400 font-sans uppercase mr-1">{peakLabel}:</span>
          <strong className="text-white font-semibold">{peakElevation.toFixed(1)}°</strong>
        </div>
      </div>

      {/* Semicircular Sky Dome SVG (Unified 260x138 canonical viewport) */}
      <div className="relative w-full py-1 flex items-center justify-center">
        <svg 
          viewBox="0 0 260 138" 
          className="w-full max-h-[160px] overflow-visible" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Sub-Horizon Atmospheric Twilight Strata (Civil -6°, Nautical -12°, Astronomical -18°) */}
          {showTwilightBands && (
            <g className="twilight-strata">
              {/* Civil Twilight (0° to -6°, Y: 104 -> 113.6) */}
              <rect x="18" y="104" width="224" height="9.6" fill="#f59e0b" fillOpacity="0.08" />
              <line x1="18" y1="113.6" x2="242" y2="113.6" stroke="#d97706" strokeWidth="0.5" strokeDasharray="2 3" strokeOpacity="0.5" />
              <text x="245" y="115.5" className="text-[6px] font-mono fill-amber-500/80 font-medium select-none pointer-events-none">−6°</text>
              <text x="15" y="115.5" textAnchor="end" className="text-[5.5px] font-mono fill-amber-500/80 font-medium select-none pointer-events-none">CIVIL</text>

              {/* Nautical Twilight (-6° to -12°, Y: 113.6 -> 123.1) - Slate tones matching Solar Almanac */}
              <rect x="18" y="113.6" width="224" height="9.5" fill="#64748b" fillOpacity="0.08" />
              <line x1="18" y1="123.1" x2="242" y2="123.1" stroke="#475569" strokeWidth="0.5" strokeDasharray="2 3" strokeOpacity="0.45" />
              <text x="245" y="125" className="text-[6px] font-mono fill-slate-400/80 font-medium select-none pointer-events-none">−12°</text>
              <text x="15" y="125" textAnchor="end" className="text-[5.5px] font-mono fill-slate-400/80 font-medium select-none pointer-events-none">NAUT</text>

              {/* Astronomical Twilight (-12° to -18°, Y: 123.1 -> 132.4) - Deep Slate tones matching Solar Almanac */}
              <rect x="18" y="123.1" width="224" height="9.3" fill="#334155" fillOpacity="0.1" />
              <line x1="18" y1="132.4" x2="242" y2="132.4" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3" strokeOpacity="0.4" />
              <text x="245" y="134.5" className="text-[6px] font-mono fill-slate-500/80 font-medium select-none pointer-events-none">−18°</text>
              <text x="15" y="134.5" textAnchor="end" className="text-[5.5px] font-mono fill-slate-500/80 font-medium select-none pointer-events-none">ASTRO</text>
            </g>
          )}

          {/* Horizon Line (0°) */}
          <line x1="18" y1={EL_CY} x2="242" y2={EL_CY} stroke="#334155" strokeWidth="0.75" strokeOpacity="0.7" />
          <text x="16" y="101" textAnchor="end" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>
          <text x="244" y="101" textAnchor="start" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>

          {/* Cardinal Compass Indicators (E, S/N, W) */}
          <text x="36" y="101" textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500 font-medium select-none pointer-events-none">E</text>
          <text x={EL_CX} y="101" textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500 font-medium select-none pointer-events-none">{meridianLabel}</text>
          <text x="224" y="101" textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500 font-medium select-none pointer-events-none">W</text>

          {/* Semicircular Elevation Arc Dome */}
          <path
            d={`M ${EL_CX - EL_R} ${EL_CY} A ${EL_R} ${EL_R} 0 0 1 ${EL_CX + EL_R} ${EL_CY}`}
            fill="none"
            stroke="#334155"
            strokeWidth="0.75"
            strokeDasharray="4 3"
            strokeOpacity="0.6"
          />

          {/* Unreachable Zenith Cap (Outside Tropics) */}
          {capPathD && (
            <path
              d={capPathD}
              fill="#020617"
              fillOpacity="0.6"
              stroke="#475569"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
          )}

          {/* Solstice / Standstill Reference Lines */}
          {referenceLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={line.xLeft}
                y1={line.y}
                x2={line.xRight}
                y2={line.y}
                stroke={line.stroke}
                strokeWidth="0.7"
                strokeDasharray="3 2"
                strokeOpacity="0.7"
              />
              <text
                x={line.xRight + 3}
                y={line.y + 2.5}
                className={`text-[6.5px] font-mono ${line.labelColor} font-medium pointer-events-none select-none`}
              >
                {line.label}
              </text>
              <title>{line.title}</title>
            </g>
          ))}

          {/* Diurnal Transit Path Arcs */}
          {diurnalPaths.map((path) => (
            <g key={path.id}>
              {path.isGlowing && path.d && (
                <path
                  d={path.d}
                  fill="none"
                  stroke={path.stroke}
                  strokeWidth={(path.strokeWidth || 1.2) + 2}
                  strokeOpacity={0.25}
                  className="blur-[1px] pointer-events-none select-none"
                />
              )}
              {path.d && (
                <path
                  d={path.d}
                  fill="none"
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth ?? 0.8}
                  strokeDasharray={path.strokeDasharray}
                  strokeOpacity={path.strokeOpacity ?? 0.8}
                >
                  {path.title && <title>{path.title}</title>}
                </path>
              )}
              {path.label && path.labelX !== undefined && path.labelY !== undefined && (
                <text
                  x={path.labelX}
                  y={path.labelY}
                  className={`text-[6.5px] font-mono ${path.labelColor || 'fill-slate-400'} font-medium pointer-events-none select-none`}
                >
                  {path.label}
                </text>
              )}
            </g>
          ))}

          {/* Zenith Marker (90°) */}
          <line x1={EL_CX} y1={EL_CY - EL_R - 3} x2={EL_CX} y2={EL_CY - EL_R + 3} stroke="#475569" strokeWidth="0.75" />
          <text x={EL_CX} y={EL_CY - EL_R - 5} textAnchor="middle" className="text-[8px] font-mono fill-slate-500 font-medium">+90°</text>

          {/* Observer Horizon Center Origin */}
          <circle cx={EL_CX} cy={EL_CY} r="2" fill="#475569" />

          {/* Extra SVG Overlays (e.g. Lunar Node Pins ☊ and ☋) */}
          {extraSvgContent}

          {/* Body Elevation Vector & Body Graphic */}
          {isVisible && (
            <g>
              <line
                x1={EL_CX}
                y1={EL_CY}
                x2={bodyX}
                y2={bodyY}
                stroke={bodyVectorStroke}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              {renderBodyGraphic && renderBodyGraphic({ x: bodyX, y: bodyY })}
            </g>
          )}
        </svg>
      </div>

      {/* Live Elevation Readout Badge */}
      <div className="text-center my-1 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800/60 shadow-sm">
        <div className={`text-sm font-mono font-semibold ${elevationColorClass || defaultElevationColor}`}>
          {currentElevation >= 0 ? `+${currentElevation.toFixed(1)}°` : `${currentElevation.toFixed(1)}°`}
          <span className="text-[10px] text-slate-400 uppercase font-sans ml-1.5 font-normal">
            {isAboveHorizon ? '(Above Horizon)' : '(Below Horizon)'}
            {elevationStatusSubtitle ? ` · ${elevationStatusSubtitle}` : ''}
          </span>
        </div>
      </div>

      {/* Hover Popover */}
      {popover}

      {/* Body Content: Metrics Bar, Stats Strip, Mirrored Summary Badges */}
      {children}
    </div>
  );
};

export default SkyDomeBase;
