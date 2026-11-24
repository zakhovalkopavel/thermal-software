import { HELMHOLTZ_DENSITY } from '../../constants/helmholtz-density.constants';
import { CoolpropAlpharTerm } from '../../types/coolprop-alphar-term.type';
import { CoolpropDepartureFunction } from '../../types/coolprop-departure-function.type';

/**
 * Residual Helmholtz α^r and (∂α^r/∂δ)_τ for CoolProp term types.
 * Refs: [CoolProp] Helmholtz formulations.
 */
export class HelmholtzResidual {
  /** (∂α^r/∂δ)_τ from a list of CoolProp alphar blocks. */
  static dAlphaRDdelta(terms: readonly CoolpropAlpharTerm[], delta: number, tau: number): number {
    let sum = 0;
    for (const term of terms) {
      sum += HelmholtzResidual.termDAlphaRDdelta(term, delta, tau);
    }
    return sum;
  }

  /** Departure-function (∂α^r/∂δ)_τ. */
  static departureDAlphaRDdelta(
    dep: CoolpropDepartureFunction,
    delta: number,
    tau: number,
  ): number {
    if (dep.type === 'Exponential') {
      return HelmholtzResidual.powerLikeDepartureDAlphaRDdelta(dep, delta, tau);
    }
    if (dep.type === 'GERG-2008') {
      return HelmholtzResidual.gergDepartureDAlphaRDdelta(dep, delta, tau);
    }
    if (dep.type === 'Gaussian+Exponential') {
      return HelmholtzResidual.gaussianPlusExpDepartureDAlphaRDdelta(dep, delta, tau);
    }
    throw new Error(`Unsupported CoolProp departure type: ${dep.type}`);
  }

  private static termDAlphaRDdelta(
    term: CoolpropAlpharTerm,
    delta: number,
    tau: number,
  ): number {
    switch (term.type) {
      case 'ResidualHelmholtzPower':
        return HelmholtzResidual.powerDAlphaRDdelta(term, delta, tau);
      case 'ResidualHelmholtzExponential':
        return HelmholtzResidual.exponentialDAlphaRDdelta(term, delta, tau);
      case 'ResidualHelmholtzGaussian':
        return HelmholtzResidual.gaussianDAlphaRDdelta(term, delta, tau);
      case 'ResidualHelmholtzNonAnalytic':
        return HelmholtzResidual.nonAnalyticDAlphaRDdelta(term, delta, tau);
      case 'ResidualHelmholtzGaoB':
        return HelmholtzResidual.gaoBDAlphaRDdelta(term, delta, tau);
      default:
        throw new Error(`Unsupported CoolProp alphar type: ${String((term as { type: string }).type)}`);
    }
  }

