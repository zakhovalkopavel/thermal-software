/**
 * Solid-phase thermochemistry: CompoundValueBuilder.forSolid + CompoundPropertyResolver.
 *
 * Verifies:
 *   - forSolid builds Al2O3 without gas viscosity / thermal conductivity
 *   - condensed NASA keys are chosen (corundum, not liquid or gas)
 *   - H, S, G are finite with NASA keys and through the Cp-integral path (no NASA)
 *   - the Cp-integral path agrees with NASA for electrocorundum
 *   - missing transport / thermo data gives NaN with a message
 */

import { CompoundValueBuilder } from '../../../../../src/common/thermal/utils/compound-data/compound-value-builder';
import { CompoundPropertyResolver } from '../../../../../src/common/thermal/utils/compound-properties/compound-property-resolver';
import { CompoundValue } from '../../../../../src/common/thermal/types/compound-value.type';

const T_HIGH_K = 1500;
const T_REF_K = 298.15;
/** Cp-integral vs NASA relative tolerance for G at 1500 K */
const GIBBS_REL_TOL = 5e-3;

function withoutNasa(compound: CompoundValue): CompoundValue {
  const { nasa7Key, nasa9Key, ...rest } = compound;
  void nasa7Key;
  void nasa9Key;
  return rest;
}

describe('solid compound thermochemistry (Al2O3)', () => {
  const solid = CompoundValueBuilder.forSolid('aluminium_oxide');
  const corundum = CompoundValueBuilder.forSolid('electrocorundum');

  it('builds a CompoundValue without viscosity or thermal conductivity', () => {
    expect(solid.viscosity).toBeUndefined();
    expect(solid.thermalConductivity).toBeUndefined();
    expect(solid.Mr).toBeGreaterThan(0.1);
    expect(solid.enthalpyFormation298).toBeCloseTo(-1675700, 0);
    expect(solid.entropy298).toBeCloseTo(50.92, 2);
  });

  it('picks condensed solid NASA keys (not liquid or gas)', () => {
    expect(solid.nasa9Key).toBe('AL2O3(a)');
    expect(solid.nasa7Key).toBe('AL2O3(a)');
  });

  it('gives finite gibbsEnergy at 1500 K through NASA', () => {
    const G = new CompoundPropertyResolver(solid).gibbsEnergy(T_HIGH_K);
    expect(Number.isFinite(G)).toBe(true);
    expect(G).toBeLessThan(0);
  });

  it('gives finite H, S, G at 1500 K without NASA (Cp-integral path)', () => {
    const resolver = new CompoundPropertyResolver(withoutNasa(solid));
    const H = resolver.enthalpy(T_HIGH_K);
    const S = resolver.entropy(T_HIGH_K);
    const G = resolver.gibbsEnergy(T_HIGH_K);
    expect(Number.isFinite(H)).toBe(true);
    expect(Number.isFinite(S)).toBe(true);
    expect(G).toBeCloseTo(H - T_HIGH_K * S, 6);
  });

  it('returns ΔHf298 and S298 at the reference temperature', () => {
    const resolver = new CompoundPropertyResolver(withoutNasa(corundum));
    expect(resolver.enthalpy(T_REF_K)).toBeCloseTo(corundum.enthalpyFormation298 as number, 6);
    expect(resolver.entropy(T_REF_K)).toBeCloseTo(corundum.entropy298 as number, 6);
  });

  it('Cp-integral G matches NASA G for electrocorundum', () => {
    const nasaG = new CompoundPropertyResolver(corundum).gibbsEnergy(T_HIGH_K);
    const cpG = new CompoundPropertyResolver(withoutNasa(corundum)).gibbsEnergy(T_HIGH_K);
    expect(Math.abs(cpG - nasaG) / Math.abs(nasaG)).toBeLessThan(GIBBS_REL_TOL);
  });

  it('returns NaN with a message for viscosity and conductivity of a solid', () => {
    const resolver = new CompoundPropertyResolver(solid);
    const mu = resolver.viscosityResult(T_HIGH_K);
    const lambda = resolver.thermalConductivityResult(T_HIGH_K);
    expect(Number.isNaN(mu.value)).toBe(true);
    expect(mu.validity.message).toBe('No viscosity/conductivity data');
    expect(Number.isNaN(lambda.value)).toBe(true);
    expect(lambda.validity.message).toBe('No viscosity/conductivity data');
  });

  it('returns NaN for G without NASA and without entropy298', () => {
    const { entropy298, ...noEntropy } = withoutNasa(solid);
    void entropy298;
    const result = new CompoundPropertyResolver(noEntropy).gibbsEnergyResult(T_HIGH_K);
    expect(Number.isNaN(result.value)).toBe(true);
    expect(result.validity.message).toContain('Cp-integral');
  });

  it('forSolid throws for an unknown id', () => {
    expect(() => CompoundValueBuilder.forSolid('no_such_compound_id')).toThrow('Unknown compound id');
  });
});
