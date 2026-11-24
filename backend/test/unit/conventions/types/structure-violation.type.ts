import { StructureRuleId } from './structure-rule-id.type';

/**
 * A single structure problem found by `StructureChecker.findViolations`.
 *
 * - `over-limit`: file violates the rule and is not in the baseline.
 * - `grew`: file is in the baseline but its violation count increased.
 * - `ratchet`: file is in the baseline, still violating, but the count shrank
 *   (lower the baseline entry so it cannot grow back).
 * - `stale`: baseline entry is no longer needed (fixed, deleted, or excluded).
 */
export type StructureViolation = {
  kind: 'over-limit' | 'grew' | 'ratchet' | 'stale';
  ruleId: StructureRuleId;
  /** Label of the file, e.g. `src/modules/foo/foo.service.ts`. */
  file: string;
  /** Measured violation severity (export count, kind count, function count, or 1). */
  count: number;
  /** Baseline value, when the file has a baseline entry. */
  baseline?: number;
  /** Actionable, human-readable message. */
  message: string;
};
