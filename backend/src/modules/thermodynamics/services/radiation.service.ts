import { Injectable } from '@nestjs/common';
import { Common } from '../../../common/thermal';

/** Minimum |ΔT| below which the linearised radiation coefficient returns 0. */
const DT_MIN = 0.01; // K

/**
 * RadiationService — radiation heat transfer for participating gases and surfaces.
 *
 * ## Gas radiation (CO₂ + H₂O)
 * Only CO₂ and H₂O contribute significantly to gas-phase radiation in combustion
 * products.  The emissivity model below is the **Hottel–Mikheev** chart-based
 * correlation as implemented in the legacy `recuperator.js` (lines 1120–1145):
 *
 *   pSum = pCO₂ + pH₂O
 *   k    = (0.78 + 1.6·pH₂O − 0.1·pSum^(L/2)) · (1 − 0.37·T/1000)
 *   ε    = 1 − exp(−k · √(pSum · L))
 *
 * where partial pressures are in [atm] and the mean beam length L is in [m].
 *
 * ## References
 *   [21] Михеев М.А., Михеева И.М. — Основы теплопередачи, 2-е изд., Энергия, 1977.
 *        Tabular gas emissivity data for CO₂/H₂O mixtures; radiation α formulae.
 *   [Leg] recuperator.js lines 1120–1145 — direct JS source of the correlation.
 */
@Injectable()
export class RadiationService {

  // ── Gas emissivity (Hottel–Mikheev) ────────────────────────────────────────

  /**
   * Effective emissivity of a CO₂/H₂O gas mixture.
   *
   * @param pH2O  Partial pressure of H₂O [atm]
   * @param pCO2  Partial pressure of CO₂ [atm]
   * @param L     Mean beam length [m]  (use BodyGeometryHelper.meanBeamLength)
   * @param T_K   Gas temperature [K]
   * @returns     Dimensionless emissivity ε ∈ [0, 1)
   *
   * Source: [21] Mikheev 1977; [Leg] recuperator.js ~1120
   */
  gasEmissivity(pH2O: number, pCO2: number, L: number, T_K: number): number {
    const pSum = pCO2 + pH2O;
    if (pSum <= 0 || L <= 0) return 0;
    const k = (0.78 + 1.6 * pH2O - 0.1 * Math.pow(pSum, L / 2)) * (1 - 0.37 * T_K / 1000);
    return 1 - Math.exp(-k * Math.sqrt(pSum * L));
  }

  // ── Gas radiation heat transfer coefficient ────────────────────────────────

  /**
   * Radiation heat transfer coefficient α_rad [W/(m²·K)] for a gas–surface system
   * where the gas contains CO₂ and/or H₂O as the radiatively participating species.
   *
   * The effective surface emissivity is averaged with the gas hemisphere:
   *   ε_eff = (ε_surface + 1) / 2
   *
   * Emissivity evaluated at surface temperature accounts for the temperature
   * exponent correction:
   *   ε_gs = ε_CO₂(Ts)·(Tg/Ts)^0.65 + ε_H₂O(Ts)·(Tg/Ts)^0.45
   *
   * Result:
   *   α_rad = σ · ε_eff · (ε_g · Tg⁴ − ε_gs · Ts⁴) / (Tg − Ts)
   *
   * Returns 0 when |Tg − Ts| < DT_MIN to avoid division by zero.
   *
   * @param T_gas_K      Gas bulk temperature [K]
   * @param T_surface_K  Surface temperature [K]
   * @param epsilon_s    Surface emissivity (0–1)
   * @param pH2O         H₂O partial pressure [atm]
   * @param pCO2         CO₂ partial pressure [atm]
   * @param L            Mean beam length [m]
   * @returns            α_rad [W/(m²·K)]
   *
   * Source: [21] Mikheev 1977; [Leg] recuperator.js ~1127
   */
  gasRadiationHTC(
    T_gas_K: number,
    T_surface_K: number,
    epsilon_s: number,
    pH2O: number,
    pCO2: number,
    L: number,
  ): number {
    if (Math.abs(T_gas_K - T_surface_K) < DT_MIN) return 0;

    // Gas emissivity at gas temperature
    const eps_g = this.gasEmissivity(pH2O, pCO2, L, T_gas_K);

    // Gas emissivity components re-evaluated at surface temperature
    // with temperature ratio exponent corrections (Mikheev)
    const eps_gs_CO2 = this.gasEmissivity(0,    pCO2, L, T_surface_K);
    const eps_gs_H2O = this.gasEmissivity(pH2O, 0,    L, T_surface_K);
    const eps_gs     = eps_gs_CO2 * Math.pow(T_gas_K / T_surface_K, 0.65)
                     + eps_gs_H2O * Math.pow(T_gas_K / T_surface_K, 0.45);

    // Effective emissivity (hemisphere + surface average)
    const eps_eff = (epsilon_s + 1) / 2;

    const Tg4 = Math.pow(T_gas_K, 4);
    const Ts4 = Math.pow(T_surface_K, 4);

    return Common.SIGMA * eps_eff * (eps_g * Tg4 - eps_gs * Ts4) / (T_gas_K - T_surface_K);
  }

  // ── Solid-surface radiation heat transfer coefficient ──────────────────────

  /**
   * Radiation heat transfer coefficient α_rad [W/(m²·K)] between two opaque
   * solid surfaces (no participating gas).  Commonly used for external surfaces
   * cooling by radiation to surroundings.
   *
   *   α_rad = |σ · (ε₁·T₁⁴ − ε₂·T₂⁴)| / |T₁ − T₂|
   *
   * Returns 0 when |T₁ − T₂| < DT_MIN.
   *
   * @param T1_K      Hot-side temperature [K]
   * @param T2_K      Cold-side temperature [K]
   * @param epsilon1  Hot-side emissivity (default 1 — black body)
   * @param epsilon2  Cold-side emissivity (default 1 — black body)
   * @returns         α_rad [W/(m²·K)]
   *
   * Source: [Leg] recuperator.js ~1140
   */
  solidRadiationHTC(
    T1_K: number,
    T2_K: number,
    epsilon1 = 1.0,
    epsilon2 = 1.0,
  ): number {
    if (Math.abs(T1_K - T2_K) < DT_MIN) return 0;
    return Math.abs(
      Common.SIGMA * (epsilon1 * Math.pow(T1_K, 4) - epsilon2 * Math.pow(T2_K, 4))
      / (T1_K - T2_K),
    );
  }

  // ── Combined convective + radiation HTC ────────────────────────────────────

  /**
   * Total effective heat transfer coefficient combining convection and gas
   * radiation for a gas–surface system:
   *
   *   α_total = α_conv + α_rad
   *
   * @param alpha_conv   Convective HTC [W/(m²·K)]
   * @param T_gas_K      Gas bulk temperature [K]
   * @param T_surface_K  Surface temperature [K]
   * @param epsilon_s    Surface emissivity (0–1)
   * @param pH2O         H₂O partial pressure [atm]
   * @param pCO2         CO₂ partial pressure [atm]
   * @param L            Mean beam length [m]
   * @returns            α_total [W/(m²·K)]
   */
  totalGasHTC(
    alpha_conv: number,
    T_gas_K: number,
    T_surface_K: number,
    epsilon_s: number,
    pH2O: number,
    pCO2: number,
    L: number,
  ): number {
    return alpha_conv + this.gasRadiationHTC(T_gas_K, T_surface_K, epsilon_s, pH2O, pCO2, L);
  }
}

