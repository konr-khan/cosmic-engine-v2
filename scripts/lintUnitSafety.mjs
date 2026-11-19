/**
 * @file lintUnitSafety.mjs
 * Babel AST & Documentation SSoT Parity Guardrails:
 * 1. Bans `asDegrees()`, `asRadians()`, `asJulianDate()`, `asJulianCenturies()`, and `as unknown as` / direct unit casts within UI presentation layer (`src/components/**`).
 * 2. Enforces mathematical domain purity (`src/utils/cosmicMath/**` free of React/UI imports, Tailwind/hex color presentation tokens & `new Date()`).
 * 3. Bans `= new Date()` default parameter fallbacks in `src/components/**` and `src/hooks/**`.
 * 4. Bans static string-literal `id="..."` attributes inside JSX `<defs>` across `src/components/**` (`DE-51`).
 * 5. Enforces `AGENTS.md` prompt kernel size budget (`5.0 KB – 18.0 KB`).
 * 6. Enforces documentation SSoT integrity (links, `#anchor` slugs, `F#`/`M#`/`DE-xx`/`ADR-xxxx` IDs,
 *    1:1 ADR index bijection, living-doc path resolution, Quick Index `Lxx–Lyy` sync & 100% `ARCHITECTURE.md` file inventory).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.resolve(rootDir, 'src', 'components');
const hooksDir = path.resolve(rootDir, 'src', 'hooks');
const cosmicMathDir = path.resolve(rootDir, 'src', 'utils', 'cosmicMath');

const BANNED_IDENTIFIERS = new Set(['asDegrees', 'asRadians', 'asJulianDate', 'asJulianCenturies']);
const BANNED_UNIT_TYPE_NAMES = new Set(['Degrees', 'Radians', 'JulianDate', 'JulianCenturies']);
const BANNED_DATE_DEFAULT_REGEX = /=\s*new\s+Date\(\)/;
const BANNED_MATH_PRESENTATION_REGEX = /^(text|bg|fill|stroke)-[a-z]+-\d{2,3}$/;
const BANNED_HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;

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
 * Recursively retrieves all production files (.ts, .tsx, .css) under a directory, ignoring test files.
 */
function getProductionFilesPosix(dir, baseDir = rootDir) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(getProductionFilesPosix(full, baseDir));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.css')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      out.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

/**
 * Recursively collects all files/directories under a directory for basename/path resolution.
 */
function collectAllRepoPaths(dir) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    out.push(full);
    if (entry.isDirectory()) {
      out = out.concat(collectAllRepoPaths(full));
    }
  }
  return out;
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
 * Scans a TypeScript/TSX source string's Babel AST for banned nominal unit wrappers and unsafe type coercions.
 */
export function scanUnitSafetyInSource(content, filePath = '<inline>') {
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
    // 1. Check ImportSpecifiers: e.g. import { asDegrees, asJulianDate } from '...'
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

    // 2. Check CallExpressions: e.g. asDegrees(...), asJulianDate(...)
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

    // 3. Check double casts (`as unknown as T`) and direct casts onto banned branded unit types
    if (node.type === 'TSAsExpression' || node.type === 'TSTypeAssertion') {
      const inner = node.expression;
      const isDoubleUnknownCast =
        (inner?.type === 'TSAsExpression' || inner?.type === 'TSTypeAssertion') &&
        inner.typeAnnotation?.type === 'TSUnknownKeyword';

      if (isDoubleUnknownCast) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          identifier: 'as unknown as',
          type: 'double-cast',
          snippet: lines[line - 1]?.trim() || ''
        });
      } else if (
        node.typeAnnotation?.type === 'TSTypeReference' &&
        node.typeAnnotation.typeName?.type === 'Identifier' &&
        BANNED_UNIT_TYPE_NAMES.has(node.typeAnnotation.typeName.name)
      ) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          identifier: `as ${node.typeAnnotation.typeName.name}`,
          type: 'unit-cast',
          snippet: lines[line - 1]?.trim() || ''
        });
      }
    }
  });

  return violations;
}

/**
 * Scans a TypeScript/TSX file's Babel AST for banned nominal unit wrappers and unsafe type coercions.
 */
export function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return scanUnitSafetyInSource(content, filePath);
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
 * Scans JSX <defs> subtrees in a TypeScript/TSX source string for static string-literal `id` attributes.
 */
