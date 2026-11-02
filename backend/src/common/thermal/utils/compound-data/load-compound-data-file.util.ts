import * as fs from 'fs';
import * as path from 'path';
import { compoundDataDir } from './compound-data-dir.util';
import { CompoundDataCompoundFile } from './interfaces/record/compound-data-compound-file.interface';

const files = new Map<string, CompoundDataCompoundFile>();

/** One compound file, path relative to the dataset folder, parsed once. */
export function loadCompoundDataFile(relativePath: string): CompoundDataCompoundFile {
  const cached = files.get(relativePath);
  if (cached) return cached;
  const doc = JSON.parse(
    fs.readFileSync(path.join(compoundDataDir(), relativePath), 'utf8'),
  ) as CompoundDataCompoundFile;
  files.set(relativePath, doc);
  return doc;
}
