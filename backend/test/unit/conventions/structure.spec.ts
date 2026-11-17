import * as fs from 'fs';
import * as path from 'path';
import { STRUCTURE_RULES } from './constants/structure-rules.constants';
import { StructureBaseline } from './types/structure-baseline.type';
import { StructureChecker } from './utils/structure-checker';

/**
 * Enforces one-construct-per-file / folder / helper rules from docs/CONVENTIONS.md.
 *
 * Run inside Docker: `docker compose exec backend npm run test -- conventions/structure`.
 * Violations are grandfathered in `structure-baseline.json` and may only shrink.
 */
const BACKEND_DIR = path.resolve(__dirname, '..', '..', '..');
const BASELINE: StructureBaseline = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'structure-baseline.json'), 'utf8'),
);

describe('structure conventions', () => {
  const srcDir = StructureChecker.resolveSrcDir(BACKEND_DIR);

  it('backend/src is available for structure measurement', () => {
    expect(srcDir).not.toBeNull();
  });

  if (srcDir === null) {
    return;
  }

  const measured = StructureChecker.measure(srcDir);

  for (const rule of STRUCTURE_RULES) {
    it(`${rule.name}: no new or worsened violations (baseline may only shrink)`, () => {
      const scopedMeasured: StructureBaseline = StructureChecker.emptyBaseline();
      const scopedBaseline: StructureBaseline = StructureChecker.emptyBaseline();
      scopedMeasured[rule.id] = measured[rule.id];
      scopedBaseline[rule.id] = BASELINE[rule.id] ?? {};

      const violations = StructureChecker.findViolations(scopedMeasured, scopedBaseline);
      expect(violations.map(violation => violation.message)).toEqual([]);
    });
  }

  it('baseline only contains known rule ids', () => {
    const known = new Set(STRUCTURE_RULES.map(rule => rule.id));
    const unknown = Object.keys(BASELINE).filter(key => !known.has(key as never));
    expect(unknown).toEqual([]);
  });

  it('baseline entries use src/ labels', () => {
    const bad = Object.values(BASELINE)
      .flatMap(map => Object.keys(map))
      .filter(file => !file.startsWith('src/'));
    expect(bad).toEqual([]);
  });
});
