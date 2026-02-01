const Constants = require('../utils/Constants');

class Thermodynamics {
  constructor() {
    // NASA 7-coefficient polynomial data
    // Cp/R = a1 + a2*T + a3*T^2 + a4*T^3 + a5*T^4
    // H/RT = a1 + a2*T/2 + a3*T^2/3 + a4*T^3/4 + a5*T^4/5 + a6/T
    // S/R = a1*ln(T) + a2*T + a3*T^2/2 + a4*T^3/3 + a5*T^4/4 + a7
    this.NASA7_DATA = {
      // Coefficients from NASA CEA (approximate, truncated for now)
      CO: {
        Tswitch: 1000,
        low: [3.57953347e+00, -6.10353680e-04, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -1.43440860e+04, 3.50840928e+00],
        high: [2.71518561e+00, 2.06252743e-03, -9.98825771e-07, 2.30053008e-10, -2.03647716e-14, -1.41518724e+04, 7.81868772e+00]
      },
      CO2: {
        Tswitch: 1000,
        low: [2.35677352e+00, 8.98459677e-03, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -4.83719697e+04, 9.90105222e+00],
        high: [4.63659493e+00, 2.74131991e-03, -9.95828542e-07, 1.60373011e-10, -9.16103468e-15, -4.90249392e+04, -1.93489550e+00]
      },
      H2: {
        Tswitch: 1000,
        low: [2.34433112e+00, 7.98052075e-03, -1.94781510e-05, 2.01572094e-08, -7.37611761e-12, -9.17935173e+02, 6.83010238e-01],
        high: [3.33727920e+00, -4.94024731e-05, 4.99456778e-07, -1.79566394e-10, 2.00255376e-14, -9.50158922e+02, -3.20502331e+00]
      },
      H2O: {
        Tswitch: 1000,
        low: [4.19864056e+00, -2.03643410e-03, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -3.02937267e+04, -8.49032208e-01],
        high: [3.03399249e+00, 2.17691804e-03, -1.64072518e-07, -9.70419870e-11, 1.68200992e-14, -3.00042971e+04, 4.96677010e+00]
      },
      O2: {
        Tswitch: 1000,
        low: [3.78245636e+00, -2.99673416e-03, 9.84730201e-06, -9.68129509e-09, 3.24372837e-12, -1.06394356e+03, 3.65767573e+00],
        high: [3.28253784e+00, 1.48308754e-03, -7.57966669e-07, 2.09470555e-10, -2.16717794e-14, -1.08845772e+03, 5.45323129e+00]
      },
      N2: {
        Tswitch: 1000,
        low: [3.53100528e+00, -1.23660987e-04, -5.02999433e-07, 2.43530612e-09, -1.40881235e-12, -1.04697628e+03, 2.96747468e+00],
        high: [2.95257626e+00, 1.39690040e-03, -4.92631603e-07, 7.86010195e-11, -4.60755204e-15, -9.23948688e+02, 5.87188762e+00]
      },
      CH4: {
        Tswitch: 1000,
        low: [5.14987613e+00, -1.36709788e-02, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -1.02466476e+04, -4.64130376e+00],
        high: [7.48514950e-02, 1.33909467e-02, -5.73285809e-06, 1.22292535e-09, -1.01815230e-13, -9.46834459e+03, 1.84373180e+01]
      }
    };
  }

  _getCoeffs(species, T) {
    const data = this.NASA7_DATA[species];
    if (!data) throw new Error(`Unknown species: ${species}`);
    return T < data.Tswitch ? data.low : data.high;
  }

  /**
   * Heat capacity at constant pressure for a single species using NASA 7-coefficient polynomials.
   * @param {string} species - Species name key in NASA7_DATA (e.g. 'CO2', 'O2').
   * @param {number} T - Temperature [K].
   * @returns {number} Heat capacity Cp [J/(mol·K)].
   */
  Cp_NASA(species, T) {
    const a = this._getCoeffs(species, T);
    const t = T;
    const R = Constants.R_UNIVERSAL_J_PER_MOLK;
    const Cp_R = a[0] + a[1]*t + a[2]*t*t + a[3]*t*t*t + a[4]*t*t*t*t;
    return Cp_R * R;
  }

  /**
   * Molar enthalpy for a single species using NASA 7-coefficient polynomials.
   * @param {string} species - Species name key in NASA7_DATA (e.g. 'CO2', 'O2').
   * @param {number} T - Temperature [K].
   * @returns {number} Enthalpy H [J/mol].
   */
  H_NASA(species, T) {
    const a = this._getCoeffs(species, T);
    const t = T;
    const R = Constants.R_UNIVERSAL_J_PER_MOLK;
    const H_RT = a[0]
      + a[1]*t/2
      + a[2]*t*t/3
      + a[3]*t*t*t/4
      + a[4]*t*t*t*t/5
      + a[5]/t;
    return H_RT * R * t;
  }

  /**
   * Molar entropy for a single species using NASA 7-coefficient polynomials.
   * @param {string} species - Species name key in NASA7_DATA (e.g. 'CO2', 'O2').
   * @param {number} T - Temperature [K].
   * @returns {number} Entropy S [J/(mol·K)].
   */
  S_NASA(species, T) {
    const a = this._getCoeffs(species, T);
    const t = T;
    const R = Constants.R_UNIVERSAL_J_PER_MOLK;
    const S_R = a[0]*Math.log(t)
      + a[1]*t
      + a[2]*t*t/2
      + a[3]*t*t*t/3
      + a[4]*t*t*t*t/4
      + a[6];
    return S_R * R;
  }

  /**
   * Molar Gibbs free energy for a single species.
   * @param {string} species - Species name key in NASA7_DATA.
   * @param {number} T - Temperature [K].
   * @returns {number} Gibbs free energy G [J/mol].
   */
  G_NASA(species, T) {
    const H = this.H_NASA(species, T);
    const S = this.S_NASA(species, T);
    return H - T * S;
  }

  /**
   * Mixture heat capacity at constant pressure, mole-fraction-weighted.
   * @param {Object.<string, number>} composition - Mole fractions for each species [-], summing to 1.
   * @param {number} T - Temperature [K].
   * @returns {number} Mixture Cp [J/(mol·K)].
   */
  Cp_mix(composition, T) {
    let Cp = 0;
    for (const [sp, y] of Object.entries(composition)) {
      if (y <= 0) continue;
      if (!this.NASA7_DATA[sp]) continue;
      Cp += y * this.Cp_NASA(sp, T);
    }
    return Cp;
  }

  /**
   * Mixture molar enthalpy, mole-fraction-weighted.
   * @param {Object.<string, number>} composition - Mole fractions for each species [-], summing to 1.
   * @param {number} T - Temperature [K].
   * @returns {number} Mixture enthalpy H [J/mol].
   */
  H_mix(composition, T) {
    let H = 0;
    for (const [sp, y] of Object.entries(composition)) {
      if (y <= 0) continue;
      if (!this.NASA7_DATA[sp]) continue;
      H += y * this.H_NASA(sp, T);
    }
    return H;
  }
}

module.exports = Thermodynamics;
