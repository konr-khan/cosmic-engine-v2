/**
 * @file unitSafety.test.ts
 * Vitest domain test asserting Babel AST Unit-Safety Guardrails across UI presentation layer.
 * 
 * Verifies that all UI components in src/components/** refrain from using raw nominal assertion
 * wrappers (asDegrees, asRadians), routing all angular values through verified conversion gatekeepers.
 */

import { describe, it, expect } from 'vitest';
import {
  scanUnitSafetyInSource,
  runUnitSafetyCheck,
  runSvgDefsIdCheck,
  scanSvgDefsIdsInSource,
  scanMathPurityInSource,
  runMathPurityCheck,
  getAgentsSizeBudget,
  runDefaultDateCheck,
  runDocIntegrityCheck
} from '../../scripts/lintUnitSafety.mjs';
import {
  Degrees,
  Radians,
  JulianDate,
  JulianCenturies,
  asDegrees,
  asRadians,
  asJulianDate,
  asJulianCenturies,
  toRadians,
  toDegrees,
  julianDateToCenturies
} from './units';

interface UnitViolation {
  filePath: string;
  line: number;
  column: number;
  identifier: string;
  type: string;
  snippet: string;
}

interface UnitSafetyResult {
  totalFiles: number;
  violations: UnitViolation[];
}

describe('Unit-Safety AST Guardrails (ADR 0002 Compliance)', () => {
  it('enforces 0 instances of banned unit wrappers or unsafe casts across all UI components in src/components', () => {
    const { totalFiles, violations } = runUnitSafetyCheck() as UnitSafetyResult;

    expect(totalFiles).toBeGreaterThan(50);
    if (violations.length > 0) {
      const summary = violations.map((v: UnitViolation) => `${v.filePath}:${v.line}:${v.column} [${v.type}] ${v.identifier}`).join('\n');
      expect.fail(`Found ${violations.length} unit-safety violations in UI components:\n${summary}`);
    }
    expect(violations).toHaveLength(0);
  });

  it('detects banned unit wrappers (asDegrees, asRadians, asJulianDate, asJulianCenturies) and unsafe casts via scanUnitSafetyInSource', () => {
    const mockCode = `
      import React from 'react';
      import { asDegrees, asRadians, asJulianDate, asJulianCenturies, toRadians } from '../types/units';

      export const BadComponent = () => {
        const angle1 = asDegrees(45);
        const angle2 = asRadians(1.57);
        const jd = asJulianDate(2451545.0);
        const jc = asJulianCenturies(0.25);
        const coerced = null as unknown as { x: number };
        const castDeg = 90 as Degrees;
        const safe = toRadians(45);
        return <div>{angle1}</div>;
      };
    `;

    const violations = scanUnitSafetyInSource(mockCode, 'BadComponent.tsx') as UnitViolation[];
    const pairs = violations.map(v => `${v.type}:${v.identifier}`);

    expect(pairs).toContain('import:asDegrees');
    expect(pairs).toContain('import:asRadians');
    expect(pairs).toContain('import:asJulianDate');
    expect(pairs).toContain('import:asJulianCenturies');
    expect(pairs).toContain('call:asDegrees');
    expect(pairs).toContain('call:asRadians');
    expect(pairs).toContain('call:asJulianDate');
    expect(pairs).toContain('call:asJulianCenturies');
    expect(pairs).toContain('double-cast:as unknown as');
    expect(pairs).toContain('unit-cast:as Degrees');
    expect(pairs).not.toContain('call:toRadians');
    expect(violations).toHaveLength(10);
  });

  it('enforces mathematical domain purity (0 React or UI component imports or presentation/hex color tokens in src/utils/cosmicMath)', () => {
    const { totalFiles, violations } = runMathPurityCheck() as {
      totalFiles: number;
      violations: Array<{ filePath: string; line: number; column: number; source: string; snippet: string }>;
    };

    expect(totalFiles).toBeGreaterThan(20);
    if (violations.length > 0) {
      const summary = violations.map(v => `${v.filePath}:${v.line}:${v.column} ${v.source}`).join('\n');
      expect.fail(`Found ${violations.length} mathematical domain purity violations:\n${summary}`);
    }
    expect(violations).toHaveLength(0);
  });

  it('detects React imports, Tailwind classes, hex color literals, and unparameterized new Date() in scanMathPurityInSource', () => {
    const badMathCode = `
      import React from 'react';
      const colorHex = '#38bdf8';
      const svgTpl = \`stroke="#f43f5e"\`;
      const twClass = 'text-sky-400';
      const now = new Date();
    `;

    const violations = scanMathPurityInSource(badMathCode, 'badMath.ts');
    const sources = violations.map(v => v.source);

    expect(sources).toContain("imported 'react'");
    expect(sources).toContain("Hex color presentation literal '#38bdf8'");
    expect(sources).toContain("Hex color presentation literal '#f43f5e'");
    expect(sources).toContain("Tailwind presentation token 'text-sky-400'");
    expect(sources).toContain("unparameterized 'new Date()' in pure math module");
    expect(violations).toHaveLength(5);
  });

  it('enforces AGENTS.md size budget strictly under 18 KB to prevent AI prompt truncation', () => {
    const budget = getAgentsSizeBudget() as {
      path: string;
      sizeBytes: number;
      sizeKb: number;
      maxKb: number;
      isUnderBudget: boolean;
    };

    expect(budget.isUnderBudget).toBe(true);
    expect(budget.sizeKb).toBeLessThanOrEqual(18.0);
    expect(budget.sizeKb).toBeGreaterThan(5.0);
  });

  it('enforces prop identity stability (0 instances of "= new Date()" default parameter fallback across src/components and src/hooks)', () => {
    const { totalFiles, violations } = runDefaultDateCheck() as {
      totalFiles: number;
      violations: Array<{ filePath: string; line: number; column: number; snippet: string }>;
    };

    expect(totalFiles).toBeGreaterThan(50);
    if (violations.length > 0) {
      const summary = violations.map(v => `${v.filePath}:${v.line}:${v.column} [default new Date()]: ${v.snippet}`).join('\n');
      expect.fail(`Found ${violations.length} default new Date() violations in components/hooks:\n${summary}`);
    }
    expect(violations).toHaveLength(0);
  });

  it('enforces collision-safe SVG <defs> scoping (0 static string-literal IDs inside <defs> across src/components)', () => {
    const { totalFiles, violations } = runSvgDefsIdCheck();

    expect(totalFiles).toBeGreaterThan(50);
    if (violations.length > 0) {
      const summary = violations.map(v => `${v.filePath}:${v.line}:${v.column} id="${v.idValue}"`).join('\n');
      expect.fail(`Found ${violations.length} static SVG <defs> ID violations:\n${summary}`);
    }
    expect(violations).toHaveLength(0);
  });

  it('detects static string-literal IDs inside <defs> while allowing instance-scoped expressions', () => {
    const mockCode = `
      import React from 'react';
      export const SvgFixture = ({ safePrefix }: { safePrefix: string }) => (
        <svg id="outer-svg-root">
          <defs>
            <radialGradient id="sunGlow" />
            <clipPath id={'axialEarthClip'} />
            <mask id={\`outsideEarth\`} />
            <linearGradient id={\`\${safePrefix}-laser\`} />
            <filter id={safePrefix} />
          </defs>
        </svg>
      );
    `;

    const violations = scanSvgDefsIdsInSource(mockCode, 'SvgFixture.tsx');
    expect(violations.map(v => v.idValue)).toEqual(['sunGlow', 'axialEarthClip', 'outsideEarth']);
  });

  it('enforces documentation SSoT integrity (links, #anchors, F/M/DE/ADR IDs, 1:1 ADR index, living paths & 100% ARCHITECTURE.md inventory)', () => {
    const { totalFiles, violations } = runDocIntegrityCheck();
    expect(totalFiles).toBeGreaterThan(45);
    if (violations.length > 0) {
      const summary = violations.map(v => `${v.filePath}:${v.line} [${v.type}] ${v.message}`).join('\n');
      expect.fail(`Found ${violations.length} documentation integrity violations:\n${summary}`);
    }
    expect(violations).toHaveLength(0);
  });
});

