/**
 * Converts degrees to radians.
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle in radians
 */
export const toRadians = (deg) => deg * (Math.PI / 180);

/**
 * Converts radians to degrees.
 * @param {number} rad - Angle in radians
 * @returns {number} Angle in degrees
 */
export const toDegrees = (rad) => rad * (180 / Math.PI);

/**
 * Formats a decimal hour value (0..24) into a standard HH:MM:SS string.
 * @param {number} decimalHours - Decimal hour value
 * @returns {string} Formatted HH:MM:SS string
 */
export const formatTime = (decimalHours) => {
  if (isNaN(decimalHours) || decimalHours === null) return "--:--:--";
  let normalized = decimalHours;
  while (normalized < 0) normalized += 24;
  while (normalized >= 24) normalized -= 24;
  
  const hours = Math.floor(normalized);
  const minutes = Math.floor((normalized - hours) * 60);
  const seconds = Math.round(((normalized - hours) * 60 - minutes) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Generates an SVG path string for daylight/twilight sector wedges in SunClock.
 * @param {number} duration - Sector duration in decimal hours
 * @param {number} center - SVG canvas center coordinate in pixels
 * @param {number} radius - Sector arc radius in pixels
 * @returns {string} SVG path `d` attribute string
 */
export const getSectorPath = (duration, center, radius) => {
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
 * Calculates the Astronomical Julian Date (JD) for a JavaScript Date and optional decimal hour.
 * @param {Date} date - Local calendar date
 * @param {number} [timeOfDay=12] - Time of day in decimal hours (0 to 24)
 * @returns {number} Julian Date (JD)
 */
export const getJulianDate = (date, timeOfDay = 12) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD_midnight = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  return JD_midnight + (timeOfDay / 24.0);
};

/**
 * Formats a Date object as a YYYY-MM-DD string.
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted YYYY-MM-DD date string
 */
export const formatYMD = (date) => {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Determines whether a given year is a leap year.
 * @param {number} year - Four-digit year
 * @returns {boolean} True if leap year
 */
export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

/**
 * Returns total days in a given calendar year (365 or 366).
 * @param {number} year - Four-digit year
 * @returns {number} 366 for leap year, 365 otherwise
 */
export const getDaysInYear = (year) => (isLeapYear(year) ? 366 : 365);
