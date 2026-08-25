import { 
  Degrees, 
  Radians, 
  JulianDate, 
  HoursDecimal, 
  DayOfYear,
  asDegrees, 
  asRadians, 
  asJulianDate 
} from '../../types/units';
import { Vector3D } from '../../types/coordinates';

/**
 * Converts degrees to radians.
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
export const toRadians = (deg: Degrees | number): Radians => {
  return asRadians(deg * (Math.PI / 180));
};

/**
 * Converts radians to degrees.
 * @param rad - Angle in radians
 * @returns Angle in degrees
 */
export const toDegrees = (rad: Radians | number): Degrees => {
  return asDegrees(rad * (180 / Math.PI));
};

/**
 * Clamps a numerical value within [min, max] bounds.
 * @param val - Input value
 * @param min - Lower bound
 * @param max - Upper bound
 * @returns Clamped value
 */
export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

/**
 * Formats a decimal hour value (0..24) into a standard HH:MM:SS string.
 * @param decimalHours - Decimal hour value
 * @returns Formatted HH:MM:SS string
 */
export const formatTime = (decimalHours: number | null | undefined): string => {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) return "--:--:--";
  let normalized = decimalHours % 24;
  if (normalized < 0) normalized += 24;
  
  const totalSeconds = Math.round(normalized * 3600) % 86400;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Generates an SVG path string for daylight/twilight sector wedges in SunClock.
 * @param duration - Sector duration in decimal hours
 * @param center - SVG canvas center coordinate in pixels
 * @param radius - Sector arc radius in pixels
 * @returns SVG path `d` attribute string
 */
