import { EquationValue } from '../interfaces/equation-value.interface';
import {
  EquationValidity as EquationValidityStatus,
  EvaluationResult,
  MixtureValidity,
  ValidityAction,
} from '../types';
import { Common } from './common';

/**
 * Warn-and-clamp boundary helpers for compound equation evaluations.
 * Stateless — no DI. Data shape lives in `types/equation-validity.type.ts`.
 */
export class EquationValidity {
  /** Numeric clamp limits: null range → ±Infinity (no clamp), flagged separately as rangeUnknown. */
  static clampLimits(
    min: number | null | undefined,
    max: number | null | undefined,
  ): { lo: number; hi: number; rangeUnknown: boolean } {
    const rangeUnknown = min == null || max == null;
    return {
      lo: min ?? Number.NEGATIVE_INFINITY,
      hi: max ?? Number.POSITIVE_INFINITY,
      rangeUnknown,
    };
  }

  private static formatBound(v: number | null): string {
    return v == null || !Number.isFinite(v) ? '?' : String(v);
  }

  /**
   * Build validity metadata for a single temperature against optional [min, max].
   * Does not invent infinite ranges in the returned metadata — null stays null.
   */
  static buildTemperatureValidity(
    requestedT: number,
    min: number | null | undefined,
    max: number | null | undefined,
    opts?: {
      action?: ValidityAction;
      requestedT2?: number;
      effectiveT2?: number;
      message?: string;
    },
  ): EquationValidityStatus {
    const rangeUnknown = min == null || max == null;
    const lo = min ?? Number.NEGATIVE_INFINITY;
    const hi = max ?? Number.POSITIVE_INFINITY;
    const effectiveT = Common.validInterval(requestedT, lo, hi);
    const inRange = !rangeUnknown && requestedT >= (min as number) && requestedT <= (max as number);

    let action: ValidityAction = opts?.action ?? 'none';
    if (opts?.action === undefined) {
      if (rangeUnknown) action = 'none';
      else if (!inRange) action = 'clamped';
    }

    let message = opts?.message;
    if (message === undefined) {
      if (rangeUnknown) {
        message = 'Correlation temperature range is unknown; value is not clamped.';
      } else if (action === 'clamped') {
        message = `T=${requestedT} K is outside [${EquationValidity.formatBound(min)}, ${EquationValidity.formatBound(max)}] K; evaluated at ${effectiveT} K.`;
      } else if (action === 'extrapolated') {
        message = `T=${requestedT} K is outside [${EquationValidity.formatBound(min)}, ${EquationValidity.formatBound(max)}] K; extrapolated with boundary Cp at ${effectiveT} K.`;
      }
    }

    const validity: EquationValidityStatus = {
      requestedT,
      effectiveT,
      min: rangeUnknown ? null : (min as number),
      max: rangeUnknown ? null : (max as number),
      inRange,
      rangeUnknown,
      action,
    };
    if (message !== undefined) validity.message = message;
    if (opts?.requestedT2 !== undefined) validity.requestedT2 = opts.requestedT2;
    if (opts?.effectiveT2 !== undefined) validity.effectiveT2 = opts.effectiveT2;
    return validity;
  }

  /** Merge endpoint validities for an average over [T1, T2]. */
  static buildAverageValidity(
    T1: number,
    T2: number,
    min: number | null | undefined,
    max: number | null | undefined,
  ): EquationValidityStatus {
    const v1 = EquationValidity.buildTemperatureValidity(T1, min, max);
    const v2 = EquationValidity.buildTemperatureValidity(T2, min, max);
    const rangeUnknown = v1.rangeUnknown || v2.rangeUnknown;
    const inRange = v1.inRange && v2.inRange;
    const action: ValidityAction =
      v1.action === 'extrapolated' || v2.action === 'extrapolated'
        ? 'extrapolated'
        : v1.action === 'clamped' || v2.action === 'clamped'
          ? 'clamped'
          : 'none';

    let message: string | undefined;
    if (rangeUnknown) {
      message = 'Correlation temperature range is unknown; average is not clamped.';
    } else if (action === 'clamped') {
      message =
        `Average interval [${T1}, ${T2}] K intersects outside [${EquationValidity.formatBound(v1.min)}, ${EquationValidity.formatBound(v1.max)}] K; ` +
        `integrated over [${v1.effectiveT}, ${v2.effectiveT}] K.`;
    }

    return {
      requestedT: T1,
      effectiveT: v1.effectiveT,
      requestedT2: T2,
      effectiveT2: v2.effectiveT,
      min: v1.min,
      max: v1.max,
      inRange,
      rangeUnknown,
      action,
      ...(message !== undefined ? { message } : {}),
    };
  }

  /** Evaluate a compound equation at T, attaching warn-and-clamp validity. */
  static evaluateEquation(entry: EquationValue, T: number): EvaluationResult {
    const { lo, hi } = EquationValidity.clampLimits(entry.min, entry.max);
    const validity = EquationValidity.buildTemperatureValidity(T, entry.min, entry.max);
    const value = Common.equation(entry.type).calculate(
      T, entry.vars as never, lo, hi, entry.k ?? 1,
    );
    return { value, validity };
  }

  /** Evaluate average over [T1, T2] with denominator on the same effective interval. */
  static evaluateEquationAverage(
    entry: EquationValue,
    T1: number,
    T2: number,
  ): EvaluationResult {
    const { lo, hi } = EquationValidity.clampLimits(entry.min, entry.max);
    const validity = EquationValidity.buildAverageValidity(T1, T2, entry.min, entry.max);
    const value = Common.equation(entry.type).calculateAverage(
      T1, T2, entry.vars as never, lo, hi, entry.k ?? 1,
    );
    return { value, validity };
  }

  /** Aggregate per-component validity for mixtures. */
  static aggregateMixtureValidity(
    components: Record<string, EquationValidityStatus>,
  ): MixtureValidity {
    const entries = Object.values(components);
    return {
      allInRange: entries.length > 0 && entries.every(v => v.inRange && !v.rangeUnknown),
      components,
    };
  }
}
