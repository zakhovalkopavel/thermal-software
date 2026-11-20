/**
 * Fluegel 2007 glass viscosity isokom polynomial regression.
 * Stateless — no DI.
 */
import type { FluegelIsokoms } from '../types';
import {
  FLUEGEL_2007_T1_5,
  FLUEGEL_2007_T6_6,
  FLUEGEL_2007_T12,
  FLUEGEL_2007_BOUNDS,
} from '../data/viscosity-parameters.data';
import { GlassComposition } from './glass-composition';

export class GlassViscosityFluegel {
  /**
   * Predict three isokom temperatures using the Fluegel 2007 polynomial regression.
   *
   * Input:  normalised wt% composition
   * Output: T in °C at log η = 1.5, 6.6, 12.0 Pa·s
   *
   * Algorithm:
   *   1. Convert wt% → mol% (full-denominator including SiO₂)
   *   2. Apply the three regression tables (Tables 4, 5, 6 of the paper)
   *      using linear + polynomial + cross terms
   *
   * Validity: SiO₂ 42.6–89.2 mol%, ~50 components, σ = 9–17°C.
   */
  static predictIsokomsFluegel(
    comp: Record<string, number>,
  ): FluegelIsokoms {
    const molPct = GlassComposition.wtPctToMolPct(comp);
    const C = (k: string) => molPct[k] ?? 0;

    type FlugelTable =
      | typeof FLUEGEL_2007_T1_5
      | typeof FLUEGEL_2007_T6_6
      | typeof FLUEGEL_2007_T12;

    const evalTable = (tbl: FlugelTable): number => {
      let T = tbl.constant;

      for (const [k, coeff] of Object.entries(tbl.linear)) {
        T += coeff * C(k);
      }
      for (const [k, coeff] of Object.entries(tbl.quadratic)) {
        T += coeff * C(k) ** 2;
      }
      for (const [k, coeff] of Object.entries(tbl.cubic)) {
        T += coeff * C(k) ** 3;
      }
      for (const [key, coeff] of Object.entries(tbl.cross)) {
        const [a, b] = key.split('*');
        T += coeff * C(a) * C(b);
      }
      for (const [key, coeff] of Object.entries(tbl.cross3)) {
        const [a, b, cc] = key.split('*');
        T += coeff * C(a) * C(b) * C(cc);
      }

      return T;
    };

    const T_1_5 = evalTable(FLUEGEL_2007_T1_5);
    const T_6_6 = evalTable(FLUEGEL_2007_T6_6);
    const T_12  = evalTable(FLUEGEL_2007_T12);

    // Validity warnings
    const warnings: string[] = [];
    const SiO2Mol = molPct['SiO2'] ?? 0;

    const LOG_ETA_LABELS = ['log η 1.5', 'log η 6.6', 'log η 12'] as const;
    for (let i = 0; i < 3; i++) {
      const min = FLUEGEL_2007_BOUNDS.SiO2_min[i];
      const max = FLUEGEL_2007_BOUNDS.SiO2_max[i];
      if (SiO2Mol < min) {
        warnings.push(
          `SiO₂ = ${SiO2Mol.toFixed(1)} mol% < Fluegel minimum at ${LOG_ETA_LABELS[i]} (${min} mol%)`,
        );
      }
      if (SiO2Mol > max) {
        warnings.push(
          `SiO₂ = ${SiO2Mol.toFixed(1)} mol% > Fluegel maximum at ${LOG_ETA_LABELS[i]} (${max} mol%)`,
        );
      }
    }

    const boundKeys = Object.keys(FLUEGEL_2007_BOUNDS).filter(
      k => k !== 'SiO2_min' && k !== 'SiO2_max',
    ) as (keyof typeof FLUEGEL_2007_BOUNDS)[];

    for (const k of boundKeys) {
      const maxArr = FLUEGEL_2007_BOUNDS[k] as unknown as number[];
      const maxAt6_6 = maxArr[1];
      const val = molPct[k as string] ?? 0;
      if (val > maxAt6_6 && maxAt6_6 > 0) {
        warnings.push(
          `${k} = ${val.toFixed(2)} mol% exceeds Fluegel max at log η 6.6 (${maxAt6_6} mol%)`,
        );
      }
    }

    return { T_logEta1_5: T_1_5, T_logEta6_6: T_6_6, T_logEta12: T_12, warnings };
  }

}
