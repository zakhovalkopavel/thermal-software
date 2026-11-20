/**
 * Lakatos 1976 isokom regression (Table 7).
 * Stateless — no DI.
 */
import type { LakatosIsokoms } from '../types';
import { LAKATOS_1976_COEFFICIENTS } from '../data/viscosity-parameters.data';

export class GlassViscosityLakatosIsokoms {
  /**
   * Predict three isokom temperatures using the Lakatos 1976 regression.
   *
   * Input:  normalised wt% composition
   * Output: T in °C at log η = 1, 3, 5 Pa·s
   *         (Lakatos paper uses poise levels 2, 4, 6; subtract 1 to convert to Pa·s)
   *
   * Algorithm:
   *   1. Convert wt% to parts-per-100-SiO₂  (x_i = wt_i / wt_SiO₂ × 100)
   *   2. Apply linear regression from LAKATOS_1976_COEFFICIENTS with quadratic B₂O₃ term
   *
   * Validity range: SiO₂ 60–77 wt%, Na₂O 10–17 wt%, 11 components.
   */
  static predictIsokomsLakatos(
    comp: Record<string, number>,
  ): LakatosIsokoms {
    const SiO2 = comp['SiO2'] ?? 0;
    if (SiO2 <= 0) {
      throw new Error('Lakatos model requires SiO₂ > 0 wt%');
    }

    // Convert to parts per 100 parts SiO₂
    const x = (key: string) => ((comp[key] ?? 0) / SiO2) * 100;

    const xAl2O3 = x('Al2O3');
    const xNa2O  = x('Na2O');
    const xK2O   = x('K2O');
    const xLi2O  = x('Li2O');
    const xCaO   = x('CaO');
    const xMgO   = x('MgO');
    const xBaO   = x('BaO');
    const xZnO   = x('ZnO');
    const xPbO   = x('PbO');
    const xB2O3  = x('B2O3');

    const c  = LAKATOS_1976_COEFFICIENTS;
    const co = c.components;

    const evalLevel = (v: 'v2' | 'v4' | 'v6'): number =>
      c.constant[v]
      + co.Al2O3[v] * xAl2O3
      + co.Na2O[v]  * xNa2O
      + co.K2O[v]   * xK2O
      + co.Li2O[v]  * xLi2O
      + co.CaO[v]   * xCaO
      + co.MgO[v]   * xMgO
      + co.BaO[v]   * xBaO
      + co.ZnO[v]   * xZnO
      + co.PbO[v]   * xPbO
      + co.B2O3[v]  * xB2O3
      + c.B2O3_quadratic[v] * xB2O3 * xB2O3;

    const T_v2 = evalLevel('v2');
    const T_v4 = evalLevel('v4');
    const T_v6 = evalLevel('v6');

    // Validity warnings
    const warnings: string[] = [];
    const b = c.validityBounds;

    const checkBound = (name: string, val: number, lo: number, hi: number) => {
      if (val < lo || val > hi) {
        warnings.push(
          `${name} = ${val.toFixed(2)} wt% is outside Lakatos training range [${lo}, ${hi}]`,
        );
      }
    };

    checkBound('SiO₂',  SiO2,               b.SiO2.min,  b.SiO2.max);
    checkBound('Na₂O',  comp['Na2O']  ?? 0, b.Na2O.min,  b.Na2O.max);
    checkBound('Al₂O₃', comp['Al2O3'] ?? 0, b.Al2O3.min, b.Al2O3.max);
    checkBound('K₂O',   comp['K2O']   ?? 0, b.K2O.min,   b.K2O.max);
    checkBound('Li₂O',  comp['Li2O']  ?? 0, b.Li2O.min,  b.Li2O.max);
    if ((comp['CaO'] ?? 0) > 0) {
      checkBound('CaO', comp['CaO'] ?? 0, b.CaO.min, b.CaO.max);
    }
    checkBound('MgO',  comp['MgO']  ?? 0, b.MgO.min,  b.MgO.max);
    checkBound('BaO',  comp['BaO']  ?? 0, b.BaO.min,  b.BaO.max);
    checkBound('ZnO',  comp['ZnO']  ?? 0, b.ZnO.min,  b.ZnO.max);
    checkBound('PbO',  comp['PbO']  ?? 0, b.PbO.min,  b.PbO.max);
    checkBound('B₂O₃', comp['B2O3'] ?? 0, b.B2O3.min, b.B2O3.max);

    // Warn about non-Lakatos components present at > 2 wt% total
    const lakatosSet = new Set([
      'SiO2','Al2O3','Na2O','K2O','Li2O','CaO','MgO','BaO','ZnO','PbO','B2O3',
    ]);
    let ignoredWt = 0;
    const ignoredNames: string[] = [];
    for (const [k, v] of Object.entries(comp)) {
      if (!lakatosSet.has(k) && v > 0) {
        ignoredWt += v;
        ignoredNames.push(k);
      }
    }
    if (ignoredNames.length > 0 && ignoredWt > 2) {
      warnings.push(
        `Components not modelled by Lakatos: ${ignoredNames.join(', ')} ` +
        `(${ignoredWt.toFixed(1)} wt% total). Fluegel 2007 may give better coverage.`,
      );
    }

    return { T_logEta1: T_v2, T_logEta3: T_v4, T_logEta5: T_v6, warnings };
  }

}
