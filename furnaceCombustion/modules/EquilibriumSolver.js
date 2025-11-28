// Simple Gibbs free energy minimization based equilibrium solver
// NOTE: This is a lightweight, approximate implementation intended
// for engineering use, not a full CEA replacement.

const Thermodynamics = require('../classes/Thermodynamics');
const Helpers = require('../utils/Helpers');
const Constants = require('../utils/Constants');

class EquilibriumSolver {
  constructor(options = {}) {
    this.thermo = options.thermo || new Thermodynamics();
    // Supported species (must exist in Thermodynamics NASA7_DATA)
    this.species = options.species || ['CO2', 'CO', 'H2O', 'H2', 'O2', 'N2', 'CH4'];
    // Maximum iterations and tolerance for the optimizer
    this.maxIter = options.maxIter || Constants.MAX_ITER_GIBBS;
    this.tol = options.tol || Constants.TOL_GIBBS;
  }

  /**
   * Compute element totals (C, H, O, N) from a composition vector.
   * @param {Object.<string, number>} n - Species mole counts or mole fractions [-].
   * @returns {{C: number, H: number, O: number, N: number}} Element totals in arbitrary units.
   */
  _elementTotals(n) {
    // Element matrix nu[elem][species]
    const nu = {
      C: { CO2: 1, CO: 1, H2O: 0, H2: 0, O2: 0, N2: 0, CH4: 1 },
      H: { CO2: 0, CO: 0, H2O: 2, H2: 2, O2: 0, N2: 0, CH4: 4 },
      O: { CO2: 2, CO: 1, H2O: 1, H2: 0, O2: 2, N2: 0, CH4: 0 },
      N: { CO2: 0, CO: 0, H2O: 0, H2: 0, O2: 0, N2: 2, CH4: 0 }
    };

    const totals = { C: 0, H: 0, O: 0, N: 0 };
    for (const sp of this.species) {
      const n_i = n[sp] || 0;
      totals.C += (nu.C[sp] || 0) * n_i;
      totals.H += (nu.H[sp] || 0) * n_i;
      totals.O += (nu.O[sp] || 0) * n_i;
      totals.N += (nu.N[sp] || 0) * n_i;
    }
    return totals;
  }

  /**
   * Mixture Gibbs free energy per mole at given temperature and pressure.
   * @param {Object.<string, number>} n - Species mole counts [mol] (or proportional).
   * @param {number} T_K - Temperature [K].
   * @param {number} P_atm - Pressure [atm].
   * @returns {number} Mixture Gibbs free energy G_mix [J/mol].
   */
  _gibbsMixture(n, T_K, P_atm) {
    const R = Constants.R_UNIVERSAL_J_PER_MOLK;
    const P_Pa = P_atm * Constants.P_ATM_PA;

    let nTot = 0;
    for (const sp of this.species) nTot += Math.max(0, n[sp] || 0);
    if (nTot <= 0) return 0;

    let G = 0;
    for (const sp of this.species) {
      const n_i = Math.max(0, n[sp] || 0);
      if (n_i === 0) continue;
      const y_i = n_i / nTot;
      const mu0 = this.thermo.G_NASA(sp, T_K); // J/mol at 1 bar ref
      // Ideal mixture chemical potential mu_i = mu_i^0 + R*T*ln(y_i * P/P_ref)
      const mu_i = mu0 + R * T_K * Math.log(Math.max(Constants.SMALL_POSITIVE, y_i * P_Pa / Constants.P_ATM_PA));
      G += n_i * mu_i;
    }
    // Return G per total mole for comparison purposes
    return G / nTot;
  }

