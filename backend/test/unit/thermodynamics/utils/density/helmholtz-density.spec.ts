import { PHYSICAL_CONSTANTS } from '../../../../../src/common/thermal/constants/physical.constants';
import { GAS_REGISTRY } from '../../../../../src/common/thermal/compound/gas/registry';
import { HELMHOLTZ_BINARY_DEFAULTS } from '../../../../../src/modules/thermodynamics/constants/helmholtz-binary-defaults.constants';
import { Species } from '../../../../../src/modules/thermodynamics/enums/species.enum';
import { CoolpropHelmholtzData } from '../../../../../src/modules/thermodynamics/utils/density/coolprop-helmholtz-data';
import { HelmholtzBinaryDefaults } from '../../../../../src/modules/thermodynamics/utils/density/helmholtz-binary-defaults';
import { HelmholtzDensity } from '../../../../../src/modules/thermodynamics/utils/density/helmholtz-density';
import { GasDensity } from '../../../../../src/modules/thermodynamics/utils/density/gas-density';

describe('HelmholtzDensity / GasDensity', () => {
  beforeEach(() => CoolpropHelmholtzData.resetCache());

  const T = 300;
  const P_atm = 1e5;

  it('pure N2 / CH4 / CO2 at 300 K, 0.1 MPa are within ~0.5 % of ideal gas', () => {
    for (const [key, M] of [
      ['Nitrogen', 0.02801348],
      ['Methane', 0.0160428],
      ['CarbonDioxide', 0.0440098],
    ] as const) {
      const rho = HelmholtzDensity.pureMassDensity(key, T, P_atm);
      const ideal = (P_atm * M) / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T);
      expect(Math.abs(rho / ideal - 1)).toBeLessThan(0.005);
    }
  });

  it('pure CO2 at elevated P is denser than the ideal-gas estimate', () => {
    const P = 5e6;
    const M = CoolpropHelmholtzData.loadFluid('CarbonDioxide').molarMass;
    const rho = HelmholtzDensity.pureMassDensity('CarbonDioxide', T, P);
    const ideal = (P * M) / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T);
    expect(rho).toBeGreaterThan(ideal * 1.05);
  });

  it('binary N2–CO2 density is finite and near the ideal-gas order of magnitude', () => {
    const P = 1e6;
    const rho = HelmholtzDensity.mixtureMassDensity(
      ['Nitrogen', 'CarbonDioxide'],
      [0.5, 0.5],
      T,
      P,
    );
    const M =
      0.5 * CoolpropHelmholtzData.loadFluid('Nitrogen').molarMass
      + 0.5 * CoolpropHelmholtzData.loadFluid('CarbonDioxide').molarMass;
    const ideal = (P * M) / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T);
    expect(rho).toBeGreaterThan(0);
    expect(rho / ideal).toBeGreaterThan(0.8);
    expect(rho / ideal).toBeLessThan(1.3);
  });

  it('GasDensity uses Helmholtz for linked N2', () => {
    const n2 = GasDensity.forCompound(GAS_REGISTRY.N2, T, P_atm);
    const helm = HelmholtzDensity.pureMassDensity('Nitrogen', T, P_atm);
    expect(n2).toBeCloseTo(helm, 10);
  });

  it('missing CoolProp binary pair with similar Tc uses Lorentz–Berthelot (Rule 1)', () => {
    const betas = HelmholtzBinaryDefaults.estimate('Nitrogen', 'Oxygen', 126.2, 140.0);
    expect(betas.betaT).toBe(HELMHOLTZ_BINARY_DEFAULTS.BETA_T);
    expect(betas.gammaT).toBe(HELMHOLTZ_BINARY_DEFAULTS.GAMMA_T);
    expect(betas.F).toBe(0);
  });

  it('asymmetric / quantum missing pair uses arithmetic γ_T (Rule 2)', () => {
    const TcH2 = 33.145;
    const TcCH4 = 190.564;
    const betas = HelmholtzBinaryDefaults.estimate('Hydrogen', 'Methane', TcH2, TcCH4);
    expect(betas.gammaT).toBeCloseTo(
      HelmholtzBinaryDefaults.arithmeticGammaT(TcH2, TcCH4),
      12,
    );
    expect(betas.F).toBe(0);
  });

  it('GasDensity.forMixture uses PR when a species lacks CoolProp but has criticals', () => {
    const mix = { [Species.N2]: 0.9, [Species.SO3]: 0.1 };
    const rho = GasDensity.forMixture(mix, T, P_atm);
    const ideal = GasDensity.ideal(
      0.9 * GAS_REGISTRY.N2.Mr + 0.1 * GAS_REGISTRY.SO3.Mr,
      T,
      P_atm,
    );
    expect(rho).toBeGreaterThan(0);
    expect(Math.abs(rho / ideal - 1)).toBeLessThan(0.05);
  });
});
