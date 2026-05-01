import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
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
  @ApiBody({
    type: GasMixtureInputDto,
    examples: {
      air: {
        summary: 'Dry air at 800 K',
        value: { composition: { N2: 0.79, O2: 0.21 }, T_K: 800 },
      },
      flueGas: {
        summary: 'Flue gas at 1200 K, 1 atm',
        value: {
          composition: { N2: 0.72, CO2: 0.12, H2O: 0.10, O2: 0.06 },
          T_K: 1200,
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Compare all Cp approximations for a species at given T',
    description:
      'Returns one entry per registered equation type (polynomial, Aly-Lee, NASA-7, NASA-9, etc.) ' +
      'so you can compare accuracy across approximation methods at the same temperature.',
  })
  @ApiQuery({
    name: 'species',
    enum: Species,
    description: 'Gas species to compare. Note: "air" is a mixture alias — use GET /thermodynamics/fluid/cp instead.',
    example: Species.N2,
  })
  @ApiQuery({
    name: 'T_K',
    type: Number,
    description: 'Temperature [K] at which to evaluate Cp. Valid range depends on species data (typically 200–6000 K).',
    example: 1000,
  })
  cpCompare(
    @Query('species') species: Species,
    @Query('T_K') T_K: string,
  ): CpComparisonEntryDto[] {
    return this.gasProps.cpCompare(species, parseFloat(T_K));
  }

  // ── Individual dimensionless numbers ─────────────────────────────────

  @Post('dimensionless/reynolds')
  @ApiOperation({
    summary: 'Re = ρ·w·L / μ',
    description:
      'Reynolds number for forced flow. Characteristic length L is derived from `geometry` + `dimensions`. ' +
      'Fluid properties (ρ, μ) are resolved from the named fluid + temperature.',
  })
  @ApiBody({
    type: ReynoldsInputDto,
    examples: {
      pipeAir: {
        summary: 'Air in circular pipe, D = 50 mm, w = 3 m/s, T = 500 K',
        value: {
          geometry: 'pipe_circular',
          dimensions: { a: 0.05 },
          fluid: 'air',
          T_fluid_K: 500,
          w_m_s: 3,
        },
      },
      sphereN2: {
        summary: 'N₂ past a sphere, D = 20 mm, w = 20 m/s, T = 800 K',
        value: {
          geometry: 'sphere_forced',
          dimensions: { a: 0.02 },
          fluid: 'N2',
          T_fluid_K: 800,
          w_m_s: 20,
        },
      },
      flatPlateMixture: {
        summary: 'Custom gas mixture on flat plate, L = 0.5 m, w = 5 m/s',
        value: {
          geometry: 'flat_plate',
          dimensions: { c: 0.5 },
          fluid: 'gas_mix',
          composition: { N2: 0.72, CO2: 0.12, H2O: 0.10, O2: 0.06 },
          T_fluid_K: 1200,
          w_m_s: 5,
        },
      },
    },
  })
  calcReynolds(@Body() dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
    return this.calc.reynolds(dto);
  }

  @Post('dimensionless/prandtl')
  @ApiOperation({
    summary: 'Pr = μ·Cp / λ',
    description:
      'Prandtl number is a pure thermophysical property of the fluid. ' +
      'It does not depend on geometry or flow conditions.',
  })
  @ApiBody({
    type: PrandtlInputDto,
    examples: {
      co2: {
        summary: 'CO₂ at 800 K',
        value: { fluid: 'CO2', T_fluid_K: 800 },
      },
      air300: {
        summary: 'Air at room temperature',
        value: { fluid: 'air', T_fluid_K: 300 },
      },
    },
  })
  calcPrandtl(@Body() dto: PrandtlInputDto): ScalarDimensionlessResultDto {
    return this.calc.prandtl(dto);
  }

  @Post('dimensionless/grashof')
  @ApiOperation({
    summary: 'Gr = g·β·ΔT·L³ / ν²',
    description:
      'Grashof number for natural convection (ideal-gas approximation: β = 2/(T_hot + T_cold)). ' +
      'Fluid properties are evaluated at T_fluid_K (defaults to T_cold_K when absent).',
  })
  @ApiBody({
    type: GrashofInputDto,
    examples: {
      verticalPlate: {
        summary: 'Air on vertical plate H = 0.4 m, ΔT = 300 K',
        value: {
          T_hot_K: 600,
          T_cold_K: 300,
          geometry: 'vertical_plate',
          dimensions: { b: 0.4 },
          fluid: 'air',
        },
      },
    },
  })
  calcGrashof(@Body() dto: GrashofInputDto): ScalarDimensionlessResultDto {
    return this.calc.grashof(dto);
  }

  @Post('dimensionless/rayleigh')
  @ApiOperation({
    summary: 'Ra = Gr · Pr',
    description: 'Rayleigh number for natural convection. Ra = Gr × Pr; inputs identical to Grashof.',
  })
  @ApiBody({
    type: RayleighInputDto,
    examples: {
      horizontalCylinder: {
        summary: 'N₂ on horizontal cylinder D = 30 mm, surface 500 K, bulk 300 K',
        value: {
          T_hot_K: 500,
          T_cold_K: 300,
          geometry: 'horizontal_cylinder',
          dimensions: { a: 0.03 },
          fluid: 'N2',
        },
      },
    },
  })
  calcRayleigh(@Body() dto: RayleighInputDto): ScalarDimensionlessResultDto {
    return this.calc.rayleigh(dto);
  }

  // ── Nusselt + full correlation set ────────────────────────────────────

  @Post('dimensionless/nusselt')
  @ApiOperation({
    summary: 'Nu + h — Nusselt number via correlation',
    description:
      'Resolves Re, Pr, Gr, Ra from the fluid state and geometry, selects the best ' +
      'applicable correlation, and returns Nu and h. Set `T_surface_K` to enable ' +
      'natural/mixed convection (Gr/Ra). Set `compareAll: true` for all correlations.',
  })
  @ApiBody({
    type: DimensionlessInputDto,
    examples: {
      pipeTurbulent: {
        summary: 'Air in circular pipe — forced turbulent convection',
        value: {
          geometry: 'pipe_circular',
          dimensions: { a: 0.05 },
          fluid: 'air',
          T_fluid_K: 500,
          w_m_s: 15,
        },
      },
      sphereNatural: {
        summary: 'N₂ past a sphere — natural convection',
        value: {
          geometry: 'sphere_natural',
          dimensions: { a: 0.05 },
          fluid: 'N2',
          T_fluid_K: 300,
          T_surface_K: 600,
        },
      },
      verticalPlateNatural: {
        summary: 'Air on vertical plate H = 0.4 m — natural convection',
        value: {
          geometry: 'vertical_plate',
          dimensions: { b: 0.4 },
          fluid: 'air',
          T_fluid_K: 300,
          T_surface_K: 600,
        },
      },
    },
  })
  calcNusselt(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    return this.calc.nusselt(dto);
  }

  // ── h from full fluid state ──────────────────────────────────────────

  @Post('dimensionless/htc')
  @ApiOperation({
    summary: 'h [W/(m²·K)] — convective heat transfer coefficient',
    description:
      'Computes Nu internally (same algorithm as /nusselt) then returns h = Nu·λ/L. ' +
      'Accepts the same input format as /dimensionless/nusselt.',
  })
  @ApiBody({
    type: DimensionlessInputDto,
    examples: {
      pipeTurbulent: {
        summary: 'Air in circular pipe — turbulent forced convection, T_fluid = 500 K',
        value: {
          geometry: 'pipe_circular',
          dimensions: { a: 0.05 },
          fluid: 'air',
          T_fluid_K: 500,
          w_m_s: 15,
        },
      },
      sphereNatural: {
        summary: 'CO₂ past a sphere — natural convection, T_surface = 800 K',
        value: {
          geometry: 'sphere_natural',
          dimensions: { a: 0.04 },
          fluid: 'CO2',
          T_fluid_K: 400,
          T_surface_K: 800,
        },
      },
    },
  })
  calcHTC(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    return this.calc.nusselt(dto);
  }

  // ── Full dimensionless number set + Nu correlation ────────────────────

  @Post('dimensionless')
  @ApiOperation({
    summary: 'Re, Pr, Gr, Ra, Nu, h — full dimensionless set',
    description:
      'Resolves all dimensionless numbers and selects the best Nusselt correlation. ' +
      'Equivalent to /dimensionless/nusselt but documented as the primary full-set endpoint. ' +
      'Supply `T_surface_K` for natural/mixed convection (Gr/Ra). ' +
      'Supply `g_m_s2` to override standard gravity.',
  })
  @ApiBody({
    type: DimensionlessInputDto,
    examples: {
      pipeForcedAir: {
        summary: 'Air in circular pipe — forced convection',
        value: {
          geometry: 'pipe_circular',
          dimensions: { a: 0.05 },
          fluid: 'air',
          T_fluid_K: 500,
          w_m_s: 10,
        },
      },
      verticalPlateNatural: {
        summary: 'N₂ on vertical plate — natural convection',
        value: {
          geometry: 'vertical_plate',
          dimensions: { b: 0.5 },
          fluid: 'N2',
          T_fluid_K: 300,
          T_surface_K: 700,
        },
      },
      customMixturePipe: {
        summary: 'Flue gas in pipe — mixed regime',
        value: {
          geometry: 'pipe_circular',
          dimensions: { a: 0.08 },
          fluid: 'gas_mix',
          composition: { N2: 0.72, CO2: 0.12, H2O: 0.10, O2: 0.06 },
          T_fluid_K: 1100,
          T_surface_K: 1400,
          w_m_s: 4,
        },
      },
    },
  })
  calcDimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    return this.calc.nusselt(dto);
  }

  // ── Body geometry ─────────────────────────────────────────────────────

  @Post('body-geometry')
  @ApiOperation({
    summary: 'Surface area, volume, mean beam length for any body shape',
    description:
      'Returns geometric properties of the body. ' +
      'Required `dimensions` fields depend on `geometry` (see GET /thermodynamics/geometry/list).',
  })
  @ApiBody({
    type: BodyGeometryInputDto,
    examples: {
      sphere: {
        summary: 'Sphere, D = 0.1 m',
        value: { geometry: 'sphere', dimensions: { a: 0.1 } },
      },
      cube: {
        summary: 'Cube, side = 0.2 m',
        value: { geometry: 'cube', dimensions: { a: 0.2 } },
      },
      cylinder: {
        summary: 'Cylinder, D = 0.1 m, H = 0.3 m',
        value: { geometry: 'cylinder', dimensions: { a: 0.1, b: 0.3 } },
      },
    },
  })
  bodyGeometry(@Body() dto: BodyGeometryInputDto): BodyGeometryResultDto {
    const { geometry, dimensions, h = 0 } = dto;
    return {
      surface:              this.dimensionless.bodyArea(geometry, dimensions, h),
      volume:               this.dimensionless.bodyVolume(geometry, dimensions),
      meanBeamLength:       this.dimensionless.meanBeamLength(geometry, dimensions),
      characteristicLength: Math.max(dimensions.a ?? 0, dimensions.b ?? 0, dimensions.c ?? 0),
    };
  }
}
