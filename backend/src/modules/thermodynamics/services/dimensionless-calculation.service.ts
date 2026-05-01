import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';
import { DimensionlessNumbersService } from './dimensionless-numbers.service';
import { DimensionlessInputDto } from '../dto/dimensionless-input.dto';
import { DimensionlessResultDto } from '../dto/dimensionless-result.dto';
import { GeometryDimsDto } from '../dto/geometry-dims.dto';
import { ResolvedDimensionlessPropsDto } from '../dto/resolved-dimensionless-props.dto';
import { ScalarDimensionlessResultDto } from '../dto/scalar-dimensionless-result.dto';
import { Species } from '../enums/species.enum';
import { Common } from '../../../common/thermal/utils/common';
import { GrashofInputDto } from '../dto/grashof-input.dto';
import { RayleighInputDto } from '../dto/rayleigh-input.dto';
import { ReynoldsInputDto } from '../dto/reynolds-input.dto';
import { PrandtlInputDto } from '../dto/prandtl-input.dto';
import { KnownFluid } from '../types/known-fluid.type';

/** Resolved fluid transport properties — output of Mode B resolution. */
export interface ResolvedFluidProps {
  rho_kg_m3: number;
  mu_Pa_s: number;
  Cp_J_kgK: number;
  lambda: number;
  nu_m2s: number;
}

/** Flat-format fluid descriptor shared by all scalar dimensionless endpoints. */
interface FlatFluidInput {
  fluid?: KnownFluid;
  composition?: Record<string, number>;
  T_fluid_K?: number;
  P_Pa?: number;
}

/**
 * Service responsible for orchestrating dimensionless number calculations.
 * Resolves fluid properties from flat-format inputs (fluid name + T_K + optional P_Pa)
 * and delegates the actual correlation maths to DimensionlessNumbersService.
 *
 * SRP: this service owns the fluid-resolution + orchestration layer;
 *      DimensionlessNumbersService owns the pure maths.
 */
