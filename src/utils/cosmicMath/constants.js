/**
 * Global configuration constants for theme colors, twilight thresholds, orbital scales, and calendar presets.
 */
export const CONFIG = {
  THEME: {
    NIGHT_BG: "#0f172a",      // slate-900
    NIGHT_STROKE: "#1e293b",  // slate-800
    DAY_FILL: "#fde047",      // yellow-300 (golden daylight)
    CIVIL_FILL: "#fcd34d",    // amber-300 (civil twilight)
    NAUTICAL_FILL: "#64748b", // slate-500 (nautical twilight)
    ASTRONOMICAL_FILL: "#334155", // slate-700 (astronomical twilight)
    NIGHT_FILL: "#0f172a",    // slate-900 (night)
    SUN_FILL: "#fbbf24",      // amber-400
    SUN_STROKE: "#ffffff",
    GRID_STROKE: "#94a3b8",
    TIDE_HIGH: "text-indigo-600",
    TIDE_LOW: "text-slate-500",
    ACCENT: "#6366f1"         // indigo-500
  },
  SOLAR: {
    TWILIGHT: { OFFICIAL: -0.833, CIVIL: -6.0, NAUTICAL: -12.0, ASTRONOMICAL: -18.0 }
  },
  ORBIT: {
    earthOrbitRadius: 200,
    moonOrbitRadius: 60,
    earthRadius: 12,
    moonRadius: 6,
    daysInYear: 365.25,
    daysInLunarCycle: 29.53
  },
  DATES: [
    { day: 79, label: "Spring Equinox (Mar)", short: "Mar Eq" },
    { day: 172, label: "Summer Solstice (Jun)", short: "Jun Sol" },
    { day: 266, label: "Autumn Equinox (Sep)", short: "Sep Eq" },
    { day: 355, label: "Winter Solstice (Dec)", short: "Dec Sol" },
  ],
  LAT_PRESETS: [
    { lat: 90, label: "N. Pole" },
    { lat: 66.5, label: "Arctic Circle" },
    { lat: 23.5, label: "Tropic of Cancer" },
    { lat: 0, label: "Equator" },
    { lat: -23.5, label: "Tropic of Capricorn" },
    { lat: -66.5, label: "Antarctic Circle" },
    { lat: -90, label: "S. Pole" },
  ]
};
