/**
 * Visual presentation tokens for the Gyro-Morph Armillary & Astrolabe visualizer.
 * Decouples SVG ring, zodiac glyph, and projection laser colors from pure 3D geometry.
 */

export const ARMILLARY_RING_COLORS: Record<string, string> = {
  orbit_path: '#38bdf8',
  lunar_orbit: '#cbd5e1',
  equator: '#10b981',
  ecliptic: '#f59e0b',
  tropic_cancer: '#d97706',
  tropic_capricorn: '#94a3b8',
  horizon: '#06b6d4',
  colure: '#64748b',
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
  cardinal: '#38bdf8',
  intercardinal: '#fbbf24',
} as const;
