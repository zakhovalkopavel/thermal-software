import { RefKey } from '../../enum/ref-key.enum';

export interface CompoundDataSourceFile {
  /** Table name used in the build report, e.g. "Perry 2-151" */
  name: string;
  /** Path in the source repository; repository path for local files, e.g. "shared/sources/transport-parameters.json" */
  path: string;
  /** `null` for the identifier databases */
  ref: RefKey | null;
  /**
   * File URL pinned to `sourceCommit`; `null` for local files: the PubChem cache (use `pubchemCid`) and the
   * transport-parameters tables (`white12`, `white13`, `whiteA6`, `whiteA7`, `itean1961T3`, `mamedov2014T1`,
   * `svehla1995T1`)
   */
  url: string | null;
}

/** PubChem identifiers of CAS numbers the chemicals identifier files miss (`identifierRef` file "idPubchemRest") */
export interface CompoundDataPubchemSource {
  /** PUG REST base URL the cache was filled from */
  api: string;
  /** Local cache file, e.g. "shared/sources/compound-data/pubchem/pubchem-cas.tsv" */
  cache: string;
  /** Compound page template with "{cid}" (`CompoundDataRecord.pubchemCid`) */
  compoundUrl: string;
}

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

/** Where the NASA species keys of `CompoundDataRecord.nasa7` / `nasa9` resolve */
export interface CompoundDataNasaDataset {
  ref: RefKey;
  /** Parsed species file, e.g. "shared/processed/NASA/nasa9.json" (`backend/data/nasa/` has the same keys) */
  dataset: string;
  /** Source files the keys were matched from, in merge order */
  sources: string[];
}

export interface CompoundDataNasaSource {
  nasa7: CompoundDataNasaDataset;
  nasa9: CompoundDataNasaDataset;
}

/** `sources.json`: resolves the file key of every `CompoundDataRef`, the JANAF table ids and the NASA keys */
export interface CompoundDataSourcesFile {
  generatedAt: string;
  repository: string;
  sourceCommit: string | null;
  sourceTree: string;
  license: string;
  /** Row URL template: "{url}#L{line}" */
  lineUrl: string;
  files: Record<string, CompoundDataSourceFile>;
  /** Absent when the build ran without the JANAF copy */
  janaf?: CompoundDataJanafSource;
  /** Absent when the build ran without the NASA sources */
  nasa?: CompoundDataNasaSource;
  /** Absent when the build ran without the PubChem cache */
  pubchem?: CompoundDataPubchemSource;
}
