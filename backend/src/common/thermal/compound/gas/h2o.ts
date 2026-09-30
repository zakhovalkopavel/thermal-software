import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** H2O — Water vapour */
export const H2O: CompoundValue = {
  name: 'Water',
  chemicalFormula: 'H2O',
  Mr: 0.018015,
  enthalpyFormation298: -241.83e3,
  gibbsEnergy298: -228.59e3,
  collisionDiameter: 2.641,
  epsilonToKb: 809.1,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 1.12e-5, T0: 350, S: 1064 },
  nasa7Key: 'H2O',
  /** NASA RP-1311 set */
  nasa9Key: 'H2O',
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 51,
        vars: { a: 30.36, b: 9.61e-3, c: 1.184e-6, d: -1.378e-9, e: 6.5e-13 },
        min: 50, max: 6000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 32.24, b: 0.1924e-2, c: 1.055e-5, d: -3.596e-9 },
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
        ref: RefKey.Incropera, page: 838,
        vars: { a: 0.00053, b: 4.7093e-5, c: 4.9551e-8 },
        min: 273, max: 1500,
      },
    ],
  },
};

