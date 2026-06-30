import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThermalDistributionService } from '../services/thermal-distribution.service';
import {
  ProfileRequestDto,
  ProfileAtDepthsRequestDto,
  TemperatureAtDepthResultDto,
  TemperatureProfileResultDto,
  AverageTemperatureResultDto,
  ThermalCriteriaDto,
} from '../dto/profile-request.dto';
import type { ProfileOptions } from '../type/profile-options.type';
import type { AverageOptions } from '../type/average-options.type';

@ApiTags('thermal-distribution')
@Controller('thermal-distribution')
export class ThermalDistributionController {
  constructor(private readonly service: ThermalDistributionService) {}

  // ── Criteria ────────────────────────────────────────────────────────────────

  @Post('criteria')
  @ApiOperation({ summary: 'Compute Bi, Fo, Rdist, Rbi for given configuration' })
  @ApiBody({ type: ProfileRequestDto })
  computeCriteria(@Body() dto: ProfileRequestDto): ThermalCriteriaDto {
    return this.service.computeCriteria(toOpts(dto));
  }

  // ── Temperature at depth ────────────────────────────────────────────────────

  @Post('temperature/at-depth')
  @ApiOperation({
    summary: 'Temperature at a single normalised depth (0 = centre, 1 = surface)',
  })
  @ApiBody({
    type: ProfileRequestDto,
    examples: {
      cylinder_bc3: {
        summary: 'Steel cylinder quenched in oil',
        value: {
          bcType: 'BC_III', Tc: 20, T0: 850, tau: 60,
          alpha: 1200, lambda: 45, thermalDiffusivity: 1.2e-5,
          shape: { geometry: 'cylinder', radius: 0.05 },
          avg: { mode: 'series' },
        },
      },
    },
  })
  temperatureAtDepth(
    @Body() dto: ProfileRequestDto & { relDepth?: number },
  ): TemperatureAtDepthResultDto {
    const opts = toOpts(dto);
    const relDepth = (dto as any).relDepth ?? 0;
    const temperature = this.service.temperatureAtDepth(relDepth, opts);
    const criteria    = this.service.computeCriteria(opts);
    return { temperature, criteria };
  }

  // ── Temperature profile ─────────────────────────────────────────────────────

  @Post('temperature/profile')
  @ApiOperation({ summary: 'Temperature distribution over an array of normalised depths' })
  @ApiBody({ type: ProfileAtDepthsRequestDto })
  temperatureProfile(@Body() dto: ProfileAtDepthsRequestDto): TemperatureProfileResultDto {
    const opts = toOpts(dto);
    const temperatures = this.service.temperatureProfile(dto.relativeDepths, opts);
    const criteria     = this.service.computeCriteria(opts);
    return { temperatures, criteria };
  }

  // ── Average temperature ─────────────────────────────────────────────────────

  @Post('temperature/average')
  @ApiOperation({ summary: 'Volume-average temperature T̄(τ)' })
  @ApiBody({ type: ProfileRequestDto })
  averageTemperature(@Body() dto: ProfileRequestDto): AverageTemperatureResultDto {
    const opts = toOpts(dto);
    const temperature = this.service.averageTemperature(opts);
    const criteria    = this.service.computeCriteria(opts);
    return { temperature, criteria };
  }
}

// ── DTO → ProfileOptions adapter ───────────────────────────────────────────────

function toOpts(dto: ProfileRequestDto): ProfileOptions {
  const avgDto = dto.avg;
  const avg: AverageOptions = {
    mode:        avgDto?.mode        ?? 'series',
    gaussNodes:  avgDto?.gaussNodes  ?? 32,
    simpsonNodes: avgDto?.simpsonNodes ?? 128,
  };
  return {
    bcType:            dto.bcType,
    Tc:                dto.Tc,
    T0:                dto.T0,
    tau:               dto.tau,
    alpha:             dto.alpha,
    lambda:            dto.lambda,
    thermalDiffusivity: dto.thermalDiffusivity,
    shape:             dto.shape,
    rDistMode:         dto.rDistMode,
    initialProfile:    dto.initialProfile,
    T0Ctr:             dto.T0Ctr,
    T0Surf:            dto.T0Surf,
    biPerAxis:         dto.biPerAxis,
    biCylinder:        dto.biCylinder,
    seriesTerms:       dto.seriesTerms,
    avg,
  };
}
