import type { LegacyVariant } from '../enums/legacy-variant.enum';

/** CALPHAD vs legacy comparison (`algorithmMode = compare`). */
export type PhaseEquilibriumComparison = {
  /** Legacy variant that was compared */
  legacyVariant: LegacyVariant;

  /** CALPHAD liquid [% of the matrix] */
  calphadLiquidPercent: number;

  /** Legacy liquid [% of the matrix]; null when the legacy side was skipped */
  legacyLiquidPercent: number | null;

  /** Legacy − CALPHAD liquid [percentage points]; null when the legacy side was skipped */
  liquidPercentDelta: number | null;

  /** Crystal phase ids of the CALPHAD result */
  calphadPhaseIds: string[];

  /** Crystal phase ids of the legacy result */
  legacyPhaseIds: string[];

  /** Phase ids in both results */
  commonPhaseIds: string[];

  /** Why the legacy side was skipped */
  legacyUnavailableReason?: string;
};
