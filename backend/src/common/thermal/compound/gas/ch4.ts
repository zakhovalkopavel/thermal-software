import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * CH4 — Methane
 * NASA-7: McBride et al. NASA TM-2002-211556 (2002)
 */
export const CH4: CompoundValue = {
  name: 'Methane',
  chemicalFormula: 'CH4',
  Mr: 0.016043,
  enthalpyFormation298: -74.87e3,
  gibbsEnergy298: -50.76e3,
  collisionDiameter: 3.758,
  epsilonToKb: 148.6,
  /** Sutherland: legacy/furnaceCombustion/classes/TransportProperties.js */
  sutherlandParams: { mu0: 1.027e-5, T0: 273, S: 170 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 53,
        vars: { a: 23.64, b: 4.793e-2, c: 1.965e-5, d: -4.468e-8, e: 1.442e-11 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 19.89, b: 5.024e-2, c: 1.269e-5, d: -11.01e-9 },
        min: 273, max: 1500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: 4, page: 223, k: 1e-3,
        vars: { c1: 0.1925e5, c2: 0.5176e5, c3: 1.7019e3, c4: 0.3189e5, c5: 757.87 },
        min: 50, max: 1500,
      },
      {
        // NASA TM-2002-211556
        type: EquationTypeDto.nasa7,
        ref: 8, page: 0,
        vars: {
          low:  [5.14987613e+00,-1.36709788e-02, 4.91800599e-05,-4.84743026e-08, 1.66693956e-11,-1.02466476e+04,-4.64130376e+00],
          high: [7.48514950e-02, 1.33909467e-02,-5.73285809e-06, 1.22292535e-09,-1.01815230e-13,-9.46834459e+03, 1.84373180e+01],
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
        ref: 2, page: 838,
        vars: { a: -0.00935, b: 1.4028e-4, c: 3.318e-8 },
        min: 91, max: 1500,
      },
    ],
  },
};

