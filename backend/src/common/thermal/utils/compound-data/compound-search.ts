import { COMPOUND_SEARCH_LIMITS } from './constants/compound-search-limits.constants';
import { COMPOUND_SEARCH_RANK } from './constants/compound-search-rank.constants';
import { CompoundText } from './compound-text';
import { CompoundDataIndexEntry } from './types/dataset/compound-data-index-entry.type';
import { CompoundSearchDoc } from './types/search/compound-search-doc.type';
import { CompoundSearchHit } from './types/search/compound-search-hit.type';
import { CompoundSearchOptions } from './types/search/compound-search-options.type';
import { CompoundData } from './compound-data';

/**
 * In-memory ranked search over the compound-data catalogue index.
 */
export class CompoundSearch {
  private static docs: CompoundSearchDoc[] | undefined;

  /**
   * Ranked compound search. Does not ship the full catalogue — callers pass a short `limit`.
   */
  static search(q: string, options: CompoundSearchOptions = {}): CompoundSearchHit[] {
    const query = q.trim();
    if (!query) return [];
    const limit = Math.min(
      Math.max(options.limit ?? COMPOUND_SEARCH_LIMITS.default, COMPOUND_SEARCH_LIMITS.min),
      COMPOUND_SEARCH_LIMITS.max,
    );
    const scored: CompoundSearchHit[] = [];
    for (const doc of CompoundSearch.docsOrBuild()) {
      if (options.gasesOnly && !doc.gasesCapable) continue;
      const score = CompoundSearch.scoreDoc(doc, query);
      if (score <= 0) continue;
      scored.push(CompoundSearch.toHit(doc, score));
    }
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return scored.slice(0, limit);
  }

  /** Test helper: drop cached search docs after index fixtures change. */
  static resetCache(): void {
    CompoundSearch.docs = undefined;
  }

  private static docsOrBuild(): CompoundSearchDoc[] {
    CompoundSearch.docs ??= CompoundSearch.buildDocs();
    return CompoundSearch.docs;
  }

  private static isGasesCapable(meta: CompoundDataIndexEntry): boolean {
    const equations = meta.equations ?? {};
    const hasVis = (equations.viscosity ?? []).includes('gas');
    const hasLam = (equations.thermalConductivity ?? []).includes('gas');
    const hasCp =
      (equations.heatCapacity ?? []).includes('gas') ||
      Boolean(meta.nasa7?.length) ||
      Boolean(meta.nasa9?.length);
    return hasVis && hasLam && hasCp;
  }

  private static buildDocs(): CompoundSearchDoc[] {
    const index = CompoundData.loadIndex();
    const out: CompoundSearchDoc[] = [];
    for (const [id, meta] of Object.entries(index.compounds)) {
      const name = meta.name ?? meta.displayFormula;
      const synonyms = meta.synonyms ?? [];
      const formulaKeys = new Set<string>([
        ...CompoundText.formulaSearchKeys(meta.hill),
        ...CompoundText.formulaSearchKeys(meta.displayFormula),
        ...(meta.formula ? CompoundText.formulaSearchKeys(meta.formula) : []),
      ]);
      const compoundId = meta.compoundId ?? id;
      out.push({
        id: compoundId,
        compoundId,
        cas: meta.cas ?? null,
        otherCas: meta.otherCas ?? [],
        name,
        nameNorm: CompoundText.normalizeName(name),
        synonyms,
        synonymNorms: synonyms.map((synonym) => CompoundText.normalizeName(synonym)),
        hill: meta.hill,
        displayFormula: meta.displayFormula,
        formulaKeys: [...formulaKeys],
        class: meta.class,
        group: meta.group,
        gasesCapable: CompoundSearch.isGasesCapable(meta),
      });
    }
    return out;
  }

  private static casMatches(doc: CompoundSearchDoc, casQuery: string): 'exact' | 'substring' | null {
    const ids = [doc.compoundId, doc.id, doc.cas, ...doc.otherCas].filter(Boolean) as string[];
    for (const id of ids) {
      const norm = CompoundText.normalizeCas(id);
      if (norm === casQuery) return 'exact';
      if (norm.includes(casQuery) || id.toLowerCase().includes(casQuery.toLowerCase())) return 'substring';
    }
    return null;
  }

  private static scoreDoc(doc: CompoundSearchDoc, q: string): number {
    const nameQ = CompoundText.normalizeName(q);
    const formulaQ = CompoundText.normalizeFormula(q);
    const casQ = CompoundText.normalizeCas(q);
    let best = 0;

    const casHit = CompoundSearch.casMatches(doc, casQ);
    if (casHit === 'exact') best = Math.max(best, COMPOUND_SEARCH_RANK.exactCas);
    else if (casHit === 'substring') best = Math.max(best, COMPOUND_SEARCH_RANK.substringCas);

    if (formulaQ) {
      const formulaUpper = formulaQ.toUpperCase();
      for (const key of doc.formulaKeys) {
        if (key === formulaQ || key === formulaUpper) best = Math.max(best, COMPOUND_SEARCH_RANK.exactFormula);
        else if (key.startsWith(formulaQ) || key.startsWith(formulaUpper)) {
          best = Math.max(best, COMPOUND_SEARCH_RANK.prefixFormula);
        } else if (key.includes(formulaQ) || key.includes(formulaUpper)) {
          best = Math.max(best, COMPOUND_SEARCH_RANK.substringFormula);
        }
      }
    }

    if (nameQ) {
      if (doc.nameNorm === nameQ || doc.synonymNorms.includes(nameQ)) {
        best = Math.max(best, COMPOUND_SEARCH_RANK.exactName);
      } else if (doc.nameNorm.startsWith(nameQ) || doc.synonymNorms.some((s) => s.startsWith(nameQ))) {
        best = Math.max(best, COMPOUND_SEARCH_RANK.prefixName);
      } else if (doc.nameNorm.includes(nameQ) || doc.synonymNorms.some((s) => s.includes(nameQ))) {
        best = Math.max(best, COMPOUND_SEARCH_RANK.substringName);
      }
    }

    return best;
  }

  private static toHit(doc: CompoundSearchDoc, score: number): CompoundSearchHit {
    return {
      id: doc.compoundId,
      compoundId: doc.compoundId,
      cas: doc.cas,
      name: doc.name,
      formula: doc.hill,
      displayFormula: doc.displayFormula,
      ...(doc.synonyms.length ? { synonyms: doc.synonyms } : {}),
      class: doc.class,
      group: doc.group,
      score,
    };
  }
}
