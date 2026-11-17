import { Injectable } from '@nestjs/common';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { STANDARD_CONDITIONS } from '../../../common/thermal/constants/standard-conditions.constants';
import { heatCapacityEntries } from '../../../common/thermal/utils/compound-properties/heat-capacity-entries.util';
import { CompoundPropertyResolver } from '../../../common/thermal/utils/compound-properties/compound-property-resolver';
import {
  compoundNasaThermo,
  evaluateNasaThermo,
  NasaThermo,
} from '../../../common/thermal/utils/nasa';
import {
  aggregateMixtureValidity,
  clampLimits,
  evaluateEquation,
  evaluateEquationAverage,
} from '../../../common/thermal/utils/equation-validity.util';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { CompoundValue } from '../../../common/thermal/interfaces/compound-value.interface';
import { EquationValue } from '../../../common/thermal/interfaces/equation-value.interface';
import {
  EquationValidity,
  EvaluationResult,
  MixtureValidity,
} from '../../../common/thermal/interfaces/equation-validity.interface';
import { Common } from '../../../common/thermal/utils/common';
import { Species } from '../enums/species.enum';
import { CpComparisonEntryDto } from '../dto/gas-properties/cp-comparison-entry.dto';
import { GasPropertiesResultDto } from '../dto/gas-properties/gas-properties-result.dto';

@Injectable()
export class GasPropertiesService {

  // ── Guard ────────────────────────────────────────────────────────────

  /** Resolve compound or throw a descriptive error */
  private _compound(species: Species): CompoundValue {
    const c = GAS_REGISTRY[species];
    if (!c) throw new Error(`Unknown species: ${species}`);
    return c;
  }

  // ── Single-species Cp ────────────────────────────────────────────────

  /** Cp [J/(mol·K)] using the compound's default equation: NASA-9, else NASA-7, else `heatCapacity.def` */
  cpSpecies(species: Species, T_K: number, T0_K?: number): number {
    return this.cpSpeciesResult(species, T_K, T0_K).value;
  }

  cpSpeciesResult(species: Species, T_K: number, T0_K?: number): EvaluationResult {
    const resolver = new CompoundPropertyResolver(this._compound(species));
    return T0_K !== undefined
      ? resolver.heatCapacityAverageResult(T0_K, T_K)
      : resolver.heatCapacityResult(T_K);
  }

  /** Cp using a specific `heatCapacityEntries` index for explicit equation selection */
  cpSpeciesByIndex(species: Species, equationIndex: number, T_K: number, T0_K?: number): number {
    return this.cpSpeciesByIndexResult(species, equationIndex, T_K, T0_K).value;
  }

  cpSpeciesByIndexResult(
    species: Species,
    equationIndex: number,
    T_K: number,
    T0_K?: number,
  ): EvaluationResult {
    const entry = heatCapacityEntries(this._compound(species)).values[equationIndex];
    if (!entry) throw new Error(`No equation at index ${equationIndex} for ${species}`);
    return this._evalEntryResult(entry, T_K, T0_K);
  }

  /** Returns Cp from every approximation (tabulated fits, NASA-9, NASA-7) — cross-approximation comparison */
  cpCompare(species: Species, T_K: number): CpComparisonEntryDto[] {
    return heatCapacityEntries(this._compound(species)).values.map((entry, index) => {
      let result: EvaluationResult;
      try {
        result = this._evalEntryResult(entry, T_K);
      } catch {
        result = {
          value: NaN,
          validity: {
            requestedT: T_K,
            effectiveT: T_K,
            min: entry.min,
            max: entry.max,
            inRange: false,
            rangeUnknown: entry.min == null || entry.max == null,
            action: 'none',
          },
        };
      }
      return {
        index,
        type: entry.type,
        ref: entry.ref,
        value: result.value,
        rangeValid: result.validity.inRange,
        validity: result.validity,
      };
    });
  }

  // ── H, S, G — NASA-9, else NASA-7 (compoundNasaThermo) ──────────────

