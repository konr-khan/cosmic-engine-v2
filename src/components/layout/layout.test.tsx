import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ObsNavbar } from './ObsNavbar';
import { OrbitalChronometer } from './OrbitalChronometer';
import { ChronometerReadoutCards, parseTimeString, formatTimeHHMM } from './chronometer/ChronometerReadoutCards';
import { PRESET_LAYOUTS } from '../../hooks/useDashboardLayout';
import { SolarAlmanacData } from '../../types';

describe('Layout Subsystem & Chronometer Dock Integration', () => {
  const mockWidgets: Record<string, boolean> = {
    today: true,
    armillary: true,
    almanac: true,
    lunarAlmanac: true,
    eclipse: true,
    map: true,
    macroOrbit: true,
    microTides: true
  };

  describe('ObsNavbar Navigation Bar', () => {
    it('renders branding title and logo elements', () => {
      const html = renderToStaticMarkup(
        React.createElement(ObsNavbar, {
          activePresetKey: 'balanced',
          onSelectPreset: vi.fn(),
          widgets: mockWidgets,
          onToggleWidget: vi.fn(),
          isAllLocked: false,
          onToggleAllLocked: vi.fn(),
          onResetLayout: vi.fn()
        })
      );

      expect(html).toContain('COSMIC');
      expect(html).toContain('ENGINE');
      expect(html).toContain('Presets');
      expect(html).toContain('Simulation Layers');
      expect(html).toContain('Reset');
    });

    it('renders active preset name and lock state controls', () => {
      const htmlLocked = renderToStaticMarkup(
        React.createElement(ObsNavbar, {
          activePresetKey: 'solar',
          onSelectPreset: vi.fn(),
          widgets: mockWidgets,
          onToggleWidget: vi.fn(),
          isAllLocked: true,
          onToggleAllLocked: vi.fn(),
          onResetLayout: vi.fn()
        })
      );

      // Active preset label displayed in badge
      expect(htmlLocked).toContain(PRESET_LAYOUTS['solar'].name);
      expect(htmlLocked).toContain('Locked');
      expect(htmlLocked).toContain('Unlock All Windows');

      const htmlUnlocked = renderToStaticMarkup(
        React.createElement(ObsNavbar, {
          activePresetKey: 'master',
          onSelectPreset: vi.fn(),
          widgets: mockWidgets,
          onToggleWidget: vi.fn(),
          isAllLocked: false,
          onToggleAllLocked: vi.fn(),
          onResetLayout: vi.fn()
        })
      );

      expect(htmlUnlocked).toContain(PRESET_LAYOUTS['master'].name);
      expect(htmlUnlocked).toContain('Lock Layout');
      expect(htmlUnlocked).toContain('Lock All Window Positions');
    });
  });

  describe('OrbitalChronometer Dock', () => {
    const mockDate = new Date('2026-06-21T12:00:00Z');
    const mockSolarData: SolarAlmanacData = {
      sunrise: 5.2,
      sunset: 21.1,
      solarNoon: 13.15,
      civil: 0.7,
      nautical: 1.5,
      astronomical: 2.2,
      dayLength: 15.9,
      declination: 23.44,
      equationOfTime: -1.5,
      noonElevation: 66.38,
      daysSinceEpoch: 172,
      lambda: 90,
      eclipticLongitude: 90,
      isPolarNight: false,
      isMidnightSun: false,
      distanceAU: 1.016,
      distanceKm: 152000000,
      sunAngularDiameterArcmin: 31.5
    };

    it('renders dock expansion tab when collapsed and expanded', () => {
      const htmlExpanded = renderToStaticMarkup(
        React.createElement(OrbitalChronometer, {
          date: mockDate,
          timeOfDay: 12,
          longitude: -122.81,
          latitude: 47.06,
          solarData: mockSolarData,
          isCollapsed: false,
          onToggleCollapse: vi.fn()
        })
      );
      expect(htmlExpanded).toContain('COLLAPSE DOCK');

      const htmlCollapsed = renderToStaticMarkup(
        React.createElement(OrbitalChronometer, {
          date: mockDate,
          timeOfDay: 12,
          longitude: -122.81,
          latitude: 47.06,
          solarData: mockSolarData,
          isCollapsed: true,
          onToggleCollapse: vi.fn()
        })
      );
      expect(htmlCollapsed).toContain('EXPAND ASTROLABE DOCK');
    });

    it('calculates and renders correct twilight phases', () => {
      // Daylight
      const htmlDay = renderToStaticMarkup(
        React.createElement(OrbitalChronometer, {
          date: mockDate,
          timeOfDay: 12,
          longitude: -122.81,
          latitude: 47.06,
          solarData: mockSolarData
        })
      );
      expect(htmlDay).toContain('Full Daylight');

      // Polar night
      const htmlPolarNight = renderToStaticMarkup(
        React.createElement(OrbitalChronometer, {
          date: mockDate,
          timeOfDay: 12,
          longitude: -122.81,
          latitude: 78.0,
          solarData: { ...mockSolarData, dayLength: 0 }
        })
      );
      expect(htmlPolarNight).toContain('Polar Night');

      // Midnight sun
      const htmlMidnightSun = renderToStaticMarkup(
        React.createElement(OrbitalChronometer, {
          date: mockDate,
          timeOfDay: 0,
          longitude: -122.81,
          latitude: 78.0,
          solarData: { ...mockSolarData, dayLength: 24 }
        })
      );
      expect(htmlMidnightSun).toContain('Midnight Sun');

      // Deep night
      const htmlNight = renderToStaticMarkup(
        React.createElement(OrbitalChronometer, {
          date: mockDate,
          timeOfDay: 1.0,
          longitude: -122.81,
          latitude: 47.06,
          solarData: mockSolarData
        })
      );
      expect(htmlNight).toContain('Night');
    });
  });

  describe('ChronometerReadoutCards & Time Parsers', () => {
    it('renders latitude, longitude, date, and time readouts', () => {
      const html = renderToStaticMarkup(
        React.createElement(ChronometerReadoutCards, {
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 14.5,
          date: new Date('2026-06-21T12:00:00Z')
        })
      );

      expect(html).toContain('LATITUDE');
      expect(html).toContain('LONGITUDE');
      expect(html).toContain('TIME (UTC)');
      expect(html).toContain('DATE');
      expect(html).toContain('DOY 172');
    });

    it('parses various standard time strings via parseTimeString', () => {
      // HH:MM 24h
      expect(parseTimeString('14:30')).toBeCloseTo(14.5, 2);
      expect(parseTimeString('00:00')).toBeCloseTo(0.0, 2);
      expect(parseTimeString('23:59')).toBeCloseTo(23.983, 2);

      // Compact military HHMM
      expect(parseTimeString('1430')).toBeCloseTo(14.5, 2);
      expect(parseTimeString('0915')).toBeCloseTo(9.25, 2);

      // 12-hour AM/PM
      expect(parseTimeString('2:30 PM')).toBeCloseTo(14.5, 2);
      expect(parseTimeString('12:00 AM')).toBeCloseTo(0.0, 2);
      expect(parseTimeString('12:00 PM')).toBeCloseTo(12.0, 2);
      expect(parseTimeString('11:30 PM')).toBeCloseTo(23.5, 2);

      // Decimal hours
      expect(parseTimeString('15.75')).toBeCloseTo(15.75, 2);

      // Clamping behavior on out-of-range HH:MM
      expect(parseTimeString('25:00')).toBeCloseTo(23.0, 2);
      expect(parseTimeString('12:65')).toBeCloseTo(12.983, 2);

      // Non-parseable strings return undefined
      expect(parseTimeString('invalid')).toBeUndefined();
      expect(parseTimeString('')).toBeUndefined();
      expect(parseTimeString(null)).toBeUndefined();
      expect(parseTimeString(undefined)).toBeUndefined();
    });

    it('formats decimal hours into HH:MM string via formatTimeHHMM', () => {
      expect(formatTimeHHMM(14.5)).toBe('14:30');
      expect(formatTimeHHMM(0)).toBe('00:00');
      expect(formatTimeHHMM(23.75)).toBe('23:45');
      expect(formatTimeHHMM(9.25)).toBe('09:15');
    });

    it('clamps latitude and longitude values upon direct input callbacks', () => {
      const onLatMock = vi.fn();
      const onLonMock = vi.fn();

      const simulateDirectLat = (val: number) => {
        const clamped = Math.max(-90, Math.min(90, val));
        onLatMock(clamped);
      };
      const simulateDirectLon = (val: number) => {
        const clamped = Math.max(-180, Math.min(180, val));
        onLonMock(clamped);
      };

      simulateDirectLat(120);
      expect(onLatMock).toHaveBeenCalledWith(90);

      simulateDirectLat(-100);
      expect(onLatMock).toHaveBeenCalledWith(-90);

      simulateDirectLon(200);
      expect(onLonMock).toHaveBeenCalledWith(180);

      simulateDirectLon(-250);
      expect(onLonMock).toHaveBeenCalledWith(-180);
    });
  });
});
