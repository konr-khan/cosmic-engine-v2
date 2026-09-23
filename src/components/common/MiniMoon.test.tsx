import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MiniMoon } from './MiniMoon';

describe('MiniMoon Common Component', () => {
  it('renders with ascending node color (Sky Blue #38bdf8) and solid stroke when waxing', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 8,
        isAscending: true,
        isWaxing: true,
        phase: 0.25
      })
    );

    // Sky blue stroke for ascending node
    expect(html).toContain('stroke="#38bdf8"');
    // Solid stroke (no stroke-dasharray)
    expect(html).not.toContain('stroke-dasharray');
    // Nightside dark base
    expect(html).toContain('fill="#0f172a"');
    // Corona glow
    expect(html).toContain('fill="#38bdf8"');
    expect(html).toContain('r="12"'); // 8 * 1.5
  });

  it('renders with descending node color (Rose Red #f43f5e) and dashed stroke when waning', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 8,
        isAscending: false,
        isWaxing: false,
        phase: 0.75
      })
    );

    // Rose red stroke for descending node
    expect(html).toContain('stroke="#f43f5e"');
    // Dashed stroke for waning/far-side
    expect(html).toContain('stroke-dasharray="3 2"');
    // Nightside dark base
    expect(html).toContain('fill="#0f172a"');
    // Corona glow with descending color
    expect(html).toContain('fill="#f43f5e"');
  });

  it('renders with amber stroke (#fbbf24) and blood-red umbra fill (#f43f5e) during active eclipse', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 10,
        isEclipseActive: true,
        isInsideUmbra: true,
        isAscending: true,
        isWaxing: true,
        phase: 0.5
      })
    );

    // Amber gold stroke during eclipse
    expect(html).toContain('stroke="#fbbf24"');
    // Blood-red umbra fill
    expect(html).toContain('fill="#f43f5e"');
    // Amber corona glow
    expect(html).toContain('fill="#fbbf24"');
  });

  it('renders copper fill (#fb923c) during penumbral eclipse', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 10,
        isEclipseActive: true,
        isInsideUmbra: false,
        phase: 0.5
      })
    );

    expect(html).toContain('stroke="#fbbf24"');
    expect(html).toContain('fill="#fb923c"');
  });

  it('renders 3D analytical limb path when subsolarCameraVector is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 8,
        subsolarCameraVector: { x: -1, y: 0, z: 0 },
        isAscending: true,
        isWaxing: true
      })
    );

    // Generates dayside path facing -X (left toward Sun)
    expect(html).toContain('<path d="M');
    expect(html).toContain('fill="#f8fafc"');
  });

  it('renders center pin dot when showCenterPin is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 10,
        showCenterPin: true,
        isAscending: true
      })
    );

    // Center pin of r=1.5 with ascending node color #38bdf8
    expect(html).toContain('r="1.5"');
    expect(html).toContain('fill="#38bdf8"');
  });

  it('suppresses dayside illumination when isDark is true (observing moon from the back)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MiniMoon, {
        radius: 10,
        isDark: true,
        phase: 0.5,
        subsolarCameraVector: { x: -1, y: 0, z: 0 },
        isAscending: true,
        isWaxing: true
      })
    );

    // Suppresses bright illuminated dayside path
    expect(html).not.toContain('fill="#f8fafc"');
    expect(html).not.toContain('<path');
    // Still preserves dark nightside base, corona glow, and node outline
    expect(html).toContain('fill="#0f172a"');
    expect(html).toContain('stroke="#38bdf8"');
  });
});
