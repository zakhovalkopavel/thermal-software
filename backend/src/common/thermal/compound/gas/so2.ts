import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../dto/ref-key.dto';

/** SO2 — Sulfur dioxide */
export const SO2: CompoundValue = {
  name: 'Sulfur dioxide',
  chemicalFormula: 'SO2',
  Mr: 0.064065,
  enthalpyFormation298: -296.8e3,
  gibbsEnergy298: -300.1e3,
  collisionDiameter: 4.112,
  epsilonToKb: 335.4,
  heatCapacity: {
    def: 1,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Incropera, page: 834,
        vars: { a: 29.637, b: 3.4735e-2, c: 9.2903e-6, d: -2.9885e-8, e: 1.0937e-11 },
        min: 100, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 25.78, b: 5.795e-2, c: -3.812e-5, d: 8.612e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linearHyperbolic,
        ref: RefKey.Szargut, page: 274,
        vars: { a: 178.11, b: 10.63e-3, d: -5.94e5 },
        min: 298, max: 1800,
      },
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Perry7, page: 208,
        vars: { a: 7.7, b: 0.0053, c: -8.3e-7 },
        min: 300, max: 2500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.3338e5, c2: 0.2586e5, c3: 0.9328e3, c4: 0.1088e5, c5: 423.7 },
        min: 100, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 476, k: 1e-6,
        vars: { a: -11.103, b: 5.02e-1, c: -1.08e-4 },
        min: 200, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 839,
        vars: { a: -0.00394, b: 4.4847e-5, c: 2.1066e-9 },
        min: 198, max: 1000,
      },
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry9, page: 330,
        vars: { c1: 10.527, c2: -0.7732, c3: -1333, c4: 1506400 },
        min: 250, max: 900,
      },
    ],
  },
};