export const getSectorPath = (duration: number, center: number, radius: number): string => {
  if (duration <= 0) return "";
  if (duration >= 24) {
    return `M ${center},${center - radius} A ${radius},${radius} 0 1,1 ${center},${center + radius} A ${radius},${radius} 0 1,1 ${center},${center - radius}`;
  }
  
  const half = duration / 2;
  const startAngle = (12 - half - 12) * 15 - 90;
  const endAngle = (12 + half - 12) * 15 - 90;
  
  const x1 = center + radius * Math.cos(toRadians(startAngle));
  const y1 = center + radius * Math.sin(toRadians(startAngle));
  const x2 = center + radius * Math.cos(toRadians(endAngle));
  const y2 = center + radius * Math.sin(toRadians(endAngle));
  
  const largeArcFlag = duration > 12 ? 1 : 0;
  return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

/**
 * Creates a UTC Date representing the specified year, month (1..12), and day (1..31).
 * Avoids local timezone offsets when instantiating astronomical calendar dates.
 * @param year - 4-digit year (e.g., 2026)
 * @param month - 1-indexed month (1 = January, 12 = December)
 * @param day - 1-indexed day of month (1..31)
 * @returns Date instance anchored to UTC midnight
 */
export const createUTCDate = (year: number, month: number, day: number): Date => {
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Calculates the Astronomical Julian Date (JD) for a JavaScript Date and optional decimal hour.
 * Evaluates calendar components in UTC to ensure timezone invariance.
 * @param date - Calendar date
 * @param timeOfDay - Time of day in decimal hours (0 to 24)
 * @returns Julian Date (JD)
 */
export const getJulianDate = (date: Date, timeOfDay: number = 12): JulianDate => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD_midnight = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  return asJulianDate(JD_midnight + (timeOfDay / 24.0));
};

/**
 * Formats a Date object as a YYYY-MM-DD string using UTC calendar components.
 * @param date - JavaScript Date object
 * @returns Formatted YYYY-MM-DD date string
 */
export const formatYMD = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Determines whether a given year is a leap year.
 * @param year - Four-digit year
 * @returns True if leap year
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Returns total days in a given calendar year (365 or 366).
 * @param year - Four-digit year
 * @returns 366 for leap year, 365 otherwise
 */
export const getDaysInYear = (year: number): number => {
  return isLeapYear(year) ? 366 : 365;
};

/**
 * Returns day of the year (1..366) for a given Date, computed deterministically via UTC.
 * @param date - JavaScript Date object
 * @returns Day of year (1 to 366)
 */
export const getDayOfYear = (date: Date | null | undefined): DayOfYear => {
  if (!date || isNaN(date.getTime())) return 1;
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const startOfYear = Date.UTC(y, 0, 1);
  const currentDay = Date.UTC(y, m, d);
  return Math.floor((currentDay - startOfYear) / 86400000) + 1;
};

/**
 * Parses diverse user time strings into a decimal hour value (0 to 23.999...).
 * Supports standard "HH:MM", "H:MM", "HH:MM:SS", "H:MM:SS", 12-hour AM/PM formats
 * (e.g. "2:30 PM", "11:45 am", "02:30:15 pm", "12:00 AM", "12:00 PM"),
 * military time "1415", "0930", "930", and decimal hours "14.25".
 * 
 * @param val - Input time string or number
 * @returns Decimal hour value (0..23.999...) or undefined if unparseable
 */
export const parseTimeString = (val: string | number | null | undefined): HoursDecimal | undefined => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') {
    if (isNaN(val)) return undefined;
    return clamp(val, 0, 23.999);
  }
  const str = String(val).trim();
  if (!str) return undefined;

  // 1. 12-hour AM/PM formats (e.g. "2:30 PM", "11:45 am", "02:30:15 pm", "12:00 AM", "12:00 PM", "2 PM")
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2] ? clamp(parseInt(ampmMatch[2], 10), 0, 59) : 0;
    const s = ampmMatch[3] ? clamp(parseInt(ampmMatch[3], 10), 0, 59) : 0;
    const isPM = ampmMatch[4].toLowerCase() === 'pm';

    if (h === 12) {
      h = isPM ? 12 : 0;
    } else {
      h = isPM ? h + 12 : h;
    }
    h = clamp(h, 0, 23);
    return clamp(h + (m / 60) + (s / 3600), 0, 23.999);
  }

  // 2. Format "HH:MM", "H:MM", "HH:MM:SS", "H:MM:SS" (e.g. "14:15", "9:30", "14:30:15", "0:00:30")
  if (str.includes(':')) {
    const parts = str.split(':').map((s) => parseInt(s.trim(), 10));
    if (parts.length >= 2 && !parts.slice(0, Math.min(parts.length, 3)).some(isNaN)) {
      const h = clamp(parts[0], 0, 23);
      const m = clamp(parts[1], 0, 59);
      const s = parts.length >= 3 && !isNaN(parts[2]) ? clamp(parts[2], 0, 59) : 0;
      return clamp(h + (m / 60) + (s / 3600), 0, 23.999);
    }
  }

  // 3. Format "xxxx" 4-digit military time (e.g. "1415", "0930", "0000", "2359")
  if (/^\d{4}$/.test(str)) {
    const h = parseInt(str.slice(0, 2), 10);
    const m = parseInt(str.slice(2, 4), 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h + (m / 60);
    }
  }

  // 4. Format "xxx" 3-digit military time (e.g. "930" -> 09:30, "100" -> 01:00)
  if (/^\d{3}$/.test(str)) {
    const h = parseInt(str.slice(0, 1), 10);
    const m = parseInt(str.slice(1, 3), 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h + (m / 60);
    }
  }

  // 5. Decimal float (e.g. "14.25", "9.5", "0.5")
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      return clamp(num, 0, 23.999);
    }
  }

  return undefined;
};

/**
 * Formats a decimal hour value (0..24) into an "HH:MM" 24-hour time string.
 * @param t - Decimal hour value
 * @returns Formatted "HH:MM" string
 */
