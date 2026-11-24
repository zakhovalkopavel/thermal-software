import { CONSTRUCT_FOLDER_SEGMENTS } from '../constants/construct-folder-segments.constants';

/**
 * Suffix ↔ folder placement checks for structure conventions
 * (docs/CONVENTIONS.md § Construct → folder → file).
 */
export class StructurePathRules {
  /**
   * Whether `label` (e.g. `src/common/utils/foo.interface.ts`) has the wrong folder for its suffix.
   * Documented exceptions: legacy singular `type/` / `enum/`; equation types
   * `type/<name>-equation.ts` without `.type.ts` are not checked here (they have no special suffix).
   */
  static hasSuffixFolderMismatch(label: string): boolean {
    const segments = label.split('/');
    const fileName = segments[segments.length - 1] ?? '';
    const parentFolders = new Set(segments.slice(0, -1));

    if (fileName.endsWith('.interface.ts')) {
      return !StructurePathRules.pathHasFolder(
        parentFolders,
        CONSTRUCT_FOLDER_SEGMENTS.interface,
      );
    }
    if (fileName.endsWith('.type.ts')) {
      if (StructurePathRules.pathHasFolder(parentFolders, CONSTRUCT_FOLDER_SEGMENTS.interface)) {
        return true;
      }
      return !StructurePathRules.pathHasFolder(parentFolders, CONSTRUCT_FOLDER_SEGMENTS.type);
    }
    if (fileName.endsWith('.constants.ts')) {
      return !StructurePathRules.pathHasFolder(
        parentFolders,
        CONSTRUCT_FOLDER_SEGMENTS.constants,
      );
    }
    if (fileName.endsWith('.enum.ts')) {
      return !StructurePathRules.pathHasFolder(parentFolders, CONSTRUCT_FOLDER_SEGMENTS.enum);
    }

    if (
      StructurePathRules.pathHasFolder(parentFolders, CONSTRUCT_FOLDER_SEGMENTS.constants)
      && fileName.endsWith('.ts')
      && !fileName.endsWith('.constants.ts')
    ) {
      return true;
    }

    return false;
  }

  private static pathHasFolder(pathFolders: Set<string>, allowed: Set<string>): boolean {
    for (const folder of allowed) {
      if (pathFolders.has(folder)) return true;
    }
    return false;
  }
}
