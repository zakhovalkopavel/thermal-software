import { CoolpropConductivity } from '../../../../../src/modules/thermodynamics/utils/conductivity/coolprop-conductivity';
import { CoolpropOlchowySengers } from '../../../../../src/modules/thermodynamics/utils/conductivity/coolprop-olchowy-sengers';
import { CoolpropTransportData } from '../../../../../src/modules/thermodynamics/utils/conductivity/coolprop-transport-data';
import { CoolpropHelmholtzData } from '../../../../../src/modules/thermodynamics/utils/density/coolprop-helmholtz-data';
import { GasDensity } from '../../../../../src/modules/thermodynamics/utils/density/gas-density';
import { GAS_REGISTRY } from '../../../../../src/common/thermal/compound/gas/registry';
import { STANDARD_CONDITIONS } from '../../../../../src/common/thermal/constants/standard-conditions.constants';
import { CompoundPropertyResolver } from '../../../../../src/common/thermal/utils/compound-properties/compound-property-resolver';

describe('CoolpropConductivity (NIST IR 8209)', () => {
  const T = 300;
  const P_atm = STANDARD_CONDITIONS.PRESSURE_PA;
  const mu = 1.5e-5;

  beforeEach(() => {
    CoolpropTransportData.resetCache();
    CoolpropHelmholtzData.resetCache();
  });

  it('loads Hydrogen dilute + residual polynomial', () => {
    expect(CoolpropConductivity.hasResidual('Hydrogen')).toBe(true);
    const dilute = CoolpropConductivity.diluteIfAvailable('Hydrogen', T);
    expect(dilute).toBeDefined();
    expect(dilute!).toBeGreaterThan(0.1);
    expect(dilute!).toBeLessThan(0.3);
  });

  it('residual raises λ with density for CarbonDioxide', () => {
    expect(CoolpropConductivity.hasResidual('CarbonDioxide')).toBe(true);
    const dilute = 0.016;
    const rhoLow = GasDensity.forCompound(GAS_REGISTRY.CO2, T, P_atm);
    const rhoHigh = GasDensity.forCompound(GAS_REGISTRY.CO2, T, 5e6);
    const lamLow = CoolpropConductivity.conductivity('CarbonDioxide', T, rhoLow, dilute, mu);
    const lamHigh = CoolpropConductivity.conductivity('CarbonDioxide', T, rhoHigh, dilute, mu);
    expect(lamHigh).toBeGreaterThan(lamLow);
    expect(lamLow).toBeCloseTo(dilute, 3);
  });

  it('Oxygen residual uses polynomial_and_exponential', () => {
    expect(CoolpropConductivity.hasResidual('Oxygen')).toBe(true);
    const model = CoolpropConductivity.tryModel('Oxygen');
    expect(model?.residual?.type).toBe('polynomial_and_exponential');
    const dilute = 0.026;
    const rhoAtm = GasDensity.forCompound(GAS_REGISTRY.O2, T, P_atm);
    const rhoHigh = GasDensity.forCompound(GAS_REGISTRY.O2, T, 2e7);
    const lamAtm = CoolpropConductivity.conductivity('Oxygen', T, rhoAtm, dilute, mu);
    const lamHigh = CoolpropConductivity.conductivity('Oxygen', T, rhoHigh, dilute, mu);
    expect(lamHigh).toBeGreaterThan(lamAtm);
  });

  it('Nitrogen expression residual is unsupported', () => {
    expect(CoolpropConductivity.hasResidual('Nitrogen')).toBe(false);
    expect(CoolpropConductivity.diluteIfAvailable('Nitrogen', T)).toBeUndefined();
  });

  it('CO2 critical enhancement is negligible at 300 K / 1 atm', () => {
    const model = CoolpropConductivity.tryModel('CarbonDioxide')!;
    expect(model.critical?.type).toBe('simplified_Olchowy_Sengers');
    const fluid = CoolpropHelmholtzData.loadFluid('CarbonDioxide');
    const rho = GasDensity.forCompound(GAS_REGISTRY.CO2, T, P_atm);
    const crit = CoolpropOlchowySengers.critical(fluid, model.critical!, T, rho, mu);
    expect(crit).toBeLessThan(1e-4);
  });

  it('CO2 critical enhancement is significant near the critical point', () => {
    const model = CoolpropConductivity.tryModel('CarbonDioxide')!;
    const fluid = CoolpropHelmholtzData.loadFluid('CarbonDioxide');
    const Tnear = fluid.Tc + 1;
    const rhoCritMass = fluid.rhoc * fluid.molarMass;
    const muNear = new CompoundPropertyResolver(GAS_REGISTRY.CO2).viscosity(Tnear);
    const crit = CoolpropOlchowySengers.critical(
      fluid, model.critical!, Tnear, rhoCritMass, muNear,
    );
    expect(crit).toBeGreaterThan(0.01);
  });
});
