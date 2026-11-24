import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';
import { DimensionlessNumbersService } from './dimensionless-numbers.service';
import { CompoundFluidPropsService } from './compound-fluid-props.service';
import { DimensionlessInputDto } from '../dto/dimensionless/dimensionless-input.dto';
import { DimensionlessResultDto } from '../dto/dimensionless/dimensionless-result.dto';
import { GeometryDimsDto } from '../dto/geometry/geometry-dims.dto';
import { ResolvedDimensionlessPropsDto } from '../dto/dimensionless/resolved-dimensionless-props.dto';
import { ScalarDimensionlessResultDto } from '../dto/dimensionless/scalar-dimensionless-result.dto';
import { Species } from '../enums/species.enum';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { STANDARD_CONDITIONS } from '../../../common/thermal/constants/standard-conditions.constants';
import { GrashofInputDto } from '../dto/dimensionless/grashof-input.dto';
import { RayleighInputDto } from '../dto/dimensionless/rayleigh-input.dto';
import { ReynoldsInputDto } from '../dto/dimensionless/reynolds-input.dto';
import { PrandtlInputDto } from '../dto/dimensionless/prandtl-input.dto';
import { KnownFluids } from '../utils/known-fluids';
import { GasDensity } from '../utils/density/gas-density';
import { FLUID_REGISTRY } from '../../../common/thermal/compound/gas';
import { CompoundValueBuilder } from '../../../common/thermal/utils/compound-data';
import { FlatFluidInput } from '../types/flat-fluid-input.type';
import { ResolvedFluidProps } from '../types/resolved-fluid-props.type';

/**
 * Service responsible for orchestrating dimensionless number calculations.
 * Resolves fluid properties from flat-format inputs (fluid name + T_K + optional P_Pa)
 * and delegates the actual correlation maths to DimensionlessNumbersService.
 */
