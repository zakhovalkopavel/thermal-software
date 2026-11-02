import { RefKey } from '../../../../enum/ref-key.enum';

/** Where the NASA species keys of `CompoundDataRecord.nasa7` / `nasa9` resolve */
export interface CompoundDataNasaDataset {
  ref: RefKey;
  /** Parsed species file, e.g. "shared/processed/NASA/nasa9.json" */
  dataset: string;
  /** Source files the keys were matched from, in merge order */
  sources: string[];
}
