import { CompoundDataCoolpropSource } from './compound-data-coolprop-source.type';
import { CompoundDataJanafSource } from './compound-data-janaf-source.type';
import { CompoundDataNasaSource } from './compound-data-nasa-source.type';
import { CompoundDataPubchemSource } from './compound-data-pubchem-source.type';
import { CompoundDataSourceFile } from './compound-data-source-file.type';

/** `sources.json`: resolves the file key of every `CompoundDataRef`, the JANAF table ids and the NASA keys */
export type CompoundDataSourcesFile = {
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
  /** Absent when the build ran without CoolProp fluid keys */
  coolprop?: CompoundDataCoolpropSource;
  /** Absent when the build ran without the PubChem files */
  pubchem?: CompoundDataPubchemSource;
}
