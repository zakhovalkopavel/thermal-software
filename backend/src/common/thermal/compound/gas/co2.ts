import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { COMPOUND_LIBRARY } from '../../../chemistry';

/** CO2 — Carbon dioxide */
export const CO2: CompoundValue = {
  name: 'Carbon dioxide',
  chemicalFormula: 'CO2',
  Mr: COMPOUND_LIBRARY.CO2.molarMass_kg_mol,
  enthalpyFormation298: -393.51e3,
  gibbsEnergy298: -394.38e3,
  collisionDiameter: 3.941,
  epsilonToKb: 195.2,
  /** ref: White3 — Sutherland parameters */
  sutherlandParams: { mu0: 1.370e-5, T0: 273, S: 222 },
  nasa7Key: 'CO2',
  // no nasa9Key: nasa9.json "CO2" holds another species (H(298) = +49.6 kJ/mol)
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 51,
        vars: { a: 27.437, b: 4.2315e-2, c: -1.9555e-5, d: 3.9968e-9, e: -2.9872e-13 },
        min: 50, max: 5000,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 22.26, b: 5.981e-2, c: -3.501e-5, d: 7.469e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.linearHyperbolic,
        ref: RefKey.Szargut, page: 268,
        vars: { a: 44.17, b: 9.04e-3, d: -8.54e5 },
        min: 298, max: 2500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.2937e5, c2: 0.3454e5, c3: 1.428e3, c4: 0.264e5, c5: 588 },
        min: 50, max: 5000,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 455, k: 1e-6,
        vars: { a: 11.811, b: 4.9838e-1, c: -1.0851e-4 },
        min: 195, max: 1500,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 838,
        vars: { a: -0.012, b: 1.0208e-4, c: -2.2403e-8 },
        min: 195, max: 1500,
      },
    ],
  },
};

