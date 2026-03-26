import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** CO2 — Carbon dioxide */
export const CO2: CompoundValue = {
  name: 'Carbon dioxide',
  chemicalFormula: 'CO2',
  Mr: 0.04401,
  enthalpyFormation298: -393.51e3,
  gibbsEnergy298: -394.38e3,
  collisionDiameter: 3.941,
  epsilonToKb: 195.2,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 1.370e-5, T0: 273, S: 222 },
  nasa7: {
    Tswitch: 1000,
    low:  { a1:  2.35677352e+00, a2:  8.98459677e-03, a3: -7.12356269e-06, a4:  2.45919022e-09, a5: -1.43699548e-13, a6: -4.83719697e+04, a7:  9.90105222e+00 },
    high: { a1:  4.63659493e+00, a2:  2.74131991e-03, a3: -9.95828542e-07, a4:  1.60373011e-10, a5: -9.16103468e-15, a6: -4.90249392e+04, a7: -1.93489550e+00 },
  },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 51,
        vars: { a: 27.437, b: 4.2315e-2, c: -1.9555e-5, d: 3.9968e-9, e: -2.9872e-13 },
        min: 50, max: 5000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 22.26, b: 5.981e-2, c: -3.501e-5, d: 7.469e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linearHyperbolic,
        ref: RefKey.Szargut, page: 268,
        vars: { a: 44.17, b: 9.04e-3, d: -8.54e5 },
        min: 298, max: 2500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.2937e5, c2: 0.3454e5, c3: 1.428e3, c4: 0.264e5, c5: 588 },
        min: 50, max: 5000,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 455, k: 1e-6,
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
        ref: RefKey.Incropera, page: 838,
        vars: { a: -0.012, b: 1.0208e-4, c: -2.2403e-8 },
        min: 195, max: 1500,
      },
    ],
  },
};

