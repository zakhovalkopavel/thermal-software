export type CompoundSearchHit = {
  id: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  synonyms?: string[];
  class?: string;
  group?: string;
  score: number;
};