  /**
   * Approximate projection of a candidate mole vector onto the element
   * balance defined by the initial composition.
   * @param {Object.<string, number>} n - Candidate species mole vector.
   * @param {{C: number, H: number, O: number, N: number}} elemTotals - Target element totals.
   * @returns {Object.<string, number>} Adjusted mole vector with approximately preserved atoms.
   */
  _enforceElementBalance(n, elemTotals) {
    // Work in mole-fraction-like space, then renormalize to original nTot.
    const nTot = Object.values(n).reduce((a, b) => a + Math.max(0, b || 0), 0) || 1;
    let y = {};
    for (const sp of this.species) y[sp] = Math.max(0, n[sp] || 0) / nTot;

    // Current element totals from y
    const cur = this._elementTotals(y);

    // Scale C, H, O, N content linearly to match desired totals.
    // This is crude but keeps the solution close to feasible.
    const scale = {
      C: cur.C > 0 ? elemTotals.C / cur.C : 1,
      H: cur.H > 0 ? elemTotals.H / cur.H : 1,
      O: cur.O > 0 ? elemTotals.O / cur.O : 1,
      N: cur.N > 0 ? elemTotals.N / cur.N : 1
    };

    // Apply a combined average scale to each species based on its elemental makeup
    const nu = {
      C: { CO2: 1, CO: 1, H2O: 0, H2: 0, O2: 0, N2: 0, CH4: 1 },
      H: { CO2: 0, CO: 0, H2O: 2, H2: 2, O2: 0, N2: 0, CH4: 4 },
      O: { CO2: 2, CO: 1, H2O: 1, H2: 0, O2: 2, N2: 0, CH4: 0 },
      N: { CO2: 0, CO: 0, H2O: 0, H2: 0, O2: 0, N2: 2, CH4: 0 }
    };

    let yNew = {};
    for (const sp of this.species) {
      const yOld = y[sp] || 0;
      const fC = nu.C[sp] ? scale.C : 1;
      const fH = nu.H[sp] ? scale.H : 1;
      const fO = nu.O[sp] ? scale.O : 1;
      const fN = nu.N[sp] ? scale.N : 1;
      const f = (fC * fH * fO * fN) ** 0.25; // geometric mean
      yNew[sp] = yOld * f;
    }

    yNew = Helpers.normalizeComposition(yNew);

    const out = {};
    for (const sp of this.species) out[sp] = yNew[sp] * nTot;
    return out;
  }

  /**
   * Compute an approximate equilibrium gas composition by minimizing Gibbs
   * free energy at fixed T, P, and element totals.
   * @param {Object.<string, number>} composition - Initial gas composition as mole fractions [-].
   * @param {number} T_K - Temperature [K].
   * @param {number} [P_atm=1.0] - Pressure [atm].
   * @returns {Object.<string, number>} Equilibrium gas composition as mole fractions [-].
   */
  solveEquilibrium(composition, T_K, P_atm = 1.0) {
    // Initialize moles from composition (treat as mole fractions)
    let n = {};
    for (const sp of this.species) {
      n[sp] = Math.max(0, composition[sp] || 0);
    }

    // Normalize to 1 mole total for convenience
    const nTot0 = Object.values(n).reduce((a, b) => a + b, 0) || 1;
    for (const sp of this.species) n[sp] /= nTot0;

    const elemTotals = this._elementTotals(n);

    let Gprev = this._gibbsMixture(n, T_K, P_atm);

    // Small step size for composition perturbations
    const step = 1e-3;

    for (let iter = 0; iter < this.maxIter; iter++) {
      let improved = false;

      for (const sp of this.species) {
        // Try increasing this species slightly
        let nTrial = { ...n };
        nTrial[sp] = Math.max(0, nTrial[sp] + step);
        nTrial = this._enforceElementBalance(nTrial, elemTotals);
        const Gtrial = this._gibbsMixture(nTrial, T_K, P_atm);

        if (Gtrial + this.tol < Gprev) {
          n = nTrial;
          Gprev = Gtrial;
          improved = true;
          continue;
        }

        // Try decreasing this species slightly (if possible)
        nTrial = { ...n };
        nTrial[sp] = Math.max(0, nTrial[sp] - step);
        nTrial = this._enforceElementBalance(nTrial, elemTotals);
        const Gtrial2 = this._gibbsMixture(nTrial, T_K, P_atm);

        if (Gtrial2 + this.tol < Gprev) {
          n = nTrial;
          Gprev = Gtrial2;
          improved = true;
        }
      }

      if (!improved) break; // Converged locally
    }

    // Return normalized equilibrium composition
    let y = {};
    let nTot = 0;
    for (const sp of this.species) nTot += Math.max(0, n[sp] || 0);
    if (nTot <= 0) {
      // Fallback to initial composition
      return Helpers.normalizeComposition(composition);
    }

    for (const sp of this.species) y[sp] = Math.max(0, n[sp] || 0) / nTot;
    return Helpers.normalizeComposition(y);
  }
}

module.exports = EquilibriumSolver;
