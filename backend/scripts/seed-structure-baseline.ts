/**
 * One-shot helper: rewrite structure-baseline.json from an AST measurement of backend/src.
 * Run: `docker compose exec backend npx ts-node scripts/seed-structure-baseline.ts`
 */
import * as fs from 'fs';
import * as path from 'path';
import { StructureChecker } from '../test/unit/conventions/utils/structure-checker';

const backendDir = path.resolve(__dirname, '..');
const srcDir = StructureChecker.resolveSrcDir(backendDir);
if (srcDir === null) {
  throw new Error(`backend/src not found under ${backendDir}`);
}

const measured = StructureChecker.measure(srcDir);
const out = path.join(
  backendDir,
  'test/unit/conventions/structure-baseline.json',
);
fs.writeFileSync(out, `${JSON.stringify(measured, null, 2)}\n`);

for (const [ruleId, map] of Object.entries(measured)) {
  // eslint-disable-next-line no-console
  console.log(`${ruleId}: ${Object.keys(map).length} files`);
}