describe('Nominal Branded Unit Safety & Forbidden Brand Intersections', () => {
  it('correctly constructs and brands JulianCenturies via asJulianCenturies', () => {
    const centuries = asJulianCenturies(0.25);
    expect(centuries).toBe(0.25);
    const calculated = julianDateToCenturies(asJulianDate(2451545.0 + 36525.0));
    expect(calculated).toBeCloseTo(1.0, 6);
  });

  it('correctly converts degrees to radians and radians to degrees with IEEE-754 precision', () => {
    const deg180 = asDegrees(180);
    const radPi = toRadians(deg180);
    expect(radPi).toBeCloseTo(Math.PI, 10);

    const backToDeg = toDegrees(radPi);
    expect(backToDeg).toBeCloseTo(180, 10);

    // Raw unbranded numbers are accepted
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 10);
    expect(toDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
  });

  it('enforces compile-time brand safety preventing cross-assignment between Degrees and Radians', () => {
    const rad = asRadians(Math.PI);
    const deg = asDegrees(180);

    // @ts-expect-error - Branded Radians cannot be passed to toRadians (rejects double-conversion)
    const invalidR2R = toRadians(rad);
    expect(invalidR2R).toBeDefined();

    // @ts-expect-error - Branded Degrees cannot be passed to toDegrees (rejects double-conversion)
    const invalidD2D = toDegrees(deg);
    expect(invalidD2D).toBeDefined();
  });
});
