/**
 * Lakatos 1976 direct VTF (Table 6) and composition validity.
 * Stateless — no DI.
 */
import type { VtfParameters } from '../types';
import {
  LAKATOS_1976_COEFFICIENTS,
  LAKATOS_1976_DIRECT_VTF_COEFFICIENTS,
} from '../data/viscosity-parameters.data';

export class GlassViscosityLakatos {
  /**
   * Predict VTF parameters directly from composition using Lakatos 1976 Table 6.
   *
   * This is an alternative to the two-stage approach (predictIsokomsLakatos → fitVtfThreePoints).
   * Instead of regressing isokom temperatures and then fitting VTF, this regresses
   * the VTF constants B, A, T₀ directly from composition in a single step.
   *
   * IMPORTANT — Lakatos Table 6 uses a non-standard equation form:
   *   T [°C] = B_vtf / (log η [poise] + A_vtf) + T0_vtf
   *
   * This function converts the result to the standard form used everywhere else:
   *   log₁₀(η [Pa·s]) = A_std + B_std / (T [°C] − T0_std)
   *
   * Conversion (poise → Pa·s, and rearranging):
   *   log η [poise] = B_vtf / (T − T0_vtf) − A_vtf
   *   log η [Pa·s]  = log η [poise] − 1
   *                 = B_vtf / (T − T0_vtf) − A_vtf − 1
   *   → A_std = −(A_vtf + 1)
   *   → B_std = B_vtf
   *   → T0_std = T0_vtf
   *
   * Input:  normalised wt% composition (same as predictIsokomsLakatos)
   * Output: VtfParameters in standard form (log Pa·s = A + B / (T − T₀))
   *         + warnings about composition range
   */
  static predictVtfDirectLakatos(
    comp: Record<string, number>,
  ): { vtf: VtfParameters; warnings: string[] } {
    const SiO2 = comp['SiO2'] ?? 0;
    if (SiO2 <= 0) {
      throw new Error('Lakatos direct VTF model requires SiO₂ > 0 wt%');
    }

    // Convert to parts per 100 parts SiO₂ (same encoding as Table 7)
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
    const xB2O3_sq = xB2O3 * xB2O3;

    const d = LAKATOS_1976_DIRECT_VTF_COEFFICIENTS;

    type DirectCoeffRow = { readonly constant: number; readonly Al2O3: number; readonly Na2O: number; readonly K2O: number; readonly Li2O: number; readonly CaO: number; readonly MgO: number; readonly BaO: number; readonly ZnO: number; readonly PbO: number; readonly B2O3: number; readonly B2O3_sq: number };

    const evalParam = (p: DirectCoeffRow): number =>
      p.constant
      + p.Al2O3   * xAl2O3
      + p.Na2O    * xNa2O
      + p.K2O     * xK2O
      + p.Li2O    * xLi2O
      + p.CaO     * xCaO
      + p.MgO     * xMgO
      + p.BaO     * xBaO
      + p.ZnO     * xZnO
      + p.PbO     * xPbO
      + p.B2O3    * xB2O3
      + p.B2O3_sq * xB2O3_sq;

    // Raw Lakatos Table 6 constants (poise-scale equation)
    const B_vtf  = evalParam(d.B as unknown as DirectCoeffRow);
    const A_vtf  = evalParam(d.A as unknown as DirectCoeffRow);
    const T0_vtf = evalParam(d.T0 as unknown as DirectCoeffRow);

    // Convert to standard VTF form: log η [Pa·s] = A_std + B_std / (T − T0_std)
    // where A_std = −(A_vtf + 1),  B_std = B_vtf,  T0_std = T0_vtf
    const vtf: VtfParameters = {
      A:  -(A_vtf + 1),
      B:  B_vtf,
      T0: T0_vtf,
    };

    // Reuse the same validity warnings as Table 7
    const warnings: string[] = [];
    const b = LAKATOS_1976_COEFFICIENTS.validityBounds;

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
    checkBound('MgO',   comp['MgO']   ?? 0, b.MgO.min,   b.MgO.max);
    checkBound('BaO',   comp['BaO']   ?? 0, b.BaO.min,   b.BaO.max);
    checkBound('ZnO',   comp['ZnO']   ?? 0, b.ZnO.min,   b.ZnO.max);
    checkBound('PbO',   comp['PbO']   ?? 0, b.PbO.min,   b.PbO.max);
    checkBound('B₂O₃',  comp['B2O3']  ?? 0, b.B2O3.min,  b.B2O3.max);

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

    return { vtf, warnings };
  }

  /**
   * Determine whether a normalised wt% composition falls within the Lakatos 1976
   * training range, and collect soft-warning messages for boundary components.
   *
   * Hard failures (return valid=false):
   *   - SiO₂ outside [50, 77.5] wt%
   *   - Na₂O < 10 wt%  (required network modifier in the training set)
   *   - > 5 wt% of components not in the Lakatos component list
   *
   * Soft warnings (return valid=true but populate warnings[]):
   *   - Na₂O slightly above 17 wt%
   *   - Al₂O₃, K₂O, B₂O₃ outside their trained range
   */
  static checkLakatosValidity(
    comp: Record<string, number>,
  ): { valid: boolean; reason?: string; warnings: string[] } {
    const SiO2 = comp['SiO2'] ?? 0;
    const Na2O = comp['Na2O'] ?? 0;
    const b    = LAKATOS_1976_COEFFICIENTS.validityBounds;
    const warnings: string[] = [];

    if (SiO2 < b.SiO2.min || SiO2 > b.SiO2.max + 0.5) {
      return {
        valid: false,
        reason: `SiO₂ = ${SiO2.toFixed(1)} wt% outside Lakatos range [${b.SiO2.min}, ${b.SiO2.max}]`,
        warnings,
      };
    }
    if (Na2O < b.Na2O.min) {
      return {
        valid: false,
        reason: `Na₂O = ${Na2O.toFixed(1)} wt% < Lakatos minimum ${b.Na2O.min} wt%`,
        warnings,
      };
    }
    if (Na2O > b.Na2O.max) {
      warnings.push(`Na₂O = ${Na2O.toFixed(1)} wt% slightly above Lakatos max (${b.Na2O.max} wt%)`);
    }

    const lakatosSet = new Set([
      'SiO2', 'Al2O3', 'Na2O', 'K2O', 'Li2O', 'CaO', 'MgO', 'BaO', 'ZnO', 'PbO', 'B2O3',
    ]);
    let outsideWt = 0;
    for (const [k, v] of Object.entries(comp)) {
      if (!lakatosSet.has(k) && v > 0) outsideWt += v;
    }
    if (outsideWt > 5) {
      return {
        valid: false,
        reason: `${outsideWt.toFixed(1)} wt% of composition outside Lakatos component list — use Fluegel 2007`,
        warnings,
      };
    }

    const checkSoft = (name: string, key: string, lo: number, hi: number) => {
      const v = comp[key] ?? 0;
      if (v < lo || v > hi) {
        warnings.push(`${name} = ${v.toFixed(2)} wt% outside Lakatos training range [${lo}, ${hi}]`);
      }
    };
    checkSoft('Al₂O₃', 'Al2O3', b.Al2O3.min, b.Al2O3.max);
    checkSoft('K₂O',   'K2O',   b.K2O.min,   b.K2O.max);
    checkSoft('B₂O₃',  'B2O3',  b.B2O3.min,  b.B2O3.max);

    return { valid: true, warnings };
  }

}
