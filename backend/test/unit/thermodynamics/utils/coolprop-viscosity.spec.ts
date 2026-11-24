import { CoolpropViscosity } from '../../../../src/modules/thermodynamics/utils/viscosity/coolprop-viscosity';
import { CoolpropViscosityData } from '../../../../src/modules/thermodynamics/utils/viscosity/coolprop-viscosity-data';
import { GasDensity } from '../../../../src/modules/thermodynamics/utils/density/gas-density';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';
import { STANDARD_CONDITIONS } from '../../../../src/common/thermal/constants/standard-conditions.constants';

describe('CoolpropViscosity', () => {
  afterEach(() => CoolpropViscosityData.resetCache());

  it('loads Nitrogen via the evaluable CI + mBH model (skips expression)', () => {
    const model = CoolpropViscosityData.load('Nitrogen');
    expect(model).not.toBeNull();
    expect(model!.dilute.type).toBe('collision_integral');
    expect(model!.higherOrder?.type).toBe('modified_Batschinski_Hildebrand');
  });

  it('Oxygen μ rises with pressure at 300 K', () => {
    const compound = GAS_REGISTRY.O2;
    expect(compound.coolpropKey).toBe('Oxygen');
    const T = 300;
    const rhoLow = GasDensity.forCompound(compound, T, STANDARD_CONDITIONS.PRESSURE_PA);
    const rhoHigh = GasDensity.forCompound(compound, T, 5e6);
    const muLow = CoolpropViscosity.viscosity('Oxygen', T, rhoLow);
    const muHigh = CoolpropViscosity.viscosity('Oxygen', T, rhoHigh);
    expect(muLow).toBeGreaterThan(1e-5);
    expect(muLow).toBeLessThan(3e-5);
    expect(muHigh).toBeGreaterThan(muLow);
  });

  it('isEvaluable is false for Water (hardcoded)', () => {
    expect(CoolpropViscosity.isEvaluable('Water')).toBe(false);
  });
});
