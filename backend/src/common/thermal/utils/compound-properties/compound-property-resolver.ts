import { CompoundValue } from '../../types/compound-value.type';
import { EquationValue } from '../../types/equation-value.type';
import { EvaluationResult } from '../../types/evaluation-result.type';
import { EquationValidity } from '../equation-validity';
import { compoundNasaThermo, evaluateNasaThermo } from '../nasa';
import { heatCapacityEntries } from './heat-capacity-entries.util';
import { PreferredApprox } from './types/preferred-approx.type';

/** True when the equation publishes a finite range that covers T. */
function coversTemperature(entry: EquationValue, T: number): boolean {
  return entry.min != null && entry.max != null && T >= entry.min && T <= entry.max;
}

/**
 * Resolves a single property value (Cp, μ, λ …) from a compound's
 * multi-approximation bucket.
 *
 * Selection priority:
 *   1. `preferred` as numeric index     → values[preferred]
 *   2. `preferred` as RefKey            → first entry whose ref === preferred
 *   3. when T is given and preferred is unset:
 *        prefer an equation whose [min, max] covers T (def if it covers, else first covering)
 *   4. undefined / no covering entry    → values[def]  (then clamp+warn at eval time)
 *
 * If the preferred entry is not found, falls back to the default silently.
 */
function resolveEntry(
  bucket: { def: number; values: EquationValue[] },
  preferred?: PreferredApprox,
  T?: number,
): EquationValue {
  const { def, values } = bucket;
  if (preferred !== undefined) {
    if (typeof preferred === 'number') {
      return values[preferred] ?? values[def];
    }
    const byRef = values.find(v => v.ref === preferred);
    return byRef ?? values[def];
  }

  if (T !== undefined && values.length > 0) {
    const defEntry = values[def];
    if (defEntry && coversTemperature(defEntry, T)) return defEntry;
    const covering = values.find(v => coversTemperature(v, T));
    if (covering) return covering;
  }

  return values[def];
}

/**
 * Hides all property calculation details from callers.
 * Use this instead of accessing compound data directly.
 *
 * Number-returning methods keep prior call sites working; `*Result` variants
 * attach structured temperature-boundary validity (Plan 3).
 */
export class CompoundPropertyResolver {
  constructor(private readonly compound: CompoundValue) {}

  // ─── Heat capacity ──────────────────────────────────────────────────────────

  /**
   * Isobaric molar heat capacity Cp [J/(mol·K)] at temperature T [K].
   * @param preferred  Index or RefKey into `heatCapacityEntries`; default NASA-9, else NASA-7, else `def`.
   */
  heatCapacity(T: number, preferred?: PreferredApprox): number {
    return this.heatCapacityResult(T, preferred).value;
  }

  heatCapacityResult(T: number, preferred?: PreferredApprox): EvaluationResult {
    const entry = resolveEntry(heatCapacityEntries(this.compound), preferred, T);
    return EquationValidity.evaluateEquation(entry, T);
  }

  /**
   * Average Cp [J/(mol·K)] over [T1, T2].
   * @param preferred  Index or RefKey into `heatCapacityEntries`; default NASA-9, else NASA-7, else `def`.
   */
  heatCapacityAverage(T1: number, T2: number, preferred?: PreferredApprox): number {
    return this.heatCapacityAverageResult(T1, T2, preferred).value;
  }

  heatCapacityAverageResult(T1: number, T2: number, preferred?: PreferredApprox): EvaluationResult {
    const mid = 0.5 * (T1 + T2);
    const entry = resolveEntry(heatCapacityEntries(this.compound), preferred, mid);
    return EquationValidity.evaluateEquationAverage(entry, T1, T2);
  }

  // ─── Enthalpy ───────────────────────────────────────────────────────────────

  /**
   * Formation-referenced molar enthalpy H [J/mol] at temperature T [K].
   * NASA-9, else NASA-7; returns NaN without NASA data.
   */
  enthalpy(T: number): number {
    return this.enthalpyResult(T).value;
  }

  enthalpyResult(T: number): EvaluationResult {
    const nasa = compoundNasaThermo(this.compound);
    if (!nasa) {
      return {
        value: NaN,
        validity: {
          requestedT: T,
          effectiveT: T,
          min: null,
          max: null,
          inRange: false,
          rangeUnknown: true,
          action: 'none',
          message: 'No NASA thermodynamic data for this compound.',
        },
      };
    }
    return evaluateNasaThermo(nasa, 'enthalpy', T);
  }

  // ─── Entropy ────────────────────────────────────────────────────────────────

  /**
   * Molar entropy S [J/(mol·K)] at temperature T [K].
   * NASA-9, else NASA-7; returns NaN without NASA data.
   */
  entropy(T: number): number {
    return this.entropyResult(T).value;
  }

  entropyResult(T: number): EvaluationResult {
    const nasa = compoundNasaThermo(this.compound);
    if (!nasa) {
      return {
        value: NaN,
        validity: {
          requestedT: T,
          effectiveT: T,
          min: null,
          max: null,
          inRange: false,
          rangeUnknown: true,
          action: 'none',
          message: 'No NASA thermodynamic data for this compound.',
        },
      };
    }
    return evaluateNasaThermo(nasa, 'entropy', T);
  }

  // ─── Gibbs energy ───────────────────────────────────────────────────────────

  /**
   * Molar Gibbs free energy G = H − T·S [J/mol] at temperature T [K].
   * NASA-9, else NASA-7; returns NaN without NASA data.
   */
  gibbsEnergy(T: number): number {
    return this.gibbsEnergyResult(T).value;
  }

  gibbsEnergyResult(T: number): EvaluationResult {
    const nasa = compoundNasaThermo(this.compound);
    if (!nasa) {
      return {
        value: NaN,
        validity: {
          requestedT: T,
          effectiveT: T,
          min: null,
          max: null,
          inRange: false,
          rangeUnknown: true,
          action: 'none',
          message: 'No NASA thermodynamic data for this compound.',
        },
      };
    }
    return evaluateNasaThermo(nasa, 'gibbsEnergy', T);
  }

  // ─── Viscosity ──────────────────────────────────────────────────────────────

  /**
   * Dynamic viscosity μ [Pa·s] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  viscosity(T: number, preferred?: PreferredApprox): number {
    return this.viscosityResult(T, preferred).value;
  }

  viscosityResult(T: number, preferred?: PreferredApprox): EvaluationResult {
    const entry = resolveEntry(this.compound.viscosity, preferred, T);
    return EquationValidity.evaluateEquation(entry, T);
  }

  // ─── Thermal conductivity ───────────────────────────────────────────────────

  /**
   * Thermal conductivity λ [W/(m·K)] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  thermalConductivity(T: number, preferred?: PreferredApprox): number {
    return this.thermalConductivityResult(T, preferred).value;
  }

  thermalConductivityResult(T: number, preferred?: PreferredApprox): EvaluationResult {
    const entry = resolveEntry(this.compound.thermalConductivity, preferred, T);
    return EquationValidity.evaluateEquation(entry, T);
  }
}
