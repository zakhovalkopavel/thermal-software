import * as fs from 'fs';
import * as path from 'path';
import { FILE_LENGTH_RULES } from './constants/file-length-rules.constants';
import { FileLengthChecker } from './utils/file-length-checker';

/**
 * Enforces the file-length limits from docs/CONVENTIONS.md § File length limits.
 *
 * Run inside Docker: `docker compose exec backend npm run test -- conventions/file-length`.
 * `docs/` must be mounted into the backend container (compose.yml: `./docs:/docs:ro`, a sibling of
 * `/app`); when it is absent (e.g. `compose.production.yml`) the docs rule is skipped with a warning.
 */
const BACKEND_DIR = path.resolve(__dirname, '..', '..', '..');
const BASELINE: Record<string, number> = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'file-length-baseline.json'), 'utf8'),
);

describe('file length limits', () => {
  for (const rule of FILE_LENGTH_RULES) {
    const rootDir = FileLengthChecker.resolveRoot(BACKEND_DIR, rule.root);
    const title = `${rule.name}: no file over ${rule.maxLines} lines (baseline files may not grow)`;

    if (rootDir === null) {
      console.warn(`[file-length] "${rule.root}/" not found next to ${BACKEND_DIR} — rule skipped.`);
      it.skip(title, () => undefined);
      continue;
    }

    it(title, () => {
      const measured = FileLengthChecker.measure(rootDir, rule);
      expect(Object.keys(measured).length).toBeGreaterThan(0);

      const violations = FileLengthChecker.findViolations(measured, rule, BASELINE);
      expect(violations.map(violation => violation.message)).toEqual([]);
    });
  }

  it('has exactly one rule per root', () => {
    const roots = FILE_LENGTH_RULES.map(rule => rule.root);
    expect(new Set(roots).size).toBe(roots.length);
  });

  it('only grandfathers files that belong to a configured root', () => {
    const roots = new Set(FILE_LENGTH_RULES.map(rule => rule.root));
    const unknown = Object.keys(BASELINE).filter(file => !roots.has(file.split('/')[0] as never));
    expect(unknown).toEqual([]);
  });
});
