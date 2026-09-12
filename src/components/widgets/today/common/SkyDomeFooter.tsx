/**
 * @file SkyDomeFooter.tsx
 * Shared 4-badge summary footer grid for topocentric sky domes.
 * Standardizes Rise/Set, Transit snap-to-clock, Declination, and Mode toggle badges
 * across SunElevationDome and MoonElevationDome.
 */

import React from 'react';
import { Compass } from 'lucide-react';

export interface SkyDomeFooterProps {
  // Column 1: Rise/Set
  riseSetTitle?: string;
  riseSetPrimaryText: string;
  riseSetOctantText?: string;
  riseSetTooltip?: string;

  // Column 2: Transit Snap
  transitLabel: string;
  transitTimeFormatted: string;
  onSnapTransit?: () => void;
  transitTheme?: 'amber' | 'indigo';
  transitTooltip?: string;

  // Column 3: Declination
  declinationLabel: string;
  declinationFormatted: string;
  declinationColorClass?: string;
  declinationSpanText?: string;
  declinationTooltip?: string;

  // Column 4: Mode Toggle
  modeLabel?: string;
  primaryModeText: string;
  secondaryModeText: string;
  isSecondaryActive: boolean;
  onToggleMode: (isSecondary: boolean) => void;
  primaryAriaLabel?: string;
  secondaryAriaLabel?: string;
  secondaryTheme?: 'amber' | 'sky';
}

export const SkyDomeFooter: React.FC<SkyDomeFooterProps> = ({
  riseSetTitle = 'Rise / Set',
  riseSetPrimaryText,
  riseSetOctantText,
  riseSetTooltip,

  transitLabel,
  transitTimeFormatted,
  onSnapTransit,
  transitTheme = 'amber',
  transitTooltip = 'Click to jump clock to Transit',

  declinationLabel,
  declinationFormatted,
  declinationColorClass = 'text-slate-200',
  declinationSpanText,
  declinationTooltip,

  modeLabel = 'Mode View',
  primaryModeText,
  secondaryModeText,
  isSecondaryActive,
  onToggleMode,
  primaryAriaLabel,
  secondaryAriaLabel,
  secondaryTheme = 'amber',
}) => {
  const isAmberTransit = transitTheme === 'amber';
  const transitBgClass = isAmberTransit
    ? 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/40 text-amber-300'
    : 'bg-indigo-950/60 hover:bg-indigo-900/80 border-indigo-500/40 text-indigo-300';
  const transitLabelClass = isAmberTransit ? 'text-amber-400' : 'text-indigo-400';
  const transitTimeClass = isAmberTransit ? 'text-amber-200' : 'text-indigo-200';
  const transitUtcClass = isAmberTransit ? 'text-amber-400/80' : 'text-indigo-400/80';

  const secondaryActiveBtnClass = secondaryTheme === 'amber'
    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
    : 'bg-sky-950/80 text-sky-300 border border-sky-500/40 font-bold shadow-sm';

  return (
    <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
      {/* Column 1: Rise / Set Badge */}
      <div 
        className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
        title={riseSetTooltip}
      >
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
          {riseSetTitle}
        </span>
        <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
          {riseSetPrimaryText}
        </span>
        {riseSetOctantText && (
          <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
            {riseSetOctantText}
          </span>
        )}
      </div>

      {/* Column 2: Transit Snap Button */}
      <div
        onClick={onSnapTransit}
        className={`text-center transition-all cursor-pointer p-1.5 rounded-lg border shadow-sm flex flex-col justify-center min-w-0 ${transitBgClass}`}
        title={transitTooltip}
      >
        <span className={`text-[7.5px] sm:text-[8px] block uppercase font-sans font-medium tracking-tight whitespace-nowrap flex items-center justify-center gap-0.5 truncate ${transitLabelClass}`}>
          <Compass className="w-2.5 h-2.5 shrink-0" /> {transitLabel}
        </span>
        <span className={`font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate ${transitTimeClass}`}>
          {transitTimeFormatted} <span className={`text-[9px] font-normal font-sans ${transitUtcClass}`}>UTC</span>
        </span>
      </div>

      {/* Column 3: Declination Badge */}
      <div 
        className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
        title={declinationTooltip}
      >
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
          {declinationLabel}
        </span>
        <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${declinationColorClass}`}>
          {declinationFormatted}
        </span>
        {declinationSpanText && (
          <span className="text-[8px] text-indigo-400/80 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
            {declinationSpanText}
          </span>
        )}
      </div>

      {/* Column 4: Mode Toggle Badge */}
      <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap mb-0.5">
          {modeLabel}
        </span>
        <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
          <button
            type="button"
            onClick={() => onToggleMode(false)}
            aria-label={primaryAriaLabel ?? `${primaryModeText} Mode`}
            className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
              !isSecondaryActive
                ? 'bg-slate-800 text-slate-200 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {primaryModeText}
          </button>
          <button
            type="button"
            onClick={() => onToggleMode(true)}
            aria-label={secondaryAriaLabel ?? `${secondaryModeText} Mode`}
            className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
              isSecondaryActive
                ? secondaryActiveBtnClass
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {secondaryModeText}
          </button>
        </div>
      </div>
    </div>
  );
};
