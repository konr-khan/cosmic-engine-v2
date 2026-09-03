import { Degrees, asDegrees } from '../../../types/units';
import { ArmillaryStarData, ZodiacSignSegment } from './types';
import { EARTH_MILESTONES } from '../milestones';

export const ARMILLARY_MILESTONES_DATA = EARTH_MILESTONES;

/**
 * 12 Bright Classical Navigational Astrolabe Stars (Epoch J2000.0)
 */
export const ASTROLABE_STARS: Omit<ArmillaryStarData, 'p3d'>[] = [
  { id: 'sirius', name: 'Sirius', bayer: 'α CMa', constellation: 'Canis Major', raDeg: asDegrees(101.287), decDeg: asDegrees(-16.716), magnitude: -1.46 },
  { id: 'vega', name: 'Vega', bayer: 'α Lyr', constellation: 'Lyra', raDeg: asDegrees(279.234), decDeg: asDegrees(38.784), magnitude: 0.03 },
  { id: 'arcturus', name: 'Arcturus', bayer: 'α Boo', constellation: 'Boötes', raDeg: asDegrees(213.915), decDeg: asDegrees(19.182), magnitude: -0.05 },
  { id: 'capella', name: 'Capella', bayer: 'α Aur', constellation: 'Auriga', raDeg: asDegrees(79.172), decDeg: asDegrees(45.998), magnitude: 0.08 },
  { id: 'rigel', name: 'Rigel', bayer: 'β Ori', constellation: 'Orion', raDeg: asDegrees(78.634), decDeg: asDegrees(-8.201), magnitude: 0.13 },
  { id: 'betelgeuse', name: 'Betelgeuse', bayer: 'α Ori', constellation: 'Orion', raDeg: asDegrees(88.793), decDeg: asDegrees(7.407), magnitude: 0.50 },
  { id: 'aldebaran', name: 'Aldebaran', bayer: 'α Tau', constellation: 'Taurus', raDeg: asDegrees(68.980), decDeg: asDegrees(16.509), magnitude: 0.85 },
  { id: 'spica', name: 'Spica', bayer: 'α Vir', constellation: 'Virgo', raDeg: asDegrees(201.298), decDeg: asDegrees(-11.161), magnitude: 0.98 },
  { id: 'antares', name: 'Antares', bayer: 'α Sco', constellation: 'Scorpius', raDeg: asDegrees(247.352), decDeg: asDegrees(-26.432), magnitude: 1.06 },
  { id: 'altair', name: 'Altair', bayer: 'α Aql', constellation: 'Aquila', raDeg: asDegrees(297.696), decDeg: asDegrees(8.868), magnitude: 0.77 },
  { id: 'deneb', name: 'Deneb', bayer: 'α Cyg', constellation: 'Cygnus', raDeg: asDegrees(310.358), decDeg: asDegrees(45.280), magnitude: 1.25 },
  { id: 'fomalhaut', name: 'Fomalhaut', bayer: 'α PsA', constellation: 'Piscis Austrinus', raDeg: asDegrees(344.413), decDeg: asDegrees(-29.622), magnitude: 1.17 }
];

/**
 * 12 Zodiac Constellations on the Ecliptic Rete
 */
export const ZODIAC_SIGNS: ZodiacSignSegment[] = [
  { name: 'Aries', symbol: '♈', startLambda: 0, endLambda: 30, color: '#f87171' },
  { name: 'Taurus', symbol: '♉', startLambda: 30, endLambda: 60, color: '#fb923c' },
  { name: 'Gemini', symbol: '♊', startLambda: 60, endLambda: 90, color: '#facc15' },
  { name: 'Cancer', symbol: '♋', startLambda: 90, endLambda: 120, color: '#4ade80' },
  { name: 'Leo', symbol: '♌', startLambda: 120, endLambda: 150, color: '#2dd4bf' },
  { name: 'Virgo', symbol: '♍', startLambda: 150, endLambda: 180, color: '#38bdf8' },
  { name: 'Libra', symbol: '♎', startLambda: 180, endLambda: 210, color: '#818cf8' },
  { name: 'Scorpio', symbol: '♏', startLambda: 210, endLambda: 240, color: '#c084fc' },
  { name: 'Sagittarius', symbol: '♐', startLambda: 240, endLambda: 270, color: '#f472b6' },
  { name: 'Capricorn', symbol: '♑', startLambda: 270, endLambda: 300, color: '#fb7185' },
  { name: 'Aquarius', symbol: '♒', startLambda: 300, endLambda: 330, color: '#38bdf8' },
  { name: 'Pisces', symbol: '♓', startLambda: 330, endLambda: 360, color: '#a78bfa' }
];

export const CHALDEAN_PLANETS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const;
