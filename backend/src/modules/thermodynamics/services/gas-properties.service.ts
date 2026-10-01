import { Injectable } from '@nestjs/common';
import { Common } from '../../../common/thermal/utils/common';
import {
  GAS_CONSTANT_J_MOLK,
  STANDARD_PRESSURE_PA,
  THERMOCHEMICAL_REFERENCE_TEMPERATURE_K,
} from '../../../common/thermal/constants/physical.constants';
import { heatCapacityEntries } from '../../../common/thermal/utils/heat-capacity-entries';
import { compoundNasaThermo, NasaThermo } from '../../../common/thermal/utils/nasa-thermo';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { CompoundValue } from '../../../common/thermal/interfaces/compound-value.interface';
import { EquationValue } from '../../../common/thermal/interfaces/equation-value.interface';
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
    const { def, values } = heatCapacityEntries(this._compound(species));
    return this._evalEntry(values[def], T_K, T0_K);
  }

  /** Cp using a specific `heatCapacityEntries` index for explicit equation selection */
  cpSpeciesByIndex(species: Species, equationIndex: number, T_K: number, T0_K?: number): number {
    const entry = heatCapacityEntries(this._compound(species)).values[equationIndex];
    if (!entry) throw new Error(`No equation at index ${equationIndex} for ${species}`);
    return this._evalEntry(entry, T_K, T0_K);
  }

  /** Returns Cp from every approximation (tabulated fits, NASA-9, NASA-7) — cross-approximation comparison */
  cpCompare(species: Species, T_K: number): CpComparisonEntryDto[] {
    return heatCapacityEntries(this._compound(species)).values.map((entry, index) => {
      const rangeValid = T_K >= entry.min && T_K <= entry.max;
      let value: number;
      try { value = this._evalEntry(entry, T_K); } catch { value = NaN; }
      return { index, type: entry.type, ref: entry.ref, value, rangeValid };
    });
  }

  // ── H, S, G — NASA-9, else NASA-7 (compoundNasaThermo) ──────────────

  /** Sensible molar enthalpy H(T) − H(298.15 K) [J/mol] */
  enthalpy(species: Species, T_K: number): number {
    const compound = this._compound(species);
    const nasa = compoundNasaThermo(compound);
    if (nasa) return nasa.enthalpy(T_K) - nasa.enthalpy(THERMOCHEMICAL_REFERENCE_TEMPERATURE_K);
    const { def, values } = heatCapacityEntries(compound);
    const entry = values[def];
    const eq = Common.equation(entry.type);
    const k = entry.k ?? 1;
    return eq.integral(T_K, entry.vars as never, entry.min, entry.max, k)
         - eq.integral(THERMOCHEMICAL_REFERENCE_TEMPERATURE_K, entry.vars as never, entry.min, entry.max, k);
  }

  /**
   * Absolute molar enthalpy [J/mol]: H(T) = ΔHf(298) + ∫₂₉₈ᵀ Cp dT.
   * From NASA data when available (a8 / a6 encode ΔHf); outside the dataset range the enthalpy is
   * extrapolated with the boundary Cp. Without NASA data: ΔHf(298) + sensible enthalpy.
   */
  absoluteEnthalpy(species: Species, T_K: number): number {
    const compound = this._compound(species);
    const nasa = compoundNasaThermo(compound);
    if (nasa) return nasa.enthalpy(T_K);
    if (compound.enthalpyFormation298 === undefined) {
      throw new Error(`No NASA data or enthalpy of formation for ${species}`);
    }
    return compound.enthalpyFormation298 + this.enthalpy(species, T_K);
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
    return this._nasa(species).entropy(T_K);
  }

  /** Absolute Gibbs free energy G = H − T·S [J/mol] (formation-referenced H, absolute S) */
  gibbsEnergy(species: Species, T_K: number): number {
    return this._nasa(species).gibbsEnergy(T_K);
  }

  private _nasa(species: Species): NasaThermo {
    const nasa = compoundNasaThermo(this._compound(species));
    if (!nasa) throw new Error(`No NASA thermodynamic data for ${species}`);
    return nasa;
  }

  // ── Mixture properties ───────────────────────────────────────────────

  /** Mixture Cp [J/(mol·K)] weighted by mole fractions */
  cpMixture(moleFractions: Partial<Record<Species, number>>, T_K: number, T0_K?: number): number {
    let cp = 0;
    for (const [sp, y] of Object.entries(moleFractions) as [Species, number][]) {
      if (!y || y <= 0) continue;
      cp += y * this.cpSpecies(sp, T_K, T0_K);
    }
    return cp;
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
  density(M_kg_mol: number, T_K: number, P_Pa = STANDARD_PRESSURE_PA): number {
    return (P_Pa * M_kg_mol) / (GAS_CONSTANT_J_MOLK * T_K);
  }

  /** Mixture basic properties (Cp, H, ρ, M) — transport comes from TransportService */
  getMixtureBasicProperties(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_atm = 1.0,
  ): Pick<GasPropertiesResultDto, 'Cp_J_kgK' | 'H_J_mol' | 'rho_kg_m3' | 'molecularWeight_kg_mol'> {
    const M         = this.molecularWeight(moleFractions);
    const Cp_J_molK = this.cpMixture(moleFractions, T_K);
    const Cp_J_kgK  = Cp_J_molK / M;
    const H_J_mol   = this.enthalpyMixture(moleFractions, T_K);
    const rho_kg_m3 = this.density(M, T_K, P_atm * STANDARD_PRESSURE_PA);
    return { Cp_J_kgK, H_J_mol, rho_kg_m3, molecularWeight_kg_mol: M };
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

  private _evalEntry(entry: EquationValue, T_K: number, T0_K?: number): number {
    const eq = Common.equation(entry.type);
    const k  = entry.k ?? 1;
    return T0_K !== undefined
      ? eq.calculateAverage(T0_K, T_K, entry.vars as never, entry.min, entry.max, k)
      : eq.calculate(T_K, entry.vars as never, entry.min, entry.max, k);
  }
}
