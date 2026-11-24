import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DimensionlessCalculationService } from '../services/dimensionless-calculation.service';
import { DimensionlessInputDto } from '../dto/dimensionless/dimensionless-input.dto';
import { DimensionlessResultDto } from '../dto/dimensionless/dimensionless-result.dto';
import { ReynoldsInputDto } from '../dto/dimensionless/reynolds-input.dto';
import { PrandtlInputDto } from '../dto/dimensionless/prandtl-input.dto';
import { GrashofInputDto } from '../dto/dimensionless/grashof-input.dto';
import { RayleighInputDto } from '../dto/dimensionless/rayleigh-input.dto';
import { ScalarDimensionlessResultDto } from '../dto/dimensionless/scalar-dimensionless-result.dto';

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsController {
  constructor(
    private readonly calc: DimensionlessCalculationService,
  ) {}

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
  @ApiCreatedResponse({ type: ScalarDimensionlessResultDto })
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
  @ApiCreatedResponse({ type: ScalarDimensionlessResultDto })
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
  @ApiCreatedResponse({ type: ScalarDimensionlessResultDto })
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
  @ApiCreatedResponse({ type: ScalarDimensionlessResultDto })
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
  @ApiCreatedResponse({ type: DimensionlessResultDto })
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
  @ApiCreatedResponse({ type: DimensionlessResultDto })
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
  @ApiCreatedResponse({ type: DimensionlessResultDto })
  calcDimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto {
    return this.calc.nusselt(dto);
  }

}
