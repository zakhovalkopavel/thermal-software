/**
 * Donor link for a sparse property (stored only under alloy `provenance.donors`).
 * Eval resolves the linked material’s knots × optional scale — never copied into `points`.
 */
export type MetalPropertyDonor = {
  materialId: string;
  mode: 'scaled-series' | 'extend-outside-range' | 'full-series' | string;
  why: string;
  /** ElMD (mod_petti) between Fe-balanced compositions — RefKey.Hargreaves2020ElMD. */
  compositionDistance: number;
  /** e.g. `ElMD-mod_petti` */
  distanceMetric?: string;
  scale?: number;
  scaleQuality?: string;
  error?: {
    rmse: number;
    maxRelPct: number | null;
  };
};
