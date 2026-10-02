import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { COMPOUND_LIBRARY } from '../../../chemistry';

/** Ar — Argon (monatomic noble gas) */
export const Ar: CompoundValue = {
  name: 'Argon',
  chemicalFormula: 'Ar',
  Mr: COMPOUND_LIBRARY.Ar.molarMass_kg_mol,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.542,
  epsilonToKb: 93.3,
  /** ref: White3 — Sutherland parameters, Appendix A */
  sutherlandParams: { mu0: 2.125e-5, T0: 273, S: 144 },
  nasa7Key: 'Ar',
  /** NASA RP-1311 set */
  nasa9Key: 'Ar',
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
