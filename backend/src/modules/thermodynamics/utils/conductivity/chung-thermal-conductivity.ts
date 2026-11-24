import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { CHUNG_THERMAL_CONDUCTIVITY } from '../../constants/chung-thermal-conductivity.constants';
import { ChungMixtureParams } from '../../types/chung-mixture-params.type';
import { ChungSpeciesParams } from '../../types/chung-species-params.type';

/**
 * Chung et al. (1988) dense-gas thermal conductivity and mixing rules
 * as in Poling 5th ed. §§9-5 / 10-5 / 10-7.
 *
 * Refs: [Chung1988], [Poling5].
 */
export class ChungThermalConductivity {
  /**
   * Convert SI dipole [C·m] to Debye.
   */
  static dipoleToDebye(dipole_C_m: number): number {
    return dipole_C_m / CHUNG_THERMAL_CONDUCTIVITY.COULOMB_METRE_PER_DEBYE;
  }

  /**
   * Chung mixing rules → mixture Tc, Vc, ω, μ_r, M, κ (Poling Eqs. 9-5.25–9-5.44).
   * Vc inputs/outputs are SI [m³/mol]; internal σ uses cm³/mol.
   */
  static mixParameters(species: readonly ChungSpeciesParams[]): ChungMixtureParams {
    if (species.length === 0) {
      throw new Error('Chung mixParameters requires at least one species');
    }

    const C = CHUNG_THERMAL_CONDUCTIVITY;
    const n = species.length;
    const sigma = species.map((sp) => C.SIGMA_FROM_VC * Math.pow(sp.Vc * 1e6, 1 / 3));
    const epsOverK = species.map((sp) => sp.Tc / C.EPSILON_FROM_TC);
    const M_g = species.map((sp) => sp.M * 1000);

    let sigmaM3 = 0;
    let epsSigma3 = 0;
    let omegaSigma3 = 0;
    let epsSigma2SqrtM = 0;
    let mu4Sum = 0;
    let kappa = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const yi = species[i].y;
        const yj = species[j].y;
        const sigmaIj = Math.sqrt(sigma[i] * sigma[j]);
        const sigmaIj2 = sigmaIj * sigmaIj;
        const sigmaIj3 = sigmaIj2 * sigmaIj;
        const epsIj = Math.sqrt(epsOverK[i] * epsOverK[j]);
        const omegaIj = 0.5 * (species[i].omega + species[j].omega);
        const Mij = 2 * M_g[i] * M_g[j] / (M_g[i] + M_g[j]);
        const w = yi * yj;

        sigmaM3 += w * sigmaIj3;
        epsSigma3 += w * epsIj * sigmaIj3;
        omegaSigma3 += w * omegaIj * sigmaIj3;
        epsSigma2SqrtM += w * epsIj * sigmaIj2 * Math.sqrt(Mij);
        mu4Sum += w * (species[i].dipole_D * species[i].dipole_D
          * species[j].dipole_D * species[j].dipole_D) / sigmaIj3;
        kappa += w * C.ASSOCIATION_FACTOR;
      }
    }

    if (sigmaM3 <= 0) {
      throw new Error('Chung mixParameters: σ_m³ is non-positive');
    }

    const epsM = epsSigma3 / sigmaM3;
    const sigmaM = Math.pow(sigmaM3, 1 / 3);
    const omega = omegaSigma3 / sigmaM3;
    const M_g_mix = Math.pow(epsSigma2SqrtM / (epsM * sigmaM * sigmaM), 2);
    const Vc_cm3 = Math.pow(sigmaM / C.SIGMA_FROM_VC, 3);
    const Tc = C.EPSILON_FROM_TC * epsM;
    const dipole_m = Math.pow(sigmaM3 * mu4Sum, 0.25);
    const mur = C.DIPOLE_REDUCED_PREFACTOR * dipole_m / Math.sqrt(Vc_cm3 * Tc);

    return {
      Tc,
      Vc: Vc_cm3 * 1e-6,
      omega,
      mur,
      M: M_g_mix / 1000,
      kappa,
    };
  }

  /**
   * Density parameter y = Vc / (6V) with consistent volume units.
   */
  static densityParameterY(Vc_m3_mol: number, V_m3_mol: number): number {
    if (V_m3_mol <= 0) throw new Error('Chung y: molar volume must be positive');
    return Vc_m3_mol / (6 * V_m3_mol);
  }

  /**
   * Ideal-gas molar volume [m³/mol]: V = RT/P.
   */
  static idealGasMolarVolume(T_K: number, P_Pa: number): number {
    if (P_Pa <= 0) throw new Error('Chung V: pressure must be positive');
    return PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T_K / P_Pa;
  }

  /**
   * Dense-gas thermal conductivity [W/(m·K)] — Poling Eq. 10-5.5.
   *
   * @param eta0 Low-pressure viscosity [Pa·s]
   * @param Cv_J_molK Molar heat capacity at constant volume [J/(mol·K)]
   * @param V_m3_mol Molar volume at T,P [m³/mol]
   */
  static conductivity(
    T_K: number,
    mix: ChungMixtureParams,
    eta0: number,
    Cv_J_molK: number,
    V_m3_mol: number,
  ): number {
    const C = CHUNG_THERMAL_CONDUCTIVITY;
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const Tr = T_K / mix.Tc;
    const mur4 = mix.mur ** 4;
    const kappa = mix.kappa;

    const B = C.TABLE_10_3.map(([a, b, c, d]) => a + b * mix.omega + c * mur4 + d * kappa);
    const [B1, B2, B3, B4, B5, B6, B7] = B;

    const alpha = Cv_J_molK / R - 1.5;
    const beta = C.BETA_OMEGA.C0 + C.BETA_OMEGA.C1 * mix.omega
      + C.BETA_OMEGA.C2 * mix.omega * mix.omega;
    const Z = C.Z_TR.C0 + C.Z_TR.C1 * Tr * Tr;
    const P = C.PSI;
    const psiNum = P.ALPHA0 + P.ALPHA1 * alpha - P.BETA1 * beta + P.Z1 * Z;
    const psiDen = P.DEN_0 + beta * Z + P.DEN_ALPHA_BETA * alpha * beta;
    const psi = 1 + alpha * (psiNum / psiDen);

    const y = ChungThermalConductivity.densityParameterY(mix.Vc, V_m3_mol);
    if (y <= 0 || y >= 1) {
      throw new Error(`Chung λ: density parameter y=${y} is outside (0,1)`);
    }

    const oneMinusY = 1 - y;
    const G1 = (1 - 0.5 * y) / (oneMinusY * oneMinusY * oneMinusY);
    const G2 = (B1 / y * (1 - Math.exp(-B4 * y)) + B2 * G1 * Math.exp(B5 * y) + B3 * G1)
      / (B1 * B4 + B2 + B3);

    const Vc_cm3 = mix.Vc * 1e6;
    const M_kg = mix.M;
    const q = C.Q_PREFACTOR * Math.sqrt(mix.Tc / M_kg) / Math.pow(Vc_cm3, 2 / 3);

    return C.LAMBDA_PREFACTOR * eta0 * psi / M_kg * (1 / G2 + B6 * y)
      + q * B7 * y * y * Math.sqrt(Tr) * G2;
  }

  /**
   * Build Chung species params from compound criticals / dipole.
   * Throws when Tc or Vc is missing.
   */
  static speciesParams(input: {
    label: string;
    y: number;
    M: number;
    Tc: number | undefined;
    Vc: number | undefined;
    omega: number | undefined;
    dipole_C_m: number | undefined;
  }): ChungSpeciesParams {
    if (input.Tc === undefined || input.Vc === undefined) {
      throw new Error(
        `Species ${input.label} lacks criticalTemperature/criticalVolume required for mixture λ`,
      );
    }
    return {
      y: input.y,
      M: input.M,
      Tc: input.Tc,
      Vc: input.Vc,
      omega: input.omega ?? 0,
      dipole_D: input.dipole_C_m !== undefined
        ? ChungThermalConductivity.dipoleToDebye(input.dipole_C_m)
        : 0,
    };
  }
}
