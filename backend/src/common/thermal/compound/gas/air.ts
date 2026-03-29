import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * Air — dry atmospheric air treated as a pseudo-pure compound.
 *
 * Marked with `isComposition: true` because air is not a single pure substance —
 * its exact mole-fraction breakdown is provided in
 * `compound/composition/air.composition.ts` (`AIR_MOLE_COMPOSITION`).
 *
 * Thermophysical property correlations (Cp, λ) are valid for the bulk mixture
 * without requiring per-species resolution.
 *
 * References:
 *   ICAO Doc 7488/3 — Manual of the ICAO Standard Atmosphere, 3rd ed. (1993).
 *   ISO 2533:1975   — Standard Atmosphere.
 */
export const Air: CompoundValue = {
  name: 'Air',
  chemicalFormula: '78.084%(v) N2, 20.946%(v) O2, 0.934%(v) Ar, 0.040%(v) CO2',
  Mr: 0.028951,
  isComposition: true,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.6,
  epsilonToKb: 103.3,
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
        type: EquationTypeDto.alyLee,
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
