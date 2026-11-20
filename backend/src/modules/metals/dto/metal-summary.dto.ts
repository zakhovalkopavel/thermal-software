import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemperatureRangeDto } from '../../../common/thermal/dto/temperature-range.dto';

export class MetalSummaryDto {
  @ApiProperty({ example: 'aisi_304' })
  materialId: string;

  @ApiProperty({ example: 'AISI 304 stainless steel' })
  name: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ example: 'steel' })
  group?: string;

  @ApiPropertyOptional({ example: 'stainless' })
  family?: string;

  @ApiPropertyOptional({ type: [String] })
  availableProperties?: string[];

  @ApiPropertyOptional()
  hasDonorFill?: boolean;

  @ApiPropertyOptional({
    type: TemperatureRangeDto,
    description: 'Emissivity validity range [K] when ε is defined',
  })
  emissivityRange_K?: TemperatureRangeDto;
}
