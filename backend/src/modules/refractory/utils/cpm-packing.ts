import { PACKING_DEFAULTS } from '../constants/packing-defaults.constants';

/**
 * Compressible Packing Model (de Larrard / Stovall): linear packing density
 * φ = min_i γ_i with γ_i = β_i / (y_i + Σ_j ξ_ij y_j).
 * Used by {@link PackingService.calculateCPM}.
 */
export class CpmPacking {
  /**
   * Loosening coefficient of finer class j on coarser class i (d_j < d_i).
   * → 0 for perfect fillers, → 1 when sizes are similar.
   */
  static loosening(d_i: number, d_j: number): number {
    if (d_i <= 0 || d_j <= 0 || d_j >= d_i) return 0;
    return 1 - Math.pow(1 - d_j / d_i, PACKING_DEFAULTS.CPM_LOOSENING_POWER);
  }

  /**
   * Wall coefficient of coarser class j on finer class i (d_j > d_i).
   * → 0 when j ≫ i, → 1 when sizes are similar.
   */
  static wallEffect(d_i: number, d_j: number): number {
    if (d_i <= 0 || d_j <= 0 || d_j <= d_i) return 0;
    return 1 - Math.pow(1 - d_i / d_j, PACKING_DEFAULTS.CPM_WALL_POWER);
  }

  /**
   * Classical interaction residual (loosening if j is finer, wall if coarser).
   */
  static interaction(d_i: number, d_j: number): number {
    if (d_i === d_j) return 0;
    return d_j < d_i ? CpmPacking.loosening(d_i, d_j) : CpmPacking.wallEffect(d_i, d_j);
  }

  /**
   * Stovall size-interaction ξ_ij ∈ [β_i, 1]: 1 when sizes match, → β_i when
   * the size ratio is large (asymmetric filling vs wall exponents).
   */
  static sizeInteraction(d_i: number, d_j: number, beta_i: number): number {
    if (d_i <= 0 || d_j <= 0) return 1;
    if (d_i === d_j) return 1;
    const ratio = Math.min(d_i, d_j) / Math.max(d_i, d_j);
    const exponent =
      d_j < d_i ? PACKING_DEFAULTS.CPM_FILLING_EXPONENT : PACKING_DEFAULTS.CPM_WALL_EXPONENT;
    return beta_i + (1 - beta_i) * Math.pow(ratio, exponent);
  }

  /**
   * Linear packing density: γ_i = β_i / (y_i + Σ_{j≠i} ξ_ij y_j), φ = min_i γ_i.
   * Result depends on volume fractions and diameters (not only the size set).
   */
  static solve(volumeFractions: number[], virtualPacking: number[], diameters_mm: number[]): number {
    const n = volumeFractions.length;
    if (n === 0) return 0;

    let phi = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const beta = virtualPacking[i];
      let denominator = volumeFractions[i];
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        denominator +=
          CpmPacking.sizeInteraction(diameters_mm[i], diameters_mm[j], beta) * volumeFractions[j];
      }
      if (denominator <= 1e-12) return 0;
      phi = Math.min(phi, beta / denominator);
    }

    return Number.isFinite(phi) ? Math.max(0, phi) : 0;
  }
}
