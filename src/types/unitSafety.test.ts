/**
 * @file unitSafety.test.ts
 * Vitest domain test asserting Babel AST Unit-Safety Guardrails across UI presentation layer.
 * 
 * Verifies that all UI components in src/components/** refrain from using raw nominal assertion
 * wrappers (asDegrees, asRadians), routing all angular values through verified conversion gatekeepers.
 */

import { describe, it, expect } from 'vitest';
import { runUnitSafetyCheck, runMathPurityCheck, getAgentsSizeBudget, runDefaultDateCheck, runDocIntegrityCheck } from '../../scripts/lintUnitSafety.mjs';
import { parse } from '@babel/parser';
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
  it('enforces 0 instances of asDegrees() or asRadians() across all UI components in src/components', () => {
    const { totalFiles, violations } = runUnitSafetyCheck() as UnitSafetyResult;

    expect(totalFiles).toBeGreaterThan(50);
    if (violations.length > 0) {
      const summary = violations.map((v: UnitViolation) => `${v.filePath}:${v.line}:${v.column} [${v.type}] ${v.identifier}`).join('\n');
      expect.fail(`Found ${violations.length} unit-safety violations in UI components:\n${summary}`);
    }
    expect(violations).toHaveLength(0);
  });

  it('detects violations when asDegrees or asRadians are imported or called', () => {
    const mockCode = `
      import React from 'react';
      import { asDegrees, asRadians, toRadians } from '../types/units';

      export const BadComponent = () => {
        const angle1 = asDegrees(45);
        const angle2 = asRadians(1.57);
        const safe = toRadians(45);
        return <div>{angle1}</div>;
      };
    `;

    const ast = parse(mockCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    const banned = new Set(['asDegrees', 'asRadians']);
    const foundViolations: string[] = [];

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'ImportSpecifier' && banned.has(node.imported?.name)) {
        foundViolations.push(`import:${node.imported.name}`);
      }
      if (node.type === 'CallExpression' && banned.has(node.callee?.name)) {
        foundViolations.push(`call:${node.callee.name}`);
      }
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'comments') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(walk);
        } else if (child && typeof child === 'object') {
          walk(child);
        }
      }
    }

    walk(ast);

    expect(foundViolations).toContain('import:asDegrees');
    expect(foundViolations).toContain('import:asRadians');
    expect(foundViolations).toContain('call:asDegrees');
    expect(foundViolations).toContain('call:asRadians');
    expect(foundViolations).not.toContain('call:toRadians');
    expect(foundViolations).toHaveLength(4);
  });

  it('enforces mathematical domain purity (0 React or UI component imports or presentation tokens in src/utils/cosmicMath)', () => {
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

  it('enforces documentation SSoT integrity (0 broken links, 0 machine-local file:/// URIs, valid DE/ADR IDs, and synchronized Quick Index line ranges)', () => {
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
