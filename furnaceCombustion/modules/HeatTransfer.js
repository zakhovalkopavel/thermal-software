const Constants = require('../utils/Constants');
class HeatTransfer {
  constructor() {
    this.sigma = Constants.SIGMA_SB_W_PER_M2K4;
  }

  /**
   * Compute gas-to-solid convective heat transfer coefficient in a packed bed
   * using the Gunn correlation.
   * @param {number} v_m_s - Superficial gas velocity [m/s]
   * @param {number} D_p_m - Particle diameter [m]
   * @param {number} T_K - Gas temperature [K]
   * @param {number} rho_kg_m3 - Gas density [kg/m^3]
   * @param {number} mu_Pa_s - Gas dynamic viscosity [Pa·s]
   * @param {number} k_W_mK - Gas thermal conductivity [W/(m·K)]
   * @param {number} Cp_J_kgK - Gas specific heat at constant pressure [J/(kg·K)]
   * @param {number} epsilon - Bed porosity [-]
   * @returns {number} Convective heat transfer coefficient h [W/(m^2·K)]
   */
  h_convection_W_m2K(v_m_s, D_p_m, T_K, rho_kg_m3, mu_Pa_s, k_W_mK, Cp_J_kgK, epsilon) {
    const Re = (rho_kg_m3 * v_m_s * D_p_m) / mu_Pa_s;
    const Pr = (mu_Pa_s * Cp_J_kgK) / k_W_mK;
    const Nu = (7 - 10 * epsilon + 5 * epsilon * epsilon)
      * (1 + 0.7 * Math.pow(Re, 0.2) * Math.pow(Pr, 1 / 3))
      + (1.33 - 2.4 * epsilon + 1.2 * epsilon * epsilon)
      * Math.pow(Re, 0.7) * Math.pow(Pr, 1 / 3);
    return Nu * k_W_mK / D_p_m;
  }

  /**
   * Radiative heat flux between fuel particles and inner wall.
   * @param {number} T_fuel_K - Representative fuel surface temperature [K]
   * @param {number} T_wall_K - Inner wall temperature [K]
   * @param {number} epsilon_fuel - Fuel surface emissivity [-]
   * @param {number} epsilon_wall - Inner wall emissivity [-]
   * @returns {number} Net radiative heat flux from fuel to wall [W/m^2]
   */
  q_radiation_W_m2(T_fuel_K, T_wall_K, epsilon_fuel, epsilon_wall) {
    const F_fuel_wall = 0.5;
    const epsilon_eff = 1 / (1 / epsilon_fuel + 1 / epsilon_wall - 1);
    return epsilon_eff * F_fuel_wall * this.sigma
      * (Math.pow(T_fuel_K, 4) - Math.pow(T_wall_K, 4));
  }

  /**
   * Convective heat flux between bulk gas and wall surface.
   * @param {number} h_W_m2K - Convective heat transfer coefficient [W/(m^2·K)]
   * @param {number} T_gas_K - Gas temperature [K]
   * @param {number} T_wall_K - Wall temperature [K]
   * @returns {number} Convective heat flux from gas to wall [W/m^2]
   */
  q_conv_gas_wall_W_m2(h_W_m2K, T_gas_K, T_wall_K) {
    return h_W_m2K * (T_gas_K - T_wall_K);
  }

  /**
   * External natural-convection heat transfer coefficient for a vertical
   * cylinder wall exposed to ambient air.
   * @param {number} T_wall_K - Outer wall temperature [K]
   * @param {number} T_ambient_K - Ambient air temperature [K]
   * @param {number} L_m - Characteristic length (cylinder height) [m]
   * @returns {number} External natural-convection coefficient h [W/(m^2·K)]
   */
  h_external_natural_W_m2K(T_wall_K, T_ambient_K, L_m) {
    const T_film = (T_wall_K + T_ambient_K) / 2;
    const beta = 1 / T_film;
    const g = Constants.G_M_PER_S2;
    const deltaT = Math.abs(T_wall_K - T_ambient_K);
    const nu = Constants.AIR_NU_M2_PER_S;
    const alpha = Constants.AIR_ALPHA_M2_PER_S;
    const Pr = nu / alpha;
    const Gr = (g * beta * deltaT * Math.pow(L_m, 3)) / (nu * nu);
    const Ra = Gr * Pr;
    const Nu = Math.pow(
      0.825 + 0.387 * Math.pow(Ra, 1 / 6)
      / Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 8 / 27),
      2
    );
    const k_air = Constants.AIR_K_W_PER_MK;
    return Nu * k_air / L_m;
  }

  /**
   * Net radiative heat flux from wall to large ambient surroundings.
   * @param {number} T_wall_K - Outer wall temperature [K]
   * @param {number} T_ambient_K - Ambient temperature [K]
   * @param {number} epsilon_wall - Outer wall emissivity [-]
   * @returns {number} Radiative heat flux from wall to ambient [W/m^2]
   */
  q_radiation_external_W_m2(T_wall_K, T_ambient_K, epsilon_wall) {
    return epsilon_wall * this.sigma
      * (Math.pow(T_wall_K, 4) - Math.pow(T_ambient_K, 4));
  }

  /**
   * Estimate inner and outer wall temperatures for a cylindrical furnace wall
   * with conduction through insulation and convection/radiation at both sides.
   * @param {number} T_gas_K - Bulk gas temperature inside furnace [K]
   * @param {number} T_ambient_K - Ambient air temperature outside [K]
   * @param {number} r_inner_m - Inner wall radius [m]
   * @param {number} thickness_m - Wall/insulation thickness [m]
   * @param {number} k_wall_W_mK - Effective wall/insulation thermal conductivity [W/(m·K)]
   * @param {number} h_gas_W_m2K - Inner convective heat transfer coefficient [W/(m^2·K)]
   * @param {number} epsilon_wall_inner - Inner wall emissivity [-]
   * @param {number} epsilon_wall_outer - Outer wall emissivity [-]
   * @param {number} L_m - Axial length used for natural convection [m]
   * @returns {{T_inner: number, T_outer: number}} Inner and outer wall temperatures [K]
   */
  wallTemperatures(T_gas_K, T_ambient_K, r_inner_m, thickness_m,
    k_wall_W_mK, h_gas_W_m2K, epsilon_wall_inner = Constants.EPS_WALL_INNER_DEFAULT, epsilon_wall_outer = Constants.EPS_WALL_OUTER_DEFAULT, L_m) {
    let T_inner = T_gas_K - 50;
    let T_outer = T_ambient_K + 50;

    for (let iter = 0; iter < 10; iter++) {
      const h_ext = this.h_external_natural_W_m2K(T_outer, T_ambient_K, L_m);
      const q_gas_to_inner = h_gas_W_m2K * (T_gas_K - T_inner)
        + epsilon_wall_inner * this.sigma
        * (Math.pow(T_gas_K, 4) - Math.pow(T_inner, 4));
      const q_outer_to_ambient = h_ext * (T_outer - T_ambient_K)
        + this.q_radiation_external_W_m2(T_outer, T_ambient_K, epsilon_wall_outer);

      const q_cond = k_wall_W_mK * (T_inner - T_outer) / thickness_m;

      T_inner = T_gas_K - q_gas_to_inner
        / (h_gas_W_m2K + 4 * epsilon_wall_inner * this.sigma * Math.pow(T_gas_K, 3));
      T_outer = T_ambient_K + q_outer_to_ambient
        / (h_ext + 4 * epsilon_wall_outer * this.sigma * Math.pow(T_ambient_K, 3));
    }

    return { T_inner, T_outer };
  }
}

module.exports = HeatTransfer;
