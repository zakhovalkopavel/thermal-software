/**
 * Lakatos 1976 — Model Comparison:
 *   "Component viscosity effects" (Table 7, two-stage)
 *   vs
 *   "Direct temperature-viscosity equation determination" (Table 6, direct VTF)
 *
 * For every glass in the Lakatos validation dataset, both approaches are run
 * side-by-side and their results compared against:
 *   1. The paper's own regression output (T_model_C) — implementation check
 *   2. Each other — to quantify the systematic difference between approaches
 *
 * Approaches:
 *   COMPONENT EFFECTS (Table 7)  predictIsokomsLakatos → fitVtfThreePoints
 *     Each oxide's contribution to viscosity at three fixed levels is regressed
 *     independently, giving three isokom temperatures. VTF is then fitted
 *     analytically to those temperatures. (The approach used in production.)
 *
 *   DIRECT VTF (Table 6)  predictVtfDirectLakatos
 *     The VTF constants B, A, T₀ are regressed directly from composition in
 *     one step — no intermediate isokom temperatures.
 *     Equation: T = B_vtf / (log η [poise] + A_vtf) + T₀_vtf
 *
 * References:
 *   Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976). Tables 6 & 7.
 */

import {
  predictIsokomsLakatos,
  predictVtfDirectLakatos,
  fitVtfThreePoints,
  temperatureAtLogViscosity,
  calculateFixedPointsFromVtf,
} from '../../../../src/modules/refractory/utils/glass-viscosity-vtf.util';
import { LAKATOS_VALIDATION_GLASSES } from '../../../../src/modules/refractory/data/glass-viscosity-validation.data';
import type { VtfParameters } from '../../../../src/modules/refractory/interfaces/viscosity-parameters.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Component viscosity effects approach (Table 7): isokom regression → analytical VTF fit */
function runComponentEffects(comp: Record<string, number>): VtfParameters {
  const iso = predictIsokomsLakatos(comp);
  return fitVtfThreePoints(
    { T_celsius: iso.T_logEta1, logEtaPaS: 1 },
    { T_celsius: iso.T_logEta3, logEtaPaS: 3 },
    { T_celsius: iso.T_logEta5, logEtaPaS: 5 },
  );
}

/** Direct temperature-viscosity equation determination approach (Table 6): direct VTF regression */
function runDirectVtf(comp: Record<string, number>): VtfParameters {
  return predictVtfDirectLakatos(comp).vtf;
}

/** Isokom temperatures from a VTF triple at Lakatos poise levels (converted to Pa·s) */
function isokomsFromVtf(vtf: VtfParameters) {
  return {
    T_logEta1: temperatureAtLogViscosity(vtf, 1),
    T_logEta3: temperatureAtLogViscosity(vtf, 3),
    T_logEta5: temperatureAtLogViscosity(vtf, 5),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Lakatos — "Component viscosity effects" vs "Direct temperature-viscosity equation determination"', () => {

  // Side-by-side isokom comparison for every glass
  describe('Side-by-side isokom comparison', () => {
    it('prints comparison table to console for all validation glasses', () => {
      const rows: object[] = [];

      for (const glass of LAKATOS_VALIDATION_GLASSES) {
        const vtfComp   = runComponentEffects(glass.composition_wt_pct);
        const vtfDirect = runDirectVtf(glass.composition_wt_pct);
        const isoComp   = isokomsFromVtf(vtfComp);
        const isoDirect = isokomsFromVtf(vtfDirect);
        const [p1, p2, p3] = glass.isokoms;

        rows.push({
          id: glass.id,
          'Measured T@η1':    +p1.T_measured_C.toFixed(1),
          'Calc T@η1':    p1.T_model_C,
          'CompEff T@η1':  +isoComp.T_logEta1.toFixed(1),
          'DirectVTF T@η1':+isoDirect.T_logEta1.toFixed(1),
          'Measured T@η3':    +p2.T_measured_C.toFixed(1),
          'Calc T@η3':    p2.T_model_C,
          'CompEff T@η3':  +isoComp.T_logEta3.toFixed(1),
          'DirectVTF T@η3':+isoDirect.T_logEta3.toFixed(1),
          'Measured T@η5':    +p3.T_measured_C.toFixed(1),
          'Calc T@η5':    p3.T_model_C,
          'CompEff T@η5':  +isoComp.T_logEta5.toFixed(1),
          'DirectVTF T@η5':+isoDirect.T_logEta5.toFixed(1),
        });
      }

      console.table(rows);
      expect(rows.length).toBe(LAKATOS_VALIDATION_GLASSES.length);
    });
  });
});

