import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../dto/ref-key.dto';

/**
 * SO3 — Sulfur trioxide.
 * σ and ε/k estimated by method of Patrick & Golden (1983):
 *   σ = 1.18·Vb^(1/3),  Vb = Mr/(ρb·NA), ρb = 1806.8 kg/m³
 *   ε/k = 1.21·Tb,      Tb = 318 K
 */
export const SO3: CompoundValue = {
  name: 'Sulfur trioxide',
  chemicalFormula: 'SO3',
  Mr: 0.080064,
  enthalpyFormation298: -395.7e3,
  gibbsEnergy298: -371.1e3,
  collisionDiameter: 4.19,
  epsilonToKb: 384.8,
  heatCapacity: {
    def: 1,
    values: [
      {
        type: EquationTypeDto.quartic,
        ref: RefKey.Yaws1999, page: 54,
        vars: { a: 22.466, b: 1.1981e-1, c: -9.0842e-5, d: 2.5503e-8, e: -7.9208e-13 },
        min: 100, max: 1500,
      },
      {
        type: EquationTypeDto.cubic,
        ref: RefKey.Borgnakke, page: 911,
        vars: { a: 16.4, b: 14.58e-2, c: -11.2e-5, d: 32.42e-9 },
        min: 273, max: 1300,
      },
      {
        type: EquationTypeDto.alyLee,
        ref: RefKey.Perry7, page: 223, k: 1e-3,
        vars: { c1: 0.3341e5, c2: 0.4968e5, c3: 0.8732e3, c4: 0.2856e5, c5: 393.74 },
        min: 100, max: 1500,
      },
    ],
  },
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 476, k: 1e-6,
        vars: { a: -12.039, b: 5.43e-1, c: -1.6e-4 },
        min: 298, max: 694,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.quadratic,
        ref: RefKey.Yaws1999, page: 529,
        vars: { a: -0.00354, b: 5.0217e-5, c: -5.5547e-9 },
        min: 275, max: 998,
      },
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry9, page: 330,
        vars: { c1: 1.0702, c2: -0.2348, c3: 2010.4, c4: 1277000 },
        min: 317.9, max: 1000,
      },
    ],
  },
};

