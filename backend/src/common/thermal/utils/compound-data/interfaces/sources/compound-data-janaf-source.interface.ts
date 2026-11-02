import { RefKey } from '../../../../enum/ref-key.enum';

/** Where the NIST-JANAF table ids of `CompoundDataRecord.janaf` resolve */
export interface CompoundDataJanafSource {
  ref: RefKey;
  /** py-janaf repository the tables were parsed from */
  repository: string;
  sourceCommit: string | null;
  /** Parsed tables: "shared/processed/JANAF/index.json" */
  dataset: string;
  /** py-janaf file template with "{id}" */
  tableUrl: string;
  /** NIST page template with "{id}" */
  nistUrl: string;
}
