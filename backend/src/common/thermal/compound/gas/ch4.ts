import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** CH4 — Methane */
export const CH4: CompoundValue = {
  name: 'Methane',
  chemicalFormula: 'CH4',
  Mr: 0.016043,
  enthalpyFormation298: -74.87e3,
  gibbsEnergy298: -50.76e3,
  collisionDiameter: 3.758,
  epsilonToKb: 148.6,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 1.027e-5, T0: 273, S: 170 },
  nasa7: {
    Tswitch: 1000,
    low:  { a1:  5.14987613e+00, a2: -1.36709788e-02, a3:  4.91800599e-05, a4: -4.84743026e-08, a5:  1.66693956e-11, a6: -1.02466476e+04, a7: -4.64130376e+00 },
    high: { a1:  7.48514950e-02, a2:  1.33909467e-02, a3: -5.73285809e-06, a4:  1.22292535e-09, a5: -1.01815230e-13, a6: -9.46834459e+03, a7:  1.84373180e+01 },
  },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 53,
        vars: { a: 23.64, b: 4.793e-2, c: 1.965e-5, d: -4.468e-8, e: 1.442e-11 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 19.89, b: 5.024e-2, c: 1.269e-5, d: -11.01e-9 },
        min: 273, max: 1500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.1925e5, c2: 0.5176e5, c3: 1.7019e3, c4: 0.3189e5, c5: 757.87 },
        min: 50, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 475, k: 1e-6,
        vars: { a: 3.844, b: 4.0112e-1, c: -1.4303e-4 },
        min: 91, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 838,
        vars: { a: -0.00935, b: 1.4028e-4, c: 3.318e-8 },
        min: 91, max: 1500,
      },
    ],
  },
};

