import { SOLAR_TWILIGHT_THRESHOLDS } from './astroConstants';

/**
 * Global configuration constants for theme colors, twilight thresholds, orbital scales, and calendar presets.
 */
export const CONFIG = {
  THEME: {
    NIGHT_BG: "#020617",      // slate-950 (deep astronomical night)
    NIGHT_STROKE: "#1e293b",  // slate-800
    DAY_FILL: "#fde047",      // yellow-300 (golden daylight)
    CIVIL_FILL: "#fcd34d",    // amber-300 (civil twilight)
    NAUTICAL_FILL: "#64748b", // slate-500 (nautical twilight)
    ASTRONOMICAL_FILL: "#334155", // slate-700 (astronomical twilight)
    NIGHT_FILL: "#020617",    // slate-950 (deep astronomical night)
    SUN_FILL: "#fbbf24",      // amber-400
    SUN_STROKE: "#ffffff",
    GRID_STROKE: "#94a3b8",
    ACCENT: "#6366f1"         // indigo-500
  },
  SOLAR: {
    TWILIGHT: SOLAR_TWILIGHT_THRESHOLDS
  },
  ORBIT: {
    earthRadius: 12
  },
  LAT_PRESETS: [
    { lat: 90, label: "N. Pole" },
    { lat: 66.5, label: "Arctic Circle" },
    { lat: 23.5, label: "Tropic of Cancer" },
    { lat: 0, label: "Equator" },
    { lat: -23.5, label: "Tropic of Capricorn" },
    { lat: -66.5, label: "Antarctic Circle" },
    { lat: -90, label: "S. Pole" },
  ]
} as const;

export type ConfigType = typeof CONFIG;
