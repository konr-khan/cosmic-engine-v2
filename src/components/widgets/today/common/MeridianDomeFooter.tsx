/**
 * @file MeridianDomeFooter.tsx
 * Shared 4-badge summary footer grid for topocentric celestial meridian profiles.
 * Standardizes astronomical span bounds, extrema culminations, and segmented mode toggles
 * across SunMeridianDome and MoonMeridianDome.
 */

import React from 'react';

export interface MeridianBadgeMetric {
  label: string;
  value: string;
  subText?: string;
  tooltip?: string;
  valueColorClass?: string;
  subTextColorClass?: string;
}

export interface MeridianDomeFooterProps {
  badge1: MeridianBadgeMetric;
  badge2: MeridianBadgeMetric;
  badge3: MeridianBadgeMetric;
  modeLabel?: string;
  primaryModeText?: string;
  secondaryModeText: string;
  isSecondaryActive: boolean;
  onToggleSecondary: (active: boolean) => void;
  primaryAriaLabel: string;
  secondaryAriaLabel: string;
  secondaryTheme?: 'amber' | 'sky';
  primaryActiveTextClass?: string;
}

export const MeridianDomeFooter: React.FC<MeridianDomeFooterProps> = ({
  badge1,
  badge2,
  badge3,
  modeLabel = 'Mode View',
  primaryModeText = 'Std',
  secondaryModeText,
  isSecondaryActive,
  onToggleSecondary,
  primaryAriaLabel,
  secondaryAriaLabel,
  secondaryTheme = 'amber',
  primaryActiveTextClass = 'text-slate-200'
}) => {
  const secondaryActiveBtnClass =
    secondaryTheme === 'amber'
      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
      : 'bg-sky-950/80 text-sky-300 border border-sky-500/40 font-bold shadow-sm';

  return (
    <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
      {/* Badge 1 */}
      <div
        className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
        title={badge1.tooltip}
      >
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
          {badge1.label}
        </span>
        <span
          className={`font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate ${
            badge1.valueColorClass ?? 'text-slate-200'
          }`}
        >
          {badge1.value}
        </span>
        {badge1.subText && (
          <span
            className={`text-[8px] font-mono block whitespace-nowrap truncate leading-none mt-0.5 ${
              badge1.subTextColorClass ?? 'text-slate-400'
            }`}
          >
            {badge1.subText}
          </span>
        )}
      </div>

      {/* Badge 2 */}
      <div
        className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
        title={badge2.tooltip}
      >
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
          {badge2.label}
        </span>
        <span
          className={`font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate ${
            badge2.valueColorClass ?? 'text-slate-200'
          }`}
        >
          {badge2.value}
        </span>
        {badge2.subText && (
          <span
            className={`text-[8px] font-mono block whitespace-nowrap truncate leading-none mt-0.5 ${
              badge2.subTextColorClass ?? 'text-slate-500'
            }`}
          >
            {badge2.subText}
          </span>
        )}
      </div>

      {/* Badge 3 */}
      <div
        className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
        title={badge3.tooltip}
      >
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
          {badge3.label}
        </span>
        <span
          className={`font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate ${
            badge3.valueColorClass ?? 'text-slate-200'
          }`}
        >
          {badge3.value}
        </span>
        {badge3.subText && (
          <span
            className={`text-[8px] font-mono block whitespace-nowrap truncate leading-none mt-0.5 ${
              badge3.subTextColorClass ?? 'text-slate-500'
            }`}
          >
            {badge3.subText}
          </span>
        )}
      </div>

      {/* Mode View Segmented Toggle */}
      <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
        <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate mb-0.5">
          {modeLabel}
        </span>
        <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
          <button
            type="button"
            onClick={() => onToggleSecondary(false)}
            aria-label={primaryAriaLabel}
            className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
              !isSecondaryActive
                ? `bg-slate-800 ${primaryActiveTextClass} font-bold shadow-sm`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {primaryModeText}
          </button>
          <button
            type="button"
            onClick={() => onToggleSecondary(true)}
            aria-label={secondaryAriaLabel}
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
