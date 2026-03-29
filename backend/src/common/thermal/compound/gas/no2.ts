import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** NO2 — Nitrogen dioxide */
export const NO2: CompoundValue = {
  name: 'Nitrogen dioxide',
  chemicalFormula: 'NO2',
  Mr: 0.046,
  enthalpyFormation298: 33.2e3,
  gibbsEnergy298: 51.3e3,
  collisionDiameter: 3.765,
  epsilonToKb: 210,
  nasa7: {
    Tswitch: 1000,
    low:  { a1:  3.94403120e+00, a2: -1.58542900e-03, a3:  1.66578480e-05, a4: -2.04754360e-08, a5:  7.83505640e-12, a6:  2.89660820e+03, a7:  6.31199190e+00 },
    high: { a1:  4.88475400e+00, a2:  2.17239550e-03, a3: -8.28099840e-07, a4:  1.57475100e-10, a5: -1.05189760e-14, a6:  2.31649980e+03, a7: -1.17416950e-01 },
  },
  heatCapacity: {
    def: 1,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 53,
        vars: { a: 32.791, b: -7.4294e-4, c: 8.1722e-5, d: -8.2872e-8, e: 2.4424e-11 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 22.9, b: 5.715e-2, c: -3.52e-5, d: 7.87e-9 },
        min: 273, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 475, k: 1e-6,
        vars: { a: -372.375, b: 2.33, c: -2.15e-3 },
        min: 295, max: 460,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 528,
        vars: { a: -0.01289, b: 1.039e-4, c: -2.1445e-8 },
        min: 298, max: 1000,
      },
    ],
  },
};

