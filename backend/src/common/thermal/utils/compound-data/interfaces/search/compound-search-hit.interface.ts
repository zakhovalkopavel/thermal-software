/**
 * One ranked hit from compound-data catalogue search.
 * `id` is the index key (CAS or `formula:…`).
 */
export interface CompoundSearchHit {
  id: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  synonyms?: string[];
  class?: string;
  group?: string;
  score: number;
}
