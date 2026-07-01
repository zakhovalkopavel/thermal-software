import { Controller, Post, Body } from '@nestjs/common';
import { CombustionService } from '../services/combustion.service';
import { CombustionInputDto } from '../dto/combustion-input.dto';
import { CombustionResultDto } from '../dto/combustion-result.dto';

@Controller('combustion')
export class CombustionController {
  constructor(private readonly combustionService: CombustionService) {}

  @Post('calculate')
  calculate(@Body() dto: CombustionInputDto): CombustionResultDto {
    return this.combustionService.calculate(dto);
  }
}
