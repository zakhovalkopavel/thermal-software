import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * O2 — Oxygen
 * NASA-7: McBride et al. NASA TM-2002-211556 (2002)
 */
export const O2: CompoundValue = {
  name: 'Oxygen',
  chemicalFormula: 'O2',
  Mr: 0.031999,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.467,
  epsilonToKb: 106.7,
  /** Sutherland: White, F.M. "Viscous Fluid Flow" 3rd ed. Appendix A */
  sutherlandParams: { mu0: 1.919e-5, T0: 273, S: 127 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 53,
        vars: { a: 29.526, b: -8.8999e-3, c: 3.8083e-5, d: -3.2629e-8, e: 8.8607e-12 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 25.48, b: 1.52e-2, c: -0.7155e-5, d: 1.312e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linearHyperbolic,
        ref: 1, page: 268,
        vars: { a: 29.98, b: 4.2e-3, d: -1.7e5 },
        min: 298, max: 3000,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: 4, page: 223, k: 1e-3,
        vars: { c1: 0.291e5, c2: 0.1004e5, c3: 2.5265e3, c4: 0.0936e5, c5: 1153.8 },
        min: 50, max: 1500,
      },
      {
        // NASA TM-2002-211556
        type: EquationTypeDto.nasa7,
        ref: 8, page: 0,
        vars: {
          low:  [3.78245636e+00,-2.99673416e-03, 9.84730201e-06,-9.68129509e-09, 3.24372837e-12,-1.06394356e+03, 3.65767573e+00],
          high: [3.28253784e+00, 1.48308754e-03,-7.57966669e-07, 2.09470555e-10,-2.16717794e-14,-1.08845772e+03, 5.45323129e+00],
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
        vars: { a: 44.224, b: 5.62e-1, c: -1.13e-4 },
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
        vars: { a: 0.00121, b: 8.6157e-5, c: -1.3346e-8 },
        min: 80, max: 1500,
      },
    ],
  },
};

