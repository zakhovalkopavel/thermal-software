import type { ThermalDraft } from '../types/thermal-draft.type';

/** Swagger example: steel cylinder r = 50 mm quenched from 850 °C into a 20 °C medium. */
export const THERMAL_DEFAULTS: ThermalDraft = {
  bcType: 'BC_III',
  geometry: 'cylinder',
  initialProfile: 'uniform',
  values: {
    Tc: 20,
    T0: 850,
    tau: 60,
    alpha: 1200,
    lambda: 45,
    thermalDiffusivity: 1.2e-5,
    T0Ctr: null,
    T0Surf: null,
    seriesTerms: null,
    bi1: null,
    bi2: null,
    bi3: null,
    biLateral: null,
    biEnd: null,
  },
  shape: { radius: 0.05, innerRadius: null, outerRadius: null, halfX: null, halfY: null, halfZ: null },
};