  /** Sensible molar enthalpy H(T) − H(298.15 K) [J/mol] */
  enthalpy(species: Species, T_K: number): number {
    return this.enthalpyResult(species, T_K).value;
  }

  enthalpyResult(species: Species, T_K: number): EvaluationResult {
    const compound = this._compound(species);
    const nasa = compoundNasaThermo(compound);
    const Tref = STANDARD_CONDITIONS.THERMOCHEMICAL_REFERENCE_TEMPERATURE_K;
    if (nasa) {
      const atT = evaluateNasaThermo(nasa, 'enthalpy', T_K);
      const atRef = nasa.enthalpy(Tref);
      return { value: atT.value - atRef, validity: atT.validity };
    }
    const { def, values } = heatCapacityEntries(compound);
    const entry = values[def];
    const { lo, hi } = clampLimits(entry.min, entry.max);
    const eq = Common.equation(entry.type);
    const k = entry.k ?? 1;
    const value =
      eq.integral(T_K, entry.vars as never, lo, hi, k)
      - eq.integral(Tref, entry.vars as never, lo, hi, k);
    return {
      value,
      validity: evaluateEquation(entry, T_K).validity,
    };
  }

  /**
   * Absolute molar enthalpy [J/mol]: H(T) = ΔHf(298) + ∫₂₉₈ᵀ Cp dT.
   * From NASA data when available (a8 / a6 encode ΔHf); outside the dataset range the enthalpy is
   * extrapolated with the boundary Cp. Without NASA data: ΔHf(298) + sensible enthalpy.
   */
  absoluteEnthalpy(species: Species, T_K: number): number {
    return this.absoluteEnthalpyResult(species, T_K).value;
  }

  absoluteEnthalpyResult(species: Species, T_K: number): EvaluationResult {
    const compound = this._compound(species);
    const nasa = compoundNasaThermo(compound);
    if (nasa) return evaluateNasaThermo(nasa, 'enthalpy', T_K);
    if (compound.enthalpyFormation298 === undefined) {
      throw new Error(`No NASA data or enthalpy of formation for ${species}`);
    }
    const sensible = this.enthalpyResult(species, T_K);
    return {
      value: compound.enthalpyFormation298 + sensible.value,
      validity: sensible.validity,
    };
  }

  /** Mixture absolute molar enthalpy [J/mol] weighted by mole fractions (or mole flows) */
  absoluteEnthalpyMixture(moleFractions: Partial<Record<Species, number>>, T_K: number): number {
    let h = 0;
    for (const [sp, y] of Object.entries(moleFractions) as [Species, number][]) {
      if (!y) continue;
      h += y * this.absoluteEnthalpy(sp, T_K);
    }
    return h;
  }

  /** Absolute molar entropy S [J/(mol·K)] */
  entropy(species: Species, T_K: number): number {
    return this.entropyResult(species, T_K).value;
  }

  entropyResult(species: Species, T_K: number): EvaluationResult {
    return evaluateNasaThermo(this._nasa(species), 'entropy', T_K);
  }

  /** Absolute Gibbs free energy G = H − T·S [J/mol] (formation-referenced H, absolute S) */
  gibbsEnergy(species: Species, T_K: number): number {
    return this.gibbsEnergyResult(species, T_K).value;
  }

  gibbsEnergyResult(species: Species, T_K: number): EvaluationResult {
    return evaluateNasaThermo(this._nasa(species), 'gibbsEnergy', T_K);
  }

  private _nasa(species: Species): NasaThermo {
    const nasa = compoundNasaThermo(this._compound(species));
    if (!nasa) throw new Error(`No NASA thermodynamic data for ${species}`);
    return nasa;
  }

  // ── Mixture properties ───────────────────────────────────────────────

  /** Mixture Cp [J/(mol·K)] weighted by mole fractions */
  cpMixture(moleFractions: Partial<Record<Species, number>>, T_K: number, T0_K?: number): number {
    return this.cpMixtureResult(moleFractions, T_K, T0_K).value;
  }

