import { Injectable } from '@nestjs/common';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { CompoundValue } from '../../../common/thermal/types/compound-value.type';
import {
  EquationValidity,
  EvaluationResult,
  MixtureValidity,
} from '../../../common/thermal/types';
import { CompoundPropertyResolver } from '../../../common/thermal/utils/compound-properties/compound-property-resolver';
import { STANDARD_CONDITIONS } from '../../../common/thermal/constants/standard-conditions.constants';
import { Species } from '../enums/species.enum';
import { CompoundFluidProps } from '../types/compound-fluid-props.type';
import { CoolpropConductivity } from '../utils/conductivity/coolprop-conductivity';
import { EuckenThermalConductivity } from '../utils/conductivity/eucken-thermal-conductivity';
import { GasDensity } from '../utils/density/gas-density';
import { GasViscosity } from '../utils/viscosity/gas-viscosity';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';

/**
 * Resolves thermophysical props for one `CompoundValue` (own equations or
 * composition mixture fallback). Injects gas + transport services — never pass
 * them as function arguments (docs/CONVENTIONS.md § Choosing the form).
 */
@Injectable()
export class CompoundFluidPropsService {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
  ) {}

  resolve(
    compound: CompoundValue,
    T_K: number,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): CompoundFluidProps {
    if (compound.density?.values.length) {
      return this.resolveLiquid(compound, T_K);
    }
    return this.resolveGas(compound, T_K, P_Pa);
  }

  /** Liquid: μ, λ, ρ, Cp from equation buckets (no gas EOS / CoolProp residual). */
  private resolveLiquid(compound: CompoundValue, T_K: number): CompoundFluidProps {
    const M = compound.Mr;
    const resolver = new CompoundPropertyResolver(compound);
    const cpR = resolver.heatCapacityResult(T_K);
    const muR = resolver.viscosityResult(T_K);
    const lamR = resolver.thermalConductivityResult(T_K);
    const rhoR = resolver.densityResult(T_K);
    const rho_kg_m3 = rhoR.value;
    return {
      M,
      Cp_J_molK: cpR.value,
      Cp_J_kgK: cpR.value / M,
      mu_Pa_s: muR.value,
      lambda: lamR.value,
      rho_kg_m3,
      nu_m2s: muR.value / rho_kg_m3,
      validity: this.pickWorstValidity(
        [cpR.validity, muR.validity, lamR.validity, rhoR.validity],
        T_K,
      ),
      cpValidity: cpR.validity,
      muValidity: muR.validity,
      lambdaValidity: lamR.validity,
    };
  }

  private resolveGas(
    compound: CompoundValue,
    T_K: number,
    P_Pa: number,
  ): CompoundFluidProps {
    const M = compound.Mr;
    const mole = this.moleComposition(compound);

    const cpR = this.heatCapacityOf(compound, mole, T_K);
    const muR = this.viscosityOf(compound, mole, T_K, P_Pa);
    const lamR = this.conductivityOf(compound, mole, T_K, cpR.value, P_Pa);

    const rho_kg_m3 = GasDensity.forCompound(compound, T_K, P_Pa);
    const mixtureValidity = muR.mixtureValidity ?? lamR.mixtureValidity;

    return {
      M,
      Cp_J_molK: cpR.value,
      Cp_J_kgK: cpR.value / M,
      mu_Pa_s: muR.value,
      lambda: lamR.value,
      rho_kg_m3,
      nu_m2s: muR.value / rho_kg_m3,
      validity: this.pickWorstValidity([cpR.validity, muR.validity, lamR.validity], T_K),
      mixtureValidity,
      cpValidity: cpR.validity,
      muValidity: muR.validity,
      lambdaValidity: lamR.validity,
    };
  }

  private moleComposition(
    compound: CompoundValue,
  ): Partial<Record<Species, number>> | undefined {
    if (!compound.composition || Object.keys(compound.composition).length === 0) {
      return undefined;
    }
    return compound.composition as Partial<Record<Species, number>>;
  }

  private heatCapacityOf(
    compound: CompoundValue,
    mole: Partial<Record<Species, number>> | undefined,
    T_K: number,
  ): EvaluationResult {
    const hasOwn =
      (compound.heatCapacity?.values.length ?? 0) > 0
      || !!compound.nasa7Key
      || !!compound.nasa9Key;
    if (hasOwn) {
      return new CompoundPropertyResolver(compound).heatCapacityResult(T_K);
    }
    if (mole) return this.gasProps.cpMixtureResult(mole, T_K);
    throw new Error(`No heat-capacity data for ${compound.name}`);
  }

  private viscosityOf(
    compound: CompoundValue,
    mole: Partial<Record<Species, number>> | undefined,
    T_K: number,
    P_Pa: number,
  ): EvaluationResult & { mixtureValidity?: MixtureValidity } {
    if (mole) {
      const r = this.transport.viscosityMixResult(mole, T_K, P_Pa);
      return { value: r.value, validity: r.validity, mixtureValidity: r.mixtureValidity };
    }
    return GasViscosity.forCompound(compound, T_K, P_Pa);
  }

  private conductivityOf(
    compound: CompoundValue,
    mole: Partial<Record<Species, number>> | undefined,
    T_K: number,
    Cp_J_molK: number,
    P_Pa: number,
  ): EvaluationResult & { mixtureValidity?: MixtureValidity } {
    // Stored dilute λ⁰, plus CoolProp λʳ(+λcrit) when linked.
    if (compound.thermalConductivity?.values.length > 0) {
      const dilute = new CompoundPropertyResolver(compound).thermalConductivityResult(T_K);
      return this.withCoolpropResidual(compound, mole, T_K, P_Pa, dilute);
    }
    // Pure registry species with CoolProp dilute/residual and no stored k(T).
    if (compound.coolpropKey && !mole) {
      const sp = Object.entries(GAS_REGISTRY).find(([, c]) => c === compound)?.[0] as Species | undefined;
      if (sp) {
        return this.transport.thermalConductivityResult(sp, T_K, Cp_J_molK, P_Pa);
      }
    }
    if (mole) {
      const cpBySp = Object.fromEntries(
        (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T_K)]),
      ) as Partial<Record<Species, number>>;
      const r = this.transport.thermalConductivityMixResult(mole, T_K, cpBySp, P_Pa);
      return { value: r.value, validity: r.validity, mixtureValidity: r.mixtureValidity };
    }

    // Pure compound with no stored k(T): Eucken λ from μ (CE μ when no viscosity eqs).
    const muR = this.viscosityOf(compound, undefined, T_K, P_Pa);
    const value = EuckenThermalConductivity.modifiedFromViscosity(
      Cp_J_molK, muR.value, compound.Mr, undefined,
    );
    return {
      value,
      validity: {
        ...muR.validity,
        message: muR.validity.message
          ? `Eucken λ from μ: ${muR.validity.message}`
          : 'Eucken λ from μ (no stored k(T) correlation).',
      },
    };
  }

  private withCoolpropResidual(
    compound: CompoundValue,
    mole: Partial<Record<Species, number>> | undefined,
    T_K: number,
    P_Pa: number,
    dilute: EvaluationResult,
  ): EvaluationResult {
    const key = compound.coolpropKey;
    if (!key || !CoolpropConductivity.hasResidual(key)) return dilute;
    const rho = GasDensity.forCompound(compound, T_K, P_Pa);
    const mu = this.viscosityOf(compound, mole, T_K, P_Pa).value;
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

  private pickWorstValidity(parts: EquationValidity[], T_K: number): EquationValidity {
    const anyExtrapolated = parts.some(v => v.action === 'extrapolated');
    const anyClamped = parts.some(v => v.action === 'clamped');
    const anyUnknown = parts.some(v => v.rangeUnknown);
    const allInRange = parts.every(v => v.inRange && !v.rangeUnknown);
    return {
      requestedT: T_K,
      effectiveT: T_K,
      min: null,
      max: null,
      inRange: allInRange,
      rangeUnknown: anyUnknown,
      action: anyExtrapolated ? 'extrapolated' : anyClamped ? 'clamped' : 'none',
      message: allInRange
        ? undefined
        : 'One or more property correlations are outside range or unknown.',
    };
  }
}