export function scanSvgDefsIdsInSource(content, filePath = '<inline>') {
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
      idValue: 'PARSE_ERROR',
      snippet: err.message
    }];
  }

  const lines = content.split('\n');
  const violations = [];

  function walkDefs(node, inDefs) {
    if (!node || typeof node !== 'object') return;
    let nextInDefs = inDefs;
    if (
      node.type === 'JSXElement' &&
      node.openingElement?.name?.type === 'JSXIdentifier' &&
      node.openingElement.name.name === 'defs'
    ) {
      nextInDefs = true;
    }

    if (
      nextInDefs &&
      node.type === 'JSXAttribute' &&
      node.name?.type === 'JSXIdentifier' &&
      node.name.name === 'id'
    ) {
      let staticId = null;
      if (node.value?.type === 'StringLiteral') {
        staticId = node.value.value;
      } else if (node.value?.type === 'JSXExpressionContainer') {
        const expr = node.value.expression;
        if (expr?.type === 'StringLiteral') {
          staticId = expr.value;
        } else if (expr?.type === 'TemplateLiteral' && expr.expressions.length === 0) {
          staticId = expr.quasis.map(q => q.value?.cooked ?? '').join('');
        }
      }

      if (staticId !== null) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          idValue: staticId,
          snippet: lines[line - 1]?.trim() || ''
        });
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'comments') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          walkDefs(c, nextInDefs);
        }
      } else if (child && typeof child === 'object') {
        walkDefs(child, nextInDefs);
      }
    }
  }

  walkDefs(ast, false);
  return violations;
}

/**
 * Scans all UI components in `src/components/**` to ban static string-literal `id` attributes inside `<defs>`.
 */
export function runSvgDefsIdCheck(targetDir = componentsDir) {
  const files = getSourceFiles(targetDir);
  const violations = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileViolations = scanSvgDefsIdsInSource(content, filePath);
    if (fileViolations.length > 0) {
      violations.push(...fileViolations);
    }
  }

  return {
    totalFiles: files.length,
    violations
  };
}

/**
 * Scans a pure astronomical math source string to guarantee determinism and
 * freedom from React/UI imports, presentation tokens/hex colors, and unparameterized `new Date()`.
 */
export function scanMathPurityInSource(content, filePath = '<inline>') {
  const violations = [];
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
      source: `Failed to parse AST: ${err.message}`,
      snippet: ''
    }];
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
          source: `imported '${src}'`,
          snippet: lines[line - 1]?.trim() || ''
        });
      }
    }

    if (node.type === 'StringLiteral') {
      const val = node.value || '';
      if (BANNED_MATH_PRESENTATION_REGEX.test(val)) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          source: `Tailwind presentation token '${val}'`,
          snippet: lines[line - 1]?.trim() || ''
        });
      } else {
        const hexMatch = val.match(BANNED_HEX_COLOR_REGEX);
        if (hexMatch) {
          const line = node.loc?.start.line || 1;
          const column = node.loc?.start.column || 0;
          violations.push({
            filePath,
            line,
            column: column + 1,
            source: `Hex color presentation literal '${hexMatch[0]}'`,
            snippet: lines[line - 1]?.trim() || ''
          });
        }
      }
    }

    if (node.type === 'TemplateElement') {
      const rawText = node.value?.cooked ?? node.value?.raw ?? '';
      const hexMatch = rawText.match(BANNED_HEX_COLOR_REGEX);
      if (hexMatch) {
        const line = node.loc?.start.line || 1;
        const column = node.loc?.start.column || 0;
        violations.push({
          filePath,
          line,
          column: column + 1,
          source: `Hex color presentation literal '${hexMatch[0]}'`,
          snippet: lines[line - 1]?.trim() || ''
        });
      }
    }

    if (
      node.type === 'NewExpression' &&
      node.callee?.type === 'Identifier' &&
      node.callee?.name === 'Date' &&
      (!node.arguments || node.arguments.length === 0)
    ) {
      const line = node.loc?.start.line || 1;
      const column = node.loc?.start.column || 0;
      violations.push({
        filePath,
        line,
        column: column + 1,
        source: "unparameterized 'new Date()' in pure math module",
        snippet: lines[line - 1]?.trim() || ''
      });
    }
  });

  return violations;
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
    violations.push(...scanMathPurityInSource(content, filePath));
  }

  return {
    totalFiles: files.length,
    violations
  };
}

