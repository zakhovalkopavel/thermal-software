import { Controller, Post, Body } from '@nestjs/common';
import { RecuperatorService } from '../services/recuperator.service';
import { RecuperatorInputDto } from '../dto/recuperator-input.dto';
import { RecuperatorResultDto } from '../dto/recuperator-result.dto';

@Controller('recuperator')
export class RecuperatorController {
  constructor(private readonly recuperatorService: RecuperatorService) {}

  @Post('calculate')
  calculate(@Body() dto: RecuperatorInputDto): RecuperatorResultDto {
    return this.recuperatorService.calculate(dto);
  }
}
