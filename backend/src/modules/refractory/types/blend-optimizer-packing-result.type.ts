/**
 * Intermediate packing result used inside blend optimizer.
 * Same export name as the packing calculator type, but a different shape —
 * import from this file path only (not re-exported from types/index).
 */
export type PackingResult = {
  /** Packing fraction (0-1) */
  packingFraction_phi: number;

  /** Packing model used */
  model: string;

  /** Compaction parameters applied */
  compactionParameters?: {
    pressure_MPa: number;
    index: number;
  };
};