@Injectable()
export class DimensionlessCalculationService {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly numbers: DimensionlessNumbersService,
    private readonly compoundFluidProps: CompoundFluidPropsService,
  ) {}

  // ── Scalar calculations ──────────────────────────────────────────────

  reynolds(dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
    const T = dto.T_fluid_K ?? STANDARD_CONDITIONS.TEMPERATURE_K;
    const fluid = this.resolveFluid({
      fluid: dto.fluid,
      compoundId: dto.compoundId,
      composition: dto.composition,
      T_fluid_K: T,
      P_Pa: dto.P_Pa,
    });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name, compoundId, or composition + T_fluid_K');
    const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions);
    return {
      value: this.numbers.reynolds(fluid.rho_kg_m3, dto.w_m_s, L, fluid.mu_Pa_s),
      symbol: 'Re', L_m: L,
      resolvedFluid: fluid,
    };
  }

  prandtl(dto: PrandtlInputDto): ScalarDimensionlessResultDto {
    const fluid = this.resolveFluid({
      fluid: dto.fluid,
      compoundId: dto.compoundId,
      composition: dto.composition,
      T_fluid_K: dto.T_fluid_K,
      P_Pa: dto.P_Pa,
    });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name or composition + T_fluid_K');
    return {
      value: this.numbers.prandtl(fluid.mu_Pa_s, fluid.Cp_J_kgK, fluid.lambda),
      symbol: 'Pr', L_m: 0,
      resolvedFluid: fluid,
    };
  }

  grashof(dto: GrashofInputDto): ScalarDimensionlessResultDto {
    const T = dto.T_fluid_K ?? dto.T_cold_K;
    const fluid = this.resolveFluid({
      fluid: dto.fluid,
      compoundId: dto.compoundId,
      composition: dto.composition,
      T_fluid_K: T,
      P_Pa: dto.P_Pa,
    });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name, compoundId, or composition + T_fluid_K');
    const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions);
    return {
      value: this.numbers.grashof(dto.T_hot_K, dto.T_cold_K, L, fluid.nu_m2s, dto.g_m_s2 ?? PHYSICAL_CONSTANTS.STANDARD_GRAVITY_M_S2),
      symbol: 'Gr', L_m: L,
      resolvedFluid: fluid,
    };
  }

  rayleigh(dto: RayleighInputDto): ScalarDimensionlessResultDto {
    const T = dto.T_fluid_K ?? dto.T_cold_K;
    const fluid = this.resolveFluid({
      fluid: dto.fluid,
      compoundId: dto.compoundId,
      composition: dto.composition,
      T_fluid_K: T,
      P_Pa: dto.P_Pa,
    });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name, compoundId, or composition + T_fluid_K');
    const Pr = this.numbers.prandtl(fluid.mu_Pa_s, fluid.Cp_J_kgK, fluid.lambda);
    const L  = this.numbers.characteristicLength(dto.geometry, dto.dimensions);
    return {
      value: this.numbers.rayleigh(dto.T_hot_K, dto.T_cold_K, L, fluid.nu_m2s, Pr, dto.g_m_s2 ?? PHYSICAL_CONSTANTS.STANDARD_GRAVITY_M_S2),
      symbol: 'Ra', L_m: L,
      resolvedFluid: fluid,
    };
  }

  // ── Full Nusselt correlation ──────────────────────────────────────────

  nusselt(dto: DimensionlessInputDto): DimensionlessResultDto {
    const resolved = this.resolveDimensionlessProperties(dto);
    const result   = this.numbers.nusselt(dto, resolved);
    const { Re, Pr, Gr, Ra } = resolved;
    return { Re, Pr, Gr, Ra, ...result };
  }

  // ── Fluid property resolution ─────────────────────────────────────────

  /**
   * Resolve all transport properties from a flat-format fluid descriptor.
   * Named fluids → compound (own equations, else composition mixture).
   */
  resolveFluid(input: FlatFluidInput): ResolvedFluidProps | null {
    const T = input.T_fluid_K;
    if (!T || T <= 0) return null;

    const P = input.P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA;

    if (input.compoundId) {
      try {
        const compound = CompoundValueBuilder.fromId(input.compoundId);
        const props = this.compoundFluidProps.resolve(compound, T, P);
        return {
          rho_kg_m3: props.rho_kg_m3,
          mu_Pa_s: props.mu_Pa_s,
          Cp_J_kgK: props.Cp_J_kgK,
          lambda: props.lambda,
          nu_m2s: props.nu_m2s,
          validity: props.validity,
          mixtureValidity: props.mixtureValidity,
        };
      } catch {
        return null;
      }
    }

    const fluid = KnownFluids.normalize(input.fluid);

    if (fluid && fluid !== 'gas_mix') {
      const compound = FLUID_REGISTRY[fluid];
      if (!compound) return null;
      const props = this.compoundFluidProps.resolve(compound, T, P);
      return {
        rho_kg_m3: props.rho_kg_m3,
        mu_Pa_s: props.mu_Pa_s,
        Cp_J_kgK: props.Cp_J_kgK,
        lambda: props.lambda,
        nu_m2s: props.nu_m2s,
        validity: props.validity,
        mixtureValidity: props.mixtureValidity,
      };
    }

    if (!input.composition) return null;

    const mole   = input.composition as Partial<Record<Species, number>>;
    const M      = this.gasProps.molecularWeight(mole);
    const muR    = this.transport.viscosityMixResult(mole, T, P);
    const cpR    = this.gasProps.cpMixtureResult(mole, T);
    const Cp     = cpR.value / M;
    const cpBySp = Object.fromEntries(
      (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T)]),
    ) as Partial<Record<Species, number>>;
    const lamR = this.transport.thermalConductivityMixResult(mole, T, cpBySp, P);
    const rho  = GasDensity.forMixture(mole, T, P);
    const validity = !cpR.mixtureValidity.allInRange ? cpR.validity
      : !muR.mixtureValidity.allInRange ? muR.validity
        : lamR.validity;

    return {
      rho_kg_m3: rho,
      mu_Pa_s: muR.value,
      Cp_J_kgK: Cp,
      lambda: lamR.value,
      nu_m2s: muR.value / rho,
      validity,
      mixtureValidity: cpR.mixtureValidity,
    };
  }

  /**
   * Resolve Re, Pr, Gr, Ra, λ, ν — fluid props via `resolveFluid`.
   */
  resolveDimensionlessProperties(dto: DimensionlessInputDto): ResolvedDimensionlessPropsDto {
    const T  = dto.T_fluid_K ?? STANDARD_CONDITIONS.TEMPERATURE_K;
    const Ts = dto.T_surface_K;
    const P  = dto.P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA;
    const w  = dto.w_m_s ?? 0;

    const fluid = this.resolveFluid({
      fluid: dto.fluid,
      compoundId: dto.compoundId,
      composition: dto.composition,
      T_fluid_K: T,
      P_Pa: P,
    });
    if (!fluid) {
      throw new Error(
        'Cannot resolve fluid properties: supply compoundId, a known fluid name, or a composition map.',
      );
    }

    const { mu_Pa_s: mu, Cp_J_kgK: Cp, lambda, rho_kg_m3: rho, nu_m2s: nu_f } = fluid;
    if (!mu || !Cp || !lambda || !rho) {
      throw new Error('Fluid property resolution returned zero/null values — check species data.');
    }

    const Pr = this.numbers.prandtl(mu, Cp, lambda);

    let Re = 0;
    if (w > 0 && dto.dimensions) {
      const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions as GeometryDimsDto);
      Re = this.numbers.reynolds(rho, w, L, mu);
    }

    let Gr = 0;
    let Ra = 0;
    if (Ts !== undefined && dto.dimensions) {
      const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions as GeometryDimsDto);
      Gr = this.numbers.grashof(Ts, T, L, nu_f, dto.g_m_s2 ?? PHYSICAL_CONSTANTS.STANDARD_GRAVITY_M_S2);
      Ra = Gr * Pr;
    }

    return { Re, Pr, Gr, Ra, lambda, mu_f: mu, nu_f };
  }
}
