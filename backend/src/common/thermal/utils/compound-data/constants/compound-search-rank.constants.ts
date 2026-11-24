/** Ranking scores for compound catalogue search (higher is better). */
export const COMPOUND_SEARCH_RANK = {
  exactCas: 1000,
  exactFormula: 900,
  exactName: 800,
  prefixName: 600,
  prefixFormula: 550,
  substringName: 400,
  substringFormula: 350,
  substringCas: 300,
} as const;
