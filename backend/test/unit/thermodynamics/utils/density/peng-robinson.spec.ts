import { PHYSICAL_CONSTANTS } from '../../../../../src/common/thermal/constants/physical.constants';
import { GAS_REGISTRY } from '../../../../../src/common/thermal/compound/gas/registry';
import { IDEAL_GAS_DENSITY_LIMITS } from '../../../../../src/modules/thermodynamics/constants/ideal-gas-density-limits.constants';
import { GasDensity } from '../../../../../src/modules/thermodynamics/utils/density/gas-density';
import { PengRobinson } from '../../../../../src/modules/thermodynamics/utils/density/peng-robinson';

describe('PengRobinson / ideal-gas limits', () => {
  const no = GAS_REGISTRY.NO;
  const so3 = GAS_REGISTRY.SO3;

  it('exposes T_c, P_c, ω on gases without CoolProp (NO, SO3, C2H2)', () => {
    for (const c of [no, so3, GAS_REGISTRY.C2H2]) {
      expect(c.coolpropKey).toBeUndefined();
      expect(PengRobinson.hasParams(c)).toBe(true);
    }
  });

  it('NO at 300 K, 0.1 MPa is within ~2 % of ideal gas', () => {
    const T = 300;
    const P = 1e5;
    const rho = PengRobinson.pureMassDensity(
      { Mr: no.Mr, Tc: no.criticalTemperature!, Pc: no.criticalPressure!, omega: no.acentricFactor! },
      T,
      P,
    );
    const ideal = (P * no.Mr) / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T);
    expect(Math.abs(rho / ideal - 1)).toBeLessThan(0.02);
  });

  it('GasDensity.forCompound(SO3) uses Peng–Robinson, not unrestricted ideal', () => {
    const T = 400;
    const P = 1e5;
    const rho = GasDensity.forCompound(so3, T, P);
    const pr = PengRobinson.pureMassDensity(
      {
        Mr: so3.Mr,
        Tc: so3.criticalTemperature!,
        Pc: so3.criticalPressure!,
        omega: so3.acentricFactor!,
      },
      T,
      P,
    );
    expect(rho).toBeCloseTo(pr, 10);
  });

  it('assertIdealGasAllowed throws when P/P_c is too high', () => {
    const Pc = 5e6;
    const P = IDEAL_GAS_DENSITY_LIMITS.MAX_REDUCED_PRESSURE * Pc * 1.5;
    expect(() => PengRobinson.assertIdealGasAllowed(P, Pc)).toThrow(/Ideal-gas density refused/);
  });

  it('assertIdealGasAllowed throws when P is high and P_c is unknown', () => {
    const P = IDEAL_GAS_DENSITY_LIMITS.MAX_P_PA_WITHOUT_PC * 2;
    expect(() => PengRobinson.assertIdealGasAllowed(P)).toThrow(/Ideal-gas density refused/);
  });

  it('assertIdealGasAllowed allows low P/P_c', () => {
    expect(() => PengRobinson.assertIdealGasAllowed(1e5, 5e6)).not.toThrow();
  });
});
