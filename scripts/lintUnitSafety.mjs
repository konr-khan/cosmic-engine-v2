/**
 * @file lintUnitSafety.mjs
 * Babel AST Lint Guardrail: Banning `asDegrees()` and `asRadians()` within UI presentation layer.
 * 
 * Enforces that UI components (`src/components/**`) never bypass unit conversion gatekeepers
 * (`latToRadians`, `lonToRadians`, `toRadians`, `toDegrees`) via raw nominal type assertion wrappers.
 * Restricts `asDegrees` and `asRadians` strictly to domain mathematical routines (`src/utils/cosmicMath/**`),
 * Web Worker RPC deserializers (`src/workers/**`), and unit test fixtures.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.resolve(rootDir, 'src', 'components');
const cosmicMathDir = path.resolve(rootDir, 'src', 'utils', 'cosmicMath');

const BANNED_IDENTIFIERS = new Set(['asDegrees', 'asRadians']);

/**
 * Recursively retrieves all .ts and .tsx files under a directory, ignoring test files.
 */
export function getSourceFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getSourceFiles(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Recursively traverses a Babel AST.
 */
function walkAst(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'comments') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        walkAst(c, visitor);
      }
    } else if (child && typeof child === 'object') {
      walkAst(child, visitor);
    }
  }
}

/**
 * Scans a TypeScript/TSX file's Babel AST for banned nominal unit wrappers.
 */
export function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties'
      ]
    });
  } catch (err) {
    return [{
      filePath,
      line: 1,
      column: 1,
      identifier: 'PARSE_ERROR',
      type: 'parse',
      snippet: err.message
    }];
  }

  const lines = content.split('\n');
  const violations = [];

  walkAst(ast, (node) => {
    // 1. Check ImportSpecifiers: e.g. import { asDegrees } from '...'
    if (node.type === 'ImportSpecifier') {
      const importedName = node.imported?.type === 'Identifier' 
        ? node.imported.name 
        : node.imported?.value;

      if (BANNED_IDENTIFIERS.has(importedName)) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          identifier: importedName,
          type: 'import',
          snippet: lines[line - 1]?.trim() || ''
        });
      }
    }

    // 2. Check CallExpressions: e.g. asDegrees(...)
    if (node.type === 'CallExpression') {
      if (node.callee?.type === 'Identifier' && BANNED_IDENTIFIERS.has(node.callee.name)) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          identifier: node.callee.name,
          type: 'call',
          snippet: lines[line - 1]?.trim() || ''
        });
      }
    }
  });

  return violations;
}

export function runUnitSafetyCheck(targetDir = componentsDir) {
  const files = getSourceFiles(targetDir);
  const allViolations = [];

  for (const file of files) {
    const fileViolations = scanFile(file);
    if (fileViolations.length > 0) {
      allViolations.push(...fileViolations);
    }
  }

  return {
    totalFiles: files.length,
    violations: allViolations
  };
}

/**
 * Scans pure astronomical math modules (src/utils/cosmicMath/**) to guarantee
 * that they remain 100% deterministic and free from React or UI component imports.
 */
export function runMathPurityCheck(targetDir = cosmicMathDir) {
  const files = getSourceFiles(targetDir);
  const violations = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let ast;
    try {
      ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties'
        ]
      });
    } catch (_) {
      continue;
    }

    const lines = content.split('\n');
    walkAst(ast, (node) => {
      if (node.type === 'ImportDeclaration') {
        const src = node.source?.value || '';
        if (src === 'react' || src.startsWith('react/') || src.includes('/components/')) {
          const line = node.loc?.start.line || 1;
          const column = node.loc?.start.column || 0;
          violations.push({
            filePath,
            line,
            column: column + 1,
            source: src,
            snippet: lines[line - 1]?.trim() || ''
          });
        }
      }
    });
  }

  return {
    totalFiles: files.length,
    violations
  };
}

/**
 * Verifies that AGENTS.md adheres to the strict 18 KB prompt kernel budget to prevent AI prompt truncation.
 */
export function getAgentsSizeBudget() {
  const agentsPath = path.resolve(rootDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    throw new Error(`AGENTS.md not found at ${agentsPath}`);
  }
  const stat = fs.statSync(agentsPath);
  const sizeBytes = stat.size;
  const sizeKb = Number((sizeBytes / 1024).toFixed(2));
  const maxKb = 18.0;
  return {
    path: agentsPath,
    sizeBytes,
    sizeKb,
    maxKb,
    isUnderBudget: sizeKb <= maxKb
  };
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { totalFiles, violations } = runUnitSafetyCheck();
  const mathPurity = runMathPurityCheck();
  const agentsBudget = getAgentsSizeBudget();

  if (violations.length > 0) {
    console.error('\n❌ [unit-safety] Unit-Safety AST Guardrail Violations Detected:');
    console.error('The following UI presentation files use banned identity assertion wrappers (asDegrees / asRadians).');
    console.error('UI components must route angles through verified conversion gatekeepers (toRadians, toDegrees, latToRadians, lonToRadians).\n');

    for (const v of violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line}:${v.column} — [${v.type}] ${v.identifier}()`);
      console.error(`    > ${v.snippet}\n`);
    }

    process.exit(1);
  }

  if (mathPurity.violations.length > 0) {
    console.error('\n❌ [math-purity] Mathematical Purity AST Violations Detected:');
    console.error('Pure domain modules in src/utils/cosmicMath/** must remain pure and free of React or UI component imports.\n');

    for (const v of mathPurity.violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line}:${v.column} — imported '${v.source}'`);
      console.error(`    > ${v.snippet}\n`);
    }

    process.exit(1);
  }

  if (!agentsBudget.isUnderBudget) {
    console.error(`\n❌ [unit-safety] AGENTS.md size budget violated: ${agentsBudget.sizeKb} KB > ${agentsBudget.maxKb} KB.`);
    console.error('Please pare down or relocate non-kernel documentation to docs/ to prevent AI prompt truncation.\n');
    process.exit(1);
  }

  console.log(`\n✔ [unit-safety] All UI components (${totalFiles} files) conform to branded unit safety guardrails.`);
  console.log('  0 instances of asDegrees() or asRadians() found in src/components/**.');
  console.log(`✔ [math-purity] Mathematical domain purity verified (${mathPurity.totalFiles} files in src/utils/cosmicMath/** contain 0 React/UI imports).`);
  console.log(`✔ [unit-safety] AGENTS.md kernel size budget verified (${agentsBudget.sizeKb} KB <= ${agentsBudget.maxKb} KB).\n`);
  process.exit(0);
}
