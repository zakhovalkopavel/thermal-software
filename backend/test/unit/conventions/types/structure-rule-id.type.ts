/**
 * Identifiers for structure rules enforced by `StructureChecker`
 * (see docs/CONVENTIONS.md § Core Principles / SRP).
 */
export type StructureRuleId =
  | 'multipleExports'
  | 'mixedConstructKinds'
  | 'exportedFreeFunctions'
  | 'suffixFolderMismatch'
  | 'helperFiles';
