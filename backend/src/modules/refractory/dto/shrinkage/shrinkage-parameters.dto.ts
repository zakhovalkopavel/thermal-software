import { ApiProperty } from '@nestjs/swagger';

const CEMENT_TYPES = ['PC', 'CAC', 'gypsum', 'generic'];

export class ShrinkageParametersDto {
  @ApiProperty()
  waterCementRatio: number;

  @ApiProperty()
  cementContent: number;

  @ApiProperty({ enum: CEMENT_TYPES })
  cementType: string;
}
