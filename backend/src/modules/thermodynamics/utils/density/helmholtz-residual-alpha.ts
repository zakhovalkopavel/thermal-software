import { HELMHOLTZ_DENSITY } from '../../constants/helmholtz-density.constants';
import { CoolpropAlpharTerm } from '../../types/coolprop-alphar-term.type';

/**
 * Residual Helmholtz αʳ(δ,τ) for CoolProp term types (value, not derivatives).
 * Used for finite-difference ττ when building EOS heat capacities.
 * Refs: [CoolProp].
 */
export class HelmholtzResidualAlpha {
  static alphaR(terms: readonly CoolpropAlpharTerm[], delta: number, tau: number): number {
    let sum = 0;
    for (const term of terms) {
      sum += HelmholtzResidualAlpha.termAlphaR(term, delta, tau);
    }
    return sum;
  }

  private static termAlphaR(
    term: CoolpropAlpharTerm,
    delta: number,
    tau: number,
  ): number {
    switch (term.type) {
      case 'ResidualHelmholtzPower':
        return HelmholtzResidualAlpha.power(term, delta, tau);
      case 'ResidualHelmholtzExponential':
        return HelmholtzResidualAlpha.exponential(term, delta, tau);
      case 'ResidualHelmholtzGaussian':
        return HelmholtzResidualAlpha.gaussian(term, delta, tau);
      case 'ResidualHelmholtzNonAnalytic':
        return HelmholtzResidualAlpha.nonAnalytic(term, delta, tau);
      case 'ResidualHelmholtzGaoB':
        return HelmholtzResidualAlpha.gaoB(term, delta, tau);
      default:
        throw new Error(`Unsupported CoolProp alphar type: ${String((term as { type: string }).type)}`);
    }
  }

  private static power(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzPower' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const li = term.l[i] ?? 0;
      const expTerm = li === 0 ? 1 : Math.exp(-Math.pow(delta, li));
      sum += term.n[i] * Math.pow(delta, term.d[i]) * Math.pow(tau, term.t[i]) * expTerm;
    }
    return sum;
  }

  private static exponential(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzExponential' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      sum += term.n[i] * Math.pow(delta, term.d[i]) * Math.pow(tau, term.t[i])
        * Math.exp(-term.g[i] * Math.pow(delta, term.l[i]));
    }
    return sum;
  }

  private static gaussian(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzGaussian' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const expTerm = Math.exp(
        -term.eta[i] * (delta - term.epsilon[i]) ** 2
        - term.beta[i] * (tau - term.gamma[i]) ** 2,
      );
      sum += term.n[i] * Math.pow(delta, term.d[i]) * Math.pow(tau, term.t[i]) * expTerm;
    }
    return sum;
  }

  private static nonAnalytic(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzNonAnalytic' }>,
    deltaIn: number,
    tauIn: number,
  ): number {
    const eps = HELMHOLTZ_DENSITY.NON_ANALYTIC_OFFSET;
    const delta = Math.abs(deltaIn - 1) < eps ? deltaIn + eps : deltaIn;
    const tau = Math.abs(tauIn - 1) < eps ? tauIn + eps : tauIn;
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const d1 = delta - 1;
      const t1 = tau - 1;
      const theta = (1 - tau) + term.A[i] * Math.pow(d1 * d1, 1 / (2 * term.beta[i]));
      const Delta = theta * theta + term.B[i] * Math.pow(d1 * d1, term.a[i]);
      const psi = Math.exp(-term.C[i] * d1 * d1 - term.D[i] * t1 * t1);
      sum += term.n[i] * Math.pow(Delta, term.b[i]) * delta * psi;
    }
    return sum;
  }

  private static gaoB(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzGaoB' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const denom = term.b[i] + term.beta[i] * (tau - term.gamma[i]) ** 2;
      sum += term.n[i]
        * Math.pow(delta, term.d[i])
        * Math.pow(tau, term.t[i])
        * Math.exp(term.eta[i] * (delta - term.epsilon[i]) ** 2 + 1 / denom);
    }
    return sum;
  }
}
