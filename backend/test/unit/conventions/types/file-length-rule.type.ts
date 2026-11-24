/**
 * One file-length rule: which files it covers and the maximum number of lines.
 *
 * Labels tested by `excludePatterns` are POSIX paths relative to the backend directory and start
 * with the rule root, e.g. `src/modules/refractory/data/materials.data.ts`.
 */
export type FileLengthRule = {
  /** Human-readable name used in test titles. Must be unique. */
  name: string;
  /** Top-level directory scanned. Each root belongs to exactly one rule. */
  root: 'src' | 'test' | 'docs';
  /** File extensions covered, including the dot (e.g. `.ts`). */
  extensions: string[];
  /** Files whose label matches any of these are not measured (data, generated files). */
  excludePatterns: RegExp[];
  /** Maximum allowed number of lines. */
  maxLines: number;
};
