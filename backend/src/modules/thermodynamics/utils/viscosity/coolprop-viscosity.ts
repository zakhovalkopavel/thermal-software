import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { COOLPROP_VISCOSITY } from '../../constants/coolprop-viscosity.constants';
import { CoolpropViscosityDilute } from '../../types/coolprop-viscosity-dilute.type';
import { CoolpropViscosityHigherOrder } from '../../types/coolprop-viscosity-higher-order.type';
import { CoolpropViscosityInitialDensity } from '../../types/coolprop-viscosity-initial-density.type';
import { CoolpropViscosityModel } from '../../types/coolprop-viscosity-model.type';
import { CoolpropHelmholtzData } from '../density/coolprop-helmholtz-data';
import { CoolpropViscosityData } from './coolprop-viscosity-data';

/**
 * Pure-fluid viscosity from CoolProp TRANSPORT models:
 * η = η₀(T) + Δη_RF(T,ρ) + Δη_HO(T,ρ).
 * Refs: [CoolProp].
 */
export class CoolpropViscosity {
  /** True when an evaluable CoolProp viscosity model exists for this fluid. */
  static isEvaluable(coolpropKey: string): boolean {
    return CoolpropViscosityData.load(coolpropKey) !== null;
  }

  /**
   * Full CoolProp η [Pa·s] = η₀ + Δη at T [K] and mass density ρ [kg/m³].
   */
  static viscosity(coolpropKey: string, T_K: number, rho_kg_m3: number): number {
    const model = CoolpropViscosity.requireModel(coolpropKey);
    const eta0 = CoolpropViscosity.dilute(model, T_K);
    return eta0 + CoolpropViscosity.denseCorrection(coolpropKey, T_K, rho_kg_m3);
  }

  /**
   * Density-dependent part Δη_RF + Δη_HO [Pa·s] (η₀ from CoolProp for RF scaling).
   * Add this to an external dilute η₀ (compound `def` / CE) for hybrid μ(T,ρ).
   */
  static denseCorrection(coolpropKey: string, T_K: number, rho_kg_m3: number): number {
    const model = CoolpropViscosity.requireModel(coolpropKey);
    const fluid = CoolpropHelmholtzData.loadFluid(coolpropKey);
    const rho_molar = rho_kg_m3 / fluid.molarMass;
    const eta0 = CoolpropViscosity.dilute(model, T_K);
    let delta = 0;
    if (model.initialDensity) {
      delta += CoolpropViscosity.rainwaterFriend(
        model.initialDensity, model, T_K, eta0, rho_molar,
      );
    }
    if (model.higherOrder) {
      delta += CoolpropViscosity.batschinskiHildebrand(model.higherOrder, T_K, rho_molar);
    }
    return delta;
  }

  private static requireModel(coolpropKey: string): CoolpropViscosityModel {
    const model = CoolpropViscosityData.load(coolpropKey);
    if (!model) {
      throw new Error(`CoolProp viscosity unavailable for "${coolpropKey}"`);
    }
    return model;
  }

  private static dilute(model: CoolpropViscosityModel, T_K: number): number {
    const d = model.dilute;
    if (d.type === 'collision_integral') {
      return CoolpropViscosity.collisionIntegral(d, model.epsilon_over_k, model.sigma_eta_m, T_K);
    }
    if (d.type === 'powers_of_T') {
      let sum = 0;
      for (let i = 0; i < d.a.length; i++) sum += d.a[i] * Math.pow(T_K, d.t[i]);
      return sum;
    }
    const Tr = T_K / d.T_reducing;
    let sum = 0;
    for (let i = 0; i < d.a.length; i++) sum += d.a[i] * Math.pow(Tr, d.t[i]);
    return sum;
  }

  private static collisionIntegral(
    d: Extract<CoolpropViscosityDilute, { type: 'collision_integral' }>,
    epsilon_over_k: number,
    sigma_m: number,
    T_K: number,
  ): number {
    const Tstar = T_K / epsilon_over_k;
    const lnTstar = Math.log(Tstar);
    let summer = 0;
    for (let i = 0; i < d.a.length; i++) summer += d.a[i] * Math.pow(lnTstar, d.t[i]);
    const S = Math.exp(summer);
    const sigma_nm = sigma_m * COOLPROP_VISCOSITY.M_TO_NM;
    const M_kg_kmol = d.molar_mass * COOLPROP_VISCOSITY.KG_MOL_TO_KG_KMOL;
    return d.C * Math.sqrt(M_kg_kmol * T_K) / (sigma_nm * sigma_nm * S);
  }

  private static rainwaterFriend(
    init: CoolpropViscosityInitialDensity,
    model: CoolpropViscosityModel,
    T_K: number,
    eta0: number,
    rho_molar: number,
  ): number {
    const Tstar = T_K / model.epsilon_over_k;
    let Bstar = 0;
    for (let i = 0; i < init.b.length; i++) Bstar += init.b[i] * Math.pow(Tstar, init.t[i]);
    const B_eta = PHYSICAL_CONSTANTS.AVOGADRO_PER_MOL
      * Math.pow(model.sigma_eta_m, 3)
      * Bstar;
    return eta0 * B_eta * rho_molar;
  }

  private static batschinskiHildebrand(
    ho: CoolpropViscosityHigherOrder,
    T_K: number,
    rho_molar: number,
  ): number {
    const delta = rho_molar / ho.rhomolar_reduce;
    const tau = ho.T_reduce / T_K;
    let S = 0;
    for (let i = 0; i < ho.a.length; i++) {
      S += ho.a[i]
        * Math.pow(delta, ho.d1[i])
        * Math.pow(tau, ho.t1[i])
        * Math.exp(ho.gamma[i] * Math.pow(delta, ho.l[i]));
    }
    let F = 0;
    for (let i = 0; i < ho.f.length; i++) {
      F += ho.f[i] * Math.pow(delta, ho.d2[i]) * Math.pow(tau, ho.t2[i]);
    }
    let numer = 0;
    for (let i = 0; i < ho.g.length; i++) numer += ho.g[i] * Math.pow(tau, ho.h[i]);
    let denom = 0;
    for (let i = 0; i < ho.p.length; i++) denom += ho.p[i] * Math.pow(tau, ho.q[i]);
    if (denom === 0) throw new Error('CoolProp Batschinski–Hildebrand δ₀ denominator is zero');
    const delta0 = numer / denom;
    return S + F * (1 / (delta0 - delta) - 1 / delta0);
  }
}
