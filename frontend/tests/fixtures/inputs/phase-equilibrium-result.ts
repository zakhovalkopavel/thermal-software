import type { PhaseEquilibriumResult } from '../../../src/modules/materials/sections/mineral-compositions/types/phase-equilibrium-result.type';

/** Phase-equilibrium response of a low-cement alumina castable at 1400 °C. */
export const PHASE_EQUILIBRIUM_RESULT: PhaseEquilibriumResult = {
  atTemperature: {
    liquid: {
      percent: 22,
      mass: 22,
      composition: { SiO2: 61.2, Al2O3: 18.4, CaO: 20.4 },
      parts: [
        {
          source: 'matrix',
          name: 'Liquid (matrix)',
          percent: 22,
          mass: 22,
          composition: { SiO2: 61.2, Al2O3: 18.4, CaO: 20.4 },
          viscosity: { model: 'IIDA', confidence: 'LOW', logViscosity: 1.5, viscosity_Pas: 31.62 },
        },
      ],
    },
    glass: { percent: 0, mass: 0, composition: {}, parts: [] },
    crystals: [
      { phaseId: 'corundum', phase: 'Corundum', formula: 'Al2O3', percent: 50, mass: 50 },
      { phaseId: 'mullite', phase: 'Mullite', formula: '3Al2O3·2SiO2', percent: 28, mass: 28 },
    ],
  },
  afterCooling: { glass: { percent: 22, mass: 22, composition: {} }, crystals: [] },
  fractions: [{ materialId: 'alumina_tabular', d50_mm: 4.5, massFraction: 0.35, penetrationDepth_mm: 0.1, reactedPercent: 5 }],
  matrix: { percent: 40, composition: { SiO2: 30, Al2O3: 60, CaO: 10 }, solidus_C: 1345, liquidus_C: 1810 },
  metadata: { temperature: 1400, holdTime_hours: 2, totalMass: 100, reactedPercent: 40, calculatedAt: '2026-11-27T00:00:00.000Z' },
  warnings: [],
};
