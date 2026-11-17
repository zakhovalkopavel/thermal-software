import { StructureRuleId } from '../types/structure-rule-id.type';

/** Empty baseline shape used when seeding or comparing. */
export const EMPTY_STRUCTURE_BASELINE: Record<StructureRuleId, Record<string, number>> = {
  multipleExports: {},
  mixedConstructKinds: {},
  exportedFreeFunctions: {},
  suffixFolderMismatch: {},
  helperFiles: {},
};
