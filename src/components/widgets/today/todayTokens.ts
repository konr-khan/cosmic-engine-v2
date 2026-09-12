import { TwilightPhase, LunarElevationPhase } from '../../../utils/cosmicMath/today/elevation';

export const SOLAR_TWILIGHT_BADGE_CLASSES: Record<TwilightPhase, string> = {
  daylight: 'text-amber-400',
  civil_twilight: 'text-amber-300',
  nautical_twilight: 'text-slate-300',
  astronomical_twilight: 'text-slate-400',
  night: 'text-slate-500'
};

export const LUNAR_ELEVATION_BADGE_CLASSES: Record<LunarElevationPhase, string> = {
  above_horizon: 'text-slate-200',
  near_horizon: 'text-slate-400',
  below_horizon: 'text-slate-500'
};
