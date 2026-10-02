import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { COMPOUND_LIBRARY } from '../../../chemistry';

/** NH3 — Ammonia. LJ: ref Poling5, Sutherland: fit to ref NISTWebBook data */
export const NH3: CompoundValue = {
  name: 'Ammonia',
  chemicalFormula: 'NH3',
  Mr: COMPOUND_LIBRARY.NH3.molarMass_kg_mol,
  enthalpyFormation298: -45.9e3,
  gibbsEnergy298: -16.4e3,
  collisionDiameter: 2.9,
  epsilonToKb: 558.3,
  sutherlandParams: { mu0: 9.82e-6, T0: 293, S: 503 },
  nasa7Key: 'NH3',
  /** Burcat & Ruscic set (ATcT), 50–6000 K */
  nasa9Key: 'NH3',
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 53,
        vars: { a: 33.573, b: -1.2581e-2, c: 8.8906e-5, d: -7.1783e-8, e: 1.8569e-11 },
        min: 100, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 27.568, b: 2.563e-2, c: 0.99072e-5, d: -6.6909e-9 },
        min: 273, max: 1500,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.3343e5, c2: 0.4898e5, c3: 2.036e3, c4: 0.2256e5, c5: 882 },
        min: 100, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 475, k: 1e-6,
        vars: { a: -7.874, b: 3.67e-1, c: -4.47e-6 },
        min: 195, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 1,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Incropera, page: 838,
        vars: { a: 0.00457, b: 2.3239e-5, c: 1.4810e-7 },
        min: 200, max: 700,
      },
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry9, page: 324,
        vars: { c1: 9.6608e-6, c2: 1.3799, c3: 0, c4: 0 },
        min: 200, max: 900,
      },
    ],
  },
};

