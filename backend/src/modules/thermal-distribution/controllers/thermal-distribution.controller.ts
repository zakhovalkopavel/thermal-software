import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThermalDistributionService } from '../services/thermal-distribution.service';
import { ProfileRequestDto } from '../dto/profile-request.dto';
import { ProfileAtDepthsRequestDto } from '../dto/profile-at-depths-request.dto';
import { TemperatureAtDepthResultDto } from '../dto/temperature-at-depth-result.dto';
import { TemperatureProfileResultDto } from '../dto/temperature-profile-result.dto';
import { AverageTemperatureResultDto } from '../dto/average-temperature-result.dto';
import { ThermalCriteriaDto } from '../dto/thermal-criteria.dto';

@ApiTags('thermal-distribution')
@Controller('thermal-distribution')
export class ThermalDistributionController {
  constructor(private readonly service: ThermalDistributionService) {}

  // ── Criteria ────────────────────────────────────────────────────────────────

  @Post('criteria')
  @ApiOperation({ summary: 'Compute Bi, Fo, Rdist, Rbi for given configuration' })
  @ApiBody({ type: ProfileRequestDto })
  @ApiCreatedResponse({ type: ThermalCriteriaDto })
  computeCriteria(@Body() dto: ProfileRequestDto): ThermalCriteriaDto {
    return this.service.computeCriteria(this.service.toProfileOptions(dto));
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
  @ApiCreatedResponse({ type: TemperatureAtDepthResultDto })
  temperatureAtDepth(
    @Body() dto: ProfileRequestDto & { relDepth?: number },
  ): TemperatureAtDepthResultDto {
    const opts = this.service.toProfileOptions(dto);
    const relDepth = (dto as { relDepth?: number }).relDepth ?? 0;
    const temperature = this.service.temperatureAtDepth(relDepth, opts);
    const criteria    = this.service.computeCriteria(opts);
    return { temperature, criteria };
  }

  // ── Temperature profile ─────────────────────────────────────────────────────

  @Post('temperature/profile')
  @ApiOperation({ summary: 'Temperature distribution over an array of normalised depths' })
  @ApiBody({ type: ProfileAtDepthsRequestDto })
  @ApiCreatedResponse({ type: TemperatureProfileResultDto })
  temperatureProfile(@Body() dto: ProfileAtDepthsRequestDto): TemperatureProfileResultDto {
    const opts = this.service.toProfileOptions(dto);
    const temperatures = this.service.temperatureProfile(dto.relativeDepths, opts);
    const criteria     = this.service.computeCriteria(opts);
    return { temperatures, criteria };
  }

  // ── Average temperature ─────────────────────────────────────────────────────

  @Post('temperature/average')
  @ApiOperation({ summary: 'Volume-average temperature T̄(τ)' })
  @ApiBody({ type: ProfileRequestDto })
  @ApiCreatedResponse({ type: AverageTemperatureResultDto })
  averageTemperature(@Body() dto: ProfileRequestDto): AverageTemperatureResultDto {
    const opts = this.service.toProfileOptions(dto);
    const temperature = this.service.averageTemperature(opts);
    const criteria    = this.service.computeCriteria(opts);
    return { temperature, criteria };
  }
}
