import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** H2 — Hydrogen */
export const H2: CompoundValue = {
  name: 'Hydrogen',
  chemicalFormula: 'H2',
  Mr: 0.002016,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 2.827,
  epsilonToKb: 59.7,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 8.411e-6, T0: 273, S: 97 },
  nasa7: {
    Tswitch: 1000,
    low:  { a1:  2.34433112e+00, a2:  7.98052075e-03, a3: -1.94781510e-05, a4:  2.01572094e-08, a5: -7.37611761e-12, a6: -9.17935173e+02, a7:  6.83010238e-01 },
    high: { a1:  3.33727920e+00, a2: -4.94024731e-05, a3:  4.99456778e-07, a4: -1.79566394e-10, a5:  2.00255376e-14, a6: -9.50158922e+02, a7: -3.20502331e+00 },
  },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 53,
        vars: { a: 29.11, b: -1.916e-3, c: 4.003e-6, d: -8.704e-10, e: 0.0 },
        min: 50, max: 3000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 29.11, b: -0.1916e-2, c: 0.4003e-5, d: -0.8704e-9 },
        min: 273, max: 1800,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 475, k: 1e-6,
        vars: { a: 27.758, b: 2.12e-1, c: -3.28e-5 },
        min: 14, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 838,
        vars: { a: 0.03951, b: 4.5918e-4, c: -6.4933e-8 },
        min: 14, max: 1500,
      },
    ],
  },
};

