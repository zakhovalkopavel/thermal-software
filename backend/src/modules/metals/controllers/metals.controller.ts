import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetalThermalService } from '../services/metal-thermal.service';
import { MetalThermalQueryDto } from '../dto/metal-thermal-query.dto';
import { MetalThermalResultDto } from '../dto/metal-thermal-result.dto';
import { MetalSummaryDto } from '../dto/metal-summary.dto';

@ApiTags('metals')
@Controller('metals')
export class MetalsController {
  constructor(private readonly metalThermalService: MetalThermalService) {}

  @Get('list')
  @ApiTags('materials')
  @ApiOperation({
    summary: 'Catalogue of metal grades (poly overrides + synthesized ASM alloys)',
  })
  @ApiOkResponse({ type: [MetalSummaryDto] })
  listMaterials(): MetalSummaryDto[] {
    return this.metalThermalService.listMaterials();
  }

  @Get('thermal-properties')
  @ApiOperation({
    summary: 'Thermal properties for a metal material',
    description:
      'Poly grades (`aisi_304`, `mild_steel`): λ and ε from cubic polynomials. '
      + 'Synthesized alloys: λ / Cp / CTE / ρ from table cubic splines '
      + '(reject outside tabulated range); donor provenance when a series was filled. '
      + 'Optional `lambdaModel=kCT56`: Chebyshev F(C,T) carbon-steel alternative '
      + 'using alloy composition.C (domain C∈[0.05,1.1] wt%, T∈[0,815] °C).',
  })
  @ApiOkResponse({ type: MetalThermalResultDto })
  getThermalProperties(@Query() dto: MetalThermalQueryDto): MetalThermalResultDto {
    return this.metalThermalService.getThermalProperties(dto);
  }
}
