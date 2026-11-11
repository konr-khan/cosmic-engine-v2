/**
 * @file formatters.test.ts
 * Unit tests for temporal formatting, date conversion, and time string parsing utilities.
 */

import { describe, it, expect } from 'vitest';
import { formatYMD, parseTimeString, formatTimeHHMM, formatTime } from './formatters';

describe('formatters unit test suite', () => {
  describe('formatYMD', () => {
    it('formats Date objects to YYYY-MM-DD format using UTC components', () => {
      expect(formatYMD(new Date(Date.UTC(2026, 0, 15)))).toBe('2026-01-15');
      expect(formatYMD(new Date(Date.UTC(2024, 11, 31)))).toBe('2024-12-31');
      expect(formatYMD(new Date(Date.UTC(2000, 0, 1)))).toBe('2000-01-01');
    });

    it('handles invalid dates, null, and undefined gracefully', () => {
      expect(formatYMD(new Date('invalid'))).toBe('');
      expect(formatYMD(null)).toBe('');
      expect(formatYMD(undefined)).toBe('');
    });
  });

  describe('parseTimeString', () => {
    it('parses colon-separated time strings (HH:MM and H:MM)', () => {
      expect(parseTimeString('14:30')).toBeCloseTo(14.5);
      expect(parseTimeString('9:30')).toBeCloseTo(9.5);
      expect(parseTimeString('0:00')).toBe(0);
      expect(parseTimeString('00:15')).toBeCloseTo(0.25);
      expect(parseTimeString('23:59')).toBeCloseTo(23 + 59 / 60);
    });

    it('parses timestamps with seconds (HH:MM:SS and H:MM:SS)', () => {
      expect(parseTimeString('14:30:15')).toBeCloseTo(14.504167, 4);
      expect(parseTimeString('14:30:30')).toBeCloseTo(14.508333, 4);
      expect(parseTimeString('0:00:30')).toBeCloseTo(30 / 3600, 4);
    });

    it('parses 12-hour AM/PM time strings', () => {
      expect(parseTimeString('2:30 PM')).toBeCloseTo(14.5);
      expect(parseTimeString('11:45 am')).toBeCloseTo(11.75);
      expect(parseTimeString('02:30:15 pm')).toBeCloseTo(14.504167, 4);
      expect(parseTimeString('12:00 AM')).toBe(0);
      expect(parseTimeString('12:30 AM')).toBeCloseTo(0.5);
      expect(parseTimeString('12:00 PM')).toBe(12);
      expect(parseTimeString('12:30 PM')).toBeCloseTo(12.5);
      expect(parseTimeString('2 PM')).toBe(14);
      expect(parseTimeString('12 AM')).toBe(0);
      expect(parseTimeString('2:30pm')).toBeCloseTo(14.5);
    });

    it('parses 4-digit military time strings (HHMM)', () => {
      expect(parseTimeString('1430')).toBeCloseTo(14.5);
      expect(parseTimeString('0930')).toBeCloseTo(9.5);
      expect(parseTimeString('0000')).toBe(0);
      expect(parseTimeString('2359')).toBeCloseTo(23 + 59 / 60);
    });

    it('parses 3-digit military time strings (HMM)', () => {
      expect(parseTimeString('930')).toBeCloseTo(9.5);
      expect(parseTimeString('100')).toBeCloseTo(1.0);
      expect(parseTimeString('645')).toBeCloseTo(6.75);
    });

    it('parses decimal float strings', () => {
      expect(parseTimeString('14.5')).toBeCloseTo(14.5);
      expect(parseTimeString('14.25')).toBeCloseTo(14.25);
      expect(parseTimeString('9.75')).toBeCloseTo(9.75);
      expect(parseTimeString('0.5')).toBeCloseTo(0.5);
    });

    it('clamps values and handles invalid or empty inputs gracefully', () => {
      expect(parseTimeString('')).toBeUndefined();
      expect(parseTimeString('   ')).toBeUndefined();
      expect(parseTimeString(null)).toBeUndefined();
      expect(parseTimeString(undefined)).toBeUndefined();
      expect(parseTimeString('invalid')).toBeUndefined();
      expect(parseTimeString('25:00')).toBeCloseTo(23.0); // clamped hours
      expect(parseTimeString('12:99')).toBeCloseTo(12 + 59 / 60); // clamped minutes
      expect(parseTimeString('24.5')).toBe(23.999); // clamped float
      expect(parseTimeString('  14:30  ')).toBeCloseTo(14.5); // whitespace trimming
      expect(parseTimeString(14.5)).toBeCloseTo(14.5); // direct number
    });
  });

  describe('formatTimeHHMM', () => {
    it('formats decimal hours to HH:MM format', () => {
      expect(formatTimeHHMM(14.5)).toBe('14:30');
      expect(formatTimeHHMM(9.5)).toBe('09:30');
      expect(formatTimeHHMM(0)).toBe('00:00');
      expect(formatTimeHHMM(23.99)).toBe('23:59');
      expect(formatTimeHHMM(-1)).toBe('23:00'); // wrap-around
      expect(formatTimeHHMM(25)).toBe('01:00'); // wrap-around
      expect(formatTimeHHMM(NaN)).toBe('00:00');
      expect(formatTimeHHMM(null)).toBe('00:00');
      expect(formatTimeHHMM(undefined)).toBe('00:00');
    });
  });

  describe('formatTime', () => {
    it('formats decimal hours to HH:MM:SS format', () => {
      expect(formatTime(12.5)).toBe('12:30:00');
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(23.5)).toBe('23:30:00');
      expect(formatTime(-1)).toBe('23:00:00');
      expect(formatTime(25)).toBe('01:00:00');
      expect(formatTime(NaN)).toBe('--:--:--');
      expect(formatTime(null)).toBe('--:--:--');
      expect(formatTime(undefined)).toBe('--:--:--');
      expect(formatTime(12.99999)).toBe('13:00:00');
      expect(formatTime(23.99999)).toBe('00:00:00');
    });
  });
});
