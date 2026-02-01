class DiffusionCoefficients {
  constructor() {
    this.LJ_params = {
      O2: { sigma: 3.467, epsilon_k: 106.7 },
      N2: { sigma: 3.798, epsilon_k: 71.4 },
      CO: { sigma: 3.690, epsilon_k: 91.7 },
      CO2: { sigma: 3.941, epsilon_k: 195.2 },
      H2: { sigma: 2.827, epsilon_k: 59.7 },
      H2O: { sigma: 2.641, epsilon_k: 809.1 },
      CH4: { sigma: 3.758, epsilon_k: 148.6 }
    };
  }

  _collisionIntegral(Tstar) {
    // Simple fit for Omega_D(T*), adequate for engineering estimates
    // From typical Chapman-Enskog correlations
    const a = 1.06036;
    const b = 0.15610;
    const c = 0.19300;
    const d = 0.47635;
    const e = 1.03587;
    const f = 1.52996;
    const g = 1.76474;
    const h = 3.89411;
    return a / Math.pow(Tstar, b)
      + c / Math.exp(d * Tstar)
      + e / Math.exp(f * Tstar)
      + g / Math.exp(h * Tstar);
  }

  /**
   * Binary diffusion coefficient between two species via Chapman–Enskog theory.
   * @param {string} species1 - First species identifier.
   * @param {string} species2 - Second species identifier.
   * @param {number} T_K - Gas temperature [K].
   * @param {number} P_atm - Total pressure [atm].
   * @returns {number} Binary diffusion coefficient D_12 [m^2/s].
   */
  D_binary_m2s(species1, species2, T_K, P_atm) {
    const sp1 = this.LJ_params[species1];
    const sp2 = this.LJ_params[species2];
    if (!sp1 || !sp2) throw new Error(`Missing LJ params for ${species1} or ${species2}`);

    const sigma12 = (sp1.sigma + sp2.sigma) / 2; // Å
    const epsilon12 = Math.sqrt(sp1.epsilon_k * sp2.epsilon_k); // K
    const Tstar = T_K / epsilon12;
    const Omega_D = this._collisionIntegral(Tstar);

    // Chapman-Enskog binary diffusion coefficient (m2/s)
    // D_12 = 0.00266 * T^1.5 / (P * sigma_12^2 * Omega_D)
    const D12_cm2s = 0.00266 * Math.pow(T_K, 1.5) / (P_atm * sigma12 * sigma12 * Omega_D);
    return D12_cm2s * 1e-4; // cm2/s -> m2/s
  }

  /**
   * Effective diffusion coefficient of species i in a multicomponent mixture.
   * @param {string} species_i - Species identifier for which D_eff is sought.
   * @param {Object.<string, number>} composition - Mole fractions of all species [-].
   * @param {number} T_K - Gas temperature [K].
   * @param {number} P_atm - Total pressure [atm].
   * @returns {number} Effective diffusion coefficient D_i,mix [m^2/s].
   */
  D_effective_m2s(species_i, composition, T_K, P_atm) {
    const yi = composition[species_i] || 0;
    let denom = 0;
    for (const [sp, yj] of Object.entries(composition)) {
      if (sp === species_i) continue;
      if (yj <= 0) continue;
      const Dij = this.D_binary_m2s(species_i, sp, T_K, P_atm);
      denom += yj / Dij;
    }
    if (denom === 0) return 0;
    return (1 - yi) / denom;
  }

  /**
   * Convenience method returning effective diffusion coefficients for all key species.
   * @param {Object.<string, number>} composition - Mole fractions of all species [-].
   * @param {number} T_K - Gas temperature [K].
   * @param {number} P_atm - Total pressure [atm].
   * @returns {Object.<string, number>} Map from species name to D_i,mix [m^2/s].
   */
  getAllDiffusionCoefficients(composition, T_K, P_atm) {
    const speciesList = ['O2', 'CO2', 'CO', 'H2', 'H2O', 'CH4'];
    const D = {};
    for (const sp of speciesList) {
      D[sp] = this.D_effective_m2s(sp, composition, T_K, P_atm);
    }
    return D;
  }
}

module.exports = DiffusionCoefficients;