  cpMixtureResult(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    T0_K?: number,
  ): EvaluationResult & { mixtureValidity: MixtureValidity } {
    let cp = 0;
    const components: Record<string, EquationValidity> = {};
    for (const [sp, y] of Object.entries(moleFractions) as [Species, number][]) {
      if (!y || y <= 0) continue;
      const r = this.cpSpeciesResult(sp, T_K, T0_K);
      cp += y * r.value;
      components[sp] = r.validity;
    }
    const mixtureValidity = aggregateMixtureValidity(components);
    const anyClamped = Object.values(components).some(v => v.action === 'clamped');
    const anyExtrapolated = Object.values(components).some(v => v.action === 'extrapolated');
    const anyUnknown = Object.values(components).some(v => v.rangeUnknown);
    return {
      value: cp,
      validity: {
        requestedT: T_K,
        effectiveT: T_K,
        min: null,
        max: null,
        inRange: mixtureValidity.allInRange,
        rangeUnknown: anyUnknown,
        action: anyExtrapolated ? 'extrapolated' : anyClamped ? 'clamped' : 'none',
        message: mixtureValidity.allInRange
          ? undefined
          : 'One or more mixture components are outside their Cp correlation range.',
      },
      mixtureValidity,
    };
  }

  /** Mixture molar enthalpy [J/mol] */
  enthalpyMixture(moleFractions: Partial<Record<Species, number>>, T_K: number): number {
    let h = 0;
    for (const [sp, y] of Object.entries(moleFractions) as [Species, number][]) {
      if (!y || y <= 0) continue;
      h += y * this.enthalpy(sp, T_K);
    }
    return h;
  }

  /** Average molar mass of mixture [kg/mol] */
  molecularWeight(moleFractions: Partial<Record<Species, number>>): number {
    let M = 0;
    for (const [sp, y] of Object.entries(moleFractions) as [Species, number][]) {
      if (!y || y <= 0) continue;
      const compound = GAS_REGISTRY[sp];
      if (compound) M += y * compound.Mr;
    }
    return M;
  }

  /** Ideal-gas density [kg/m³] */
  density(M_kg_mol: number, T_K: number, P_Pa = STANDARD_CONDITIONS.PRESSURE_PA): number {
    return (P_Pa * M_kg_mol) / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * T_K);
  }

  /** Mixture basic properties (Cp, H, ρ, M) — transport comes from TransportService */
  getMixtureBasicProperties(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_atm = 1.0,
  ): Pick<GasPropertiesResultDto, 'Cp_J_kgK' | 'H_J_mol' | 'rho_kg_m3' | 'molecularWeight_kg_mol' | 'validity' | 'mixtureValidity'> {
    const M         = this.molecularWeight(moleFractions);
    const cpResult  = this.cpMixtureResult(moleFractions, T_K);
    const Cp_J_kgK  = cpResult.value / M;
    const H_J_mol   = this.enthalpyMixture(moleFractions, T_K);
    const rho_kg_m3 = this.density(M, T_K, P_atm * STANDARD_CONDITIONS.PRESSURE_PA);
    return {
      Cp_J_kgK,
      H_J_mol,
      rho_kg_m3,
      molecularWeight_kg_mol: M,
      validity: cpResult.validity,
      mixtureValidity: cpResult.mixtureValidity,
    };
  }

  /**
   * Full mixture thermophysical properties including transport.
   * Pr is calculated via μ·Cp/λ — the standard definition.
   */
  getFullMixtureProperties(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_atm: number,
    mu_Pa_s: number,
    lambda: number,
    diffusion: Partial<Record<Species, number>>,
  ): GasPropertiesResultDto {
    const basic  = this.getMixtureBasicProperties(moleFractions, T_K, P_atm);
    const Pr     = (mu_Pa_s * basic.Cp_J_kgK) / lambda;
    return { ...basic, mu_Pa_s, lambda, Pr, diffusion };
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private _evalEntryResult(entry: EquationValue, T_K: number, T0_K?: number): EvaluationResult {
    return T0_K !== undefined
      ? evaluateEquationAverage(entry, T0_K, T_K)
      : evaluateEquation(entry, T_K);
  }
}
