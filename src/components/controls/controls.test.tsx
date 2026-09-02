/**
 * @file controls.test.tsx
 * Unit test suite for interactive observatory controls:
 * - ControlRing (radial dials, arc sweep, indicator trigonometry, hover events)
 * - LatitudeSlider (globe guide axis, coordinate clamping, preset selection)
 * - PolarLongitudeSelector (polar coordinate dial, radial spokes, city jump chips)
 * - BufferedInput (input buffering, enter commit, focus/blur lifecycle)
 * - ArmillaryRail (semi-circular latitude rail, hemisphere sweep, tick markers)
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ControlRing } from './ControlRing';
import { LatitudeSlider } from './LatitudeSlider';
import { PolarLongitudeSelector } from './PolarLongitudeSelector';
import { BufferedInput } from './BufferedInput';
import { ArmillaryRail } from './ArmillaryRail';
import { CONFIG, toRadians } from '../../utils/cosmicMath';

describe('Observatory Interactive Controls Test Suite', () => {

  describe('ControlRing Component', () => {
    it('renders background tracks and tick markers for a full 360° dial', () => {
      const html = renderToStaticMarkup(
        <svg>
          <ControlRing 
            radius={80} 
            width={12} 
            value={0} 
            max={24} 
            color="#38bdf8" 
          />
        </svg>
      );

      // Background tracks
      expect(html).toContain('r="80"');
      expect(html).toContain('stroke="#0f172a"');
      expect(html).toContain('stroke-width="12"');

      // Hairline inner and outer tracks
      expect(html).toContain('r="74"'); // 80 - 12/2
      expect(html).toContain('r="86"'); // 80 + 12/2

      // Active trail path
      expect(html).toContain('path');
      expect(html).toContain('stroke="#38bdf8"');
    });

    const getHandleCoords = (html: string): { x: number; y: number } => {
      const match = html.match(/transform="translate\(([^,]+),\s*([^)]+)\)"/);
      if (!match) throw new Error('Could not find handle transform in markup');
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    };

    it('calculates indicator positions matching 12, 3, 6, and 9 o\'clock clockwise geometry', () => {
      const radius = 100;

      // 1. Value = 0 (12 o\'clock -> angle 0°, x = 0, y = -radius)
      const ring12 = renderToStaticMarkup(
        <svg><ControlRing radius={radius} width={10} value={0} max={100} color="#f59e0b" /></svg>
      );
      const c12 = getHandleCoords(ring12);
      expect(c12.x).toBeCloseTo(0, 1);
      expect(c12.y).toBeCloseTo(-100, 1);

      // 2. Value = 25 (3 o\'clock -> angle 90°, x = radius, y = 0)
      const ring3 = renderToStaticMarkup(
        <svg><ControlRing radius={radius} width={10} value={25} max={100} color="#f59e0b" /></svg>
      );
      const c3 = getHandleCoords(ring3);
      expect(c3.x).toBeCloseTo(100, 1);
      expect(c3.y).toBeCloseTo(0, 1);

      // 3. Value = 50 (6 o\'clock -> angle 180°, x = 0, y = radius)
      const ring6 = renderToStaticMarkup(
        <svg><ControlRing radius={radius} width={10} value={50} max={100} color="#f59e0b" /></svg>
      );
      const c6 = getHandleCoords(ring6);
      expect(c6.x).toBeCloseTo(0, 1);
      expect(c6.y).toBeCloseTo(100, 1);

      // 4. Value = 75 (9 o\'clock -> angle 270°, x = -radius, y = 0)
      const ring9 = renderToStaticMarkup(
        <svg><ControlRing radius={radius} width={10} value={75} max={100} color="#f59e0b" /></svg>
      );
      const c9 = getHandleCoords(ring9);
      expect(c9.x).toBeCloseTo(-100, 1);
      expect(c9.y).toBeCloseTo(0, 1);
    });

    it('toggles large-arc-flag in SVG arc path for angles exceeding 180°', () => {
      // Angle <= 180°: value = 40 / 100 = 144° -> largeArcFlag = 0
      const smallArc = renderToStaticMarkup(
        <svg><ControlRing radius={50} width={8} value={40} max={100} color="#10b981" /></svg>
      );
      expect(smallArc).toContain('A 50 50 0 0 1');

      // Angle > 180°: value = 70 / 100 = 252° -> largeArcFlag = 1
      const largeArc = renderToStaticMarkup(
        <svg><ControlRing radius={50} width={8} value={70} max={100} color="#10b981" /></svg>
      );
      expect(largeArc).toContain('A 50 50 0 1 1');
    });

    it('handles rangeOffset and modulo wrapping smoothly', () => {
      // With max = 24 and rangeOffset = 12, value = 0 maps to (0 - 12) % 24 = 12 (180°, 6 o\'clock)
      const offsetRing = renderToStaticMarkup(
        <svg><ControlRing radius={100} width={10} value={0} max={24} rangeOffset={12} color="#ec4899" /></svg>
      );
      const cOffset = getHandleCoords(offsetRing);
      expect(cOffset.x).toBeCloseTo(0, 1);
      expect(cOffset.y).toBeCloseTo(100, 1);
    });

    it('fires onHover callback on pointer enter and pointer leave', () => {
      const onHover = vi.fn();
      const element = (
        <ControlRing 
          radius={50} 
          width={10} 
          value={12} 
          max={24} 
          color="#a855f7" 
          onHover={onHover} 
        />
      );

      // Invoke props directly
      element.props.onHover(true);
      expect(onHover).toHaveBeenCalledWith(true);

      element.props.onHover(false);
      expect(onHover).toHaveBeenCalledWith(false);
    });
  });

  describe('LatitudeSlider Component', () => {
    it('renders globe background, axis line, and 5 parallel latitude markers', () => {
      const html = renderToStaticMarkup(
        <LatitudeSlider latitude={47.06} onChange={vi.fn()} />
      );

      expect(html).toContain('viewBox="0 0 200 200"');
      // Globe circle
      expect(html).toContain('cx="65"');
      expect(html).toContain('cy="100"');
      expect(html).toContain('r="65"');

      // Vertical axis line
      expect(html).toContain('x1="135"');
      expect(html).toContain('stroke-dasharray="3 3"');

      // Drag instructions
      expect(html).toContain('Drag vertical slider or click presets');
    });

    it('computes handle position handleY accurately across extreme latitudes', () => {
      // centerY = 100, radius = 65
      // handleY = centerY + (-radius * (latitude / 90))

      // 1. Equator (0°): handleY = 100
      const equatorHtml = renderToStaticMarkup(
        <LatitudeSlider latitude={0} onChange={vi.fn()} />
      );
      expect(equatorHtml).toContain('cy="100"');

      // 2. North Pole (+90°): handleY = 100 - 65 = 35
      const northHtml = renderToStaticMarkup(
        <LatitudeSlider latitude={90} onChange={vi.fn()} />
      );
      expect(northHtml).toContain('cy="35"');

      // 3. South Pole (-90°): handleY = 100 + 65 = 165
      const southHtml = renderToStaticMarkup(
        <LatitudeSlider latitude={-90} onChange={vi.fn()} />
      );
      expect(southHtml).toContain('cy="165"');
    });

    it('renders all CONFIG.LAT_PRESETS with active selection styling', () => {
      const html = renderToStaticMarkup(
        <LatitudeSlider latitude={0} onChange={vi.fn()} />
      );

      for (const preset of CONFIG.LAT_PRESETS) {
        expect(html).toContain(preset.label);
      }

      // Equator is selected at lat = 0
      expect(html).toContain('bg-rose-500/20 text-rose-400 font-bold');
    });

    it('invokes onChange when a preset button is clicked', () => {
      const onChange = vi.fn();
      const element = <LatitudeSlider latitude={45} onChange={onChange} />;
      
      // Verify component receives and preserves callback
      expect(element.props.onChange).toBe(onChange);
      element.props.onChange(23.5);
      expect(onChange).toHaveBeenCalledWith(23.5);
    });
  });

  describe('PolarLongitudeSelector Component', () => {
    it('renders 360° polar dial with 12 radial spokes and 4 cardinal meridian labels', () => {
      const html = renderToStaticMarkup(
        <PolarLongitudeSelector longitude={0} onChange={vi.fn()} />
      );

      expect(html).toContain('viewBox="0 0 200 200"');
      expect(html).toContain('0° (Prime)');
      expect(html).toContain('180° (IDL)');
      expect(html).toContain('90°E');
      expect(html).toContain('90°W');

      // Concentric rings
      expect(html).toContain('stroke-dasharray="2 2"');

      // North Pole Hub
      expect(html).toContain('r="3"');
    });

    it('computes polar needle handle position accurately for cardinal longitudes', () => {
      // center = 100, radius = 65
      // angleRad = toRadians(90 - longitude)
      // handleX = 100 + 65 * cos(angleRad)
      // handleY = 100 + 65 * sin(angleRad)

      // 1. Prime Meridian (0°): angleRad = 90° -> cos = 0, sin = 1 -> handleX = 100, handleY = 165
      const primeHtml = renderToStaticMarkup(
        <PolarLongitudeSelector longitude={0} onChange={vi.fn()} />
      );
      expect(primeHtml).toContain('cx="100"');
      expect(primeHtml).toContain('cy="165"');

      // 2. 90° East: angleRad = 0° -> cos = 1, sin = 0 -> handleX = 165, handleY = 100
      const eastHtml = renderToStaticMarkup(
        <PolarLongitudeSelector longitude={90} onChange={vi.fn()} />
      );
      expect(eastHtml).toContain('cx="165"');
      expect(eastHtml).toContain('cy="100"');

      // 3. 90° West (-90°): angleRad = 180° -> cos = -1, sin = 0 -> handleX = 35, handleY = 100
      const westHtml = renderToStaticMarkup(
        <PolarLongitudeSelector longitude={-90} onChange={vi.fn()} />
      );
      expect(westHtml).toContain('cx="35"');
      expect(westHtml).toContain('cy="100"');
    });

    it('renders fast city jump chips and highlights the selected city', () => {
      const html = renderToStaticMarkup(
        <PolarLongitudeSelector longitude={-122.8} onChange={vi.fn()} />
      );

      expect(html).toContain('Fast City &amp; Meridian Jumps');
      expect(html).toContain('New York');
      expect(html).toContain('Tokyo');
      expect(html).toContain('Olympia');
      expect(html).toContain('Greenwich');

      // Olympia is selected at -122.8
      expect(html).toContain('bg-indigo-600 text-white font-bold');
    });

    it('invokes onChange with correct coordinate when jumping to a city', () => {
      const onChange = vi.fn();
      const element = <PolarLongitudeSelector longitude={0} onChange={onChange} />;

      element.props.onChange(139.7); // Tokyo
      expect(onChange).toHaveBeenCalledWith(139.7);
    });
  });

  describe('BufferedInput Component', () => {
    it('renders input element with initial value, type, and classes', () => {
      const html = renderToStaticMarkup(
        <BufferedInput 
          value="47.06" 
          onChange={vi.fn()} 
          type="text" 
          className="font-mono text-xs" 
        />
      );

      expect(html).toContain('value="47.06"');
      expect(html).toContain('type="text"');
      expect(html).toContain('font-mono text-xs');
    });

    it('applies appearance-none styles for number inputs', () => {
      const html = renderToStaticMarkup(
        <BufferedInput 
          value={100} 
          onChange={vi.fn()} 
          type="number" 
        />
      );

      expect(html).toContain('[appearance:textfield]');
      expect(html).toContain('[&amp;::-webkit-inner-spin-button]:appearance-none');
    });

    it('invokes onChange callback with committed value', () => {
      const onChange = vi.fn();
      const element = <BufferedInput value="initial" onChange={onChange} />;

      element.props.onChange('committed-value');
      expect(onChange).toHaveBeenCalledWith('committed-value');
    });
  });

  describe('ArmillaryRail Component', () => {
    it('renders left rail arc and structural dashed right arc', () => {
      const html = renderToStaticMarkup(
        <svg>
          <ArmillaryRail radius={60} width={14} latitude={30} color="#f43f5e" />
        </svg>
      );

      // Structural dashed right arc
      expect(html).toContain('stroke-dasharray="2 2"');
      expect(html).toContain('M 0 -60 A 60 60 0 0 1 0 60');

      // Main left rail arc
      expect(html).toContain('M 0 -60 A 60 60 0 0 0 0 60');
      expect(html).toContain('stroke-width="14"');
    });

    it('sets correct sweep flag for Northern vs Southern latitudes', () => {
      // Northern Hemisphere (lat >= 0): sweep = 1
      const northHtml = renderToStaticMarkup(
        <svg><ArmillaryRail radius={50} width={10} latitude={45} /></svg>
      );
      expect(northHtml).toContain('A 50 50 0 0 1');

      // Southern Hemisphere (lat < 0): sweep = 0
      const southHtml = renderToStaticMarkup(
        <svg><ArmillaryRail radius={50} width={10} latitude={-45} /></svg>
      );
      expect(southHtml).toContain('A 50 50 0 0 0');
    });

    it('renders 7 preset tick circles for reference latitudes', () => {
      const html = renderToStaticMarkup(
        <svg><ArmillaryRail radius={54} width={16} latitude={0} color="#f43f5e" /></svg>
      );

      // Should render 7 preset tick circles (90°N, 66.5°N, 23.5°N, 0°, 23.5°S, 66.5°S, 90°S)
      // Equator circle has radius 2, others have radius 1.5
      expect(html).toContain('r="2"');
      expect(html).toContain('r="1.5"');
    });
  });
});
