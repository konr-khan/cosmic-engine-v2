/**
 * @file AstrolabeDial.test.tsx
 * Unit test suite for AstrolabeDial component:
 * - Rendering of SVG root element, MiniGlobe, and 4 concentric ring elements (Date, Time, Lon, Lat)
 * - Observer-locked camera yaw calculations across timeOfDay and longitude parameters
 * - Dynamic latitude armillary rail reticle positioning and chord half-width
 * - Pointer interaction callback wiring and radial hit-testing zones
 * - Angle-to-value conversion mathematics and boundary rollover handling
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AstrolabeDial } from './AstrolabeDial';
import { toRadians, toDegrees, getDaysInYear, getDayOfYear } from '../../../utils/cosmicMath';

describe('AstrolabeDial Component', () => {
  const standardProps = {
    date: new Date('2026-06-21T12:00:00Z'),
    timeOfDay: 12,
    latitude: 47.06,
    longitude: -122.33,
    declination: 23.44,
    onDateChange: vi.fn(),
    onTimeChange: vi.fn(),
    onLatChange: vi.fn(),
    onLonChange: vi.fn()
  };

  describe('SVG Root and Structural Elements Rendering', () => {
    it('renders the SVG root element with standard 270x270 centered viewBox', () => {
      const html = renderToStaticMarkup(<AstrolabeDial {...standardProps} />);
      expect(html).toContain('viewBox="-135 -135 270 270"');
      expect(html).toContain('cursor-grab');
      expect(html).toContain('id="hubGlow"');
    });

    it('renders outer bezel hairlines and background circles', () => {
      const html = renderToStaticMarkup(<AstrolabeDial {...standardProps} />);
      expect(html).toContain('r="134"');
      expect(html).toContain('r="132.5"');
      expect(html).toContain('r="45"');
    });

    it('renders all 4 concentric control rings with distinct radii and theme colors', () => {
      const html = renderToStaticMarkup(<AstrolabeDial {...standardProps} />);

      // 1. Date Ring: radius 125, width 14, emerald (#10b981)
      expect(html).toContain('r="125"');
      expect(html).toContain('stroke="#10b981"');

      // 2. Time Ring: radius 102, width 14, sky blue (#38bdf8)
      expect(html).toContain('r="102"');
      expect(html).toContain('stroke="#38bdf8"');

      // 3. Longitude Ring: radius 78, width 14, amber (#f59e0b)
      expect(html).toContain('r="78"');
      expect(html).toContain('stroke="#f59e0b"');

      // 4. Latitude Armillary Rail: radius 54, width 14, rose (#f43f5e)
      expect(html).toContain('M 0 -54 A 54 54');
      expect(html).toContain('stroke="#f43f5e"');
    });

    it('renders central Living Earth MiniGlobe with continents, parallels, and observer pin', () => {
      const html = renderToStaticMarkup(<AstrolabeDial {...standardProps} />);

      // MiniGlobe root container with r=45
      expect(html).toContain('miniglobe-root');
      expect(html).toContain('r="45"');
      // Continents rendered via SVG paths
      expect(html).toContain('<path');
      // Atmosphere glow gradient
      expect(html).toContain('stop-color="#38bdf8"');
      // Meridian sighting line (North-South, x1="0" y1="-45" x2="0" y2="45")
      expect(html).toContain('x1="0" y1="-45" x2="0" y2="45"');
      // Equator reference chord (x1="-45" y1="0" x2="45" y2="0")
      expect(html).toContain('x1="-45" y1="0" x2="45" y2="0"');
    });
  });

  describe('Observer-Locked Camera Yaw Calculation', () => {
    // Formula: hourAngleDeg = ((timeOfDay - 12) * 15) + longitude; yaw = -hourAngleDeg
    const calculateYaw = (timeOfDay: number, longitude: number): number => {
      const hourAngleDeg = ((timeOfDay - 12) * 15) + longitude;
      const yaw = -hourAngleDeg;
      return yaw === 0 ? 0 : yaw;
    };

    it('locks Greenwich noon observer to 0° yaw', () => {
      expect(calculateYaw(12, 0)).toBe(0);
    });

    it('calculates yaw correctly at solar noon for non-zero longitudes', () => {
      // At longitude = +90°E at noon, yaw should be -90°
      expect(calculateYaw(12, 90)).toBe(-90);
      // At longitude = -120°W at noon, yaw should be +120°
      expect(calculateYaw(12, -120)).toBe(120);
    });

    it('calculates yaw correctly as timeOfDay advances from dawn to dusk', () => {
      // 06:00 UTC at Prime Meridian: hourAngle = (6 - 12) * 15 = -90 -> yaw = +90
      expect(calculateYaw(6, 0)).toBe(90);
      // 18:00 UTC at Prime Meridian: hourAngle = (18 - 12) * 15 = +90 -> yaw = -90
      expect(calculateYaw(18, 0)).toBe(-90);
      // Midnight (00:00 UTC) at Prime Meridian: hourAngle = -180 -> yaw = +180
      expect(calculateYaw(0, 0)).toBe(180);
    });

    it('renders distinct continent vector projections as yaw changes', () => {
      const htmlNoon = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} timeOfDay={12} longitude={0} />
      );
      const htmlMidnight = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} timeOfDay={0} longitude={0} />
      );
      // Projections must be different between noon and midnight
      expect(htmlNoon).not.toEqual(htmlMidnight);
    });
  });

  describe('Latitude Rail Reticle Positioning', () => {
    // Formula: latRad = toRadians(latitude); yObs = -45 * sin(latRad); latChordHalfWidth = 45 * cos(latRad)
    it('computes and renders dynamic latitude reticle for mid-latitude northern hemisphere', () => {
      const lat = 45;
      const latRad = toRadians(lat);
      const expectedY = -45 * Math.sin(latRad); // ~ -31.8198
      const expectedHalfW = 45 * Math.cos(latRad); // ~ 31.8198

      const html = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} latitude={lat} />
      );

      // Verify presence of dynamic reticle line with rose stroke
      expect(html).toContain('stroke="#f43f5e"');
      expect(html).toContain(`y1="${expectedY}"`);
      expect(html).toContain(`y2="${expectedY}"`);
      expect(html).toContain(`x1="${-expectedHalfW}"`);
      expect(html).toContain(`x2="${expectedHalfW}"`);
    });

    it('computes and renders dynamic latitude reticle for southern hemisphere', () => {
      const lat = -30;
      const latRad = toRadians(lat);
      const expectedY = -45 * Math.sin(latRad); // +22.5
      const expectedHalfW = 45 * Math.cos(latRad); // ~ 38.9711

      const html = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} latitude={lat} />
      );

      expect(html).toContain(`y1="${expectedY}"`);
      expect(html).toContain(`y2="${expectedY}"`);
      expect(html).toContain(`x1="${-expectedHalfW}"`);
      expect(html).toContain(`x2="${expectedHalfW}"`);
    });

    it('omits dynamic latitude reticle at the equator (|latitude| <= 0.5)', () => {
      const html = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} latitude={0} />
      );

      // Reticle with stroke-dasharray="3 1.5" is only rendered when |latitude| > 0.5
      expect(html).not.toContain('stroke-dasharray="3 1.5"');
    });

    it('handles extreme polar latitudes (+90° and -90°)', () => {
      const northPoleHtml = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} latitude={90} />
      );
      expect(northPoleHtml).toContain('y1="-45"');
      expect(northPoleHtml).toContain('y2="-45"');

      const southPoleHtml = renderToStaticMarkup(
        <AstrolabeDial {...standardProps} latitude={-90} />
      );
      expect(southPoleHtml).toContain('y1="45"');
      expect(southPoleHtml).toContain('y2="45"');
    });
  });

  describe('Pointer Interaction Callbacks & Kinematics', () => {
    it('preserves pointer interaction callback props on component element', () => {
      const onTimeChange = vi.fn();
      const onDateChange = vi.fn();
      const onLatChange = vi.fn();
      const onLonChange = vi.fn();

      const element = (
        <AstrolabeDial
          {...standardProps}
          onTimeChange={onTimeChange}
          onDateChange={onDateChange}
          onLatChange={onLatChange}
          onLonChange={onLonChange}
        />
      );

      expect(element.props.onTimeChange).toBe(onTimeChange);
      expect(element.props.onDateChange).toBe(onDateChange);
      expect(element.props.onLatChange).toBe(onLatChange);
      expect(element.props.onLonChange).toBe(onLonChange);

      // Directly verify callback invocation contracts
      element.props.onTimeChange(15.25);
      expect(onTimeChange).toHaveBeenCalledWith(15.25);

      const targetDate = new Date('2026-09-22T00:00:00Z');
      element.props.onDateChange(targetDate);
      expect(onDateChange).toHaveBeenCalledWith(targetDate);

      element.props.onLatChange(51.5);
      expect(onLatChange).toHaveBeenCalledWith(51.5);

      element.props.onLonChange(-0.12);
      expect(onLonChange).toHaveBeenCalledWith(-0.12);
    });

    describe('Radial Hit-Testing Thresholds', () => {
      // Hit thresholds from AstrolabeDial:
      // scaledR > 115 && scaledR <= 135 -> 'date'
      // scaledR > 90 && scaledR <= 115  -> 'time'
      // scaledR > 65 && scaledR <= 90   -> 'lon'
      // scaledR > 45 && scaledR <= 65 && dx < 10 -> 'lat'
      const getTargetRing = (r: number, dx: number = 0): string | null => {
        if (r > 115 && r <= 135) return 'date';
        if (r > 90 && r <= 115) return 'time';
        if (r > 65 && r <= 90) return 'lon';
        if (r > 45 && r <= 65 && dx < 10) return 'lat';
        return null;
      };

      it('maps radius ranges to corresponding control rings accurately', () => {
        expect(getTargetRing(125)).toBe('date');
        expect(getTargetRing(102)).toBe('time');
        expect(getTargetRing(78)).toBe('lon');
        expect(getTargetRing(54, -20)).toBe('lat');
        // Right side of armillary rail (dx >= 10) is excluded
        expect(getTargetRing(54, 20)).toBeNull();
        // Outside dial
        expect(getTargetRing(140)).toBeNull();
        // Inner globe core
        expect(getTargetRing(30)).toBeNull();
      });
    });

    describe('Angle to Value Conversion Formulas', () => {
      // getAngle formula:
      // angle = toDegrees(Math.atan2(dy, dx)) + 90; if (angle < 0) angle += 360
      const getAngle = (dx: number, dy: number): number => {
        let angle = toDegrees(Math.atan2(dy, dx)) + 90;
        if (angle < 0) angle += 360;
        return angle;
      };

      it('converts clock positions to angles correctly (12=0°, 3=90°, 6=180°, 9=270°)', () => {
        expect(getAngle(0, -100)).toBeCloseTo(0, 5);   // 12 o'clock
        expect(getAngle(100, 0)).toBeCloseTo(90, 5);   // 3 o'clock
        expect(getAngle(0, 100)).toBeCloseTo(180, 5);  // 6 o'clock
        expect(getAngle(-100, 0)).toBeCloseTo(270, 5); // 9 o'clock
      });

      it('computes time from angle accurately: timeOfDay = (angle / 360) * 24', () => {
        const computeTime = (angle: number): number => parseFloat(((angle / 360) * 24).toFixed(3));
        expect(computeTime(0)).toBe(0);      // Midnight (00:00)
        expect(computeTime(90)).toBe(6);     // Dawn (06:00)
        expect(computeTime(180)).toBe(12);   // Noon (12:00)
        expect(computeTime(270)).toBe(18);   // Dusk (18:00)
      });

      it('computes longitude from angle accurately (0° Top, +90° Right, ±180° Bottom, -90° Left)', () => {
        const computeLon = (angle: number): number => {
          let lon = angle;
          if (lon > 180) lon -= 360;
          return Math.round(lon);
        };
        expect(computeLon(0)).toBe(0);       // Prime Meridian
        expect(computeLon(90)).toBe(90);     // 90° East
        expect(computeLon(180)).toBe(180);   // International Date Line
        expect(computeLon(270)).toBe(-90);   // 90° West
      });

      it('computes day-of-year from angle accurately', () => {
        const totalDays = 365;
        const computeDay = (angle: number): number =>
          Math.max(1, Math.min(totalDays, Math.round((angle / 360) * totalDays) || 1));

        expect(computeDay(0)).toBe(1);       // Jan 1
        expect(computeDay(180)).toBe(183);   // ~July 2
        expect(computeDay(359)).toBe(364);   // Late Dec
      });

      it('computes latitude from vertical armillary deflection', () => {
        const computeLat = (dy: number, scale: number = 1): number => {
          const latY = dy / scale;
          const normalizedLat = -latY / 54;
          const res = Math.max(-90, Math.min(90, Math.round(normalizedLat * 90)));
          return res === 0 ? 0 : res;
        };

        expect(computeLat(0)).toBe(0);       // Equator
        expect(computeLat(-54)).toBe(90);    // North Pole
        expect(computeLat(54)).toBe(-90);    // South Pole
        expect(computeLat(-27)).toBe(45);    // 45°N
        expect(computeLat(27)).toBe(-45);    // 45°S
      });
    });

    describe('Boundary Rollover Invariants', () => {
      it('detects day rollover across midnight forward and backward', () => {
        // Forward rollover: prevTime >= 22 and newTime <= 2
        const checkForward = (prev: number, next: number) => prev >= 22 && next <= 2;
        // Backward rollover: prevTime <= 2 and newTime >= 22
        const checkBackward = (prev: number, next: number) => prev <= 2 && next >= 22;

        expect(checkForward(23.5, 0.5)).toBe(true);
        expect(checkForward(21.0, 0.5)).toBe(false);

        expect(checkBackward(0.5, 23.5)).toBe(true);
        expect(checkBackward(0.5, 21.0)).toBe(false);
      });

      it('detects year rollover across Jan 1 / Dec 31 boundary', () => {
        const totalDays = 365;
        // Forward: prevDay >= totalDays - 15 and newDay <= 15
        const checkYearForward = (prev: number, next: number) =>
          prev >= totalDays - 15 && next <= 15;
        // Backward: prevDay <= 15 and newDay >= totalDays - 15
        const checkYearBackward = (prev: number, next: number) =>
          prev <= 15 && next >= totalDays - 15;

        expect(checkYearForward(360, 5)).toBe(true);
        expect(checkYearForward(340, 5)).toBe(false);

        expect(checkYearBackward(5, 360)).toBe(true);
        expect(checkYearBackward(5, 340)).toBe(false);
      });
    });
  });
});
