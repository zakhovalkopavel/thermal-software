import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../dto/ref-key.dto';

/** N2 — Nitrogen */
export const N2: CompoundValue = {
  name: 'Nitrogen',
  chemicalFormula: 'N2',
  Mr: 0.028014,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.798,
  epsilonToKb: 71.4,
  /** ref: White3 — Sutherland parameters, Appendix A */
  sutherlandParams: { mu0: 1.663e-5, T0: 273, S: 107 },
  nasa7: {
    Tswitch: 1000,
    low:  { a1: 3.53100528e+00, a2: -1.23660987e-04, a3: -5.02999433e-07, a4:  2.43530612e-09, a5: -1.40881235e-12, a6: -1.04697628e+03, a7:  2.96747468e+00 },
    high: { a1: 2.95257626e+00, a2:  1.39690040e-03, a3: -4.92631603e-07, a4:  7.86010195e-11, a5: -4.60755204e-15, a6: -9.23948688e+02, a7:  5.87188762e+00 },
  },
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 53,
        vars: { a: 29.342, b: -3.5395e-3, c: 1.0076e-5, d: -4.3116e-9, e: 2.5935e-13 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 28.9, b: -0.1571e-2, c: 0.8081e-5, d: -2.873e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linear,
        ref: RefKey.Szargut, page: 268,
        vars: { a: 27.88, b: 4.27e-3 },
        min: 298, max: 2500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.2911e5, c2: 0.0861e5, c3: 1.7016e3, c4: 0.001e5, c5: 909.79 },
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
        vars: { a: 42.606, b: 4.75e-1, c: -9.88e-5 },
        min: 150, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 839,
        vars: { a: 0.00309, b: 7.5930e-5, c: -1.1014e-8 },
        min: 78, max: 1500,
      },
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry9, page: 328,
        vars: { c1: 0.00033143, c2: 0.7722, c3: 16.323, c4: 373.72 },
        min: 63.15, max: 2000,
      },
    ],
  },
};

