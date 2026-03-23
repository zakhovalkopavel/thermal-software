import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * H2 — Hydrogen
 * NASA-7: McBride et al. NASA TM-2002-211556 (2002)
 */
export const H2: CompoundValue = {
  name: 'Hydrogen',
  chemicalFormula: 'H2',
  Mr: 0.002016,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 2.827,
  epsilonToKb: 59.7,
  /** Sutherland: legacy/furnaceCombustion/classes/TransportProperties.js */
  sutherlandParams: { mu0: 8.411e-6, T0: 273, S: 97 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 53,
        vars: { a: 29.11, b: -1.916e-3, c: 4.003e-6, d: -8.704e-10, e: 0.0 },
        min: 50, max: 3000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 29.11, b: -0.1916e-2, c: 0.4003e-5, d: -0.8704e-9 },
        min: 273, max: 1800,
      },
      {
        // NASA TM-2002-211556
        type: EquationTypeDto.nasa7,
        ref: 8, page: 0,
        vars: {
          low:  [2.34433112e+00, 7.98052075e-03,-1.94781510e-05, 2.01572094e-08,-7.37611761e-12,-9.17935173e+02, 6.83010238e-01],
          high: [3.33727920e+00,-4.94024731e-05, 4.99456778e-07,-1.79566394e-10, 2.00255376e-14,-9.50158922e+02,-3.20502331e+00],
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
        ref: 2, page: 838,
        vars: { a: 0.03951, b: 4.5918e-4, c: -6.4933e-8 },
        min: 14, max: 1500,
      },
    ],
  },
};

