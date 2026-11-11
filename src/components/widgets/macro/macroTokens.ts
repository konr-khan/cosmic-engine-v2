/**
 * Visual design and SVG canvas presentation tokens for the Heliocentric Macro Orbit View.
 * Decouples presentation coordinates, SVG text anchor alignments, and semantic color
 * tokens from pure celestial mechanics and physical ephemeris data.
 */

export interface MilestoneVisualToken {
  color: string;
  textColor: string;
  fillColor: string;
  rawX: number;
  rawY: number;
  textAnchor: 'start' | 'middle' | 'end';
  textDx: number;
  textDy: number;
  subDy: number;
}

export const MILESTONE_VISUAL_TOKENS: Record<string, MilestoneVisualToken> = {
  perihelion: {
    rawX: -44.79,
    rawY: -194.92,
    color: '#ef4444',
    textColor: 'text-rose-400',
    fillColor: 'fill-rose-400',
    textAnchor: 'end',
    textDx: -14,
    textDy: -12,
    subDy: 2
  },
  mar_equinox: {
    rawX: -200,
    rawY: 0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    textAnchor: 'end',
    textDx: -14,
    textDy: 4,
    subDy: 18
  },
  jun_solstice: {
    rawX: 0,
    rawY: 200,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    textAnchor: 'middle',
    textDx: 0,
    textDy: 20,
    subDy: 34
  },
  aphelion: {
    rawX: 44.79,
    rawY: 194.92,
    color: '#38bdf8',
    textColor: 'text-sky-400',
    fillColor: 'fill-sky-400',
    textAnchor: 'start',
    textDx: 14,
    textDy: 18,
    subDy: 32
  },
  sep_equinox: {
    rawX: 200,
    rawY: 0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    textAnchor: 'start',
    textDx: 14,
    textDy: 4,
    subDy: 18
  },
  dec_solstice: {
    rawX: 0,
    rawY: -200,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    textAnchor: 'middle',
    textDx: 0,
    textDy: -20,
    subDy: -34
  }
};

export const MACRO_THEME = {
  SUN_FILL: '#fbbf24',
  SUN_GLOW: '#f59e0b'
} as const;
