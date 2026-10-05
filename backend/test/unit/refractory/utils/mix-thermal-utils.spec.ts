import { toFiredPhases } from '../../../../src/modules/refractory/utils/fired-phases.util';
import { phaseSpecificHeat } from '../../../../src/modules/refractory/utils/phase-specific-heat.util';
import { maxwellEuckenConductivity } from '../../../../src/modules/refractory/utils/maxwell-eucken-conductivity.util';

describe('toFiredPhases', () => {
  it('removes loss on ignition and small metal impurities, keeps non-oxides, rescales to 100', () => {
    const { phases_wt, lossOnIgnition_wt } = toFiredPhases({ TiC: 98.5, TiO2: 0.8, C: 0.4, Fe: 0.3, H2O: 2 });
    expect(lossOnIgnition_wt).toBe(2);
    expect(phases_wt).not.toHaveProperty('Fe');
    expect(phases_wt).not.toHaveProperty('H2O');
    expect(phases_wt['TiC']).toBeCloseTo((100 * 98.5) / 99.7, 9);
  });

  it('returns no phases when everything is lost on ignition', () => {
    expect(toFiredPhases({ H2O: 50, CO2: 50 }).phases_wt).toEqual({});
  });
});

describe('phaseSpecificHeat', () => {
  it.each([
    ['Al2O3', 298.15, 775],
    ['SiC', 298.15, 670],
    ['MgO', 298.15, 925],
    ['Si3N4', 298.15, 665],
  ])('%s at %d K ≈ %d J/(kg·K)', (phase, T, expected) => {
    expect(phaseSpecificHeat(phase, T)).toBeCloseTo(expected, -1);
  });

  it('follows the SiO2 polymorphs (α-quartz → β-quartz → β-cristobalite)', () => {
    expect(phaseSpecificHeat('SiO2', 700)).toBeDefined();
    expect(phaseSpecificHeat('SiO2', 1000)).toBeDefined();
    expect(phaseSpecificHeat('SiO2', 1500)).toBeDefined();
  });

  it('clamps outside the tabulated range', () => {
    expect(phaseSpecificHeat('Fe2O3', 250)).toBeCloseTo(phaseSpecificHeat('Fe2O3', 300)!, 9);
    expect(phaseSpecificHeat('B2O3', 1500)).toBeCloseTo(phaseSpecificHeat('B2O3', 723)!, 9);
  });

  it('returns undefined for phases without NASA-9 data', () => {
    expect(phaseSpecificHeat('Cr3C2', 500)).toBeUndefined();
  });
});

describe('maxwellEuckenConductivity', () => {
  it('P = 0 → solid; equal phases → unchanged', () => {
    expect(maxwellEuckenConductivity(30, 0.03, 0)).toBeCloseTo(30, 12);
    expect(maxwellEuckenConductivity(1, 1, 0.4)).toBeCloseTo(1, 12);
  });

  it('pores in a good conductor: λ_eff → λ_s · 2(1 − P)/(2 + P)', () => {
    expect(maxwellEuckenConductivity(100, 1e-9, 0.3) / 100).toBeCloseTo((2 * 0.7) / 2.3, 6);
  });
});
