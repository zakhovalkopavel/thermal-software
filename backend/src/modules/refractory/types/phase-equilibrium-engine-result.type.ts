import type { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';
import type { PhaseEquilibriumCrystal } from './phase-equilibrium-crystal.type';

/** Compact result of one phase-equilibrium engine run on the matrix. */
export type PhaseEquilibriumEngineResult = {
  /** Liquid [% of the matrix] */
  liquidPercent: number;

  /** Solid [% of the matrix] */
  solidPercent: number;

  /** Liquid composition [wt%]; empty without liquid */
  liquidComposition: Record<string, number>;

  /** Solid composition [wt%]; empty without solid */
  solidComposition: Record<string, number>;

  /** Solidus of the matrix [°C] */
  solidus_C: number;

  /** Liquidus of the matrix [°C] */
  liquidus_C: number;

  /** Crystalline phases of the solid; `percent` is % of the matrix */
  crystals: PhaseEquilibriumCrystal[];

  /** Method that produced the result */
  method: PhaseEquilibriumMethod;

  /** Confidence of the method */
  confidence: ConfidenceLevel.HIGH | ConfidenceLevel.MEDIUM | ConfidenceLevel.LOW;

  /** Notes about assumptions and fallbacks */
  warnings: string[];

  /** `estimated` = anchored estimate; `assessed` = full CALPHAD assessment */
  status: 'estimated' | 'assessed';
};
