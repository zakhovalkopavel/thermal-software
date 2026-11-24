import { GasViscosity } from '../../../../src/modules/thermodynamics/utils/viscosity/gas-viscosity';
import { CoolpropViscosityData } from '../../../../src/modules/thermodynamics/utils/viscosity/coolprop-viscosity-data';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { STANDARD_CONDITIONS } from '../../../../src/common/thermal/constants/standard-conditions.constants';
import { MIXTURE_VISCOSITY } from '../../../../src/modules/thermodynamics/constants/mixture-viscosity.constants';
import { ChungThermalConductivity } from '../../../../src/modules/thermodynamics/utils/conductivity/chung-thermal-conductivity';
import { GasDensity } from '../../../../src/modules/thermodynamics/utils/density/gas-density';

describe('GasViscosity', () => {
  afterEach(() => CoolpropViscosityData.resetCache());

  it('N2 μ increases from 1 atm to 50 bar at 300 K (dilute + CoolProp Δη)', () => {
    const rLow = GasViscosity.forCompound(
      GAS_REGISTRY.N2, 300, STANDARD_CONDITIONS.PRESSURE_PA,
    );
    const rHigh = GasViscosity.forCompound(GAS_REGISTRY.N2, 300, 5e6);
    expect(rHigh.validity.message).toMatch(/CoolProp/);
    expect(rHigh.value).toBeGreaterThan(rLow.value);
  });

  it('uses Wilke + Chung Δη at atmospheric air mixture', () => {
    const mole = { [Species.N2]: 0.79, [Species.O2]: 0.21 };
    const r = GasViscosity.forMixture(mole, 300, STANDARD_CONDITIONS.PRESSURE_PA);
    expect(r.method).toBe('Wilke');
    expect(r.value).toBeGreaterThan(1e-5);
    expect(r.validity.message).toMatch(/Wilke/);
    expect(r.validity.message).toMatch(/Chung Δη/);
  });

  it('air mixture μ increases from 1 atm to 10 bar at 300 K', () => {
    const mole = { [Species.N2]: 0.79, [Species.O2]: 0.21 };
    const rLow = GasViscosity.forMixture(mole, 300, STANDARD_CONDITIONS.PRESSURE_PA);
    const rMid = GasViscosity.forMixture(mole, 300, 1e6);
    expect(rLow.method).toBe('Wilke');
    expect(rMid.method).toBe('Wilke');
    expect(rMid.value).toBeGreaterThan(rLow.value);
  });

  it('uses Chung1988 when y ≥ Y_SWITCH', () => {
    const mole = { [Species.N2]: 0.79, [Species.O2]: 0.21 };
    const mixParams = ChungThermalConductivity.mixParameters([
      ChungThermalConductivity.speciesParams({
        label: 'N2', y: 0.79, M: GAS_REGISTRY.N2.Mr,
        Tc: GAS_REGISTRY.N2.criticalTemperature,
        Vc: GAS_REGISTRY.N2.criticalVolume,
        omega: GAS_REGISTRY.N2.acentricFactor,
        dipole_C_m: GAS_REGISTRY.N2.dipoleMoment,
      }),
      ChungThermalConductivity.speciesParams({
        label: 'O2', y: 0.21, M: GAS_REGISTRY.O2.Mr,
        Tc: GAS_REGISTRY.O2.criticalTemperature,
        Vc: GAS_REGISTRY.O2.criticalVolume,
        omega: GAS_REGISTRY.O2.acentricFactor,
        dipole_C_m: GAS_REGISTRY.O2.dipoleMoment,
      }),
    ]);
    const P_high = 2e7;
    const M = 0.79 * GAS_REGISTRY.N2.Mr + 0.21 * GAS_REGISTRY.O2.Mr;
    const V = M / GasDensity.forMixture(mole, 300, P_high);
    const y = ChungThermalConductivity.densityParameterY(mixParams.Vc, V);
    expect(y).toBeGreaterThanOrEqual(MIXTURE_VISCOSITY.Y_SWITCH);

    const r = GasViscosity.forMixture(mole, 300, P_high);
    expect(r.method).toBe('Chung1988');
    expect(r.value).toBeGreaterThan(0);
    expect(r.validity.message).toMatch(/Chung1988/);
  });
});
