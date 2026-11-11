/**
 * @file lintUnitSafety.d.mts
 * Type declarations for scripts/lintUnitSafety.mjs
 */

export interface UnitViolation {
  filePath: string;
  line: number;
  column: number;
  identifier: string;
  type: string;
  snippet: string;
}

export interface UnitSafetyResult {
  totalFiles: number;
  violations: UnitViolation[];
}

export interface SvgDefsIdViolation {
  filePath: string;
  line: number;
  column: number;
  idValue: string;
  snippet: string;
}

export interface SvgDefsIdResult {
  totalFiles: number;
  violations: SvgDefsIdViolation[];
}

export interface MathPurityViolation {
  filePath: string;
  line: number;
  column: number;
  source: string;
  snippet: string;
}

export interface MathPurityResult {
  totalFiles: number;
  violations: MathPurityViolation[];
}

export interface AgentsBudgetResult {
  path: string;
  sizeBytes: number;
  sizeKb: number;
  maxKb: number;
  isUnderBudget: boolean;
}

export interface DefaultDateViolation {
  filePath: string;
  line: number;
  column: number;
  snippet: string;
}

export interface DefaultDateResult {
  totalFiles: number;
  violations: DefaultDateViolation[];
}

export interface DocIntegrityViolation {
  filePath: string;
  line: number;
  type: string;
  message: string;
}

export interface DocIntegrityResult {
  totalFiles: number;
  violations: DocIntegrityViolation[];
}

export function runUnitSafetyCheck(targetDir?: string): UnitSafetyResult;
export function scanSvgDefsIdsInSource(content: string, filePath?: string): SvgDefsIdViolation[];
export function runSvgDefsIdCheck(targetDir?: string): SvgDefsIdResult;
export function runMathPurityCheck(targetDir?: string): MathPurityResult;
export function getAgentsSizeBudget(): AgentsBudgetResult;
export function runDefaultDateCheck(targetDirs?: string[]): DefaultDateResult;
export function runDocIntegrityCheck(): DocIntegrityResult;
export function getSourceFiles(dir: string): string[];
