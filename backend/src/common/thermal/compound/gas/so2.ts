import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** SO2 — Sulfur dioxide */
export const SO2: CompoundValue = {
  name: 'Sulfur dioxide',
  chemicalFormula: 'SO2',
  Mr: 0.064065,
  enthalpyFormation298: -296.8e3,
  gibbsEnergy298: -300.1e3,
  collisionDiameter: 4.112,
  epsilonToKb: 335.4,
  nasa7: {
    Tswitch: 1000,
    low:  {
      a1: 5.38423482e+00,
      a2: 1.67930560e-03,
      a3: -6.32062944e-07,
      a4: 1.08465348e-10,
      a5: -6.66890336e-15,
      a6: -3.76067022e+04,
      a7: -1.83130517e+00,
    },
    high: {
      a1: 3.67480752e+00,
      a2: 2.28302107e-03,
      a3: 8.46893049e-06,
      a4: -1.36562039e-08,
      a5: 5.76271873e-12,
      a6: -3.69455073e+04,
      a7: 7.96866430e+00,
    },
  },
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
