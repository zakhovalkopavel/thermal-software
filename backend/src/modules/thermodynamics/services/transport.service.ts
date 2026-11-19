import { Injectable } from '@nestjs/common';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { STANDARD_CONDITIONS } from '../../../common/thermal/constants/standard-conditions.constants';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { EvaluationResult } from '../../../common/thermal/types/evaluation-result.type';
import { CompoundPropertyResolver } from '../../../common/thermal/utils/compound-properties/compound-property-resolver';
import {
  aggregateMixtureValidity,
} from '../../../common/thermal/utils/equation-validity.util';
import { Species } from '../enums/species.enum';
import { MIXTURE_THERMAL_CONDUCTIVITY } from '../constants/mixture-thermal-conductivity.constants';
import { HirschfelderEucken } from '../utils/conductivity/hirschfelder-eucken';
import { ChungThermalConductivity } from '../utils/conductivity/chung-thermal-conductivity';
import { CoolpropConductivity } from '../utils/conductivity/coolprop-conductivity';
import { EuckenThermalConductivity } from '../utils/conductivity/eucken-thermal-conductivity';
import { GasDensity } from '../utils/density/gas-density';
import { ChapmanEnskogViscosity } from '../utils/viscosity/chapman-enskog-viscosity';
import { WilkeViscosity } from '../utils/viscosity/wilke-viscosity';
import { ChungSpeciesParams } from '../types/chung-species-params.type';
import { HirschfelderEuckenSpecies } from '../types/hirschfelder-eucken-species.type';

@Injectable()
export class TransportService {

  /**
   * Dynamic viscosity of a pure species [Pa·s].
   * Stored viscosity `def` when present; else Chapman–Enskog (LJ / Stockmayer)
   * when σ and ε/k exist on the compound.
   */
  viscosity(species: Species, T_K: number): number {
    return this.viscosityResult(species, T_K).value;
  }

  viscosityResult(species: Species, T_K: number): EvaluationResult {
    const compound = GAS_REGISTRY[species];
    if (!compound) throw new Error(`Unknown species: ${species}`);
    if (compound.viscosity.values.length > 0) {
      return new CompoundPropertyResolver(compound).viscosityResult(T_K);
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
   * Mixture dynamic viscosity via Wilke's mixing rule [Pa·s]
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  viscosityMix(moleFractions: Partial<Record<Species, number>>, T_K: number): number {
    return this.viscosityMixResult(moleFractions, T_K).value;
  }

  viscosityMixResult(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
  ): EvaluationResult & { mixtureValidity: ReturnType<typeof aggregateMixtureValidity> } {
    const species = (Object.keys(moleFractions) as Species[])
      .filter(sp => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]);
    const mu_i: Record<string, number> = {};
    const components: Record<string, EvaluationResult['validity']> = {};
    for (const sp of species) {
      const r = this.viscosityResult(sp, T_K);
      mu_i[sp] = r.value;
      components[sp] = r.validity;
    }

    const mu_mix = WilkeViscosity.mix(species, moleFractions, mu_i);

    const mixtureValidity = aggregateMixtureValidity(components);
    const anyClamped = Object.values(components).some(v => v.action === 'clamped');
    const anyExtrapolated = Object.values(components).some(v => v.action === 'extrapolated');
    const anyUnknown = Object.values(components).some(v => v.rangeUnknown);
    return {
      value: mu_mix,
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
          : 'One or more mixture components are outside their viscosity correlation range.',
      },
      mixtureValidity,
    };
  }

  /**
   * Thermal conductivity of a pure species [W/(m·K)].
   * Dilute λ⁰ from stored k(T) / CoolProp / Eucken; when CoolProp has a residual
   * model, adds NIST IR 8209 λʳ(T,ρ) with ρ from `GasDensity`.
   */
  thermalConductivity(
    species: Species,
    T_K: number,
    Cp_J_molK: number,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): number {
    return this.thermalConductivityResult(species, T_K, Cp_J_molK, P_Pa).value;
  }

  thermalConductivityResult(
    species: Species,
    T_K: number,
    Cp_J_molK: number,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): EvaluationResult {
    const compound = GAS_REGISTRY[species];
    if (!compound) throw new Error(`Unknown species: ${species}`);

    const dilute = this.diluteThermalConductivityResult(species, T_K, Cp_J_molK);
    const key = compound.coolpropKey;
    if (!key || !CoolpropConductivity.hasResidual(key)) return dilute;

    const rho = GasDensity.forCompound(compound, T_K, P_Pa);
    const mu = this.viscosityResult(species, T_K).value;
    const value = CoolpropConductivity.conductivity(key, T_K, rho, dilute.value, mu);
    return {
      value,
      validity: {
        ...dilute.validity,
        requestedP: P_Pa,
        effectiveP: P_Pa,
        message: dilute.validity.message
          ? `NISTIR8209 λ⁰+λʳ+λcrit: ${dilute.validity.message}`
          : 'NISTIR8209 λ = λ⁰(T) + λʳ(T,ρ) + λcrit via CoolProp TRANSPORT + GasDensity ρ.',
      },
    };
  }

