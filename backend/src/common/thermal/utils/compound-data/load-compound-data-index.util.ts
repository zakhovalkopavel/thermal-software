import * as fs from 'fs';
import * as path from 'path';
import { compoundDataDir } from './compound-data-dir.util';
import { CompoundDataIndexFile } from './interfaces/dataset/compound-data-index-file.interface';

let index: CompoundDataIndexFile | undefined;

/** `index.json`, parsed once. */
export function loadCompoundDataIndex(): CompoundDataIndexFile {
  index ??= JSON.parse(
    fs.readFileSync(path.join(compoundDataDir(), 'index.json'), 'utf8'),
  ) as CompoundDataIndexFile;
  return index;
}
