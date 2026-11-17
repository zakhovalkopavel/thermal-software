import { ExportedConstructKind } from './exported-construct-kind.type';

/** Result of analysing one TypeScript source file for structure conventions. */
export type StructureFileAnalysis = {
  exportCount: number;
  kindCount: number;
  functionCount: number;
  kinds: ExportedConstructKind[];
  suffixFolderMismatch: boolean;
  isHelperFile: boolean;
};
