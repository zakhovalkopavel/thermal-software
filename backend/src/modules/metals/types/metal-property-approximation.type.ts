/**
 * Short property approximation on an alloy record.
 * Compound-equation style branches (type + vars + min/max); no def/ref.
 */
export type MetalPropertyApproximation = {
  /**
   * Switch temperature (K), integer.
   * Ac3 for quadratic/linear properties; Curie Tc for indenCp (specificHeat).
   */
  Tswitch: number;
  low:
    | {
        type: 'quadratic' | 'linear';
        vars: {
          a: number;
          b: number;
          c?: number;
        };
        min: number;
        max: number;
      }
    | {
        type: 'indenCp';
        vars: {
          a: number;
          b: number;
          c: number;
          /** Amplitude below Tc (LRO) */
          Al: number;
          /** Amplitude above Tc (SRO) */
          Ah: number;
          Tc: number;
        };
        min: number;
        max: number;
      };
  /** Linear branch when the series extends past Tswitch (non-inden properties) */
  high?: {
    type: 'linear';
    vars: {
      a: number;
      b: number;
    };
    min: number;
    max: number;
  };
  meanRelPct: number | null;
  maxRelPct: number | null;
};
