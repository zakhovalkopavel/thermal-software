import { Injectable } from '@nestjs/common';
import { Common } from '../../../common/thermal/utils/common';
import { Nasa7EquationMethod } from '../../../common/thermal/utils/nasa7-equation-method';
import { EquationTypeDto } from '../../../common/thermal/dto/equation-type.dto';
import { Nasa7Equation } from '../../../common/thermal/type/nasa7-equation';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { CompoundValue } from '../../../common/thermal/interfaces/compound-value.interface';
import { EquationValue } from '../../../common/thermal/interfaces/equation-value.interface';
import { Species } from '../enums/species.enum';
import { CpComparisonEntryDto } from '../dto/cp-comparison-entry.dto';
import { GasPropertiesResultDto } from '../dto/gas-properties-result.dto';

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

  /** Cp [J/(mol·K)] using the compound's default (def) equation */
  cpSpecies(species: Species, T_K: number, T0_K?: number): number {
    const compound = this._compound(species);
    const entry = compound.heatCapacity.values[compound.heatCapacity.def];
    return this._evalEntry(entry, T_K, T0_K);
  }

  /** Cp using a specific values[] index for explicit equation selection */
  cpSpeciesByIndex(species: Species, equationIndex: number, T_K: number, T0_K?: number): number {
    const compound = this._compound(species);
    const entry = compound.heatCapacity.values[equationIndex];
    if (!entry) throw new Error(`No equation at index ${equationIndex} for ${species}`);
    return this._evalEntry(entry, T_K, T0_K);
  }

  /** Returns Cp from every values[] entry — cross-approximation comparison */
  cpCompare(species: Species, T_K: number): CpComparisonEntryDto[] {
    const compound = this._compound(species);
    return compound.heatCapacity.values.map((entry, index) => {
      const rangeValid = T_K >= entry.min && T_K <= entry.max;
      let value: number;
      try { value = this._evalEntry(entry, T_K); } catch { value = NaN; }
      return { index, type: entry.type, ref: entry.ref, value, rangeValid };
    });
  }

  // ── H, S, G — use best available equation ───────────────────────────

  /**
   * Pick the best heatCapacity equation for thermodynamic integration.
   * Preference order: nasa7 (if T in range) → first entry whose range covers T.
   */
  private _bestThermodynamicEntry(species: Species, T_K: number): EquationValue {
    const compound = this._compound(species);
    const values = compound.heatCapacity.values;
    // Prefer NASA-7 when T is within its range
    const nasa7 = values.find(v => v.type === EquationTypeDto.nasa7);
    if (nasa7 && T_K >= nasa7.min && T_K <= nasa7.max) return nasa7;
    // Fall back to first entry whose range covers T_K
    const inRange = values.find(v => T_K >= v.min && T_K <= v.max);
    if (inRange) return inRange;
    // Last resort: default entry
    return values[compound.heatCapacity.def];
  }

  /** Molar enthalpy H [J/mol] — uses best available equation */
  enthalpy(species: Species, T_K: number): number {
    const entry = this._bestThermodynamicEntry(species, T_K);
    if (entry.type === EquationTypeDto.nasa7) {
      return new Nasa7EquationMethod().enthalpy(T_K, entry.vars as unknown as Nasa7Equation);
    }
    // Generic: H = ∫Cp dT from 298 K as reference
    const eq = Common.equation(entry.type);
    const k = entry.k ?? 1;
    return eq.integral(T_K, entry.vars as never, entry.min, entry.max, k)
         - eq.integral(298, entry.vars as never, entry.min, entry.max, k);
  }

  /** Molar entropy S [J/(mol·K)] — uses best available equation */
  entropy(species: Species, T_K: number): number {
    const entry = this._bestThermodynamicEntry(species, T_K);
    if (entry.type === EquationTypeDto.nasa7) {
      return new Nasa7EquationMethod().entropy(T_K, entry.vars as unknown as Nasa7Equation);
    }
    // Generic approximation: S ≈ ∫(Cp/T) dT — use NASA-7 if available regardless of range
    const nasa7 = this._compound(species).heatCapacity.values.find(v => v.type === EquationTypeDto.nasa7);
    if (nasa7) {
      return new Nasa7EquationMethod().entropy(T_K, nasa7.vars as unknown as Nasa7Equation);
    }
    throw new Error(`No entropy equation available for ${species}`);
  }

  /** Gibbs free energy G = H − T·S [J/mol] — uses best available equation */
  gibbsEnergy(species: Species, T_K: number): number {
    return this.enthalpy(species, T_K) - T_K * this.entropy(species, T_K);
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
  density(M_kg_mol: number, T_K: number, P_Pa = 101325): number {
    return (P_Pa * M_kg_mol) / (Common.R * T_K);
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
    const rho_kg_m3 = this.density(M, T_K, P_atm * 101325);
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
