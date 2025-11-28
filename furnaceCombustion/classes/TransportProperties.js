class TransportProperties {
  constructor() {
    this.suthParams = {
      O2: { mu0: 1.919e-5, T0: 273, S: 127 },
      N2: { mu0: 1.663e-5, T0: 273, S: 107 },
      CO: { mu0: 1.657e-5, T0: 273, S: 136 },
      CO2: { mu0: 1.370e-5, T0: 273, S: 222 },
      H2: { mu0: 8.411e-6, T0: 273, S: 97 },
      H2O: { mu0: 1.12e-5, T0: 350, S: 1064 },
      CH4: { mu0: 1.027e-5, T0: 273, S: 170 }
    };
  }

  /**
   * Dynamic viscosity of a pure species using Sutherland's law.
   * @param {string} species - Species identifier (e.g. 'O2', 'CO2').
   * @param {number} T_K - Gas temperature [K].
   * @returns {number} Dynamic viscosity μ [Pa·s].
   */
  viscosity_Pa_s(species, T_K) {
    const p = this.suthParams[species];
    if (!p) throw new Error(`No Sutherland parameters for ${species}`);
    const { mu0, T0, S } = p;
    const T = T_K;
    return mu0 * Math.pow(T / T0, 1.5) * (T0 + S) / (T + S);
  }

  /**
   * Mixture dynamic viscosity using Wilke's mixing rule.
   * @param {Object.<string, number>} composition - Mole fractions of species in the gas [-].
   * @param {number} T_K - Gas temperature [K].
   * @returns {number} Mixture viscosity μ_mix [Pa·s].
   */
  viscosity_mix(composition, T_K) {
    const mu_i = {};
    const MW = { O2: 0.032, N2: 0.028, CO: 0.028, CO2: 0.044, H2: 0.002, H2O: 0.018, CH4: 0.016 };

    for (const sp of Object.keys(composition)) {
      if (!this.suthParams[sp]) continue;
      mu_i[sp] = this.viscosity_Pa_s(sp, T_K);
    }

    let mu_mix = 0;
    const species = Object.keys(mu_i);
    for (const i of species) {
      const yi = composition[i] || 0;
      if (yi === 0) continue;
      let denom = 0;
      for (const j of species) {
        const yj = composition[j] || 0;
        if (yj === 0) continue;
        const phi_ij = Math.pow(1 + Math.sqrt(mu_i[i] / mu_i[j]) * Math.pow(MW[j] / MW[i], 0.25), 2)
          / Math.sqrt(8 * (1 + MW[i] / MW[j]));
        denom += yj * phi_ij;
      }
      mu_mix += yi * mu_i[i] / denom;
    }
    return mu_mix;
  }

  /**
   * Thermal conductivity of a pure species using an Eucken-type relation.
   * @param {string} species - Species identifier (e.g. 'O2', 'CO2').
   * @param {number} T_K - Gas temperature [K].
   * @param {number} Cp_J_molK - Molar heat capacity of the species [J/(mol·K)].
   * @returns {number} Thermal conductivity k [W/(m·K)].
   */
  thermalConductivity_W_mK(species, T_K, Cp_J_molK) {
    const mu = this.viscosity_Pa_s(species, T_K);
    const R = 8.314462618; // J/mol/K
    const MW = { O2: 0.032, N2: 0.028, CO: 0.028, CO2: 0.044, H2: 0.002, H2O: 0.018, CH4: 0.016 };
    const M = MW[species];
    if (!M) throw new Error(`No MW for ${species}`);
    return (Cp_J_molK + 1.25 * R) * mu / M;
  }

  /**
   * Mixture thermal conductivity via simple mixing rule.
   * @param {Object.<string, number>} composition - Mole fractions of species in the gas [-].
   * @param {number} T_K - Gas temperature [K].
   * @param {Thermodynamics} [thermo] - Thermodynamics instance used to obtain Cp(T) for species.
   * @returns {number} Mixture thermal conductivity k_mix [W/(m·K)].
   */
  thermalConductivity_mix(composition, T_K, thermo) {
    const k_i = {};
    for (const sp of Object.keys(composition)) {
      if (!this.suthParams[sp]) continue;
      const Cp = thermo ? thermo.Cp_NASA(sp, T_K) : 30.0;
      k_i[sp] = this.thermalConductivity_W_mK(sp, T_K, Cp);
    }

    let k_mix = 0;
    const species = Object.keys(k_i);
    for (const i of species) {
      const yi = composition[i] || 0;
      if (yi === 0) continue;
      let denom = 0;
      for (const j of species) {
        const yj = composition[j] || 0;
        if (yj === 0) continue;
        denom += yj;
      }
      k_mix += yi * k_i[i] / denom;
    }
    return k_mix;
  }
}

module.exports = TransportProperties;
