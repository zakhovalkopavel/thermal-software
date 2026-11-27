import { describe, expect, it } from 'vitest';
import type { ChemicalRequest } from '../types/chemical-request.type';
import { toPhaseEquilibriumInput } from './phase-equilibrium-request.mapper';

const REQUEST: ChemicalRequest = {
  fractions: [{ materialId: 'alumina_tabular', d50_mm: 4.5, massFraction: 1 }],
  holdTime_hours: 2,
  algorithmMode: 'calphad',
  legacyVariant: 'eutectic',
  composition: { Al2O3: 100 },
  temperature: 1400,
  totalMass: 100,
  porosity: 0.2,
  grid: [1300],
};

describe('mineral-compositions › phase-equilibrium-request', () => {
  it('takes the temperature of the call and omits legacyVariant for calphad', () => {
    expect(toPhaseEquilibriumInput(REQUEST, 1300)).toEqual({
      fractions: REQUEST.fractions,
      temperature: 1300,
      holdTime_hours: 2,
      totalMass: 100,
      algorithmMode: 'calphad',
    });
  });

  it('sends legacyVariant for legacy and compare', () => {
    expect(toPhaseEquilibriumInput({ ...REQUEST, algorithmMode: 'compare' }, 1400).legacyVariant).toBe('eutectic');
    expect(toPhaseEquilibriumInput({ ...REQUEST, algorithmMode: 'legacy', legacyVariant: 'diagram' }, 1400).legacyVariant).toBe('diagram');
  });

  it('returns an empty request while nothing was run', () => {
    expect(toPhaseEquilibriumInput(null, 0)).toMatchObject({ fractions: [], temperature: 0 });
  });
});
