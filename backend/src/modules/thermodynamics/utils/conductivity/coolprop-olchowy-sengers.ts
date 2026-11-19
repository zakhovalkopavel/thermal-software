import { OLCHOWY_SENGERS } from '../../constants/olchowy-sengers.constants';
import { CoolpropConductivityCritical } from '../../types/coolprop-conductivity-critical.type';
import { CoolpropFluidEos } from '../../types/coolprop-fluid-eos.type';
import { HelmholtzThermo } from '../density/helmholtz-thermo';

/**
 * Simplified Olchowy–Sengers critical enhancement λ^crit [W/(m·K)].
 * Matches CoolProp `conductivity_critical_simplified_Olchowy_Sengers`.
 * Refs: [NISTIR8209], [CoolProp].
 */
export class CoolpropOlchowySengers {
  /**
   * @param rho_kg_m3 mass density [kg/m³]
   * @param mu_Pa_s dynamic viscosity [Pa·s] (full μ at T,ρ — CoolProp uses HEOS.viscosity)
   */
  static critical(
    fluid: CoolpropFluidEos,
    model: CoolpropConductivityCritical,
    T_K: number,
    rho_kg_m3: number,
    mu_Pa_s: number,
  ): number {
    if (mu_Pa_s <= 0 || rho_kg_m3 <= 0) return 0;

    const rho = rho_kg_m3 / fluid.molarMass;
    const delta = rho / fluid.rhoc;
    const Tref = model.T_ref ?? OLCHOWY_SENGERS.T_REF_OVER_TC * fluid.Tc;

    const dpDrho = HelmholtzThermo.dpDrho_T(fluid, T_K, rho);
    const X = fluid.Pc / (fluid.rhoc * fluid.rhoc) * rho / dpDrho;

    const dpDrhoRef = HelmholtzThermo.dpDrho_T(fluid, Tref, rho);
    const Xref = fluid.Pc / (fluid.rhoc * fluid.rhoc) * rho / dpDrhoRef * Tref / T_K;
    const num = X - Xref;
    if (num < OLCHOWY_SENGERS.NUM_FLOOR) return 0;

    const zeta = model.zeta0 * (num / model.GAMMA) ** (model.nu / model.gamma);
    if (!(zeta > 0)) return 0;

    const cp = HelmholtzThermo.cpMolar(fluid, T_K, rho);
    const cv = HelmholtzThermo.cvMolar(fluid, T_K, rho);
    if (!(cp > 0) || !(cv > 0) || cp <= cv) return 0;

    const pi = Math.PI;
    const qDzeta = model.qD * zeta;
    const omega = 2 / pi * ((cp - cv) / cp * Math.atan(qDzeta) + cv / cp * qDzeta);
    const omega0 = 2 / pi * (1 - Math.exp(
      -1 / (1 / qDzeta + (qDzeta * qDzeta) / (3 * delta * delta)),
    ));

    const k = OLCHOWY_SENGERS.BOLTZMANN_J_K;
    return rho * cp * model.R0 * k * T_K / (6 * pi * mu_Pa_s * zeta) * (omega - omega0);
  }
}
