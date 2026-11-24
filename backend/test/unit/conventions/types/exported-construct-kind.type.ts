/**
 * Kind of a primary exported construct in a TypeScript source file.
 * Matches the construct rows in docs/CONVENTIONS.md § Construct → folder → file → export.
 */
export type ExportedConstructKind =
  | 'type'
  | 'interface'
  | 'class'
  | 'enum'
  | 'function'
  | 'const';
