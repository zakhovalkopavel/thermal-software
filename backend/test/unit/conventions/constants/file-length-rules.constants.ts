import { FileLengthRule } from '../types/file-length-rule.type';

/** Data tables may be arbitrarily long: `data/` folders, `*.data.ts`, compound data files. */
const DATA_FILE_PATTERNS: RegExp[] = [
  /(^|\/)data\//,
  /\.data\.ts$/,
  /(^|\/)compound\//,
];

/** Files produced by `make references-generate` — never edited by hand. */
const GENERATED_FILE_PATTERNS: RegExp[] = [
  /(^|\/)ref-key\.(enum|dto)\.ts$/,
];

/**
 * File-length limits (see `docs/CONVENTIONS.md` § File length limits).
 *
 * Files that already exceed a limit are grandfathered in `file-length-baseline.json`:
 * they may not grow, and must be removed from the baseline once they are split.
 */
export const FILE_LENGTH_RULES: FileLengthRule[] = [
  {
    name: 'backend code files (src)',
    root: 'src',
    extensions: ['.ts'],
    excludePatterns: [/\.spec\.ts$/, ...DATA_FILE_PATTERNS, ...GENERATED_FILE_PATTERNS],
    maxLines: 300,
  },
  {
    name: 'backend test files (test)',
    root: 'test',
    extensions: ['.ts'],
    excludePatterns: [...DATA_FILE_PATTERNS],
    maxLines: 500,
  },
  {
    name: 'documentation (docs)',
    root: 'docs',
    extensions: ['.md'],
    excludePatterns: [],
    maxLines: 500,
  },
];
