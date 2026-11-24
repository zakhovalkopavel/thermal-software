import { StructureRuleId } from '../types/structure-rule-id.type';

/**
 * Human-readable titles and the minimum count that counts as a violation for each rule.
 * Severity below `minViolation` is not recorded (file is clean for that rule).
 *
 * See docs/CONVENTIONS.md § Core Principles / SRP.
 */
export const STRUCTURE_RULES: ReadonlyArray<{
  id: StructureRuleId;
  name: string;
  /** Counts at or above this value are violations (and may be grandfathered). */
  minViolation: number;
}> = [
  {
    id: 'multipleExports',
    name: 'one exported construct per file',
    minViolation: 2,
  },
  {
    id: 'mixedConstructKinds',
    name: 'no mixed construct kinds in one file',
    minViolation: 2,
  },
  {
    id: 'exportedFreeFunctions',
    name: 'no function families (≥ 2 exported free functions)',
    minViolation: 2,
  },
  {
    id: 'suffixFolderMismatch',
    name: 'file suffix matches its construct folder',
    minViolation: 1,
  },
  {
    id: 'helperFiles',
    name: 'no *.helper.ts files (use service or static class)',
    minViolation: 1,
  },
];