export const formatTimeHHMM = (t: number | null | undefined): string => {
  if (t === undefined || t === null || isNaN(t)) return "00:00";
  let norm = (t % 24 + 24) % 24;
  const h = Math.floor(norm);
  const m = Math.floor((norm - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Spherical Linear Interpolation (SLERP) for 3D Cartesian vectors.
 * Smoothly interpolates direction along the shortest great-circle arc on S^2
 * and linearly interpolates magnitude, preventing chord-cutting artifacts and
 * keeping celestial bodies on their orbital spheres during model transitions.
 *
 * @param v1 - Starting 3D vector
 * @param v2 - Target 3D vector
 * @param t - Interpolation factor in [0, 1]
 * @returns Interpolated 3D vector
 */
export const slerp3D = (v1: Vector3D, v2: Vector3D, t: number): Vector3D => {
  const clampT = clamp(t, 0, 1);
  if (clampT === 0) return { ...v1 };
  if (clampT === 1) return { ...v2 };

  const r1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const r2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  // If both vectors are at or near the origin, standard linear interpolation
  if (r1 < 1e-6 && r2 < 1e-6) {
    return {
      x: (1 - clampT) * v1.x + clampT * v2.x,
      y: (1 - clampT) * v1.y + clampT * v2.y,
      z: (1 - clampT) * v1.z + clampT * v2.z
    };
  }

  // If one vector is at origin, smoothly scale magnitude along the non-zero direction
  if (r1 < 1e-6) {
    return { x: v2.x * clampT, y: v2.y * clampT, z: v2.z * clampT };
  }
  if (r2 < 1e-6) {
    const scale = 1 - clampT;
    return { x: v1.x * scale, y: v1.y * scale, z: v1.z * scale };
  }

  // Normalized unit vectors
  const u1 = { x: v1.x / r1, y: v1.y / r1, z: v1.z / r1 };
  const u2 = { x: v2.x / r2, y: v2.y / r2, z: v2.z / r2 };

  // Dot product and angle
  let dot = u1.x * u2.x + u1.y * u2.y + u1.z * u2.z;
  dot = clamp(dot, -1, 1);

  // If vectors are nearly identical / collinear in same direction
  if (dot > 0.99995) {
    const rT = (1 - clampT) * r1 + clampT * r2;
    const avgX = (1 - clampT) * u1.x + clampT * u2.x;
    const avgY = (1 - clampT) * u1.y + clampT * u2.y;
    const avgZ = (1 - clampT) * u1.z + clampT * u2.z;
    const avgLen = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ) || 1;
    return {
      x: (avgX / avgLen) * rT,
      y: (avgY / avgLen) * rT,
      z: (avgZ / avgLen) * rT
    };
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);

  // If vectors are nearly opposite (180 deg), choose a deterministic orthogonal axis to rotate around
  if (sinTheta < 1e-5) {
    const ortho = Math.abs(u1.y) < 0.99 
      ? { x: -u1.z, y: 0, z: u1.x }
      : { x: 0, y: -u1.z, z: u1.y };
    const orthoLen = Math.sqrt(ortho.x * ortho.x + ortho.y * ortho.y + ortho.z * ortho.z) || 1;
    const normOrtho = { x: ortho.x / orthoLen, y: ortho.y / orthoLen, z: ortho.z / orthoLen };
    
    const rotAngle = clampT * Math.PI;
    const cosA = Math.cos(rotAngle);
    const sinA = Math.sin(rotAngle);
    
    // Rodrigues rotation formula (normOrtho . u1 = 0)
    const crossX = normOrtho.y * u1.z - normOrtho.z * u1.y;
    const crossY = normOrtho.z * u1.x - normOrtho.x * u1.z;
    const crossZ = normOrtho.x * u1.y - normOrtho.y * u1.x;

    const rT = (1 - clampT) * r1 + clampT * r2;
    return {
      x: (u1.x * cosA + crossX * sinA) * rT,
      y: (u1.y * cosA + crossY * sinA) * rT,
      z: (u1.z * cosA + crossZ * sinA) * rT
    };
  }

  // Standard Slerp formula on S^2
  const w1 = Math.sin((1 - clampT) * theta) / sinTheta;
  const w2 = Math.sin(clampT * theta) / sinTheta;

  const ux = w1 * u1.x + w2 * u2.x;
  const uy = w1 * u1.y + w2 * u2.y;
  const uz = w1 * u1.z + w2 * u2.z;

  const rT = (1 - clampT) * r1 + clampT * r2;

  return {
    x: ux * rT,
    y: uy * rT,
    z: uz * rT
  };
};

