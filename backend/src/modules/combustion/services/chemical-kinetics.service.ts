import { Injectable } from '@nestjs/common';
import { Species } from '../../thermodynamics/enums';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants';
import { BED_KINETICS, BED_REACTIONS, COMBUSTION } from '../constants';
import { GasFlows } from '../types';
import { EffectiveDiffusion, SurfaceRates, GasPhaseRates } from '../interfaces';

/**
 * Char surface and gas-phase reaction rates — port of legacy
 * furnaceCombustion/modules/ChemicalKinetics.js. Reaction constants in BED_REACTIONS (verbatim).
 * Rates in mol/(m³ bed·s) with partial pressures in atm.
 */
@Injectable()
export class ChemicalKineticsService {

  /** Arrhenius rate constant k = A·exp(−E/(R·T)) */
  arrhenius(A: number, E_Jmol: number, T_K: number): number {
    return A * Math.exp(-E_Jmol / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T_K));
  }

  /**
   * Internal effectiveness factor of a spherical particle (Thiele modulus φ = R·√(k/D)):
   * η = 3/φ²·(φ·coth φ − 1); η = 1 for φ < PHI_MIN or unknown D.
   */
  effectiveness(k: number, D_eff_m2s: number, R_p_m: number): number {
    if (!D_eff_m2s || D_eff_m2s <= 0) return 1;
    const phi = R_p_m * Math.sqrt(k / D_eff_m2s);
    if (phi < BED_KINETICS.PHI_MIN) return 1;
    return (3 / (phi * phi)) * (phi / Math.tanh(phi) - 1);
  }

  /** Kinetic temperature — log-mean of char and gas temperatures */
  kineticTemperature(T_gas_K: number, T_solid_K: number): number {
    if (Math.abs(T_solid_K - T_gas_K) < BED_KINETICS.KINETIC_T_REL_TOL * T_gas_K) return T_gas_K;
    return (T_solid_K - T_gas_K) / Math.log(T_solid_K / T_gas_K);
  }

  surfaceRates(
    y: GasFlows, T_gas_K: number, T_solid_K: number,
    bed: { porosity: number; activityFactor: number },
    D: EffectiveDiffusion, R_p_m: number, P_atm = 1,
  ): SurfaceRates {
    const { E, A } = BED_REACTIONS;
    const p = (sp: Species): number => (y[sp] ?? 0) * P_atm;
    const T = this.kineticTemperature(T_gas_K, T_solid_K);
    const act = bed.activityFactor;
    const a_s = 3 * (1 - bed.porosity) / R_p_m;

    const k1  = this.arrhenius(A.A1,  E.E1,  T);
    const k2  = this.arrhenius(A.A2,  E.E2,  T);
    const k3  = this.arrhenius(A.A3,  E.E3,  T);
    const k31 = this.arrhenius(A.A31, E.E31, T);
    const k32 = this.arrhenius(A.A32, E.E32, T);
    const k33 = this.arrhenius(A.A33, E.E33, T);

    return {
      r1:  this.effectiveness(k1,  D.O2,  R_p_m) * act * a_s * k1  * p(Species.O2),
      r2:  this.effectiveness(k2,  D.O2,  R_p_m) * act * a_s * k2  * p(Species.O2),
      r3:  this.effectiveness(k3,  D.CO2, R_p_m) * act * a_s * k3  * (p(Species.CO2) - p(Species.CO)),
      r31: this.effectiveness(k31, D.H2O, R_p_m) * act * a_s * k31 * p(Species.H2O),
      r32: this.effectiveness(k32, D.H2O, R_p_m) * act * a_s * k32 * p(Species.H2O) ** 2,
      // hydrogen is not diffusion-limited in the solid (legacy)
      r33: act * a_s * k33 * p(Species.H2) ** 2,
      a_s,
    };
  }

  /**
   * Gas-phase rates. The water-gas shift reverse rate uses k_rev = k_fwd / Kp with the
   * NASA-7 equilibrium constant (legacy used a coarse ln K fit).
   */
  gasPhaseRates(y: GasFlows, T_K: number, wgsKp: number, P_atm = 1): GasPhaseRates {
    const { E, A } = BED_REACTIONS;
    const p = (sp: Species): number => (y[sp] ?? 0) * P_atm;
    const k4  = this.arrhenius(A.A4,  E.E4,  T_K);
    const k41 = this.arrhenius(A.A41, E.E41, T_K);
    const k42 = this.arrhenius(A.A42, E.E42, T_K);
    const k43 = this.arrhenius(A.A43, E.E43, T_K);
    return {
      r4:  k4  * p(Species.CO) ** 2 * p(Species.O2),
      r41: k41 * p(Species.H2) ** 2 * p(Species.O2),
      r42: k42 * p(Species.CH4) * p(Species.O2) ** 2,
      r43: k43 * p(Species.CO) * p(Species.H2O) - (k43 / Math.max(wgsKp, COMBUSTION.DIVISION_FLOOR)) * p(Species.CO2) * p(Species.H2),
    };
  }

  /** Surface heat release [W] of given surface reaction extents [mol/s] (legacy heats) */
  surfaceHeatRelease_W(x: Pick<SurfaceRates, 'r1' | 'r2' | 'r3' | 'r31' | 'r32' | 'r33'>): number {
    const H = BED_REACTIONS.DH;
    return -(x.r1 * H.dH1 + x.r2 * 2 * H.dH2 + x.r3 * H.dH3 + x.r31 * H.dH31 + x.r32 * H.dH32 + x.r33 * H.dH33);
  }
}
