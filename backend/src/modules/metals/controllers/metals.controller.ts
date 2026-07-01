import { Controller, Get, Query } from '@nestjs/common';
import { MetalThermalService } from '../services/metal-thermal.service';
import { MetalThermalQueryDto } from '../dto/metal-thermal-query.dto';
import { MetalThermalResultDto } from '../dto/metal-thermal-result.dto';

@Controller('metals')
export class MetalsController {
  constructor(private readonly metalThermalService: MetalThermalService) {}

  @Get('thermal-properties')
  getThermalProperties(@Query() dto: MetalThermalQueryDto): MetalThermalResultDto {
    return this.metalThermalService.getThermalProperties(dto);
  }
}
