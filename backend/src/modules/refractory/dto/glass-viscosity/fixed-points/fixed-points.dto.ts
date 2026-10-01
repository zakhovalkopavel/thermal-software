import { ApiProperty } from '@nestjs/swagger';
import { FixedPointSpansDto } from './fixed-point-spans.dto';

export class FixedPointsDto {
  @ApiProperty({ description: 'η = 10 Pa·s' })
  meltingPoint_C: number;

  @ApiProperty({ description: 'η = 10³ Pa·s' })
  workingPoint_C: number;

  @ApiProperty({ description: 'η = 10⁴ Pa·s' })
  flowPoint_C: number;

  @ApiProperty({ description: 'η = 10^6.6 Pa·s' })
  softeningPoint_C: number;

  @ApiProperty({ description: 'η = 10¹² Pa·s' })
  annealingPoint_C: number;

  @ApiProperty({ description: 'η = 10^13.5 Pa·s' })
  strainPoint_C: number;

  @ApiProperty({ type: FixedPointSpansDto, required: false })
  spans?: FixedPointSpansDto;
}
