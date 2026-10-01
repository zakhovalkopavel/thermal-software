import { ApiProperty } from '@nestjs/swagger';
import { ConfidenceLevel, ViscosityModelType } from '../../../enums/viscosity-model.enum';

export class GlassViscosityMetadataDto {
  @ApiProperty({ type: String, format: 'date-time' })
  calculatedAt: Date;

  @ApiProperty({ enum: ViscosityModelType })
  modelType: ViscosityModelType;

  @ApiProperty({ example: 'ASTM_C965_96' })
  standard: string;

  @ApiProperty({ enum: ConfidenceLevel })
  confidence: ConfidenceLevel;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  version: string;
}
