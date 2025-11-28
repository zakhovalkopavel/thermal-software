const Constants = require('../utils/Constants');

class ChemicalKinetics {
  constructor() {
    this.R = Constants.R_UNIVERSAL_J_PER_MOLK;

    this.E = {
      E1: 140000,
      E2: 1.1 * 140000,
      E3: 2.2 * 140000,
      E31: 1.6 * 140000,
      E32: 240000,
      E33: 80000,
      E4: 96300,
      E41: 70000,
      E42: 125000,
      E43: 90000
    };

    this.A = {
      A1: 1e7, A2: 5e6, A3: 1e5, A31: 1e4,
      A32: 1e4, A33: 1e3, A4: 1e10, A41: 1e11,
      A42: 1e9, A43: 1e7
    };
  }

  /**
   * Arrhenius rate constant.
   * @param {number} A - Pre-exponential factor [varies with rate expression units].
   * @param {number} E - Activation energy [J/mol].
   * @param {number} T_K - Temperature [K].
   * @returns {number} Rate constant k [units consistent with A and reaction order].
   */
  k(A, E, T_K) {
    return A * Math.exp(-E / (this.R * T_K));
  }

  /**
   * Surface reaction rates for solid carbon reactions with O2, CO2, H2O, and H2.
   * Rates are expressed per unit bed volume.
   * @param {Object.<string, number>} composition - Gas-phase mole fractions [-].
   * @param {number} T_gas_K - Bulk gas temperature [K].
   * @param {number} T_solid_K - Solid (char) surface temperature [K].
   * @param {Object} fuelProps - Fuel property object from FuelDatabase.
   * @param {number} D_eff_O2 - Effective diffusion coefficient of O2 in bed [m^2/s].
   * @param {number} D_eff_CO2 - Effective diffusion coefficient of CO2 in bed [m^2/s].
   * @param {number} D_eff_H2O - Effective diffusion coefficient of H2O in bed [m^2/s].
   * @param {number} particleRadius_m - Characteristic particle radius [m].
   * @returns {{r1: number, r2: number, r3: number, r31: number, r32: number, r33: number, a_s: number}}
   *          Reaction rates r_i [mol/(m^3·s)] and specific surface area a_s [m^2/m^3].
   */
  surfaceReactionRates(composition, T_gas_K, T_solid_K, fuelProps,
    D_eff_O2, D_eff_CO2, D_eff_H2O, particleRadius_m) {
    const P_atm = 1.0;
    const pO2 = (composition.O2 || 0) * P_atm;
    const pCO2 = (composition.CO2 || 0) * P_atm;
    const pCO = (composition.CO || 0) * P_atm;
    const pH2O = (composition.H2O || 0) * P_atm;
    const pH2 = (composition.H2 || 0) * P_atm;

    const calcEta = (k_surf, D_eff, R_p) => {
      if (!D_eff || D_eff <= 0) return 1.0;
      const phi = R_p * Math.sqrt(k_surf / D_eff);
      if (phi < 1e-2) return 1.0;
      const coth_phi = 1 / Math.tanh(phi);
      return (3 / (phi * phi)) * (phi * coth_phi - 1);
    };

    const T_kin = (T_solid_K - T_gas_K) / Math.log(T_solid_K / T_gas_K);

    const k1 = this.k(this.A.A1, this.E.E1, T_kin);
    const k3 = this.k(this.A.A3, this.E.E3, T_kin);
    const k31 = this.k(this.A.A31, this.E.E31, T_kin);

    const eta1 = calcEta(k1, D_eff_O2, particleRadius_m) * fuelProps.activityFactor;
    const eta3 = calcEta(k3, D_eff_CO2, particleRadius_m) * fuelProps.activityFactor;
    const eta31 = calcEta(k31, D_eff_H2O, particleRadius_m) * fuelProps.activityFactor;

    const epsilon = fuelProps.porosity;
    const a_s = 3 * (1 - epsilon) / particleRadius_m;

    const r1 = eta1 * a_s * k1 * pO2;               // C + O2  -> CO2
    const r3 = eta3 * a_s * k3 * (pCO2 - pCO);      // C + CO2 -> 2CO
    const r31 = eta31 * a_s * k31 * pH2O;           // C + H2O -> CO + H2

    // Additional solid reactions using E2, E32, E33
    // r2: 2C + O2 -> 2CO  (treated as first-order in pO2)
    const k2 = this.k(this.A.A2, this.E.E2, T_kin);
    const eta2 = calcEta(k2, D_eff_O2, particleRadius_m) * fuelProps.activityFactor;
    const r2 = eta2 * a_s * k2 * pO2;

    // r32: C + 2H2O -> CO2 + 2H2  (proportional to pH2O^2)
    const k32 = this.k(this.A.A32, this.E.E32, T_kin);
    const eta32 = calcEta(k32, D_eff_H2O, particleRadius_m) * fuelProps.activityFactor;
    const r32 = eta32 * a_s * k32 * pH2O * pH2O;

    // r33: C + 2H2 -> CH4  (proportional to pH2^2)
    const k33 = this.k(this.A.A33, this.E.E33, T_kin);
    const eta33 = fuelProps.activityFactor; // hydrogen not diffusion-limited in solid
    const r33 = eta33 * a_s * k33 * pH2 * pH2;

    return { r1, r2, r3, r31, r32, r33, a_s };
  }

