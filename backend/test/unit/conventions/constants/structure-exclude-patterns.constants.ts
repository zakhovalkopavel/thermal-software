/** Data tables and compound records are exempt from structure rules (same as file length). */
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
 * Files skipped entirely by structure measurement.
 * Barrels (`index.ts`) may re-export many constructs; specs are not production code.
 */
export const STRUCTURE_EXCLUDE_PATTERNS: RegExp[] = [
  /(^|\/)index\.ts$/,
  /\.spec\.ts$/,
  ...DATA_FILE_PATTERNS,
  ...GENERATED_FILE_PATTERNS,
];
