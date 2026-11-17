import * as fs from 'fs';
import * as path from 'path';
import { FileLengthRule } from '../types/file-length-rule.type';
import { FileLengthViolation } from '../types/file-length-violation.type';

const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', '.git']);
const BASELINE_FILE = 'test/unit/conventions/file-length-baseline.json';

/**
 * Measures file lengths and compares them with a rule and a baseline of grandfathered files.
 *
 * Line counting matches `wc -l` for files ending with a newline; a final line without a trailing
 * newline is counted as well. An empty file has 0 lines.
 */
export class FileLengthChecker {
  /** Number of lines in `content`. */
  static countLines(content: string): number {
    if (content === '') return 0;
    const parts = content.split('\n');
    return content.endsWith('\n') ? parts.length - 1 : parts.length;
  }

  /**
   * Absolute directory for a rule root, or `null` when it is not available
   * (e.g. `docs/` is not mounted into the container).
   * `docs/` is looked up next to the backend directory (host: `<repo>/docs`; container: the
   * `./docs:/docs:ro` mount next to `/app`), then inside it as a fallback.
   */
  static resolveRoot(backendDir: string, root: FileLengthRule['root']): string | null {
    const candidates = root === 'docs'
      ? [path.join(backendDir, '..', 'docs'), path.join(backendDir, 'docs')]
      : [path.join(backendDir, root)];
    return candidates.find(dir => fs.existsSync(dir) && fs.statSync(dir).isDirectory()) ?? null;
  }

  /**
   * Line count of every file covered by `rule`, keyed by label
   * (`<root>/<posix path relative to rootDir>`).
   */
  static measure(rootDir: string, rule: FileLengthRule): Record<string, number> {
    const measured: Record<string, number> = {};
    FileLengthChecker.walk(rootDir, rootDir, rule, measured);
    return measured;
  }

  /**
   * Compare measured lengths with the rule limit and the baseline.
   * Only baseline entries under `rule.root` are considered.
   */
  static findViolations(
    measured: Record<string, number>,
    rule: FileLengthRule,
    baseline: Record<string, number>,
  ): FileLengthViolation[] {
    const violations: FileLengthViolation[] = [];
    const limit = rule.maxLines;
    const prefix = `${rule.root}/`;

    for (const [file, lines] of Object.entries(measured)) {
      const recorded = baseline[file];
      if (lines <= limit) {
        if (recorded !== undefined) {
          violations.push({
            kind: 'stale', file, lines, limit, baseline: recorded,
            message: `${file}: ${lines} lines is within the ${limit}-line limit — remove it from ${BASELINE_FILE}.`,
          });
        }
        continue;
      }
      if (recorded === undefined) {
        violations.push({
          kind: 'over-limit', file, lines, limit,
          message: `${file}: ${lines} lines exceeds the ${limit}-line limit — split it `
            + '(see docs/CONVENTIONS.md § File length limits).',
        });
      } else if (lines > recorded) {
        violations.push({
          kind: 'grew', file, lines, limit, baseline: recorded,
          message: `${file}: grew to ${lines} lines (baseline ${recorded}, limit ${limit}) — `
            + 'oversized files must not grow; split it instead.',
        });
      } else if (lines < recorded) {
        violations.push({
          kind: 'ratchet', file, lines, limit, baseline: recorded,
          message: `${file}: shrank to ${lines} lines — lower its entry in ${BASELINE_FILE} `
            + `from ${recorded} to ${lines}.`,
        });
      }
    }

    for (const [file, recorded] of Object.entries(baseline)) {
      if (file.startsWith(prefix) && measured[file] === undefined) {
        violations.push({
          kind: 'stale', file, lines: 0, limit, baseline: recorded,
          message: `${file}: listed in ${BASELINE_FILE} but it no longer exists or is no longer `
            + 'covered by the rule — remove the entry.',
        });
      }
    }

    return violations.sort((a, b) => a.file.localeCompare(b.file));
  }

  private static walk(
    rootDir: string,
    currentDir: string,
    rule: FileLengthRule,
    measured: Record<string, number>,
  ): void {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          FileLengthChecker.walk(rootDir, fullPath, rule, measured);
        }
        continue;
      }
      if (!rule.extensions.includes(path.extname(entry.name))) continue;

      const relative = path.relative(rootDir, fullPath).split(path.sep).join('/');
      const label = `${rule.root}/${relative}`;
      if (rule.excludePatterns.some(pattern => pattern.test(label))) continue;

      measured[label] = FileLengthChecker.countLines(fs.readFileSync(fullPath, 'utf8'));
    }
  }
}
