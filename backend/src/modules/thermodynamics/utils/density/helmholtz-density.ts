import { HELMHOLTZ_DENSITY } from '../../constants/helmholtz-density.constants';
import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { brentq } from '../../../../common/utils/root-finding/brentq.util';
import { CoolpropHelmholtzData } from './coolprop-helmholtz-data';
import { HelmholtzBinaryDefaults } from './helmholtz-binary-defaults';
import { HelmholtzMixtureReducing } from './helmholtz-mixture-reducing';
import { HelmholtzResidual } from './helmholtz-residual';
import { CoolpropFluidEos } from '../../types/coolprop-fluid-eos.type';

/**
 * Helmholtz EOS density from CoolProp fluid / mixture JSON.
 * Solves p(ρ,T)=P with brentq. Returns mass density [kg/m³].
 * Refs: [CoolProp].
 */
export class HelmholtzDensity {
  /**
   * Pure-fluid mass density [kg/m³] at T [K], P [Pa].
   */
  static pureMassDensity(coolpropKey: string, T_K: number, P_Pa: number): number {
    const fluid = CoolpropHelmholtzData.loadFluid(coolpropKey);
    const rhoMolar = HelmholtzDensity.solveMolarDensity(
      T_K,
      P_Pa,
      fluid.Tc,
      fluid.rhoc,
      (delta, tau) => HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta, tau),
    );
    return rhoMolar * fluid.molarMass;
  }

  /**
   * Mixture mass density [kg/m³]. keys[i] are CoolProp fluid names; y[i] mole fractions.
   */
  static mixtureMassDensity(
    keys: readonly string[],
    moleFractions: readonly number[],
    T_K: number,
    P_Pa: number,
  ): number {
    const fluids = keys.map((k) => CoolpropHelmholtzData.loadFluid(k));
    const { Tr, rhor } = HelmholtzMixtureReducing.reducing(keys, moleFractions, fluids);
    const M = HelmholtzDensity.meanMolarMass(moleFractions, fluids);

    const rhoMolar = HelmholtzDensity.solveMolarDensity(
      T_K,
      P_Pa,
      Tr,
      rhor,
      (delta, tau) => HelmholtzDensity.mixtureDAlphaRDdelta(keys, moleFractions, fluids, delta, tau),
    );
    return rhoMolar * M;
  }

  private static meanMolarMass(
    moleFractions: readonly number[],
    fluids: readonly CoolpropFluidEos[],
  ): number {
    let M = 0;
    for (let i = 0; i < fluids.length; i++) M += moleFractions[i] * fluids[i].molarMass;
    return M;
  }

  private static mixtureDAlphaRDdelta(
    keys: readonly string[],
    y: readonly number[],
    fluids: readonly CoolpropFluidEos[],
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < keys.length; i++) {
      if (y[i] <= 0) continue;
      sum += y[i] * HelmholtzResidual.dAlphaRDdelta(fluids[i].alphar, delta, tau);
    }
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        if (y[i] <= 0 || y[j] <= 0) continue;
        const { F } = HelmholtzBinaryDefaults.forPair(
          keys[i],
          keys[j],
          fluids[i].Tc,
          fluids[j].Tc,
        );
        if (F === 0) continue;
        const pair = CoolpropHelmholtzData.findPair(keys[i], keys[j]);
        if (!pair?.function) continue;
        const dep = CoolpropHelmholtzData.loadDeparture(pair.function);
        if (!dep) continue;
        sum += y[i] * y[j] * F * HelmholtzResidual.departureDAlphaRDdelta(dep, delta, tau);
      }
    }
    return sum;
  }

  /**
   * Solve p = ρ R T [1 + δ (∂α^r/∂δ)_τ] for molar density [mol/m³].
   */
  private static solveMolarDensity(
    T_K: number,
    P_Pa: number,
    Tr: number,
    rhor: number,
    dAlphaRDdelta: (delta: number, tau: number) => number,
  ): number {
    if (T_K <= 0 || P_Pa <= 0) throw new Error('Helmholtz density: T and P must be positive');
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const tau = Tr / T_K;
    const rhoIdeal = P_Pa / (R * T_K);

    const residual = (rho: number): number => {
      const delta = rho / rhor;
      const arD = dAlphaRDdelta(delta, tau);
      return rho * R * T_K * (1 + delta * arD) - P_Pa;
    };

    let a = Math.max(
      rhoIdeal * HELMHOLTZ_DENSITY.BRACKET_LOW_FACTOR,
      HELMHOLTZ_DENSITY.BRACKET_LOW_FLOOR_MOL_M3,
    );
    let b = Math.max(
      rhoIdeal * HELMHOLTZ_DENSITY.BRACKET_HIGH_FACTOR,
      rhor * HELMHOLTZ_DENSITY.BRACKET_RHOR_FACTOR,
    );
    let fa = residual(a);
    let fb = residual(b);
    for (let expand = 0; expand < HELMHOLTZ_DENSITY.BRACKET_EXPAND_MAX && fa * fb > 0; expand++) {
      a *= 0.5;
      b *= 1.5;
      fa = residual(a);
      fb = residual(b);
    }
    if (fa * fb > 0) {
      throw new Error(
        `Helmholtz density: no density bracket for T=${T_K} K, P=${P_Pa} Pa (single-phase gas assumed)`,
      );
    }
    return brentq(residual, a, b, HELMHOLTZ_DENSITY.BRENTQ_TOL_MOL_M3).root;
  }
}
