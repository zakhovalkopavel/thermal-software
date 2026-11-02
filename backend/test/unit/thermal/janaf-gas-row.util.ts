import * as fs from 'fs';
import * as path from 'path';
import { JanafRow } from '../../../src/common/thermal/utils/janaf/janaf-row.interface';

interface JanafIndexEntry {
  formula: string;
  phase?: string;
  file: string;
}

interface JanafCompoundFile {
  tables: Record<string, { rows?: JanafRow[] }>;
}

let index: Record<string, JanafIndexEntry> | undefined;
const files = new Map<string, JanafCompoundFile>();

/** `shared/processed/JANAF` of the repo root, walking up from this file. */
function janafDir(): string {
  for (let dir = __dirname; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'shared', 'processed', 'JANAF');
    if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate;
    if (path.dirname(dir) === dir) {
      throw new Error(`JANAF directory not found above ${__dirname}`);
    }
  }
}

function janafIndex(): Record<string, JanafIndexEntry> {
  if (!index) {
    const parsed = JSON.parse(fs.readFileSync(path.join(janafDir(), 'index.json'), 'utf8')) as {
      tables: Record<string, JanafIndexEntry>;
    };
    index = parsed.tables;
  }
  return index;
}

/**
 * Gas-phase JANAF row at `T` (K) for a conventional formula.
 * Elements whose JANAF table is the reference state (N2, O2, H2) use phase `ref`.
 */
export function janafGasRow(formula: string, T: number): JanafRow {
  const tables = janafIndex();
  const match = (phase: string): string | undefined =>
    Object.keys(tables).find(id => tables[id].formula === formula && tables[id].phase === phase);
  const id = match('g') ?? match('ref');
  if (!id) throw new Error(`No gas JANAF table for ${formula}`);

  const fileName = tables[id].file;
  let compound = files.get(fileName);
  if (!compound) {
    compound = JSON.parse(fs.readFileSync(path.join(janafDir(), fileName), 'utf8')) as JanafCompoundFile;
    files.set(fileName, compound);
  }
  const row = compound.tables[id].rows?.find(candidate => Math.abs(candidate.T - T) < 1e-6);
  if (!row) throw new Error(`No JANAF row for ${formula} (${id}) at ${T} K`);
  return row;
}