  private static powerDAlphaRDdelta(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzPower' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const li = term.l[i] ?? 0;
      const ni = term.n[i];
      const di = term.d[i];
      const ti = term.t[i];
      const expTerm = li === 0 ? 1 : Math.exp(-Math.pow(delta, li));
      sum += ni * Math.pow(delta, di - 1) * Math.pow(tau, ti) * expTerm * (di - li * Math.pow(delta, li));
    }
    return sum;
  }

  private static exponentialDAlphaRDdelta(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzExponential' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const ni = term.n[i];
      const di = term.d[i];
      const ti = term.t[i];
      const li = term.l[i];
      const gi = term.g[i];
      const expTerm = Math.exp(-gi * Math.pow(delta, li));
      sum += ni * Math.pow(delta, di - 1) * Math.pow(tau, ti) * expTerm
        * (di - gi * li * Math.pow(delta, li));
    }
    return sum;
  }

  private static gaussianDAlphaRDdelta(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzGaussian' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const ni = term.n[i];
      const di = term.d[i];
      const ti = term.t[i];
      const eta = term.eta[i];
      const eps = term.epsilon[i];
      const beta = term.beta[i];
      const gamma = term.gamma[i];
      const expTerm = Math.exp(-eta * (delta - eps) ** 2 - beta * (tau - gamma) ** 2);
      sum += ni * Math.pow(delta, di - 1) * Math.pow(tau, ti) * expTerm
        * (di - 2 * eta * delta * (delta - eps));
    }
    return sum;
  }

  /**
   * Span–Wagner / IAPWS-95 non-analytic critical terms (CoolProp ResidualHelmholtzNonAnalytic).
   * Offset δ,τ slightly when exactly at the reducing point to avoid 0/0.
   */
  private static nonAnalyticDAlphaRDdelta(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzNonAnalytic' }>,
    deltaIn: number,
    tauIn: number,
  ): number {
    const eps = HELMHOLTZ_DENSITY.NON_ANALYTIC_OFFSET;
    const delta = Math.abs(deltaIn - 1) < eps ? deltaIn + eps : deltaIn;
    const tau = Math.abs(tauIn - 1) < eps ? tauIn + eps : tauIn;
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const ni = term.n[i];
      const ai = term.a[i];
      const bi = term.b[i];
      const betai = term.beta[i];
      const Ai = term.A[i];
      const Bi = term.B[i];
      const Ci = term.C[i];
      const Di = term.D[i];

      const d1 = delta - 1;
      const t1 = tau - 1;
      const theta = (1 - tau) + Ai * Math.pow(d1 * d1, 1 / (2 * betai));
      const Delta = theta * theta + Bi * Math.pow(d1 * d1, ai);
      const psi = Math.exp(-Ci * d1 * d1 - Di * t1 * t1);

      const dDelta_ddelta = d1 * (
        Ai * theta * 2 / betai * Math.pow(d1 * d1, 1 / (2 * betai) - 1)
        + 2 * Bi * ai * Math.pow(d1 * d1, ai - 1)
      );
      const dpsi_ddelta = -2 * Ci * d1 * psi;
      const dDeltaB_ddelta = bi * Math.pow(Delta, bi - 1) * dDelta_ddelta;

      sum += ni * (Math.pow(Delta, bi) * (psi + delta * dpsi_ddelta) + delta * psi * dDeltaB_ddelta);
    }
    return sum;
  }

  private static gaoBDAlphaRDdelta(
    term: Extract<CoolpropAlpharTerm, { type: 'ResidualHelmholtzGaoB' }>,
    delta: number,
    tau: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < term.n.length; i++) {
      const ni = term.n[i];
      const di = term.d[i];
      const ti = term.t[i];
      const eta = term.eta[i];
      const beta = term.beta[i];
      const gamma = term.gamma[i];
      const eps = term.epsilon[i];
      const bi = term.b[i];
      const denom = bi + beta * (tau - gamma) ** 2;
      const Ftau = Math.pow(tau, ti) * Math.exp(1 / denom);
      const Fdelta = Math.pow(delta, di) * Math.exp(eta * (delta - eps) ** 2);
      const dFdelta_ddelta = Fdelta * (di / delta + 2 * eta * (delta - eps));
      sum += ni * Ftau * dFdelta_ddelta;
    }
    return sum;
  }

  /** CoolProp Exponential departure: n δ^d τ^t exp(−δ^l). */
  private static powerLikeDepartureDAlphaRDdelta(
    dep: CoolpropDepartureFunction,
    delta: number,
    tau: number,
  ): number {
    const l = dep.l;
    let sum = 0;
    for (let i = 0; i < dep.n.length; i++) {
      const li = l?.[i] ?? 0;
      const expTerm = li === 0 ? 1 : Math.exp(-Math.pow(delta, li));
      sum += dep.n[i] * Math.pow(delta, dep.d[i] - 1) * Math.pow(tau, dep.t[i]) * expTerm
        * (dep.d[i] - li * Math.pow(delta, li));
    }
    return sum;
  }

  /**
   * GERG-2008 departure: n δ^d τ^t exp(−η(δ−ε)² − β(δ−γ)).
   * Power-like terms are the η=β=0 special case.
   */
  private static gergDepartureDAlphaRDdelta(
    dep: CoolpropDepartureFunction,
    delta: number,
    tau: number,
  ): number {
    const eta = dep.eta;
    const eps = dep.epsilon;
    const beta = dep.beta;
    const gamma = dep.gamma;
    let sum = 0;
    for (let i = 0; i < dep.n.length; i++) {
      const etai = eta?.[i] ?? 0;
      const epsi = eps?.[i] ?? 0;
      const betai = beta?.[i] ?? 0;
      const gammai = gamma?.[i] ?? 0;
      const expTerm = Math.exp(-etai * (delta - epsi) ** 2 - betai * (delta - gammai));
      sum += dep.n[i] * Math.pow(delta, dep.d[i] - 1) * Math.pow(tau, dep.t[i]) * expTerm
        * (dep.d[i] - 2 * etai * delta * (delta - epsi) - betai * delta);
    }
    return sum;
  }

  /** First Npower: Exponential; remainder: Gaussian in (δ,τ). */
  private static gaussianPlusExpDepartureDAlphaRDdelta(
    dep: CoolpropDepartureFunction,
    delta: number,
    tau: number,
  ): number {
    const npower = dep.Npower ?? dep.n.length;
    const l = dep.l;
    const eta = dep.eta;
    const eps = dep.epsilon;
    const beta = dep.beta;
    const gamma = dep.gamma;
    let sum = 0;
    for (let i = 0; i < dep.n.length; i++) {
      if (i < npower) {
        const li = l?.[i] ?? 0;
        const expTerm = li === 0 ? 1 : Math.exp(-Math.pow(delta, li));
        sum += dep.n[i] * Math.pow(delta, dep.d[i] - 1) * Math.pow(tau, dep.t[i]) * expTerm
          * (dep.d[i] - li * Math.pow(delta, li));
        continue;
      }
      const etai = eta?.[i] ?? 0;
      const epsi = eps?.[i] ?? 0;
      const betai = beta?.[i] ?? 0;
      const gammai = gamma?.[i] ?? 0;
      const expTerm = Math.exp(-etai * (delta - epsi) ** 2 - betai * (tau - gammai) ** 2);
      sum += dep.n[i] * Math.pow(delta, dep.d[i] - 1) * Math.pow(tau, dep.t[i]) * expTerm
        * (dep.d[i] - 2 * etai * delta * (delta - epsi));
    }
    return sum;
  }
}
