import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { COMPOUND_LIBRARY } from '../../../chemistry';

/**
 * Air — dry atmospheric air treated as a compound.
 *
 * Bulk Cp / λ correlations live on this object; when a bucket is empty (viscosity),
 * fall back to `composition` and evaluate the mixture of registry species.
 *
 * Composition: ICAO Doc 7488/3 / ISO 2533:1975 dry-air mole fractions
 * (Ne/He/Kr omitted, < 0.001 % effect).
 */
export const Air: CompoundValue = {
  name: 'Air',
  chemicalFormula: '78.084%(v) N2, 20.946%(v) O2, 0.934%(v) Ar, 0.040%(v) CO2',
  Mr: COMPOUND_LIBRARY.Air.molarMass_kg_mol,
  isComposition: true,
  composition: {
    N2:  0.78084,
    O2:  0.20946,
    Ar:  0.00934,
    CO2: 0.00040,
  },
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.6,
  epsilonToKb: 103.3,
  /** CoolProp fluid for Helmholtz ρ and TRANSPORT residual λ */
  coolpropKey: 'Air',
  /** NASA RP-1311 set; N2 78.084, O2 20.9476, Ar 0.9365, CO2 0.0319 % (nasa7.json has no Air) */
  nasa9Key: 'Air',
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 28.11, b: 0.1967e-2, c: 0.4802e-5, d: -1.966e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.dipprN107,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.2896e5, c2: 0.0939e5, c3: 3.012e3, c4: 0.0758e5, c5: 1484 },
        min: 50, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry9, page: 324,
        vars: { c1: 0.00031417, c2: 0.7786, c3: -0.7116, c4: 2121.7 },
        min: 70, max: 2000,
      },
    ],
  },
};