  /**
   * Mixture thermal conductivity [W/(m·K)].
   * Hirschfelder–Eucken when Chung y < 0.01; Chung 1988 otherwise.
   * Molar volume for y / Chung comes from `GasDensity` (Helmholtz / PR / ideal).
   */
  thermalConductivityMix(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    cpBySpecies: Partial<Record<Species, number>>,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): number {
    return this.thermalConductivityMixResult(moleFractions, T_K, cpBySpecies, P_Pa).value;
  }

  thermalConductivityMixResult(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    cpBySpecies: Partial<Record<Species, number>>,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): EvaluationResult & {
    mixtureValidity: ReturnType<typeof aggregateMixtureValidity>;
    method: 'HirschfelderEucken' | 'Chung1988';
  } {
    const species = (Object.keys(moleFractions) as Species[])
      .filter(sp => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]);
    const components: Record<string, EvaluationResult['validity']> = {};
    const heSpecies: HirschfelderEuckenSpecies[] = [];
    const chungSpecies: ChungSpeciesParams[] = [];
    let Cp_mol = 0;
    let M = 0;

    for (const sp of species) {
      const y = moleFractions[sp] ?? 0;
      const compound = GAS_REGISTRY[sp];
      const Cp = cpBySpecies[sp] ?? 30.0;
      const lamR = this.thermalConductivityResult(sp, T_K, Cp, P_Pa);
      const muR = this.viscosityResult(sp, T_K);
      components[sp] = lamR.validity;
      heSpecies.push({ y, lambda: lamR.value, eta: muR.value, M: compound.Mr });
      chungSpecies.push(ChungThermalConductivity.speciesParams({
        label: sp,
        y,
        M: compound.Mr,
        Tc: compound.criticalTemperature,
        Vc: compound.criticalVolume,
        omega: compound.acentricFactor,
        dipole_C_m: compound.dipoleMoment,
      }));
      Cp_mol += y * Cp;
      M += y * compound.Mr;
    }

    const mixParams = ChungThermalConductivity.mixParameters(chungSpecies);
    const rho = GasDensity.forMixture(moleFractions, T_K, P_Pa);
    const V = M / rho;
    const yDens = ChungThermalConductivity.densityParameterY(mixParams.Vc, V);
    const useChung = yDens >= MIXTURE_THERMAL_CONDUCTIVITY.Y_SWITCH;

    let value: number;
    let method: 'HirschfelderEucken' | 'Chung1988';
    if (useChung) {
      const eta0 = WilkeViscosity.mix(
        species,
        moleFractions,
        Object.fromEntries(heSpecies.map((s, i) => [species[i], s.eta])),
      );
      const Cv = Cp_mol - PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
      value = ChungThermalConductivity.conductivity(T_K, mixParams, eta0, Cv, V);
      method = 'Chung1988';
    } else {
      value = HirschfelderEucken.mix(heSpecies);
      method = 'HirschfelderEucken';
    }

    const mixtureValidity = aggregateMixtureValidity(components);
    const anyClamped = Object.values(components).some(v => v.action === 'clamped');
    const anyExtrapolated = Object.values(components).some(v => v.action === 'extrapolated');
    const anyUnknown = Object.values(components).some(v => v.rangeUnknown);
    const rangeMsg = mixtureValidity.allInRange
      ? undefined
      : 'One or more mixture components are outside their conductivity correlation range.';
    const methodMsg = method === 'Chung1988'
      ? `Chung1988 dense-gas λ (y=${yDens.toExponential(2)}, V from GasDensity).`
      : `Hirschfelder–Eucken mix λ (y=${yDens.toExponential(2)}, V from GasDensity).`;

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

  /** Dilute-gas λ⁰ only (no residual). */
  private diluteThermalConductivityResult(
    species: Species,
    T_K: number,
    Cp_J_molK: number,
  ): EvaluationResult {
    const compound = GAS_REGISTRY[species];
    if (compound.thermalConductivity.values.length > 0) {
      return new CompoundPropertyResolver(compound).thermalConductivityResult(T_K);
    }
    const key = compound.coolpropKey;
    if (key) {
      const coolpropDilute = CoolpropConductivity.diluteIfAvailable(key, T_K);
      if (coolpropDilute !== undefined) {
        return {
          value: coolpropDilute,
          validity: {
            requestedT: T_K,
            effectiveT: T_K,
            min: null,
            max: null,
            inRange: true,
            rangeUnknown: true,
            action: 'none',
            message: 'CoolProp dilute λ⁰ (ratio of polynomials).',
          },
        };
      }
    }
    const muResult = this.viscosityResult(species, T_K);
    const value = EuckenThermalConductivity.modifiedFromViscosity(
      Cp_J_molK,
      muResult.value,
      compound.Mr,
      // Svehla modified-Eucken Z is not yet on CompoundValue; classical Eucken.
      undefined,
    );
    return {
      value,
      validity: {
        ...muResult.validity,
        message: muResult.validity.message
          ? `Eucken λ from μ: ${muResult.validity.message}`
          : 'Eucken λ from μ (no stored k(T) correlation).',
      },
    };
  }

}
