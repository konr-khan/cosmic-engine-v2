/**
 * @file formatters.ts
 * Date, time, and numerical formatting and string parsing utilities.
 */

import { clamp } from './cosmicMath/core';
import { HoursDecimal } from '../types/units';

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
    return clamp(val, 0, 23.999) as HoursDecimal;
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
    return clamp(h + (m / 60) + (s / 3600), 0, 23.999) as HoursDecimal;
  }

  // 2. Format "HH:MM", "H:MM", "HH:MM:SS", "H:MM:SS" (e.g. "14:15", "9:30", "14:30:15", "0:00:30")
  if (str.includes(':')) {
    const parts = str.split(':').map((s) => parseInt(s.trim(), 10));
    if (parts.length >= 2 && !parts.slice(0, Math.min(parts.length, 3)).some(isNaN)) {
      const h = clamp(parts[0], 0, 23);
      const m = clamp(parts[1], 0, 59);
      const s = parts.length >= 3 && !isNaN(parts[2]) ? clamp(parts[2], 0, 59) : 0;
      return clamp(h + (m / 60) + (s / 3600), 0, 23.999) as HoursDecimal;
    }
  }

  // 3. Format "xxxx" 4-digit military time (e.g. "1415", "0930", "0000", "2359")
  if (/^\d{4}$/.test(str)) {
    const h = parseInt(str.slice(0, 2), 10);
    const m = parseInt(str.slice(2, 4), 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return (h + (m / 60)) as HoursDecimal;
    }
  }

  // 4. Format "xxx" 3-digit military time (e.g. "930" -> 09:30, "100" -> 01:00)
  if (/^\d{3}$/.test(str)) {
    const h = parseInt(str.slice(0, 1), 10);
    const m = parseInt(str.slice(1, 3), 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return (h + (m / 60)) as HoursDecimal;
    }
  }

  // 5. Decimal float (e.g. "14.25", "9.5", "0.5")
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      return clamp(num, 0, 23.999) as HoursDecimal;
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
