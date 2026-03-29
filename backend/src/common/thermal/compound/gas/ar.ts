import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/** Ar — Argon (monatomic noble gas) */
export const Ar: CompoundValue = {
  name: 'Argon',
  chemicalFormula: 'Ar',
  Mr: 0.039948,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.542,
  epsilonToKb: 93.3,
  /** ref: White3 — Sutherland parameters, Appendix A */
  sutherlandParams: { mu0: 2.125e-5, T0: 273, S: 144 },
  /**
   * NASA-7 polynomial — McBride, Zehe, Gordon, NASA TM-2002-211556, p. 11.
   * Monatomic ideal gas: Cp/R = 2.5 exactly for all T; both ranges identical.
   * a6 = −h°f/R at 298 K (= 0 J/mol for reference element);
   * a7 = S°/R integration constant.
   */
  nasa7: {
    Tswitch: 1000,
    low:  { a1:  2.50000000e+00, a2:  0.00000000e+00, a3:  0.00000000e+00, a4:  0.00000000e+00, a5:  0.00000000e+00, a6: -7.45375000e+02, a7:  4.37967491e+00 },
    high: { a1:  2.50000000e+00, a2:  0.00000000e+00, a3:  0.00000000e+00, a4:  0.00000000e+00, a5:  0.00000000e+00, a6: -7.45375000e+02, a7:  4.37967491e+00 },
  },
  heatCapacity: {
    def: 0,
    values: [
      {
        // Monatomic ideal gas: Cp = (5/2)·R = 20.786 J/(mol·K), constant
        type: EquationTypeDto.linear,
        ref: RefKey.Yaws1999, page: 51,
        vars: { a: 20.786, b: 0 },
        min: 100, max: 6000,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 473, k: 1e-6,
        vars: { a: 44.997, b: 6.3892e-1, c: -1.2455e-4 },
        min: 150, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry9, page: 324,
        vars: { c1: 0.000633, c2: 0.6221, c3: 70, c4: 0 },
        min: 90, max: 3273.1,
      },
    ],
  },
};
