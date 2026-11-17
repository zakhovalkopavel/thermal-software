import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { STANDARD_CONDITIONS } from '../../../common/thermal';

export class CompoundGasBoundsQueryDto {
  @ApiPropertyOptional({
    description: `Pressure [Pa] used to evaluate Tb(P); default ${STANDARD_CONDITIONS.PRESSURE_PA}`,
    example: STANDARD_CONDITIONS.PRESSURE_PA,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  P_Pa?: number;
}
