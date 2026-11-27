import type { LegacyVariant } from './legacy-variant.type';

export type PhaseEquilibriumComparison = {
  legacyVariant: LegacyVariant;
  /** % of the matrix */
  calphadLiquidPercent: number;
  /** % of the matrix; null when the legacy side was skipped */
  legacyLiquidPercent: number | null;
  /** Legacy − CALPHAD, percentage points; null when the legacy side was skipped */
  liquidPercentDelta: number | null;
  calphadPhaseIds: string[];
  legacyPhaseIds: string[];
  commonPhaseIds: string[];
  legacyUnavailableReason?: string;
};