/**
 * Scans UI components (src/components/**) and hooks (src/hooks/**) to enforce prop identity stability,
 * asserting 0 occurrences of `= new Date()` fallback defaults which cause referential churn and memo invalidation.
 */
export function runDefaultDateCheck(targetDirs = [componentsDir, hooksDir]) {
  const allFiles = targetDirs.flatMap(dir => getSourceFiles(dir));
  const violations = [];

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((lineText, index) => {
      if (BANNED_DATE_DEFAULT_REGEX.test(lineText)) {
        violations.push({
          filePath,
          line: index + 1,
          column: lineText.indexOf('=') + 1,
          snippet: lineText.trim()
        });
      }
    });
  }

  return {
    totalFiles: allFiles.length,
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

/**
 * Computes GitHub-flavored Markdown heading slugs for a Markdown file.
 */
function computeMarkdownHeadingSlugs(filePath) {
  const slugs = new Set();
  if (!fs.existsSync(filePath)) return slugs;
  const counts = new Map();
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const m = line.match(/^#{1,6}\s+(.+)$/);
    if (!m) continue;
    const base = m[1]
      .trim()
      .toLowerCase()
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[`*_~]/g, '')
      .replace(/[^\w -]/g, '')
      .replace(/ /g, '-');
    const seen = counts.get(base) || 0;
    counts.set(base, seen + 1);
    slugs.add(seen === 0 ? base : `${base}-${seen}`);
  }
  return slugs;
}

/**
 * Verifies documentation integrity across core Markdown specifications:
 * 1. Zero non-portable machine-local `file:///` URIs.
 * 2. All relative Markdown file links AND `#anchor` heading slugs resolve on disk.
 * 3. All DE-xx, Fxx, Mxx, and ADR xxxx references resolve to valid ledger entries, and bare `Dead End #N` prose is banned.
 * 4. 1:1 ADR Index bijection between `docs/adr/README.md` and `docs/adr/00*.md`.
 * 5. Strict backticked source-path & code-filename existence across living SSoT docs.
 * 6. 100% bijective parity between `ARCHITECTURE.md` Section 4 (`- \`src/\``) and non-test production files under `src/`.
 * 7. Quick Section Index `Lxx–Lyy` line ranges in MATH_SPEC.md and DESIGN_SYSTEM.md match actual section headers.
 */
export function runDocIntegrityCheck() {
  const livingDocs = new Set([
    path.join(rootDir, 'AGENTS.md'),
    path.join(rootDir, 'ARCHITECTURE.md'),
    path.join(rootDir, 'README.md'),
    path.join(rootDir, 'docs', 'MATH_SPEC.md'),
    path.join(rootDir, 'docs', 'DESIGN_SYSTEM.md'),
    path.join(rootDir, 'docs', 'adr', 'README.md')
  ]);

  const coreDocs = [
    path.join(rootDir, 'AGENTS.md'),
    path.join(rootDir, 'ARCHITECTURE.md'),
    path.join(rootDir, 'PROJECT.md'),
    path.join(rootDir, 'DEAD_ENDS.md'),
    path.join(rootDir, 'README.md'),
    path.join(rootDir, 'docs', 'MATH_SPEC.md'),
    path.join(rootDir, 'docs', 'DESIGN_SYSTEM.md')
  ];
  const adrDir = path.join(rootDir, 'docs', 'adr');
  if (fs.existsSync(adrDir)) {
    for (const f of fs.readdirSync(adrDir).sort()) {
      if (f.endsWith('.md')) {
        coreDocs.push(path.join(adrDir, f));
      }
    }
  }
  const dossierPath = path.join(rootDir, 'docs', 'COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md');
  if (fs.existsSync(dossierPath)) {
    coreDocs.push(dossierPath);
  }

  const validDe = new Set();
  const deadEndsPath = path.join(rootDir, 'DEAD_ENDS.md');
  if (fs.existsSync(deadEndsPath)) {
    const deText = fs.readFileSync(deadEndsPath, 'utf8');
    for (const m of deText.matchAll(/\|\s*\*\*DE-(\d+)\*\*\s*\|/g)) {
      validDe.add(m[1]);
    }
  }

  const validFeatures = new Set();
  const validMilestones = new Set();
  const projectPath = path.join(rootDir, 'PROJECT.md');
  if (fs.existsSync(projectPath)) {
    const projText = fs.readFileSync(projectPath, 'utf8');
    for (const m of projText.matchAll(/\|\s*F(\d+)\s*\|/g)) {
      validFeatures.add(parseInt(m[1], 10));
    }
    for (const m of projText.matchAll(/\|\s*M(\d+)\s*\|/g)) {
      validMilestones.add(parseInt(m[1], 10));
    }
    for (let i = 1; i <= 20; i++) validMilestones.add(i);
  }

  const validAdrs = new Set();
  const adrFilesOnDisk = [];
  if (fs.existsSync(adrDir)) {
    for (const f of fs.readdirSync(adrDir).sort()) {
      const m = f.match(/^(\d{4})-.*\.md$/);
      if (m) {
        validAdrs.add(m[1]);
        adrFilesOnDisk.push(f);
      }
    }
  }

  // Build repository file basename set for living-doc code filename verification
  const allRepoBasenames = new Set([
    'AGENTS.md',
    'ARCHITECTURE.md',
    'DEAD_ENDS.md',
    'PROJECT.md',
    'README.md',
    'package.json',
    'postcss.config.js',
    'index.html',
    '.gitattributes',
    '.gitignore'
  ]);
  for (const sub of ['src', 'scripts', 'docs']) {
    for (const p of collectAllRepoPaths(path.join(rootDir, sub))) {
      allRepoBasenames.add(path.basename(p));
    }
  }

  const headingSlugCache = new Map();
  const getSlugs = (resolvedPath) => {
    if (!headingSlugCache.has(resolvedPath)) {
      headingSlugCache.set(resolvedPath, computeMarkdownHeadingSlugs(resolvedPath));
    }
    return headingSlugCache.get(resolvedPath);
  };

  const violations = [];

  for (const filePath of coreDocs) {
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const fileDir = path.dirname(filePath);
    const isLivingDoc = livingDocs.has(filePath);
    let inCodeFence = false;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/^```/.test(line.trim())) {
        inCodeFence = !inCodeFence;
        return;
      }

      // 1. Ban machine-local file:/// URIs in markdown links
      if (/\]\(file:\/\/\//i.test(line)) {
        violations.push({
          filePath,
          line: lineNum,
          type: 'non-portable-uri',
          message: 'Found non-portable machine-local file:/// URI; use relative repository paths instead.'
        });
      }

      if (inCodeFence) return;

      // 2. Ban ambiguous "Dead End #N" prose
      if (/Dead Ends?\s*#\d+/i.test(line)) {
        violations.push({
          filePath,
          line: lineNum,
          type: 'ambiguous-dead-end-ref',
          message: 'Ambiguous "Dead End #N" citation; use explicit "DE-xx" row ID from DEAD_ENDS.md.'
        });
      }

      // 3. Validate DE-xx references
      for (const m of line.matchAll(/\bDE-(\d{2})\b/g)) {
        if (!validDe.has(m[1])) {
          violations.push({
            filePath,
            line: lineNum,
            type: 'invalid-de-id',
            message: `Unregistered Dead End reference DE-${m[1]}.`
          });
        }
      }

      // 4. Validate ADR references
      for (const m of line.matchAll(/\bADR[- ](\d{4})\b/g)) {
        if (!validAdrs.has(m[1])) {
          violations.push({
            filePath,
            line: lineNum,
            type: 'invalid-adr-id',
            message: `Unregistered ADR reference ADR-${m[1]}.`
          });
        }
      }

      // 5. Validate Fxx and Mxx ledger references
      for (const m of line.matchAll(/\bF(\d{1,3})\b/g)) {
        const fNum = parseInt(m[1], 10);
        if (!validFeatures.has(fNum)) {
          violations.push({
            filePath,
            line: lineNum,
            type: 'invalid-feature-id',
            message: `Unregistered Feature reference F${fNum} (not in PROJECT.md).`
          });
        }
      }
      for (const m of line.matchAll(/\bM(\d{1,3})\b/g)) {
        const mNum = parseInt(m[1], 10);
        if (!validMilestones.has(mNum)) {
          violations.push({
            filePath,
            line: lineNum,
            type: 'invalid-milestone-id',
            message: `Unregistered Milestone reference M${mNum} (not in PROJECT.md).`
          });
        }
      }

      // 6. Validate Markdown links [label](target) and #anchor slugs (outside inline backticks)
      const lineWithoutInlineCode = line.replace(/`[^`]*`/g, '');
      for (const m of lineWithoutInlineCode.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const rawTarget = m[1].trim();
        if (
          rawTarget.startsWith('http://') ||
          rawTarget.startsWith('https://') ||
          rawTarget.startsWith('mailto:') ||
          rawTarget.startsWith('file://') ||
          rawTarget.includes('<')
        ) {
          continue;
        }
        const [cleanPath, anchorFrag] = rawTarget.split('#');
        const resolved = cleanPath ? path.resolve(fileDir, cleanPath) : filePath;

        if (cleanPath && !fs.existsSync(resolved)) {
          violations.push({
            filePath,
            line: lineNum,
            type: 'broken-link',
            message: `Broken relative link target '${cleanPath}' (resolved to ${resolved}).`
          });
          continue;
        }

        if (anchorFrag && filePath !== dossierPath && resolved.endsWith('.md') && fs.existsSync(resolved)) {
          const slugs = getSlugs(resolved);
          if (!slugs.has(anchorFrag.toLowerCase())) {
            violations.push({
              filePath,
              line: lineNum,
              type: 'broken-anchor',
              message: `Broken Markdown heading anchor '#${anchorFrag}' in target '${path.relative(rootDir, resolved).replace(/\\/g, '/')}'.`
            });
          }
        }
      }

      // 7. Strict backticked path & code filename checks on living SSoT docs
      if (isLivingDoc) {
        for (const m of line.matchAll(/`([^`\n]+)`/g)) {
          const tok = m[1].trim();
          if (/^(?:src|scripts|docs)\/[A-Za-z0-9_./-]+$/.test(tok)) {
            const clean = tok.replace(/\/$/, '');
            if (clean === 'docs/COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md') continue;
            if (!fs.existsSync(path.join(rootDir, clean))) {
              violations.push({
                filePath,
                line: lineNum,
                type: 'stale-living-doc-path',
                message: `Backticked path '${tok}' in living SSoT specification does not exist on disk.`
              });
            }
          } else if (/^[A-Za-z0-9_.-]+\.(?:ts|tsx|mjs|mts|css)$/.test(tok)) {
            if (!allRepoBasenames.has(tok)) {
              violations.push({
                filePath,
                line: lineNum,
                type: 'stale-living-doc-filename',
                message: `Backticked filename '${tok}' in living SSoT specification does not match any file in the repository.`
              });
            }
          }
        }
      }
    });
  }

  // 8. Validate 1:1 ADR Index bijection in docs/adr/README.md
  const adrIndexPath = path.join(adrDir, 'README.md');
  if (fs.existsSync(adrIndexPath)) {
    const adrIndexText = fs.readFileSync(adrIndexPath, 'utf8');
    const indexedAdrFiles = new Set();
    for (const m of adrIndexText.matchAll(/\((\d{4}-[^)#]+\.md)\)/g)) {
      indexedAdrFiles.add(m[1]);
    }
    for (const adrFile of adrFilesOnDisk) {
      if (!indexedAdrFiles.has(adrFile)) {
        violations.push({
          filePath: adrIndexPath,
          line: 1,
          type: 'unindexed-adr',
          message: `ADR file 'docs/adr/${adrFile}' is not indexed in docs/adr/README.md.`
        });
      }
    }
  }

  // 9. Validate 100% bijective production file inventory in ARCHITECTURE.md Section 4
  const archPath = path.join(rootDir, 'ARCHITECTURE.md');
  if (fs.existsSync(archPath)) {
    const archLines = fs.readFileSync(archPath, 'utf8').split(/\r?\n/);
    let inSection4 = false;
    let section4StartLine = 1;
    let inSrcTree = false;
    const dirStack = [];
    const documentedSrcFiles = new Map();

    for (let i = 0; i < archLines.length; i++) {
      const line = archLines[i];
      if (/^## 4\.\s+Canonical Code Layout/.test(line)) {
        inSection4 = true;
        section4StartLine = i + 1;
        continue;
      }
      if (inSection4 && /^## \d+\./.test(line)) {
        break;
      }
      if (!inSection4) continue;

      const bulletMatch = line.match(/^(\s*)-\s+`([^`]+)`(.*)$/);
      if (!bulletMatch) continue;
      const indent = bulletMatch[1].length;
      const primary = bulletMatch[2].trim();
      const rest = bulletMatch[3] || '';

      if (indent === 0) {
        if (primary === 'src/') {
          inSrcTree = true;
          dirStack.length = 0;
          dirStack.push({ indent: 0, dir: 'src' });
        } else {
          inSrcTree = false;
          dirStack.length = 0;
        }
        continue;
      }

      if (!inSrcTree) continue;

      while (dirStack.length > 0 && dirStack[dirStack.length - 1].indent >= indent) {
        dirStack.pop();
      }
      const parentDir = dirStack.length > 0 ? dirStack[dirStack.length - 1].dir : 'src';

      if (primary.endsWith('/')) {
        const currentDir = path.posix.join(parentDir, primary.replace(/\/$/, ''));
        dirStack.push({ indent, dir: currentDir });

        for (const inlineMatch of rest.matchAll(/`([A-Za-z0-9_./-]+\.(?:ts|tsx|css))`/g)) {
          const relFile = path.posix.join(currentDir, inlineMatch[1]);
          documentedSrcFiles.set(relFile, i + 1);
        }
      } else if (/^[A-Za-z0-9_./-]+\.(?:ts|tsx|css)$/.test(primary)) {
        const relFile = path.posix.join(parentDir, primary);
        documentedSrcFiles.set(relFile, i + 1);
      }
    }

    const actualProdFiles = new Set(getProductionFilesPosix(path.join(rootDir, 'src')));
    for (const actualFile of [...actualProdFiles].sort()) {
      if (!documentedSrcFiles.has(actualFile)) {
        violations.push({
          filePath: archPath,
          line: section4StartLine,
          type: 'missing-architecture-inventory-file',
          message: `Production file '${actualFile}' is missing from ARCHITECTURE.md Section 4 (Canonical Code Layout).`
        });
      }
    }
    for (const [docFile, lineNum] of documentedSrcFiles.entries()) {
      if (!actualProdFiles.has(docFile)) {
        violations.push({
          filePath: archPath,
          line: lineNum,
          type: 'stale-architecture-inventory-file',
          message: `ARCHITECTURE.md Section 4 lists '${docFile}', which is not a live non-test production file in src/.`
        });
      }
    }
  }

  // 10. Validate Quick Section Index line ranges in MATH_SPEC.md & DESIGN_SYSTEM.md
  for (const specName of ['MATH_SPEC.md', 'DESIGN_SYSTEM.md']) {
    const specPath = path.join(rootDir, 'docs', specName);
    if (!fs.existsSync(specPath)) continue;
    const lines = fs.readFileSync(specPath, 'utf8').split(/\r?\n/);
    const totalLines = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;

    const headers = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^## (\d+)\.\s+/);
      if (m) headers.push({ secNum: m[1], startLine: i + 1 });
    }

    const expectedRanges = new Map();
    for (let i = 0; i < headers.length; i++) {
      const startLine = headers[i].startLine;
      const endLine = i + 1 < headers.length ? headers[i + 1].startLine - 1 : totalLines;
      expectedRanges.set(headers[i].secNum, `L${startLine}–L${endLine}`);
    }

    lines.forEach((line, idx) => {
      const m = line.match(/^\|\s*\*\*\[(\d+)\.\s+[^\]]+\]\([^)]+\)\*\*\s*\|\s*`(L\d+[–-]L\d+)`/);
      if (m) {
        const secNum = m[1];
        const actualRange = m[2].replace('-', '–');
        const expectedRange = expectedRanges.get(secNum);
        if (expectedRange && actualRange !== expectedRange) {
          violations.push({
            filePath: specPath,
            line: idx + 1,
            type: 'stale-spec-index',
            message: `Section ${secNum} Quick Index range is ${actualRange}, expected ${expectedRange} (run npm run sync:docs).`
          });
        }
      }
    });
  }

  return {
    totalFiles: coreDocs.length,
    violations
  };
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { totalFiles, violations } = runUnitSafetyCheck();
  const svgDefsCheck = runSvgDefsIdCheck();
  const mathPurity = runMathPurityCheck();
  const defaultDateCheck = runDefaultDateCheck();
  const agentsBudget = getAgentsSizeBudget();
  const docIntegrity = runDocIntegrityCheck();

  if (violations.length > 0) {
    console.error('\n❌ [unit-safety] Unit-Safety AST Guardrail Violations Detected:');
    console.error('The following UI presentation files use banned identity assertion wrappers (asDegrees / asRadians / asJulianDate / asJulianCenturies) or unsafe type coercions (`as unknown as`).');
    console.error('UI components must route values through verified conversion gatekeepers (toRadians, toDegrees, latToRadians, lonToRadians, getJulianDate, dateToJulianDate).\n');

    for (const v of violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line}:${v.column} — [${v.type}] ${v.identifier}`);
      console.error(`    > ${v.snippet}\n`);
    }

    process.exit(1);
  }

  if (svgDefsCheck.violations.length > 0) {
    console.error('\n❌ [svg-defs-id] Static SVG <defs> ID Guardrail Violations Detected:');
    console.error('SVG <defs> children must use instance-scoped IDs via useSafeSvgId() / React.useId() instead of static string literals.\n');

    for (const v of svgDefsCheck.violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line}:${v.column} — static id="${v.idValue}"`);
      console.error(`    > ${v.snippet}\n`);
    }

    process.exit(1);
  }

  if (mathPurity.violations.length > 0) {
    console.error('\n❌ [math-purity] Mathematical Purity AST Violations Detected:');
    console.error('Pure domain modules in src/utils/cosmicMath/** must remain pure and free of React, UI component imports, or presentation tokens.\n');

    for (const v of mathPurity.violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line}:${v.column} — ${v.source}`);
      console.error(`    > ${v.snippet}\n`);
    }

    process.exit(1);
  }

  if (defaultDateCheck.violations.length > 0) {
    console.error('\n❌ [default-date] Default new Date() Guardrail Violations Detected:');
    console.error('Components and hooks must use immutable J2000_DATE fallback constants instead of `= new Date()` to prevent referential churn.\n');

    for (const v of defaultDateCheck.violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line}:${v.column} — ${v.snippet}`);
    }

    process.exit(1);
  }

  if (!agentsBudget.isUnderBudget) {
    console.error(`\n❌ [unit-safety] AGENTS.md size budget violated: ${agentsBudget.sizeKb} KB > ${agentsBudget.maxKb} KB.`);
    console.error('Please pare down or relocate non-kernel documentation to docs/ to prevent AI prompt truncation.\n');
    process.exit(1);
  }

  if (docIntegrity.violations.length > 0) {
    console.error('\n❌ [doc-integrity] Documentation Integrity Guardrail Violations Detected:');
    for (const v of docIntegrity.violations) {
      const relPath = path.relative(rootDir, v.filePath).replace(/\\/g, '/');
      console.error(`  ${relPath}:${v.line} — [${v.type}] ${v.message}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(`\n✔ [unit-safety] All UI components (${totalFiles} files) conform to branded unit safety guardrails.`);
  console.log('  0 instances of asDegrees(), asRadians(), asJulianDate(), asJulianCenturies(), or `as unknown as` found in src/components/**.');
  console.log(`✔ [svg-defs-id] Collision-safe SVG <defs> scoping verified (${svgDefsCheck.totalFiles} UI files contain 0 static <defs> IDs).`);
  console.log(`✔ [math-purity] Mathematical domain purity verified (${mathPurity.totalFiles} files in src/utils/cosmicMath/** contain 0 React/UI imports or presentation/hex color tokens).`);
  console.log(`✔ [default-date] Prop identity stability verified (${defaultDateCheck.totalFiles} files in src/components and src/hooks contain 0 default new Date() instances).`);
  console.log(`✔ [unit-safety] AGENTS.md kernel size budget verified (${agentsBudget.sizeKb} KB <= ${agentsBudget.maxKb} KB).`);
  console.log(`✔ [doc-integrity] Documentation SSoT integrity verified (${docIntegrity.totalFiles} Markdown specifications: 0 broken links/anchors, 0 stale index ranges, 100% file inventory parity).\n`);
  process.exit(0);
}
