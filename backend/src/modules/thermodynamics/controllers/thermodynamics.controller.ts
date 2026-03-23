import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GasPropertiesService } from '../services/gas-properties.service';
import { DimensionlessNumbersService } from '../services/dimensionless-numbers.service';
import { TransportService } from '../services/transport.service';
import { DiffusionService } from '../services/diffusion.service';
import { GasMixtureInputDto, GasPropertiesResultDto, CpComparisonEntryDto } from '../dto/gas-properties.dto';
import {
  DimensionlessInputDto, DimensionlessResultDto,
  BodyGeometryInputDto, BodyGeometryResultDto,
  GeometryDimsDto,
} from '../dto/dimensionless.dto';
import {
  ReynoldsInputDto, PrandtlInputDto, GrashofInputDto, RayleighInputDto,
  NusseltToHInputDto, ScalarDimensionlessResultDto, FluidStateDto,
} from '../dto/dimensionless-scalar.dto';
import { Species } from '../enums/species.enum';
import { Common } from '../../../common/thermal/utils/common';

// ── Controller ───────────────────────────────────────────────────────────────

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsController {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly diffusion: DiffusionService,
    private readonly dimensionless: DimensionlessNumbersService,
  ) {}

  // ── Gas mixture properties ───────────────────────────────────────────

  @Post('properties')
  @ApiOperation({ summary: 'Full thermophysical properties for a gas mixture' })
  getMixtureProperties(@Body() dto: GasMixtureInputDto): GasPropertiesResultDto {
    const { composition, T_K, P_atm = 1.0 } = dto;
    const mole   = composition as Partial<Record<Species, number>>;
    const mu     = this.transport.viscosityMix(mole, T_K);
    const cpBySp = Object.fromEntries(
      (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T_K)]),
    ) as Partial<Record<Species, number>>;
    const lambda = this.transport.thermalConductivityMix(mole, T_K, cpBySp);
    const D      = this.diffusion.getAllDiffusionCoefficients(mole, T_K, P_atm);
    return this.gasProps.getFullMixtureProperties(mole, T_K, P_atm, mu, lambda, D);
  }

  @Get('cp-compare')
  @ApiOperation({ summary: 'Compare all Cp approximations for a species at given T' })
  @ApiQuery({ name: 'species', enum: Species })
  @ApiQuery({ name: 'T_K', type: Number })
  cpCompare(
    @Query('species') species: Species,
    @Query('T_K') T_K: string,
  ): CpComparisonEntryDto[] {
    return this.gasProps.cpCompare(species, parseFloat(T_K));
  }

  // ── Individual dimensionless numbers ─────────────────────────────────

  @Post('dimensionless/reynolds')
  @ApiOperation({ summary: 'Re = ρ·w·L / μ — requires geometry + fluid (ρ, μ) + velocity' })
  calcReynolds(@Body() dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
    const resolved = this._resolveFluid(dto.fluid);
    const rho = resolved.rho_kg_m3;
    const mu  = resolved.mu_Pa_s;
    if (rho === undefined || mu === undefined)
      throw new Error('Fluid density (rho_kg_m3) and viscosity (mu_Pa_s) are required for Re');
    const L = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.dimensionless.reynolds(rho, dto.w_m_s, L, mu),
      symbol: 'Re', L_m: L, resolvedFluid: resolved,
    };
  }

  @Post('dimensionless/prandtl')
  @ApiOperation({ summary: 'Pr = μ·Cp / λ — requires fluid (μ, Cp, λ) at temperature' })
  calcPrandtl(@Body() dto: PrandtlInputDto): ScalarDimensionlessResultDto {
    const resolved = this._resolveFluid(dto.fluid);
    const mu     = resolved.mu_Pa_s;
    const Cp     = resolved.Cp_J_kgK;
    const lambda = resolved.lambda_W_mK;
    if (mu === undefined || Cp === undefined || lambda === undefined)
      throw new Error('Fluid μ, Cp, λ are required for Pr');
    const L = dto.dims
      ? this.dimensionless.characteristicLength(dto.geometry, dto.dims as GeometryDimsDto)
      : 1;
    return {
      value: this.dimensionless.prandtl(mu, Cp, lambda),
      symbol: 'Pr', L_m: L, resolvedFluid: resolved,
    };
  }

  @Post('dimensionless/grashof')
  @ApiOperation({ summary: 'Gr = g·β·ΔT·L³ / ν² — requires T_hot, T_cold, geometry + fluid (ν)' })
  calcGrashof(@Body() dto: GrashofInputDto): ScalarDimensionlessResultDto {
    const resolved = this._resolveFluid(dto.fluid);
    const nu  = resolved.nu_m2s ?? (resolved.mu_Pa_s !== undefined && resolved.rho_kg_m3 !== undefined
      ? resolved.mu_Pa_s / resolved.rho_kg_m3 : undefined);
    if (nu === undefined)
      throw new Error('Kinematic viscosity (ν = μ/ρ) is required for Gr; supply mu_Pa_s + rho_kg_m3 or species+T');
    const L = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.dimensionless.grashof(dto.T_hot_K, dto.T_cold_K, L, nu, dto.g_m_s2 ?? Common.g),
      symbol: 'Gr', L_m: L, resolvedFluid: { ...resolved, nu_m2s: nu },
    };
  }

  @Post('dimensionless/rayleigh')
  @ApiOperation({ summary: 'Ra = Gr·Pr — requires T_hot, T_cold, geometry + fluid (ν, Cp, λ, μ)' })
  calcRayleigh(@Body() dto: RayleighInputDto): ScalarDimensionlessResultDto {
    const resolved = this._resolveFluid(dto.fluid);
    const nu  = resolved.nu_m2s ?? (resolved.mu_Pa_s !== undefined && resolved.rho_kg_m3 !== undefined
      ? resolved.mu_Pa_s / resolved.rho_kg_m3 : undefined);
    const mu  = resolved.mu_Pa_s;
    const Cp  = resolved.Cp_J_kgK;
    const lam = resolved.lambda_W_mK;
    if (nu === undefined) throw new Error('Kinematic viscosity required for Ra');
    const Pr = (mu !== undefined && Cp !== undefined && lam !== undefined)
      ? this.dimensionless.prandtl(mu, Cp, lam) : undefined;
    if (Pr === undefined) throw new Error('Prandtl number cannot be resolved; supply μ, Cp, λ or a named species');
    const L = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.dimensionless.rayleigh(dto.T_hot_K, dto.T_cold_K, L, nu, Pr, dto.g_m_s2 ?? Common.g),
      symbol: 'Ra', L_m: L, resolvedFluid: { ...resolved, nu_m2s: nu },
    };
  }

  @Post('dimensionless/nusselt-to-h')
  @ApiOperation({ summary: 'h = Nu·λ / L — convective heat transfer coefficient from Nusselt number' })
  calcHFromNusselt(@Body() dto: NusseltToHInputDto): ScalarDimensionlessResultDto {
    const L = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.dimensionless.hFromNusselt(dto.Nu, dto.lambda_W_mK, L),
      symbol: 'h [W/(m²·K)]', L_m: L,
    };
  }

  // ── Full dimensionless number set + Nu correlation ────────────────────

  @Post('dimensionless')
  @ApiOperation({ summary: 'Re, Pr, Gr, Ra, Nu, h — full set for any flow geometry' })
  calcDimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    const result = this.dimensionless.nusselt(dto);

    let Re: number | undefined = dto.Re;
    if (Re === undefined && dto.rho_kg_m3 !== undefined && dto.w_m_s !== undefined
        && dto.mu_Pa_s !== undefined && dto.dims) {
      const L = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
      Re = this.dimensionless.reynolds(dto.rho_kg_m3, dto.w_m_s, L, dto.mu_Pa_s);
    }

    let Pr: number | undefined = dto.Pr;
    if (Pr === undefined && dto.mu_Pa_s !== undefined && dto.Cp_J_kgK !== undefined && dto.lambda_W_mK !== undefined)
      Pr = this.dimensionless.prandtl(dto.mu_Pa_s, dto.Cp_J_kgK, dto.lambda_W_mK);

    let Gr: number | undefined = dto.Gr;
    let Ra: number | undefined = dto.Ra;
    if (Gr === undefined && dto.T_fluid_K !== undefined && dto.T_surface_K !== undefined
        && dto.mu_Pa_s !== undefined && dto.rho_kg_m3 !== undefined && dto.dims) {
      const nu = dto.mu_Pa_s / dto.rho_kg_m3;
      const L  = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
      Gr = this.dimensionless.grashof(dto.T_surface_K, dto.T_fluid_K, L, nu);
      if (Ra === undefined && Pr !== undefined) Ra = Gr * Pr;
    }

    return { Re, Pr, Gr, Ra, ...result };
  }

  // ── Body geometry ─────────────────────────────────────────────────────

  @Post('body-geometry')
  @ApiOperation({ summary: 'Surface area, volume, mean beam length for any body shape' })
  bodyGeometry(@Body() dto: BodyGeometryInputDto): BodyGeometryResultDto {
    const { geometry, dims, h = 0 } = dto;
    return {
      surface:              this.dimensionless.bodyArea(geometry, dims, h),
      volume:               this.dimensionless.bodyVolume(geometry, dims),
      meanBeamLength:       this.dimensionless.meanBeamLength(geometry, dims),
      characteristicLength: Math.max(dims.a ?? 0, dims.b ?? 0, dims.c ?? 0),
    };
  }

  // ── Private: resolve fluid properties from FluidStateDto ──────────────

  private _resolveFluid(fluid: FluidStateDto): {
    rho_kg_m3?: number; mu_Pa_s?: number; Cp_J_kgK?: number; lambda_W_mK?: number; nu_m2s?: number;
  } {
    // Mode A: raw values supplied directly
    if (fluid.rho_kg_m3 !== undefined || fluid.mu_Pa_s !== undefined) {
      return {
        rho_kg_m3: fluid.rho_kg_m3,
        mu_Pa_s:   fluid.mu_Pa_s,
        Cp_J_kgK:  fluid.Cp_J_kgK,
        lambda_W_mK: fluid.lambda_W_mK,
      };
    }
    // Mode B: named species + temperature
    if (fluid.species && fluid.T_K) {
      const sp  = fluid.species as Species;
      const T   = fluid.T_K;
      const mu  = this.transport.viscosity(sp, T);
      const cpM = this.gasProps.cpSpecies(sp, T);    // J/(mol·K)
      const M   = this.gasProps.molecularWeight({ [sp]: 1 });
      const Cp  = cpM / M;                           // J/(kg·K)
      const lam = this.transport.thermalConductivity(sp, T, cpM);
      const rho = this.gasProps.density(M, T, fluid.P_Pa ?? 101325);
      return { rho_kg_m3: rho, mu_Pa_s: mu, Cp_J_kgK: Cp, lambda_W_mK: lam, nu_m2s: mu / rho };
    }
    return {};
  }
}

