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
  @ApiOperation({ summary: 'Catalogue of metal grades with their emissivity validity range' })
  @ApiOkResponse({ type: [MetalSummaryDto] })
  listMaterials(): MetalSummaryDto[] {
    return this.metalThermalService.listMaterials();
  }

  @Get('thermal-properties')
  @ApiOperation({
    summary: 'λ(T) and ε(T) for a metal material',
    description:
      'Returns thermal conductivity [W/(m·K)] and emissivity at the given temperature. ' +
      'AISI 304 λ uses T in Kelvin; mild steel λ uses T in Celsius internally.',
  })
  getThermalProperties(@Query() dto: MetalThermalQueryDto): MetalThermalResultDto {
    return this.metalThermalService.getThermalProperties(dto);
  }
}
