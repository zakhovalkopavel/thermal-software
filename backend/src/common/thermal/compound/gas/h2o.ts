import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * H2O — Water vapour
 * NASA-7: McBride et al. NASA TM-2002-211556 (2002)
 */
export const H2O: CompoundValue = {
  name: 'Water',
  chemicalFormula: 'H2O',
  Mr: 0.018015,
  enthalpyFormation298: -241.83e3,
  gibbsEnergy298: -228.59e3,
  collisionDiameter: 2.641,
  epsilonToKb: 809.1,
  /** Sutherland: legacy/furnaceCombustion/classes/TransportProperties.js */
  sutherlandParams: { mu0: 1.12e-5, T0: 350, S: 1064 },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: 6, page: 51,
        vars: { a: 30.36, b: 9.61e-3, c: 1.184e-6, d: -1.378e-9, e: 6.5e-13 },
        min: 50, max: 6000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 32.24, b: 0.1924e-2, c: 1.055e-5, d: -3.596e-9 },
        min: 273, max: 1800,
      },
      {
        // NASA TM-2002-211556
        type: EquationTypeDto.nasa7,
        ref: 8, page: 0,
        vars: {
          low:  [4.19864056e+00,-2.03643410e-03, 6.52040211e-06,-5.48797062e-09, 1.77197817e-12,-3.02937267e+04,-8.49032208e-01],
          high: [3.03399249e+00, 2.17691804e-03,-1.64072518e-07,-9.70419870e-11, 1.68200992e-14,-3.00042971e+04, 4.96677010e+00],
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
        vars: { a: -36.826, b: 4.29e-1, c: -1.62e-5 },
        min: 373, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: 2, page: 838,
        vars: { a: 0.00053, b: 4.7093e-5, c: 4.9551e-8 },
        min: 273, max: 1500,
      },
    ],
  },
};

