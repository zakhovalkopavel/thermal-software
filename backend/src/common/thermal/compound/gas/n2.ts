import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * N2 — Nitrogen
 * NASA-7 coefficients: McBride, Zehe, Gordon — NASA TM-2002-211556 (2002)
 */
export const N2: CompoundValue = {
  name: 'Nitrogen',
  chemicalFormula: 'N2',
  Mr: 0.028014,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.798,
  epsilonToKb: 71.4,
  /** Sutherland: White, F.M. "Viscous Fluid Flow" 3rd ed. Appendix A */
  sutherlandParams: { mu0: 1.663e-5, T0: 273, S: 107 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 53,
        vars: { a: 29.342, b: -3.5395e-3, c: 1.0076e-5, d: -4.3116e-9, e: 2.5935e-13 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 28.9, b: -0.1571e-2, c: 0.8081e-5, d: -2.873e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linear,
        ref: 1, page: 268,
        vars: { a: 27.88, b: 4.27e-3 },
        min: 298, max: 2500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: 4, page: 223, k: 1e-3,
        vars: { c1: 0.2911e5, c2: 0.0861e5, c3: 1.7016e3, c4: 0.001e5, c5: 909.79 },
        min: 50, max: 1500,
      },
      {
        // NASA TM-2002-211556, McBride et al. 2002, species N2
        type: EquationTypeDto.nasa7,
        ref: 8, page: 0,
        vars: {
          low:  [3.53100528e+00,-1.23660987e-04,-5.02999433e-07, 2.43530612e-09,-1.40881235e-12,-1.04697628e+03, 2.96747468e+00],
          high: [2.95257626e+00, 1.39690040e-03,-4.92631603e-07, 7.86010195e-11,-4.60755204e-15,-9.23948688e+02, 5.87188762e+00],
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
        vars: { a: 42.606, b: 4.75e-1, c: -9.88e-5 },
        min: 150, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: 2, page: 839,
        vars: { a: 0.00309, b: 7.5930e-5, c: -1.1014e-8 },
        min: 78, max: 1500,
      },
      {
        type: EquationTypeDto.dipprN102,
        ref: 15, page: 328,
        vars: { c1: 0.00033143, c2: 0.7722, c3: 16.323, c4: 373.72 },
        min: 63.15, max: 2000,
      },
    ],
  },
};

