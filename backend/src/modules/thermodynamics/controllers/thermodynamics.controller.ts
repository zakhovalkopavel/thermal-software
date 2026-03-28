import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GasPropertiesService } from '../services/gas-properties.service';
import { DimensionlessCalculationService } from '../services/dimensionless-calculation.service';
import { TransportService } from '../services/transport.service';
import { DiffusionService } from '../services/diffusion.service';
import { GasMixtureInputDto } from '../dto/gas-mixture-input.dto';
import { GasPropertiesResultDto } from '../dto/gas-properties-result.dto';
import { CpComparisonEntryDto } from '../dto/cp-comparison-entry.dto';
import { DimensionlessInputDto } from '../dto/dimensionless-input.dto';
import { DimensionlessResultDto } from '../dto/dimensionless-result.dto';
import { BodyGeometryInputDto } from '../dto/body-geometry-input.dto';
import { BodyGeometryResultDto } from '../dto/body-geometry-result.dto';
import { ReynoldsInputDto } from '../dto/reynolds-input.dto';
import { PrandtlInputDto } from '../dto/prandtl-input.dto';
import { GrashofInputDto } from '../dto/grashof-input.dto';
import { RayleighInputDto } from '../dto/rayleigh-input.dto';
import { HeatTransferCoefficientDto } from '../dto/heat-transfer-coefficient.dto';
import { ScalarDimensionlessResultDto } from '../dto/scalar-dimensionless-result.dto';
import { DimensionlessNumbersService } from '../services/dimensionless-numbers.service';
import { Species } from '../enums/species.enum';

// ── Controller ───────────────────────────────────────────────────────────────

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsController {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly diffusion: DiffusionService,
    private readonly dimensionless: DimensionlessNumbersService,
    private readonly calc: DimensionlessCalculationService,
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

  // ── Individual dimensionless numbers (Mode B: species + T) ───────────

  @Post('dimensionless/reynolds')
  @ApiOperation({ summary: 'Re = ρ·w·L / μ — fluid resolved from species + T; w_m_s required in fluid' })
  calcReynolds(@Body() dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
    return this.calc.reynolds(dto);
  }

  @Post('dimensionless/prandtl')
  @ApiOperation({ summary: 'Pr = μ·Cp / λ — fluid resolved from species + T' })
  calcPrandtl(@Body() dto: PrandtlInputDto): ScalarDimensionlessResultDto {
    return this.calc.prandtl(dto);
  }

  @Post('dimensionless/grashof')
  @ApiOperation({ summary: 'Gr = g·β·ΔT·L³ / ν² — fluid resolved from species + T' })
  calcGrashof(@Body() dto: GrashofInputDto): ScalarDimensionlessResultDto {
    return this.calc.grashof(dto);
  }

  @Post('dimensionless/rayleigh')
  @ApiOperation({ summary: 'Ra = Gr·Pr — fluid resolved from species + T' })
  calcRayleigh(@Body() dto: RayleighInputDto): ScalarDimensionlessResultDto {
    return this.calc.rayleigh(dto);
  }

  // ── Nusselt + full correlation set ────────────────────────────────────

  @Post('dimensionless/nusselt')
  @ApiOperation({ summary: 'Nu + h — Nusselt number via correlation; fluid resolved from species + T' })
  calcNusselt(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    return this.calc.nusselt(dto);
  }

  // ── h from known Nu ──────────────────────────────────────────────────

  @Post('dimensionless/htc')
  @ApiOperation({ summary: 'h = Nu·λ / L — convective heat transfer coefficient from a known Nusselt number' })
  calcHTC(@Body() dto: HeatTransferCoefficientDto): ScalarDimensionlessResultDto {
    const L = this.dimensionless.characteristicLength(dto.geometry, dto.dims);
    return {
      value: this.dimensionless.htc(dto.Nu, dto.lambda, L),
      symbol: 'h [W/(m²·K)]', L_m: L,
    };
  }

  // ── Full dimensionless number set + Nu correlation ────────────────────

  @Post('dimensionless')
  @ApiOperation({ summary: 'Re, Pr, Gr, Ra, Nu, h — full set for any flow geometry (Mode B: species + T)' })
  calcDimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    return this.calc.nusselt(dto);
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
}
