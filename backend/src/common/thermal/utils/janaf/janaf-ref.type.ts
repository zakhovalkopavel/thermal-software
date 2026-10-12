import { RefKey } from '../../enum/ref-key.enum';

/**
 * Source line of a JANAF table: reference, 1-based line in the file and file key (the table id, e.g. "O-045").
 * The file key resolves through `sources.json` → `tableUrl` ("{id}"); the row URL is `lineUrl` ("{url}#L{line}").
 */
export type JanafRef = [ref: RefKey, line: number, file: string];
