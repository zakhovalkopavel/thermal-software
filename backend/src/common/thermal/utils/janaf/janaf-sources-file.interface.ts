import { RefKey } from '../../enum/ref-key.enum';

/** `sources.json`: resolves the table id of every `JanafRef` */
export interface JanafSourcesFile {
  generatedAt: string;
  ref: RefKey;
  /** py-janaf repository the tables were parsed from */
  repository: string;
  sourceCommit: string | null;
  sourceTree: string;
  license: string;
  /** Row URL template: "{url}#L{line}" */
  lineUrl: string;
  /** py-janaf file template with "{id}", pinned to `sourceCommit` */
  tableUrl: string;
  /** NIST page template with "{id}" */
  nistUrl: string;
}
