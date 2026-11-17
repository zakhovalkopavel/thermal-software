import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DimensionlessNumbersService } from '../services/dimensionless-numbers.service';
import { BodyGeometryInputDto } from '../dto/geometry/body-geometry-input.dto';
import { BodyGeometryResultDto } from '../dto/geometry/body-geometry-result.dto';

@ApiTags('thermodynamics')
@Controller('thermodynamics')
export class ThermodynamicsBodyGeometryController {
  constructor(
    private readonly dimensionless: DimensionlessNumbersService,
  ) {}

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
  @ApiCreatedResponse({ type: BodyGeometryResultDto })
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
