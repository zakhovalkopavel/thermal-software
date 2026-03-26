import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../dto/ref-key.dto';

/** CO — Carbon monoxide */
export const CO: CompoundValue = {
  name: 'Carbon monoxide',
  chemicalFormula: 'CO',
  Mr: 0.02801,
  enthalpyFormation298: -110.53e3,
  gibbsEnergy298: -137.17e3,
  collisionDiameter: 3.690,
  epsilonToKb: 91.7,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 1.657e-5, T0: 273, S: 136 },
  nasa7: {
    Tswitch: 1000,
    low:  { a1:  3.57953347e+00, a2: -6.10353680e-04, a3:  1.01681433e-06, a4:  9.07005884e-10, a5: -9.04424499e-13, a6: -1.43440860e+04, a7:  3.50840928e+00 },
    high: { a1:  2.71518561e+00, a2:  2.06252743e-03, a3: -9.98825771e-07, a4:  2.30053008e-10, a5: -2.03647716e-14, a6: -1.41518724e+04, a7:  7.81868772e+00 },
  },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 51,
        vars: { a: 29.108, b: -1.9816e-3, c: 4.0034e-6, d: -2.9872e-9, e: 7.0327e-13 },
        min: 50, max: 5000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 28.16, b: 0.1675e-2, c: 0.5372e-5, d: -2.22e-9 },
        min: 273, max: 1800,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 455, k: 1e-6,
        vars: { a: 23.811, b: 5.3944e-1, c: -1.0983e-4 },
        min: 70, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 838,
        vars: { a: 0.00158, b: 8.2511e-5, c: -1.9081e-8 },
        min: 70, max: 1500,
      },
    ],
  },
};

