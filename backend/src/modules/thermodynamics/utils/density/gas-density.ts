import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { STANDARD_CONDITIONS } from '../../../../common/thermal/constants/standard-conditions.constants';
import { GAS_REGISTRY } from '../../../../common/thermal/compound/gas/registry';
import { CompoundValue } from '../../../../common/thermal/interfaces/compound-value.interface';
import { Species } from '../../enums/species.enum';
import { PengRobinsonFluidParams } from '../../types/peng-robinson-fluid-params.type';
import { HelmholtzDensity } from './helmholtz-density';
import { PengRobinson } from './peng-robinson';

/**
 * Gas mass density [kg/m³] selection:
 * CoolProp Helmholtz → Peng–Robinson (T_c,P_c,ω) → limited ideal gas.
 * Refs: [CoolProp], [Poling5].
 */
export class GasDensity {
  /** Ideal-gas density ρ = P·M / (R·T) [kg/m³] (no validity check). */
  static ideal(
    M_kg_mol: number,
    T_K: number,
    P_Pa = STANDARD_CONDITIONS.PRESSURE_PA,
  ): number {
    return (P_Pa * M_kg_mol) / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T_K);
  }

  /**
   * Density for a compound: Helmholtz → Peng–Robinson → limited ideal gas.
   */
  static forCompound(
    compound: CompoundValue,
    T_K: number,
    P_Pa = STANDARD_CONDITIONS.PRESSURE_PA,
  ): number {
    if (compound.coolpropKey) {
      return HelmholtzDensity.pureMassDensity(compound.coolpropKey, T_K, P_Pa);
    }
    if (compound.composition && Object.keys(compound.composition).length > 0) {
      return GasDensity.forMixture(
        compound.composition as Partial<Record<Species, number>>,
        T_K,
        P_Pa,
      );
    }
    const pr = GasDensity.prParams(compound);
    if (pr) return PengRobinson.pureMassDensity(pr, T_K, P_Pa);
    PengRobinson.assertIdealGasAllowed(P_Pa, compound.criticalPressure);
    return GasDensity.ideal(compound.Mr, T_K, P_Pa);
  }

  /**
   * Mixture density: all CoolProp → Helmholtz; else all PR-capable → PR mix;
   * else limited ideal gas when every species allows it.
   */
  static forMixture(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_Pa = STANDARD_CONDITIONS.PRESSURE_PA,
  ): number {
    const species: Species[] = [];
    const ys: number[] = [];
    const coolpropKeys: string[] = [];
    const prFluids: PengRobinsonFluidParams[] = [];
    let M = 0;
    let allCoolprop = true;
    let allPr = true;
    let maxPc: number | undefined;

    for (const [sp, y] of Object.entries(moleFractions) as [Species, number][]) {
      if (!y || y <= 0) continue;
      const compound = GAS_REGISTRY[sp];
      if (!compound) {
        allCoolprop = false;
        allPr = false;
        continue;
      }
      species.push(sp);
      ys.push(y);
      M += y * compound.Mr;
      if (compound.coolpropKey) coolpropKeys.push(compound.coolpropKey);
      else allCoolprop = false;
      const pr = GasDensity.prParams(compound);
      if (pr) prFluids.push(pr);
      else allPr = false;
      if (compound.criticalPressure !== undefined) {
        maxPc = maxPc === undefined
          ? compound.criticalPressure
          : Math.max(maxPc, compound.criticalPressure);
      }
    }

    if (species.length === 0) return GasDensity.ideal(M, T_K, P_Pa);

    if (allCoolprop && coolpropKeys.length === species.length) {
      if (coolpropKeys.length === 1) {
        return HelmholtzDensity.pureMassDensity(coolpropKeys[0], T_K, P_Pa);
      }
      return HelmholtzDensity.mixtureMassDensity(coolpropKeys, ys, T_K, P_Pa);
    }

    if (allPr && prFluids.length === species.length) {
      if (prFluids.length === 1) {
        return PengRobinson.pureMassDensity(prFluids[0], T_K, P_Pa);
      }
      return PengRobinson.mixtureMassDensity(prFluids, ys, T_K, P_Pa);
    }

    // Ideal gas only if every species lacks PR params but stays inside the envelope.
    // Use the strictest Pc (highest) when checking Pr = P/Pc.
    PengRobinson.assertIdealGasAllowed(P_Pa, maxPc);
    return GasDensity.ideal(M, T_K, P_Pa);
  }

  private static prParams(compound: CompoundValue): PengRobinsonFluidParams | undefined {
    if (!PengRobinson.hasParams(compound)) return undefined;
    return {
      Mr: compound.Mr,
      Tc: compound.criticalTemperature!,
      Pc: compound.criticalPressure!,
      omega: compound.acentricFactor!,
    };
  }
}