  /**
   * Homogeneous gas-phase reaction rates for CO, H2, CH4 oxidation and water–gas shift.
   * @param {Object.<string, number>} composition - Gas-phase mole fractions [-].
   * @param {number} T_K - Gas temperature [K].
   * @param {number} [P_atm=1.0] - Total pressure [atm].
   * @returns {{r4: number, r41: number, r42: number, r43: number}}
   *          Volumetric reaction rates [arbitrary units, consistent with p^n scaling].
   */
  gasPhaseReactionRates(composition, T_K, P_atm = 1.0) {
    const k4 = this.k(this.A.A4, this.E.E4, T_K);
    const k41 = this.k(this.A.A41, this.E.E41, T_K);
    const k42 = this.k(this.A.A42, this.E.E42, T_K);
    const k43_fwd = this.k(this.A.A43, this.E.E43, T_K);

    const pCO = (composition.CO || 0) * P_atm;
    const pO2 = (composition.O2 || 0) * P_atm;
    const pH2 = (composition.H2 || 0) * P_atm;
    const pH2O = (composition.H2O || 0) * P_atm;
    const pCH4 = (composition.CH4 || 0) * P_atm;
    const pCO2 = (composition.CO2 || 0) * P_atm;

    const r4 = k4 * pCO * pCO * pO2;           // 2CO + O2 -> 2CO2
    const r41 = k41 * pH2 * pH2 * pO2;         // 2H2 + O2 -> 2H2O
    const r42 = k42 * pCH4 * pO2 * pO2;        // CH4 + 2O2 -> CO2 + 2H2O

    // Water-gas shift CO + H2O <-> CO2 + H2
    // Use simple van't Hoff-based equilibrium constant for better realism
    // ln K_eq ≈ A + B/T + C*ln(T) (coarse fit from literature)
    const Aeq = Constants.WGSHIFT_KEQ_A;
    const Beq = Constants.WGSHIFT_KEQ_B_K;
    const Ceq = Constants.WGSHIFT_KEQ_C;
    const lnKeq = Aeq + Beq / T_K + Ceq * Math.log(T_K);
    const Keq = Math.exp(lnKeq);

    // Forward rate: r_f = k43_fwd * pCO * pH2O
    const r43_forward = k43_fwd * pCO * pH2O;
    // At equilibrium: r_f / r_r = Keq ≈ (pCO2 * pH2)/(pCO * pH2O)
    // So k43_rev = k43_fwd / Keq
    const k43_rev = k43_fwd / Math.max(Keq, Constants.SMALL_POSITIVE);
    const r43_reverse = k43_rev * pCO2 * pH2;

    return { r4, r41, r42, r43: r43_forward - r43_reverse };
  }

  /**
   * Standard heats of reaction for all surface and gas-phase reactions.
   * @returns {{dH1: number, dH2: number, dH3: number, dH31: number, dH32: number,
   *            dH33: number, dH4: number, dH41: number, dH42: number, dH43: number}}
   *          Reaction enthalpies [J/mol of reacting species as indicated in comments].
   */
  heatOfReaction() {
    return {
      dH1: -393500,
      dH2: -110500,
      dH3: 172000,
      dH31: 131000,
      dH32: 90000,
      dH33: -75000,
      dH4: -283000,
      dH41: -241800,
      dH42: -802000,
      dH43: -41000
    };
  }
}

module.exports = ChemicalKinetics;
