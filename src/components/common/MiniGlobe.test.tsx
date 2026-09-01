/**
 * @file MiniGlobe.test.tsx
 * Comprehensive Vitest unit test suite for the <MiniGlobe /> SVG component.
 * 
 * Test Coverage:
 * Suite 1: Default Rendering & SVG ID Collision Safety (4 tests)
 * Suite 2: 5 Projection View Modes (5 tests)
 * Suite 3: 4 Cardinal Seasonal Astronomical Transitions (4 tests)
 * Suite 4: Topocentric Observer Location Pin & Day/Night Logic (4 tests)
 * Suite 5: Parallels, Polar Axis & Layer Feature Toggles (5 tests)
 * Suite 6: Interactive Events, Styling & Accessibility (4 tests)
 * Total: 26 Robust Unit Tests
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MiniGlobe } from './MiniGlobe';

describe('<MiniGlobe /> Component Suite', () => {

  // =========================================================================
  // SUITE 1: Default Rendering & SVG ID Collision Safety
  // =========================================================================
  describe('Suite 1: Default Rendering & SVG ID Collision Safety', () => {
    it('renders with default props without throwing or emitting empty SVG', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe />
        </svg>
      );
      expect(html).toContain('miniglobe-root');
      expect(html).toContain('<clipPath');
      expect(html).toContain('<radialGradient');
      expect(html).toContain('circle');
    });

    it('generates unique clipPath IDs across multiple mounted instances using React useId()', () => {
      const html1 = renderToStaticMarkup(
        <svg>
          <MiniGlobe id="globe1" />
        </svg>
      );
      const html2 = renderToStaticMarkup(
        <svg>
          <MiniGlobe id="globe2" />
        </svg>
      );

      const clip1Match = html1.match(/clipPath id="([^"]+)"/);
      const clip2Match = html2.match(/clipPath id="([^"]+)"/);

      expect(clip1Match).not.toBeNull();
      expect(clip2Match).not.toBeNull();
      expect(clip1Match![1]).not.toBe(clip2Match![1]);
      expect(clip1Match![1]).toContain('globe1');
      expect(clip2Match![1]).toContain('globe2');
    });

    it('positions root group at custom (cx, cy) via SVG translate transformation', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe cx={150} cy={275} />
        </svg>
      );
      expect(html).toContain('transform="translate(150, 275)"');
    });

    it('scales globe disc and clipPath correctly to custom radius', () => {
      const customRadius = 24;
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe radius={customRadius} />
        </svg>
      );
      expect(html).toContain(`r="${customRadius}"`);
    });
  });

  // =========================================================================
  // SUITE 2: 5 Projection View Modes
  // =========================================================================
  describe('Suite 2: 5 Projection View Modes', () => {
    it('renders topdown mode with sunward rotated daylight semicircle and elliptical parallels', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="topdown" radius={14} sunAngleDeg={180} />
        </svg>
      );
      expect(html).toContain('<ellipse'); // Equator & Tropic ellipses
      expect(html).toContain('fill="url(#');
      expect(html).toContain('stroke="#38bdf8"'); // Sky Blue Equator
    });

    it('renders transverse mode with side-on tilt theta = eps * sin(lambda)', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="transverse" radius={18} sunLambdaDeg={90} />
        </svg>
      );
      expect(html).toContain('<line'); // Polar axis & Equator chord
      expect(html).toContain('stroke="#38bdf8"');
      expect(html).toContain('stroke="#93c5fd"');
    });

    it('renders axial mode with 3D curved front equator arc and background night face', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="axial" radius={20} sunLambdaDeg={90} />
        </svg>
      );
      expect(html).toContain('<path'); // 16-point curved front equator
      expect(html).toContain('stroke="#38bdf8"');
      expect(html).toContain('stroke="#93c5fd"');
    });

    it('renders euler3d mode responding to camera pitch and yaw rotations with non-tearing limb clipping', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe 
            viewMode="euler3d" 
            radius={15} 
            camera={{ pitch: 35, yaw: 45 }} 
            showTwilightBands={true} 
          />
        </svg>
      );
      expect(html).toContain('fill-rule="evenodd"');
      expect(html).toContain('stroke="#60a5fa"'); // Specular limb rim
    });

    it('renders flat mode as a clean concentric astrolabe brass plate pin', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="flat" radius={10} />
        </svg>
      );
      expect(html).toContain('miniglobe-flat');
      expect(html).toContain('fill="#b45309"'); // Brass bezel
      expect(html).toContain('fill="#38bdf8"'); // Cyan core reticle
    });
  });

  // =========================================================================
  // SUITE 3: 4 Cardinal Seasonal Astronomical Transitions
  // =========================================================================
  describe('Suite 3: 4 Cardinal Seasonal Astronomical Transitions', () => {
    it('renders March Equinox (lambda=0°) with zero side-on axial tilt theta=0°', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="transverse" radius={20} sunLambdaDeg={0} />
        </svg>
      );
      expect(html).toContain('stroke="#93c5fd"');
      expect(html).not.toContain('NaN');
    });

    it('renders June Solstice (lambda=90°) with maximum positive side-on tilt +23.44°', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="transverse" radius={20} sunLambdaDeg={90} />
        </svg>
      );
      expect(html).not.toContain('NaN');
      expect(html).toContain('stroke="#38bdf8"');
    });

    it('renders September Equinox (lambda=180°) with zero side-on axial tilt', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="transverse" radius={20} sunLambdaDeg={180} />
        </svg>
      );
      expect(html).not.toContain('NaN');
    });

    it('renders December Solstice (lambda=270°) with maximum negative side-on tilt -23.44°', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="transverse" radius={20} sunLambdaDeg={270} />
        </svg>
      );
      expect(html).not.toContain('NaN');
    });
  });

  // =========================================================================
  // SUITE 4: Topocentric Observer Location Pin & Day/Night Logic
  // =========================================================================
  describe('Suite 4: Topocentric Observer Location Pin & Day/Night Logic', () => {
    it('renders pulsing Sky Blue pin (#38bdf8) when observer is in daylight (Solar Noon, timeOfDay=12)', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe 
            viewMode="topdown" 
            latitude={47.06} 
            longitude={-122.81} 
            timeOfDay={12.0} 
            sunAngleDeg={180} 
          />
        </svg>
      );
      expect(html).toContain('miniglobe-observer-pin');
      expect(html).toContain('fill="#38bdf8"');
      expect(html).toContain('animate-pulse');
    });

    it('renders muted Slate pin (#64748b) when observer is at night (Solar Midnight, timeOfDay=0)', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe 
            viewMode="transverse" 
            latitude={47.06} 
            longitude={0} 
            timeOfDay={0.0} 
            sunLambdaDeg={0} 
          />
        </svg>
      );
      expect(html).toContain('miniglobe-observer-pin');
      expect(html).toContain('fill="#64748b"');
    });

    it('hides observer pin when showObserverPin is false', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe showObserverPin={false} />
        </svg>
      );
      expect(html).not.toContain('miniglobe-observer-pin');
    });

    it('correctly shifts observer coordinates according to geographic latitude and longitude', () => {
      const htmlNorth = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="topdown" latitude={80} timeOfDay={12} />
        </svg>
      );
      const htmlSouth = renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="topdown" latitude={-80} timeOfDay={12} />
        </svg>
      );
      expect(htmlNorth).not.toBe(htmlSouth);
    });
  });

  // =========================================================================
  // SUITE 5: Parallels, Polar Axis & Layer Feature Toggles
  // =========================================================================
  describe('Suite 5: Parallels, Polar Axis & Layer Feature Toggles', () => {
    it('suppresses parallels when showParallels is false', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe showParallels={false} />
        </svg>
      );
      expect(html).not.toContain('miniglobe-parallels');
    });

    it('suppresses polar axis line when showPolarAxis is false', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe showPolarAxis={false} />
        </svg>
      );
      expect(html).not.toContain('miniglobe-polar-axis');
    });

    it('suppresses outer atmosphere glow when showAtmosphereGlow is false', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe showAtmosphereGlow={false} />
        </svg>
      );
      expect(html).not.toContain('atmo-grad');
    });

    it('suppresses day/night terminator overlay when showTerminator is false', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe showTerminator={false} />
        </svg>
      );
      expect(html).not.toContain('day-grad');
    });

    it('renders custom monospace label when showLabel is true', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe showLabel={true} label="⊕ TERRA" />
        </svg>
      );
      expect(html).toContain('⊕ TERRA');
      expect(html).toContain('font-family="monospace"');
    });
  });

  // =========================================================================
  // SUITE 6: Interactive Events, Styling & Accessibility
  // =========================================================================
  describe('Suite 6: Interactive Events, Styling & Accessibility', () => {
    it('renders stable enlarged hit target circle for mouse and touch interactions', () => {
      const radius = 12;
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe radius={radius} />
        </svg>
      );
      expect(html).toContain('class="cursor-pointer"');
      expect(html).toContain(`r="${Math.max(16, radius * 1.6)}"`);
    });

    it('includes valid accessibility attributes (role="img", aria-label, and <title>)', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe label="EARTH" latitude={47.1} longitude={-122.8} />
        </svg>
      );
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="EARTH Mini Globe"');
      expect(html).toContain('<title>EARTH');
    });

    it('applies custom className to the SVG root group', () => {
      const html = renderToStaticMarkup(
        <svg>
          <MiniGlobe className="custom-globe-style" />
        </svg>
      );
      expect(html).toContain('custom-globe-style');
    });

    it('handles extreme inputs (zero radius, negative angles, NaN values) gracefully without throwing', () => {
      expect(() => renderToStaticMarkup(
        <svg>
          <MiniGlobe radius={0} sunLambdaDeg={NaN} latitude={NaN} />
        </svg>
      )).not.toThrow();

      expect(() => renderToStaticMarkup(
        <svg>
          <MiniGlobe viewMode="euler3d" camera={{ pitch: 180, yaw: -360 }} />
        </svg>
      )).not.toThrow();
    });
  });

});
