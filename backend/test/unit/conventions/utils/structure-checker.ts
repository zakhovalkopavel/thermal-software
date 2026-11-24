import * as fs from 'fs';
import * as path from 'path';
import { EMPTY_STRUCTURE_BASELINE } from '../constants/empty-structure-baseline.constants';
import { STRUCTURE_BASELINE_FILE } from '../constants/structure-baseline-file.constants';
import { STRUCTURE_EXCLUDE_PATTERNS } from '../constants/structure-exclude-patterns.constants';
import { STRUCTURE_RULES } from '../constants/structure-rules.constants';
import { STRUCTURE_SKIPPED_DIRECTORIES } from '../constants/structure-skipped-directories.constants';
import { StructureBaseline } from '../types/structure-baseline.type';
import { StructureViolation } from '../types/structure-violation.type';
import { StructureFileAnalyser } from './structure-file-analyser';
import { StructureViolationMessage } from './structure-violation-message';

/**
 * Measures SRP / folder / helper structure of `backend/src` and compares with a ratcheting baseline.
 *
 * Semantics match `FileLengthChecker`: violation counts may not grow; shrinks must lower the
 * baseline; fixed or deleted files must leave the baseline.
 */
export class StructureChecker {
  /** Absolute path to `backend/src`, or `null` when it is missing. */
  static resolveSrcDir(backendDir: string): string | null {
    const srcDir = path.join(backendDir, 'src');
    return fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory() ? srcDir : null;
  }

  /**
   * Measure every covered TypeScript file under `src/` and return violation maps per rule
   * (files that are clean for a rule are omitted from that rule's map).
   */
  static measure(srcDir: string): StructureBaseline {
    const result: StructureBaseline = {
      multipleExports: {},
      mixedConstructKinds: {},
      exportedFreeFunctions: {},
      suffixFolderMismatch: {},
      helperFiles: {},
    };

    for (const absolute of StructureChecker.listTsFiles(srcDir)) {
      const relative = path.relative(srcDir, absolute).split(path.sep).join('/');
      const label = `src/${relative}`;
      if (STRUCTURE_EXCLUDE_PATTERNS.some(pattern => pattern.test(label))) continue;

      const analysis = StructureFileAnalyser.analyse(label, fs.readFileSync(absolute, 'utf8'));

      if (analysis.exportCount >= 2) {
        result.multipleExports[label] = analysis.exportCount;
      }
      if (analysis.kindCount >= 2) {
        result.mixedConstructKinds[label] = analysis.kindCount;
      }
      if (analysis.functionCount >= 2) {
        result.exportedFreeFunctions[label] = analysis.functionCount;
      }
      if (analysis.suffixFolderMismatch) {
        result.suffixFolderMismatch[label] = 1;
      }
      if (analysis.isHelperFile) {
        result.helperFiles[label] = 1;
      }
    }

    return result;
  }

  /**
   * Compare measured violation maps with the baseline. Returns all problems across all rules,
   * sorted by rule id then file path.
   */
  static findViolations(
    measured: StructureBaseline,
    baseline: StructureBaseline,
  ): StructureViolation[] {
    const violations: StructureViolation[] = [];

    for (const rule of STRUCTURE_RULES) {
      const measuredMap = measured[rule.id] ?? {};
      const baselineMap = baseline[rule.id] ?? {};

      for (const [file, count] of Object.entries(measuredMap)) {
        const recorded = baselineMap[file];
        if (recorded === undefined) {
          violations.push({
            kind: 'over-limit',
            ruleId: rule.id,
            file,
            count,
            message: StructureViolationMessage.forOverLimit(rule.id, file, count),
          });
        } else if (count > recorded) {
          violations.push({
            kind: 'grew',
            ruleId: rule.id,
            file,
            count,
            baseline: recorded,
            message: `${file} [${rule.id}]: severity grew to ${count} (baseline ${recorded}) — `
              + 'grandfathered structure violations must not worsen; split or move constructs instead.',
          });
        } else if (count < recorded) {
          violations.push({
            kind: 'ratchet',
            ruleId: rule.id,
            file,
            count,
            baseline: recorded,
            message: `${file} [${rule.id}]: severity shrank to ${count} — lower its entry in `
              + `${STRUCTURE_BASELINE_FILE} from ${recorded} to ${count}.`,
          });
        }
      }

      for (const [file, recorded] of Object.entries(baselineMap)) {
        if (measuredMap[file] === undefined) {
          violations.push({
            kind: 'stale',
            ruleId: rule.id,
            file,
            count: 0,
            baseline: recorded,
            message: `${file} [${rule.id}]: listed in ${STRUCTURE_BASELINE_FILE} but no longer `
              + 'violates (or is excluded) — remove the entry.',
          });
        }
      }
    }

    return violations.sort((a, b) => {
      const byRule = a.ruleId.localeCompare(b.ruleId);
      return byRule !== 0 ? byRule : a.file.localeCompare(b.file);
    });
  }

  /** Empty baseline used by unit tests. */
  static emptyBaseline(): StructureBaseline {
    return {
      multipleExports: { ...EMPTY_STRUCTURE_BASELINE.multipleExports },
      mixedConstructKinds: { ...EMPTY_STRUCTURE_BASELINE.mixedConstructKinds },
      exportedFreeFunctions: { ...EMPTY_STRUCTURE_BASELINE.exportedFreeFunctions },
      suffixFolderMismatch: { ...EMPTY_STRUCTURE_BASELINE.suffixFolderMismatch },
      helperFiles: { ...EMPTY_STRUCTURE_BASELINE.helperFiles },
    };
  }

  private static listTsFiles(rootDir: string): string[] {
    const files: string[] = [];
    const walk = (currentDir: string): void => {
      for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!STRUCTURE_SKIPPED_DIRECTORIES.has(entry.name)) walk(fullPath);
          continue;
        }
        if (path.extname(entry.name) === '.ts') files.push(fullPath);
      }
    };
    walk(rootDir);
    return files;
  }
}
