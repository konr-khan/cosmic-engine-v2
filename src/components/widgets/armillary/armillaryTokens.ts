/**
 * Visual presentation tokens for the Gyro-Morph Armillary & Astrolabe visualizer.
 * Decouples SVG ring, zodiac glyph, and projection laser colors from pure 3D geometry.
 */

import { COSMIC_PALETTE } from '../../common/designTokens';

export const ARMILLARY_RING_COLORS: Record<string, string> = {
  orbit_path: COSMIC_PALETTE.sky,
  lunar_orbit: COSMIC_PALETTE.lunarSilver,
  equator: COSMIC_PALETTE.emerald,
  ecliptic: COSMIC_PALETTE.civilAmber,
  tropic_cancer: COSMIC_PALETTE.amberDeep,
  tropic_capricorn: COSMIC_PALETTE.slateMuted,
  horizon: COSMIC_PALETTE.cyan,
  colure: COSMIC_PALETTE.nauticalSlate,
};

export const ZODIAC_SIGN_COLORS: Record<string, string> = {
  Aries: '#f87171',
  Taurus: '#fb923c',
  Gemini: '#facc15',
  Cancer: '#4ade80',
  Leo: '#2dd4bf',
  Virgo: '#38bdf8',
  Libra: '#818cf8',
  Scorpio: '#c084fc',
  Sagittarius: '#f472b6',
  Capricorn: '#fb7185',
  Aquarius: '#38bdf8',
  Pisces: '#a78bfa',
};

export const LASER_RAY_COLORS = {
  cardinal: COSMIC_PALETTE.sky,
  intercardinal: COSMIC_PALETTE.amber,
} as const;
