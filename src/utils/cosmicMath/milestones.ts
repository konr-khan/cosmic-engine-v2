import { Degrees, asDegrees } from '../../types/units';
import { SeasonalMilestoneId } from './scene/types';

export interface MilestoneItem {
  id: SeasonalMilestoneId | string;
  label: string;
  date: string;
  rawX: number;
  rawY: number;
  color: string;
  textColor: string;
  fillColor: string;
  distanceAU: number;
  distanceKm: number;
  speedKms: number;
  helioEclipticLon: Degrees;
  description: string;
  textAnchor: 'start' | 'middle' | 'end';
  textDx: number;
  textDy: number;
  subDy: number;
}

/**
 * Single source of truth for Earth's 6 cardinal seasonal orbital milestones.
 * Heliocentric longitudes:
 * - March Equinox: 180° (Sun at 0° Aries, Earth on Left at 9 o'clock)
 * - June Solstice: 270° (Sun at 90° Cancer, Earth on Bottom at 6 o'clock)
 * - Aphelion: 282.94° (~5:30)
 * - September Equinox: 0° (Sun at 180° Libra, Earth on Right at 3 o'clock)
 * - December Solstice: 90° (Sun at 270° Capricorn, Earth on Top at 12 o'clock)
 * - Perihelion: 102.94° (~11:30)
 */
export const EARTH_MILESTONES: MilestoneItem[] = [
  {
    id: 'perihelion',
    label: 'Perihelion',
    date: 'Jan 3',
    rawX: -44.79,
    rawY: -194.92,
    color: '#ef4444',
    textColor: 'text-rose-400',
    fillColor: 'fill-rose-400',
    distanceAU: 0.983,
    distanceKm: 147098070,
    speedKms: 30.29,
    helioEclipticLon: asDegrees(102.94),
    description: "Earth's closest approach to the Sun. Orbital velocity peaks according to Kepler's 2nd Law (Equal Areas in Equal Times).",
    textAnchor: 'end',
    textDx: -14,
    textDy: -12,
    subDy: 2
  },
  {
    id: 'mar_equinox',
    label: 'March Equinox',
    date: 'Mar 20',
    rawX: -200,
    rawY: 0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 0.996,
    distanceKm: 149000000,
    speedKms: 29.84,
    helioEclipticLon: asDegrees(180.0),
    description: "Vernal Equinox. Sun crosses the celestial equator northbound; day and night are approximately equal (12h) worldwide.",
    textAnchor: 'end',
    textDx: -14,
    textDy: 4,
    subDy: 18
  },
  {
    id: 'jun_solstice',
    label: 'June Solstice',
    date: 'Jun 21',
    rawX: 0,
    rawY: 200,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 1.016,
    distanceKm: 152000000,
    speedKms: 29.31,
    helioEclipticLon: asDegrees(270.0),
    description: "Northern Summer Solstice. Earth's Northern Hemisphere reaches maximum axial tilt (+23.44°) toward the Sun; longest daylight in the North.",
    textAnchor: 'middle',
    textDx: 0,
    textDy: 20,
    subDy: 34
  },
  {
    id: 'aphelion',
    label: 'Aphelion',
    date: 'Jul 4',
    rawX: 44.79,
    rawY: 194.92,
    color: '#38bdf8',
    textColor: 'text-sky-400',
    fillColor: 'fill-sky-400',
    distanceAU: 1.017,
    distanceKm: 152097700,
    speedKms: 29.29,
    helioEclipticLon: asDegrees(282.94),
    description: "Earth's furthest orbital point from the Sun. Orbital velocity reaches minimum speed according to Kepler's 2nd Law.",
    textAnchor: 'start',
    textDx: 14,
    textDy: 18,
    subDy: 32
  },
  {
    id: 'sep_equinox',
    label: 'September Equinox',
    date: 'Sep 22',
    rawX: 200,
    rawY: 0,
    color: '#c084fc',
    textColor: 'text-purple-300',
    fillColor: 'fill-purple-300',
    distanceAU: 1.003,
    distanceKm: 150050000,
    speedKms: 29.74,
    helioEclipticLon: asDegrees(0.0),
    description: "Autumnal Equinox. Sun crosses the celestial equator southbound; day and night are approximately equal (12h) worldwide.",
    textAnchor: 'start',
    textDx: 14,
    textDy: 4,
    subDy: 18
  },
  {
    id: 'dec_solstice',
    label: 'December Solstice',
    date: 'Dec 21',
    rawX: 0,
    rawY: -200,
    color: '#f59e0b',
    textColor: 'text-amber-400',
    fillColor: 'fill-amber-400',
    distanceAU: 0.984,
    distanceKm: 147200000,
    speedKms: 30.27,
    helioEclipticLon: asDegrees(90.0),
    description: "Northern Winter Solstice. Earth's Southern Hemisphere reaches maximum axial tilt toward the Sun; shortest daylight in the North.",
    textAnchor: 'middle',
    textDx: 0,
    textDy: -20,
    subDy: -34
  }
];

export const MILESTONES = EARTH_MILESTONES;
