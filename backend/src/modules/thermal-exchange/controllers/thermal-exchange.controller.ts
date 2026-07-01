import { Controller, Post, Body } from '@nestjs/common';
import { MultilayerWallService } from '../services/multilayer-wall.service';
import { MultilayerWallInputDto } from '../dto/multilayer-wall-input.dto';
import { MultilayerWallResultDto } from '../dto/multilayer-wall-result.dto';

@Controller('thermal-exchange')
export class ThermalExchangeController {
  constructor(private readonly multilayerWallService: MultilayerWallService) {}

  @Post('multilayer-wall')
  calculateWall(@Body() dto: MultilayerWallInputDto): MultilayerWallResultDto {
    return this.multilayerWallService.calculate(dto);
  }
}
