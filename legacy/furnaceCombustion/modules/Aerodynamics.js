class Aerodynamics {
  /**
   * Pressure drop per unit length in a packed bed using the Ergun equation.
   * @param {number} v_superficial_m_s - Superficial gas velocity [m/s].
   * @param {number} D_p_m - Particle diameter [m].
   * @param {number} epsilon - Bed porosity [-].
   * @param {number} rho_kg_m3 - Gas density [kg/m^3].
   * @param {number} mu_Pa_s - Gas viscosity [Pa·s].
   * @returns {number} Pressure gradient dP/dz [Pa/m].
   */
  pressureDrop_Pa_m(v_superficial_m_s, D_p_m, epsilon, rho_kg_m3, mu_Pa_s) {
    const term1 = 150 * Math.pow(1 - epsilon, 2) * mu_Pa_s * v_superficial_m_s
      / (Math.pow(epsilon, 3) * Math.pow(D_p_m, 2));
    const term2 = 1.75 * (1 - epsilon) * rho_kg_m3 * v_superficial_m_s * v_superficial_m_s
      / (Math.pow(epsilon, 3) * D_p_m);
    return term1 + term2;
  }

  /**
   * Update superficial velocity at a given axial location, assuming ideal gas
   * and constant pressure so that volumetric flow scales with temperature.
   * @param {number} volumetricFlow_m3s_at_inlet - Inlet volumetric flow rate [m^3/s] at T_inlet_K.
   * @param {number} T_inlet_K - Inlet gas temperature [K].
   * @param {number} T_local_K - Local gas temperature [K].
   * @param {number} A_m2 - Cross-sectional area of bed [m^2].
   * @returns {number} Local superficial velocity [m/s].
   */
  updateVelocity(volumetricFlow_m3s_at_inlet, T_inlet_K, T_local_K, A_m2) {
    const v_inlet = volumetricFlow_m3s_at_inlet / A_m2;
    return v_inlet * (T_local_K / T_inlet_K);
  }
}

module.exports = Aerodynamics;
