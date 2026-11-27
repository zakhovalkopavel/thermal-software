/**
 * Liquid end-member thermochemistry: CompoundLiquidValue + CompoundPropertyResolver.
 */

import { CompoundLiquidValue } from '../../../../../src/common/thermal/utils/compound-data/compound-liquid-value';
import { CompoundPropertyResolver } from '../../../../../src/common/thermal/utils/compound-properties/compound-property-resolver';

const T_HIGH_K = 1800;

describe('liquid compound thermochemistry', () => {
  it('builds CaO(L) and returns finite G at 1800 K', () => {
    const liquid = CompoundLiquidValue.fromId('lime', 'CaO(L)');
    expect(liquid.nasa9Key).toBe('CaO(L)');
    expect(liquid.viscosity).toBeUndefined();
    const G = new CompoundPropertyResolver(liquid).gibbsEnergy(T_HIGH_K);
    expect(Number.isFinite(G)).toBe(true);
    expect(G).toBeLessThan(0);
  });

  it('builds SiO2(L) and Al2O3(L)', () => {
    expect(CompoundLiquidValue.fromId('silica', 'SiO2(L)').nasa9Key).toBe('SiO2(L)');
    expect(CompoundLiquidValue.fromId('aluminium_oxide', 'AL2O3(L)').nasa9Key).toBe('AL2O3(L)');
  });

  it('throws when no liquid NASA key exists', () => {
    expect(() => CompoundLiquidValue.fromId('gehlenite')).toThrow(/no liquid NASA key/);
  });
});
