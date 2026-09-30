import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * C4H10 — n-Butane.
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const C4H10: CompoundValue = {
  name: 'n-Butane',
  chemicalFormula: 'C4H10',
  Mr: 0.058124,
  /** ref: Perry9 Table 2-95, p. 2-167, no. 31 (Butane) — −12.579, −1.67 (J/kmol × 1E-07) */
  enthalpyFormation298: -125790,
  gibbsEnergy298: -16700,
  collisionDiameter: 4.687,
  epsilonToKb: 531.4,
  /** ref: Eakin1963 Table 1 — B = 6.861 μP, S = 600.0 °R; exact unit conversion to T0 = 273.15 K */
  sutherlandParams: { mu0: 6.8518e-6, T0: 273.15, S: 333.33 },
  nasa7Key: 'C4H10,n-butane',
  /** NASA RP-1311 set */
  nasa9Key: 'C4H10,n-butane',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 3.4387e-8, c2: 0.94604, c3: 0, c4: 0 },
        min: 134.86, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 0.051094, c2: 0.45253, c3: 5455.5, c4: 1979800 },
        min: 272.65, max: 1000,
      },
    ],
  },
};
