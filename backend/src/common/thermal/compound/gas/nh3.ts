import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * NH3 — Ammonia
 * NASA-7: Burcat & Ruscic, ANL-05/20 (2005), species NH3
 * LJ: σ=2.900 Å, ε/k=558.3 K — Reid, Prausnitz, Poling (1987), Appendix A
 * Sutherland: μ0=9.82e-6 Pa·s at T0=293 K, S=503 K — from viscosity data fit
 */
export const NH3: CompoundValue = {
  name: 'Ammonia',
  chemicalFormula: 'NH3',
  Mr: 0.017031,
  enthalpyFormation298: -45.9e3,
  gibbsEnergy298: -16.4e3,
  collisionDiameter: 2.9,
  epsilonToKb: 558.3,
  /** Sutherland: μ0=9.82e-6 Pa·s at T0=293 K, S=503 K — fitted from NIST data */
  sutherlandParams: { mu0: 9.82e-6, T0: 293, S: 503 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 53,
        vars: { a: 33.573, b: -1.2581e-2, c: 8.8906e-5, d: -7.1783e-8, e: 1.8569e-11 },
        min: 100, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 27.568, b: 2.563e-2, c: 0.99072e-5, d: -6.6909e-9 },
        min: 273, max: 1500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: 4, page: 223, k: 1e-3,
        vars: { c1: 0.3343e5, c2: 0.4898e5, c3: 2.036e3, c4: 0.2256e5, c5: 882 },
        min: 100, max: 1500,
      },
      {
        // Burcat & Ruscic ANL-05/20 (2005), NH3
        type: EquationTypeDto.nasa7,
        ref: 9, page: 0,
        vars: {
          low:  [4.30177808e+00,-4.56296030e-03, 2.17005433e-05,-2.28198386e-08, 8.26912560e-12,-6.74847650e+03,-6.93553953e-01],
          high: [2.63459404e+00, 5.66582803e-03,-1.72746311e-06, 2.38750128e-10,-1.25718478e-14,-6.54030950e+03, 6.56365403e+00],
          Tswitch: 1000,
        },
        min: 200, max: 6000,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: 6, page: 475, k: 1e-6,
        vars: { a: -7.874, b: 3.67e-1, c: -4.47e-6 },
        min: 195, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 1,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: 2, page: 838,
        vars: { a: 0.00457, b: 2.3239e-5, c: 1.4810e-7 },
        min: 200, max: 700,
      },
      {
        type: EquationTypeDto.dipprN102,
        ref: 15, page: 324,
        vars: { c1: 9.6608e-6, c2: 1.3799, c3: 0, c4: 0 },
        min: 200, max: 900,
      },
    ],
  },
};

