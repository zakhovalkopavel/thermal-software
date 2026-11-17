/**
 * A single file-length problem found by `FileLengthChecker.findViolations`.
 *
 * - `over-limit`: file exceeds the limit and is not in the baseline.
 * - `grew`: file is in the baseline but is longer than its recorded size.
 * - `ratchet`: file is in the baseline, still over the limit, but shorter than recorded
 *   (lower the baseline entry so it cannot grow back).
 * - `stale`: baseline entry is no longer needed (file within the limit, deleted, or excluded).
 */
export type FileLengthViolation = {
  kind: 'over-limit' | 'grew' | 'ratchet' | 'stale';
  /** Label of the file, e.g. `src/modules/foo/foo.service.ts`. */
  file: string;
  /** Measured number of lines (0 when the file no longer exists). */
  lines: number;
  /** Rule limit. */
  limit: number;
  /** Baseline value, when the file has a baseline entry. */
  baseline?: number;
  /** Actionable, human-readable message. */
  message: string;
};
