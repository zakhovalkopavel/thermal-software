import { STANDARD_CONDITIONS } from '../../../../common/thermal/constants/standard-conditions.constants';
import { GAS_REGISTRY } from '../../../../common/thermal/compound/gas/registry';
import { CompoundValue } from '../../../../common/thermal/types/compound-value.type';
import { EvaluationResult } from '../../../../common/thermal/types/evaluation-result.type';
import { CompoundPropertyResolver } from '../../../../common/thermal/utils/compound-properties/compound-property-resolver';
import { MixtureValidity } from '../../../../common/thermal/types/mixture-validity.type';
import { EquationValidity } from '../../../../common/thermal/utils/equation-validity';
import { MIXTURE_VISCOSITY } from '../../constants/mixture-viscosity.constants';
import { Species } from '../../enums/species.enum';
import { GasDensity } from '../density/gas-density';
import { ChungThermalConductivity } from '../conductivity/chung-thermal-conductivity';
import { ChapmanEnskogViscosity } from './chapman-enskog-viscosity';
import { ChungViscosity } from './chung-viscosity';
import { CoolpropViscosity } from './coolprop-viscosity';
import { CoolpropViscosityData } from './coolprop-viscosity-data';
import { WilkeViscosity } from './wilke-viscosity';

/**
 * Gas dynamic viscosity selection:
 * CoolProp η(T,ρ) when evaluable → dilute def/CE;
 * mixtures: Wilke + Chung Δη (y < Y_SWITCH) → full Chung dense μ.
 * Refs: [CoolProp], [Chung1988], [Poling5].
 */
export class GasViscosity {
  /** True when CoolProp provides density-dependent viscosity for this fluid. */
  static hasCoolpropDensityDependence(coolpropKey: string): boolean {
    const model = CoolpropViscosityData.load(coolpropKey);
    if (!model) return false;
    return model.higherOrder !== undefined || model.initialDensity !== undefined;
  }

  /**
   * Dilute (low-pressure) μ [Pa·s]: stored `def`, else Chapman–Enskog.
   * Used for Wilke mixing and as Chung-λ η⁰ input.
   */
  static diluteResult(compound: CompoundValue, T_K: number): EvaluationResult {
    if (compound.viscosity.values.length > 0) {
      const fromData = new CompoundPropertyResolver(compound).viscosityResult(T_K);
      // Unbounded / mis-ranked correlations can go non-physical at extreme T;
      // Chapman–Enskog is the dilute fallback when μ ≤ 0 or non-finite.
      if (Number.isFinite(fromData.value) && fromData.value > 0) {
        return fromData;
      }
    }
    const ce = ChapmanEnskogViscosity.fromCompound(compound, T_K);
    return {
      value: ce.value,
      validity: {
        requestedT: T_K,
        effectiveT: T_K,
        min: null,
        max: null,
        inRange: true,
        rangeUnknown: true,
        action: 'none',
        message: ce.message,
      },
    };
  }

  /**
   * Pure-compound μ [Pa·s] at T,P: dilute def/CE (+ CoolProp Δη when available).
   */
  static forCompound(
    compound: CompoundValue,
    T_K: number,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): EvaluationResult {
    const dilute = GasViscosity.diluteResult(compound, T_K);
    const key = compound.coolpropKey;
    if (key && GasViscosity.hasCoolpropDensityDependence(key)) {
      const rho = GasDensity.forCompound(compound, T_K, P_Pa);
      const delta = CoolpropViscosity.denseCorrection(key, T_K, rho);
      return {
        value: dilute.value + delta,
        validity: {
          ...dilute.validity,
          requestedP: P_Pa,
          effectiveP: P_Pa,
          message: dilute.validity.message
            ? `CoolProp Δη(T,ρ) on dilute μ: ${dilute.validity.message}`
            : 'Dilute μ + CoolProp TRANSPORT Δη(T,ρ) via GasDensity ρ.',
        },
      };
    }
    return {
      ...dilute,
      validity: {
        ...dilute.validity,
        requestedP: P_Pa,
        effectiveP: P_Pa,
      },
    };
  }

  /**
   * Mixture μ: Wilke dilute μᵢ + Chung Δη(T,V) when y < Y_SWITCH;
   * full Chung dense μ when y ≥ Y_SWITCH (same Δη pattern as pure CoolProp).
   */
  static forMixture(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): EvaluationResult & {
    mixtureValidity: MixtureValidity;
    method: 'Wilke' | 'Chung1988';
  } {
    const species = (Object.keys(moleFractions) as Species[])
      .filter((sp) => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]);
    const components: Record<string, EvaluationResult['validity']> = {};
    const muDilute: Record<string, number> = {};
    const chungSpecies: ReturnType<typeof ChungThermalConductivity.speciesParams>[] = [];
    let M = 0;

    for (const sp of species) {
      const y = moleFractions[sp] ?? 0;
      const compound = GAS_REGISTRY[sp];
      const dil = GasViscosity.diluteResult(compound, T_K);
      components[sp] = dil.validity;
      muDilute[sp] = dil.value;
      chungSpecies.push(ChungThermalConductivity.speciesParams({
        label: sp,
        y,
        M: compound.Mr,
        Tc: compound.criticalTemperature,
        Vc: compound.criticalVolume,
        omega: compound.acentricFactor,
        dipole_C_m: compound.dipoleMoment,
      }));
      M += y * compound.Mr;
    }

    const mixParams = ChungThermalConductivity.mixParameters(chungSpecies);
    const rho = GasDensity.forMixture(moleFractions, T_K, P_Pa);
    const V = M / rho;
    const yDens = ChungThermalConductivity.densityParameterY(mixParams.Vc, V);
    const useChung = yDens >= MIXTURE_VISCOSITY.Y_SWITCH;

    let value: number;
    let method: 'Wilke' | 'Chung1988';
    let methodMsg: string;
    if (useChung) {
      value = ChungViscosity.viscosity(T_K, mixParams, V);
      method = 'Chung1988';
      methodMsg = `Chung1988 dense-gas μ (y=${yDens.toExponential(2)}, V from GasDensity).`;
    } else {
      const wilke = WilkeViscosity.mix(species, moleFractions, muDilute);
      const delta = ChungViscosity.viscosity(T_K, mixParams, V)
        - ChungViscosity.diluteViscosity(T_K, mixParams);
      value = wilke + delta;
      method = 'Wilke';
      methodMsg = `Wilke dilute μ_mix + Chung Δη(y=${yDens.toExponential(2)}, V from GasDensity).`;
    }

    const mixtureValidity = EquationValidity.aggregateMixtureValidity(components);
    const anyClamped = Object.values(components).some((v) => v.action === 'clamped');
    const anyExtrapolated = Object.values(components).some((v) => v.action === 'extrapolated');
    const anyUnknown = Object.values(components).some((v) => v.rangeUnknown);
    const rangeMsg = mixtureValidity.allInRange
      ? undefined
      : 'One or more mixture components are outside their viscosity correlation range.';

    return {
      value,
      method,
      validity: {
        requestedT: T_K,
        effectiveT: T_K,
        min: null,
        max: null,
        inRange: mixtureValidity.allInRange,
        rangeUnknown: anyUnknown,
        action: anyExtrapolated ? 'extrapolated' : anyClamped ? 'clamped' : 'none',
        message: rangeMsg ? `${methodMsg} ${rangeMsg}` : methodMsg,
        requestedP: P_Pa,
        effectiveP: P_Pa,
      },
      mixtureValidity,
    };
  }
}
