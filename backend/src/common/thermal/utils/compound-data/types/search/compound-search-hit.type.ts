/**
 * One ranked hit from compound-data catalogue search.
 * `compoundId` is the index key (name slug; `_1`/`_2`/… when names collide).
 */
export type CompoundSearchHit = {
  /** @deprecated Prefer `compoundId` */
  id: string;
  compoundId: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  synonyms?: string[];
  class?: string;
  group?: string;
  score: number;
}
