/** Internal searchable document built once from the compound-data index. */
export interface CompoundSearchDoc {
  id: string;
  cas: string | null;
  otherCas: string[];
  name: string;
  nameNorm: string;
  synonyms: string[];
  synonymNorms: string[];
  hill: string;
  displayFormula: string;
  formulaKeys: string[];
  class: string;
  group: string;
  gasesCapable: boolean;
}