@Injectable()
export class DimensionlessCalculationService {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly numbers: DimensionlessNumbersService,
  ) {}

  // ── Scalar calculations ──────────────────────────────────────────────

  reynolds(dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
    const T = dto.T_fluid_K ?? Common.Tstandart;
    const fluid = this.resolveFluid({ fluid: dto.fluid, composition: dto.composition, T_fluid_K: T, P_Pa: dto.P_Pa });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name or composition + T_fluid_K');
    const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions);
    return {
      value: this.numbers.reynolds(fluid.rho_kg_m3, dto.w_m_s, L, fluid.mu_Pa_s),
      symbol: 'Re', L_m: L,
      resolvedFluid: fluid,
    };
  }

  prandtl(dto: PrandtlInputDto): ScalarDimensionlessResultDto {
    const fluid = this.resolveFluid({ fluid: dto.fluid, composition: dto.composition, T_fluid_K: dto.T_fluid_K, P_Pa: dto.P_Pa });
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
    const fluid = this.resolveFluid({ fluid: dto.fluid, composition: dto.composition, T_fluid_K: T, P_Pa: dto.P_Pa });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name or composition + T_fluid_K');
    const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions);
    return {
      value: this.numbers.grashof(dto.T_hot_K, dto.T_cold_K, L, fluid.nu_m2s, dto.g_m_s2 ?? Common.g),
      symbol: 'Gr', L_m: L,
      resolvedFluid: fluid,
    };
  }

  rayleigh(dto: RayleighInputDto): ScalarDimensionlessResultDto {
    const T = dto.T_fluid_K ?? dto.T_cold_K;
    const fluid = this.resolveFluid({ fluid: dto.fluid, composition: dto.composition, T_fluid_K: T, P_Pa: dto.P_Pa });
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply fluid name or composition + T_fluid_K');
    const Pr = this.numbers.prandtl(fluid.mu_Pa_s, fluid.Cp_J_kgK, fluid.lambda);
    const L  = this.numbers.characteristicLength(dto.geometry, dto.dimensions);
    return {
      value: this.numbers.rayleigh(dto.T_hot_K, dto.T_cold_K, L, fluid.nu_m2s, Pr, dto.g_m_s2 ?? Common.g),
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
   * Returns null when neither species nor composition is provided, or T_K is missing.
   */
  resolveFluid(input: FlatFluidInput): ResolvedFluidProps | null {
    const T = input.T_fluid_K;
    if (!T || T <= 0) return null;

    const P = input.P_Pa ?? Common.pAtm;

    let mu: number, Cp: number, lambda: number, rho: number;

    if (input.fluid && input.fluid !== 'gas_mix') {
      const sp  = input.fluid as Species;
      mu     = this.transport.viscosity(sp, T);
      const cpM = this.gasProps.cpSpecies(sp, T);
      const M   = this.gasProps.molecularWeight({ [sp]: 1 });
      Cp     = cpM / M;
      lambda = this.transport.thermalConductivity(sp, T, cpM);
      rho    = this.gasProps.density(M, T, P);
    } else if (input.composition) {
      const mole   = input.composition as Partial<Record<Species, number>>;
      const M      = this.gasProps.molecularWeight(mole);
      mu           = this.transport.viscosityMix(mole, T);
      const cpM    = this.gasProps.cpMixture(mole, T);
      Cp           = cpM / M;
      const cpBySp = Object.fromEntries(
        (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T)]),
      ) as Partial<Record<Species, number>>;
      lambda = this.transport.thermalConductivityMix(mole, T, cpBySp);
      rho    = this.gasProps.density(M, T, P);
    } else {
      return null;
    }

    return { rho_kg_m3: rho, mu_Pa_s: mu, Cp_J_kgK: Cp, lambda, nu_m2s: mu / rho };
  }

  /**
   * Resolve all dimensionless properties (Re, Pr, Gr, Ra, λ, ν) from a
   * DimensionlessInputDto (Mode B: species/composition + T).
   *
   * All returned fields are mandatory (never undefined):
   *   - Re = 0 when w_m_s = 0 → natural convection mode.
   *   - Gr = Ra = 0 when T_surface_K is not supplied.
   *
   * @throws when fluid/composition cannot be resolved or T_fluid_K is missing.
   */
  resolveDimensionlessProperties(dto: DimensionlessInputDto): ResolvedDimensionlessPropsDto {
    const T  = dto.T_fluid_K ?? Common.Tstandart;
    const Ts = dto.T_surface_K;
    const P  = dto.P_Pa ?? Common.pAtm;
    // w = 0 is the default → natural convection; undefined is also treated as 0.
    const w  = dto.w_m_s ?? 0;

    let mu: number, Cp: number, lambda: number, rho: number;

    if (dto.fluid && dto.fluid !== 'gas_mix') {
      const sp  = dto.fluid as Species;
      mu     = this.transport.viscosity(sp, T);
      const cpM = this.gasProps.cpSpecies(sp, T);
      const M   = this.gasProps.molecularWeight({ [sp]: 1 });
      Cp     = cpM / M;
      lambda = this.transport.thermalConductivity(sp, T, cpM);
      rho    = this.gasProps.density(M, T, P);
    } else if (dto.composition) {
      const mole   = dto.composition as Partial<Record<Species, number>>;
      const M      = this.gasProps.molecularWeight(mole);
      mu           = this.transport.viscosityMix(mole, T);
      const cpM    = this.gasProps.cpMixture(mole, T);
      Cp           = cpM / M;
      const cpBySp = Object.fromEntries(
        (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T)]),
      ) as Partial<Record<Species, number>>;
      lambda = this.transport.thermalConductivityMix(mole, T, cpBySp);
      rho    = this.gasProps.density(M, T, P);
    } else {
      throw new Error(
        'Cannot resolve fluid properties: supply either a known fluid name or a composition map.',
      );
    }

    if (!mu || !Cp || !lambda || !rho) {
      throw new Error('Fluid property resolution returned zero/null values — check species data.');
    }

    const nu_f = mu / rho;
    const Pr   = this.numbers.prandtl(mu, Cp, lambda);

    // Re = 0 when w = 0 (natural convection mode — resolveRegime will pick NATURAL).
    let Re = 0;
    if (w > 0 && dto.dimensions) {
      const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions as GeometryDimsDto);
      Re = this.numbers.reynolds(rho, w, L, mu);
    }

    // Gr/Ra = 0 when no surface temperature is given.
    let Gr = 0;
    let Ra = 0;
    if (Ts !== undefined && dto.dimensions) {
      const L = this.numbers.characteristicLength(dto.geometry, dto.dimensions as GeometryDimsDto);
      Gr = this.numbers.grashof(Ts, T, L, nu_f, dto.g_m_s2 ?? Common.g);
      Ra = Gr * Pr;
    }

    return { Re, Pr, Gr, Ra, lambda, mu_f: mu, nu_f };
  }
}

