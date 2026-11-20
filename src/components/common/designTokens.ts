/**
 * @file designTokens.ts
 * Canonical semantic SVG & UI color tokens for Cosmic Engine V2.0,
 * aligned 1:1 with `docs/DESIGN_SYSTEM.md` Section 1.
 */

export const COSMIC_PALETTE = {
  // Primary celestial & observer semantics
  sky: '#38bdf8',
  rose: '#f43f5e',
  amber: '#fbbf24',
  gold: '#fde047',
  civilAmber: '#f59e0b',
  amberDeep: '#d97706',
  brass: '#b45309',
  emerald: '#10b981',
  cyan: '#06b6d4',
  indigo: '#6366f1',
  purple: '#c084fc',
  perihelionRed: '#ef4444',

  // Twilight strata & slate surfaces
  lunarSilver: '#cbd5e1',
  slateMuted: '#94a3b8',
  nauticalSlate: '#64748b',
  astroSlate: '#334155',
  slateDark: '#1e293b',
  slateObsidian: '#0f172a',
  deepSpace: '#020617',
  white: '#ffffff',
} as const;

export const CHRONOMETER_THEME = {
  date: COSMIC_PALETTE.emerald,
  time: COSMIC_PALETTE.sky,
  lon: COSMIC_PALETTE.civilAmber,
  lat: COSMIC_PALETTE.rose,
} as const;

export const NODAL_COLORS = {
  ascending: COSMIC_PALETTE.sky,
  descending: COSMIC_PALETTE.rose,
} as const;

export const MILESTONE_COLORS = {
  perihelion: COSMIC_PALETTE.perihelionRed,
  equinox: COSMIC_PALETTE.purple,
  solstice: COSMIC_PALETTE.civilAmber,
  aphelion: COSMIC_PALETTE.sky,
} as const;
