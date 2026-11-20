import type { FixedPointSpans } from './fixed-point-spans.type';

/** ASTM C965-96 fixed points. */
export type FixedPoints = {
  /** Melting point: η = 1 Pa·s */
  meltingPoint_C: number;

  /** Flow point: η = 10^4 Pa·s */
  flowPoint_C: number;

  /** Working point: η = 10^3 Pa·s */
  workingPoint_C: number;

  /** Softening point: η = 10^6.6 Pa·s (ASTM C338) */
  softeningPoint_C: number;

  /** Annealing point: η = 10^12 Pa·s (ASTM C336) */
  annealingPoint_C: number;

  /** Strain point: η = 10^13.5 Pa·s (ASTM C336) */
  strainPoint_C: number;

  /** Temperature spans between key points */
  spans?: FixedPointSpans;
};
