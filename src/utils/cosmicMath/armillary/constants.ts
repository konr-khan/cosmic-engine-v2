import { Degrees, asDegrees } from '../../../types/units';
import { ArmillaryStarData, ZodiacSignSegment } from './types';

export const ARMILLARY_MILESTONES_DATA = [
  {
    id: 'perihelion',
    label: 'Perihelion',
    date: 'Jan 3',
    helioEclipticLon: 102.9,
    color: '#ef4444',
    textColor: 'text-rose-400',
    fillColor: 'fill-rose-400',
    distanceAU: 0.983,
    distanceKm: 147098070,
    speedKms: 30.29,
    description: "Earth's closest approach to the Sun. Orbital velocity peaks according to Kepler's 2nd Law."
  },
  {
    id: 'mar_equinox',
    label: 'March Equinox',
    date: 'Mar 20',
    helioEclipticLon: 180.0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 0.996,
    distanceKm: 149000000,
    speedKms: 29.84,
    description: "Vernal Equinox. Sun crosses the celestial equator northbound; equal day and night worldwide."
  },
  {
    id: 'jun_solstice',
    label: 'June Solstice',
    date: 'Jun 21',
    helioEclipticLon: 270.0,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 1.016,
    distanceKm: 152000000,
    speedKms: 29.31,
    description: "Northern Summer Solstice. Earth's Northern Hemisphere reaches maximum +23.44° axial tilt toward the Sun."
  },
  {
    id: 'aphelion',
    label: 'Aphelion',
    date: 'Jul 4',
    helioEclipticLon: 282.9,
    color: '#38bdf8',
    textColor: 'text-sky-400',
    fillColor: 'fill-sky-400',
    distanceAU: 1.017,
    distanceKm: 152097700,
    speedKms: 29.29,
    description: "Earth's furthest orbital point from the Sun. Orbital velocity reaches minimum speed."
  },
  {
    id: 'sep_equinox',
    label: 'September Equinox',
    date: 'Sep 22',
    helioEclipticLon: 0.0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 1.003,
    distanceKm: 150050000,
    speedKms: 29.74,
    description: "Autumnal Equinox. Sun crosses the celestial equator southbound; equal day and night worldwide."
  },
  {
    id: 'dec_solstice',
    label: 'December Solstice',
    date: 'Dec 21',
    helioEclipticLon: 90.0,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 0.984,
    distanceKm: 147100000,
    speedKms: 30.27,
    description: "Northern Winter Solstice. Earth's Northern Hemisphere reaches maximum -23.44° axial tilt away from the Sun."
  }
];

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
