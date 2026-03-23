import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * CO2 — Carbon dioxide
 * NASA-7: McBride et al. NASA TM-2002-211556 (2002)
 */
export const CO2: CompoundValue = {
  name: 'Carbon dioxide',
  chemicalFormula: 'CO2',
  Mr: 0.04401,
  enthalpyFormation298: -393.51e3,
  gibbsEnergy298: -394.38e3,
  collisionDiameter: 3.941,
  epsilonToKb: 195.2,
  /** Sutherland: legacy/furnaceCombustion/classes/TransportProperties.js */
  sutherlandParams: { mu0: 1.370e-5, T0: 273, S: 222 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 51,
        vars: { a: 27.437, b: 4.2315e-2, c: -1.9555e-5, d: 3.9968e-9, e: -2.9872e-13 },
        min: 50, max: 5000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 22.26, b: 5.981e-2, c: -3.501e-5, d: 7.469e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linearHyperbolic,
        ref: 1, page: 268,
        vars: { a: 44.17, b: 9.04e-3, d: -8.54e5 },
        min: 298, max: 2500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: 4, page: 223, k: 1e-3,
        vars: { c1: 0.2937e5, c2: 0.3454e5, c3: 1.428e3, c4: 0.264e5, c5: 588 },
        min: 50, max: 5000,
      },
      {
        // NASA TM-2002-211556
        type: EquationTypeDto.nasa7,
        ref: 8, page: 0,
        vars: {
          low:  [2.35677352e+00, 8.98459677e-03,-7.12356269e-06, 2.45919022e-09,-1.43699548e-13,-4.83719697e+04, 9.90105222e+00],
          high: [4.63659493e+00, 2.74131991e-03,-9.95828542e-07, 1.60373011e-10,-9.16103468e-15,-4.90249392e+04,-1.93489550e+00],
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
        ref: 6, page: 455, k: 1e-6,
        vars: { a: 11.811, b: 4.9838e-1, c: -1.0851e-4 },
        min: 195, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: 2, page: 838,
        vars: { a: -0.012, b: 1.0208e-4, c: -2.2403e-8 },
        min: 195, max: 1500,
      },
    ],
  },
};

