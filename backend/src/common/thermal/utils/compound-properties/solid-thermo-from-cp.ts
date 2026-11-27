import { SOLID_THERMO } from '../../constants/solid-thermo.constants';
import { STANDARD_CONDITIONS } from '../../constants/standard-conditions.constants';
import { CompoundValue } from '../../types/compound-value.type';
import { EquationValue } from '../../types/equation-value.type';
import { EvaluationResult } from '../../types/evaluation-result.type';
import { gaussLegendre } from '../../../utils/quadrature';
import { Common } from '../common';
import { EquationValidity } from '../equation-validity';

/**
 * H, S, G from ΔHf°298, S°298 and a Cp equation — used when no NASA data exists (typically solids).
 * Stateless — no DI. Callers pick the Cp equation (`resolveEntry`) and pass it in.
 *
 *   H(T) = ΔHf°298 + ∫_{Tref}^{T} Cp dT        (closed-form antiderivative)
 *   S(T) = S°298   + ∫_{Tref}^{T} Cp/T dT      (composite Gauss–Legendre; no closed form for every Cp type)
 *   G(T) = H − T·S
 *
 * Outside the equation's published range Cp is held at its boundary value (warn-and-clamp).
 */
export class SolidThermoFromCp {
  /** True when ΔHf°298 and S°298 are present (a Cp equation is then resolved by the caller). */
  static available(compound: CompoundValue): boolean {
    return compound.enthalpyFormation298 !== undefined && compound.entropy298 !== undefined;
  }

  /** H(T) [J/mol] */
  static enthalpy(compound: CompoundValue, cp: EquationValue, T: number): EvaluationResult {
    return SolidThermoFromCp.result(cp, T, SolidThermoFromCp.enthalpyValue(compound, cp, T));
  }

  /** S(T) [J/(mol·K)] */
  static entropy(compound: CompoundValue, cp: EquationValue, T: number): EvaluationResult {
    return SolidThermoFromCp.result(cp, T, SolidThermoFromCp.entropyValue(compound, cp, T));
  }

  /** G(T) = H − T·S [J/mol] */
  static gibbs(compound: CompoundValue, cp: EquationValue, T: number): EvaluationResult {
    const H = SolidThermoFromCp.enthalpyValue(compound, cp, T);
    const S = SolidThermoFromCp.entropyValue(compound, cp, T);
    return SolidThermoFromCp.result(cp, T, H - T * S);
  }

  private static result(cp: EquationValue, T: number, value: number): EvaluationResult {
    return { value, validity: EquationValidity.evaluateEquation(cp, T).validity };
  }

  private static enthalpyValue(compound: CompoundValue, cp: EquationValue, T: number): number {
    const Tref = STANDARD_CONDITIONS.THERMOCHEMICAL_REFERENCE_TEMPERATURE_K;
    return (compound.enthalpyFormation298 as number)
      + SolidThermoFromCp.cpIntegral(cp, T) - SolidThermoFromCp.cpIntegral(cp, Tref);
  }

  private static entropyValue(compound: CompoundValue, cp: EquationValue, T: number): number {
    const Tref = STANDARD_CONDITIONS.THERMOCHEMICAL_REFERENCE_TEMPERATURE_K;
    const panels = Math.max(1, Math.ceil(Math.abs(T - Tref) / SOLID_THERMO.ENTROPY_PANEL_WIDTH_K));
    const width = (T - Tref) / panels;
    let integral = 0;
    for (let i = 0; i < panels; i++) {
      integral += gaussLegendre(
        (t) => SolidThermoFromCp.cpValue(cp, t) / t,
        Tref + i * width,
        Tref + (i + 1) * width,
        SOLID_THERMO.ENTROPY_PANEL_NODES,
      );
    }
    return (compound.entropy298 as number) + integral;
  }

  private static cpValue(cp: EquationValue, T: number): number {
    const { lo, hi } = EquationValidity.clampLimits(cp.min, cp.max);
    return Common.equation(cp.type).calculate(T, cp.vars as never, lo, hi, cp.k ?? 1);
  }

  /** ∫Cp dT antiderivative at T; beyond the range, boundary Cp is extrapolated linearly in T. */
  private static cpIntegral(cp: EquationValue, T: number): number {
    const { lo, hi } = EquationValidity.clampLimits(cp.min, cp.max);
    const Tb = Common.validInterval(T, lo, hi);
    const antiderivative = Common.equation(cp.type).integral(Tb, cp.vars as never, lo, hi, cp.k ?? 1);
    return antiderivative + SolidThermoFromCp.cpValue(cp, Tb) * (T - Tb);
  }
}
