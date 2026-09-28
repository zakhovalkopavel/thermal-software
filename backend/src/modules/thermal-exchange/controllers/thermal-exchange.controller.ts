import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MultilayerWallService } from '../services/multilayer-wall.service';
import { MultilayerWallInputDto } from '../dto/multilayer-wall-input.dto';
import { MultilayerWallResultDto } from '../dto/multilayer-wall-result.dto';

@ApiTags('thermal-exchange')
@Controller('thermal-exchange')
export class ThermalExchangeController {
  constructor(private readonly multilayerWallService: MultilayerWallService) {}

  @Post('multilayer-wall')
  @ApiOperation({
    summary: 'Heat flux and temperature profile through a multilayer furnace wall',
    description:
      'Binary-search solver: iterates on the inner surface temperature until inner and outer heat ' +
      'fluxes converge. Supports flat, cylindrical and spherical geometries. ' +
      'Layers are listed inside → outside; each may be a refractory or metal material.',
  })
  @ApiBody({
    type: MultilayerWallInputDto,
    examples: {
      chamotteFlatWall: {
        summary: 'Flat furnace wall — 200 mm chamotte + 100 mm lightweight insulation',
        value: {
          geometry: 'flat',
          a_m: 0.5,
          b_m: 2.0,
          layers: [
            { material: 'chamotte_solid', thicknessMm: 200 },
            { material: 'chamotte_600',   thicknessMm: 100 },
          ],
          w_ms: 4,
          composition: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
          mPerSecond_kgs: 0.5,
          tFlame_K: 1473,
          tAmbient_K: 293,
          innerEmissivity: 0.85,
        },
      },
      steelCylindricalShell: {
        summary: 'Cylindrical furnace shell — mild steel + basalt fibre insulation',
        value: {
          geometry: 'cylinder',
          a_m: 0.6,
          b_m: 3.0,
          layers: [
            { material: 'mild_steel',       thicknessMm: 10 },
            { material: 'basalt_fiber_mat', thicknessMm: 80 },
          ],
          w_ms: 3,
          composition: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
          mPerSecond_kgs: 0.3,
          tFlame_K: 1200,
          tAmbient_K: 293,
          innerEmissivity: 0.6,
        },
      },
    },
  })
  calculateWall(@Body() dto: MultilayerWallInputDto): MultilayerWallResultDto {
    return this.multilayerWallService.calculate(dto);
  }
}
