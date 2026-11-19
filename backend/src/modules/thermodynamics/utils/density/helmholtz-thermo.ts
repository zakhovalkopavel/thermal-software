import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { OLCHOWY_SENGERS } from '../../constants/olchowy-sengers.constants';
import { CoolpropFluidEos } from '../../types/coolprop-fluid-eos.type';
import { HelmholtzIdealGas } from './helmholtz-ideal-gas';
import { HelmholtzResidual } from './helmholtz-residual';
import { HelmholtzResidualAlpha } from './helmholtz-residual-alpha';

/**
 * Pure-fluid Helmholtz thermodynamic helpers for transport critical enhancement.
 * Refs: [CoolProp].
 */
export class HelmholtzThermo {
  /**
   * (∂p/∂ρ)_T [Pa·m³/mol] at T [K], molar density ρ [mol/m³].
   * p = ρ R T (1 + δ α_δ^r).
   */
  static dpDrho_T(fluid: CoolpropFluidEos, T_K: number, rho_mol_m3: number): number {
    const delta = rho_mol_m3 / fluid.rhoc;
    const tau = fluid.Tc / T_K;
    const dAlpha = HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta, tau);
    const d2Alpha = HelmholtzThermo.d2AlphaRDdelta2(fluid, delta, tau);
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    return R * T_K * (1 + 2 * delta * dAlpha + delta * delta * d2Alpha);
  }

  /** Molar C_v [J/(mol·K)]. */
  static cvMolar(fluid: CoolpropFluidEos, T_K: number, rho_mol_m3: number): number {
    const delta = rho_mol_m3 / fluid.rhoc;
    const tau = fluid.Tc / T_K;
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const ideal = HelmholtzIdealGas.minusTau2D2Alpha0Dtau2(fluid.alpha0, tau);
    const resid = HelmholtzThermo.minusTau2D2AlphaRDtau2(fluid, delta, tau);
    return R * (ideal + resid);
  }

  /** Molar C_p [J/(mol·K)]. */
  static cpMolar(fluid: CoolpropFluidEos, T_K: number, rho_mol_m3: number): number {
    const delta = rho_mol_m3 / fluid.rhoc;
    const tau = fluid.Tc / T_K;
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const dAlpha = HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta, tau);
    const d2dd = HelmholtzThermo.d2AlphaRDdelta2(fluid, delta, tau);
    const d2dt = HelmholtzThermo.d2AlphaRDdeltaDtau(fluid, delta, tau);
    const cv = HelmholtzThermo.cvMolar(fluid, T_K, rho_mol_m3);
    const num = 1 + delta * dAlpha - delta * tau * d2dt;
    const den = 1 + 2 * delta * dAlpha + delta * delta * d2dd;
    return cv + R * (num * num) / den;
  }

  private static d2AlphaRDdelta2(
    fluid: CoolpropFluidEos,
    delta: number,
    tau: number,
  ): number {
    const h = Math.max(OLCHOWY_SENGERS.FD_REL_STEP * Math.abs(delta), 1e-8);
    const up = HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta + h, tau);
    const dn = HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta - h, tau);
    return (up - dn) / (2 * h);
  }

  private static d2AlphaRDdeltaDtau(
    fluid: CoolpropFluidEos,
    delta: number,
    tau: number,
  ): number {
    const h = Math.max(OLCHOWY_SENGERS.FD_REL_STEP * Math.abs(tau), 1e-8);
    const up = HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta, tau + h);
    const dn = HelmholtzResidual.dAlphaRDdelta(fluid.alphar, delta, tau - h);
    return (up - dn) / (2 * h);
  }

  private static minusTau2D2AlphaRDtau2(
    fluid: CoolpropFluidEos,
    delta: number,
    tau: number,
  ): number {
    const h = Math.max(OLCHOWY_SENGERS.FD_REL_STEP * Math.abs(tau), 1e-8);
    const a0 = HelmholtzResidualAlpha.alphaR(fluid.alphar, delta, tau);
    const ap = HelmholtzResidualAlpha.alphaR(fluid.alphar, delta, tau + h);
    const am = HelmholtzResidualAlpha.alphaR(fluid.alphar, delta, tau - h);
    const d2 = (ap - 2 * a0 + am) / (h * h);
    return -tau * tau * d2;
  }
}
