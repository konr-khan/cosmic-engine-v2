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

export function runUnitSafetyCheck(): UnitSafetyResult;
export function runMathPurityCheck(): MathPurityResult;
export function getAgentsSizeBudget(): AgentsBudgetResult;
export function runDefaultDateCheck(): DefaultDateResult;
export function getSourceFiles(dir: string): string[];
