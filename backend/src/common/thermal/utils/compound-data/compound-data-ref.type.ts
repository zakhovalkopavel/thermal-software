import { RefKey } from '../../enum/ref-key.enum';

/**
 * Source row of a value: reference, 1-based line in the file and file key.
 * The file key resolves through `sources.json` → `files[file].url`; the row URL is `{url}#L{line}`.
 */
export type CompoundDataRef = [ref: RefKey, line: number, file: string];

/** Row of an identifier database (no literature reference) */
export type CompoundDataLineRef = [line: number, file: string];
