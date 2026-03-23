import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * Air — dry atmospheric air
 * Composition: 78.084%(v) N2, 20.946%(v) O2, 0.934%(v) Ar, 0.0412%(v) CO2
 * Mr = 0.028951 kg/mol (mean molar mass of dry air)
 * σ, ε/k from Chapman-Enskog: σ = 3.6 Å, ε/k = 103.3 K
 * Source: legacy/scripts/src/compound/gas/air.ts
 */
export const Air: CompoundValue = {
  name: 'Air',
  chemicalFormula: '78.084%(v) N2, 20.946%(v) O2, 0.934%(v) Ar, 0.0412%(v) CO2',
  Mr: 0.028951,
  enthalpyFormation298: 0,
  gibbsEnergy298: 0,
  collisionDiameter: 3.6,
  epsilonToKb: 103.3,
  heatCapacity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.cubic,
        ref: 5, page: 911,
        vars: { a: 28.11, b: 0.1967e-2, c: 0.4802e-5, d: -1.966e-9 },
        min: 273, max: 1800,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: 4, page: 223, k: 1e-3,
        vars: { c1: 0.2896e5, c2: 0.0939e5, c3: 3.012e3, c4: 0.0758e5, c5: 1484 },
        min: 50, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      // Air viscosity not in legacy source; Sutherland: μ0=1.716e-5 Pa·s, T0=273.15 K, S=110.4 K
      // Source: Sutherland (1893), White "Viscous Fluid Flow" 3rd ed. App. A
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: 15, page: 324,
        vars: { c1: 0.00031417, c2: 0.7786, c3: -0.7116, c4: 2121.7 },
        min: 70, max: 2000,
      },
    ],
  },
};

