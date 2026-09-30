import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** O2 — Oxygen */
export const O2: CompoundValue = {
  name: 'Oxygen',
  chemicalFormula: 'O2',
  Mr: 0.031999,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.467,
  epsilonToKb: 106.7,
  /** ref: White3 — Sutherland parameters, Appendix A */
  sutherlandParams: { mu0: 1.919e-5, T0: 273, S: 127 },
  nasa7Key: 'O2',
  // no nasa9Key: nasa9.json "O2" holds singlet O2 (H(298) = +94.4 kJ/mol)
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 53,
        vars: { a: 29.526, b: -8.8999e-3, c: 3.8083e-5, d: -3.2629e-8, e: 8.8607e-12 },
        min: 50, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 25.48, b: 1.52e-2, c: -0.7155e-5, d: 1.312e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linearHyperbolic,
        ref: RefKey.Szargut, page: 268,
        vars: { a: 29.98, b: 4.2e-3, d: -1.7e5 },
        min: 298, max: 3000,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.291e5, c2: 0.1004e5, c3: 2.5265e3, c4: 0.0936e5, c5: 1153.8 },
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
        vars: { a: 44.224, b: 5.62e-1, c: -1.13e-4 },
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
        vars: { a: 0.00121, b: 8.6157e-5, c: -1.3346e-8 },
        min: 80, max: 1500,
      },
    ],
  },
};

