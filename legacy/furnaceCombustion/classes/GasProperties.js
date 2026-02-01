const Thermodynamics = require('./Thermodynamics');
const TransportProperties = require('./TransportProperties');
const DiffusionCoefficients = require('./DiffusionCoefficients');
const Constants = require('../utils/Constants');

class GasProperties {
  constructor(thermo, transport, diffusion) {
    this.thermo = thermo || new Thermodynamics();
    this.transport = transport || new TransportProperties();
    this.diffusion = diffusion || new DiffusionCoefficients();
  }

  /**
   * Compute aggregated thermophysical properties of a gas mixture at given T and P.
   * @param {Object.<string, number>} composition - Mole fractions for each species [-], summing to 1.
   * @param {number} T_K - Gas temperature [K].
   * @param {number} [P_atm=1.0] - Total pressure [atm].
   * @returns {{Cp_J_molK: number, H_J_mol: number, mu_Pa_s: number, k_W_mK: number,
   *           D: Object.<string, number>, density_kg_m3: number, molecularWeight_kg_mol: number}}
   *          Object containing mixture Cp [J/(mol·K)], enthalpy [J/mol], viscosity [Pa·s],
   *          thermal conductivity [W/(m·K)], diffusion coefficients [m^2/s], density [kg/m^3],
   *          and average molecular weight [kg/mol].
   */
  getProperties(composition, T_K, P_atm = 1.0) {
    const Cp_J_molK = this.thermo.Cp_mix(composition, T_K);
    const H_J_mol = this.thermo.H_mix(composition, T_K);
    const mu_Pa_s = this.transport.viscosity_mix(composition, T_K);
    const k_W_mK = this.transport.thermalConductivity_mix(composition, T_K, this.thermo);
    const D = this.diffusion.getAllDiffusionCoefficients(composition, T_K, P_atm);
    const molecularWeight_kg_mol = this.getMolecularWeight(composition);
    const density_kg_m3 = this.getDensity(composition, T_K, P_atm);

    return {
      Cp_J_molK,
      H_J_mol,
      mu_Pa_s,
      k_W_mK,
      D,
      density_kg_m3,
      molecularWeight_kg_mol
    };
  }

  /**
   * Ideal-gas mixture density from average molecular weight.
   * @param {Object.<string, number>} composition - Mole fractions for each species [-].
   * @param {number} T_K - Gas temperature [K].
   * @param {number} P_atm - Total pressure [atm].
   * @returns {number} Mixture density ρ [kg/m^3].
   */
  getDensity(composition, T_K, P_atm) {
    const R = Constants.R_UNIVERSAL_J_PER_MOLK;
    const M_avg = this.getMolecularWeight(composition);
    const P_Pa = P_atm * Constants.P_ATM_PA;
    return (P_Pa * M_avg) / (R * T_K);
  }

  /**
   * Mixture-averaged molecular weight.
   * @param {Object.<string, number>} composition - Mole fractions for each species [-].
   * @returns {number} Average molecular weight M̄ [kg/mol].
   */
  getMolecularWeight(composition) {
    const MW = { O2: 0.032, N2: 0.028, CO: 0.028, CO2: 0.044, H2: 0.002, H2O: 0.018, CH4: 0.016 };
    let M_avg = 0;
    for (const [sp, y] of Object.entries(composition)) {
      M_avg += y * (MW[sp] || 0);
    }
    return M_avg;
  }
}

module.exports = GasProperties;
