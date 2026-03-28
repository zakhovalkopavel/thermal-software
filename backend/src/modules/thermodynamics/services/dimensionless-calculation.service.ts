import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';
import { DimensionlessNumbersService } from './dimensionless-numbers.service';
import { DimensionlessInputDto } from '../dto/dimensionless-input.dto';
import { DimensionlessResultDto } from '../dto/dimensionless-result.dto';
import { FluidStateDto } from '../dto/fluid-state.dto';
import { GeometryDimsDto } from '../dto/geometry-dims.dto';
import { ResolvedDimensionlessPropsDto } from '../dto/resolved-dimensionless-props.dto';
import { ScalarDimensionlessResultDto } from '../dto/scalar-dimensionless-result.dto';
import { Species } from '../enums/species.enum';
import { Common } from '../../../common/thermal/utils/common';
import { GrashofInputDto } from '../dto/grashof-input.dto';
import { RayleighInputDto } from '../dto/rayleigh-input.dto';
import { ReynoldsInputDto } from '../dto/reynolds-input.dto';
import { PrandtlInputDto } from '../dto/prandtl-input.dto';

/** Resolved fluid transport properties — output of Mode B resolution. */
export interface ResolvedFluidProps {
  rho_kg_m3: number;
  mu_Pa_s: number;
  Cp_J_kgK: number;
  lambda: number;
  nu_m2s: number;
}

/**
 * Service responsible for orchestrating dimensionless number calculations.
 * Resolves fluid properties from Mode B (species + T) inputs and delegates
 * the actual correlation maths to DimensionlessNumbersService.
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
    const fluid = this.resolveFluid(dto.fluid);
    const w = dto.fluid.w_m_s;
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply species + T_K');
    if (w === undefined)
      throw new Error('Flow velocity w_m_s is required in fluid for Re');
    const L = this.numbers.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.numbers.reynolds(fluid.rho_kg_m3, w, L, fluid.mu_Pa_s),
      symbol: 'Re', L_m: L,
      resolvedFluid: fluid,
    };
  }

  prandtl(dto: PrandtlInputDto): ScalarDimensionlessResultDto {
    const fluid = this.resolveFluid(dto.fluid);
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply species + T_K');
    const L = dto.dims
      ? this.numbers.characteristicLength(dto.geometry, dto.dims as GeometryDimsDto)
      : 1;
    return {
      value: this.numbers.prandtl(fluid.mu_Pa_s, fluid.Cp_J_kgK, fluid.lambda),
      symbol: 'Pr', L_m: L,
      resolvedFluid: fluid,
    };
  }

  grashof(dto: GrashofInputDto): ScalarDimensionlessResultDto {
    const fluid = this.resolveFluid(dto.fluid);
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply species + T_K');
    const L = this.numbers.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.numbers.grashof(dto.T_hot_K, dto.T_cold_K, L, fluid.nu_m2s, dto.g_m_s2 ?? Common.g),
      symbol: 'Gr', L_m: L,
      resolvedFluid: fluid,
    };
  }

  rayleigh(dto: RayleighInputDto): ScalarDimensionlessResultDto {
    const fluid = this.resolveFluid(dto.fluid);
    if (!fluid)
      throw new Error('Could not resolve fluid properties — supply species + T_K');
    const Pr = this.numbers.prandtl(fluid.mu_Pa_s, fluid.Cp_J_kgK, fluid.lambda);
    const L  = this.numbers.characteristicLength(dto.geometry, dto.dims);
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

  // ── Fluid property resolution (Mode B: species + T) ──────────────────

  /**
   * Resolve all transport properties from a FluidStateDto (Mode B only).
   * Returns null when species or T_K are missing.
   */
  resolveFluid(fluid: FluidStateDto): ResolvedFluidProps | null {
    if (!fluid.species || !fluid.T_K) return null;
    const sp  = fluid.species as Species;
    const T   = fluid.T_K;
    const mu  = this.transport.viscosity(sp, T);
    const cpM = this.gasProps.cpSpecies(sp, T);
    const M   = this.gasProps.molecularWeight({ [sp]: 1 });
    const Cp  = cpM / M;
    const lam = this.transport.thermalConductivity(sp, T, cpM);
    const rho = this.gasProps.density(M, T, fluid.P_Pa ?? Common.pAtm);
    return { rho_kg_m3: rho, mu_Pa_s: mu, Cp_J_kgK: Cp, lambda: lam, nu_m2s: mu / rho };
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
    if (w > 0 && dto.dims) {
      const L = this.numbers.characteristicLength(dto.geometry, dto.dims as GeometryDimsDto);
      Re = this.numbers.reynolds(rho, w, L, mu);
    }

    // Gr/Ra = 0 when no surface temperature is given.
    let Gr = 0;
    let Ra = 0;
    if (Ts !== undefined && dto.dims) {
      const L = this.numbers.characteristicLength(dto.geometry, dto.dims as GeometryDimsDto);
      Gr = this.numbers.grashof(Ts, T, L, nu_f);
      Ra = Gr * Pr;
    }

    return { Re, Pr, Gr, Ra, lambda, mu_f: mu, nu_f };
  }
}

