/**
 * @file unitSafety.test.ts
 * Vitest domain test asserting Babel AST Unit-Safety Guardrails across UI presentation layer.
 * 
 * Verifies that all UI components in src/components/** refrain from using raw nominal assertion
 * wrappers (asDegrees, asRadians), routing all angular values through verified conversion gatekeepers.
 */

import { describe, it, expect } from 'vitest';
// @ts-expect-error - lintUnitSafety is a Node ESM module executed in Vitest runner
import { runUnitSafetyCheck } from '../../scripts/lintUnitSafety.mjs';
import { parse } from '@babel/parser';

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
});
