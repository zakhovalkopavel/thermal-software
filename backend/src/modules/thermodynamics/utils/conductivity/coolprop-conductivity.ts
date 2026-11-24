import { CoolpropConductivityDilute } from '../../types/coolprop-conductivity-dilute.type';
import { CoolpropConductivityModel } from '../../types/coolprop-conductivity-model.type';
import { CoolpropConductivityResidual } from '../../types/coolprop-conductivity-residual.type';
import { CoolpropFluidEos } from '../../types/coolprop-fluid-eos.type';
import { CoolpropHelmholtzData } from '../density/coolprop-helmholtz-data';
import { CoolpropOlchowySengers } from './coolprop-olchowy-sengers';
import { CoolpropTransportData } from './coolprop-transport-data';

/**
 * Pure-fluid thermal conductivity from CoolProp TRANSPORT models
 * (NIST IR 8209 dilute + residual + critical form as in CoolProp / REFPROP).
 *
 * λ = λ⁰(T) + λʳ(T,ρ) + λ^crit(T,ρ).
 * Refs: [NISTIR8209], [CoolProp].
 */
export class CoolpropConductivity {
  /** True when CoolProp has a residual λʳ we can evaluate for this fluid. */
  static hasResidual(coolpropKey: string): boolean {
    return CoolpropTransportData.loadConductivity(coolpropKey)?.residual !== undefined;
  }

  /**
   * λ [W/(m·K)] = λ⁰ + λʳ + λ^crit at T [K] and mass density ρ [kg/m³].
   * Caller supplies λ⁰ (`dilute_W_mK`) and viscosity μ [Pa·s] for λ^crit.
   */
  static conductivity(
    coolpropKey: string,
    T_K: number,
    rho_kg_m3: number,
    dilute_W_mK: number,
    mu_Pa_s: number,
  ): number {
    const model = CoolpropTransportData.loadConductivity(coolpropKey);
    if (!model?.residual) {
      throw new Error(`CoolProp conductivity residual unavailable for "${coolpropKey}"`);
    }
    const fluid = CoolpropHelmholtzData.loadFluid(coolpropKey);
    const residual = CoolpropConductivity.residual(model.residual, T_K, rho_kg_m3, fluid);
    let lambda = dilute_W_mK + residual;
    if (model.critical) {
      lambda += CoolpropOlchowySengers.critical(
        fluid, model.critical, T_K, rho_kg_m3, mu_Pa_s,
      );
    }
    return lambda;
  }

  static tryModel(coolpropKey: string): CoolpropConductivityModel | null {
    return CoolpropTransportData.loadConductivity(coolpropKey);
  }

  /** CoolProp dilute λ⁰ [W/(m·K)], or `undefined` when unsupported / absent. */
  static diluteIfAvailable(coolpropKey: string, T_K: number): number | undefined {
    const model = CoolpropTransportData.loadConductivity(coolpropKey);
    if (!model?.dilute) return undefined;
    return CoolpropConductivity.dilute(model.dilute, T_K);
  }

  private static dilute(model: CoolpropConductivityDilute, T_K: number): number {
    if (model.type === 'ratio_of_polynomials') {
      const Tr = T_K / model.T_reducing;
      let num = 0;
      let den = 0;
      for (let i = 0; i < model.A.length; i++) num += model.A[i] * Tr ** model.n[i];
      for (let i = 0; i < model.B.length; i++) den += model.B[i] * Tr ** model.m[i];
      if (den === 0) throw new Error('CoolProp dilute conductivity denominator is zero');
      return num / den;
    }
    throw new Error(`Unsupported CoolProp dilute conductivity type`);
  }

  private static residual(
    model: CoolpropConductivityResidual,
    T_K: number,
    rho_kg_m3: number,
    fluid: CoolpropFluidEos,
  ): number {
    if (model.type === 'polynomial') {
      const tau = model.T_reducing / T_K;
      const delta = rho_kg_m3 / model.rhomass_reducing;
      let sum = 0;
      for (let i = 0; i < model.B.length; i++) {
        sum += model.B[i] * tau ** model.t[i] * delta ** model.d[i];
      }
      return sum;
    }

    const tau = fluid.Tc / T_K;
    const rho_molar = rho_kg_m3 / fluid.molarMass;
    const delta = rho_molar / fluid.rhoc;
    let sum = 0;
    for (let i = 0; i < model.A.length; i++) {
      sum += model.A[i]
        * tau ** model.t[i]
        * delta ** model.d[i]
        * Math.exp(-model.gamma[i] * delta ** model.l[i]);
    }
    return sum;
  }
}
