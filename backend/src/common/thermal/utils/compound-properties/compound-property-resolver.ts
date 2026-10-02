import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationValue } from '../../interfaces/equation-value.interface';
import { Common } from '../common';
import { compoundNasaThermo } from '../nasa';
import { heatCapacityEntries } from './heat-capacity-entries.util';
import { PreferredApprox } from './preferred-approx.type';

/**
 * Resolves a single property value (Cp, μ, λ …) from a compound's
 * multi-approximation bucket.
 *
 * Selection priority:
 *   1. `preferred` as numeric index     → values[preferred]
 *   2. `preferred` as RefKey            → first entry whose ref === preferred
 *   3. undefined                        → values[def]  (the default)
 *
 * If the preferred entry is not found, falls back to the default silently.
 */
function resolveEntry(
  bucket: { def: number; values: EquationValue[] },
  preferred?: PreferredApprox,
): EquationValue {
  const { def, values } = bucket;
  if (preferred === undefined) return values[def];

  if (typeof preferred === 'number') {
    return values[preferred] ?? values[def];
  }
  // RefKey lookup
  const byRef = values.find(v => v.ref === preferred);
  return byRef ?? values[def];
}

/**
 * Hides all property calculation details from callers.
 * Use this instead of accessing compound data directly.
 */
export class CompoundPropertyResolver {
  constructor(private readonly compound: CompoundValue) {}

  // ─── Heat capacity ──────────────────────────────────────────────────────────

  /**
   * Isobaric molar heat capacity Cp [J/(mol·K)] at temperature T [K].
   * @param preferred  Index or RefKey into `heatCapacityEntries`; default NASA-9, else NASA-7, else `def`.
   */
  heatCapacity(T: number, preferred?: PreferredApprox): number {
    const entry = resolveEntry(heatCapacityEntries(this.compound), preferred);
    return Common.equation(entry.type).calculate(T, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }

  /**
   * Average Cp [J/(mol·K)] over [T1, T2].
   * @param preferred  Index or RefKey into `heatCapacityEntries`; default NASA-9, else NASA-7, else `def`.
   */
  heatCapacityAverage(T1: number, T2: number, preferred?: PreferredApprox): number {
    const entry = resolveEntry(heatCapacityEntries(this.compound), preferred);
    return Common.equation(entry.type).calculateAverage(T1, T2, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }

  // ─── Enthalpy ───────────────────────────────────────────────────────────────

  /**
   * Formation-referenced molar enthalpy H [J/mol] at temperature T [K].
   * NASA-9, else NASA-7; returns NaN without NASA data.
   */
  enthalpy(T: number): number {
    return compoundNasaThermo(this.compound)?.enthalpy(T) ?? NaN;
  }

  // ─── Entropy ────────────────────────────────────────────────────────────────

  /**
   * Molar entropy S [J/(mol·K)] at temperature T [K].
   * NASA-9, else NASA-7; returns NaN without NASA data.
   */
  entropy(T: number): number {
    return compoundNasaThermo(this.compound)?.entropy(T) ?? NaN;
  }

  // ─── Gibbs energy ───────────────────────────────────────────────────────────

  /**
   * Molar Gibbs free energy G = H − T·S [J/mol] at temperature T [K].
   * NASA-9, else NASA-7; returns NaN without NASA data.
   */
  gibbsEnergy(T: number): number {
    return compoundNasaThermo(this.compound)?.gibbsEnergy(T) ?? NaN;
  }

  // ─── Viscosity ──────────────────────────────────────────────────────────────

  /**
   * Dynamic viscosity μ [Pa·s] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  viscosity(T: number, preferred?: PreferredApprox): number {
    const entry = resolveEntry(this.compound.viscosity, preferred);
    return Common.equation(entry.type).calculate(T, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }

  // ─── Thermal conductivity ───────────────────────────────────────────────────

  /**
   * Thermal conductivity λ [W/(m·K)] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  thermalConductivity(T: number, preferred?: PreferredApprox): number {
    const entry = resolveEntry(this.compound.thermalConductivity, preferred);
    return Common.equation(entry.type).calculate(T, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }
}

