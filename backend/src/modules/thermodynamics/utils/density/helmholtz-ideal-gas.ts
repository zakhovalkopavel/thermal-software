import { CoolpropAlpha0Term } from '../../types/coolprop-alpha0-term.type';

/**
 * Ideal-gas Helmholtz α⁰ derivatives used for EOS C_v / C_p.
 * Refs: [CoolProp] IdealGasHelmholtz terms.
 */
export class HelmholtzIdealGas {
  /**
   * −τ² (∂²α⁰/∂τ²)_δ  — additive piece of C_v⁰/R.
   */
  static minusTau2D2Alpha0Dtau2(terms: readonly CoolpropAlpha0Term[], tau: number): number {
    let sum = 0;
    for (const term of terms) {
      sum += HelmholtzIdealGas.termMinusTau2D2Alpha0Dtau2(term, tau);
    }
    return sum;
  }

  private static termMinusTau2D2Alpha0Dtau2(term: CoolpropAlpha0Term, tau: number): number {
    switch (term.type) {
      case 'IdealGasHelmholtzLead':
      case 'IdealGasHelmholtzEnthalpyEntropyOffset':
        return 0;
      case 'IdealGasHelmholtzLogTau':
        return term.a;
      case 'IdealGasHelmholtzPower': {
        let s = 0;
        for (let i = 0; i < term.n.length; i++) {
          const t = term.t[i];
          s += -term.n[i] * t * (t - 1) * Math.pow(tau, t);
        }
        return s;
      }
      case 'IdealGasHelmholtzPlanckEinstein': {
        let s = 0;
        for (let i = 0; i < term.n.length; i++) {
          s += HelmholtzIdealGas.planckEinsteinMinusTau2(term.n[i], term.t[i] * tau);
        }
        return s;
      }
      case 'IdealGasHelmholtzPlanckEinsteinFunctionT': {
        let s = 0;
        for (let i = 0; i < term.n.length; i++) {
          const u = term.v[i] * tau / term.Tcrit;
          s += HelmholtzIdealGas.planckEinsteinMinusTau2(term.n[i], u);
        }
        return s;
      }
      case 'IdealGasHelmholtzCP0Constant': {
        // CoolProp: contributes (cp/R - 1) after LogTau; second τ deriv → −τ² α_ττ = cp/R − 1
        // when written relative to reducing T — use CoolProp CP0Constant form:
        // α_ττ from ∫(cp/R-1)/τ² → −τ² α_ττ = cp/R − 1
        return term.cp_over_R - 1;
      }
      case 'IdealGasHelmholtzCP0PolyT': {
        // T = Tc/τ; cp/R = Σ c_k T^{t_k}; −τ² α_ττ = Σ c_k (T/Tc)^0 * T^{t_k} with CoolProp mapping
        let s = 0;
        const T = term.Tc / tau;
        for (let i = 0; i < term.c.length; i++) {
          s += term.c[i] * Math.pow(T, term.t[i]);
        }
        return s - 1;
      }
      default:
        throw new Error(
          `Unsupported CoolProp alpha0 type: ${String((term as { type: string }).type)}`,
        );
    }
  }

  /** −τ² ∂²/∂τ² of n ln(1−e^{−u}) with u ∝ τ. */
  private static planckEinsteinMinusTau2(n: number, u: number): number {
    if (u <= 0) return 0;
    const eu = Math.exp(u);
    const den = eu - 1;
    if (den === 0) return 0;
    // α_ττ = n (du/dτ)² e^u / (e^u−1)² and u=θτ ⇒ du/dτ=θ=u/τ
    // −τ² α_ττ = −n u² e^u / (e^u−1)²
    return -n * u * u * eu / (den * den);
  }
}
