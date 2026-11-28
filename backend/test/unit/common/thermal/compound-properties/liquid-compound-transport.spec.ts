/**
 * Liquid transport CompoundValue: μ, λ, ρ, Cp for HTC / fluid APIs.
 */

import { CompoundLiquidBounds } from '../../../../../src/common/thermal/utils/compound-data/compound-liquid-bounds';
import { CompoundLiquidValue } from '../../../../../src/common/thermal/utils/compound-data/compound-liquid-value';
import { CompoundPropertyResolver } from '../../../../../src/common/thermal/utils/compound-properties/compound-property-resolver';
import { STANDARD_CONDITIONS } from '../../../../../src/common/thermal/constants/standard-conditions.constants';

const T_WATER_K = 298.15;

describe('liquid compound transport', () => {
  it('builds water with liquid μ, λ, ρ and Cp', () => {
    const liquid = CompoundLiquidValue.forTransport('water');
    expect(liquid.viscosity?.values.length).toBeGreaterThan(0);
    expect(liquid.thermalConductivity?.values.length).toBeGreaterThan(0);
    expect(liquid.density?.values.length).toBeGreaterThan(0);
    expect(liquid.heatCapacity?.values.length).toBeGreaterThan(0);

    const resolver = new CompoundPropertyResolver(liquid);
    const rho = resolver.density(T_WATER_K);
    const mu = resolver.viscosity(T_WATER_K);
    const lambda = resolver.thermalConductivity(T_WATER_K);
    const Cp = resolver.heatCapacity(T_WATER_K);

    expect(rho).toBeGreaterThan(990);
    expect(rho).toBeLessThan(1010);
    expect(mu).toBeGreaterThan(5e-4);
    expect(mu).toBeLessThan(2e-3);
    expect(lambda).toBeGreaterThan(0.5);
    expect(lambda).toBeLessThan(0.7);
    expect(Cp).toBeGreaterThan(70);
    expect(Cp).toBeLessThan(90);
  });

  it('reports liquid bounds for water as capable', () => {
    const bounds = CompoundLiquidBounds.forCompound('water', STANDARD_CONDITIONS.PRESSURE_PA);
    expect(bounds.capable).toBe(true);
    expect(bounds.Tmin_K).toBeGreaterThan(250);
    expect(bounds.Tmax_K).toBeGreaterThan(350);
    expect(bounds.Tmax_K!).toBeLessThan(bounds.Tmin_K! + 200);
  });

  it('throws when liquid transport is incomplete', () => {
    expect(() => CompoundLiquidValue.forTransport('lime')).toThrow(/liquid/);
  });
});
